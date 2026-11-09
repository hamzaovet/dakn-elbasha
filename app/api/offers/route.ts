import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const activeOnly = searchParams.get("activeOnly") !== "false";

    const where: any = {};
    if (activeOnly) {
      where.isActive = true;
    }

    if (branchId && branchId !== "ALL") {
      where.OR = [{ branchId }, { branchId: null }];
    }

    const offers = await prisma.offer.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        branch: { select: { id: true, name: true, code: true } },
      },
    });

    return NextResponse.json({ success: true, offers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      titleAr,
      badge,
      price,
      oldPrice,
      discountPercent,
      image,
      description,
      features,
      branchId,
      isActive,
      sortOrder,
    } = body;

    if (!titleAr || price === undefined) {
      return NextResponse.json(
        { success: false, error: "عنوان العرض والسعر مطلوبان" },
        { status: 400 }
      );
    }

    const offer = await prisma.offer.create({
      data: {
        titleAr: titleAr.trim(),
        badge: badge?.trim() || null,
        price: Number(price),
        oldPrice: oldPrice ? Number(oldPrice) : null,
        discountPercent: discountPercent ? Number(discountPercent) : null,
        image: image?.trim() || "/offers/offer-vip-1000.jpg",
        description: description?.trim() || null,
        features: Array.isArray(features) ? JSON.stringify(features) : features || "[]",
        branchId: branchId || null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        sortOrder: sortOrder ? Number(sortOrder) : 0,
      },
    });

    return NextResponse.json({ success: true, offer });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      titleAr,
      badge,
      price,
      oldPrice,
      discountPercent,
      image,
      description,
      features,
      branchId,
      isActive,
      sortOrder,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "معرف العرض مطلوب" }, { status: 400 });
    }

    const offer = await prisma.offer.update({
      where: { id },
      data: {
        ...(titleAr !== undefined && { titleAr: titleAr.trim() }),
        ...(badge !== undefined && { badge: badge?.trim() || null }),
        ...(price !== undefined && { price: Number(price) }),
        ...(oldPrice !== undefined && { oldPrice: oldPrice ? Number(oldPrice) : null }),
        ...(discountPercent !== undefined && { discountPercent: discountPercent ? Number(discountPercent) : null }),
        ...(image !== undefined && { image: image?.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(features !== undefined && {
          features: Array.isArray(features) ? JSON.stringify(features) : features,
        }),
        ...(branchId !== undefined && { branchId: branchId || null }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
      },
    });

    return NextResponse.json({ success: true, offer });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "معرف العرض مطلوب" }, { status: 400 });
    }

    await prisma.offer.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "تم حذف العرض بنجاح" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
