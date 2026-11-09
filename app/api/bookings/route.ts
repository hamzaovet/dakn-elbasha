import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    // Check Weekly Day Off (e.g. MONDAY)
    const settings = await prisma.systemSettings.findFirst();
    if (settings?.isDayOffEnabled && settings.weeklyDayOff && settings.weeklyDayOff !== "NONE") {
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
      if (dayMap[settings.weeklyDayOff] === dayOfWeek) {
        return NextResponse.json(
          {
            success: false,
            error:
              settings.dayOffMessage ||
              "عفواً، صالون صدام في عطلة أسبوعية يوم الإثنين - نتشرف بحجز موعدكم طوال باقي أيام الأسبوع ✂️",
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

    const bookingNumber = `SAD-${Math.floor(1000 + Math.random() * 9000)}`;

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

    return NextResponse.json({ success: true, booking });
  } catch (error: any) {
    console.error("Booking error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status, notes, timeSlot, bookingDate, notifyCustomer } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "معرف الحجز مطلوب" }, { status: 400 });
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
        ...(timeSlot && { timeSlot }),
        ...(bookingDate && { bookingDate }),
      },
      include: {
        customer: true,
        branch: true,
        specialist: true,
      },
    });

    // If rescheduled or notified, send automated chat message to customer
    if (notifyCustomer && booking.customer?.phone) {
      const msgText =
        status === "CANCELLED"
          ? `عفواً يا فندم، تم إلغاء حجزك رقم (#${booking.bookingNumber}) في صالون صدام (${booking.branch?.name}). سبب الإلغاء: ${notes || "عدم توفر موعد متاح"}. نتشرف باختيار موعد بديل في أي وقت 💈`
          : `👑 مرحباً بك يا فندم! بخصوص حجزك في صالون صدام (#${booking.bookingNumber})، تم تأكيد وتعديل موعد الحضور إلى: يوم (${booking.bookingDate}) الساعة (${booking.timeSlot}) ⏰ بفرع (${booking.branch?.name})${booking.specialist ? ` مع ${booking.specialist.name}` : ""}. ننتظر تشريفك لتجربة استثنائية!`;

      await prisma.chatMessage.create({
        data: {
          sender: "SALON",
          customerPhone: booking.customer.phone,
          customerName: booking.customer.name,
          branchId: booking.branchId,
          message: msgText,
        },
      });
    }

    return NextResponse.json({ success: true, booking });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
