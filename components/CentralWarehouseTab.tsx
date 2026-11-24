"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Package,
  Plus,
  Search,
  Barcode,
  Printer,
  ArrowRightLeft,
  Truck,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit,
  Download,
  Activity,
  Layers,
  Wrench,
  Clock,
  Sparkles,
  ShoppingBag,
  Scissors,
  Check,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { generateCode128Svg } from "@/lib/barcode-svg";

interface Branch {
  id: string;
  name: string;
  code: string;
}

interface Product {
  id: string;
  nameAr: string;
  category: string;
  price: number;
  costPrice: number;
  stockQty: number;
  centralStockQty: number;
  minStockAlert: number;
  image: string | null;
  barcode: string | null;
  barcodeType: "AUTO" | "EXISTING";
  usageType: "RETAIL" | "CONSUMABLE";
  unit: string;
  currentOpenedUnits: number;
  estimatedUsesPerUnit: number;
  branchId: string | null;
  branch?: { id: string; name: string; code: string } | null;
  createdAt: string;
}

interface CentralWarehouseTabProps {
  branches: Branch[];
  activeBranchId: string;
  userRole?: string;
  isWomenTheme?: boolean;
  onRefreshData?: () => Promise<void>;
}

export default function CentralWarehouseTab({
  branches,
  activeBranchId,
  userRole = "owner",
  isWomenTheme = false,
  onRefreshData,
}: CentralWarehouseTabProps) {
  // Navigation sub-tabs
  const [subTab, setSubTab] = useState<
    "inventory" | "labels" | "purchases" | "transfers" | "consumption"
  >("inventory");

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [consumptionLogs, setConsumptionLogs] = useState<any[]>([]);
  const [dailyReport, setDailyReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [usageFilter, setUsageFilter] = useState<"ALL" | "RETAIL" | "CONSUMABLE">("ALL");
  const [branchFilter, setBranchFilter] = useState<string>("ALL");

  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showStockInModal, setShowStockInModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showConsumptionModal, setShowConsumptionModal] = useState(false);
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);

  // Sticker Print State
  const [selectedProductForLabel, setSelectedProductForLabel] = useState<Product | null>(null);
  const [labelPrintQty, setLabelPrintQty] = useState<number>(1);
  const printLabelAreaRef = useRef<HTMLDivElement>(null);

  // Product Form
  const [productForm, setProductForm] = useState({
    nameAr: "",
    category: "STYLING",
    usageType: "RETAIL" as "RETAIL" | "CONSUMABLE",
    unit: "قطعة",
    barcodeType: "AUTO" as "AUTO" | "EXISTING",
    barcode: "",
    price: 150,
    costPrice: 80,
    centralStockQty: 50,
    stockQty: 10,
    minStockAlert: 10,
    estimatedUsesPerUnit: 1,
    branchId: "",
    image: "",
  });

  // Stock In Form (Purchase / Opening Balance)
  const [stockInForm, setStockInForm] = useState({
    productId: "",
    type: "PURCHASE" as "PURCHASE" | "OPENING_BALANCE",
    invoiceNumber: "",
    supplierName: "",
    quantity: 10,
    costPrice: 0,
    destination: "CENTRAL",
    notes: "",
    recordedBy: "مسئول المخزن",
  });

  // Transfer Form
  const [transferForm, setTransferForm] = useState({
    productId: "",
    toBranchId: "",
    quantity: 5,
    dispatchedBy: "مسئول المخزن العام",
    receivedBy: "",
    notes: "",
  });

  // Station Handover / Consumable Depletion Form
  const [consumptionForm, setConsumptionForm] = useState({
    productId: "",
    branchId: "",
    type: "OPEN_STATION_BOTTLE" as "OPEN_STATION_BOTTLE" | "MANUAL_DEPLETION",
    quantity: 1,
    serviceName: "صرف عبوة للكرسي / محطة العمل",
    notes: "",
  });

  // Notification Toast
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch all warehouse data
  const loadWarehouseData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Products
      const resP = await fetch("/api/warehouse?action=get_stock&usageType=ALL&branchId=ALL");
      const dataP = await resP.json();
      if (dataP.success) {
        setProducts(dataP.products || []);
        if (dataP.products.length > 0 && !selectedProductForLabel) {
          setSelectedProductForLabel(dataP.products[0]);
        }
      }

      // 2. Fetch Purchases
      const resPur = await fetch("/api/warehouse?action=get_purchases");
      const dataPur = await resPur.json();
      if (dataPur.success) setPurchases(dataPur.purchases || []);

      // 3. Fetch Transfers
      const resTrf = await fetch("/api/warehouse?action=get_transfers");
      const dataTrf = await resTrf.json();
      if (dataTrf.success) setTransfers(dataTrf.transfers || []);

      // 4. Fetch Consumption Logs
      const resCons = await fetch("/api/warehouse?action=get_consumptions&date=ALL");
      const dataCons = await resCons.json();
      if (dataCons.success) setConsumptionLogs(dataCons.logs || []);

      // 5. Fetch Daily Report
      const resRep = await fetch("/api/warehouse?action=daily_report");
      const dataRep = await resRep.json();
      if (dataRep.success) setDailyReport(dataRep);
    } catch {
      showToast("error", "تعذر تحميل بيانات المخزن العام");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWarehouseData();
  }, []);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (usageFilter !== "ALL" && p.usageType !== usageFilter) return false;
      if (branchFilter !== "ALL" && p.branchId !== branchFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mName = p.nameAr?.toLowerCase().includes(q);
        const mCode = p.barcode?.toLowerCase().includes(q);
        const mCat = p.category?.toLowerCase().includes(q);
        if (!mName && !mCode && !mCat) return false;
      }
      return true;
    });
  }, [products, usageFilter, branchFilter, searchQuery]);

  // KPIs
  const totalStockItems = products.length;
  const retailItemsCount = products.filter((p) => p.usageType === "RETAIL").length;
  const consumableItemsCount = products.filter((p) => p.usageType === "CONSUMABLE").length;
  const criticalItemsCount = products.filter(
    (p) => (p.centralStockQty || 0) <= (p.minStockAlert || 5) || (p.stockQty || 0) <= (p.minStockAlert || 5)
  ).length;

  // Handle Generate Unique Barcode
  const handleGenerateBarcode = async () => {
    try {
      const res = await fetch("/api/warehouse?action=generate_barcode");
      const data = await res.json();
      if (data.success && data.barcode) {
        setProductForm((prev) => ({ ...prev, barcode: data.barcode, barcodeType: "AUTO" }));
        showToast("info", `تم توليد باركود فريد بنجاح: [${data.barcode}]`);
      }
    } catch {
      showToast("error", "فشل توليد الباركود");
    }
  };

  // Open Add Product Modal
  const handleOpenAddProduct = async () => {
    setEditingProduct(null);
    let initialBarcode = "";
    try {
      const res = await fetch("/api/warehouse?action=generate_barcode");
      const data = await res.json();
      if (data.success && data.barcode) initialBarcode = data.barcode;
    } catch {}

    setProductForm({
      nameAr: "",
      category: "STYLING",
      usageType: "RETAIL",
      unit: "قطعة",
      barcodeType: "AUTO",
      barcode: initialBarcode,
      price: 150,
      costPrice: 80,
      centralStockQty: 50,
      stockQty: 10,
      minStockAlert: 10,
      estimatedUsesPerUnit: 1,
      branchId: activeBranchId !== "ALL" ? activeBranchId : "",
      image: "",
    });
    setShowProductModal(true);
  };

  // Open Edit Product Modal
  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProductForm({
      nameAr: prod.nameAr || "",
      category: prod.category || "STYLING",
      usageType: prod.usageType || "RETAIL",
      unit: prod.unit || "قطعة",
      barcodeType: prod.barcodeType || "AUTO",
      barcode: prod.barcode || "",
      price: prod.price || 0,
      costPrice: prod.costPrice || 0,
      centralStockQty: prod.centralStockQty || 0,
      stockQty: prod.stockQty || 0,
      minStockAlert: prod.minStockAlert || 5,
      estimatedUsesPerUnit: prod.estimatedUsesPerUnit || 1,
      branchId: prod.branchId || "",
      image: prod.image || "",
    });
    setShowProductModal(true);
  };

  // Save Product (Create or Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.nameAr.trim()) {
      showToast("error", "اسم الصنف أو الخامة مطلوب");
      return;
    }

    try {
      const res = await fetch("/api/warehouse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_product",
          id: editingProduct?.id,
          ...productForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", editingProduct ? "تم تحديث الصنف بنجاح" : "تم حفظ وتكويد الصنف بنجاح");
        setShowProductModal(false);
        await loadWarehouseData();
        if (onRefreshData) await onRefreshData();
      } else {
        showToast("error", data.error || "فشل حفظ الصنف");
      }
    } catch {
      showToast("error", "خطأ في الاتصال بالخادم");
    }
  };

  // Save Stock-In (Purchase / Opening Balance)
  const handleSaveStockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockInForm.productId || stockInForm.quantity <= 0) {
      showToast("error", "يرجى اختيار الصنف وتحديد كمية صحيحة");
      return;
    }

    try {
      const res = await fetch("/api/warehouse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "stock_in",
          ...stockInForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", "تم تسجيل إذن الإضافة وتحديث رصيد المخزن بنجاح");
        setShowStockInModal(false);
        await loadWarehouseData();
        if (onRefreshData) await onRefreshData();
      } else {
        showToast("error", data.error || "فشل تسجيل إذن الإضافة");
      }
    } catch {
      showToast("error", "خطأ في الاتصال بالخادم");
    }
  };

  // Save Transfer to Branch
  const handleSaveTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferForm.productId || !transferForm.toBranchId || transferForm.quantity <= 0) {
      showToast("error", "يرجى تحديد الصنف والفرع والكمية المراد صرفها");
      return;
    }

    try {
      const res = await fetch("/api/warehouse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "transfer",
          ...transferForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", "تم صرف وتحويل الكمية للفرع بنجاح");
        setShowTransferModal(false);
        await loadWarehouseData();
        if (onRefreshData) await onRefreshData();
      } else {
        showToast("error", data.error || "فشل تحويل الكمية");
      }
    } catch {
      showToast("error", "خطأ في الاتصال بالخادم");
    }
  };

  // Save Material Consumption (Handover / Depletion)
  const handleSaveConsumption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consumptionForm.productId) {
      showToast("error", "يرجى اختيار الخامة المستهلكة");
      return;
    }

    try {
      const res = await fetch("/api/warehouse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "consume_material",
          ...consumptionForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", "تم تسجيل استهلاك الخامة وتحديث الأرصدة بنجاح");
        setShowConsumptionModal(false);
        await loadWarehouseData();
        if (onRefreshData) await onRefreshData();
      } else {
        showToast("error", data.error || "فشل تسجيل الاستهلاك");
      }
    } catch {
      showToast("error", "خطأ في الاتصال بالخادم");
    }
  };

  // Execute Thermal Label Print for Xprinter (50x30mm)
  const handlePrintLabels = () => {
    if (!selectedProductForLabel || !selectedProductForLabel.barcode) {
      showToast("error", "هذا الصنف ليس لديه باركود للطباعة!");
      return;
    }

    const printWin = window.open("", "_blank", "width=400,height=500");
    if (!printWin) {
      showToast("error", "يرجى السماح بالنوافذ المنبثقة للطباعة");
      return;
    }

    const barcodeSvg = generateCode128Svg(selectedProductForLabel.barcode, {
      height: 48,
      moduleWidth: 2,
      includeText: true,
      fontSize: 12,
    });

    const isConsumable = selectedProductForLabel.usageType === "CONSUMABLE";
    const subText = isConsumable
      ? `خامة تشغيل — ${selectedProductForLabel.unit || "قطعة"}`
      : `${selectedProductForLabel.price} ج.م`;

    let labelsHtml = "";
    for (let i = 0; i < labelPrintQty; i++) {
      labelsHtml += `
        <div class="label-page">
          <div class="label-box">
            <div class="salon-name">صالونات وسبا الباشا VIP 👑</div>
            <div class="product-name">${selectedProductForLabel.nameAr}</div>
            <div class="barcode-container">
              ${barcodeSvg}
            </div>
            <div class="price-tag">${subText}</div>
          </div>
        </div>
      `;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <title>طباعة استيكر باركود Xprinter</title>
        <style>
          @page {
            size: 50mm 30mm;
            margin: 0;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
          }
          body {
            background: #fff;
            color: #000;
          }
          .label-page {
            width: 50mm;
            height: 30mm;
            page-break-after: always;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            padding: 1.5mm;
          }
          .label-box {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            text-align: center;
          }
          .salon-name {
            font-size: 7.5pt;
            font-weight: 900;
            letter-spacing: -0.2px;
            white-space: nowrap;
          }
          .product-name {
            font-size: 8pt;
            font-weight: 800;
            line-height: 1.1;
            max-height: 2.2em;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: normal;
          }
          .barcode-container {
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 1mm 0;
          }
          .barcode-container svg {
            max-width: 95%;
            height: 12mm;
          }
          .price-tag {
            font-size: 8.5pt;
            font-weight: 900;
          }
        </style>
      </head>
      <body>
        ${labelsHtml}
        <script>
          window.onload = function() {
            window.focus();
            window.print();
            setTimeout(function() { window.close(); }, 1500);
          };
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans" dir="rtl">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 left-6 z-50 p-4 rounded-2xl shadow-2xl flex items-center gap-3 border text-sm font-bold backdrop-blur-md transition-all duration-300 animate-slide-up ${
            toast.type === "success"
              ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-200"
              : toast.type === "error"
              ? "bg-rose-950/90 border-rose-500/40 text-rose-200"
              : "bg-amber-950/90 border-amber-500/40 text-amber-200"
          }`}
        >
          {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          {toast.type === "error" && <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />}
          {toast.type === "info" && <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header & Fast Diagnostic Button */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-black/40 to-slate-900/60 border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <span>منظومة المخزن العام وتكويد وطباعة الباركود Xprinter 👑</span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                VIP Multi-Branch Warehouse
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              إدارة مخزون البضائع للبيع وخامات التشغيل، جرد أول المدة، أذونات الصرف والتحويل، وتوليد وطباعة استيكرات الباركود للطابعة الحرارية Xprinter 🖨️
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowDiagnosticModal(true)}
            className="py-2.5 px-3.5 rounded-2xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-400/30 text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-md"
            title="فحص وإصلاح أعطال طابعة Xprinter"
          >
            <Wrench className="w-4 h-4 text-cyan-400" />
            <span>🛠️ فحص طابعة Xprinter</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddProduct}
            className="py-2.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>تكويد وإضافة صنف جديد ➕</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-3xl bg-[#14141e] border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-bold block">إجمالي الأصناف المسجلة</span>
            <span className="text-xl font-black text-white font-mono">{totalStockItems}</span>
          </div>
          <Layers className="w-7 h-7 text-amber-400/50" />
        </div>

        <div className="p-4 rounded-3xl bg-[#14141e] border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-bold block">منتجات بيع للعملاء (Retail)</span>
            <span className="text-xl font-black text-emerald-400 font-mono">{retailItemsCount}</span>
          </div>
          <ShoppingBag className="w-7 h-7 text-emerald-400/50" />
        </div>

        <div className="p-4 rounded-3xl bg-[#14141e] border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-bold block">خامات تشغيل واستهلاك</span>
            <span className="text-xl font-black text-cyan-400 font-mono">{consumableItemsCount}</span>
          </div>
          <Scissors className="w-7 h-7 text-cyan-400/50" />
        </div>

        <div className="p-4 rounded-3xl bg-[#14141e] border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-bold block">أصناف حرجة تحت حد الأمان</span>
            <span className={`text-xl font-black font-mono ${criticalItemsCount > 0 ? "text-rose-400" : "text-slate-400"}`}>
              {criticalItemsCount}
            </span>
          </div>
          <AlertTriangle className={`w-7 h-7 ${criticalItemsCount > 0 ? "text-rose-400" : "text-slate-600"}`} />
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-black/50 rounded-2xl border border-white/10 overflow-x-auto">
        <button
          type="button"
          onClick={() => setSubTab("inventory")}
          className={`py-2 px-4 rounded-xl text-xs font-black transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            subTab === "inventory"
              ? "bg-amber-500 text-slate-950 shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Package className="w-4 h-4" />
          <span>📦 كشف الأصناف والمخزون العام</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("labels")}
          className={`py-2 px-4 rounded-xl text-xs font-black transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            subTab === "labels"
              ? "bg-amber-500 text-slate-950 shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Barcode className="w-4 h-4" />
          <span>🏷️ مصمم واستيكرات باركود Xprinter</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("purchases")}
          className={`py-2 px-4 rounded-xl text-xs font-black transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            subTab === "purchases"
              ? "bg-amber-500 text-slate-950 shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>📥 أذونات الإضافة ورصيد أول المدة</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("transfers")}
          className={`py-2 px-4 rounded-xl text-xs font-black transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            subTab === "transfers"
              ? "bg-amber-500 text-slate-950 shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>🚚 التحويلات والصرف للفروع</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("consumption")}
          className={`py-2 px-4 rounded-xl text-xs font-black transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            subTab === "consumption"
              ? "bg-amber-500 text-slate-950 shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>📊 تقرير الاستهلاك اليومي الذكي</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SUB-TAB 1: PRODUCTS & STOCKS LIST
         ───────────────────────────────────────────────────────────── */}
      {subTab === "inventory" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-2xl border border-white/10 flex-wrap">
              <button
                type="button"
                onClick={() => setUsageFilter("ALL")}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                  usageFilter === "ALL" ? "bg-amber-500 text-slate-950 font-black shadow-md" : "text-slate-400 hover:text-white"
                }`}
              >
                الكل ({products.length})
              </button>
              <button
                type="button"
                onClick={() => setUsageFilter("RETAIL")}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  usageFilter === "RETAIL" ? "bg-amber-500 text-slate-950 font-black shadow-md" : "text-slate-400 hover:text-white"
                }`}
              >
                <span>🛍️ بضاعة بيع للعملاء</span>
                <span className="font-mono text-[10px]">({retailItemsCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setUsageFilter("CONSUMABLE")}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  usageFilter === "CONSUMABLE" ? "bg-amber-500 text-slate-950 font-black shadow-md" : "text-slate-400 hover:text-white"
                }`}
              >
                <span>💈 خامات تشغيل واستهلاك</span>
                <span className="font-mono text-[10px]">({consumableItemsCount})</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث باسم الصنف أو الباركود..."
                  className="w-full py-2 pr-9 pl-3 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-sans"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowStockInModal(true)}
                className="py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إذن إضافة / شراء 📥</span>
              </button>

              <button
                type="button"
                onClick={() => setShowTransferModal(true)}
                className="py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>صرف للفرع 🚚</span>
              </button>
            </div>
          </div>

          {/* Table of Products */}
          <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#14141e]">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-black/40 text-slate-400 font-bold">
                  <th className="p-3.5">الصنف</th>
                  <th className="p-3.5">الباركود</th>
                  <th className="p-3.5">النوع والوحدة</th>
                  <th className="p-3.5">رصيد المخزن العام</th>
                  <th className="p-3.5">رصيد الفروع</th>
                  <th className="p-3.5">قيد الاستخدام بالصالون</th>
                  <th className="p-3.5">سعر البيع / التكلفة</th>
                  <th className="p-3.5 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProducts.map((p) => {
                  const isLowCentral = (p.centralStockQty || 0) <= (p.minStockAlert || 5);
                  const isLowBranch = (p.stockQty || 0) <= (p.minStockAlert || 5);

                  return (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition">
                      <td className="p-3.5 font-bold text-white flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-black/60 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                          {p.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.image} alt={p.nameAr} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-4 h-4 text-amber-400/60" />
                          )}
                        </div>
                        <div>
                          <span className="block">{p.nameAr}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{p.category}</span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        {p.barcode ? (
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20 w-fit">
                            <Barcode className="w-3.5 h-3.5" />
                            <span>{p.barcode}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500">بدون باركود</span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            p.usageType === "CONSUMABLE"
                              ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                              : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                          }`}
                        >
                          {p.usageType === "CONSUMABLE" ? "خامة تشغيل" : "بيع زبائن"} ({p.unit || "قطعة"})
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`font-mono font-black text-xs px-2 py-0.5 rounded-lg border ${
                            isLowCentral ? "bg-rose-500/20 text-rose-300 border-rose-500/30" : "bg-black/40 text-white border-white/10"
                          }`}
                        >
                          {p.centralStockQty || 0} {p.unit || "قطعة"}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`font-mono font-bold text-xs px-2 py-0.5 rounded-lg border ${
                            isLowBranch ? "bg-amber-500/20 text-amber-300 border-amber-500/30" : "bg-black/40 text-slate-300 border-white/10"
                          }`}
                        >
                          {p.stockQty || 0} {p.unit || "قطعة"}
                        </span>
                      </td>

                      <td className="p-3.5">
                        {p.usageType === "CONSUMABLE" ? (
                          <span className="font-mono text-cyan-300 font-bold bg-cyan-950/40 px-2 py-0.5 rounded-lg border border-cyan-500/30">
                            {p.currentOpenedUnits || 0} عبوة مفتوحة
                          </span>
                        ) : (
                          <span className="text-slate-600 font-mono">-</span>
                        )}
                      </td>

                      <td className="p-3.5">
                        {p.usageType === "RETAIL" ? (
                          <div>
                            <span className="font-mono font-black text-amber-400 block">{p.price} ج.م</span>
                            <span className="text-[10px] text-slate-500 font-mono">تكلفة: {p.costPrice || 0} ج.م</span>
                          </div>
                        ) : (
                          <span className="font-mono text-slate-300">تكلفة: {p.costPrice || 0} ج.م</span>
                        )}
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProductForLabel(p);
                              setSubTab("labels");
                            }}
                            className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition cursor-pointer"
                            title="طباعة استيكر باركود Xprinter"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditProduct(p)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition cursor-pointer"
                            title="تعديل بيانات الصنف"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {p.usageType === "CONSUMABLE" && (
                            <button
                              type="button"
                              onClick={() => {
                                setConsumptionForm({
                                  productId: p.id,
                                  branchId: p.branchId || activeBranchId,
                                  type: "OPEN_STATION_BOTTLE",
                                  quantity: 1,
                                  serviceName: "صرف عبوة للكرسي / محطة العمل",
                                  notes: "",
                                });
                                setShowConsumptionModal(true);
                              }}
                              className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition cursor-pointer"
                              title="صرف عبوة جديدة لمحطة العمل بالصالون"
                            >
                              <Scissors className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SUB-TAB 2: XPRINTER BARCODE STICKER DESIGNER & PRINT
         ───────────────────────────────────────────────────────────── */}
      {subTab === "labels" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Settings & Selection */}
          <div className="p-5 rounded-3xl bg-[#14141e] border border-amber-500/25 space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Printer className="w-4 h-4 text-amber-400" />
              <span>إعدادات طباعة استيكر Xprinter (50x30 ملم)</span>
            </h3>

            {/* Select Product */}
            <div>
              <label className="text-xs text-slate-300 font-bold block mb-1">اختر الصنف المراد طباعة باركوده:</label>
              <select
                value={selectedProductForLabel?.id || ""}
                onChange={(e) => {
                  const sel = products.find((p) => p.id === e.target.value);
                  if (sel) setSelectedProductForLabel(sel);
                }}
                className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-bold"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nameAr} [{p.barcode || "بدون باركود"}]
                  </option>
                ))}
              </select>
            </div>

            {/* Print Quantity */}
            <div>
              <label className="text-xs text-slate-300 font-bold block mb-1">عدد الاستيكرات المراد طباعتها:</label>
              <div className="flex items-center gap-2">
                {[1, 5, 10, 20, 50].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setLabelPrintQty(q)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-mono font-bold transition border cursor-pointer ${
                      labelPrintQty === q
                        ? "bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md"
                        : "bg-black/40 text-slate-300 border-white/10 hover:border-amber-400/40"
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrintLabels}
              disabled={!selectedProductForLabel?.barcode}
              className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>إرسال أمر الطباعة لطابعة Xprinter 🖨️ ({labelPrintQty} ملصق)</span>
            </button>

            <div className="p-3 rounded-2xl bg-black/40 border border-white/5 text-[11px] text-slate-400 space-y-1">
              <span className="font-bold text-amber-300 block">💡 إرشادات طابعة Xprinter:</span>
              <p>• مقاس الاستيكر المعياري المظبوط برمجياً هو 50 مم × 30 مم (أو 40 × 25 مم).</p>
              <p>• إذا تخطت الطابعة الاستيكرات، اضغط على زر فحص الطابعة لمعايرة حساس الفواصل (Gap Sensor) بضغطة واحدة.</p>
            </div>
          </div>

          {/* Live Thermal Sticker Preview */}
          <div className="md:col-span-2 p-6 rounded-3xl bg-[#14141e] border border-white/10 flex flex-col items-center justify-center space-y-4">
            <span className="text-xs font-bold text-slate-400">معاينة استيكر الباركود الحراري (Thermal Preview):</span>

            {selectedProductForLabel ? (
              <div
                ref={printLabelAreaRef}
                className="w-72 h-44 bg-white text-black p-3 rounded-2xl shadow-2xl border-4 border-slate-700 flex flex-col justify-between items-center text-center select-none"
              >
                <div className="w-full text-center">
                  <span className="text-[11px] font-black block tracking-tight">صالونات وسبا الباشا VIP 👑</span>
                  <span className="text-xs font-black block truncate mt-0.5">{selectedProductForLabel.nameAr}</span>
                </div>

                {/* Barcode SVG */}
                <div className="w-full flex items-center justify-center my-1">
                  {selectedProductForLabel.barcode ? (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: generateCode128Svg(selectedProductForLabel.barcode, {
                          height: 42,
                          moduleWidth: 1.8,
                          includeText: true,
                          fontSize: 11,
                        }),
                      }}
                      className="w-full flex justify-center"
                    />
                  ) : (
                    <span className="text-xs text-rose-600 font-bold">لا يوجد باركود مسجل لهذا الصنف</span>
                  )}
                </div>

                {/* Price or Type */}
                <div className="w-full text-center">
                  <span className="text-xs font-black">
                    {selectedProductForLabel.usageType === "CONSUMABLE"
                      ? `خامات تشغيل — ${selectedProductForLabel.unit || "قطعة"}`
                      : `${selectedProductForLabel.price} ج.م`}
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-xs text-slate-500">اختر صنفاً للمعاينة</span>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SUB-TAB 3: PURCHASES & OPENING INVENTORY LOGS
         ───────────────────────────────────────────────────────────── */}
      {subTab === "purchases" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black text-white">سجل فواتير المشتريات وجرد رصيد أول المدة</h3>
            <button
              type="button"
              onClick={() => setShowStockInModal(true)}
              className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إذن إضافة / فاتورة شراء جديدة ➕</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#14141e]">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-black/40 text-slate-400 font-bold">
                  <th className="p-3.5">رقم الإذن</th>
                  <th className="p-3.5">النوع</th>
                  <th className="p-3.5">الصنف</th>
                  <th className="p-3.5">المورد</th>
                  <th className="p-3.5">الكمية</th>
                  <th className="p-3.5">سعر الوحدة</th>
                  <th className="p-3.5">الإجمالي</th>
                  <th className="p-3.5">الوجهة</th>
                  <th className="p-3.5">التاريخ والمسجل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {purchases.map((pur) => (
                  <tr key={pur.id} className="hover:bg-white/[0.02]">
                    <td className="p-3.5 font-mono text-amber-300 font-bold">{pur.invoiceNumber}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          pur.type === "OPENING_BALANCE"
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        }`}
                      >
                        {pur.type === "OPENING_BALANCE" ? "جرد أول المدة" : "فاتورة شراء"}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-white">{pur.product?.nameAr}</td>
                    <td className="p-3.5 text-slate-300">{pur.supplierName || "-"}</td>
                    <td className="p-3.5 font-mono font-bold text-emerald-400">+{pur.quantity}</td>
                    <td className="p-3.5 font-mono text-slate-300">{pur.costPrice} ج.م</td>
                    <td className="p-3.5 font-mono font-black text-amber-400">{pur.totalCost} ج.م</td>
                    <td className="p-3.5 text-slate-300">
                      {pur.destination === "CENTRAL" ? "المخزن العام" : "فرع محدد"}
                    </td>
                    <td className="p-3.5 text-[11px] text-slate-400 font-mono">
                      {new Date(pur.createdAt).toLocaleDateString("ar-EG")} ({pur.recordedBy})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SUB-TAB 4: TRANSFERS TO BRANCHES
         ───────────────────────────────────────────────────────────── */}
      {subTab === "transfers" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black text-white">سجل أذونات الصرف والتحويل من المخزن العام للفروع</h3>
            <button
              type="button"
              onClick={() => setShowTransferModal(true)}
              className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Truck className="w-4 h-4" />
              <span>إذن صرف وتحويل جديد للفرع 🚚</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#14141e]">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-black/40 text-slate-400 font-bold">
                  <th className="p-3.5">رقم التحويل</th>
                  <th className="p-3.5">الصنف المحول</th>
                  <th className="p-3.5">الفرع المستلم</th>
                  <th className="p-3.5">الكمية المصروفة</th>
                  <th className="p-3.5">مسئول الصرف</th>
                  <th className="p-3.5">المستلم بالفرع</th>
                  <th className="p-3.5">الحالة والتاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transfers.map((trf) => (
                  <tr key={trf.id} className="hover:bg-white/[0.02]">
                    <td className="p-3.5 font-mono text-amber-300 font-bold">{trf.transferNumber}</td>
                    <td className="p-3.5 font-bold text-white">{trf.product?.nameAr}</td>
                    <td className="p-3.5 text-cyan-300 font-bold">📍 {trf.toBranch?.name}</td>
                    <td className="p-3.5 font-mono font-black text-amber-400">
                      {trf.quantity} {trf.product?.unit || "قطعة"}
                    </td>
                    <td className="p-3.5 text-slate-300">{trf.dispatchedBy}</td>
                    <td className="p-3.5 text-slate-300">{trf.receivedBy || "كاشير الفرع"}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                        تم الاستلام ✅
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SUB-TAB 5: SMART DAILY CONSUMPTION LOGS & REPLENISHMENT
         ───────────────────────────────────────────────────────────── */}
      {subTab === "consumption" && (
        <div className="space-y-6">
          {/* Daily Report KPI */}
          {dailyReport && dailyReport.lowStockAlerts && dailyReport.lowStockAlerts.length > 0 && (
            <div className="p-5 rounded-3xl bg-rose-500/10 border border-rose-500/30 space-y-3">
              <h4 className="text-xs font-black text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>تنبيه الاحتياجات والنواقص الحرجة للفروع (نظام الذكاء التنبؤي):</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dailyReport.lowStockAlerts.map((alert: any) => (
                  <div key={alert.id} className="p-3 rounded-2xl bg-black/60 border border-rose-500/20 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-white">
                      <span>{alert.nameAr}</span>
                      <span className="font-mono text-rose-400">{alert.stockQty} {alert.unit} متبقي</span>
                    </div>
                    <p className="text-[11px] text-amber-300">💡 الإجراء المقترح: {alert.recommendedAction}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Table of Consumption */}
          <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#14141e]">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-black/40 text-slate-400 font-bold">
                  <th className="p-3.5">الخامة المستهلكة</th>
                  <th className="p-3.5">الفرع</th>
                  <th className="p-3.5">الكمية المستهلكة</th>
                  <th className="p-3.5">الخدمة المرتبطة / السبب</th>
                  <th className="p-3.5">طريقة الخصم</th>
                  <th className="p-3.5">التاريخ والوقت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {consumptionLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02]">
                    <td className="p-3.5 font-bold text-white">{log.product?.nameAr}</td>
                    <td className="p-3.5 text-slate-300">📍 {log.branch?.name}</td>
                    <td className="p-3.5 font-mono font-black text-rose-400">
                      -{log.quantityConsumed} {log.unit}
                    </td>
                    <td className="p-3.5 text-slate-300">{log.serviceName}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          log.reason === "AUTO_SERVICE_RULE"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                        }`}
                      >
                        {log.reason === "AUTO_SERVICE_RULE" ? "خصم آلي مع تذكرة الخدمة ✂️" : "صرف لمحطة عمل 🧴"}
                      </span>
                    </td>
                    <td className="p-3.5 text-[11px] text-slate-400 font-mono">
                      {new Date(log.createdAt).toLocaleDateString("ar-EG")} - {new Date(log.createdAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: ADD / EDIT PRODUCT WITH AUTO BARCODE
         ───────────────────────────────────────────────────────────── */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-[#12121a] border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Barcode className="w-4 h-4 text-amber-400" />
                <span>{editingProduct ? `تعديل الصنف (${editingProduct.nameAr})` : "تكويد وإضافة صنف جديد للمخزن"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowProductModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
              {/* Usage Type: Retail vs Consumable */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">نوع استخدام الصنف:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setProductForm({ ...productForm, usageType: "RETAIL" })}
                    className={`py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                      productForm.usageType === "RETAIL"
                        ? "bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md"
                        : "bg-black/50 text-slate-400 border-white/10 hover:border-white/20"
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>🛍️ بضاعة بيع للعملاء</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductForm({ ...productForm, usageType: "CONSUMABLE" })}
                    className={`py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                      productForm.usageType === "CONSUMABLE"
                        ? "bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-md"
                        : "bg-black/50 text-slate-400 border-white/10 hover:border-white/20"
                    }`}
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    <span>💈 خامات تشغيل واستهلاك</span>
                  </button>
                </div>
              </div>

              {/* Name & Unit */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="text-slate-300 font-bold block mb-1">اسم الصنف بالعربي:</label>
                  <input
                    type="text"
                    required
                    value={productForm.nameAr}
                    onChange={(e) => setProductForm({ ...productForm, nameAr: e.target.value })}
                    placeholder="مثال: شفرات حلاقة دوركو أو عطر دقن الباشا"
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">الوحدة:</label>
                  <select
                    value={productForm.unit}
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-bold"
                  >
                    <option value="قطعة">قطعة / شفرة</option>
                    <option value="عبوة">عبوة / زجاجة</option>
                    <option value="جرام">جرام</option>
                    <option value="مل">مل (مليلتر)</option>
                    <option value="علبة">علبة / باكت</option>
                  </select>
                </div>
              </div>

              {/* Barcode Option (Auto vs Existing) */}
              <div className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-bold block text-xs">نظام تكويد الباركود:</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setProductForm({ ...productForm, barcodeType: "AUTO" })}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border cursor-pointer ${
                        productForm.barcodeType === "AUTO"
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : "text-slate-500 border-transparent"
                      }`}
                    >
                      توليد تلقائي فريد
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductForm({ ...productForm, barcodeType: "EXISTING" })}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border cursor-pointer ${
                        productForm.barcodeType === "EXISTING"
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : "text-slate-500 border-transparent"
                      }`}
                    >
                      باركود المصنع الدولي
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={productForm.barcode}
                    onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })}
                    placeholder="الباركود (مثال: DKN-849201)"
                    className="flex-1 py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-amber-300 font-mono font-bold"
                  />
                  {productForm.barcodeType === "AUTO" && (
                    <button
                      type="button"
                      onClick={handleGenerateBarcode}
                      className="py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>توليد جديد</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Prices & Quantities */}
              <div className="grid grid-cols-2 gap-3">
                {productForm.usageType === "RETAIL" && (
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">سعر البيع للزبون (ج.م):</label>
                    <input
                      type="number"
                      min="0"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                      className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-amber-400 font-mono font-bold"
                    />
                  </div>
                )}

                <div>
                  <label className="text-slate-300 font-bold block mb-1">سعر الشراء والتكلفة (ج.م):</label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.costPrice}
                    onChange={(e) => setProductForm({ ...productForm, costPrice: Number(e.target.value) })}
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">رصيد المخزن العام:</label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.centralStockQty}
                    onChange={(e) => setProductForm({ ...productForm, centralStockQty: Number(e.target.value) })}
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">حد التنبيه والنواقص:</label>
                  <input
                    type="number"
                    min="1"
                    value={productForm.minStockAlert}
                    onChange={(e) => setProductForm({ ...productForm, minStockAlert: Number(e.target.value) })}
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                {editingProduct ? "حفظ التعديلات على الصنف 💾" : "حفظ وتكويد الصنف بالمخزن 🛍️"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: STOCK-IN / PURCHASE / OPENING BALANCE
         ───────────────────────────────────────────────────────────── */}
      {showStockInModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-[#12121a] border border-emerald-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>إذن إضافة مخزن (مشتريات أو جرد أول المدة)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowStockInModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStockIn} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">نوع الإضافة:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStockInForm({ ...stockInForm, type: "PURCHASE" })}
                    className={`py-2 px-3 rounded-xl font-bold border cursor-pointer ${
                      stockInForm.type === "PURCHASE"
                        ? "bg-emerald-500 text-slate-950 border-emerald-400 font-black"
                        : "bg-black/50 text-slate-400 border-white/10"
                    }`}
                  >
                    فاتورة شراء جديدة
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockInForm({ ...stockInForm, type: "OPENING_BALANCE" })}
                    className={`py-2 px-3 rounded-xl font-bold border cursor-pointer ${
                      stockInForm.type === "OPENING_BALANCE"
                        ? "bg-purple-500 text-white border-purple-400 font-black"
                        : "bg-black/50 text-slate-400 border-white/10"
                    }`}
                  >
                    جرد رصيد أول المدة
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">الصنف المضاف:</label>
                <select
                  required
                  value={stockInForm.productId}
                  onChange={(e) => {
                    const prod = products.find((p) => p.id === e.target.value);
                    setStockInForm({
                      ...stockInForm,
                      productId: e.target.value,
                      costPrice: prod?.costPrice || 0,
                    });
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-bold"
                >
                  <option value="">اختر الصنف...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nameAr} ({p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">الكمية المضافة:</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={stockInForm.quantity}
                    onChange={(e) => setStockInForm({ ...stockInForm, quantity: Number(e.target.value) })}
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-emerald-400 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">سعر الشراء للوحدة (ج.م):</label>
                  <input
                    type="number"
                    min="0"
                    value={stockInForm.costPrice}
                    onChange={(e) => setStockInForm({ ...stockInForm, costPrice: Number(e.target.value) })}
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">اسم المورد / الشركة:</label>
                <input
                  type="text"
                  value={stockInForm.supplierName}
                  onChange={(e) => setStockInForm({ ...stockInForm, supplierName: e.target.value })}
                  placeholder="مثال: شركة دوركو أو مستورد العطور"
                  className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition shadow-lg cursor-pointer"
              >
                تأكيد إذن الإضافة للمخزن 📥
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 3: TRANSFER TO BRANCH
         ───────────────────────────────────────────────────────────── */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-[#12121a] border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-400" />
                <span>إذن صرف وتحويل من المخزن العام للفرع</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTransfer} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">الصنف المراد تحويله:</label>
                <select
                  required
                  value={transferForm.productId}
                  onChange={(e) => setTransferForm({ ...transferForm, productId: e.target.value })}
                  className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-bold"
                >
                  <option value="">اختر الصنف...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nameAr} [رصيد المخزن العام: {p.centralStockQty} {p.unit}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">الفرع المستلم:</label>
                <select
                  required
                  value={transferForm.toBranchId}
                  onChange={(e) => setTransferForm({ ...transferForm, toBranchId: e.target.value })}
                  className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-bold"
                >
                  <option value="">اختر الفرع...</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">الكمية المراد صرفها:</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={transferForm.quantity}
                  onChange={(e) => setTransferForm({ ...transferForm, quantity: Number(e.target.value) })}
                  className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-amber-400 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">اسم مستلم الفرع (الكاشير أو المدير):</label>
                <input
                  type="text"
                  value={transferForm.receivedBy}
                  onChange={(e) => setTransferForm({ ...transferForm, receivedBy: e.target.value })}
                  placeholder="مثال: كاشير دقن الباشا"
                  className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-lg cursor-pointer"
              >
                تأكيد الصرف والتحويل للفرع 🚚
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 4: STATION HANDOVER / CONSUMABLE DEPLETION
         ───────────────────────────────────────────────────────────── */}
      {showConsumptionModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-[#12121a] border border-cyan-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Scissors className="w-4 h-4 text-cyan-400" />
                <span>صرف خامة لمحطة العمل / الكرسي (Open Station Bottle)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowConsumptionModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveConsumption} className="space-y-3.5 text-xs">
              <p className="text-slate-400 text-[11px]">
                سيتم فتح عبوة جديدة وتسليمها للكرسي أو محطة الخدمة، ونقلها من المخزون المغلق إلى (قيد الاستهلاك بالصالون 🧴)
              </p>

              <div>
                <label className="text-slate-300 font-bold block mb-1">الخامة:</label>
                <select
                  required
                  value={consumptionForm.productId}
                  onChange={(e) => setConsumptionForm({ ...consumptionForm, productId: e.target.value })}
                  className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-bold"
                >
                  <option value="">اختر الخامة...</option>
                  {products
                    .filter((p) => p.usageType === "CONSUMABLE")
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nameAr} [رصيد مغلق: {p.stockQty} {p.unit}]
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">الكمية المسلمة (عدد العبوات):</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={consumptionForm.quantity}
                  onChange={(e) => setConsumptionForm({ ...consumptionForm, quantity: Number(e.target.value) })}
                  className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-cyan-400 font-mono font-bold"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition shadow-lg cursor-pointer"
              >
                تأكيد فتح وصرف العبوة لمحطة العمل 🧴
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 5: XPRINTER SMART DIAGNOSTIC TOOL & GUIDE
         ───────────────────────────────────────────────────────────── */}
      {showDiagnosticModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-[#12121a] border border-cyan-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-black text-white">فاحص ومصلح طابعة Xprinter الذكي</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDiagnosticModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-200 space-y-1.5">
                <span className="font-black text-white flex items-center gap-1.5">
                  <span>👑 أداة الفحص والإصلاح مثبتة وجاهزة على سطح مكتبك:</span>
                </span>
                <p>
                  تم وضع ملف باتش فحص ذكي باسم <strong className="text-amber-300">"فاحص ومصلح طابعة Xprinter الباشا.bat"</strong> على سطح المكتب (Desktop).
                </p>
                <p>
                  يقوم الباتش بفحص توصيلات الـ USB، تفريغ طابور الطباعة المعلق (Print Spooler)، وفحص تعريف الطابعة وإرسال صفحة اختبار فوري!
                </p>
              </div>

              {/* Hardware Calibration Guide (Gap Sensor) */}
              <div className="p-4 rounded-2xl bg-black/60 border border-amber-500/30 space-y-2">
                <span className="font-black text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>حل مشكلة اللمبة الحمراء وتخطي استيكرات الباركود (Gap Sensor Calibration):</span>
                </span>
                <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
                  <li>أغلق مفتاح الباور الخلفي للطابعة (Power Switch OFF).</li>
                  <li>اضغط واستمر بالضغط بإصبعك على زر <strong>FEED</strong> الأمامي.</li>
                  <li>شغل مفتاح الباور الخلفي مع الاستمرار بالضغط على زر <strong>FEED</strong>.</li>
                  <li>انتظر حتى تسمع صوت صفارتين (Beep ... Beep).</li>
                  <li><strong>ارفع إصبعك فوراً</strong> عن زر FEED!</li>
                  <li>ستسحب الطابعة استيكراً واحداً لمعايرة الأبعاد وتتحول الإضاءة للأزرق الثابت جاهزة للطباعة فوراً!</li>
                </ol>
              </div>

              {/* Download / Run Link */}
              <a
                href="/tools/diagnose_xprinter.bat"
                download="diagnose_xprinter.bat"
                className="w-full py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>تحميل أداة الفحص (diagnose_xprinter.bat) وتشغيلها</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
