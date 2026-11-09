import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const specialistId = searchParams.get("specialistId");
    const status = searchParams.get("status");
    const activeOnly = searchParams.get("activeOnly") === "true";

    const where: any = {};
    if (branchId && branchId !== "ALL") where.branchId = branchId;
    if (specialistId) where.specialistId = specialistId;

    if (activeOnly) {
      where.status = { in: ["WAITING", "IN_CHAIR", "READY_FOR_CASHIER"] };
    } else if (status) {
      where.status = status;
    }

    const tickets = await prisma.ticket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        specialist: {
          select: { id: true, name: true, photo: true, chairNumber: true, status: true, commissionRate: true },
        },
        branch: { select: { id: true, name: true, code: true } },
        customer: { select: { id: true, name: true, phone: true, vipLevel: true } },
      },
      take: 60,
    });

    return NextResponse.json({ success: true, tickets });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      specialistId,
      branchId,
      customerName,
      customerPhone,
      customerId,
      bookingId,
      initialServices,
      status: requestedStatus,
      waitingMode,
      notes,
    } = body;

    if (!specialistId || !branchId || !customerName) {
      return NextResponse.json(
        { success: false, error: "بيانات المتخصص والفرع واسم العميل مطلوبة" },
        { status: 400 }
      );
    }

    // Get Specialist chair number
    const specialist = await prisma.specialist.findUnique({
      where: { id: specialistId },
    });

    if (!specialist) {
      return NextResponse.json({ success: false, error: "المتخصص غير موجود" }, { status: 404 });
    }

    const ticketNumber = `CHAIR-${Math.floor(1000 + Math.random() * 9000)}`;
    const isWaiting = requestedStatus === "WAITING";

    // Prepare initial services
    let servicesList = initialServices || [];
    let servicesTotal = servicesList.reduce((sum: number, s: any) => sum + Number(s.price || 0), 0);

    const ticketNotes =
      notes ||
      (isWaiting
        ? waitingMode === "FIRST_AVAILABLE"
          ? "🛋️ صالة الاستراحة: في انتظار أول كابتن يفضى"
          : `🛋️ صالة الاستراحة: طلب كابتن (${specialist.name}) بالاسم`
        : null);

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        branchId,
        specialistId,
        chairNumber: specialist.chairNumber,
        customerId: customerId || null,
        customerName: customerName.trim(),
        customerPhone: customerPhone?.trim() || null,
        status: isWaiting ? "WAITING" : "IN_CHAIR",
        services: JSON.stringify(servicesList),
        servicesTotal,
        finalAmount: servicesTotal,
        startTime: new Date(),
        notes: ticketNotes,
      },
      include: {
        specialist: {
          select: { id: true, name: true, photo: true, chairNumber: true, status: true, commissionRate: true },
        },
        branch: { select: { id: true, name: true, code: true } },
        customer: { select: { id: true, name: true, phone: true } },
      },
    });

    // Update specialist status to WITH_CLIENT only if actually seated in chair
    if (!isWaiting) {
      await prisma.specialist.update({
        where: { id: specialistId },
        data: { status: "WITH_CLIENT" },
      });
    }

    // If coming from a booking, update booking status
    if (bookingId) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: isWaiting ? "WAITING_LOUNGE" : "IN_CHAIR" },
      });
    }

    return NextResponse.json({ success: true, ticket });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { ticketId, action } = body;

    if (!ticketId) {
      return NextResponse.json({ success: false, error: "معرف التذكرة مطلوب" }, { status: 400 });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { specialist: true },
    });

    if (!ticket) {
      return NextResponse.json({ success: false, error: "التذكرة غير موجودة" }, { status: 404 });
    }

    let services: any[] = [];
    try {
      services = typeof ticket.services === "string" ? JSON.parse(ticket.services) : ticket.services || [];
    } catch {
      services = [];
    }

    let retailItems: any[] = [];
    try {
      retailItems = typeof ticket.retailItems === "string" ? JSON.parse(ticket.retailItems) : ticket.retailItems || [];
    } catch {
      retailItems = [];
    }

    // 0. SEAT WAITING CLIENT ON CHAIR (Walk-in or Waiting lounge customer admitted to chair)
    if (action === "SEAT_NOW" || action === "SEAT_WAITING_CLIENT") {
      const targetSpecialistId = body.specialistId || ticket.specialistId;
      const targetSpecialist = await prisma.specialist.findUnique({
        where: { id: targetSpecialistId },
      });

      const updated = await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          status: "IN_CHAIR",
          specialistId: targetSpecialistId,
          chairNumber: targetSpecialist?.chairNumber || ticket.chairNumber,
          startTime: new Date(),
          notes: body.notes !== undefined ? body.notes : ticket.notes,
        },
        include: {
          specialist: {
            select: { id: true, name: true, photo: true, chairNumber: true, status: true, commissionRate: true },
          },
          branch: { select: { id: true, name: true, code: true } },
          customer: { select: { id: true, name: true, phone: true } },
        },
      });

      if (targetSpecialistId) {
        await prisma.specialist.update({
          where: { id: targetSpecialistId },
          data: { status: "WITH_CLIENT" },
        });
      }

      return NextResponse.json({ success: true, ticket: updated });
    }

    // 0.1 CANCEL WAITING TICKET (Customer left or cancelled)
    if (action === "CANCEL_WAITING" || action === "CANCEL_TICKET") {
      const updated = await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          status: "CANCELLED",
          endTime: new Date(),
        },
      });

      if (ticket.status === "IN_CHAIR" && ticket.specialistId) {
        await prisma.specialist.update({
          where: { id: ticket.specialistId },
          data: { status: "AVAILABLE" },
        });
      }

      return NextResponse.json({ success: true, ticket: updated });
    }

    // 1. ADD SERVICE (Called by Barber on chair pad)
    if (action === "ADD_SERVICE") {
      const { serviceId, nameAr, price } = body;
      if (!nameAr || price === undefined) {
        return NextResponse.json({ success: false, error: "بيانات الخدمة غير مكتملة" }, { status: 400 });
      }

      services.push({
        id: serviceId || `srv-${Date.now()}`,
        nameAr,
        price: Number(price),
        addedAt: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
      });

      const servicesTotal = services.reduce((sum, s) => sum + Number(s.price || 0), 0);
      const retailTotal = retailItems.reduce((sum, r) => sum + Number(r.total || 0), 0);
      const finalAmount = servicesTotal + retailTotal - Number(ticket.discount || 0);

      const updated = await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          services: JSON.stringify(services),
          servicesTotal,
          finalAmount,
        },
      });

      return NextResponse.json({ success: true, ticket: updated });
    }

    // 2. REMOVE SERVICE
    if (action === "REMOVE_SERVICE") {
      const { index } = body;
      if (index === undefined || index < 0 || index >= services.length) {
        return NextResponse.json({ success: false, error: "فهرس الخدمة غير صحيح" }, { status: 400 });
      }

      services.splice(index, 1);
      const servicesTotal = services.reduce((sum, s) => sum + Number(s.price || 0), 0);
      const retailTotal = retailItems.reduce((sum, r) => sum + Number(r.total || 0), 0);
      const finalAmount = servicesTotal + retailTotal - Number(ticket.discount || 0);

      const updated = await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          services: JSON.stringify(services),
          servicesTotal,
          finalAmount,
        },
      });

      return NextResponse.json({ success: true, ticket: updated });
    }

    // 3. ADD RETAIL BEAUTY PRODUCT
    if (action === "ADD_RETAIL") {
      const { productId, nameAr, price, qty } = body;
      const quantity = Number(qty || 1);
      const unitPrice = Number(price || 0);
      const total = unitPrice * quantity;

      retailItems.push({
        id: productId || `prod-${Date.now()}`,
        nameAr,
        price: unitPrice,
        qty: quantity,
        total,
      });

      // Update product stock if productId exists
      if (productId) {
        try {
          await prisma.product.update({
            where: { id: productId },
            data: { stockQty: { decrement: quantity } },
          });
        } catch {}
      }

      const servicesTotal = services.reduce((sum, s) => sum + Number(s.price || 0), 0);
      const retailTotal = retailItems.reduce((sum, r) => sum + Number(r.total || 0), 0);
      const finalAmount = servicesTotal + retailTotal - Number(ticket.discount || 0);

      const updated = await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          retailItems: JSON.stringify(retailItems),
          retailTotal,
          finalAmount,
        },
      });

      return NextResponse.json({ success: true, ticket: updated });
    }

    // 4. FINISH CHAIR (Barber done with styling -> export to cashier)
    if (action === "FINISH_CHAIR") {
      const endTime = new Date();
      const startTime = ticket.startTime ? new Date(ticket.startTime) : endTime;
      const durationMinutes = Math.max(1, Math.round((endTime.getTime() - startTime.getTime()) / 60000));

      const updated = await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          status: "READY_FOR_CASHIER",
          endTime,
          durationMinutes,
        },
      });

      // Free chair
      await prisma.specialist.update({
        where: { id: ticket.specialistId },
        data: { status: "AVAILABLE" },
      });

      return NextResponse.json({ success: true, ticket: updated });
    }

    // 5. SETTLE CASHIER (Cashier takes payment, prints thermal receipt)
    if (action === "SETTLE_CASHIER") {
      const { paymentMethod, discount, tipAmount, cashierName, notes } = body;
      const discountNum = Number(discount || 0);
      const tipNum = Number(tipAmount || 0);
      const finalTotal = Math.max(0, ticket.servicesTotal + ticket.retailTotal - discountNum + tipNum);

      const endTime = ticket.endTime || new Date();

      const updated = await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          status: "COMPLETED",
          paymentMethod: paymentMethod || "CASH",
          discount: discountNum,
          tipAmount: tipNum,
          finalAmount: finalTotal,
          cashierName: cashierName || "كاشير صالون صدام",
          notes: notes || null,
          endTime,
        },
      });

      // Update customer loyalty if registered
      if (ticket.customerId) {
        try {
          await prisma.customer.update({
            where: { id: ticket.customerId },
            data: {
              totalVisits: { increment: 1 },
              totalSpent: { increment: finalTotal },
              lastVisitAt: new Date(),
            },
          });
        } catch {}
      }

      // Record commission in SpecialistLedger
      if (ticket.specialist) {
        const commRate = ticket.specialist.commissionRate || 20;
        const commAmount = Math.round((ticket.servicesTotal * commRate) / 100);

        if (commAmount > 0) {
          try {
            await prisma.specialistLedger.create({
              data: {
                specialistId: ticket.specialistId,
                branchId: ticket.branchId,
                type: "COMMISSION_EARNED",
                amount: commAmount,
                notes: `عمولة تذكرة رقم #${ticket.ticketNumber} للعميل (${ticket.customerName}) - خدمات ${ticket.servicesTotal} ج.م بنسبة (${commRate}%)`,
                recordedBy: cashierName || "الكاشير",
              },
            });
          } catch {}
        }

        if (tipNum > 0) {
          try {
            await prisma.specialistLedger.create({
              data: {
                specialistId: ticket.specialistId,
                branchId: ticket.branchId,
                type: "TIP_EARNED",
                amount: tipNum,
                notes: `إكرامية / Tip من العميل (${ticket.customerName}) لتذكرة #${ticket.ticketNumber}`,
                recordedBy: cashierName || "الكاشير",
              },
            });
          } catch {}
        }
      }

      return NextResponse.json({ success: true, ticket: updated });
    }

    return NextResponse.json({ success: false, error: "عملية غير صالحة" }, { status: 400 });
  } catch (error: any) {
    console.error("Ticket action error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
