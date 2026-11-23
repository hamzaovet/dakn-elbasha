import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeBookingTiming } from "@/lib/booking-time";
import { sendPushNotifications } from "@/lib/push";

export const dynamic = "force-dynamic";

async function runWatchdog(branchFilter?: string | null) {
  const settings = await prisma.systemSettings.findFirst({
    where: { id: "default-settings" },
  });
  const reminderLead = (settings as any)?.reminderMinutesBefore || 15;

  const whereBooking: Record<string, unknown> = {
    status: { in: ["PENDING", "CONFIRMED", "WAITING_LOUNGE"] },
  };
  if (branchFilter && branchFilter !== "ALL") {
    whereBooking.branchId = branchFilter;
  }

  const [bookings, specialists, activeTickets] = await Promise.all([
    prisma.booking.findMany({
      where: whereBooking as never,
      include: {
        customer: true,
        branch: true,
        specialist: true,
      },
      orderBy: [{ bookingDate: "asc" }, { createdAt: "asc" }],
      take: 120,
    }),
    prisma.specialist.findMany({
      where: {
        isActive: true,
        ...(branchFilter && branchFilter !== "ALL" ? { branchId: branchFilter } : {}),
      },
      select: { id: true, name: true, branchId: true, status: true },
    }),
    prisma.ticket.findMany({
      where: {
        status: { in: ["WAITING", "IN_CHAIR"] },
        ...(branchFilter && branchFilter !== "ALL" ? { branchId: branchFilter } : {}),
      },
      select: { id: true, specialistId: true, branchId: true, customerId: true, customerPhone: true, status: true },
    }),
  ]);

  const upcomingAlerts: any[] = [];
  const overdueAlerts: any[] = [];
  const late5MinAlerts: any[] = [];

  let remindersDispatched = 0;
  let overdueDispatched = 0;

  for (const bk of bookings) {
    const hasOpenTicket = activeTickets.some(
      (t) =>
        (t.customerId && t.customerId === bk.customerId) ||
        (t.customerPhone && bk.customer?.phone && t.customerPhone === bk.customer.phone)
    );

    const timing = computeBookingTiming(bk.bookingDate, bk.timeSlot, reminderLead);

    const branchSpecs = specialists.filter((s) => s.branchId === bk.branchId);
    const availableInBranch = branchSpecs.filter((s) => s.status === "AVAILABLE");
    const targetSpec = bk.specialistId
      ? branchSpecs.find((s) => s.id === bk.specialistId)
      : null;

    const chairsBusy =
      availableInBranch.length === 0 ||
      Boolean(targetSpec && targetSpec.status !== "AVAILABLE");

    // 1. 15-Minute Upcoming Reminder
    if (
      (bk.status === "PENDING" || bk.status === "CONFIRMED") &&
      !hasOpenTicket &&
      timing.isUpcoming15Min
    ) {
      upcomingAlerts.push({
        id: bk.id,
        bookingNumber: bk.bookingNumber,
        branchId: bk.branchId,
        branchName: bk.branch?.name,
        customerName: bk.customer?.name || "عميل VIP",
        customerPhone: bk.customer?.phone || "",
        specialistId: bk.specialistId,
        specialistName: bk.specialist?.name || null,
        bookingDate: bk.bookingDate,
        timeSlot: bk.timeSlot,
        totalAmount: bk.totalAmount,
        diffMinutes: timing.diffMinutes,
        status: bk.status,
      });

      if (!bk.reminderSentAt) {
        remindersDispatched++;
        await prisma.booking.update({
          where: { id: bk.id },
          data: { reminderSentAt: new Date() },
        });

        const minsText =
          timing.diffMinutes !== null && timing.diffMinutes > 0
            ? `متبقي ${timing.diffMinutes} دقيقة`
            : "حان موعدك الآن";

        if (bk.customer?.phone) {
          await sendPushNotifications(
            { customerPhone: bk.customer.phone },
            {
              title: `⏰ تذكير موعدك في صالونات وسبا الباشا (#${bk.bookingNumber})`,
              body: `${minsText} على حجزك الساعة ${bk.timeSlot} بفرع ${bk.branch?.name || "صالونات الباشا"}${bk.specialist ? ` مع ${bk.specialist.name}` : ""}. في انتظار تشريفك 👑`,
              url: "/",
              tag: `basha-reminder-${bk.id}`,
              requireInteraction: true,
            }
          );
        }

        await sendPushNotifications(
          { roles: ["COORDINATOR", "ADMIN", "OWNER"], branchId: bk.branchId },
          {
            title: `🔔 موعد يقترب (${bk.timeSlot}) • #${bk.bookingNumber}`,
            body: `العميل ${bk.customer?.name || "VIP"} (${bk.customer?.phone || ""}) باقي ${timing.diffMinutes ?? 15} د في ${bk.branch?.name || ""}`,
            url: "/coordinator",
            tag: `basha-staff-reminder-${bk.id}`,
            requireInteraction: true,
          }
        );
      }
    }

    // 2. Overdue / Missed
    if (
      (bk.status === "PENDING" || bk.status === "CONFIRMED") &&
      !hasOpenTicket &&
      timing.isOverdue
    ) {
      const isLateTodayWithBusyChairs = !timing.isPastDay && timing.isPastDue5Min && chairsBusy;
      const alertPayload = {
        id: bk.id,
        bookingNumber: bk.bookingNumber,
        branchId: bk.branchId,
        branchName: bk.branch?.name,
        customerName: bk.customer?.name || "عميل VIP",
        customerPhone: bk.customer?.phone || "",
        specialistId: bk.specialistId,
        specialistName: bk.specialist?.name || null,
        bookingDate: bk.bookingDate,
        timeSlot: bk.timeSlot,
        totalAmount: bk.totalAmount,
        diffMinutes: timing.diffMinutes,
        isPastDay: timing.isPastDay,
        chairsBusy,
        isLateTodayWithBusyChairs,
        status: bk.status,
      };

      overdueAlerts.push(alertPayload);
      if (isLateTodayWithBusyChairs || (!timing.isPastDay && timing.isPastDue5Min)) {
        late5MinAlerts.push(alertPayload);
      }

      if (!bk.overdueAlertSentAt) {
        overdueDispatched++;
        await prisma.booking.update({
          where: { id: bk.id },
          data: { overdueAlertSentAt: new Date() },
        });

        await sendPushNotifications(
          { roles: ["COORDINATOR", "ADMIN", "OWNER"], branchId: bk.branchId },
          {
            title: timing.isPastDay
              ? `⚠️ حجز فائت من يوم (${bk.bookingDate}) لم يُغلق`
              : `⏳ تأخر عميل +5 دقائق عن موعد (${bk.timeSlot})`,
            body: `${bk.customer?.name || "العميل"} (${bk.customer?.phone || ""}) • #${bk.bookingNumber}. تواصل معه للتأكيد أو التأجيل ⚡`,
            url: "/coordinator",
            tag: `basha-overdue-${bk.id}`,
            requireInteraction: true,
          }
        );
      }
    }
  }

  return {
    success: true,
    reminderLeadMinutes: reminderLead,
    upcomingAlerts,
    overdueAlerts,
    late5MinAlerts,
    dispatched: {
      reminders: remindersDispatched,
      overdue: overdueDispatched,
    },
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const result = await runWatchdog(branchId);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Watchdog error";
    console.error("[Bookings Watchdog] GET error:", error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const result = await runWatchdog(body.branchId || null);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Watchdog error";
    console.error("[Bookings Watchdog] POST error:", error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
