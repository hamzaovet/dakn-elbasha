import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const category = searchParams.get("category");
    const includeInactive = searchParams.get("includeInactive") === "true";

    const where: any = {};
    if (!includeInactive) {
      where.isActive = true;
    }
    if (branchId && branchId !== "ALL") {
      where.OR = [{ branchId }, { branchId: null }];
    }
    if (category && category !== "ALL") {
      where.category = category;
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        branch: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nameAr, category, price, costPrice, stockQty, minStockAlert, image, barcode, branchId } = body;

    if (!nameAr) {
      return NextResponse.json(
        { success: false, error: "اسم المنتج أو الخامة مطلوب" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        nameAr: nameAr.trim(),
        category: category || "STYLING",
        price: Number(price !== undefined && price !== "" ? price : 0),
        costPrice: Number(costPrice !== undefined && costPrice !== "" ? costPrice : 0),
        stockQty: Number(stockQty !== undefined && stockQty !== "" ? stockQty : 10),
        minStockAlert: Number(minStockAlert !== undefined && minStockAlert !== "" ? minStockAlert : 5),
        image: image?.trim() || null,
        barcode: barcode?.trim() || null,
        branchId: branchId || null,
        isActive: true,
      },
      include: {
        branch: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, nameAr, category, price, costPrice, stockQty, minStockAlert, image, barcode, branchId, isActive } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "معرف المنتج مطلوب" }, { status: 400 });
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(nameAr && { nameAr: nameAr.trim() }),
        ...(category && { category }),
        ...(price !== undefined && { price: Number(price) }),
        ...(costPrice !== undefined && { costPrice: Number(costPrice) }),
        ...(stockQty !== undefined && { stockQty: Number(stockQty) }),
        ...(minStockAlert !== undefined && { minStockAlert: Number(minStockAlert) }),
        ...(image !== undefined && { image: image?.trim() || null }),
        ...(barcode !== undefined && { barcode: barcode?.trim() || null }),
        ...(branchId !== undefined && { branchId: branchId || null }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
      include: {
        branch: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "معرف المنتج مطلوب" }, { status: 400 });
    }

    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "تم حذف المنتج بنجاح" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
