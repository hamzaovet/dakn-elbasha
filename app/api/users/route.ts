import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");

    const where: any = {};
    if (branchId && branchId !== "ALL") {
      where.OR = [{ branchId }, { branchId: null }];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "asc" },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        specialistProfile: { select: { id: true, chairNumber: true, status: true } },
      },
    });

    const safeUsers = users.map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      role: u.role,
      branchId: u.branchId,
      branchName: u.branch?.name || "إشراف عام على كل الفروع",
      phone: u.phone,
      pin: u.pin,
      isActive: u.isActive,
      createdAt: u.createdAt,
      specialistId: u.specialistProfile?.id || null,
      chairNumber: u.specialistProfile?.chairNumber || null,
    }));

    return NextResponse.json({ success: true, users: safeUsers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, username, password, pin, role, branchId, phone } = body;

    if (!name || !username || !password) {
      return NextResponse.json(
        { success: false, error: "الاسم واسم المستخدم وكلمة المرور مطلوبة" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { username: username.trim().toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "اسم المستخدم مأخوذ بالفعل، يرجى اختيار اسم آخر" },
        { status: 400 }
      );
    }

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        username: username.trim().toLowerCase(),
        passwordHash: password.trim(),
        pin: pin?.trim() || "157230",
        role: role || "cashier",
        branchId: branchId || null,
        phone: phone?.trim() || null,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, name, username, password, pin, role, branchId, phone, isActive } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "معرف المستخدم مطلوب" }, { status: 400 });
    }

    // Owner protection
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (targetUser?.username === "maestro" && isActive === false) {
      return NextResponse.json(
        { success: false, error: "لا يمكن تعطيل حساب المالك الأساسي (Maestro)" },
        { status: 403 }
      );
    }

    if (username && username.trim().toLowerCase() !== targetUser?.username) {
      const exists = await prisma.user.findUnique({
        where: { username: username.trim().toLowerCase() },
      });
      if (exists) {
        return NextResponse.json(
          { success: false, error: "اسم المستخدم مأخوذ بالفعل" },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(username && { username: username.trim().toLowerCase() }),
        ...(password && { passwordHash: password.trim() }),
        ...(pin && { pin: pin.trim() }),
        ...(role && { role }),
        ...(branchId !== undefined && { branchId: branchId || null }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
