import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Utility to get today's date in YYYY-MM-DD format (Egypt Time GMT+2 / GMT+3)
function getEgyptDateString(): string {
  const d = new Date();
  // Adjust to Egypt timezone
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(d); // Returns "YYYY-MM-DD"
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || getEgyptDateString();
    const branchId = searchParams.get("branchId");
    const userId = searchParams.get("userId");
    const month = searchParams.get("month"); // e.g. "2026-11"

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (month) {
      where.date = { startsWith: month };
    } else if (date && date !== "ALL") {
      where.date = date;
    }

    if (branchId && branchId !== "ALL") {
      where.branchId = branchId;
    }

    const records = await prisma.attendanceRecord.findMany({
      where,
      orderBy: { checkInTime: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
            phone: true,
            specialistProfile: {
              select: {
                id: true,
                title: true,
                chairNumber: true,
              },
            },
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Also get summary for today
    const todayStr = getEgyptDateString();
    const todayRecords = await prisma.attendanceRecord.findMany({
      where: { date: todayStr },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    });

    const activeNow = todayRecords.filter((r) => !r.checkOutTime);
    const completedToday = todayRecords.filter((r) => !!r.checkOutTime);

    return NextResponse.json({
      success: true,
      date: date || todayStr,
      count: records.length,
      records,
      summary: {
        totalToday: todayRecords.length,
        activeNowCount: activeNow.length,
        completedTodayCount: completedToday.length,
        activeStaffNames: activeNow.map((r) => r.user.name),
      },
    });
  } catch (error: any) {
    console.error("Attendance GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, action, branchId: directBranchId, notes } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: "معرف الموظف مطلوب" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        branch: true,
        specialistProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "الموظف غير موجود بالنظام" }, { status: 404 });
    }

    // Determine target branch
    let branchId = directBranchId || user.branchId;
    if (!branchId) {
      const firstBranch = await prisma.branch.findFirst();
      branchId = firstBranch?.id;
    }

    if (!branchId) {
      return NextResponse.json({ success: false, error: "لا يوجد فرع محدد لهذا الإجراء" }, { status: 400 });
    }

    const todayDate = getEgyptDateString();

    // 1. CHECK-IN
    if (action === "CHECK_IN") {
      // Check if already checked in and not checked out
      const existingOpen = await prisma.attendanceRecord.findFirst({
        where: {
          userId,
          date: todayDate,
          checkOutTime: null,
        },
      });

      if (existingOpen) {
        return NextResponse.json({
          success: false,
          error: `تم تسجيل حضور ${user.name} بالفعل اليوم في الساعة ${existingOpen.checkInTime.toLocaleTimeString("ar-EG")}`,
          record: existingOpen,
        });
      }

      // Late calculation: If after 12:30 PM Cairo time
      const now = new Date();
      const cairoHours = (now.getUTCHours() + 2) % 24;
      const isLate = cairoHours >= 12 && now.getUTCMinutes() > 30;

      const record = await prisma.attendanceRecord.create({
        data: {
          userId,
          branchId,
          date: todayDate,
          checkInTime: now,
          status: isLate ? "LATE" : "PRESENT",
          notes: notes || (isLate ? "حضور متأخر بعد الميعاد المحدد" : "تسجيل بصمة حضور طبيعي"),
        },
        include: {
          user: { select: { id: true, name: true, username: true, role: true } },
          branch: { select: { id: true, name: true } },
        },
      });

      return NextResponse.json({
        success: true,
        message: `تم تسجيل حضور [ ${user.name} ] بنجاح في تمام الساعة ${now.toLocaleTimeString("ar-EG")}`,
        record,
      });
    }

    // 2. CHECK-OUT
    if (action === "CHECK_OUT") {
      // Find latest record for today that has no checkout
      const openRecord = await prisma.attendanceRecord.findFirst({
        where: {
          userId,
          date: todayDate,
          checkOutTime: null,
        },
        orderBy: { checkInTime: "desc" },
      });

      if (!openRecord) {
        return NextResponse.json({
          success: false,
          error: `لم يتم العثور على تسجيل حضور نشط لـ [ ${user.name} ] اليوم لتسجيل الانصراف منه`,
        });
      }

      const now = new Date();
      const updated = await prisma.attendanceRecord.update({
        where: { id: openRecord.id },
        data: {
          checkOutTime: now,
          status: "COMPLETED",
          notes: notes ? `${openRecord.notes || ""} | انصراف: ${notes}` : openRecord.notes,
        },
        include: {
          user: { select: { id: true, name: true, username: true } },
          branch: { select: { id: true, name: true } },
        },
      });

      return NextResponse.json({
        success: true,
        message: `تم تسجيل انصراف [ ${user.name} ] بنجاح في تمام الساعة ${now.toLocaleTimeString("ar-EG")}`,
        record: updated,
      });
    }

    // 3. GET CURRENT STATUS FOR THIS USER
    if (action === "STATUS") {
      const activeRecord = await prisma.attendanceRecord.findFirst({
        where: {
          userId,
          date: todayDate,
        },
        orderBy: { checkInTime: "desc" },
      });

      return NextResponse.json({
        success: true,
        isCheckedIn: !!activeRecord && !activeRecord.checkOutTime,
        activeRecord,
      });
    }

    return NextResponse.json({ success: false, error: "نوع الإجراء غير صالح (action required)" }, { status: 400 });
  } catch (error: any) {
    console.error("Attendance POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
