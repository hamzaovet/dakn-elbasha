import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushNotifications } from "@/lib/push";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const specialistId = searchParams.get("specialistId");
    const customerId = searchParams.get("customerId");
    const bookingDate = searchParams.get("bookingDate");
    const status = searchParams.get("status");

    const where: any = {};
    if (branchId && branchId !== "ALL") where.branchId = branchId;
    if (specialistId) where.specialistId = specialistId;
    if (customerId) where.customerId = customerId;
    if (bookingDate) where.bookingDate = bookingDate;
    if (status) where.status = status;

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: [{ bookingDate: "desc" }, { createdAt: "desc" }],
      include: {
        branch: { select: { id: true, name: true, address: true, phone: true } },
        specialist: { select: { id: true, name: true, photo: true, chairNumber: true } },
        customer: { select: { id: true, name: true, phone: true, email: true, vipLevel: true } },
      },
      take: 60,
    });

    return NextResponse.json({ success: true, bookings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      customerId,
      customerName,
      customerPhone,
      customerEmail,
      branchId,
      specialistId,
      serviceIds,
      bookingDate,
      timeSlot,
      notes,
    } = body;

    if (!branchId || !bookingDate || !timeSlot) {
      return NextResponse.json(
        { success: false, error: "برجاء تحديد الفرع وتاريخ ووقت الموعد" },
        { status: 400 }
      );
    }

    // Check Weekly Day Off from settings
    const targetBranch = await prisma.branch.findUnique({ where: { id: branchId } });
    const settings = await prisma.systemSettings.findFirst();

    const isDayOffActive = Boolean(
      settings?.isDayOffEnabled && settings.weeklyDayOff && settings.weeklyDayOff !== "NONE"
    );
    const activeDayOff = settings?.weeklyDayOff || "MONDAY";

    if (isDayOffActive && activeDayOff && activeDayOff !== "NONE") {
      const d = new Date(bookingDate + "T12:00:00Z");
      const dayOfWeek = d.getUTCDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
      const dayMap: Record<string, number> = {
        SUNDAY: 0,
        MONDAY: 1,
        TUESDAY: 2,
        WEDNESDAY: 3,
        THURSDAY: 4,
        FRIDAY: 5,
        SATURDAY: 6,
      };
      if (dayMap[activeDayOff] === dayOfWeek) {
        return NextResponse.json(
          {
            success: false,
            error:
              settings?.dayOffMessage ||
              `عفواً، ${targetBranch?.name || "الصالون"} في عطلة أسبوعية - نتشرف بحجز موعدكم طوال باقي أيام الأسبوع ✂️`,
          },
          { status: 400 }
        );
      }
    }

    let finalCustomerId = customerId;

    // If customerId not provided, find or create from phone
    if (!finalCustomerId) {
      if (!customerPhone) {
        return NextResponse.json(
          { success: false, error: "رقم هاتف العميل مطلوب لإتمام الحجز" },
          { status: 400 }
        );
      }

      const cleanPhone = customerPhone.trim().replace(/\s+/g, "");
      let cust = await prisma.customer.findUnique({
        where: { phone: cleanPhone },
      });

      if (!cust) {
        cust = await prisma.customer.create({
          data: {
            name: customerName ? customerName.trim() : "عميل VIP",
            phone: cleanPhone,
            email: customerEmail ? customerEmail.trim().toLowerCase() : null,
            isVerified: true,
          },
        });
      }
      finalCustomerId = cust.id;
    }

    const servicesArr = Array.isArray(serviceIds) ? serviceIds : [];
    const totalAmount = servicesArr.reduce((sum: number, s: any) => sum + Number(s.price || 0), 0);

    const bookingNumber = `BASHA-${Math.floor(1000 + Math.random() * 9000)}`;

    const booking = await prisma.booking.create({
      data: {
        bookingNumber,
        customerId: finalCustomerId,
        branchId,
        specialistId: specialistId || null,
        serviceIds: JSON.stringify(servicesArr),
        bookingDate,
        timeSlot,
        status: body.status || "PENDING",
        totalAmount,
        notes: notes?.trim() || null,
      },
      include: {
        branch: true,
        specialist: true,
        customer: true,
      },
    });

    // Send real-time Web Push to branch Coordinator + Admin + Owner
    await sendPushNotifications(
      { roles: ["COORDINATOR", "ADMIN", "OWNER"], branchId: booking.branchId },
      {
        title: `🔔 حجز أونلاين جديد (#${booking.bookingNumber})`,
        body: `${booking.customer?.name || "عميل VIP"} • ${booking.branch?.name || ""} • ${booking.bookingDate} الساعة ${booking.timeSlot} (${totalAmount} ج.م)`,
        url: "/coordinator",
        tag: `basha-new-booking-${booking.id}`,
        requireInteraction: true,
      }
    );

    if (booking.customer?.phone) {
      await sendPushNotifications(
        { customerPhone: booking.customer.phone },
        {
          title: `👑 تم استلام طلب حجزك (#${booking.bookingNumber})`,
          body: `موعدك في ${booking.branch?.name || "صالونات وسبا الباشا VIP"} يوم ${booking.bookingDate} الساعة ${booking.timeSlot}. جاري التأكيد من المنسق!`,
          url: "/",
          tag: `basha-cust-booking-${booking.id}`,
        }
      );
    }

    return NextResponse.json({ success: true, booking });
  } catch (error: any) {
    console.error("Booking error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, action, status, notes, timeSlot, bookingDate, specialistId, notifyCustomer } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "معرف الحجز مطلوب" }, { status: 400 });
    }

    // Special Action: 5-Minute Late + Busy Chairs -> Re-route to First Available Chair ⚡
    if (action === "LATE_FIRST_AVAILABLE") {
      const existing = await prisma.booking.findUnique({
        where: { id },
        include: { customer: true, branch: true, specialist: true },
      });
      if (!existing) {
        return NextResponse.json({ success: false, error: "الحجز غير موجود" }, { status: 404 });
      }

      const branchSpecs = await prisma.specialist.findMany({
        where: { branchId: existing.branchId, isActive: true },
        orderBy: { chairNumber: "asc" },
      });

      if (branchSpecs.length === 0) {
        return NextResponse.json({ success: false, error: "لا يوجد متخصصين نشطين في هذا الفرع" }, { status: 400 });
      }

      let servicesList: any[] = [];
      try {
        servicesList = JSON.parse(existing.serviceIds || "[]");
      } catch {
        servicesList = [];
      }
      const servicesTotal = servicesList.reduce((s: number, i: any) => s + Number(i.price || 0), 0);
      const lateNote = "⏳ تأخر عن الموعد (+5د) وانشغال الكراسي — تم ترحيله لأول كرسي يفضى ⚡";

      const existingTicket = await prisma.ticket.findFirst({
        where: {
          branchId: existing.branchId,
          status: { in: ["WAITING", "IN_CHAIR"] },
          OR: [
            ...(existing.customerId ? [{ customerId: existing.customerId }] : []),
            ...(existing.customer?.phone ? [{ customerPhone: existing.customer.phone }] : []),
          ],
        },
      });

      let ticket = existingTicket;
      if (!ticket) {
        const ticketNumber = `CHAIR-${Math.floor(1000 + Math.random() * 9000)}`;
        ticket = await prisma.ticket.create({
          data: {
            ticketNumber,
            branchId: existing.branchId,
            specialistId: branchSpecs[0].id,
            chairNumber: branchSpecs[0].chairNumber,
            customerId: existing.customerId,
            customerName: existing.customer?.name || "عميل VIP",
            customerPhone: existing.customer?.phone || null,
            status: "WAITING",
            services: JSON.stringify(servicesList),
            servicesTotal,
            finalAmount: servicesTotal,
            startTime: new Date(),
            notes: lateNote,
          },
        });
      }

      const updatedBooking = await prisma.booking.update({
        where: { id },
        data: {
          status: "WAITING_LOUNGE",
          specialistId: null,
          notes: existing.notes ? `${existing.notes} | ${lateNote}` : lateNote,
        },
        include: { customer: true, branch: true, specialist: true },
      });

      if (existing.customer?.phone) {
        const msgText = `⏳ أهلاً بك في صالونات وسبا الباشا VIP (#${existing.bookingNumber}). نظراً للتأخر أكثر من 5 دقائق عن موعد (${existing.timeSlot}) وانشغال الكراسي حالياً بفرع (${existing.branch?.name || ""})، تم ترحيل دورك تلقائياً إلى (أول كرسي يفضى ⚡) فور وجودك بصالة الانتظار 👑`;

        await prisma.chatMessage.create({
          data: {
            sender: "SALON",
            senderName: "منسق صالونات وسبا الباشا VIP 🧭",
            customerPhone: existing.customer.phone,
            customerName: existing.customer.name,
            branchId: existing.branchId,
            bookingId: existing.id,
            message: msgText,
          },
        });

        await sendPushNotifications(
          { customerPhone: existing.customer.phone },
          {
            title: `⚡ تم ترحيل موعدك لأول كرسي يفضى (#${existing.bookingNumber})`,
            body: msgText,
            url: "/",
            tag: `basha-reroute-${existing.id}`,
            requireInteraction: true,
          }
        );
      }

      return NextResponse.json({ success: true, booking: updatedBooking, ticket });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (timeSlot) {
      updateData.timeSlot = timeSlot;
      updateData.reminderSentAt = null;
      updateData.overdueAlertSentAt = null;
    }
    if (bookingDate) {
      updateData.bookingDate = bookingDate;
      updateData.reminderSentAt = null;
      updateData.overdueAlertSentAt = null;
    }
    if (specialistId !== undefined) updateData.specialistId = specialistId || null;

    const booking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        branch: true,
        specialist: true,
      },
    });

    // If rescheduled or notified, send automated chat message + Web Push to customer
    if (notifyCustomer && booking.customer?.phone) {
      const msgText =
        status === "CANCELLED"
          ? `عفواً يا فندم، تم إلغاء حجزك رقم (#${booking.bookingNumber}) في صالونات وسبا الباشا VIP (${booking.branch?.name}). سبب الإلغاء: ${notes || "عدم توفر موعد متاح"}. نتشرف باختيار موعد بديل في أي وقت 💈`
          : `👑 مرحباً بك يا فندم! بخصوص حجزك في صالونات وسبا الباشا VIP (#${booking.bookingNumber})، تم تأكيد وتنسيق موعد الحضور إلى: يوم (${booking.bookingDate}) الساعة (${booking.timeSlot}) ⏰ بفرع (${booking.branch?.name})${booking.specialist ? ` مع ${booking.specialist.name}` : " (على أول كرسي متاح)"}. ننتظر تشريفك لتجربة استثنائية!`;

      await prisma.chatMessage.create({
        data: {
          sender: "SALON",
          senderName: "منسق صالونات وسبا الباشا VIP 🧭",
          customerPhone: booking.customer.phone,
          customerName: booking.customer.name,
          branchId: booking.branchId,
          bookingId: booking.id,
          message: msgText,
        },
      });

      await sendPushNotifications(
        { customerPhone: booking.customer.phone },
        {
          title:
            status === "CANCELLED"
              ? `❌ تحديث على حجزك (#${booking.bookingNumber})`
              : `✅ تم تأكيد / تحديث موعدك (#${booking.bookingNumber})`,
          body: msgText,
          url: "/",
          tag: `basha-booking-upd-${booking.id}`,
          requireInteraction: true,
        }
      );
    } else if (status && booking.customer?.phone) {
      const statusLabels: Record<string, string> = {
        CONFIRMED: "✅ تم تأكيد موعد حجزك",
        IN_CHAIR: "💈 حان دورك الآن على الكرسي الملكي",
        WAITING_LOUNGE: "🛋️ أنت الآن في صالة الانتظار الملكية",
        COMPLETED: "👑 نورتنا في صالونات وسبا الباشا VIP! نتمنى لك إطلالة رائعة",
        CANCELLED: "❌ تم إلغاء الحجز",
      };
      const pushTitle = statusLabels[status];
      if (pushTitle) {
        await sendPushNotifications(
          { customerPhone: booking.customer.phone },
          {
            title: `${pushTitle} (#${booking.bookingNumber})`,
            body: `فرع ${booking.branch?.name || "صالونات وسبا الباشا VIP"} • ${booking.bookingDate} الساعة ${booking.timeSlot}`,
            url: "/",
            tag: `basha-booking-status-${booking.id}`,
          }
        );
      }
    }

    return NextResponse.json({ success: true, booking });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
