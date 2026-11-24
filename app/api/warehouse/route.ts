import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Function to generate unique Barcode (format: DKN-XXXXXX)
async function generateUniqueBarcode(): Promise<string> {
  let unique = false;
  let code = "";
  let attempts = 0;
  while (!unique && attempts < 20) {
    attempts++;
    const randomDigits = Math.floor(100000 + Math.random() * 900000); // 6 digits
    code = `DKN-${randomDigits}`;
    const existing = await prisma.product.findFirst({ where: { barcode: code } });
    if (!existing) {
      unique = true;
    }
  }
  return code;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "get_stock";
    const branchId = searchParams.get("branchId");
    const usageType = searchParams.get("usageType"); // RETAIL, CONSUMABLE, ALL
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    // 1. GET CENTRAL & BRANCH STOCK
    if (action === "get_stock") {
      const where: any = { isActive: true };
      if (usageType && usageType !== "ALL") {
        where.usageType = usageType;
      }
      if (branchId && branchId !== "ALL") {
        where.OR = [{ branchId }, { branchId: null }];
      }

      const products = await prisma.product.findMany({
        where,
        include: {
          branch: { select: { id: true, name: true, code: true } },
        },
        orderBy: [{ usageType: "asc" }, { createdAt: "desc" }],
      });

      return NextResponse.json({ success: true, products });
    }

    // 2. GENERATE NEW UNIQUE BARCODE
    if (action === "generate_barcode") {
      const barcode = await generateUniqueBarcode();
      return NextResponse.json({ success: true, barcode });
    }

    // 3. GET PURCHASES & OPENING INVENTORIES
    if (action === "get_purchases") {
      const purchases = await prisma.stockPurchase.findMany({
        include: {
          product: { select: { id: true, nameAr: true, barcode: true, unit: true, usageType: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      return NextResponse.json({ success: true, purchases });
    }

    // 4. GET TRANSFERS FROM CENTRAL WAREHOUSE TO BRANCHES
    if (action === "get_transfers") {
      const transfers = await prisma.stockTransfer.findMany({
        include: {
          product: { select: { id: true, nameAr: true, barcode: true, unit: true, usageType: true } },
          toBranch: { select: { id: true, name: true, code: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      return NextResponse.json({ success: true, transfers });
    }

    // 5. GET DAILY CONSUMPTION LOGS
    if (action === "get_consumptions") {
      const where: any = {};
      if (date && date !== "ALL") {
        where.date = date;
      }
      if (branchId && branchId !== "ALL") {
        where.branchId = branchId;
      }

      const logs = await prisma.materialConsumptionLog.findMany({
        where,
        include: {
          product: { select: { id: true, nameAr: true, barcode: true, unit: true, usageType: true } },
          branch: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 150,
      });
      return NextResponse.json({ success: true, logs });
    }

    // 6. DAILY SMART CONSUMPTION & RESTOCK REORDER REPORT
    if (action === "daily_report") {
      // Fetch all products
      const products = await prisma.product.findMany({
        where: { isActive: true },
        include: { branch: true },
      });

      // Fetch today's consumption logs
      const todayLogs = await prisma.materialConsumptionLog.findMany({
        where: { date },
        include: { product: true, branch: true },
      });

      // Group consumption by product & branch
      const consumptionSummary: Record<string, { product: any; totalConsumed: number; logsCount: number }> = {};
      for (const log of todayLogs) {
        const key = `${log.productId}_${log.branchId}`;
        if (!consumptionSummary[key]) {
          consumptionSummary[key] = {
            product: log.product,
            totalConsumed: 0,
            logsCount: 0,
          };
        }
        consumptionSummary[key].totalConsumed += log.quantityConsumed;
        consumptionSummary[key].logsCount += 1;
      }

      // Identify low stock products (under minStockAlert) in branches or central
      const lowStockAlerts = products
        .filter((p) => p.stockQty <= p.minStockAlert || p.centralStockQty <= p.minStockAlert)
        .map((p) => ({
          id: p.id,
          nameAr: p.nameAr,
          barcode: p.barcode,
          usageType: p.usageType,
          unit: p.unit,
          stockQty: p.stockQty,
          centralStockQty: p.centralStockQty,
          minStockAlert: p.minStockAlert,
          branchName: p.branch?.name || "المخزن العام",
          recommendedAction:
            p.centralStockQty > p.minStockAlert
              ? `صرف فوري من المخزن الرئيسي للفرع (متوفر ${p.centralStockQty})`
              : `طلب شراء واستيراد كمية جديدة من المورد (الرصيد الكلي حرج)`,
        }));

      return NextResponse.json({
        success: true,
        date,
        consumptionSummary: Object.values(consumptionSummary),
        lowStockAlerts,
        totalLogsToday: todayLogs.length,
      });
    }

    return NextResponse.json({ success: false, error: "إجراء غير معروف" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    // 1. CREATE OR UPDATE PRODUCT WITH AUTO/EXISTING BARCODE
    if (action === "save_product") {
      const {
        id,
        nameAr,
        category,
        price,
        costPrice,
        stockQty,
        centralStockQty,
        minStockAlert,
        image,
        barcode,
        barcodeType,
        usageType,
        unit,
        consumptionRule,
        estimatedUsesPerUnit,
        branchId,
      } = body;

      if (!nameAr || !nameAr.trim()) {
        return NextResponse.json({ success: false, error: "اسم الصنف أو الخامة مطلوب" }, { status: 400 });
      }

      let finalBarcode = barcode ? barcode.trim() : null;

      // Handle auto barcode generation if requested and not provided
      if (barcodeType === "AUTO" && (!finalBarcode || finalBarcode === "")) {
        finalBarcode = await generateUniqueBarcode();
      }

      // Check if barcode conflicts with another product
      if (finalBarcode) {
        const duplicate = await prisma.product.findFirst({
          where: {
            barcode: finalBarcode,
            ...(id ? { NOT: { id } } : {}),
          },
        });
        if (duplicate) {
          return NextResponse.json(
            { success: false, error: `الباركود [${finalBarcode}] مسجل بالفعل للصنف (${duplicate.nameAr})` },
            { status: 400 }
          );
        }
      }

      let product;
      if (id) {
        // Update existing
        product = await prisma.product.update({
          where: { id },
          data: {
            nameAr: nameAr.trim(),
            category: category || "STYLING",
            price: Number(price || 0),
            costPrice: Number(costPrice || 0),
            stockQty: Number(stockQty !== undefined ? stockQty : 0),
            centralStockQty: Number(centralStockQty !== undefined ? centralStockQty : 0),
            minStockAlert: Number(minStockAlert || 5),
            image: image?.trim() || null,
            barcode: finalBarcode,
            barcodeType: barcodeType || "AUTO",
            usageType: usageType || "RETAIL",
            unit: unit || "PIECE",
            consumptionRule: consumptionRule ? (typeof consumptionRule === "object" ? JSON.stringify(consumptionRule) : consumptionRule) : null,
            estimatedUsesPerUnit: Number(estimatedUsesPerUnit || 1),
            branchId: branchId || null,
          },
          include: { branch: true },
        });
      } else {
        // Create new
        product = await prisma.product.create({
          data: {
            nameAr: nameAr.trim(),
            category: category || "STYLING",
            price: Number(price || 0),
            costPrice: Number(costPrice || 0),
            stockQty: Number(stockQty !== undefined ? stockQty : 0),
            centralStockQty: Number(centralStockQty !== undefined ? centralStockQty : 0),
            minStockAlert: Number(minStockAlert || 5),
            image: image?.trim() || null,
            barcode: finalBarcode,
            barcodeType: barcodeType || "AUTO",
            usageType: usageType || "RETAIL",
            unit: unit || "PIECE",
            consumptionRule: consumptionRule ? (typeof consumptionRule === "object" ? JSON.stringify(consumptionRule) : consumptionRule) : null,
            estimatedUsesPerUnit: Number(estimatedUsesPerUnit || 1),
            branchId: branchId || null,
            isActive: true,
          },
          include: { branch: true },
        });
      }

      return NextResponse.json({ success: true, product });
    }

    // 2. STOCK-IN: PURCHASES & OPENING INVENTORY BALANCE (جرد أول المدة أو فاتورة شراء جديدة)
    if (action === "stock_in") {
      const {
        productId,
        type, // "OPENING_BALANCE" or "PURCHASE"
        invoiceNumber,
        supplierName,
        quantity,
        costPrice,
        destination, // "CENTRAL" or branchId
        notes,
        recordedBy,
      } = body;

      const qty = Number(quantity || 0);
      const cost = Number(costPrice || 0);

      if (!productId || qty <= 0) {
        return NextResponse.json({ success: false, error: "بيانات الصنف والكمية المضافة مطلوبة" }, { status: 400 });
      }

      const invNum = invoiceNumber || (type === "OPENING_BALANCE" ? `OPEN-BAL-${Date.now().toString().slice(-6)}` : `PUR-${Date.now().toString().slice(-6)}`);

      // 1. Create StockPurchase record
      const purchase = await prisma.stockPurchase.create({
        data: {
          invoiceNumber: invNum,
          type: type || "PURCHASE",
          supplierName: supplierName || (type === "OPENING_BALANCE" ? "جرد رصيد أول المدة" : "مورد معتمد"),
          productId,
          quantity: qty,
          costPrice: cost,
          totalCost: qty * cost,
          destination: destination || "CENTRAL",
          notes: notes || null,
          recordedBy: recordedBy || "مسئول المخزن العام",
        },
        include: { product: true },
      });

      // 2. Update Product Inventory
      if (!destination || destination === "CENTRAL") {
        await prisma.product.update({
          where: { id: productId },
          data: {
            centralStockQty: { increment: qty },
            ...(cost > 0 ? { costPrice: cost } : {}),
          },
        });
      } else {
        await prisma.product.update({
          where: { id: productId },
          data: {
            stockQty: { increment: qty },
            branchId: destination,
            ...(cost > 0 ? { costPrice: cost } : {}),
          },
        });
      }

      return NextResponse.json({ success: true, purchase });
    }

    // 3. TRANSFER FROM CENTRAL WAREHOUSE TO BRANCH (تحويل وصرف للفروع)
    if (action === "transfer") {
      const {
        productId,
        toBranchId,
        quantity,
        dispatchedBy,
        receivedBy,
        notes,
      } = body;

      const qty = Number(quantity || 0);
      if (!productId || !toBranchId || qty <= 0) {
        return NextResponse.json({ success: false, error: "يرجى تحديد الصنف والفرع والكمية المراد تحويلها" }, { status: 400 });
      }

      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) {
        return NextResponse.json({ success: false, error: "الصنف غير موجود" }, { status: 404 });
      }

      if (product.centralStockQty < qty) {
        return NextResponse.json(
          {
            success: false,
            error: `الرصيد المتاح بالمخزن العام (${product.centralStockQty} ${product.unit}) لا يكفي لتحويل كمية (${qty})`,
          },
          { status: 400 }
        );
      }

      const transferNum = `TRF-${Date.now().toString().slice(-6)}`;

      // 1. Create transfer record
      const transfer = await prisma.stockTransfer.create({
        data: {
          transferNumber: transferNum,
          productId,
          toBranchId,
          quantity: qty,
          status: "COMPLETED",
          dispatchedBy: dispatchedBy || "مسئول المخزن العام",
          receivedBy: receivedBy || "كاشير / مدير الفرع",
          notes: notes || null,
        },
        include: { product: true, toBranch: true },
      });

      // 2. Decrement Central Warehouse & Increment Branch Stock
      await prisma.product.update({
        where: { id: productId },
        data: {
          centralStockQty: { decrement: qty },
          stockQty: { increment: qty },
          branchId: toBranchId, // link or associate
        },
      });

      return NextResponse.json({ success: true, transfer });
    }

    // 4. SMART MATERIAL CONSUMPTION (استهلاك خامات يدوي أو فتح عبوة على محطة العمل)
    if (action === "consume_material") {
      const {
        productId,
        branchId,
        quantity,
        type, // "OPEN_STATION_BOTTLE" or "MANUAL_DEPLETION"
        specialistId,
        serviceName,
        notes,
      } = body;

      const qty = Number(quantity || 1);
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) {
        return NextResponse.json({ success: false, error: "الخامة غير موجودة" }, { status: 404 });
      }

      const today = new Date().toISOString().split("T")[0];

      if (type === "OPEN_STATION_BOTTLE") {
        // Handover sealed bottle to station: Decrement 1 from stockQty, increment 1 to currentOpenedUnits
        if (product.stockQty < qty) {
          return NextResponse.json({ success: false, error: "رصيد العبوات المقفولة بالفرع غير كافي" }, { status: 400 });
        }

        await prisma.product.update({
          where: { id: productId },
          data: {
            stockQty: { decrement: qty },
            currentOpenedUnits: { increment: qty },
          },
        });

        const log = await prisma.materialConsumptionLog.create({
          data: {
            productId,
            branchId: branchId || product.branchId || "cmw8ihkr90000mon7wb3kmpx3",
            specialistId: specialistId || null,
            serviceName: serviceName || "صرف عبوة عمل لمحطة الخدمة / الكرسي",
            quantityConsumed: qty,
            unit: product.unit || "عبوة",
            reason: "MANUAL_STATION_HANDOVER",
            date: today,
            notes: notes || `تم فتح وصرف ${qty} عبوة جديدة للعمل المباشر`,
          },
        });

        return NextResponse.json({ success: true, log, message: "تم صرف العبوة بنجاح وبدء استهلاكها" });
      } else {
        // Direct quantity depletion (e.g. blades, doses)
        const updated = await prisma.product.update({
          where: { id: productId },
          data: {
            stockQty: { decrement: qty },
          },
        });

        const log = await prisma.materialConsumptionLog.create({
          data: {
            productId,
            branchId: branchId || product.branchId || "cmw8ihkr90000mon7wb3kmpx3",
            specialistId: specialistId || null,
            serviceName: serviceName || "استهلاك خامات تشغيل",
            quantityConsumed: qty,
            unit: product.unit || "قطعة",
            reason: "MANUAL_DEPLETION",
            date: today,
            notes: notes || null,
          },
        });

        return NextResponse.json({ success: true, log, updatedStock: updated.stockQty });
      }
    }

    return NextResponse.json({ success: false, error: "إجراء غير معروف" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
