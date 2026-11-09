import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const customerPhone = searchParams.get("customerPhone");
    const customerId = searchParams.get("customerId");
    const branchId = searchParams.get("branchId");
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    const where: any = {};

    if (customerPhone) {
      where.customerPhone = customerPhone;
    } else if (customerId) {
      where.customerId = customerId;
    } else if (branchId && branchId !== "ALL") {
      where.OR = [{ branchId }, { branchId: null }];
    }

    const messages = await prisma.chatMessage.findMany({
      where,
      orderBy: { createdAt: "asc" },
      take: limit,
      include: {
        branch: { select: { id: true, name: true } },
      },
    });

    // Also get grouped conversation summaries if request is from Admin without specific customer
    let conversations: any[] = [];
    if (!customerPhone && !customerId) {
      const allMsgs = await prisma.chatMessage.findMany({
        where: branchId && branchId !== "ALL" ? { OR: [{ branchId }, { branchId: null }] } : {},
        orderBy: { createdAt: "desc" },
        take: 300,
      });

      const customerMap = new Map<string, any>();
      for (const m of allMsgs) {
        const key = m.customerPhone || m.customerId || m.customerName || "unknown";
        if (!customerMap.has(key)) {
          customerMap.set(key, {
            key,
            customerId: m.customerId,
            customerPhone: m.customerPhone,
            customerName: m.customerName,
            lastMessage: m.message,
            lastTime: m.createdAt,
            unreadCount: m.sender === "CUSTOMER" && !m.isRead ? 1 : 0,
          });
        } else {
          const c = customerMap.get(key);
          if (m.sender === "CUSTOMER" && !m.isRead) {
            c.unreadCount += 1;
          }
        }
      }
      conversations = Array.from(customerMap.values());
    }

    return NextResponse.json({ success: true, messages, conversations });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      sender,
      senderName,
      message,
      customerId,
      customerName,
      customerPhone,
      branchId,
      bookingId,
    } = body;

    if (!message || !message.trim()) {
      return NextResponse.json(
        { success: false, error: "نص الرسالة مطلوب" },
        { status: 400 }
      );
    }

    const chatMsg = await prisma.chatMessage.create({
      data: {
        sender: sender || "CUSTOMER",
        senderName: senderName?.trim() || (sender === "SALON" ? "إدارة صالون صدام" : "عميل VIP"),
        message: message.trim(),
        customerId: customerId || null,
        customerName: customerName?.trim() || "عميل VIP",
        customerPhone: customerPhone?.trim() || null,
        branchId: branchId || null,
        bookingId: bookingId || null,
        isRead: sender === "SALON", // Messages from salon are already read
      },
    });

    return NextResponse.json({ success: true, chatMessage: chatMsg });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { customerPhone, customerId } = body;

    const where: any = {};
    if (customerPhone) where.customerPhone = customerPhone;
    if (customerId) where.customerId = customerId;

    await prisma.chatMessage.updateMany({
      where: {
        ...where,
        sender: "CUSTOMER",
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true, message: "تم تحديث القراءة" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
