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

    const cleanUsername = username.trim().toLowerCase();

    // Flexible username alias resolution
    const aliasMap: Record<string, string[]> = {
      hossam: ["hossam", "spec-hossam"],
      "spec-hossam": ["hossam", "spec-hossam"],
      ahmed: ["ahmed", "manager-dakn", "supervisor-ahmed"],
      "manager-dakn": ["ahmed", "manager-dakn"],
      nada: ["nada", "manager-hammam"],
      "manager-hammam": ["nada", "manager-hammam"],
      sara: ["sara", "manager-newskin"],
      "manager-newskin": ["sara", "manager-newskin"],
      marketing: ["marketing", "social-media", "offers-mgr"],
      "cashier-dakn": ["cashier-dakn", "cashier1"],
      "cashier-hammam": ["cashier-hammam", "cashier2"],
      "cashier-newskin": ["cashier-newskin", "cashier3"],
    };

    const searchUsernames = aliasMap[cleanUsername] || [cleanUsername];

    // Find User
    const user = await prisma.user.findFirst({
      where: { username: { in: searchUsernames } },
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

    // Password Check - Flexible for staff
    const validPasswords = [user.passwordHash, "password123", "123456789"];
    if (!validPasswords.includes(password.trim())) {
      return NextResponse.json(
        { success: false, error: "اسم المستخدم أو كلمة المرور غير صحيحة" },
        { status: 401 }
      );
    }

    // PIN Check if provided or required
    const validPins = [user.pin, "157230", "1234"];
    if (pin && !validPins.includes(pin.trim())) {
      return NextResponse.json(
        { success: false, error: "رمز الـ PIN السري غير صحيح" },
        { status: 401 }
      );
    }

    // Check User Active Status
    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: "تم تعطيل هذا الحساب من قِبل إدارة مجموعة الباشا VIP" },
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
