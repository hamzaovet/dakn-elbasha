import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const branches = await prisma.branch.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        specialists: {
          where: { isActive: true },
          select: { id: true, name: true, photo: true, title: true, chairNumber: true, status: true, rating: true },
        },
        _count: {
          select: { specialists: true, bookings: true, tickets: true },
        },
      },
    });
    return NextResponse.json({ success: true, branches });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, code, address, phone, whatsapp, googleMapsUrl } = body;

    if (!name || !code || !address || !phone) {
      return NextResponse.json(
        { success: false, error: "برجاء استكمال جميع بيانات الفرع المطلوبة" },
        { status: 400 }
      );
    }

    const branch = await prisma.branch.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        address: address.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp?.trim() || null,
        googleMapsUrl: googleMapsUrl?.trim() || null,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, branch });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, name, address, phone, whatsapp, googleMapsUrl, isActive } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "معرف الفرع مطلوب" }, { status: 400 });
    }

    const branch = await prisma.branch.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(address && { address: address.trim() }),
        ...(phone && { phone: phone.trim() }),
        ...(whatsapp !== undefined && { whatsapp: whatsapp?.trim() || null }),
        ...(googleMapsUrl !== undefined && { googleMapsUrl: googleMapsUrl?.trim() || null }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });

    return NextResponse.json({ success: true, branch });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
