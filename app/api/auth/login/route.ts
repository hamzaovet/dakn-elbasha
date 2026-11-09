import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { username, password, pin } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "برجاء إدخال اسم المستخدم وكلمة المرور" },
        { status: 400 }
      );
    }

    // Check System Lock (Master Kill Switch)
    const settings = await prisma.systemSettings.findFirst();
    const isLocked = settings?.systemLocked || false;

    // Find User
    const user = await prisma.user.findUnique({
      where: { username: username.trim().toLowerCase() },
      include: {
        branch: true,
        specialistProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "اسم المستخدم أو كلمة المرور غير صحيحة" },
        { status: 401 }
      );
    }

    // Password Check
    if (user.passwordHash !== password.trim()) {
      return NextResponse.json(
        { success: false, error: "اسم المستخدم أو كلمة المرور غير صحيحة" },
        { status: 401 }
      );
    }

    // PIN Check if provided or required
    if (pin && user.pin && user.pin !== pin.trim()) {
      return NextResponse.json(
        { success: false, error: "رمز الـ PIN السري غير صحيح" },
        { status: 401 }
      );
    }

    // Check User Active Status
    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: "تم تعطيل هذا الحساب من قِبل إدارة صالون صدام" },
        { status: 403 }
      );
    }

    // If System is Locked, only owner (Maestro) can log in
    if (isLocked && user.role !== "owner") {
      return NextResponse.json(
        {
          success: false,
          error: settings?.lockMessage || "تم إيقاف النظام مؤقتاً بواسطة المالك لأعمال الصيانة",
        },
        { status: 403 }
      );
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      branchId: user.branchId,
      branchName: user.branch?.name || null,
      branchCode: user.branch?.code || null,
      specialistId: user.specialistProfile?.id || null,
      chairNumber: user.specialistProfile?.chairNumber || null,
      permissions: user.permissions ? JSON.parse(user.permissions) : [],
    };

    return NextResponse.json({ success: true, user: safeUser });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
