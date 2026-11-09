import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const specialistId = searchParams.get("specialistId");
    const branchId = searchParams.get("branchId");

    const where: any = {};
    if (specialistId && specialistId !== "ALL") where.specialistId = specialistId;
    if (branchId && branchId !== "ALL") where.branchId = branchId;

    const ledgers = await prisma.specialistLedger.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        specialist: {
          select: {
            id: true,
            name: true,
            chairNumber: true,
            payType: true,
            commissionRate: true,
            baseSalary: true,
            phone: true,
            photo: true,
          },
        },
        branch: { select: { id: true, name: true } },
      },
      take: 200,
    });

    // Compute balance statement
    let totalCommissions = 0;
    let totalBonuses = 0;
    let totalTips = 0;
    let totalAdvances = 0;
    let totalPayouts = 0;
    let totalDeductions = 0;

    for (const item of ledgers) {
      const amt = Number(item.amount || 0);
      switch (item.type) {
        case "COMMISSION_EARNED":
          totalCommissions += amt;
          break;
        case "BONUS":
          totalBonuses += amt;
          break;
        case "TIP_EARNED":
          totalTips += amt;
          break;
        case "ADVANCE_WITHDRAWAL":
          totalAdvances += amt;
          break;
        case "SALARY_PAYOUT":
          totalPayouts += amt;
          break;
        case "DEDUCTION":
          totalDeductions += amt;
          break;
      }
    }

    const totalCredits = totalCommissions + totalBonuses + totalTips;
    const totalDebits = totalAdvances + totalPayouts + totalDeductions;
    const netDue = totalCredits - totalDebits;

    // Also get per-specialist balances summary
    const allSpecialists = await prisma.specialist.findMany({
      where: branchId && branchId !== "ALL" ? { branchId } : {},
      select: {
        id: true,
        name: true,
        chairNumber: true,
        payType: true,
        commissionRate: true,
        baseSalary: true,
        phone: true,
        photo: true,
        branch: { select: { id: true, name: true } },
      },
    });

    const allLedgersForSummary = await prisma.specialistLedger.findMany({
      where: branchId && branchId !== "ALL" ? { branchId } : {},
      select: { specialistId: true, type: true, amount: true },
    });

    const specialistsSummary = allSpecialists.map((spec) => {
      const specItems = allLedgersForSummary.filter((l) => l.specialistId === spec.id);
      let comm = 0;
      let bonus = 0;
      let adv = 0;
      let payout = 0;
      let ded = 0;

      for (const item of specItems) {
        const amt = Number(item.amount || 0);
        if (item.type === "COMMISSION_EARNED") comm += amt;
        else if (item.type === "BONUS" || item.type === "TIP_EARNED") bonus += amt;
        else if (item.type === "ADVANCE_WITHDRAWAL") adv += amt;
        else if (item.type === "SALARY_PAYOUT") payout += amt;
        else if (item.type === "DEDUCTION") ded += amt;
      }

      const totalEarned = comm + bonus;
      const totalPaidOut = adv + payout + ded;
      const balanceDue = totalEarned - totalPaidOut;

      return {
        specialist: spec,
        totalCommissions: comm,
        totalBonuses: bonus,
        totalAdvances: adv,
        totalPayouts: payout,
        totalDeductions: ded,
        totalEarned,
        totalPaidOut,
        balanceDue,
      };
    });

    return NextResponse.json({
      success: true,
      ledgers,
      statement: {
        totalCommissions,
        totalBonuses,
        totalTips,
        totalAdvances,
        totalPayouts,
        totalDeductions,
        totalCredits,
        totalDebits,
        netDue,
      },
      specialistsSummary,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { specialistId, branchId, type, amount, notes, recordedBy } = body;

    if (!specialistId || !type || amount === undefined) {
      return NextResponse.json(
        { success: false, error: "المتخصص ونوع الحركة والمبلغ مطلوبين" },
        { status: 400 }
      );
    }

    let finalBranchId = branchId;
    if (!finalBranchId) {
      const spec = await prisma.specialist.findUnique({ where: { id: specialistId } });
      if (spec) finalBranchId = spec.branchId;
    }

    const ledger = await prisma.specialistLedger.create({
      data: {
        specialistId,
        branchId: finalBranchId,
        type, // SALARY_PAYOUT, ADVANCE_WITHDRAWAL, BONUS, DEDUCTION, COMMISSION_EARNED, TIP_EARNED
        amount: Number(amount),
        notes: notes?.trim() || null,
        recordedBy: recordedBy || "المالك (Maestro)",
        date: new Date(),
      },
      include: {
        specialist: true,
      },
    });

    return NextResponse.json({ success: true, ledger });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
