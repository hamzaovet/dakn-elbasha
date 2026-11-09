import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");

    const where: any = {};
    if (branchId && branchId !== "ALL") {
      where.branchId = branchId;
    }

    // 1. Fetch previous shifts
    const shifts = await prisma.cashShift.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        branch: { select: { id: true, name: true } },
      },
      take: 50,
    });

    // 2. Find currently open shift for this branch (or latest)
    const openShift = await prisma.cashShift.findFirst({
      where: {
        ...where,
        status: "OPEN",
      },
      orderBy: { createdAt: "desc" },
      include: {
        branch: { select: { id: true, name: true } },
      },
    });

    // 3. Compute live shift metrics since openedAt (or start of today)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const shiftSince = openShift?.openedAt || startOfToday;

    const ticketsWhere: any = {
      status: "COMPLETED",
      endTime: { gte: shiftSince },
    };
    if (branchId && branchId !== "ALL") {
      ticketsWhere.branchId = branchId;
    }

    const completedTickets = await prisma.ticket.findMany({
      where: ticketsWhere,
      include: { specialist: { select: { name: true } } },
    });

    let servicesTotal = 0;
    let retailTotal = 0;
    let cashCollected = 0;
    let visaCollected = 0;
    let instapayCollected = 0;
    let vodafoneCollected = 0;
    let tipsTotal = 0;
    let discountsTotal = 0;

    for (const t of completedTickets) {
      servicesTotal += Number(t.servicesTotal || 0);
      retailTotal += Number(t.retailTotal || 0);
      tipsTotal += Number(t.tipAmount || 0);
      discountsTotal += Number(t.discount || 0);

      const finalAmt = Number(t.finalAmount || 0);
      switch (t.paymentMethod) {
        case "CASH":
          cashCollected += finalAmt;
          break;
        case "CARD":
          visaCollected += finalAmt;
          break;
        case "INSTAPAY":
          instapayCollected += finalAmt;
          break;
        case "VODAFONE_CASH":
          vodafoneCollected += finalAmt;
          break;
        default:
          cashCollected += finalAmt;
      }
    }

    // Cash advances & payouts to specialists from drawer during this shift
    const ledgersWhere: any = {
      date: { gte: shiftSince },
      type: { in: ["ADVANCE_WITHDRAWAL", "SALARY_PAYOUT"] },
    };
    if (branchId && branchId !== "ALL") {
      ledgersWhere.branchId = branchId;
    }

    const advancesList = await prisma.specialistLedger.findMany({
      where: ledgersWhere,
    });
    const advancesPayouts = advancesList.reduce((sum, a) => sum + Number(a.amount || 0), 0);

    // Cash expenses from drawer
    const expensesWhere: any = {
      date: { gte: shiftSince },
      paymentMethod: "CASH",
    };
    if (branchId && branchId !== "ALL") {
      expensesWhere.branchId = branchId;
    }

    const expensesList = await prisma.treasuryExpense.findMany({
      where: expensesWhere,
    });
    const expensesTotal = expensesList.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const expectedCash = cashCollected - advancesPayouts - expensesTotal;

    const liveStats = {
      ticketsCount: completedTickets.length,
      servicesTotal,
      retailTotal,
      tipsTotal,
      discountsTotal,
      totalRevenue: servicesTotal + retailTotal - discountsTotal + tipsTotal,
      cashCollected,
      visaCollected,
      instapayCollected,
      vodafoneCollected,
      advancesPayouts,
      expensesTotal,
      expectedCash,
    };

    return NextResponse.json({
      success: true,
      shifts,
      openShift,
      liveStats,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    // 1. OPEN NEW SHIFT
    if (action === "OPEN") {
      const { branchId, cashierName, openingBalance, notes } = body;
      if (!branchId || !cashierName) {
        return NextResponse.json(
          { success: false, error: "الفرع واسم الكاشير مطلوبان لفتح الوردية" },
          { status: 400 }
        );
      }

      // Check if already an open shift
      const existingOpen = await prisma.cashShift.findFirst({
        where: { branchId, status: "OPEN" },
      });
      if (existingOpen) {
        return NextResponse.json(
          { success: false, error: `يوجد بالفعل وردية مفتوحة برقم #${existingOpen.shiftNumber}` },
          { status: 400 }
        );
      }

      const shiftNumber = `SHIFT-${Math.floor(1000 + Math.random() * 9000)}`;

      const shift = await prisma.cashShift.create({
        data: {
          shiftNumber,
          branchId,
          cashierName: cashierName.trim(),
          notes: notes?.trim() || null,
          status: "OPEN",
        },
        include: {
          branch: { select: { id: true, name: true } },
        },
      });

      return NextResponse.json({ success: true, shift });
    }

    // 2. CLOSE CURRENT SHIFT
    if (action === "CLOSE") {
      const {
        shiftId,
        actualCash,
        handedTo,
        notes,
        expectedCash,
        ticketsCount,
        servicesTotal,
        retailTotal,
        cashCollected,
        visaCollected,
        instapayCollected,
        vodafoneCollected,
        advancesPayouts,
        expensesTotal,
      } = body;

      if (!shiftId || actualCash === undefined || !handedTo) {
        return NextResponse.json(
          { success: false, error: "معرف الوردية والنقدية الفعلية والشخص المستلم للفلوس مطلوبين" },
          { status: 400 }
        );
      }

      const actualCashNum = Number(actualCash);
      const expectedCashNum = Number(expectedCash || 0);
      const difference = actualCashNum - expectedCashNum;

      const closed = await prisma.cashShift.update({
        where: { id: shiftId },
        data: {
          status: "CLOSED",
          closedAt: new Date(),
          ticketsCount: Number(ticketsCount || 0),
          servicesTotal: Number(servicesTotal || 0),
          retailTotal: Number(retailTotal || 0),
          cashCollected: Number(cashCollected || 0),
          visaCollected: Number(visaCollected || 0),
          instapayCollected: Number(instapayCollected || 0),
          vodafoneCollected: Number(vodafoneCollected || 0),
          advancesPayouts: Number(advancesPayouts || 0),
          expensesTotal: Number(expensesTotal || 0),
          expectedCash: expectedCashNum,
          actualCash: actualCashNum,
          difference,
          handedTo: handedTo.trim(),
          notes: notes?.trim() || null,
        },
        include: {
          branch: { select: { id: true, name: true } },
        },
      });

      return NextResponse.json({ success: true, shift: closed });
    }

    return NextResponse.json({ success: false, error: "عملية غير صالحة" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
