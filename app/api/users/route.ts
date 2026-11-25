import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const requester = searchParams.get("requester") || req.headers.get("x-user-username");

    const where: any = {};
    if (branchId && branchId !== "ALL") {
      where.OR = [{ branchId }, { branchId: null }];
    }

    // Maestro (System Creator & Developer) is strictly invisible to all other accounts!
    if (requester?.trim().toLowerCase() !== "maestro") {
      where.username = { not: "maestro" };
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

    if (username.trim().toLowerCase() === "maestro") {
      return NextResponse.json(
        { success: false, error: "اسم المستخدم محجوز لنظام التشغيل والمطور" },
        { status: 403 }
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

    // Owner & Developer protection: Maestro can NEVER be edited, modified, or disabled by anyone else!
    const targetUser = await prisma.user.findUnique({ where: { id } });
    const requester = (body.requester || req.headers.get("x-user-username"))?.trim().toLowerCase();
    if (targetUser?.username === "maestro" && requester !== "maestro") {
      return NextResponse.json(
        { success: false, error: "حساب المطور والمالك الأساسي (Maestro) محمي بالكامل ومحجوب عن التعديل" },
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
