import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let settings = await prisma.systemSettings.findFirst();
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          id: "default-settings",
          salonNameAr: "مجموعة صالونات وسبا الباشا VIP (دقن الباشا & حمام الباشا)",
          salonNameEn: "EL BASHA LUXURY SALON & SPA",
          logoUrl: "/dakn-logo.jpg",
          hadayekPhone: "01210103025",
          nasrCityPhone: "01556782015",
          hotline: "01210103025",
          whatsappNumber: "01210103025",
          facebookUrl: "https://www.facebook.com/DaknElbashaSalon",
          instagramUrl: "https://www.facebook.com/hammam.elbasha1/",
        },
      });
    }
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const settings = await prisma.systemSettings.upsert({
      where: { id: "default-settings" },
      update: {
        ...(body.salonNameAr && { salonNameAr: body.salonNameAr }),
        ...(body.salonNameEn && { salonNameEn: body.salonNameEn }),
        ...(body.logoUrl && { logoUrl: body.logoUrl }),
        ...(body.systemLocked !== undefined && { systemLocked: Boolean(body.systemLocked) }),
        ...(body.lockMessage !== undefined && { lockMessage: body.lockMessage }),
        ...(body.hadayekPhone && { hadayekPhone: body.hadayekPhone }),
        ...(body.nasrCityPhone && { nasrCityPhone: body.nasrCityPhone }),
        ...(body.hotline && { hotline: body.hotline }),
        ...(body.whatsappNumber && { whatsappNumber: body.whatsappNumber }),
        ...(body.facebookUrl && { facebookUrl: body.facebookUrl }),
        ...(body.instagramUrl !== undefined && { instagramUrl: body.instagramUrl }),
        ...(body.defaultOpenHour && { defaultOpenHour: body.defaultOpenHour }),
        ...(body.defaultCloseHour && { defaultCloseHour: body.defaultCloseHour }),
        ...(body.weeklyDayOff && { weeklyDayOff: body.weeklyDayOff }),
        ...(body.isDayOffEnabled !== undefined && { isDayOffEnabled: Boolean(body.isDayOffEnabled) }),
        ...(body.dayOffMessage && { dayOffMessage: body.dayOffMessage }),
        ...(body.bookingSlotInterval && { bookingSlotInterval: Number(body.bookingSlotInterval) }),
        ...(body.reminderMinutesBefore && { reminderMinutesBefore: Number(body.reminderMinutesBefore) }),
        ...(body.receiptFooterNotes && { receiptFooterNotes: body.receiptFooterNotes }),
      },
      create: {
        id: "default-settings",
        salonNameAr: body.salonNameAr || "مجموعة صالونات وسبا الباشا VIP (دقن الباشا & حمام الباشا)",
        salonNameEn: body.salonNameEn || "EL BASHA LUXURY SALON & SPA",
        logoUrl: body.logoUrl || "/dakn-logo.jpg",
        systemLocked: Boolean(body.systemLocked),
        lockMessage: body.lockMessage || "النظام مغلق مؤقتاً لأعمال الصيانة والتطوير الدوري.",
        weeklyDayOff: body.weeklyDayOff || "MONDAY",
        isDayOffEnabled: body.isDayOffEnabled !== undefined ? Boolean(body.isDayOffEnabled) : true,
        dayOffMessage: body.dayOffMessage || "عفواً، صالونات وسبا الباشا في عطلة أسبوعية يوم الإثنين - نتشرف بحجز موعدكم طوال باقي أيام الأسبوع ✂️",
        hotline: body.hotline || "01210103025",
        hadayekPhone: body.hadayekPhone || "01210103025",
        nasrCityPhone: body.nasrCityPhone || "01556782015",
        whatsappNumber: body.whatsappNumber || "01210103025",
        facebookUrl: body.facebookUrl || "https://www.facebook.com/DaknElbashaSalon",
        instagramUrl: body.instagramUrl || "https://www.facebook.com/hammam.elbasha1/",
      },
    });

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
