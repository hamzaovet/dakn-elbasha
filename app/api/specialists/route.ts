import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const activeOnly = searchParams.get("activeOnly") !== "false";

    const where: any = {};
    if (activeOnly) where.isActive = true;
    if (branchId && branchId !== "ALL") where.branchId = branchId;

    const specialists = await prisma.specialist.findMany({
      where,
      orderBy: { chairNumber: "asc" },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        tickets: {
          where: {
            status: "COMPLETED",
          },
          select: {
            id: true,
            finalAmount: true,
            servicesTotal: true,
            durationMinutes: true,
            createdAt: true,
          },
          take: 50,
          orderBy: { createdAt: "desc" },
        },
        ledgers: {
          take: 20,
          orderBy: { date: "desc" },
        },
      },
    });

    // Compute live performance & financial summaries for each specialist
    const enriched = specialists.map((s) => {
      const completedTickets = s.tickets || [];
      const totalClientsServed = completedTickets.length;
      const totalServicesRevenue = completedTickets.reduce((sum, t) => sum + (t.servicesTotal || 0), 0);
      const totalDuration = completedTickets.reduce((sum, t) => sum + (t.durationMinutes || 0), 0);
      const avgDurationMinutes = totalClientsServed > 0 ? Math.round(totalDuration / totalClientsServed) : 25;

      // Calculate Commission earned
      const commissionEarned = (totalServicesRevenue * (s.commissionRate || 20)) / 100;

      // Ledgers calculation: advances, payouts
      const totalPaidOrWithdrawn = (s.ledgers || [])
        .filter((l) => l.type === "SALARY_PAYOUT" || l.type === "ADVANCE_WITHDRAWAL")
        .reduce((sum, l) => sum + (l.amount || 0), 0);

      const totalBonuses = (s.ledgers || [])
        .filter((l) => l.type === "BONUS")
        .reduce((sum, l) => sum + (l.amount || 0), 0);

      const totalDeductions = (s.ledgers || [])
        .filter((l) => l.type === "DEDUCTION")
        .reduce((sum, l) => sum + (l.amount || 0), 0);

      const netEarned = s.baseSalary + commissionEarned + totalBonuses - totalDeductions;
      const remainingBalance = netEarned - totalPaidOrWithdrawn;

      return {
        id: s.id,
        userId: s.userId,
        branchId: s.branchId,
        branchName: s.branch?.name,
        name: s.name,
        phone: s.phone,
        photo: s.photo || "/barber-placeholder.jpg",
        title: s.title,
        chairNumber: s.chairNumber,
        status: s.status,
        statusReason: (s as any).statusReason || null,
        rating: s.rating,
        payType: s.payType,
        baseSalary: s.baseSalary,
        commissionRate: s.commissionRate,
        isActive: s.isActive,
        createdAt: s.createdAt,
        // Performance Stats
        totalClientsServed,
        totalServicesRevenue,
        avgDurationMinutes,
        // Financials (كام، خد كام، وباقيله كام)
        financials: {
          baseSalary: s.baseSalary,
          commissionRate: s.commissionRate,
          commissionEarned: Math.round(commissionEarned),
          totalEarned: Math.round(netEarned),
          totalPaidOrWithdrawn: Math.round(totalPaidOrWithdrawn),
          remainingBalance: Math.round(remainingBalance),
        },
      };
    });

    return NextResponse.json({ success: true, specialists: enriched });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      branchId,
      name,
      phone,
      photo,
      title,
      chairNumber,
      payType,
      baseSalary,
      commissionRate,
      username,
      password,
    } = body;

    if (!branchId || !name) {
      return NextResponse.json(
        { success: false, error: "اسم المتخصص والفرع مطلوبان" },
        { status: 400 }
      );
    }

    let createdUserId: string | null = null;
    if (username && password) {
      const existing = await prisma.user.findUnique({
        where: { username: username.trim().toLowerCase() },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, error: "اسم المستخدم مأخوذ بالفعل" },
          { status: 400 }
        );
      }

      const user = await prisma.user.create({
        data: {
          name: name.trim(),
          username: username.trim().toLowerCase(),
          passwordHash: password.trim(),
          pin: "157230",
          role: "specialist",
          branchId,
          phone: phone?.trim() || null,
          isActive: true,
        },
      });
      createdUserId = user.id;
    }

    const specialist = await prisma.specialist.create({
      data: {
        userId: createdUserId,
        branchId,
        name: name.trim(),
        phone: phone?.trim() || null,
        photo: photo?.trim() || null,
        title: title?.trim() || "خبير حلاقة وتصفيف",
        chairNumber: Number(chairNumber || 1),
        status: "AVAILABLE",
        rating: 4.9,
        payType: payType || "SALARY_PLUS_COMMISSION",
        baseSalary: Number(baseSalary || 0),
        commissionRate: Number(commissionRate || 20),
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, specialist });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      name,
      phone,
      photo,
      title,
      chairNumber,
      status,
      statusReason,
      payType,
      baseSalary,
      commissionRate,
      isActive,
      branchId,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "معرف المتخصص مطلوب" }, { status: 400 });
    }

    const specialist = await prisma.specialist.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
        ...(photo !== undefined && { photo: photo?.trim() || null }),
        ...(title && { title: title.trim() }),
        ...(chairNumber !== undefined && { chairNumber: Number(chairNumber) }),
        ...(status && { status }),
        ...(statusReason !== undefined && { statusReason: statusReason?.trim() || null }),
        ...(payType && { payType }),
        ...(baseSalary !== undefined && { baseSalary: Number(baseSalary) }),
        ...(commissionRate !== undefined && { commissionRate: Number(commissionRate) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        ...(branchId && { branchId }),
      },
    });

    return NextResponse.json({ success: true, specialist });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "معرف المتخصص مطلوب" }, { status: 400 });
    }

    await prisma.specialist.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "تم حذف المتخصص بنجاح" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
