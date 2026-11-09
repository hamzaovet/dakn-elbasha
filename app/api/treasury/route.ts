import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const period = searchParams.get("period") || "TODAY"; // TODAY, YESTERDAY, WEEK, MONTH, ALL

    let dateFilter: any = {};
    const now = new Date();

    if (period === "TODAY") {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      dateFilter = { gte: start };
    } else if (period === "YESTERDAY") {
      const start = new Date(now);
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(0, 0, 0, 0);
      dateFilter = { gte: start, lt: end };
    } else if (period === "WEEK") {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      dateFilter = { gte: start };
    } else if (period === "MONTH") {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      dateFilter = { gte: start };
    }

    const branchWhere = branchId && branchId !== "ALL" ? { branchId } : {};

    // 1. Completed Tickets (Revenue from Haircuts + Retail Products)
    const tickets = await prisma.ticket.findMany({
      where: {
        ...branchWhere,
        status: "COMPLETED",
        ...(period !== "ALL" && {
          OR: [
            { endTime: dateFilter },
            { createdAt: dateFilter },
          ],
        }),
      },
      include: {
        specialist: { select: { id: true, name: true, chairNumber: true } },
        branch: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // 2. Specialist Ledgers (Commissions, Advances, Payouts)
    const ledgers = await prisma.specialistLedger.findMany({
      where: {
        ...branchWhere,
        ...(period !== "ALL" && { date: dateFilter }),
      },
      include: {
        specialist: { select: { id: true, name: true, chairNumber: true, commissionRate: true } },
        branch: { select: { id: true, name: true } },
      },
      orderBy: { date: "desc" },
    });

    // 3. Treasury Expenses
    const expenses = await prisma.treasuryExpense.findMany({
      where: {
        ...branchWhere,
        ...(period !== "ALL" && { date: dateFilter }),
      },
      include: {
        branch: { select: { id: true, name: true } },
      },
      orderBy: { date: "desc" },
    });

    // 4. Closed Shifts
    const shifts = await prisma.cashShift.findMany({
      where: {
        ...branchWhere,
        ...(period !== "ALL" && { closedAt: dateFilter }),
      },
      include: {
        branch: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    // Calculations
    let servicesRevenue = 0;
    let retailRevenue = 0;
    let tipsTotal = 0;
    let discountsTotal = 0;

    let cashRevenue = 0;
    let visaRevenue = 0;
    let instapayRevenue = 0;
    let vodafoneRevenue = 0;

    for (const t of tickets) {
      servicesRevenue += Number(t.servicesTotal || 0);
      retailRevenue += Number(t.retailTotal || 0);
      tipsTotal += Number(t.tipAmount || 0);
      discountsTotal += Number(t.discount || 0);

      const finalAmt = Number(t.finalAmount || 0);
      switch (t.paymentMethod) {
        case "CASH":
          cashRevenue += finalAmt;
          break;
        case "CARD":
          visaRevenue += finalAmt;
          break;
        case "INSTAPAY":
          instapayRevenue += finalAmt;
          break;
        case "VODAFONE_CASH":
          vodafoneRevenue += finalAmt;
          break;
        default:
          cashRevenue += finalAmt;
      }
    }

    const totalRevenue = servicesRevenue + retailRevenue - discountsTotal + tipsTotal;

    // Outflows
    let specialistPayouts = 0;
    let specialistAdvances = 0;
    let specialistBonuses = 0;
    let specialistDeductions = 0;

    for (const l of ledgers) {
      const amt = Number(l.amount || 0);
      if (l.type === "SALARY_PAYOUT") specialistPayouts += amt;
      else if (l.type === "ADVANCE_WITHDRAWAL") specialistAdvances += amt;
      else if (l.type === "BONUS") specialistBonuses += amt;
      else if (l.type === "DEDUCTION") specialistDeductions += amt;
    }

    let generalExpenses = 0;
    for (const e of expenses) {
      generalExpenses += Number(e.amount || 0);
    }

    const netCashInDrawer = cashRevenue - specialistPayouts - specialistAdvances - generalExpenses;

    // Build unified transactions log
    const transactions: any[] = [];

    // Add tickets
    for (const t of tickets) {
      transactions.push({
        id: `ticket-${t.id}`,
        rawId: t.id,
        date: t.endTime || t.createdAt,
        type: "INCOME_TICKET",
        badge: t.retailTotal > 0 ? "حلاقة + بيع منتجات 🛍️" : "حلاقة وبكجات ✂️",
        title: `تذكرة #${t.ticketNumber} - العميل (${t.customerName})`,
        amount: Number(t.finalAmount || 0),
        paymentMethod: t.paymentMethod,
        isCredit: true,
        specialistName: t.specialist?.name,
        branchName: t.branch?.name,
        recordedBy: t.cashierName || "الكاشير",
        details: {
          servicesTotal: t.servicesTotal,
          retailTotal: t.retailTotal,
          discount: t.discount,
          tip: t.tipAmount,
        },
      });
    }

    // Add specialist ledger events (advances, payouts)
    for (const l of ledgers) {
      if (l.type === "COMMISSION_EARNED") continue; // Commission is internal credit to specialist, not immediate cash out
      const isOut = l.type === "SALARY_PAYOUT" || l.type === "ADVANCE_WITHDRAWAL";
      transactions.push({
        id: `ledger-${l.id}`,
        rawId: l.id,
        date: l.date || l.createdAt,
        type: l.type,
        badge:
          l.type === "SALARY_PAYOUT"
            ? "صرف مستحقات / مرتب 💸"
            : l.type === "ADVANCE_WITHDRAWAL"
            ? "سلفة تحت الحساب 📉"
            : l.type === "BONUS"
            ? "مكافأة 🌟"
            : "خصم / جزاء ⚠️",
        title: `${l.specialist?.name} - ${l.notes || "حركة أجور ومستحقات"}`,
        amount: Number(l.amount || 0),
        paymentMethod: "CASH",
        isCredit: !isOut,
        specialistName: l.specialist?.name,
        branchName: l.branch?.name,
        recordedBy: l.recordedBy,
      });
    }

    // Add expenses
    for (const e of expenses) {
      transactions.push({
        id: `exp-${e.id}`,
        rawId: e.id,
        date: e.date || e.createdAt,
        type: "EXPENSE",
        badge: "مصروفات ونثريات 🧾",
        title: `${e.description} (${e.category})`,
        amount: Number(e.amount || 0),
        paymentMethod: e.paymentMethod,
        isCredit: false,
        recipientName: e.recipientName,
        branchName: e.branch?.name,
        recordedBy: e.recordedBy,
      });
    }

    // Sort transactions by date descending
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      success: true,
      period,
      summary: {
        // Standard keys
        totalRevenue,
        servicesRevenue,
        retailRevenue,
        tipsTotal,
        discountsTotal,
        ticketsCount: tickets.length,
        cashRevenue,
        visaRevenue,
        instapayRevenue,
        vodafoneRevenue,
        specialistPayouts,
        specialistAdvances,
        specialistBonuses,
        generalExpenses,
        netCashInDrawer,

        // Aliases for POS and other components (fixes 0 EGP discrepancy)
        totalSales: totalRevenue,
        servicesTotal: servicesRevenue,
        retailTotal: retailRevenue,
        cashCollected: cashRevenue,
        electronicCollected: visaRevenue + instapayRevenue + vodafoneRevenue,
        advancesPaid: specialistAdvances,
        expensesPaid: generalExpenses,
        netDrawerCash: netCashInDrawer,
      },
      transactions: transactions.slice(0, 150),
      shifts,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { branchId, category, amount, paymentMethod, description, recipientName, recordedBy } = body;

    if (!amount || !description) {
      return NextResponse.json(
        { success: false, error: "المبلغ ووصف المصروف مطلوبان" },
        { status: 400 }
      );
    }

    const expense = await prisma.treasuryExpense.create({
      data: {
        branchId: branchId || null,
        category: category || "OTHER",
        amount: Number(amount),
        paymentMethod: paymentMethod || "CASH",
        description: description.trim(),
        recipientName: recipientName?.trim() || null,
        recordedBy: recordedBy || "الكاشير",
      },
      include: {
        branch: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, expense });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
