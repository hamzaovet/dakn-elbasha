"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Scissors,
  Printer,
  CheckCircle2,
  Clock,
  User,
  ShoppingBag,
  DollarSign,
  Plus,
  Trash2,
  RefreshCw,
  LogOut,
  CreditCard,
  Banknote,
  Smartphone,
  Sparkles,
  ShieldCheck,
  Search,
  Tag,
  AlertCircle,
  Users,
  Lock,
  Receipt,
  Wallet,
  FileText,
} from "lucide-react";

export default function CashierPosPage() {
  const router = useRouter();

  // Auth State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [branches, setBranches] = useState<any[]>([]);

  // Tickets & Products & Specialists
  const [tickets, setTickets] = useState<any[]>([]);
  const [retailProducts, setRetailProducts] = useState<any[]>([]);
  const [specialists, setSpecialists] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [showShiftModal, setShowShiftModal] = useState<boolean>(false);
  const [showAdmitModal, setShowAdmitModal] = useState<boolean>(false);
  const [admitCustomerName, setAdmitCustomerName] = useState<string>("");
  const [admitCustomerPhone, setAdmitCustomerPhone] = useState<string>("");
  const [admitSpecialistId, setAdmitSpecialistId] = useState<string>("FIRST_AVAILABLE");
  const [admitMode, setAdmitMode] = useState<"CHAIR" | "WAITING">("CHAIR");
  const [showSeatPickerModal, setShowSeatPickerModal] = useState<any>(null); // ticket being seated
  const [admittingClient, setAdmittingClient] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  // Active Ticket Selected for Checkout
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  // Settlement Inputs
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [settlingTicket, setSettlingTicket] = useState<boolean>(false);

  // Completed / Printed Receipt Order
  const [lastPrintedTicket, setLastPrintedTicket] = useState<any>(null);

  // Sound ref for new ticket alert
  const audioCtxRef = useRef<AudioContext | null>(null);

  // VIP Floating Toast State (No Native Windows Alerts!)
  const [posToast, setPosToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const showToast = (type: "success" | "error" | "info", message: string) => {
    setPosToast({ type, message });
    setTimeout(() => {
      setPosToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  // Shift Close Modal State
  const [showCloseShiftModal, setShowCloseShiftModal] = useState<boolean>(false);
  const [shiftStats, setShiftStats] = useState<any>(null);
  const [openShift, setOpenShift] = useState<any>(null);
  const [shiftForm, setShiftForm] = useState({
    actualCash: 0,
    handedTo: "أ/ حمزة عباس (المايسترو - المالك) 👑",
    notes: "",
  });
  const [closingShift, setClosingShift] = useState<boolean>(false);
  const [lastClosedShift, setLastClosedShift] = useState<any>(null);

  // Quick Advance Modal State
  const [showAdvanceModal, setShowAdvanceModal] = useState<boolean>(false);
  const [advanceSpecId, setAdvanceSpecId] = useState<string>("");
  const [advanceAmount, setAdvanceAmount] = useState<number>(200);
  const [advanceNotes, setAdvanceNotes] = useState<string>("سلفة نقدية من درج الكاشير");
  const [savingAdvance, setSavingAdvance] = useState<boolean>(false);

  // Quick Treasury / Safe Modal State
  const [showTreasuryModal, setShowTreasuryModal] = useState<boolean>(false);
  const [treasurySummary, setTreasurySummary] = useState<any>(null);

  // Check Auth
  useEffect(() => {
    try {
      const saved = localStorage.getItem("saddam_staff_user");
      if (!saved) {
        router.push("/login");
        return;
      }
      const user = JSON.parse(saved);
      if (
        user.role !== "cashier" &&
        user.role !== "manager" &&
        user.role !== "general_manager" &&
        user.role !== "owner"
      ) {
        router.push("/login");
        return;
      }
      setCurrentUser(user);
      if (user.branchId) setSelectedBranchId(user.branchId);
    } catch {
      router.push("/login");
    }
  }, [router]);

  // Load Data
  const fetchPosData = async () => {
    try {
      const [resB, resT, resP, resSpec, resSet] = await Promise.all([
        fetch("/api/branches", { cache: "no-store" }),
        fetch(`/api/tickets?branchId=${selectedBranchId || "ALL"}&activeOnly=true`, { cache: "no-store" }),
        fetch(`/api/products?branchId=${selectedBranchId || "ALL"}`, { cache: "no-store" }),
        fetch(`/api/specialists?branchId=${selectedBranchId || "ALL"}`, { cache: "no-store" }),
        fetch("/api/settings", { cache: "no-store" }),
      ]);

      const [dataB, dataT, dataP, dataSpec, dataSet] = await Promise.all([
        resB.json(),
        resT.json(),
        resP.json(),
        resSpec.json(),
        resSet.json(),
      ]);

      if (dataSet.success && dataSet.settings) {
        setSettings(dataSet.settings);
      }

      if (dataB.success && dataB.branches) {
        setBranches(dataB.branches);
        if (!selectedBranchId && dataB.branches.length > 0) {
          setSelectedBranchId(dataB.branches[0].id);
        }
      }

      if (dataT.success && dataT.tickets) {
        setTickets(dataT.tickets);
        // If a ticket is currently selected, keep it updated
        if (selectedTicket) {
          const fresh = dataT.tickets.find((t: any) => t.id === selectedTicket.id);
          if (fresh) setSelectedTicket(fresh);
        }
      }

      if (dataP.success && dataP.products) {
        setRetailProducts(dataP.products);
      }

      if (dataSpec.success && dataSpec.specialists) {
        setSpecialists(dataSpec.specialists);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickShiftStatus = async (specId: string, status: string, reason: string) => {
    try {
      const res = await fetch("/api/specialists", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: specId,
          status,
          statusReason: reason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", "تم تحديث حالة وردية المتخصص بنجاح 🟢");
        await fetchPosData();
      } else {
        showToast("error", data.error || "فشل تحديث الوردية");
      }
    } catch {
      showToast("error", "تعذر الاتصال بالخادم");
    }
  };

  // Admit customer to chair or waiting lounge
  const handleAdmitCustomerToChair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admitCustomerName.trim()) {
      showToast("error", "يرجى إدخال اسم العميل");
      return;
    }

    const isFirstAvailable = admitSpecialistId === "FIRST_AVAILABLE" || !admitSpecialistId;
    const targetSpecId = isFirstAvailable
      ? (specialists.find((s) => s.status === "AVAILABLE")?.id || specialists[0]?.id)
      : admitSpecialistId;

    if (!targetSpecId) {
      showToast("error", "لا يوجد كباتن متاحين حالياً في هذا الفرع");
      return;
    }

    const chosenSpec = specialists.find((s) => s.id === targetSpecId);
    const isSpecAvailable = chosenSpec?.status === "AVAILABLE";
    const finalMode = admitMode === "CHAIR" && isSpecAvailable && !isFirstAvailable ? "IN_CHAIR" : "WAITING";

    try {
      setAdmittingClient(true);
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          specialistId: targetSpecId,
          branchId: chosenSpec?.branchId || (selectedBranchId !== "ALL" ? selectedBranchId : branches[0]?.id),
          customerName: admitCustomerName.trim(),
          customerPhone: admitCustomerPhone.trim() || null,
          status: finalMode,
          waitingMode: isFirstAvailable ? "FIRST_AVAILABLE" : "SPECIFIC_SPECIALIST",
          notes: isFirstAvailable
            ? "🛋️ صالة الاستراحة: في انتظار أول كابتن يفضى"
            : finalMode === "WAITING"
            ? `🛋️ صالة الاستراحة: طلب كابتن (${chosenSpec?.name}) بالاسم`
            : null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (finalMode === "WAITING") {
          showToast("info", `تم تسجيل (${admitCustomerName}) في "صالة الاستراحة وقائمة الانتظار" 🛋️`);
        } else {
          showToast("success", `تم إجلاس العميل (${admitCustomerName}) على كرسي كابتن (${chosenSpec?.name}) 💺`);
        }
        setShowAdmitModal(false);
        setAdmitCustomerName("");
        setAdmitCustomerPhone("");
        await fetchPosData();
      } else {
        showToast("error", data.error || "فشل تسجيل العميل");
      }
    } catch {
      showToast("error", "تعذر الاتصال بالخادم");
    } finally {
      setAdmittingClient(false);
    }
  };

  // Seat a waiting client from the lounge onto a chair
  const handleSeatWaitingTicket = async (ticket: any, targetSpecialistId?: string) => {
    try {
      const specId = targetSpecialistId || ticket.specialistId;
      const targetSpec = specialists.find((s) => s.id === specId);

      const res = await fetch("/api/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SEAT_NOW",
          ticketId: ticket.id,
          specialistId: specId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast("success", `تم إجلاس العميل (${ticket.customerName}) على كرسي كابتن (${targetSpec?.name || ticket.specialist?.name}) الآن 💺✨`);
        setShowSeatPickerModal(null);
        await fetchPosData();
      } else {
        showToast("error", data.error || "فشل إجلاس العميل");
      }
    } catch {
      showToast("error", "تعذر الاتصال بالخادم");
    }
  };

  // Cancel waiting ticket
  const handleCancelWaitingTicket = async (ticketId: string, customerName: string) => {
    try {
      const res = await fetch("/api/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CANCEL_WAITING",
          ticketId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast("info", `تم إلغاء انتظار العميل (${customerName}) ✕`);
        await fetchPosData();
      } else {
        showToast("error", data.error || "فشل إلغاء التذكرة");
      }
    } catch {
      showToast("error", "تعذر الاتصال بالخادم");
    }
  };

  // Open Shift Close Modal in POS
  const handleOpenCloseShiftModal = async () => {
    try {
      const res = await fetch(`/api/shifts?branchId=${selectedBranchId || "ALL"}`);
      const data = await res.json();
      if (data.success) {
        setShiftStats(data.liveStats);
        setOpenShift(data.openShift);
        setShiftForm({
          actualCash: data.liveStats?.expectedCash || 0,
          handedTo: "أ/ حمزة عباس (المايسترو - المالك) 👑",
          notes: "",
        });
        setShowCloseShiftModal(true);
      } else {
        showToast("error", data.error || "فشل جلب بيانات الوردية");
      }
    } catch {
      showToast("error", "تعذر الاتصال بالخادم");
    }
  };

  // Execute Shift Close & Handover
  const handleExecuteCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!openShift) {
      showToast("error", "لا توجد وردية مفتوحة حالياً لإقفالها");
      return;
    }
    try {
      setClosingShift(true);
      const res = await fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CLOSE",
          shiftId: openShift.id,
          actualCash: Number(shiftForm.actualCash),
          handedTo: shiftForm.handedTo,
          notes: shiftForm.notes,
          expectedCash: shiftStats?.expectedCash || 0,
          ticketsCount: shiftStats?.ticketsCount || 0,
          servicesTotal: shiftStats?.servicesTotal || 0,
          retailTotal: shiftStats?.retailTotal || 0,
          cashCollected: shiftStats?.cashCollected || 0,
          visaCollected: shiftStats?.visaCollected || 0,
          instapayCollected: shiftStats?.instapayCollected || 0,
          vodafoneCollected: shiftStats?.vodafoneCollected || 0,
          advancesPayouts: shiftStats?.advancesPayouts || 0,
          expensesTotal: shiftStats?.expensesTotal || 0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", `تم إقفال الوردية بنجاح وتسليم النقدية إلى (${shiftForm.handedTo}) 🔒`);
        setLastClosedShift(data.shift);
        setShowCloseShiftModal(false);
        // Print shift Z-Report
        setTimeout(() => {
          window.print();
        }, 500);
        await fetchPosData();
      } else {
        showToast("error", data.error || "فشل إقفال الوردية");
      }
    } catch {
      showToast("error", "تعذر الاتصال بالخادم");
    } finally {
      setClosingShift(false);
    }
  };

  // Cash Advance for Specialist on Duty
  const handleRecordAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advanceSpecId || advanceAmount <= 0) {
      showToast("error", "يرجى اختيار المتخصص وتحديد مبلغ السلفة");
      return;
    }
    try {
      setSavingAdvance(true);
      const chosen = specialists.find((s) => s.id === advanceSpecId);
      const res = await fetch("/api/ledgers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          specialistId: advanceSpecId,
          branchId: chosen?.branchId || selectedBranchId || branches[0]?.id,
          type: "ADVANCE_WITHDRAWAL",
          amount: Number(advanceAmount),
          notes: advanceNotes,
          recordedBy: currentUser?.name || "الكاشير",
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", `تم صرف سلفة نقدية بمبلغ ${advanceAmount} ج.م لـ (${chosen?.name}) وخصمها من الدرج 💸`);
        setShowAdvanceModal(false);
        setAdvanceAmount(200);
        await fetchPosData();
      } else {
        showToast("error", data.error || "فشل تسجيل السلفة");
      }
    } catch {
      showToast("error", "تعذر الاتصال بالخادم");
    } finally {
      setSavingAdvance(false);
    }
  };

  // Open Treasury / Safe Modal
  const handleOpenTreasuryModal = async () => {
    try {
      const res = await fetch(`/api/treasury?period=TODAY&branchId=${selectedBranchId || "ALL"}`);
      const data = await res.json();
      if (data.success && data.summary) {
        setTreasurySummary(data.summary);
        setShowTreasuryModal(true);
      }
    } catch {
      showToast("error", "تعذر جلب ملخص الخزينة");
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchPosData();
      const interval = setInterval(fetchPosData, 4000);
      return () => clearInterval(interval);
    }
  }, [currentUser, selectedBranchId]);

  // Select Ticket for Checkout
  const handleSelectTicket = (t: any) => {
    setSelectedTicket(t);
    setDiscountAmount(0);
    setTipAmount(0);
    setPaymentMethod("CASH");
  };

  // Add Retail Product to Active Ticket
  const handleAddRetailProduct = async (prod: any) => {
    if (!selectedTicket) return;
    try {
      const res = await fetch("/api/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          action: "ADD_RETAIL",
          productId: prod.id,
          nameAr: prod.nameAr,
          price: prod.price,
          qty: 1,
        }),
      });

      const data = await res.json();
      if (data.success && data.ticket) {
        setSelectedTicket(data.ticket);
        fetchPosData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Settle & Print Receipt
  const handleSettleAndPrint = async () => {
    if (!selectedTicket) return;

    try {
      setSettlingTicket(true);
      const res = await fetch("/api/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          action: "SETTLE_CASHIER",
          paymentMethod,
          discount: discountAmount,
          tipAmount,
          cashierName: currentUser?.name || "كاشير صالون صدام",
        }),
      });

      const data = await res.json();
      if (data.success && data.ticket) {
        setLastPrintedTicket(data.ticket);
        setSelectedTicket(null);
        fetchPosData();

        // Trigger thermal print
        setTimeout(() => {
          window.print();
        }, 300);
      } else {
        showToast("error", data.error || "فشل تحصيل التذكرة");
      }
    } catch {
      showToast("error", "تعذر تسجيل التحصيل");
    } finally {
      setSettlingTicket(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("saddam_staff_user");
    router.push("/login");
  };

  // Parse active ticket services and retail items
  let parsedServices: any[] = [];
  try {
    parsedServices =
      typeof selectedTicket?.services === "string"
        ? JSON.parse(selectedTicket.services)
        : selectedTicket?.services || [];
  } catch {
    parsedServices = [];
  }

  let parsedRetail: any[] = [];
  try {
    parsedRetail =
      typeof selectedTicket?.retailItems === "string"
        ? JSON.parse(selectedTicket.retailItems)
        : selectedTicket?.retailItems || [];
  } catch {
    parsedRetail = [];
  }

  // Calculate live checkout total
  const rawTotal = (selectedTicket?.servicesTotal || 0) + (selectedTicket?.retailTotal || 0);
  const calculatedFinal = Math.max(0, rawTotal - Number(discountAmount || 0) + Number(tipAmount || 0));

  return (
    <div className="min-h-screen bg-[#0a0a0e] text-slate-100 flex flex-col font-sans" dir="rtl">
      {/* ─────────────────────────────────────────────────────────────
          1. POS HEADER
         ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#0f0f15]/95 backdrop-blur-md border-b border-amber-500/25 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-lg no-print">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl overflow-hidden border-2 border-amber-400 bg-black shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-amber-400">
                كاشير مجموعة الباشا VIP (نقطة البيع POS)
              </h2>
              <span className="py-0.5 px-2 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black">
                نشط 🟢
              </span>
            </div>
            <p className="text-xs text-slate-400 font-bold">
              الكاشير: {currentUser?.name}
            </p>
          </div>
        </div>

        {/* Branch Switcher & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {currentUser?.role === "owner" || currentUser?.role === "general_manager" ? (
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="py-1.5 px-3 rounded-xl bg-[#181822] border border-amber-500/30 text-xs font-bold text-amber-300 focus:outline-none"
            >
              <option value="ALL">جميع الفروع</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs font-bold text-amber-300/80 bg-white/5 py-1 px-3 rounded-xl border border-white/5">
              {currentUser?.branchName || "الفرع الحالي"}
            </span>
          )}

          <button
            onClick={() => {
              setAdmitCustomerName("");
              setAdmitCustomerPhone("");
              setAdmitSpecialistId(specialists[0]?.id || "");
              setShowAdmitModal(true);
            }}
            className="py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-amber-500/20 shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إجلاس زبون 💺</span>
          </button>

          <button
            onClick={() => {
              setAdvanceSpecId(specialists[0]?.id || "");
              setShowAdvanceModal(true);
            }}
            className="py-1.5 px-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="صرف سلفة نقدية فورية لمختص على الكرسي"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>سلفة كاش 💸</span>
          </button>

          <button
            onClick={handleOpenTreasuryModal}
            className="py-1.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="عرض إيراد اليوم والخزنة والدرج"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>الخزنة واليومية 💰</span>
          </button>

          <button
            onClick={handleOpenCloseShiftModal}
            className="py-1.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-black transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="إقفال وردية الكاشير وتسليم النقدية للمالك"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>إقفال وتسليم الوردية 🔒</span>
          </button>

          <button
            onClick={() => setShowShiftModal(true)}
            className="py-1.5 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>حضور المختصين 💈</span>
          </button>

          <button
            onClick={fetchPosData}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition"
            title="تحديث"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <Link
            href="/admin"
            className="py-1.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold transition hidden sm:inline"
          >
            لوحة الإدارة ⚙️
          </Link>

          <button
            onClick={handleLogout}
            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition text-xs font-bold"
            title="خروج"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. POS MAIN WORKSPACE (SPLIT: CHAIRS BOARD / CHECKOUT PANEL)
         ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 no-print">
        {/* LEFT / MAIN COLUMN: ACTIVE CHAIRS & TICKETS (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {(() => {
            const waitingTickets = tickets.filter((t) => t.status === "WAITING");
            const chairTickets = tickets.filter((t) => t.status !== "WAITING");

            return (
              <>
                {/* ─────────────────────────────────────────────────────────────
                    1. WAITING LOUNGE & QUEUE (صالة الاستراحة وقائمة الانتظار بالصالون)
                   ───────────────────────────────────────────────────────────── */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center text-sm">
                        🛋️
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white flex items-center gap-2">
                          <span>صالة الاستراحة وقائمة الانتظار بالصالون</span>
                          <span className="py-0.5 px-2 rounded-full bg-sky-500/20 text-sky-300 font-mono text-[11px] font-black border border-sky-500/30">
                            {waitingTickets.length} زبائن
                          </span>
                        </h3>
                        <p className="text-[11px] text-slate-400">زبائن مباشرين وصلوا وينتظرون كابتن بالاسم أو أول كابتن يفضى</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setAdmitCustomerName("");
                        setAdmitCustomerPhone("");
                        setAdmitSpecialistId("FIRST_AVAILABLE");
                        setAdmitMode("WAITING");
                        setShowAdmitModal(true);
                      }}
                      className="py-1 px-3 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة زبون للاستراحة 🛋️</span>
                    </button>
                  </div>

                  {waitingTickets.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-[#121218] border border-white/5 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <span>🛋️</span>
                      <span>لا يوجد زبائن حالياً في صالة الاستراحة • جميع الكباتن المتاحين جاهزون لاستقبال الزبائن على الكراسي 💈</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {waitingTickets.map((wt) => {
                        const targetSpec = specialists.find((s) => s.id === wt.specialistId);
                        const isSpecific = !wt.notes?.includes("أول كابتن");
                        const isSpecReady = targetSpec?.status === "AVAILABLE";
                        const anySpecAvailable = specialists.some((s) => s.status === "AVAILABLE");
                        const waitMinutes = Math.max(1, Math.round((Date.now() - new Date(wt.createdAt).getTime()) / 60000));

                        return (
                          <div
                            key={wt.id}
                            className={`p-3.5 rounded-2xl border transition space-y-2.5 flex flex-col justify-between ${
                              isSpecReady || (!isSpecific && anySpecAvailable)
                                ? "bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/30 shadow-lg shadow-emerald-500/5"
                                : "bg-[#14141c] border-white/10"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs text-amber-400 font-black">
                                #{wt.ticketNumber}
                              </span>
                              <span className="py-0.5 px-2 rounded-lg bg-white/5 text-slate-300 font-mono text-[10px] font-bold">
                                ⏱️ ينتظر منذ {waitMinutes} د
                              </span>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <h4 className="font-black text-sm text-white">{wt.customerName}</h4>
                                {wt.customerPhone && (
                                  <span className="text-[11px] text-slate-400 font-mono">{wt.customerPhone}</span>
                                )}
                              </div>

                              {/* Specialist Preference & Live Status */}
                              <div className="text-[11px] p-2 rounded-xl bg-black/40 border border-white/5 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-400 font-bold">المطلوب:</span>
                                  <span className="font-bold text-amber-300">
                                    {isSpecific ? `طلب كابتن (${targetSpec?.name || wt.specialist?.name}) بالاسم 👑` : "في انتظار أول كابتن يفضى ⏳"}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between pt-0.5">
                                  <span className="text-slate-400">حالة الكابتن:</span>
                                  <span>
                                    {isSpecific ? (
                                      isSpecReady ? (
                                        <strong className="text-emerald-400 font-bold animate-pulse">🟢 الكرسي متاح الآن!</strong>
                                      ) : (
                                        <span className="text-amber-400 font-bold">🔴 مشغول على الكرسي #{targetSpec?.chairNumber}</span>
                                      )
                                    ) : anySpecAvailable ? (
                                      <strong className="text-emerald-400 font-bold animate-pulse">🟢 يوجد كابتن متاح الآن!</strong>
                                    ) : (
                                      <span className="text-rose-400 font-bold">🔴 جميع الكباتن مشغولون حالياً</span>
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                              <button
                                type="button"
                                onClick={() => {
                                  if (!isSpecific) {
                                    setShowSeatPickerModal(wt);
                                  } else {
                                    handleSeatWaitingTicket(wt, targetSpec?.id);
                                  }
                                }}
                                className={`flex-1 py-2 px-3 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md ${
                                  isSpecReady || (!isSpecific && anySpecAvailable)
                                    ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20"
                                    : "bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300"
                                }`}
                              >
                                <Scissors className="w-3.5 h-3.5" />
                                <span>إجلاس على الكرسي الآن 💺</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleCancelWaitingTicket(wt.id, wt.customerName)}
                                className="py-2 px-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 hover:text-white transition text-xs font-bold cursor-pointer"
                                title="إلغاء الانتظار / مغادرة الصالون"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Active Chairs & Finished Tickets */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <Scissors className="w-4 h-4 text-amber-400" />
                      <span>كراسي الحلاقة والتذاكر اللحظية ({chairTickets.length})</span>
                    </h3>
                    <span className="text-[11px] text-amber-300 font-bold">
                      تحديث تلقائي كل 4 ثوانٍ ⚡
                    </span>
                  </div>

                  {chairTickets.length === 0 ? (
                    <div className="p-8 rounded-3xl bg-[#14141c] border border-white/10 text-center space-y-2">
                      <div className="text-2xl">💈</div>
                      <p className="text-xs text-slate-400 font-bold">
                        لا توجد كراسي مشغولة أو تذاكر بانتظار الحساب حالياً
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {chairTickets.map((t) => {
                        const isSelected = selectedTicket?.id === t.id;
                        const isReadyForCashier = t.status === "READY_FOR_CASHIER";

                        let servCount = 0;
                        try {
                          const s = typeof t.services === "string" ? JSON.parse(t.services) : t.services;
                          servCount = s.length;
                        } catch {}

                        return (
                          <div
                            key={t.id}
                            onClick={() => handleSelectTicket(t)}
                            className={`cursor-pointer p-4 rounded-2xl border transition space-y-3 flex flex-col justify-between ${
                              isSelected
                                ? "bg-amber-500/20 border-amber-400 ring-2 ring-amber-400 shadow-lg shadow-amber-500/10"
                                : isReadyForCashier
                                ? "bg-gradient-to-b from-[#181822] to-[#121218] border-emerald-500/50 hover:border-emerald-400 ring-1 ring-emerald-500/30"
                                : "bg-[#14141c] hover:bg-[#181824] border-white/10"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs text-amber-400 font-black">
                                #{t.ticketNumber}
                              </span>
                              <span
                                className={`py-0.5 px-2 rounded-full text-[10px] font-black ${
                                  isReadyForCashier
                                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse"
                                    : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                                }`}
                              >
                                {isReadyForCashier ? "جاهز للحساب 💰" : "على الكرسي ✂️"}
                              </span>
                            </div>

                            <div>
                              <h4 className="font-black text-sm text-white">{t.customerName}</h4>
                              <p className="text-xs text-slate-400">
                                المتخصص: <strong className="text-amber-300">{t.specialist?.name}</strong>{" "}
                                (ك #{t.chairNumber})
                              </p>
                            </div>

                            <div className="flex items-center justify-between border-t border-white/5 pt-2 text-xs">
                              <span className="text-slate-400">{servCount} خدمات مسجلة</span>
                              <span className="font-mono text-base font-black text-amber-400">
                                {t.finalAmount} ج.م
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            );
          })()}

          {/* Retail Beauty Products Catalog (Add to Cart) */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span>بضاعة التجميل والعناية (إضافة للفاتورة بضغطة زر):</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {retailProducts.map((prod) => (
                <button
                  key={prod.id}
                  onClick={() => handleAddRetailProduct(prod)}
                  disabled={!selectedTicket || prod.stockQty <= 0}
                  className="p-3 rounded-2xl bg-[#14141c] hover:bg-amber-500/15 border border-white/10 hover:border-amber-400 transition text-right space-y-1 group disabled:opacity-40"
                  title={!selectedTicket ? "اختر تذكرة عميل أولاً لإضافة المنتج" : ""}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-slate-400">
                      متبقي: {prod.stockQty}
                    </span>
                    <span className="w-5 h-5 rounded-md bg-amber-500/10 text-amber-400 flex items-center justify-center text-xs font-bold group-hover:bg-amber-500 group-hover:text-black transition">
                      +
                    </span>
                  </div>
                  <h5 className="font-black text-xs text-white truncate">{prod.nameAr}</h5>
                  <span className="font-mono text-xs text-amber-400 font-black block">
                    {prod.price} ج.م
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE CHECKOUT PANEL (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 sm:p-6 rounded-3xl bg-[#14141e] border-2 border-amber-500/40 shadow-2xl space-y-5 sticky top-20">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Banknote className="w-4 h-4 text-amber-400" />
                <span>لوحة الحساب والفاتورة</span>
              </h3>
              {selectedTicket && (
                <span className="font-mono text-xs text-amber-400 font-black">
                  #{selectedTicket.ticketNumber}
                </span>
              )}
            </div>

            {!selectedTicket ? (
              <div className="py-16 text-center space-y-2 text-slate-500">
                <div className="text-3xl">👈</div>
                <p className="text-xs font-bold">
                  اضغط على أي كرسي أو تذكرة من اليسار لإتمام الحساب وطباعة الإيصال
                </p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Client & Specialist Summary */}
                <div className="p-3 rounded-2xl bg-black/50 border border-white/5 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">العميل:</span>
                    <strong className="text-white font-bold">{selectedTicket.customerName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">المتخصص:</span>
                    <span className="text-amber-300 font-bold">
                      {selectedTicket.specialist?.name} (كرسي #{selectedTicket.chairNumber})
                    </span>
                  </div>
                </div>

                {/* Items Breakdown */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  <span className="text-[11px] font-bold text-slate-400 block">
                    محتويات الفاتورة:
                  </span>

                  {parsedServices.map((srv, idx) => (
                    <div key={idx} className="flex justify-between text-slate-300 border-b border-white/5 pb-1">
                      <span>✂️ {srv.nameAr}</span>
                      <span className="font-mono font-bold text-amber-400">{srv.price} ج</span>
                    </div>
                  ))}

                  {parsedRetail.map((ret, idx) => (
                    <div key={`ret-${idx}`} className="flex justify-between text-slate-300 border-b border-white/5 pb-1">
                      <span>🛍️ {ret.nameAr} × {ret.qty}</span>
                      <span className="font-mono font-bold text-amber-400">{ret.total} ج</span>
                    </div>
                  ))}
                </div>

                {/* Discount & Tip Inputs */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">خصم (ج.م):</label>
                    <input
                      type="number"
                      min={0}
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                      className="w-full py-1.5 px-2.5 rounded-xl bg-black/60 border border-white/10 text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">إكرامية / Tip (ج.م):</label>
                    <input
                      type="number"
                      min={0}
                      value={tipAmount}
                      onChange={(e) => setTipAmount(Number(e.target.value) || 0)}
                      className="w-full py-1.5 px-2.5 rounded-xl bg-black/60 border border-white/10 text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400">طريقة الدفع:</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: "CASH", label: "كاش 💵" },
                      { id: "CARD", label: "فيزا / ماستر 💳" },
                      { id: "INSTAPAY", label: "انستاباي 📱" },
                      { id: "VODAFONE_CASH", label: "فودافون كاش 🔴" },
                    ].map((pm) => (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPaymentMethod(pm.id)}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold transition ${
                          paymentMethod === pm.id
                            ? "bg-amber-500 text-slate-950 font-black"
                            : "bg-black/40 text-slate-400 hover:text-white border border-white/5"
                        }`}
                      >
                        {pm.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Final Total Display */}
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                  <span className="text-sm font-black text-white">المبلغ الصافي المطلوب:</span>
                  <strong className="text-2xl font-mono font-black text-amber-400">
                    {calculatedFinal} ج.م
                  </strong>
                </div>

                {/* Big Print & Settle Button */}
                <button
                  onClick={handleSettleAndPrint}
                  disabled={settlingTicket}
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 disabled:opacity-50"
                >
                  <Printer className="w-5 h-5" />
                  <span>
                    {settlingTicket ? "جارٍ التحصيل..." : `تحصيل ${calculatedFinal} ج.م وطباعة الإيصال 🖨️`}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ─────────────────────────────────────────────────────────────
          CASHIER SPECIALISTS SHIFT ATTENDANCE DRAWER / MODAL
         ───────────────────────────────────────────────────────────── */}
      {showShiftModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-sans no-print" dir="rtl">
          <div className="relative w-full max-w-2xl bg-[#12121a] border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">إدارة ورديات وحضور المختصين اليوم</h3>
                  <p className="text-xs text-slate-400">تفعيل حضور المختص لبدء استقبال الحجوزات أو تعطيله عند المغادرة/الإجازة 💈</p>
                </div>
              </div>
              <button
                onClick={() => setShowShiftModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
              {specialists.map((spec) => (
                <div key={spec.id} className="p-4 rounded-2xl bg-[#181824] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-amber-500/40 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-amber-400 bg-black shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={spec.photo || "/logo.jpg"} alt={spec.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-sm text-white">{spec.name}</h4>
                        <span className="text-[10px] text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          كرسي #{spec.chairNumber}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{spec.title}</p>
                      {spec.statusReason && (
                        <p className="text-[10px] text-amber-300/80 pt-0.5">
                          📌 {spec.statusReason}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Shift Status Selector Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleQuickShiftStatus(spec.id, "AVAILABLE", "حاضر وبدأ الوردية")}
                      className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition border ${
                        spec.status === "AVAILABLE"
                          ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-md font-black"
                          : "bg-white/5 hover:bg-emerald-500/20 text-emerald-300 border-white/5"
                      }`}
                    >
                      بدأ الوردية 🟢
                    </button>
                    <button
                      onClick={() => handleQuickShiftStatus(spec.id, "WITH_CLIENT", "على الكرسي مع عميل")}
                      className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition border ${
                        spec.status === "WITH_CLIENT"
                          ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black"
                          : "bg-white/5 hover:bg-amber-500/20 text-amber-300 border-white/5"
                      }`}
                    >
                      على الكرسي 💺
                    </button>
                    <button
                      onClick={() => handleQuickShiftStatus(spec.id, "BREAK", "استراحة قصيرة")}
                      className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition border ${
                        spec.status === "BREAK"
                          ? "bg-sky-500 text-slate-950 border-sky-400 shadow-md font-black"
                          : "bg-white/5 hover:bg-sky-500/20 text-sky-300 border-white/5"
                      }`}
                    >
                      استراحة ☕
                    </button>
                    <button
                      onClick={() => handleQuickShiftStatus(spec.id, "OFF_DUTY", "انتهت الوردية ومشي")}
                      className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition border ${
                        spec.status === "OFF_DUTY"
                          ? "bg-slate-700 text-white border-slate-600 shadow-md font-black"
                          : "bg-white/5 hover:bg-slate-700 text-slate-300 border-white/5"
                      }`}
                    >
                      مشي / انتهى اليوم 🏠
                    </button>
                    <button
                      onClick={() => handleQuickShiftStatus(spec.id, "DAY_OFF", "إجازة رسمية")}
                      className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition border ${
                        spec.status === "DAY_OFF"
                          ? "bg-purple-600 text-white border-purple-500 shadow-md font-black"
                          : "bg-white/5 hover:bg-purple-600/30 text-purple-300 border-white/5"
                      }`}
                    >
                      إجازة 🏖️
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setShowShiftModal(false)}
                className="py-2 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition"
              >
                إغلاق النافذة ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          CASHIER ADMIT WALK-IN CUSTOMER TO CHAIR OR WAITING LOUNGE MODAL
         ───────────────────────────────────────────────────────────── */}
      {showAdmitModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex justify-center items-start sm:items-center py-6 sm:py-10 px-3 font-sans no-print"
          dir="rtl"
        >
          <div className="relative w-full max-w-md my-auto bg-[#12121a] border border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center">
                  <Scissors className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">استقبال وإجلاس زبون بالصالون 💺</h3>
                  <p className="text-[11px] text-slate-400">إجلاس فوري على الكرسي أو إضافة لصالة الاستراحة وقائمة الانتظار</p>
                </div>
              </div>
              <button
                onClick={() => setShowAdmitModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdmitCustomerToChair} className="overflow-y-auto pr-1 space-y-3 flex-1 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">اسم العميل *:</label>
                <input
                  type="text"
                  required
                  value={admitCustomerName}
                  onChange={(e) => setAdmitCustomerName(e.target.value)}
                  placeholder="مثال: محمد مصطفى"
                  className="w-full py-2.5 px-3 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-amber-400 font-bold"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">رقم هاتف العميل (اختياري للـ CRM وسجل الزيارات):</label>
                <input
                  type="text"
                  value={admitCustomerPhone}
                  onChange={(e) => setAdmitCustomerPhone(e.target.value)}
                  placeholder="010XXXXXXXX"
                  className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">تفضيل المتخصص والكرسي:</label>
                <select
                  required
                  value={admitSpecialistId}
                  onChange={(e) => {
                    setAdmitSpecialistId(e.target.value);
                    if (e.target.value === "FIRST_AVAILABLE") {
                      setAdmitMode("WAITING");
                    } else {
                      const spec = specialists.find((s) => s.id === e.target.value);
                      if (spec && spec.status !== "AVAILABLE") {
                        setAdmitMode("WAITING");
                      }
                    }
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-bold"
                >
                  <option value="FIRST_AVAILABLE">⏳ في انتظار أول كابتن يفضى (بدون تفضيل شخصي)</option>
                  {specialists.map((spec) => (
                    <option key={spec.id} value={spec.id}>
                      {spec.name} • كرسي #{spec.chairNumber} ({spec.status === "AVAILABLE" ? "متاح فوراً 🟢" : "مشغول على الكرسي 🔴"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Logic Explanations & Seating Mode Selection */}
              {(() => {
                const isFirst = admitSpecialistId === "FIRST_AVAILABLE" || !admitSpecialistId;
                const chosenSpec = specialists.find((s) => s.id === admitSpecialistId);
                const isSpecBusy = chosenSpec && chosenSpec.status !== "AVAILABLE";

                if (isFirst) {
                  return (
                    <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-[11px] space-y-1">
                      <div className="font-bold flex items-center gap-1">
                        <span>🛋️</span>
                        <span>صالة الاستراحة وقائمة الانتظار VIP</span>
                      </div>
                      <p className="text-slate-300 text-[10px] leading-relaxed">
                        سيتم تسجيل الزبون في قائمة الانتظار، وبمجرد فراغ أي كابتن بالصالون ستتمكن من إجلاسه فوراً بنقرة زر واحدة.
                      </p>
                    </div>
                  );
                }

                if (isSpecBusy) {
                  return (
                    <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] space-y-1">
                      <div className="font-black flex items-center gap-1">
                        <span>⚠️</span>
                        <span>الكابتن ({chosenSpec?.name}) مشغول حالياً على الكرسي #{chosenSpec?.chairNumber}</span>
                      </div>
                      <p className="text-slate-300 text-[10px] leading-relaxed">
                        الزبون اختار هذا الكابتن بالاسم ومستعد للانتظار. سيتم إدراج الزبون في "صالة الاستراحة وقائمة الانتظار"، وعند انتهاء الكابتن ستتمكن من إجلاسه فوراً 👑
                      </p>
                    </div>
                  );
                }

                // Specialist is AVAILABLE
                return (
                  <div className="space-y-2 pt-1">
                    <label className="text-slate-300 font-bold block mb-1">طريقة التوجيه المطلوبة:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAdmitMode("CHAIR")}
                        className={`p-2.5 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${
                          admitMode === "CHAIR"
                            ? "bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-md shadow-emerald-500/20"
                            : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-300"
                        }`}
                      >
                        💺 إجلاس فوري على الكرسي
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdmitMode("WAITING")}
                        className={`p-2.5 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${
                          admitMode === "WAITING"
                            ? "bg-sky-500 text-slate-950 border-sky-400 font-black shadow-md shadow-sky-500/20"
                            : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-300"
                        }`}
                      >
                        🛋️ صالة الاستراحة (ينتظر)
                      </button>
                    </div>
                  </div>
                );
              })()}

              <button
                type="submit"
                disabled={admittingClient}
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer pt-2"
              >
                {admittingClient
                  ? "جاري التسجيل..."
                  : admitMode === "CHAIR" && admitSpecialistId !== "FIRST_AVAILABLE"
                  ? "توجيه الزبون للكرسي وبدء الحلاقة 🚀"
                  : "تسجيل الزبون بصالة الاستراحة وقائمة الانتظار 🛋️"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SEAT WAITING CLIENT PICKER MODAL (اختيار الكرسي للإجلاس)
         ───────────────────────────────────────────────────────────── */}
      {showSeatPickerModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex justify-center items-start sm:items-center py-6 sm:py-10 px-3 font-sans no-print"
          dir="rtl"
        >
          <div className="relative w-full max-w-md my-auto bg-[#12121a] border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Scissors className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-black text-white">إجلاس العميل ({showSeatPickerModal.customerName}) 💺</h3>
                  <p className="text-[11px] text-slate-400">اختر الكرسي والكابتن المتاح لبدء الحلاقة فوراً</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSeatPickerModal(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto pr-1 space-y-2 flex-1">
              <span className="text-xs text-slate-300 font-bold block mb-1">الكباتن المتاحين في الصالون الآن:</span>
              {specialists.map((sp) => {
                const isAvailable = sp.status === "AVAILABLE";
                return (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => handleSeatWaitingTicket(showSeatPickerModal, sp.id)}
                    className={`w-full p-3 rounded-2xl border text-right transition flex items-center justify-between ${
                      isAvailable
                        ? "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/40 cursor-pointer"
                        : "bg-white/5 hover:bg-white/10 border-white/5 opacity-60 cursor-pointer"
                    }`}
                  >
                    <div>
                      <h4 className="font-black text-xs text-white">{sp.name}</h4>
                      <p className="text-[10px] text-slate-400">كرسي #{sp.chairNumber} • {sp.title || "حلاق ومصفف VIP"}</p>
                    </div>
                    <span
                      className={`py-1 px-2.5 rounded-xl text-[10px] font-black ${
                        isAvailable ? "bg-emerald-500 text-slate-950 font-black shadow-md" : "bg-white/10 text-amber-300"
                      }`}
                    >
                      {isAvailable ? "إجلاس على هذا الكرسي 💺" : "مشغول حالياً (تجاوز وإجلاس)"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. THERMAL RECEIPT PRINT TEMPLATE (80MM)
         ───────────────────────────────────────────────────────────── */}
      {lastPrintedTicket && (
        <div id="thermal-receipt" className="hidden print:block text-black font-sans" dir="rtl">
          <div className="text-center space-y-1 border-b-2 border-black pb-2 mb-2">
            <h2 className="text-lg font-black tracking-wider">مجموعة صالونات وسبا الباشا VIP</h2>
            <p className="text-[11px] font-mono font-bold">DAKN EL BASHA & HAMMAM EL BASHA</p>
            <p className="text-[10px]">
              {lastPrintedTicket.branch?.name || "فرع حدائق القبة"}
            </p>
            <p className="text-[10px] font-mono">
              تاريخ: {new Date().toLocaleDateString("ar-EG")} • {new Date().toLocaleTimeString("ar-EG")}
            </p>
            <p className="text-[11px] font-black font-mono">
              إيصال رقم: #{lastPrintedTicket.ticketNumber}
            </p>
          </div>

          <div className="text-[11px] space-y-1.5 border-b border-black pb-2 mb-2">
            <div className="flex justify-between">
              <span>العميل:</span>
              <strong>{lastPrintedTicket.customerName}</strong>
            </div>
            <div className="flex justify-between">
              <span>المتخصص والكرسي:</span>
              <strong className="text-right">
                {lastPrintedTicket.specialist?.name || "كابتن صدام"} • كرسي #{lastPrintedTicket.chairNumber || 1}
              </strong>
            </div>
            <div className="flex justify-between">
              <span>الكاشير:</span>
              <strong>{lastPrintedTicket.cashierName || currentUser?.name || "المايسترو"}</strong>
            </div>
            <div className="flex justify-between">
              <span>طريقة الدفع:</span>
              <strong>
                {lastPrintedTicket.paymentMethod === "CASH"
                  ? "نقداً (كاش) 💵"
                  : lastPrintedTicket.paymentMethod === "CARD"
                  ? "بطاقة بنكية (فيزا) 💳"
                  : lastPrintedTicket.paymentMethod === "INSTAPAY"
                  ? "انستاباي InstaPay ⚡"
                  : "فودافون كاش 📱"}
              </strong>
            </div>
          </div>

          {/* Items */}
          <div className="text-[11px] space-y-1 border-b border-black pb-2 mb-2">
            <p className="font-black">تفاصيل الحساب:</p>
            {(() => {
              let s: any[] = [];
              try {
                s = typeof lastPrintedTicket.services === "string" ? JSON.parse(lastPrintedTicket.services) : lastPrintedTicket.services || [];
              } catch {}
              return s.map((it: any, idx: number) => (
                <div key={idx} className="flex justify-between">
                  <span>{it.nameAr}</span>
                  <span className="font-mono font-bold">{it.price} ج</span>
                </div>
              ));
            })()}

            {(() => {
              let r: any[] = [];
              try {
                r = typeof lastPrintedTicket.retailItems === "string" ? JSON.parse(lastPrintedTicket.retailItems) : lastPrintedTicket.retailItems || [];
              } catch {}
              return r.map((it: any, idx: number) => (
                <div key={`pr-${idx}`} className="flex justify-between">
                  <span>{it.nameAr} (×{it.qty})</span>
                  <span className="font-mono font-bold">{it.total} ج</span>
                </div>
              ));
            })()}
          </div>

          <div className="text-[12px] space-y-1 font-black border-b-2 border-black pb-2 mb-2">
            <div className="flex justify-between text-sm">
              <span>المبلغ الإجمالي المدفوع:</span>
              <span className="font-mono text-base">{lastPrintedTicket.finalAmount} ج.م</span>
            </div>
          </div>

          <div className="text-center text-[10px] space-y-1 pt-1.5 border-t border-black">
            <p className="font-bold">{settings?.receiptFooterNotes || "شكراً لزيارتكم صالون صدام الملكي 👑"}</p>
            <p className="font-mono font-black text-[11px]">
              خدمة العملاء والحجز: {settings?.hotline || "01121537537"}
            </p>
            <p className="text-[9px] text-gray-700">
              📍 حدائق القبة: 87 شارع مصر والسودان • 📍 مدينة نصر: 28 شارع مصطفى حمام
            </p>
          </div>
        </div>
      )}
      {/* ─────────────────────────────────────────────────────────────
          4. POS CLOSE SHIFT MODAL (إقفال وتسليم الوردية)
         ───────────────────────────────────────────────────────────── */}
      {showCloseShiftModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex justify-center items-start sm:items-center py-6 sm:py-10 px-3 font-sans no-print"
          dir="rtl"
        >
          <div className="relative w-full max-w-lg my-auto bg-[#12121a] border border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-black text-white">إقفال وردية الكاشير وتسليم النقدية</h3>
                  <p className="text-[11px] text-amber-300 font-bold">
                    وردية #{openShift?.shiftNumber || 1} • {openShift?.branch?.name || currentUser?.branchName || "الفرع الحالي"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCloseShiftModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto pr-1 space-y-3 flex-1">
              {/* Live Shift Drawer Breakdown */}
              <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2 pb-2 border-b border-white/10">
                  <div>
                    <span className="text-slate-400 block text-[10px]">الكاشير المسؤول:</span>
                    <span className="text-white font-bold">{openShift?.openedBy || currentUser?.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">بدء الوردية:</span>
                    <span className="text-amber-300 font-mono text-[11px]">
                      {openShift?.openedAt
                        ? new Date(openShift.openedAt).toLocaleTimeString("ar-EG", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "الآن"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-slate-400 block text-[10px]">إيراد الحلاقة:</span>
                    <span className="font-mono font-bold text-white">
                      {shiftStats?.servicesTotal || 0} ج
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-slate-400 block text-[10px]">إيراد المنتجات:</span>
                    <span className="font-mono font-bold text-white">
                      {shiftStats?.retailTotal || 0} ج
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-slate-400 block text-[10px]">سلف المختصين:</span>
                    <span className="font-mono font-bold text-rose-300">
                      -{shiftStats?.advancesPayouts || 0} ج
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-slate-400 block text-[10px]">المصروفات:</span>
                    <span className="font-mono font-bold text-rose-300">
                      -{shiftStats?.expensesTotal || 0} ج
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px]">
                  <span className="text-slate-400 font-bold">المقبوضات:</span>
                  <span className="font-mono text-slate-300">
                    كاش: <strong className="text-amber-300">{shiftStats?.cashCollected || 0} ج</strong> • 
                    إلكتروني:{" "}
                    <strong className="text-sky-300">
                      {(shiftStats?.visaCollected || 0) +
                        (shiftStats?.instapayCollected || 0) +
                        (shiftStats?.vodafoneCollected || 0)}{" "}
                      ج
                    </strong>
                  </span>
                </div>

                {/* Expected Drawer Cash */}
                <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-amber-300 block">النقدية المحسوبة المتوقعة بالدرج:</span>
                    <span className="text-[10px] text-slate-400">كاش المقبوضات - سلف الكاش - مصروفات الكاش</span>
                  </div>
                  <span className="text-lg font-mono font-black text-amber-400">
                    {shiftStats?.expectedCash || 0} ج.م
                  </span>
                </div>
              </div>

              <form onSubmit={handleExecuteCloseShift} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    النقدية الفعلية بعد الجرد بالدرج (ج.م) *:
                  </label>
                  <input
                    type="number"
                    required
                    value={shiftForm.actualCash}
                    onChange={(e) => setShiftForm({ ...shiftForm, actualCash: Number(e.target.value) })}
                    className="w-full py-2.5 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono font-bold text-base focus:border-amber-400"
                  />
                </div>

                {/* Live difference indicator */}
                {(() => {
                  const diff = Number(shiftForm.actualCash) - Number(shiftStats?.expectedCash || 0);
                  return (
                    <div
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold ${
                        diff === 0
                          ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                          : diff < 0
                          ? "bg-rose-500/15 border-rose-500/30 text-rose-300"
                          : "bg-sky-500/15 border-sky-500/30 text-sky-300"
                      }`}
                    >
                      <span>حالة مطابقة الدرج:</span>
                      <span className="font-mono font-black">
                        {diff === 0
                          ? "النقدية متطابقة تماماً مع الحسابات ✅ (0 ج.م)"
                          : diff < 0
                          ? `يوجد عجز نقدي بالدرج: ${diff} ج.م 🔴`
                          : `يوجد فائض نقدي بالدرج: +${diff} ج.م 🟢`}
                      </span>
                    </div>
                  );
                })()}

                <div>
                  <label className="text-slate-300 font-bold block mb-1">تم تسليم النقدية إلى *:</label>
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      required
                      value={shiftForm.handedTo}
                      onChange={(e) => setShiftForm({ ...shiftForm, handedTo: e.target.value })}
                      placeholder="مثال: أ/ حمزة عباس (المايسترو - المالك) 👑"
                      className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-bold"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "أ/ حمزة عباس (المايسترو - المالك) 👑",
                        "مدير الفرع المناوب 👔",
                        "الخزنة الرئيسية للصالون 🏦",
                      ].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setShiftForm({ ...shiftForm, handedTo: opt })}
                          className="py-0.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] border border-white/5 cursor-pointer"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">ملاحظات الإقفال (اختياري):</label>
                  <input
                    type="text"
                    value={shiftForm.notes}
                    onChange={(e) => setShiftForm({ ...shiftForm, notes: e.target.value })}
                    placeholder="أي ملاحظات حول التوريد أو الوردية"
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={closingShift}
                  className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  <span>{closingShift ? "جاري الإقفال..." : "إقفال الوردية وطباعة إيصال التسليم 🔒🖨️"}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. QUICK CASH ADVANCE MODAL (سلفة كاش لمختص من الدرج)
         ───────────────────────────────────────────────────────────── */}
      {showAdvanceModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex justify-center items-start sm:items-center py-6 sm:py-10 px-3 font-sans no-print"
          dir="rtl"
        >
          <div className="relative w-full max-w-sm my-auto bg-[#12121a] border border-sky-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-black text-white">صرف سلفة كاش لمختص من الدرج</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAdvanceModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordAdvance} className="overflow-y-auto pr-1 space-y-3 flex-1 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">المتخصص المستلم للسلفة:</label>
                <select
                  required
                  value={advanceSpecId}
                  onChange={(e) => setAdvanceSpecId(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-bold"
                >
                  <option value="">-- اختر المتخصص --</option>
                  {specialists.map((sp) => (
                    <option key={sp.id} value={sp.id}>
                      {sp.name} • كرسي #{sp.chairNumber} ({sp.branch?.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">المبلغ المصروف (ج.م):</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                  className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">البيان أو الملاحظات:</label>
                <input
                  type="text"
                  value={advanceNotes}
                  onChange={(e) => setAdvanceNotes(e.target.value)}
                  placeholder="سلفة نقدية من درج الكاشير"
                  className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
                ⚡ سيتم خصم هذا المبلغ فورياً من نقدية الدرج الحالية، وتسجيله في كشف حساب المتخصص كحركة سلفة مدينة (-).
              </div>

              <button
                type="submit"
                disabled={savingAdvance}
                className="w-full py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs transition shadow-lg shadow-sky-500/20 cursor-pointer disabled:opacity-50"
              >
                {savingAdvance ? "جاري التسجيل..." : "تأكيد صرف السلفة وتحديث الدرج 💸"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. QUICK TREASURY / SAFE SUMMARY MODAL (ملخص اليومية والخزنة)
         ───────────────────────────────────────────────────────────── */}
      {showTreasuryModal && treasurySummary && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex justify-center items-start sm:items-center py-6 sm:py-10 px-3 font-sans no-print"
          dir="rtl"
        >
          <div className="relative w-full max-w-md my-auto bg-[#12121a] border border-emerald-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-black text-white">ملخص خزنة ودرج اليوم</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTreasuryModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto pr-1 space-y-3 flex-1 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-2xl bg-black/60 border border-white/10">
                  <span className="text-slate-400 block text-[10px]">إجمالي المبيعات اليوم:</span>
                  <span className="text-lg font-mono font-black text-white">
                    {(treasurySummary.totalSales ?? treasurySummary.totalRevenue ?? 0).toLocaleString()} ج.م
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30">
                  <span className="text-amber-300 font-bold block text-[10px]">صافي نقدية الدرج الآن:</span>
                  <span className="text-lg font-mono font-black text-amber-400">
                    {(treasurySummary.netDrawerCash ?? treasurySummary.netCashInDrawer ?? 0).toLocaleString()} ج.م
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">حلاقة وخدمات وبكجات:</span>
                  <span className="font-mono text-white font-bold">
                    {(treasurySummary.servicesTotal ?? treasurySummary.servicesRevenue ?? 0).toLocaleString()} ج.م
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">بيع منتجات ومستحضرات:</span>
                  <span className="font-mono text-white font-bold">
                    {(treasurySummary.retailTotal ?? treasurySummary.retailRevenue ?? 0).toLocaleString()} ج.م
                  </span>
                </div>
                <div className="flex justify-between text-emerald-300">
                  <span>مقبوضات كاش نقدي:</span>
                  <span className="font-mono font-bold">
                    +{(treasurySummary.cashCollected ?? treasurySummary.cashRevenue ?? 0).toLocaleString()} ج.م
                  </span>
                </div>
                <div className="flex justify-between text-sky-300">
                  <span>مقبوضات إلكتروني (فيزا/انستاباي/فودافون):</span>
                  <span className="font-mono font-bold">
                    +{(
                      treasurySummary.electronicCollected ??
                      ((treasurySummary.visaRevenue || 0) +
                        (treasurySummary.instapayRevenue || 0) +
                        (treasurySummary.vodafoneRevenue || 0))
                    ).toLocaleString()}{" "}
                    ج.م
                  </span>
                </div>
                <div className="flex justify-between text-rose-300">
                  <span>سلف نقدية منصرفة من الدرج:</span>
                  <span className="font-mono font-bold">
                    -{(treasurySummary.advancesPaid ?? treasurySummary.specialistAdvances ?? 0).toLocaleString()} ج.م
                  </span>
                </div>
                <div className="flex justify-between text-rose-400">
                  <span>مصروفات ونثريات نقدية:</span>
                  <span className="font-mono font-bold">
                    -{(treasurySummary.expensesPaid ?? treasurySummary.generalExpenses ?? 0).toLocaleString()} ج.م
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowTreasuryModal(false)}
                className="w-full py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-black text-xs transition cursor-pointer"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          7. THERMAL SHIFT HANDOVER Z-REPORT (80MM PRINT TEMPLATE)
         ───────────────────────────────────────────────────────────── */}
      {lastClosedShift && (
        <div id="shift-handover-receipt" className="hidden print:block text-black font-sans" dir="rtl">
          <div className="text-center space-y-1 border-b-2 border-black pb-2 mb-2">
            <h2 className="text-lg font-black tracking-wider">مجموعة صالونات وسبا الباشا VIP</h2>
            <p className="text-[11px] font-mono font-bold">تقرير إقفال وتسليم وردية الكاشير (Z-Report)</p>
            <p className="text-[10px]">{lastClosedShift.branch?.name || "فرع حدائق القبة"}</p>
            <p className="text-[11px] font-black font-mono">وردية رقم: #{lastClosedShift.shiftNumber}</p>
            <p className="text-[10px]">الكاشير: {lastClosedShift.openedBy}</p>
            <p className="text-[10px] font-mono">
              تاريخ الإقفال: {new Date(lastClosedShift.closedAt || new Date()).toLocaleDateString("ar-EG")} •{" "}
              {new Date(lastClosedShift.closedAt || new Date()).toLocaleTimeString("ar-EG")}
            </p>
          </div>

          <div className="text-[11px] space-y-1.5 border-b border-black pb-2 mb-2">
            <div className="flex justify-between">
              <span>عدد الفواتير / التذاكر:</span>
              <strong>{lastClosedShift.ticketsCount} تذكرة</strong>
            </div>
            <div className="flex justify-between">
              <span>إيراد الحلاقة والخدمات:</span>
              <strong>{lastClosedShift.servicesTotal} ج.م</strong>
            </div>
            <div className="flex justify-between">
              <span>إيراد بيع المنتجات والمستحضرات:</span>
              <strong>{lastClosedShift.retailTotal} ج.م</strong>
            </div>
            <div className="flex justify-between font-bold">
              <span>إجمالي الإيرادات:</span>
              <strong>
                {(lastClosedShift.servicesTotal || 0) + (lastClosedShift.retailTotal || 0)} ج.م
              </strong>
            </div>
          </div>

          <div className="text-[11px] space-y-1 border-b border-black pb-2 mb-2">
            <p className="font-black">تفاصيل المقبوضات والدرج:</p>
            <div className="flex justify-between">
              <span>المقبوض نقداً (كاش):</span>
              <strong>{lastClosedShift.cashCollected} ج.م</strong>
            </div>
            <div className="flex justify-between">
              <span>فيزا وبطاقات بنكية:</span>
              <strong>{lastClosedShift.visaCollected} ج.م</strong>
            </div>
            <div className="flex justify-between">
              <span>انستاباي InstaPay:</span>
              <strong>{lastClosedShift.instapayCollected} ج.م</strong>
            </div>
            <div className="flex justify-between">
              <span>فودافون كاش:</span>
              <strong>{lastClosedShift.vodafoneCollected} ج.م</strong>
            </div>
            <div className="flex justify-between text-rose-700">
              <span>سلف منصرفة للمختصين:</span>
              <strong>-{lastClosedShift.advancesPayouts} ج.م</strong>
            </div>
            <div className="flex justify-between text-rose-700">
              <span>مصروفات ونثريات نقدية:</span>
              <strong>-{lastClosedShift.expensesTotal} ج.م</strong>
            </div>
          </div>

          <div className="text-[12px] space-y-1 border-b-2 border-black pb-2 mb-2 font-black">
            <div className="flex justify-between">
              <span>النقدية المتوقعة بالدرج:</span>
              <span className="font-mono">{lastClosedShift.expectedCash} ج.م</span>
            </div>
            <div className="flex justify-between">
              <span>النقدية الفعلية المسلمة:</span>
              <span className="font-mono text-base">{lastClosedShift.actualCash} ج.م</span>
            </div>
            <div className="flex justify-between">
              <span>الفارق (مطابقة / عجز / زيادة):</span>
              <span className="font-mono">
                {lastClosedShift.difference === 0
                  ? "متطابق تماماً (0 ج.م) ✅"
                  : `${lastClosedShift.difference} ج.م`}
              </span>
            </div>
          </div>

          <div className="text-[11px] space-y-2 border-b border-black pb-2 mb-2">
            <div>
              <span className="block font-bold">تم تسليم النقدية إلى:</span>
              <span className="font-black text-xs block mt-0.5">
                👑 {lastClosedShift.handedTo || "أ/ حمزة عباس (المايسترو)"}
              </span>
            </div>
            {lastClosedShift.notes && (
              <div>
                <span className="block font-bold text-[10px]">ملاحظات الإقفال:</span>
                <span className="text-[10px] block">{lastClosedShift.notes}</span>
              </div>
            )}
          </div>

          <div className="text-[10px] grid grid-cols-2 gap-4 pt-3 pb-4">
            <div className="text-center space-y-6">
              <p className="font-bold">توقيع الكاشير المسلّم</p>
              <p className="border-t border-black pt-1">.........................</p>
            </div>
            <div className="text-center space-y-6">
              <p className="font-bold">توقيع المستلم (المالك)</p>
              <p className="border-t border-black pt-1">.........................</p>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          8. LUXURY VIP FLOATING TOAST NOTIFICATION (NO WINDOWS ALERTS!)
         ───────────────────────────────────────────────────────────── */}
      {posToast && (
        <div
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] sm:w-auto animate-fade-in font-sans no-print"
          dir="rtl"
        >
          <div
            className={`py-3 px-5 rounded-2xl shadow-2xl border backdrop-blur-xl flex items-center gap-3 text-xs font-black ${
              posToast.type === "success"
                ? "bg-emerald-950/90 border-emerald-500/60 text-emerald-200 shadow-emerald-950/50"
                : posToast.type === "error"
                ? "bg-rose-950/90 border-rose-500/60 text-rose-200 shadow-rose-950/50"
                : "bg-amber-950/90 border-amber-500/60 text-amber-200 shadow-amber-950/50"
            }`}
          >
            <span className="text-base">
              {posToast.type === "success" ? "✅" : posToast.type === "error" ? "⚠️" : "👑"}
            </span>
            <span className="flex-1 leading-relaxed">{posToast.message}</span>
            <button
              onClick={() => setPosToast(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
