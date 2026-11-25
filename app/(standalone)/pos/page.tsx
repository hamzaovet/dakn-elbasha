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
  Barcode,
  Share2,
  ExternalLink,
  QrCode,
  Eye,
  Check,
} from "lucide-react";
import QRCode from "qrcode";
import { generateCode128Svg } from "@/lib/barcode-svg";
import { playAttendanceChime } from "@/lib/attendance-sound";

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

  // Initial Services Selected by Cashier in Admit Modal
  const [admitSelectedServices, setAdmitSelectedServices] = useState<any[]>([]);
  const [servicesCatalog, setServicesCatalog] = useState<any[]>([]);
  const [admitServiceCategory, setAdmitServiceCategory] = useState<string>("ALL");
  const [admitServiceSearch, setAdmitServiceSearch] = useState<string>("");

  // Supervisor Cancellation Request Modal State
  const [showCancelRequestModal, setShowCancelRequestModal] = useState<any>(null); // ticket
  const [cancelReason, setCancelReason] = useState<string>("");
  const [submittingCancelRequest, setSubmittingCancelRequest] = useState<boolean>(false);

  // Active Ticket Selected for Checkout
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  // Settlement Inputs
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [settlingTicket, setSettlingTicket] = useState<boolean>(false);

  // Completed / Printed Receipt Order
  const [lastPrintedTicket, setLastPrintedTicket] = useState<any>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [receiptPrintMode, setReceiptPrintMode] = useState<"THERMAL_80MM" | "A4_INVOICE">("THERMAL_80MM");
  const [receiptQrDataUrl, setReceiptQrDataUrl] = useState<string>("");

  // Generate Crisp QR Code for the receipt
  useEffect(() => {
    if (lastPrintedTicket) {
      const qrData = `https://daknelbasha.com/receipt?ticket=${lastPrintedTicket.ticketNumber || lastPrintedTicket.id}&amount=${lastPrintedTicket.finalAmount}`;
      QRCode.toDataURL(qrData, {
        width: 180,
        margin: 1,
        color: { dark: "#000000", light: "#ffffff" },
      })
        .then(setReceiptQrDataUrl)
        .catch(console.error);
    }
  }, [lastPrintedTicket]);

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

  // Customer Edit State for Checkout
  const [checkoutCustomerName, setCheckoutCustomerName] = useState<string>("");
  const [checkoutCustomerPhone, setCheckoutCustomerPhone] = useState<string>("");

  // Barcode Gun Scanner State for Cashier POS
  const [posBarcodeInput, setPosBarcodeInput] = useState<string>("");
  const posBarcodeInputRef = useRef<HTMLInputElement>(null);

  // Attendance Punch State
  const [isCheckedIn, setIsCheckedIn] = useState<boolean>(false);
  const [punchingAttendance, setPunchingAttendance] = useState<boolean>(false);

  // Check Auth
  useEffect(() => {
    try {
      const saved = localStorage.getItem("basha_staff_user") || localStorage.getItem("saddam_staff_user");
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
      checkAttendanceStatus(user.id);
    } catch {
      router.push("/login");
    }
  }, [router]);

  const checkAttendanceStatus = async (uid: string) => {
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uid, action: "STATUS" }),
      });
      const data = await res.json();
      if (data.success) {
        setIsCheckedIn(data.isCheckedIn);
      }
    } catch {}
  };

  const handlePunchAttendance = async (action: "CHECK_IN" | "CHECK_OUT") => {
    if (!currentUser) return;
    try {
      setPunchingAttendance(true);
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          branchId: currentUser.branchId || activeBranchId,
          action,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", data.message);
        checkAttendanceStatus(currentUser.id);
      } else {
        showToast("error", data.error || "فشل تسجيل البصمة");
      }
    } catch {
      showToast("error", "حدث خطأ أثناء تسجيل البصمة");
    } finally {
      setPunchingAttendance(false);
    }
  };

  // Privileges & Branch Locking
  const isOwnerOrGM = currentUser?.role === "owner" || currentUser?.role === "general_manager";
  const isBranchStaff = !isOwnerOrGM;

  // Identify Branches
  const hammamBranch = branches.find(
    (b) => b.code === "BR-HAMMAM-WOMEN" || b.name?.includes("حمام") || b.name?.includes("حريمي")
  );
  const daknBranch = branches.find(
    (b) => b.code === "BR-DAKN-MEN" || b.name?.includes("دقن") || b.name?.includes("رجالي")
  );
  const newSkinBranch = branches.find(
    (b) => b.code === "BR-NEWSKIN" || b.name?.includes("نيو سكين") || b.name?.includes("Skin")
  );

  // Effective Active Branch ID: Strictly locked to user branch if staff/manager
  const activeBranchId = isOwnerOrGM ? selectedBranchId : (currentUser?.branchId || branches[0]?.id || "ALL");

  // Visual Themes: New Skin (Clinic) vs Women's Spa (Hammam) vs Men's (Dakn)
  const isNewSkinTheme = Boolean(
    currentUser?.branch?.name?.includes("نيو سكين") ||
    currentUser?.branch?.code === "BR-NEWSKIN" ||
    currentUser?.username?.includes("skin") ||
    (newSkinBranch && activeBranchId === newSkinBranch.id) ||
    (branches.find((b) => b.id === activeBranchId)?.name?.includes("نيو سكين")) ||
    (branches.find((b) => b.id === activeBranchId)?.code === "BR-NEWSKIN")
  );
  const isWomenTheme = Boolean(
    !isNewSkinTheme && (
      currentUser?.branch?.name?.includes("حمام") ||
      currentUser?.branch?.name?.includes("حريمي") ||
      currentUser?.branch?.code === "BR-HAMMAM-WOMEN" ||
      currentUser?.username?.includes("hammam") ||
      (hammamBranch && activeBranchId === hammamBranch.id) ||
      (branches.find((b) => b.id === activeBranchId)?.name?.includes("حمام")) ||
      (branches.find((b) => b.id === activeBranchId)?.name?.includes("حريمي")) ||
      (branches.find((b) => b.id === activeBranchId)?.code === "BR-HAMMAM-WOMEN")
    )
  );
  const isMenTheme = Boolean(
    !isWomenTheme && !isNewSkinTheme && (
      currentUser?.branch?.name?.includes("دقن") ||
      currentUser?.branch?.name?.includes("رجالي") ||
      currentUser?.branch?.code === "BR-DAKN-MEN" ||
      currentUser?.username?.includes("dakn") ||
      (daknBranch && activeBranchId === daknBranch.id) ||
      (branches.find((b) => b.id === activeBranchId)?.name?.includes("دقن")) ||
      (branches.find((b) => b.id === activeBranchId)?.name?.includes("رجالي")) ||
      (branches.find((b) => b.id === activeBranchId)?.code === "BR-DAKN-MEN")
    )
  );

  const isFetchingRef = useRef<boolean>(false);

  // 1. Static Data (Branches, Products, Settings, Services Catalog)
  const fetchStaticData = async () => {
    try {
      const [resB, resP, resSet, resSrv] = await Promise.all([
        fetch("/api/branches", { cache: "no-store" }),
        fetch(`/api/products?branchId=${activeBranchId || "ALL"}`, { cache: "no-store" }),
        fetch("/api/settings", { cache: "no-store" }),
        fetch("/api/services", { cache: "no-store" }),
      ]);

      const [dataB, dataP, dataSet, dataSrv] = await Promise.all([
        resB.json(),
        resP.json(),
        resSet.json(),
        resSrv.json(),
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
      if (dataP.success && dataP.products) {
        setRetailProducts(dataP.products);
      }
      if (dataSrv.success && dataSrv.services) {
        setServicesCatalog(dataSrv.services);
      }
    } catch (e) {
      console.error("Static data fetch error:", e);
    }
  };

  // 2. High-Speed Dynamic Polling (Only Active Tickets & Specialist Statuses)
  const fetchDynamicPosData = async () => {
    if (isFetchingRef.current) return;
    // Pause polling if tab is hidden or modal is open to eliminate any UI lag or database lock
    if (typeof document !== "undefined" && document.hidden) return;
    if (showReceiptModal || showCloseShiftModal || showAdmitModal || showTreasuryModal || showAdvanceModal || showCancelRequestModal) return;

    try {
      isFetchingRef.current = true;
      const [resT, resSpec] = await Promise.all([
        fetch(`/api/tickets?branchId=${activeBranchId || "ALL"}&activeOnly=true`, { cache: "no-store" }),
        fetch(`/api/specialists?branchId=${activeBranchId || "ALL"}`, { cache: "no-store" }),
      ]);

      const [dataT, dataSpec] = await Promise.all([resT.json(), resSpec.json()]);

      if (dataT.success && dataT.tickets) {
        setTickets(dataT.tickets);
        // If a ticket is currently selected, update only if changed
        if (selectedTicket) {
          const fresh = dataT.tickets.find((t: any) => t.id === selectedTicket.id);
          if (fresh && (fresh.status !== selectedTicket.status || fresh.servicesTotal !== selectedTicket.servicesTotal)) {
            setSelectedTicket(fresh);
          }
        }
      }

      if (dataSpec.success && dataSpec.specialists) {
        setSpecialists(dataSpec.specialists);
      }
    } catch (e) {
      console.error("Dynamic POS fetch error:", e);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  };

  const fetchPosData = async () => {
    await Promise.all([fetchStaticData(), fetchDynamicPosData()]);
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
          initialServices: admitSelectedServices,
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
        setAdmitSelectedServices([]);
        await fetchDynamicPosData();
      } else {
        showToast("error", data.error || "فشل تسجيل العميل");
      }
    } catch {
      showToast("error", "تعذر الاتصال بالخادم");
    } finally {
      setAdmittingClient(false);
    }
  };

  // Submit Cancellation Request to General Supervisor (Ahmed) or Branch Manager
  const handleSubmitCancelRequest = async () => {
    if (!showCancelRequestModal) return;
    try {
      setSubmittingCancelRequest(true);
      const res = await fetch("/api/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REQUEST_CANCELLATION",
          ticketId: showCancelRequestModal.id,
          reason: cancelReason.trim() || "طلب إلغاء من الكاشير",
          requestedBy: currentUser?.name || "كاشير الصالون",
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("info", "تم إرسال طلب إلغاء الفاتورة للمشرف العام (أ/ أحمد) بنجاح ⏳");
        setShowCancelRequestModal(null);
        setCancelReason("");
        await fetchDynamicPosData();
      } else {
        showToast("error", data.error || "فشل إرسال طلب الإلغاء");
      }
    } catch {
      showToast("error", "تعذر الاتصال بالخادم");
    } finally {
      setSubmittingCancelRequest(false);
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
      const res = await fetch(`/api/shifts?branchId=${activeBranchId || "ALL"}`);
      const data = await res.json();
      if (data.success) {
        setShiftStats(data.liveStats);
        setOpenShift(data.openShift);
        setShiftForm({
          actualCash: data.liveStats?.expectedCash || 0,
          handedTo: isWomenTheme
            ? "أ / ندى المحمدي (مديرة فرع حمام الباشا VIP) 🧖‍♀️"
            : isMenTheme
            ? "أ / أحمد عبد الرحيم (مدير فرع صالون دقن الباشا) 💈"
            : "أ/ حمزة عباس (المايسترو - المالك) 👑",
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
          branchId: chosen?.branchId || (activeBranchId !== "ALL" ? activeBranchId : branches[0]?.id),
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
      const res = await fetch(`/api/treasury?period=TODAY&branchId=${activeBranchId || "ALL"}`);
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
      fetchStaticData();
      fetchDynamicPosData();
      const interval = setInterval(fetchDynamicPosData, 7500);
      return () => clearInterval(interval);
    }
  }, [currentUser, selectedBranchId, activeBranchId]);

  // Select Ticket for Checkout
  const handleSelectTicket = (t: any) => {
    setSelectedTicket(t);
    setDiscountAmount(0);
    setTipAmount(0);
    setPaymentMethod("CASH");
    setCheckoutCustomerName(t.customerName?.startsWith("عميل صالة") ? "" : (t.customerName || ""));
    setCheckoutCustomerPhone(t.customerPhone || "");
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

  // Scan Barcode with Laser Gun and Add Product to Ticket
  const handleScanBarcodeInPos = async (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;

    // Search in retailProducts by barcode
    const foundProduct = retailProducts.find(
      (p) => p.barcode && p.barcode.trim().toLowerCase() === cleanCode.toLowerCase()
    );

    if (!foundProduct) {
      showToast("error", `⚠️ هذا الباركود [${cleanCode}] غير مسجل بأي منتج في المنظومة!`);
      setPosBarcodeInput("");
      return;
    }

    if (!selectedTicket) {
      showToast("error", `يرجى اختيار تذكرة عميل أولاً، أو فتح فاتورة بيع مباشر سريع لإضافة (${foundProduct.nameAr}) 🛒`);
      setPosBarcodeInput("");
      return;
    }

    if (foundProduct.stockQty <= 0) {
      showToast("error", `عفواً، رصيد المنتج (${foundProduct.nameAr}) نفذ بالكامل من المخزن (0)!`);
      setPosBarcodeInput("");
      return;
    }

    await handleAddRetailProduct(foundProduct);
    showToast("success", `✅ تم مسح وإضافة (${foundProduct.nameAr}) لسلة العميل بنجاح! 🛒`);
    setPosBarcodeInput("");
    setTimeout(() => {
      posBarcodeInputRef.current?.focus();
    }, 100);
  };

  // Open Quick Direct Retail Ticket (Walk-in Customer Buying Retail)
  const handleCreateQuickRetailTicket = async () => {
    if (!activeBranchId) return;
    try {
      const spec = specialists[0];
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          specialistId: spec?.id || "spec-retail",
          branchId: activeBranchId,
          customerName: "عميل شراء مباشر 🛍️",
          status: "READY_FOR_CASHIER",
          initialServices: [],
          notes: "فاتورة بيع منتجات ومستحضرات تجميل مباشرة",
        }),
      });
      const data = await res.json();
      if (data.success && data.ticket) {
        setSelectedTicket(data.ticket);
        await fetchPosData();
        showToast("success", "تم فتح فاتورة بيع مباشر جديدة! جاهز لمسح الباركود 🔫");
        setTimeout(() => {
          posBarcodeInputRef.current?.focus();
        }, 150);
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
          cashierName: currentUser?.name || "كاشير مجموعة الباشا VIP",
          customerName: checkoutCustomerName.trim() || selectedTicket.customerName,
          customerPhone: checkoutCustomerPhone.trim() || selectedTicket.customerPhone,
        }),
      });

      const data = await res.json();
      if (data.success && data.ticket) {
        setLastPrintedTicket(data.ticket);
        setSelectedTicket(null);
        setShowReceiptModal(true);
        fetchPosData();

        // Trigger direct thermal print with high-precision 80mm window
        setTimeout(() => {
          executePrintThermal(data.ticket);
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

  // 1. Direct Thermal Print (80mm / 76mm printable roll for Xprinter & POS)
  const executePrintThermal = (ticket: any) => {
    if (!ticket) return;

    let services: any[] = [];
    try {
      services = typeof ticket.services === "string" ? JSON.parse(ticket.services) : ticket.services || [];
    } catch {}

    let retailItems: any[] = [];
    try {
      retailItems = typeof ticket.retailItems === "string" ? JSON.parse(ticket.retailItems) : ticket.retailItems || [];
    } catch {}

    const barcodeSvg = generateCode128Svg(ticket.ticketNumber || "CHK-IN-0000", {
      height: 38,
      moduleWidth: 1.6,
      includeText: true,
      fontSize: 10,
    });

    const isHammam = ticket.branch?.name?.includes("حمام") || isWomenTheme;
    const isNewSkin =
      ticket.branch?.name?.includes("Skin") ||
      ticket.services?.includes("ليزر") ||
      ticket.services?.includes("بشرة") ||
      isNewSkinTheme;

    const brandName = isNewSkin
      ? "عيادة نيو سكين VIP (جلدية وليزر)"
      : isHammam
      ? "حمام وسبا الباشا VIP (حريمي)"
      : "صالون دقن الباشا VIP (رجالي)";

    const brandSub = isNewSkin
      ? "NEW SKIN CLINIC & LASER VIP"
      : isHammam
      ? "HAMMAM EL BASHA - LUXURY WOMEN SPA"
      : "DAKN EL BASHA - VIP MEN SALON";

    const printWin = window.open("", "_blank", "width=420,height=620");
    if (!printWin) {
      window.print();
      return;
    }

    const itemsRows = [
      ...services.map((it: any) => `
        <tr>
          <td style="padding: 4px 2px; text-align: right; font-weight: bold;">${it.nameAr}</td>
          <td style="padding: 4px 2px; text-align: center;">1</td>
          <td style="padding: 4px 2px; text-align: center; font-family: monospace;">${it.price}</td>
          <td style="padding: 4px 2px; text-align: left; font-weight: bold; font-family: monospace;">${it.price} ج</td>
        </tr>
      `),
      ...retailItems.map((it: any) => `
        <tr>
          <td style="padding: 4px 2px; text-align: right; font-weight: bold;">${it.nameAr}</td>
          <td style="padding: 4px 2px; text-align: center; font-family: monospace;">${it.qty}</td>
          <td style="padding: 4px 2px; text-align: center; font-family: monospace;">${it.price}</td>
          <td style="padding: 4px 2px; text-align: left; font-weight: bold; font-family: monospace;">${it.total} ج</td>
        </tr>
      `),
    ].join("");

    const payMethodName =
      ticket.paymentMethod === "CASH"
        ? "نقداً (كاش) 💵"
        : ticket.paymentMethod === "CARD"
        ? "بطاقة بنكية (فيزا) 💳"
        : ticket.paymentMethod === "INSTAPAY"
        ? "انستاباي InstaPay ⚡"
        : "فودافون كاش 📱";

    const rawTotal = (ticket.servicesTotal || 0) + (ticket.retailTotal || 0);

    printWin.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <title>إيصال #${ticket.ticketNumber}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Tahoma, Arial, sans-serif;
            width: 76mm;
            margin: 0 auto;
            padding: 3mm 2mm;
            color: #000;
            background: #fff;
            font-size: 11px;
            line-height: 1.35;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-left { text-align: left; }
          .bold { font-weight: bold; }
          .black { font-weight: 900; }
          .dashed-line {
            border-bottom: 1.5px dashed #000;
            margin: 6px 0;
          }
          .double-line {
            border-bottom: 2.5px double #000;
            margin: 6px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10.5px;
          }
          th {
            border-bottom: 1.5px solid #000;
            padding: 4px 2px;
            font-size: 10px;
          }
          .total-box {
            border: 2px solid #000;
            padding: 6px 8px;
            margin: 6px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 13px;
            font-weight: 900;
            background: #fbfbfb;
          }
          .barcode-wrap {
            margin: 6px 0 2px;
            display: flex;
            justify-content: center;
          }
          .barcode-wrap svg {
            max-width: 100%;
            height: auto;
          }
          .qr-wrap {
            display: flex;
            justify-content: center;
            margin: 6px 0 2px;
          }
          .qr-wrap img {
            width: 85px;
            height: 85px;
          }
          .cut-line {
            text-align: center;
            font-size: 8.5px;
            letter-spacing: 2px;
            margin-top: 8px;
            color: #444;
          }
        </style>
      </head>
      <body>
        <div class="text-center">
          <div style="font-size: 22px; line-height: 1;">👑</div>
          <div class="black" style="font-size: 14px; margin-top: 2px;">مجموعة صالونات وسبا الباشا VIP</div>
          <div class="bold" style="font-size: 12px; margin-top: 1px;">${brandName}</div>
          <div style="font-size: 9px; font-weight: 700; letter-spacing: 0.5px; margin-top: 1px;">${brandSub}</div>
          <div style="font-size: 9.5px; margin-top: 2px;">${ticket.branch?.name || "فرع حدائق القبة الملكي"}</div>
          <div style="font-size: 9px; color: #333;">73 ترعة الجبل، أمام مستشفى سان بول</div>
          <div style="font-size: 9.5px; font-weight: bold; margin-top: 1px;">الخط الساخن: 01210103025 - 01556782015</div>
        </div>

        <div class="dashed-line"></div>

        <div style="font-size: 10.5px;">
          <div style="display: flex; justify-content: space-between;">
            <span class="bold">إيصال رقم:</span>
            <span class="black" style="font-family: monospace; font-size: 12px;">#${ticket.ticketNumber}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 2px;">
            <span>التاريخ:</span>
            <span style="font-family: monospace;">${new Date().toLocaleDateString("ar-EG")} • ${new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 2px;">
            <span>العميل:</span>
            <span class="black">${ticket.customerName || "عميل الصالون VIP"}</span>
          </div>
          ${ticket.customerPhone ? `
          <div style="display: flex; justify-content: space-between; margin-top: 2px;">
            <span>الهاتف:</span>
            <span style="font-family: monospace;">${ticket.customerPhone}</span>
          </div>
          ` : ""}
          <div style="display: flex; justify-content: space-between; margin-top: 2px;">
            <span>المتخصص والكرسي:</span>
            <span class="bold">${ticket.specialist?.name || "كابتن الباشا"} (كرسي #${ticket.chairNumber || 1})</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 2px;">
            <span>الكاشير:</span>
            <span>${ticket.cashierName || currentUser?.name || "كاشير الباشا"}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 2px;">
            <span>طريقة الدفع:</span>
            <span class="bold">${payMethodName}</span>
          </div>
        </div>

        <div class="dashed-line"></div>

        <table>
          <thead>
            <tr>
              <th style="text-align: right; width: 48%;">الخدمة / الصنف</th>
              <th style="text-align: center; width: 14%;">الكمية</th>
              <th style="text-align: center; width: 18%;">السعر</th>
              <th style="text-align: left; width: 20%;">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows || '<tr><td colspan="4" style="text-align: center; padding: 6px;">لا توجد عناصر</td></tr>'}
          </tbody>
        </table>

        <div class="dashed-line"></div>

        <div style="font-size: 10.5px;">
          ${ticket.servicesTotal > 0 && ticket.retailTotal > 0 ? `
            <div style="display: flex; justify-content: space-between;">
              <span>إجمالي الخدمات:</span>
              <span class="bold" style="font-family: monospace;">${ticket.servicesTotal} ج</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 2px;">
              <span>إجمالي المنتجات:</span>
              <span class="bold" style="font-family: monospace;">${ticket.retailTotal} ج</span>
            </div>
          ` : rawTotal !== ticket.finalAmount && rawTotal > 0 ? `
            <div style="display: flex; justify-content: space-between;">
              <span>إجمالي الحساب:</span>
              <span class="bold" style="font-family: monospace;">${rawTotal} ج</span>
            </div>
          ` : ""}
          ${ticket.discount > 0 ? `
            <div style="display: flex; justify-content: space-between; color: #b00; margin-top: 2px;">
              <span>الخصم الممنوح:</span>
              <span class="bold" style="font-family: monospace;">-${ticket.discount} ج</span>
            </div>
          ` : ""}
          ${ticket.tipAmount > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-top: 2px;">
              <span>الإكرامية / الخدمة:</span>
              <span class="bold" style="font-family: monospace;">+${ticket.tipAmount} ج</span>
            </div>
          ` : ""}
        </div>

        <div class="total-box">
          <span>المبلغ الإجمالي المدفوع:</span>
          <span style="font-family: monospace; font-size: 15px;">${ticket.finalAmount} ج.م</span>
        </div>

        <div class="barcode-wrap">
          ${barcodeSvg}
        </div>

        ${receiptQrDataUrl ? `
        <div class="qr-wrap">
          <img src="${receiptQrDataUrl}" alt="QR" />
        </div>
        <div class="text-center" style="font-size: 8.5px; color: #444; margin-bottom: 4px;">
          امسح الكود لمعاينة الفاتورة وحجز موعدك القادم أونلاين 📱
        </div>
        ` : ""}

        <div class="dashed-line"></div>

        <div class="text-center" style="font-size: 9.5px; color: #222;">
          <div class="bold">سعدنا بخدمتكم • دي هيبة الباشا تليق بكم 👑</div>
          <div style="font-size: 8.5px; color: #555; margin-top: 2px;">الأسعار شاملة ضريبة القيمة المضافة • يُرجى الاحتفاظ بالإيصال</div>
          <div style="font-size: 8px; color: #777; margin-top: 2px;">تطوير شركة أوركا للحلول البرمجية (Orca Tech) 🐬</div>
        </div>

        <div class="cut-line">- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -</div>

        <script>
          window.onload = function() {
            window.focus();
            window.print();
            setTimeout(function() { window.close(); }, 1200);
          };
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  };

  // 2. Direct A4 Royal Invoice Print (Full-Page Corporate Tax Invoice)
  const executePrintA4Invoice = (ticket: any) => {
    if (!ticket) return;

    let services: any[] = [];
    try {
      services = typeof ticket.services === "string" ? JSON.parse(ticket.services) : ticket.services || [];
    } catch {}

    let retailItems: any[] = [];
    try {
      retailItems = typeof ticket.retailItems === "string" ? JSON.parse(ticket.retailItems) : ticket.retailItems || [];
    } catch {}

    const isHammam = ticket.branch?.name?.includes("حمام") || isWomenTheme;
    const isNewSkin =
      ticket.branch?.name?.includes("Skin") ||
      ticket.services?.includes("ليزر") ||
      ticket.services?.includes("بشرة") ||
      isNewSkinTheme;

    const brandName = isNewSkin
      ? "عيادة نيو سكين VIP (جلدية وليزر)"
      : isHammam
      ? "حمام وسبا الباشا VIP (حريمي)"
      : "صالون دقن الباشا VIP (رجالي)";

    const barcodeSvg = generateCode128Svg(ticket.ticketNumber || "CHK-IN-0000", {
      height: 44,
      moduleWidth: 2,
      includeText: true,
      fontSize: 12,
    });

    const printWin = window.open("", "_blank", "width=850,height=950");
    if (!printWin) {
      window.print();
      return;
    }

    const allItems = [
      ...services.map((it: any, i: number) => ({
        index: i + 1,
        name: it.nameAr,
        type: "خدمة صالون / سبا",
        qty: 1,
        price: it.price,
        total: it.price,
      })),
      ...retailItems.map((it: any, i: number) => ({
        index: services.length + i + 1,
        name: it.nameAr,
        type: "منتج عناية وتجميل",
        qty: it.qty,
        price: it.price,
        total: it.total,
      })),
    ];

    printWin.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <title>فاتورة ضريبية رسمية #${ticket.ticketNumber}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Tahoma, Arial, sans-serif;
            color: #111;
            background: #fff;
            padding: 10px;
            font-size: 13px;
            line-height: 1.4;
          }
          .header-box {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px double #d4af37;
            padding-bottom: 15px;
            margin-bottom: 15px;
          }
          .brand-title {
            font-size: 22px;
            font-weight: 900;
            color: #0a0a0e;
          }
          .brand-sub {
            font-size: 15px;
            font-weight: bold;
            color: #aa771c;
          }
          .invoice-badge {
            background: #0a0a0e;
            color: #d4af37;
            padding: 8px 18px;
            border-radius: 12px;
            text-align: center;
          }
          .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
          }
          .info-card {
            border: 1px solid #ddd;
            border-radius: 10px;
            padding: 12px;
            background: #fafafa;
          }
          .info-card h4 {
            font-size: 13px;
            font-weight: bold;
            color: #333;
            border-bottom: 1px solid #e0e0e0;
            padding-bottom: 5px;
            margin-bottom: 8px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th {
            background: #12121a;
            color: #fff;
            padding: 10px 8px;
            font-size: 12px;
            text-align: right;
          }
          td {
            padding: 9px 8px;
            border-bottom: 1px solid #eee;
            font-size: 12.5px;
          }
          tr:nth-child(even) { background: #fbfbfb; }
          .totals-wrap {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 25px;
          }
          .totals-table {
            width: 320px;
            border: 1.5px solid #000;
            border-collapse: collapse;
          }
          .totals-table td {
            padding: 8px 12px;
            border-bottom: 1px solid #ddd;
          }
          .final-row {
            background: #12121a !important;
            color: #fff !important;
            font-weight: 900;
            font-size: 15px;
          }
          .stamps-row {
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px dashed #ccc;
          }
          .stamp-box {
            text-align: center;
            width: 200px;
          }
          .stamp-placeholder {
            height: 70px;
            border: 1px dashed #999;
            border-radius: 8px;
            margin-top: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            color: #888;
          }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div>
            <div style="font-size: 26px; line-height: 1;">👑</div>
            <h1 class="brand-title">مجموعة صالونات وسبا الباشا VIP</h1>
            <h2 class="brand-sub">${brandName}</h2>
            <p style="font-size: 11px; color: #555; margin-top: 3px;">
              فرع: ${ticket.branch?.name || "حدائق القبة"} • الخط الساخن: 01210103025 - 01556782015
            </p>
          </div>
          <div class="invoice-badge">
            <div style="font-size: 11px; font-weight: bold;">فاتورة مبيعات وخدمات رسمية</div>
            <div style="font-size: 18px; font-family: monospace; font-weight: 900; margin-top: 3px;">#${ticket.ticketNumber}</div>
            <div style="font-size: 10px; margin-top: 2px;">تاريخ: ${new Date().toLocaleDateString("ar-EG")}</div>
          </div>
        </div>

        <div class="details-grid">
          <div class="info-card">
            <h4>بيانات العميل والفاتورة:</h4>
            <div><strong>اسم العميل:</strong> ${ticket.customerName || "عميل الصالون VIP"}</div>
            ${ticket.customerPhone ? `<div><strong>رقم الهاتف:</strong> <span style="font-family: monospace;">${ticket.customerPhone}</span></div>` : ""}
            <div><strong>الكاشير المسئول:</strong> ${ticket.cashierName || currentUser?.name || "كاشير الباشا"}</div>
            <div><strong>طريقة الدفع:</strong> ${ticket.paymentMethod === "CASH" ? "نقداً (كاش) 💵" : ticket.paymentMethod === "CARD" ? "بطاقة بنكية (فيزا) 💳" : ticket.paymentMethod === "INSTAPAY" ? "انستاباي InstaPay ⚡" : "فودافون كاش 📱"}</div>
          </div>

          <div class="info-card">
            <h4>بيانات مقدم الخدمة والفرع:</h4>
            <div><strong>المتخصص المسئول:</strong> ${ticket.specialist?.name || "كابتن الباشا"}</div>
            <div><strong>رقم الكرسي / الجناح:</strong> كرسي #${ticket.chairNumber || 1}</div>
            <div><strong>الفرع:</strong> ${ticket.branch?.name || "فرع حدائق القبة"} (73 شارع ترعة الجبل)</div>
            <div><strong>التوقيت:</strong> ${new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 5%; text-align: center;">#</th>
              <th style="width: 45%;">الخدمة أو المنتج</th>
              <th style="width: 20%;">النوع / التصنيف</th>
              <th style="width: 10%; text-align: center;">الكمية</th>
              <th style="width: 10%; text-align: center;">سعر الوحدة</th>
              <th style="width: 10%; text-align: left;">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${allItems.map((it) => `
              <tr>
                <td style="text-align: center; font-weight: bold;">${it.index}</td>
                <td style="font-weight: bold;">${it.name}</td>
                <td style="color: #555;">${it.type}</td>
                <td style="text-align: center; font-family: monospace;">${it.qty}</td>
                <td style="text-align: center; font-family: monospace;">${it.price} ج</td>
                <td style="text-align: left; font-weight: bold; font-family: monospace;">${it.total} ج</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <div class="totals-wrap">
          <table class="totals-table">
            <tr>
              <td>إجمالي الحساب:</td>
              <td style="text-align: left; font-weight: bold; font-family: monospace;">${(ticket.servicesTotal || 0) + (ticket.retailTotal || 0)} ج.م</td>
            </tr>
            ${ticket.discount > 0 ? `
            <tr style="color: #b00;">
              <td>الخصم الممنوح:</td>
              <td style="text-align: left; font-weight: bold; font-family: monospace;">-${ticket.discount} ج.م</td>
            </tr>
            ` : ""}
            ${ticket.tipAmount > 0 ? `
            <tr>
              <td>الإكرامية / الخدمة:</td>
              <td style="text-align: left; font-weight: bold; font-family: monospace;">+${ticket.tipAmount} ج.م</td>
            </tr>
            ` : ""}
            <tr class="final-row">
              <td>المبلغ الإجمالي المدفوع:</td>
              <td style="text-align: left; font-family: monospace; font-size: 16px;">${ticket.finalAmount} ج.م</td>
            </tr>
          </table>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <div style="text-align: center;">
            ${barcodeSvg}
          </div>
          ${receiptQrDataUrl ? `
          <div style="text-align: center; display: flex; align-items: center; gap: 10px;">
            <img src="${receiptQrDataUrl}" style="width: 80px; height: 80px;" alt="QR" />
            <div style="font-size: 10px; color: #555; text-align: right;">
              كود التحقق والحجز الذكي<br/>
              امسح للتحقق من صحة الفاتورة
            </div>
          </div>
          ` : ""}
        </div>

        <div class="stamps-row">
          <div class="stamp-box">
            <div>توقيع الكاشير المسئول</div>
            <div class="stamp-placeholder">${ticket.cashierName || currentUser?.name || "كاشير الباشا"}</div>
          </div>
          <div class="stamp-box">
            <div>توقيع المستلم / العميل</div>
            <div class="stamp-placeholder">${ticket.customerName || "توقيع العميل"}</div>
          </div>
          <div class="stamp-box">
            <div>خاتم الإدارة والاعتماد</div>
            <div class="stamp-placeholder">خاتم مجموعة الباشا VIP 👑</div>
          </div>
        </div>

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

  // 3. Send Electronic Receipt via WhatsApp
  const handleSendReceiptWhatsApp = (ticket: any) => {
    if (!ticket) return;
    const phone = ticket.customerPhone || "";
    const cleanPhone = phone.replace(/^0/, "20");

    let services: any[] = [];
    try {
      services = typeof ticket.services === "string" ? JSON.parse(ticket.services) : ticket.services || [];
    } catch {}

    let retailItems: any[] = [];
    try {
      retailItems = typeof ticket.retailItems === "string" ? JSON.parse(ticket.retailItems) : ticket.retailItems || [];
    } catch {}

    const servicesText = services.map((s: any) => `• ${s.nameAr}: ${s.price} ج.م`).join("\n");
    const productsText = retailItems.map((r: any) => `• ${r.nameAr} (×${r.qty}): ${r.total} ج.م`).join("\n");

    const message = `👑 *مجموعة صالونات وسبا الباشا VIP* 👑
--------------------------------
🧾 *إيصال دفع إلكتروني رسمي*
*رقم الإيصال:* #${ticket.ticketNumber}
*اسم العميل:* ${ticket.customerName || "عميلنا المميز"}
*التاريخ:* ${new Date().toLocaleDateString("ar-EG")} - ${new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
*المتخصص:* ${ticket.specialist?.name || "كابتن الباشا"} (كرسي #${ticket.chairNumber || 1})
*الفرع:* ${ticket.branch?.name || "فرع حدائق القبة"}
--------------------------------
*تفاصيل الحساب:*
${servicesText ? `*الخدمات:* \n${servicesText}\n` : ""}${productsText ? `*المنتجات:* \n${productsText}\n` : ""}
💰 *المبلغ الإجمالي المدفوع:* ${ticket.finalAmount} ج.م
💳 *طريقة الدفع:* ${ticket.paymentMethod === "CASH" ? "نقداً (كاش)" : ticket.paymentMethod === "CARD" ? "بطاقة بنكية (فيزا)" : ticket.paymentMethod === "INSTAPAY" ? "انستاباي" : "محفظة إلكترونية"}
--------------------------------
سعدنا جداً بخدمتكم في صالون وسبا الباشا الملكي، دي هيبة الباشا تليق بكم! ✨
📞 خدمة العملاء والحجز: 01210103025 - 01556782015`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  // 4. Shift Handover Z-Report Thermal 80mm Print Engine (Xprinter)
  const executePrintShiftZReport = (shiftData: any, stats: any) => {
    const s = shiftData || openShift;
    const st = stats || shiftStats;
    if (!s) return;

    const printWin = window.open("", "_blank", "width=420,height=680");
    if (!printWin) {
      window.print();
      return;
    }

    const branchName = s.branch?.name || currentUser?.branchName || (isWomenTheme ? "فرع حمام الباشا VIP" : "فرع صالون دقن الباشا VIP");
    const openTimeStr = s.openedAt ? new Date(s.openedAt).toLocaleString("ar-EG") : "الآن";
    const closeTimeStr = new Date().toLocaleString("ar-EG");

    printWin.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <title>تقرير إقفال الوردية Z-Report #${s.shiftNumber || 1}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Tahoma, Arial, sans-serif;
            width: 76mm;
            margin: 0 auto;
            padding: 4mm 2.5mm;
            color: #000;
            background: #fff;
            font-size: 11px;
            line-height: 1.35;
          }
          .text-center { text-align: center; }
          .bold { font-weight: bold; }
          .black { font-weight: 900; }
          .dashed { border-bottom: 1.5px dashed #000; margin: 6px 0; }
          .double { border-bottom: 2.5px double #000; margin: 6px 0; }
          .row { display: flex; justify-content: space-between; margin: 2px 0; }
          .box { border: 2px solid #000; padding: 6px; margin: 6px 0; background: #fafafa; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
          th, td { padding: 3px 2px; }
        </style>
      </head>
      <body>
        <div class="text-center">
          <div style="font-size: 22px;">👑</div>
          <div class="black" style="font-size: 14px;">مجموعة صالونات وسبا الباشا VIP</div>
          <div class="bold" style="font-size: 12px; margin-top: 1px;">تقرير تقفيل الوردية اليومي (Z-REPORT)</div>
          <div style="font-size: 10px; margin-top: 2px;">${branchName}</div>
        </div>

        <div class="dashed"></div>

        <div style="font-size: 10.5px;">
          <div class="row"><span>رقم الوردية:</span><span class="bold">#${s.shiftNumber || 1}</span></div>
          <div class="row"><span>الكاشير المسئول:</span><span class="bold">${s.openedBy || currentUser?.name || "كاشير الباشا"}</span></div>
          <div class="row"><span>المستلم المعتمد:</span><span>${shiftForm.handedTo}</span></div>
          <div class="row"><span>بدء الوردية:</span><span style="font-family: monospace;">${openTimeStr}</span></div>
          <div class="row"><span>إقفال الوردية:</span><span style="font-family: monospace;">${closeTimeStr}</span></div>
        </div>

        <div class="dashed"></div>

        <div style="font-size: 11px;">
          <div class="bold" style="margin-bottom: 3px;">📊 تفصيل الإيرادات:</div>
          <div class="row"><span>إيراد الخدمات والحلاقة:</span><span style="font-family: monospace;" class="bold">${st?.servicesTotal || 0} ج.م</span></div>
          <div class="row"><span>إيراد مبيعات المنتجات:</span><span style="font-family: monospace;" class="bold">${st?.retailTotal || 0} ج.م</span></div>
          <div class="row"><span>إجمالي الخصومات:</span><span style="font-family: monospace; color: #b00;">-${st?.discountTotal || 0} ج.م</span></div>
          <div class="row"><span>إجمالي الإكرامية والخدمة:</span><span style="font-family: monospace;">+${st?.tipTotal || 0} ج.م</span></div>
        </div>

        <div class="box">
          <div class="row" style="font-size: 13px;">
            <span>إجمالي الدخل الصافي:</span>
            <span style="font-family: monospace; font-size: 14px;">${st?.netTotal || 0} ج.م</span>
          </div>
        </div>

        <div class="dashed"></div>

        <div style="font-size: 10.5px;">
          <div class="bold" style="margin-bottom: 3px;">💳 تفقيط وسائل الدفع:</div>
          <div class="row"><span>نقداً (كاش الدرج):</span><span class="bold" style="font-family: monospace;">${st?.cashRevenue || 0} ج.م</span></div>
          <div class="row"><span>بطاقة بنكية (فيزا):</span><span style="font-family: monospace;">${st?.cardRevenue || 0} ج.م</span></div>
          <div class="row"><span>انستاباي (InstaPay):</span><span style="font-family: monospace;">${st?.instapayRevenue || 0} ج.م</span></div>
          <div class="row"><span>فودافون كاش / محافظ:</span><span style="font-family: monospace;">${st?.vodafoneRevenue || 0} ج.م</span></div>
        </div>

        <div class="dashed"></div>

        <div style="font-size: 10.5px;">
          <div class="bold" style="margin-bottom: 3px;">💸 الخصومات النقدية من الدرج:</div>
          <div class="row"><span>سلف الكباتن المصروفة:</span><span style="font-family: monospace;">-${st?.advancesTotal || 0} ج.م</span></div>
          <div class="row"><span>مصروفات نثرية:</span><span style="font-family: monospace;">-${st?.expensesTotal || 0} ج.م</span></div>
        </div>

        <div class="box" style="background: #f0fff4; border-color: #000;">
          <div class="row" style="font-size: 13px;">
            <span>صافي النقدية المسلمة للعهدة:</span>
            <span style="font-family: monospace; font-size: 15px;">${shiftForm.actualCash || (st?.expectedCash || 0)} ج.م</span>
          </div>
        </div>

        <div class="dashed"></div>

        <div style="margin-top: 10px; font-size: 9.5px;">
          <div class="row" style="margin-top: 6px;">
            <div style="width: 48%; text-align: center; border-top: 1px solid #000; padding-top: 4px;">
              توقيع الكاشير المسلّم<br/>(${s.openedBy || currentUser?.name})
            </div>
            <div style="width: 48%; text-align: center; border-top: 1px solid #000; padding-top: 4px;">
              توقيع المستلم والاعتماد<br/>(${shiftForm.handedTo})
            </div>
          </div>
        </div>

        <div class="text-center" style="font-size: 8.5px; color: #555; margin-top: 10px;">
          تم إقفال الوردية بنجاح • صالونات وسبا الباشا VIP 👑<br/>
          تطوير شركة أوركا للحلول البرمجية (Orca Tech) 🐬
        </div>

        <script>
          window.onload = function() {
            window.focus();
            window.print();
            setTimeout(function() { window.close(); }, 1200);
          };
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  };

  // 5. Shift Handover A4 Full Corporate Audit Report
  const executePrintShiftA4Report = (shiftData: any, stats: any) => {
    const s = shiftData || openShift;
    const st = stats || shiftStats;
    if (!s) return;

    const printWin = window.open("", "_blank", "width=850,height=950");
    if (!printWin) {
      window.print();
      return;
    }

    const branchName = s.branch?.name || currentUser?.branchName || (isWomenTheme ? "فرع حمام الباشا VIP" : "فرع صالون دقن الباشا VIP");
    const openTimeStr = s.openedAt ? new Date(s.openedAt).toLocaleString("ar-EG") : "الآن";
    const closeTimeStr = new Date().toLocaleString("ar-EG");

    printWin.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <title>تقرير تقفيل وردية رسمي A4 #${s.shiftNumber || 1}</title>
        <style>
          @page { size: A4 portrait; margin: 12mm 15mm; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Tahoma, Arial, sans-serif;
            color: #000;
            background: #fff;
            padding: 10mm;
            font-size: 13px;
            line-height: 1.5;
          }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2.5px solid #d4af37; padding-bottom: 12px; margin-bottom: 16px; }
          .title { font-size: 20px; font-weight: 900; color: #111; }
          .badge { display: inline-block; padding: 4px 12px; background: #fdf6e2; border: 1px solid #d4af37; border-radius: 8px; font-weight: bold; font-size: 13px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
          .card { border: 1px solid #ddd; border-radius: 10px; padding: 12px; background: #fafafa; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12.5px; }
          th { background: #1a1a24; color: #fff; padding: 8px; text-align: right; }
          td { border: 1px solid #ddd; padding: 8px; }
          .stamps { display: flex; justify-content: space-between; margin-top: 35px; }
          .stamp-box { width: 30%; border: 1px dashed #666; border-radius: 10px; padding: 12px; text-align: center; min-height: 90px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">مجموعة صالونات وسبا وعيادات الباشا VIP 👑</div>
            <div style="font-weight: bold; font-size: 14px; color: #555;">تقرير تسليم الوردية وإيراد الخزينة المعتمد (SHIFT AUDIT REPORT)</div>
            <div style="font-size: 12px; color: #777;">${branchName} • 73 ترعة الجبل أمام مستشفى سان بول</div>
          </div>
          <div style="text-align: left;">
            <div class="badge">وردية #${s.shiftNumber || 1}</div>
            <div style="font-size: 11px; margin-top: 4px; font-family: monospace;">تاريخ الإقفال: ${new Date().toLocaleDateString("ar-EG")}</div>
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <div style="font-weight: bold; margin-bottom: 6px; border-bottom: 1px solid #eee; padding-bottom: 4px;">بيانات الوردية والكاشير:</div>
            <div>الكاشير المسئول: <strong>${s.openedBy || currentUser?.name}</strong></div>
            <div>المشرف / الإدارة المستلمة: <strong>${shiftForm.handedTo}</strong></div>
            <div>توقيت بدء الوردية: <span style="font-family: monospace;">${openTimeStr}</span></div>
            <div>توقيت إقفال الوردية: <span style="font-family: monospace;">${closeTimeStr}</span></div>
          </div>
          <div class="card">
            <div style="font-weight: bold; margin-bottom: 6px; border-bottom: 1px solid #eee; padding-bottom: 4px;">ملخص الخزينة والنقدية:</div>
            <div>إجمالي الدخل الصافي: <strong>${st?.netTotal || 0} ج.م</strong></div>
            <div>نقدية الكاش المتوقعة بالدرج: <strong>${st?.expectedCash || 0} ج.م</strong></div>
            <div>النقدية الفعلية المسلمة: <strong style="color: #008000; font-size: 15px;">${shiftForm.actualCash || (st?.expectedCash || 0)} ج.م</strong></div>
            <div>ملاحظات التسليم: <em>${shiftForm.notes || "لا توجد ملاحظات"}</em></div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>بند الإيراد / المعاملة</th>
              <th style="text-align: center;">طريقة الدفع</th>
              <th style="text-align: left;">المبلغ بالجنيه</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>إجمالي خدمات الصالون والحلاقة والسبا</td><td style="text-align: center;">كافة الوسائل</td><td style="text-align: left; font-family: monospace; font-weight: bold;">${st?.servicesTotal || 0} ج.م</td></tr>
            <tr><td>إجمالي مبيعات مستحضرات التجميل والمنتجات</td><td style="text-align: center;">كافة الوسائل</td><td style="text-align: left; font-family: monospace; font-weight: bold;">${st?.retailTotal || 0} ج.م</td></tr>
            <tr><td>إجمالي الخصومات المصرح بها</td><td style="text-align: center;">خصم فواتير</td><td style="text-align: left; font-family: monospace; color: #b00;">-${st?.discountTotal || 0} ج.م</td></tr>
            <tr><td>إجمالي الإكرامية وخدمة الصالون</td><td style="text-align: center;">إكراميات</td><td style="text-align: left; font-family: monospace;">+${st?.tipTotal || 0} ج.م</td></tr>
            <tr style="background: #fdf6e2; font-weight: bold;"><td>صافي الإيراد المحقق</td><td style="text-align: center;">الإجمالي العام</td><td style="text-align: left; font-family: monospace; font-size: 14px;">${st?.netTotal || 0} ج.م</td></tr>
            <tr><td>تحصيلات كاش نقدية بالدرج</td><td style="text-align: center;">نقداً (كاش)</td><td style="text-align: left; font-family: monospace;">${st?.cashRevenue || 0} ج.م</td></tr>
            <tr><td>تحصيلات بطاقات ائتمان وفيزا</td><td style="text-align: center;">فيزا POS</td><td style="text-align: left; font-family: monospace;">${st?.cardRevenue || 0} ج.م</td></tr>
            <tr><td>تحصيلات شبكة انستاباي InstaPay</td><td style="text-align: center;">انستاباي</td><td style="text-align: left; font-family: monospace;">${st?.instapayRevenue || 0} ج.م</td></tr>
            <tr><td>تحصيلات فودافون كاش والمحافظ</td><td style="text-align: center;">محافظ إلكترونية</td><td style="text-align: left; font-family: monospace;">${st?.vodafoneRevenue || 0} ج.م</td></tr>
            <tr><td>إجمالي سلف الكباتن والمصروفات المخصومة من الدرج</td><td style="text-align: center;">صرف فوري</td><td style="text-align: left; font-family: monospace; color: #b00;">-${(st?.advancesTotal || 0) + (st?.expensesTotal || 0)} ج.م</td></tr>
          </tbody>
        </table>

        <div class="stamps">
          <div class="stamp-box">
            <div>توقيع الكاشير المسلّم</div>
            <div style="margin-top: 30px; font-weight: bold;">${s.openedBy || currentUser?.name}</div>
          </div>
          <div class="stamp-box">
            <div>توقيع المستلم المعتمد</div>
            <div style="margin-top: 30px; font-weight: bold;">${shiftForm.handedTo}</div>
          </div>
          <div class="stamp-box">
            <div>خاتم الإدارة والاعتماد</div>
            <div style="margin-top: 30px; font-weight: bold; color: #b8860b;">خاتم مجموعة الباشا VIP 👑</div>
          </div>
        </div>

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

  const handleLogout = () => {
    localStorage.removeItem("basha_staff_user");
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

  // Filtered Specialists by Branch / Gender
  const filteredSpecialists = isWomenTheme
    ? specialists.filter((s) => s.branchId === activeBranchId || (hammamBranch && s.branchId === hammamBranch.id))
    : isMenTheme
    ? specialists.filter((s) => s.branchId === activeBranchId || (daknBranch && s.branchId === daknBranch.id))
    : specialists;

  // Filtered Products by Branch
  const filteredProducts = isWomenTheme
    ? retailProducts.filter((p) => p.branchId === activeBranchId || (hammamBranch && p.branchId === hammamBranch.id))
    : isMenTheme
    ? retailProducts.filter((p) => p.branchId === activeBranchId || (daknBranch && p.branchId === daknBranch.id) || !p.branchId)
    : retailProducts;

  // Calculate live checkout total
  const rawTotal = (selectedTicket?.servicesTotal || 0) + (selectedTicket?.retailTotal || 0);
  const calculatedFinal = Math.max(0, rawTotal - Number(discountAmount || 0) + Number(tipAmount || 0));

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${
        isWomenTheme
          ? "bg-[#0c040a] selection:bg-rose-500 selection:text-white"
          : "bg-[#0a0a0e] selection:bg-amber-500 selection:text-black"
      }`}
      dir="rtl"
    >
      {/* Dynamic Ambient Background Glows */}
      {isWomenTheme ? (
        <>
          <div className="absolute w-[500px] h-[500px] bg-rose-600/10 blur-[140px] rounded-full pointer-events-none -top-20 -right-20 animate-pulse" />
          <div className="absolute w-[400px] h-[400px] bg-pink-500/10 blur-[130px] rounded-full pointer-events-none bottom-20 -left-20" />
        </>
      ) : (
        <>
          <div className="absolute w-96 h-96 bg-amber-500/10 blur-[130px] rounded-full pointer-events-none -top-10 -right-10" />
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────
          1. POS HEADER
         ───────────────────────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-40 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-lg no-print transition-colors duration-300 ${
          isWomenTheme
            ? "bg-[#150612]/95 border-b border-rose-500/35 shadow-rose-950/20"
            : "bg-[#0f0f15]/95 border-b border-amber-500/25 shadow-black/40"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-2xl overflow-hidden border-2 bg-black shrink-0 shadow-md ${
              isWomenTheme ? "border-rose-400 shadow-rose-500/20" : "border-amber-400 shadow-amber-500/20"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={isWomenTheme ? "/hammam-logo.jpg" : "/dakn-logo.jpg"}
              alt="Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-base sm:text-lg font-black ${isWomenTheme ? "text-rose-300" : "text-amber-400"}`}>
                {isWomenTheme
                  ? "كاشير حمام الباشا VIP (نقطة البيع والسبا) 🧖‍♀️✨"
                  : isMenTheme
                  ? "كاشير صالون دقن الباشا VIP (نقطة البيع POS) 💈👑"
                  : "كاشير مجموعة الباشا VIP (نقطة البيع POS)"}
              </h2>
              <span
                className={`py-0.5 px-2 rounded-lg text-[10px] font-black border ${
                  isWomenTheme
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                    : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                }`}
              >
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
          {isOwnerOrGM ? (
            <select
              value={activeBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className={`py-1.5 px-3 rounded-xl bg-[#181822] border text-xs font-bold focus:outline-none transition ${
                isWomenTheme
                  ? "border-rose-500/40 text-rose-300 focus:border-rose-400"
                  : "border-amber-500/30 text-amber-300 focus:border-amber-400"
              }`}
            >
              <option value="ALL">جميع الفروع (المركزية)</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          ) : (
            <div
              className={`py-1.5 px-3 rounded-xl border text-xs font-black flex items-center gap-1.5 shadow-md ${
                isWomenTheme
                  ? "bg-rose-500/15 border-rose-500/40 text-rose-300 shadow-rose-950/30"
                  : "bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-amber-950/30"
              }`}
              title="فرعك المصرح به حصرياً - غير متاح تبديل الفرع"
            >
              <Lock className={`w-3.5 h-3.5 ${isWomenTheme ? "text-rose-400" : "text-amber-400"}`} />
              <span>{branches.find((b) => b.id === activeBranchId)?.name || currentUser?.branch?.name || "فرعك المعتمد"}</span>
              <span className="text-[10px] opacity-75">(فرعك المصرح به 🔒)</span>
            </div>
          )}

          {lastPrintedTicket && (
            <button
              onClick={() => setShowReceiptModal(true)}
              className="py-1.5 px-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-xs font-black transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="معاينة وطباعة آخر إيصال أو إرساله واتساب"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>آخر إيصال #{lastPrintedTicket.ticketNumber} 🧾</span>
            </button>
          )}

          <button
            onClick={() => {
              setAdmitCustomerName("");
              setAdmitCustomerPhone("");
              setAdmitSpecialistId(filteredSpecialists[0]?.id || "");
              setShowAdmitModal(true);
            }}
            className={`py-1.5 px-3 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer ${
              isWomenTheme
                ? "bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white shadow-rose-500/20"
                : "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isWomenTheme ? "إجلاس عميلة 🧖‍♀️" : "إجلاس زبون 💺"}</span>
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

          {/* Digital Attendance Punch for Cashier */}
          <button
            onClick={() => handlePunchAttendance(isCheckedIn ? "CHECK_OUT" : "CHECK_IN")}
            disabled={punchingAttendance}
            className={`py-1.5 px-3 rounded-xl text-xs font-black transition flex items-center gap-1.5 border shadow-sm cursor-pointer ${
              isCheckedIn
                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25"
                : "bg-rose-500/15 text-rose-300 border-rose-500/40 hover:bg-rose-500/25 animate-pulse"
            }`}
            title={isCheckedIn ? "أنت مسجل حضور - انقر لتسجيل الانصراف" : "انقر لتسجيل بصمة حضورك للوردية"}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>
              {punchingAttendance
                ? "جاري..."
                : isCheckedIn
                ? "حاضر 🟢 (انصراف 🚪)"
                : "بصمة حضور ⏰"}
            </span>
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

          {/* Barcode Gun Laser Scanner for Cashier POS */}
          <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/20 via-black/80 to-slate-900 border-2 border-amber-500/50 shadow-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Barcode className="w-5 h-5 text-amber-400 animate-pulse" />
                <h4 className="text-xs font-black text-amber-300">
                  مسح باركود المنتجات (مسدس الباركود 🔫):
                </h4>
              </div>
              <button
                type="button"
                onClick={handleCreateQuickRetailTicket}
                className="py-1 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="فتح فاتورة بيع جديدة للعميل فوراً بدون حلاقة"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>فاتورة بيع مباشر سريع 🛍️</span>
              </button>
            </div>

            <div className="relative">
              <input
                ref={posBarcodeInputRef}
                type="text"
                value={posBarcodeInput}
                onChange={(e) => setPosBarcodeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleScanBarcodeInPos(posBarcodeInput);
                  }
                }}
                placeholder={
                  selectedTicket
                    ? `امسح الباركود لإضافته فوراً لتذكرة (${selectedTicket.customerName})...`
                    : "اختر تذكرة عميل أولاً، أو اضغط على فاتورة بيع مباشر سريع..."
                }
                className="w-full py-2.5 pr-10 pl-24 rounded-2xl bg-black/90 border border-amber-500/60 text-amber-300 font-mono font-bold text-xs focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/30 placeholder-slate-500"
              />
              <Barcode className="w-4 h-4 text-amber-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => handleScanBarcodeInPos(posBarcodeInput)}
                className="absolute left-1.5 top-1/2 -translate-y-1/2 py-1 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] transition cursor-pointer"
              >
                إضافة 🛒
              </button>
            </div>
          </div>

          {/* Retail Beauty Products Catalog (Add to Cart) */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span>بضاعة التجميل والعناية (إضافة للفاتورة بضغطة زر):</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {filteredProducts.map((prod) => (
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
                    <span className="text-slate-400">العميل الحالي:</span>
                    <strong className="text-white font-bold">{selectedTicket.customerName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">المتخصص:</span>
                    <span className="text-amber-300 font-bold">
                      {selectedTicket.specialist?.name} (كرسي #{selectedTicket.chairNumber})
                    </span>
                  </div>
                </div>

                {/* Cashier Customer Registration Card (Strict: Cashier records name/phone) */}
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-black text-amber-300">
                    <span>📝 بيانات العميل (تسجيل الكاشير):</span>
                    {selectedTicket.status === "READY_FOR_CASHIER" && (
                      <span className="py-0.5 px-2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] animate-pulse">
                        جاهز من المتخصص ✂️
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5 font-bold">اسم العميل:</label>
                      <input
                        type="text"
                        value={checkoutCustomerName}
                        onChange={(e) => setCheckoutCustomerName(e.target.value)}
                        placeholder={selectedTicket.customerName || "الاسم"}
                        className="w-full py-1.5 px-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-bold focus:border-amber-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5 font-bold">رقم الهاتف:</label>
                      <input
                        type="tel"
                        value={checkoutCustomerPhone}
                        onChange={(e) => setCheckoutCustomerPhone(e.target.value)}
                        placeholder="رقم الموبايل"
                        className="w-full py-1.5 px-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-bold font-mono focus:border-amber-400 outline-none text-left"
                      />
                    </div>
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

                {/* Supervisor Cancellation Request Option */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowCancelRequestModal(selectedTicket)}
                    className="py-1.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>⚠️</span>
                    <span>طلب إلغاء / تعديل الفاتورة من المشرف العام</span>
                  </button>
                  {selectedTicket.notes?.includes("طلب إلغاء معلق") && (
                    <span className="text-[10px] text-amber-400 font-bold animate-pulse">
                      ⏳ قيد مراجعة المشرف
                    </span>
                  )}
                </div>
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
              {filteredSpecialists.map((spec) => (
                <div key={spec.id} className="p-4 rounded-2xl bg-[#181824] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-amber-500/40 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-amber-400 bg-black shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={spec.photo || "/dakn-logo.jpg"} alt={spec.name} className="w-full h-full object-cover" />
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
          CASHIER ADMIT WALK-IN CUSTOMER TO CHAIR OR WAITING LOUNGE MODAL (SPACIOUS 2-COLUMNS WITH ARABIC CATEGORIES)
         ───────────────────────────────────────────────────────────── */}
      {showAdmitModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex justify-center items-start sm:items-center py-4 sm:py-6 px-3 sm:px-6 font-sans no-print"
          dir="rtl"
        >
          <div className="relative w-full max-w-7xl my-auto bg-[#101018] border border-amber-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4 max-h-[94vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">استقبال وإجلاس زبون وتحديد الخدمات 💺✨</h3>
                  <p className="text-xs text-slate-400">إجلاس فوري على الكرسي أو إضافة لصالة الاستراحة مع اختيار الخدمات المبدئية</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAdmitModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdmitCustomerToChair} className="overflow-y-auto pr-1 flex-1 text-xs">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* ──────────────────────────────────────────
                    RIGHT COLUMN: CUSTOMER & CHAIR DETAILS (4 COLS)
                   ────────────────────────────────────────── */}
                <div className="lg:col-span-4 space-y-3.5 bg-black/40 p-4 rounded-2xl border border-white/5">
                  <h4 className="font-bold text-amber-400 text-xs flex items-center gap-1.5 pb-1 border-b border-white/5">
                    <span>👤</span>
                    <span>بيانات العميل والكرسي</span>
                  </h4>

                  <div>
                    <label className="text-slate-300 font-bold block mb-1">اسم العميل *:</label>
                    <input
                      type="text"
                      required
                      value={admitCustomerName}
                      onChange={(e) => setAdmitCustomerName(e.target.value)}
                      placeholder="مثال: محمد مصطفى"
                      className="w-full py-2.5 px-3 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-amber-400 font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold block mb-1">رقم الهاتف (اختياري للـ CRM وسجل الزيارات):</label>
                    <input
                      type="tel"
                      value={admitCustomerPhone}
                      onChange={(e) => setAdmitCustomerPhone(e.target.value)}
                      placeholder="010XXXXXXXX"
                      className="w-full py-2.5 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono focus:outline-none focus:border-amber-400 text-xs text-left"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold block mb-1">تفضيل الكابتن والكرسي:</label>
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
                      className="w-full py-2.5 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-bold text-xs"
                    >
                      <option value="FIRST_AVAILABLE">
                        {isWomenTheme ? "⏳ في انتظار أول خبيرة سبا تفضى (بدون تفضيل)" : "⏳ في انتظار أول كابتن يفضى (بدون تفضيل)"}
                      </option>
                      {filteredSpecialists.map((spec) => (
                        <option key={spec.id} value={spec.id}>
                          {spec.name} • كرسي #{spec.chairNumber} ({spec.status === "AVAILABLE" ? "متاح فوراً 🟢" : "مشغول على الكرسي 🔴"})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Seating Mode Selection */}
                  {(() => {
                    const isFirst = admitSpecialistId === "FIRST_AVAILABLE" || !admitSpecialistId;
                    const chosenSpec = specialists.find((s) => s.id === admitSpecialistId);
                    const isSpecBusy = chosenSpec && chosenSpec.status !== "AVAILABLE";

                    if (isFirst) {
                      return (
                        <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-[11px] space-y-1">
                          <div className="font-bold flex items-center gap-1">
                            <span>🛋️</span>
                            <span>صالة الاستراحة وقائمة الانتظار VIP</span>
                          </div>
                          <p className="text-slate-300 text-[10px] leading-relaxed">
                            سيتم تسجيل الزبون في قائمة الانتظار، وبمجرد فراغ أي كابتن ستتمكن من إجلاسه فوراً بنقرة زر واحدة.
                          </p>
                        </div>
                      );
                    }

                    if (isSpecBusy) {
                      return (
                        <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] space-y-1">
                          <div className="font-black flex items-center gap-1">
                            <span>⚠️</span>
                            <span>الكابتن ({chosenSpec?.name}) مشغول حالياً على الكرسي #{chosenSpec?.chairNumber}</span>
                          </div>
                          <p className="text-slate-300 text-[10px] leading-relaxed">
                            الزبون اختار هذا الكابتن بالاسم ومستعد للانتظار بصالة الاستراحة 👑
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-1.5 pt-1">
                        <label className="text-slate-300 font-bold block">طريقة التوجيه المطلوبة:</label>
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
                            💺 إجلاس فوري
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
                            🛋️ استراحة (ينتظر)
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  <button
                    type="submit"
                    disabled={admittingClient}
                    className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer pt-2 mt-2"
                  >
                    {admittingClient
                      ? "جاري التسجيل..."
                      : admitMode === "CHAIR" && admitSpecialistId !== "FIRST_AVAILABLE"
                      ? "توجيه الزبون للكرسي وبدء الخدمة 🚀"
                      : "تسجيل الزبون بصالة الاستراحة وقائمة الانتظار 🛋️"}
                  </button>
                </div>

                {/* ──────────────────────────────────────────
                    LEFT COLUMN: SERVICES CATALOG & ARABIC CATEGORIES (8 COLS)
                   ────────────────────────────────────────── */}
                <div className="lg:col-span-8 space-y-3 bg-black/40 p-4 rounded-2xl border border-white/5 flex flex-col">
                  {/* Category dictionary & branch-aware filter */}
                  {(() => {
                    // 1. Precise Category Lists per Branch / Entity
                    const MEN_CATEGORIES = [
                      "HAIR",
                      "BEARD",
                      "COLOR_KERATIN",
                      "SKIN_CARE",
                      "BODY_CARE",
                      "TREATMENT_HAIR",
                      "WAXING",
                      "MEN_SPA",
                      "VIP_PACKAGES",
                      "KIDS",
                    ];

                    const WOMEN_CATEGORIES = [
                      "LADIES_SPA",
                      "BODY_MASKS",
                      "LADIES_HAIR",
                      "LADIES_COLOR",
                      "LADIES_SKIN",
                      "BROWS_LASHES",
                      "NAILS",
                      "EXTENSIONS",
                      "WAX_SWEET",
                      "MAKEUP",
                      "MASSAGE",
                    ];

                    const NEWSKIN_CATEGORIES = [
                      "NEWSKIN_LASER",
                      "NEWSKIN_DERMA",
                      "NEWSKIN_MICRO",
                      "NEWSKIN_PEDICURE",
                    ];

                    const ARABIC_CATS: Record<string, string> = {
                      ALL: "كل الأقسام 👑",
                      HAIR: "قصات الشعر 💈",
                      BEARD: "حلاقة ولحية 🪒",
                      COLOR_KERATIN: "صبغات وفرد رجالي ✨",
                      SKIN_CARE: "تنظيف بشرة وهيدرافيشال 🧖‍♂️",
                      BODY_CARE: "باديكير وعناية رجالي 🧼",
                      TREATMENT_HAIR: "معالجات شعر وكافيار 💆‍♂️",
                      WAXING: "واكس رجالي 🍯",
                      MEN_SPA: "حمامات رجالية ملكية 🛁",
                      VIP_PACKAGES: "عروض وبكجات VIP 👑",
                      KIDS: "أطفال 👦",
                      LADIES_SPA: "حمامات سبا حريمي 🧖‍♀️",
                      LADIES_HAIR: "تصفيف وتسريحات حريمي 💇‍♀️",
                      EXTENSIONS: "إكستنشن وتركيبات 🎀",
                      LADIES_COLOR: "صبغات وهايلايت حريمي 🎨",
                      BROWS_LASHES: "حواجب ورموش 👁️",
                      LADIES_SKIN: "بشرة وتنظيف وجه حريمي 🌸",
                      BODY_MASKS: "ماسكات ودلكة الجسم 🌺",
                      MAKEUP: "ميكاب وسواريه 💄",
                      WAX_SWEET: "سويت وواكس حريمي 🍯",
                      NAILS: "أظافر وباديكير 💅",
                      MASSAGE: "مساج واستجمام 💆‍♀️",
                      NEWSKIN_LASER: "ليزر نيو سكين ⚡",
                      NEWSKIN_MICRO: "مايكروبليدينج 🌟",
                      NEWSKIN_DERMA: "ديرما وميزوثيرابي 🩺",
                      NEWSKIN_PEDICURE: "باديكير سبا إيطالي 🇮🇹",
                    };

                    // 2. Distinct Color Themes & Icons per Category for High-End Interactive Tiles
                    const CATEGORY_STYLES: Record<string, { bg: string; border: string; activeBorder: string; activeBg: string; text: string; badgeBg: string; icon: string }> = {
                      HAIR: {
                        bg: "from-amber-950/40 via-[#18120d] to-black",
                        border: "border-amber-500/25 hover:border-amber-400",
                        activeBorder: "border-amber-400 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/25",
                        activeBg: "bg-gradient-to-br from-amber-500/30 via-amber-950/50 to-black",
                        text: "text-amber-300",
                        badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/30",
                        icon: "💈",
                      },
                      BEARD: {
                        bg: "from-cyan-950/40 via-[#0d1618] to-black",
                        border: "border-cyan-500/25 hover:border-cyan-400",
                        activeBorder: "border-cyan-400 ring-2 ring-cyan-400/50 shadow-lg shadow-cyan-500/25",
                        activeBg: "bg-gradient-to-br from-cyan-500/30 via-cyan-950/50 to-black",
                        text: "text-cyan-300",
                        badgeBg: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
                        icon: "🪒",
                      },
                      SKIN_CARE: {
                        bg: "from-emerald-950/40 via-[#0d1814] to-black",
                        border: "border-emerald-500/25 hover:border-emerald-400",
                        activeBorder: "border-emerald-400 ring-2 ring-emerald-400/50 shadow-lg shadow-emerald-500/25",
                        activeBg: "bg-gradient-to-br from-emerald-500/30 via-emerald-950/50 to-black",
                        text: "text-emerald-300",
                        badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
                        icon: "🧖‍♂️",
                      },
                      BODY_CARE: {
                        bg: "from-blue-950/40 via-[#0d1318] to-black",
                        border: "border-blue-500/25 hover:border-blue-400",
                        activeBorder: "border-blue-400 ring-2 ring-blue-400/50 shadow-lg shadow-blue-500/25",
                        activeBg: "bg-gradient-to-br from-blue-500/30 via-blue-950/50 to-black",
                        text: "text-blue-300",
                        badgeBg: "bg-blue-500/20 text-blue-300 border-blue-500/30",
                        icon: "🧼",
                      },
                      TREATMENT_HAIR: {
                        bg: "from-orange-950/40 via-[#18130d] to-black",
                        border: "border-orange-500/25 hover:border-orange-400",
                        activeBorder: "border-orange-400 ring-2 ring-orange-400/50 shadow-lg shadow-orange-500/25",
                        activeBg: "bg-gradient-to-br from-orange-500/30 via-orange-950/50 to-black",
                        text: "text-orange-300",
                        badgeBg: "bg-orange-500/20 text-orange-300 border-orange-500/30",
                        icon: "💆‍♂️",
                      },
                      COLOR_KERATIN: {
                        bg: "from-purple-950/40 via-[#160d18] to-black",
                        border: "border-purple-500/25 hover:border-purple-400",
                        activeBorder: "border-purple-400 ring-2 ring-purple-400/50 shadow-lg shadow-purple-500/25",
                        activeBg: "bg-gradient-to-br from-purple-500/30 via-purple-950/50 to-black",
                        text: "text-purple-300",
                        badgeBg: "bg-purple-500/20 text-purple-300 border-purple-500/30",
                        icon: "✨",
                      },
                      WAXING: {
                        bg: "from-yellow-950/40 via-[#18170d] to-black",
                        border: "border-yellow-500/25 hover:border-yellow-400",
                        activeBorder: "border-yellow-400 ring-2 ring-yellow-400/50 shadow-lg shadow-yellow-500/25",
                        activeBg: "bg-gradient-to-br from-yellow-500/30 via-yellow-950/50 to-black",
                        text: "text-yellow-300",
                        badgeBg: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
                        icon: "🍯",
                      },
                      MEN_SPA: {
                        bg: "from-amber-900/40 via-[#20150b] to-black",
                        border: "border-amber-400/30 hover:border-amber-300",
                        activeBorder: "border-amber-300 ring-2 ring-amber-300/50 shadow-lg shadow-amber-500/30",
                        activeBg: "bg-gradient-to-br from-amber-400/35 via-amber-950/60 to-black",
                        text: "text-amber-200",
                        badgeBg: "bg-amber-400/20 text-amber-200 border-amber-400/40",
                        icon: "🛁",
                      },
                      VIP_PACKAGES: {
                        bg: "from-yellow-900/45 via-[#231a08] to-black",
                        border: "border-yellow-400/40 hover:border-yellow-300",
                        activeBorder: "border-yellow-300 ring-2 ring-yellow-300/60 shadow-lg shadow-yellow-500/35",
                        activeBg: "bg-gradient-to-br from-yellow-400/40 via-yellow-950/60 to-black",
                        text: "text-yellow-200",
                        badgeBg: "bg-yellow-400/25 text-yellow-200 border-yellow-400/50",
                        icon: "👑",
                      },
                      KIDS: {
                        bg: "from-lime-950/40 via-[#13180d] to-black",
                        border: "border-lime-500/25 hover:border-lime-400",
                        activeBorder: "border-lime-400 ring-2 ring-lime-400/50 shadow-lg shadow-lime-500/25",
                        activeBg: "bg-gradient-to-br from-lime-500/30 via-lime-950/50 to-black",
                        text: "text-lime-300",
                        badgeBg: "bg-lime-500/20 text-lime-300 border-lime-500/30",
                        icon: "👦",
                      },
                      LADIES_SPA: {
                        bg: "from-rose-950/40 via-[#1c0d15] to-black",
                        border: "border-rose-500/25 hover:border-rose-400",
                        activeBorder: "border-rose-400 ring-2 ring-rose-400/50 shadow-lg shadow-rose-500/25",
                        activeBg: "bg-gradient-to-br from-rose-500/30 via-rose-950/50 to-black",
                        text: "text-rose-300",
                        badgeBg: "bg-rose-500/20 text-rose-300 border-rose-500/30",
                        icon: "🧖‍♀️",
                      },
                      BODY_MASKS: {
                        bg: "from-pink-950/40 via-[#1a0d17] to-black",
                        border: "border-pink-500/25 hover:border-pink-400",
                        activeBorder: "border-pink-400 ring-2 ring-pink-400/50 shadow-lg shadow-pink-500/25",
                        activeBg: "bg-gradient-to-br from-pink-500/30 via-pink-950/50 to-black",
                        text: "text-pink-300",
                        badgeBg: "bg-pink-500/20 text-pink-300 border-pink-500/30",
                        icon: "🌺",
                      },
                      LADIES_HAIR: {
                        bg: "from-fuchsia-950/40 via-[#180d19] to-black",
                        border: "border-fuchsia-500/25 hover:border-fuchsia-400",
                        activeBorder: "border-fuchsia-400 ring-2 ring-fuchsia-400/50 shadow-lg shadow-fuchsia-500/25",
                        activeBg: "bg-gradient-to-br from-fuchsia-500/30 via-fuchsia-950/50 to-black",
                        text: "text-fuchsia-300",
                        badgeBg: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30",
                        icon: "💇‍♀️",
                      },
                      LADIES_COLOR: {
                        bg: "from-violet-950/40 via-[#140d1a] to-black",
                        border: "border-violet-500/25 hover:border-violet-400",
                        activeBorder: "border-violet-400 ring-2 ring-violet-400/50 shadow-lg shadow-violet-500/25",
                        activeBg: "bg-gradient-to-br from-violet-500/30 via-violet-950/50 to-black",
                        text: "text-violet-300",
                        badgeBg: "bg-violet-500/20 text-violet-300 border-violet-500/30",
                        icon: "🎨",
                      },
                      LADIES_SKIN: {
                        bg: "from-rose-950/40 via-[#1b0d13] to-black",
                        border: "border-rose-400/25 hover:border-rose-300",
                        activeBorder: "border-rose-300 ring-2 ring-rose-300/50 shadow-lg shadow-rose-500/25",
                        activeBg: "bg-gradient-to-br from-rose-400/30 via-rose-950/50 to-black",
                        text: "text-rose-200",
                        badgeBg: "bg-rose-400/20 text-rose-200 border-rose-400/30",
                        icon: "🌸",
                      },
                      BROWS_LASHES: {
                        bg: "from-purple-950/40 via-[#150d19] to-black",
                        border: "border-purple-400/25 hover:border-purple-300",
                        activeBorder: "border-purple-300 ring-2 ring-purple-300/50 shadow-lg shadow-purple-500/25",
                        activeBg: "bg-gradient-to-br from-purple-400/30 via-purple-950/50 to-black",
                        text: "text-purple-200",
                        badgeBg: "bg-purple-400/20 text-purple-200 border-purple-400/30",
                        icon: "👁️",
                      },
                      NAILS: {
                        bg: "from-pink-950/40 via-[#1c0d16] to-black",
                        border: "border-pink-400/25 hover:border-pink-300",
                        activeBorder: "border-pink-300 ring-2 ring-pink-300/50 shadow-lg shadow-pink-500/25",
                        activeBg: "bg-gradient-to-br from-pink-400/30 via-pink-950/50 to-black",
                        text: "text-pink-200",
                        badgeBg: "bg-pink-400/20 text-pink-200 border-pink-400/30",
                        icon: "💅",
                      },
                      EXTENSIONS: {
                        bg: "from-red-950/40 via-[#1a0d10] to-black",
                        border: "border-red-500/25 hover:border-red-400",
                        activeBorder: "border-red-400 ring-2 ring-red-400/50 shadow-lg shadow-red-500/25",
                        activeBg: "bg-gradient-to-br from-red-500/30 via-red-950/50 to-black",
                        text: "text-red-300",
                        badgeBg: "bg-red-500/20 text-red-300 border-red-500/30",
                        icon: "🎀",
                      },
                      WAX_SWEET: {
                        bg: "from-amber-950/40 via-[#18130d] to-black",
                        border: "border-amber-400/25 hover:border-amber-300",
                        activeBorder: "border-amber-300 ring-2 ring-amber-300/50 shadow-lg shadow-amber-500/25",
                        activeBg: "bg-gradient-to-br from-amber-400/30 via-amber-950/50 to-black",
                        text: "text-amber-200",
                        badgeBg: "bg-amber-400/20 text-amber-200 border-amber-400/30",
                        icon: "🍯",
                      },
                      MAKEUP: {
                        bg: "from-rose-950/40 via-[#1c0d12] to-black",
                        border: "border-rose-600/30 hover:border-rose-400",
                        activeBorder: "border-rose-400 ring-2 ring-rose-400/50 shadow-lg shadow-rose-500/25",
                        activeBg: "bg-gradient-to-br from-rose-600/30 via-rose-950/50 to-black",
                        text: "text-rose-200",
                        badgeBg: "bg-rose-600/20 text-rose-200 border-rose-600/30",
                        icon: "💄",
                      },
                      MASSAGE: {
                        bg: "from-teal-950/40 via-[#0d1816] to-black",
                        border: "border-teal-500/25 hover:border-teal-400",
                        activeBorder: "border-teal-400 ring-2 ring-teal-400/50 shadow-lg shadow-teal-500/25",
                        activeBg: "bg-gradient-to-br from-teal-500/30 via-teal-950/50 to-black",
                        text: "text-teal-300",
                        badgeBg: "bg-teal-500/20 text-teal-300 border-teal-500/30",
                        icon: "💆‍♀️",
                      },
                      NEWSKIN_LASER: {
                        bg: "from-cyan-950/40 via-[#09181d] to-black",
                        border: "border-cyan-400/30 hover:border-cyan-300",
                        activeBorder: "border-cyan-300 ring-2 ring-cyan-300/60 shadow-lg shadow-cyan-500/30",
                        activeBg: "bg-gradient-to-br from-cyan-400/30 via-cyan-950/50 to-black",
                        text: "text-cyan-200",
                        badgeBg: "bg-cyan-400/20 text-cyan-200 border-cyan-400/40",
                        icon: "⚡",
                      },
                      NEWSKIN_MICRO: {
                        bg: "from-amber-950/40 via-[#18150d] to-black",
                        border: "border-amber-400/30 hover:border-amber-300",
                        activeBorder: "border-amber-300 ring-2 ring-amber-300/50 shadow-lg shadow-amber-500/25",
                        activeBg: "bg-gradient-to-br from-amber-400/30 via-amber-950/50 to-black",
                        text: "text-amber-200",
                        badgeBg: "bg-amber-400/20 text-amber-200 border-amber-400/40",
                        icon: "🌟",
                      },
                      NEWSKIN_DERMA: {
                        bg: "from-teal-950/40 via-[#0d1a18] to-black",
                        border: "border-teal-400/30 hover:border-teal-300",
                        activeBorder: "border-teal-300 ring-2 ring-teal-300/50 shadow-lg shadow-teal-500/25",
                        activeBg: "bg-gradient-to-br from-teal-400/30 via-teal-950/50 to-black",
                        text: "text-teal-200",
                        badgeBg: "bg-teal-400/20 text-teal-200 border-teal-400/40",
                        icon: "🩺",
                      },
                      NEWSKIN_PEDICURE: {
                        bg: "from-emerald-950/40 via-[#0d1914] to-black",
                        border: "border-emerald-400/30 hover:border-emerald-300",
                        activeBorder: "border-emerald-300 ring-2 ring-emerald-300/50 shadow-lg shadow-emerald-500/25",
                        activeBg: "bg-gradient-to-br from-emerald-400/30 via-emerald-950/50 to-black",
                        text: "text-emerald-200",
                        badgeBg: "bg-emerald-400/20 text-emerald-200 border-emerald-400/40",
                        icon: "🇮🇹",
                      },
                    };

                    const defaultStyle = {
                      bg: "from-slate-900 via-slate-950 to-black",
                      border: "border-white/10 hover:border-amber-400/50",
                      activeBorder: "border-amber-400 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/20",
                      activeBg: "bg-gradient-to-br from-amber-500/25 to-black",
                      text: "text-slate-200",
                      badgeBg: "bg-white/10 text-slate-300 border-white/10",
                      icon: "✨",
                    };

                    // 3. Strictly Filter Services Catalog by Branch
                    const allowedBranchCategories = isNewSkinTheme
                      ? NEWSKIN_CATEGORIES
                      : isWomenTheme
                      ? WOMEN_CATEGORIES
                      : MEN_CATEGORIES;

                    const branchServices = (activeBranchId === "ALL" && isOwnerOrGM)
                      ? servicesCatalog
                      : servicesCatalog.filter((svc) => allowedBranchCategories.includes(svc.category));

                    const rawCats = [
                      "ALL",
                      ...allowedBranchCategories.filter((cat) => branchServices.some((s) => s.category === cat)),
                    ];

                    const filteredServices = branchServices.filter((svc) => {
                      const matchCat = admitServiceCategory === "ALL" || svc.category === admitServiceCategory;
                      const matchSearch =
                        !admitServiceSearch.trim() ||
                        svc.nameAr?.toLowerCase().includes(admitServiceSearch.trim().toLowerCase());
                      return matchCat && matchSearch;
                    });

                    return (
                      <>
                        <div className="flex items-center justify-between pb-1 border-b border-white/5">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-amber-300 text-sm block">
                              قائمة الخدمات المطلوبة مبدئياً ✂️
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              {isNewSkinTheme
                                ? "💎 عيادة نيو سكين VIP"
                                : isWomenTheme
                                ? "🌸 حمام وسبا الباشا"
                                : "💈 صالون دقن الباشا (رجالي)"}
                            </span>
                          </div>
                          {admitSelectedServices.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setAdmitSelectedServices([])}
                              className="text-xs text-rose-400 hover:text-rose-300 underline font-bold cursor-pointer"
                            >
                              إلغاء تحديد ({admitSelectedServices.length}) ✕
                            </button>
                          )}
                        </div>

                        {/* Search Bar */}
                        <div className="relative">
                          <input
                            type="text"
                            value={admitServiceSearch}
                            onChange={(e) => setAdmitServiceSearch(e.target.value)}
                            placeholder={
                              isNewSkinTheme
                                ? "🔍 ابحث في خدمات عيادة نيو سكين (ليزر، ديرما، باديكير سبا، مايكرو)..."
                                : isWomenTheme
                                ? "🔍 ابحث في خدمات حمام الباشا (حمام مغربي، دلكة، سيشوار، أظافر، مساج)..."
                                : "🔍 ابحث في خدمات دقن الباشا (حلاقة شعر، لحية، تنظيف بشرة، معالجات، بكجات)..."
                            }
                            className="w-full py-2.5 px-3.5 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-bold focus:border-amber-400 outline-none placeholder:text-slate-500"
                          />
                          {admitServiceSearch && (
                            <button
                              type="button"
                              onClick={() => setAdmitServiceSearch("")}
                              className="absolute left-2.5 top-2.5 text-slate-400 hover:text-white text-xs font-bold"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        {/* Arabic Categories Wrap */}
                        <div className="flex flex-wrap items-center gap-1.5 max-h-24 overflow-y-auto pr-1">
                          {rawCats.map((cat) => {
                            const label = ARABIC_CATS[cat] || cat;
                            const isSelected = admitServiceCategory === cat;
                            return (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => setAdmitServiceCategory(cat)}
                                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                                  isSelected
                                    ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30 ring-1 ring-amber-300 scale-105"
                                    : "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5"
                                }`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>

                        {/* Interactive Square Tiles Grid (Responsive 2 to 5 columns) */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5 max-h-[50vh] overflow-y-auto pr-1.5 custom-scrollbar">
                          {filteredServices.length === 0 ? (
                            <div className="col-span-full py-12 text-center text-slate-500 text-xs font-bold">
                              لا توجد خدمات مطابقة لبحثك في هذا القسم 🔎
                            </div>
                          ) : (
                            filteredServices.map((svc) => {
                              const isSelected = admitSelectedServices.some((s) => s.id === svc.id);
                              const style = CATEGORY_STYLES[svc.category] || defaultStyle;

                              return (
                                <button
                                  key={svc.id}
                                  type="button"
                                  onClick={() => {
                                    if (isSelected) {
                                      setAdmitSelectedServices(admitSelectedServices.filter((s) => s.id !== svc.id));
                                    } else {
                                      setAdmitSelectedServices([
                                        ...admitSelectedServices,
                                        {
                                          id: svc.id,
                                          nameAr: svc.nameAr,
                                          price: svc.price,
                                          durationMinutes: svc.durationMinutes || 30,
                                          category: svc.category,
                                          addedBy: "CASHIER",
                                        },
                                      ]);
                                    }
                                  }}
                                  className={`relative group rounded-2xl p-2.5 sm:p-3 text-right border-2 transition-all duration-200 flex flex-col justify-between cursor-pointer select-none overflow-hidden aspect-square ${
                                    isSelected
                                      ? `${style.activeBorder} ${style.activeBg} scale-[1.03]`
                                      : `bg-gradient-to-br ${style.bg} ${style.border} hover:scale-[1.02] hover:shadow-lg`
                                  }`}
                                >
                                  {/* Top Row: Category Icon Badge & Selection Checkmark */}
                                  <div className="flex items-center justify-between w-full shrink-0">
                                    <span className={`text-[11px] px-2 py-0.5 rounded-full border font-bold ${style.badgeBg}`}>
                                      {style.icon}
                                    </span>
                                    <div
                                      className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center text-xs font-black transition ${
                                        isSelected
                                          ? "bg-amber-400 border-amber-300 text-slate-950 shadow-md"
                                          : "border-white/20 bg-black/60 text-transparent"
                                      }`}
                                    >
                                      ✓
                                    </div>
                                  </div>

                                  {/* Center: Service Name */}
                                  <div className="my-auto py-1">
                                    <h5
                                      className={`font-black text-xs sm:text-[13px] leading-snug line-clamp-2 ${
                                        isSelected ? "text-white" : style.text
                                      }`}
                                      title={svc.nameAr}
                                    >
                                      {svc.nameAr}
                                    </h5>
                                  </div>

                                  {/* Bottom Row: Duration & Price */}
                                  <div className="flex items-center justify-between pt-1 border-t border-white/10 w-full text-[10px] shrink-0">
                                    <span className="text-slate-400 font-medium">⏱️ {svc.durationMinutes || 30} د</span>
                                    <span className="font-mono font-black text-xs sm:text-sm text-amber-300">
                                      {svc.price} <span className="text-[10px]">ج</span>
                                    </span>
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>

                        {/* Selected Services Counter & Real-Time Total Bar */}
                        {admitSelectedServices.length > 0 && (
                          <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-between text-xs shrink-0 shadow-lg">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shrink-0 shadow">
                                {admitSelectedServices.length}
                              </span>
                              <span className="text-amber-200 font-bold truncate">
                                {admitSelectedServices.map((s) => s.nameAr).join(" • ")}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 mr-2">
                              <span className="text-[11px] text-slate-400 font-bold">الإجمالي المبدئي:</span>
                              <span className="font-mono font-black text-amber-300 text-sm sm:text-base">
                                {admitSelectedServices.reduce((sum, s) => sum + (Number(s.price) || 0), 0)} ج.م
                              </span>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
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
              <span className="text-xs text-slate-300 font-bold block mb-1">
                {isWomenTheme ? "خبيرات السبا المتاحات الآن:" : "الكباتن المتاحين في الصالون الآن:"}
              </span>
              {filteredSpecialists.map((sp) => {
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
          3. PROFESSIONAL RECEIPT PRINT TEMPLATES & PREVIEW MODAL
         ───────────────────────────────────────────────────────────── */}
      {lastPrintedTicket && (
        <>
          {/* Printable Thermal 80mm element (Used if native window.print() is invoked) */}
          <div id="thermal-receipt" className="hidden print:block text-black font-sans" dir="rtl">
            <div className="text-center space-y-1 border-b-2 border-black pb-2 mb-2">
              <div className="text-2xl leading-none">👑</div>
              <h2 className="text-base font-black tracking-wider">
                مجموعة صالونات وسبا الباشا VIP
              </h2>
              <p className="text-xs font-black">
                {lastPrintedTicket.branch?.name?.includes("Skin") || lastPrintedTicket.services?.includes("ليزر")
                  ? "عيادة نيو سكين VIP (جلدية وليزر)"
                  : lastPrintedTicket.branch?.name?.includes("حمام") || isWomenTheme
                  ? "حمام وسبا الباشا VIP (حريمي)"
                  : "صالون دقن الباشا VIP (رجالي)"}
              </p>
              <p className="text-[10px] font-mono font-bold tracking-tight text-gray-700">
                {lastPrintedTicket.branch?.name?.includes("Skin") || lastPrintedTicket.services?.includes("ليزر")
                  ? "NEW SKIN CLINIC & LASER VIP"
                  : lastPrintedTicket.branch?.name?.includes("حمام") || isWomenTheme
                  ? "HAMMAM EL BASHA - LUXURY WOMEN SPA"
                  : "DAKN EL BASHA - VIP MEN SALON"}
              </p>
              <p className="text-[10px] font-bold">
                {lastPrintedTicket.branch?.name || "فرع حدائق القبة الملكي"}
              </p>
              <p className="text-[9px] text-gray-600">
                73 ترعة الجبل، أمام مستشفى سان بول • ت: 01210103025
              </p>
            </div>

            <div className="text-[11px] space-y-1.5 border-b border-black pb-2 mb-2 font-medium">
              <div className="flex justify-between items-center font-bold">
                <span>إيصال رقم:</span>
                <span className="font-mono text-sm tracking-wide">#{lastPrintedTicket.ticketNumber}</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span>التاريخ والوقت:</span>
                <span className="font-mono font-bold">
                  {new Date().toLocaleDateString("ar-EG")} • {new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>العميل:</span>
                <strong className="text-xs">{lastPrintedTicket.customerName || "عميل الباشا VIP"}</strong>
              </div>
              {lastPrintedTicket.customerPhone && (
                <div className="flex justify-between items-center text-[10px]">
                  <span>رقم الهاتف:</span>
                  <span className="font-mono">{lastPrintedTicket.customerPhone}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span>المتخصص والكرسي:</span>
                <strong>
                  {lastPrintedTicket.specialist?.name || "كابتن الباشا"} (كرسي #{lastPrintedTicket.chairNumber || 1})
                </strong>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span>الكاشير المسؤول:</span>
                <span>{lastPrintedTicket.cashierName || currentUser?.name || "كاشير الباشا"}</span>
              </div>
              <div className="flex justify-between items-center font-bold">
                <span>طريقة الدفع:</span>
                <span>
                  {lastPrintedTicket.paymentMethod === "CASH"
                    ? "نقداً (كاش) 💵"
                    : lastPrintedTicket.paymentMethod === "CARD"
                    ? "بطاقة بنكية (فيزا) 💳"
                    : lastPrintedTicket.paymentMethod === "INSTAPAY"
                    ? "انستاباي InstaPay ⚡"
                    : "محفظة إلكترونية 📱"}
                </span>
              </div>
            </div>

            {/* Table of Services & Retail */}
            <div className="text-[11px] space-y-1 border-b border-black pb-2 mb-2">
              <table className="w-full text-right border-collapse text-[10.5px]">
                <thead>
                  <tr className="border-b border-black text-[10px]">
                    <th className="py-1 text-right">الخدمة / الصنف</th>
                    <th className="py-1 text-center">الكمية</th>
                    <th className="py-1 text-center">السعر</th>
                    <th className="py-1 text-left">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(() => {
                    let s: any[] = [];
                    try {
                      s = typeof lastPrintedTicket.services === "string" ? JSON.parse(lastPrintedTicket.services) : lastPrintedTicket.services || [];
                    } catch {}
                    return s.map((it: any, idx: number) => (
                      <tr key={`svc-${idx}`}>
                        <td className="py-1 text-right font-bold">{it.nameAr}</td>
                        <td className="py-1 text-center">1</td>
                        <td className="py-1 text-center font-mono">{it.price}</td>
                        <td className="py-1 text-left font-mono font-bold">{it.price} ج</td>
                      </tr>
                    ));
                  })()}

                  {(() => {
                    let r: any[] = [];
                    try {
                      r = typeof lastPrintedTicket.retailItems === "string" ? JSON.parse(lastPrintedTicket.retailItems) : lastPrintedTicket.retailItems || [];
                    } catch {}
                    return r.map((it: any, idx: number) => (
                      <tr key={`ret-${idx}`}>
                        <td className="py-1 text-right font-bold">{it.nameAr}</td>
                        <td className="py-1 text-center font-mono">{it.qty}</td>
                        <td className="py-1 text-center font-mono">{it.price}</td>
                        <td className="py-1 text-left font-mono font-bold">{it.total} ج</td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>

            {/* Calculations Breakdown */}
            <div className="text-[11px] space-y-1 border-b border-black pb-2 mb-2 font-medium">
              {lastPrintedTicket.servicesTotal > 0 && lastPrintedTicket.retailTotal > 0 && (
                <>
                  <div className="flex justify-between">
                    <span>إجمالي الخدمات:</span>
                    <span className="font-mono font-bold">{lastPrintedTicket.servicesTotal} ج</span>
                  </div>
                  <div className="flex justify-between">
                    <span>إجمالي المنتجات:</span>
                    <span className="font-mono font-bold">{lastPrintedTicket.retailTotal} ج</span>
                  </div>
                </>
              )}
              {lastPrintedTicket.discount > 0 && (
                <div className="flex justify-between text-red-700 font-bold">
                  <span>الخصم الممنوح:</span>
                  <span className="font-mono">-{lastPrintedTicket.discount} ج</span>
                </div>
              )}
              {lastPrintedTicket.tipAmount > 0 && (
                <div className="flex justify-between">
                  <span>الإكرامية / الخدمة:</span>
                  <span className="font-mono font-bold">+{lastPrintedTicket.tipAmount} ج</span>
                </div>
              )}
            </div>

            {/* Final Total Box */}
            <div className="border-2 border-black p-2 my-2 flex justify-between items-center text-sm font-black bg-gray-50">
              <span>المبلغ الإجمالي المدفوع:</span>
              <span className="font-mono text-base">{lastPrintedTicket.finalAmount} ج.م</span>
            </div>

            {/* Barcode & QR Code */}
            <div className="my-2 text-center space-y-1">
              <div
                className="flex justify-center"
                dangerouslySetInnerHTML={{
                  __html: generateCode128Svg(lastPrintedTicket.ticketNumber || "CHK-IN-0000", {
                    height: 36,
                    moduleWidth: 1.5,
                    includeText: true,
                    fontSize: 10,
                  }),
                }}
              />
              {receiptQrDataUrl && (
                <div className="flex flex-col items-center justify-center pt-1">
                  <img src={receiptQrDataUrl} alt="QR Code" className="w-20 h-20" />
                  <span className="text-[8px] text-gray-500">امسح الكود للتحقق الذكي وحجز موعدك أونلاين</span>
                </div>
              )}
            </div>

            {/* Royal Footer */}
            <div className="text-center text-[10px] space-y-1 pt-1.5 border-t border-black">
              <p className="font-bold">{settings?.receiptFooterNotes || "شكراً لزيارتكم مجموعة صالونات وسبا الباشا VIP 👑"}</p>
              <p className="font-mono font-black text-[10px]">
                خدمة العملاء والحجز: 01210103025 - 01556782015
              </p>
              <p className="text-[8.5px] text-gray-700">
                📍 دقن الباشا: 73 ترعة الجبل • 📍 حمام الباشا: 84 ترعة الجبل كينج بارك مول
              </p>
              <p className="text-[7.5px] text-gray-500 pt-0.5">
                تطوير شركة أوركا للحلول البرمجية (Orca Tech) 🐬
              </p>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────
              RECEIPT MODAL (Live Interactive Preview & Print Dispatcher)
             ───────────────────────────────────────────────────────── */}
          {showReceiptModal && (
            <div
              className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex justify-center items-start sm:items-center py-6 sm:py-10 px-3 font-sans no-print"
              dir="rtl"
            >
              <div className="relative w-full max-w-xl my-auto bg-[#12121a] border border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-2xl bg-amber-500/20 text-amber-400">
                      <Printer className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white flex items-center gap-2">
                        معاينة وطباعة الفاتورة الملكية
                        <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          #{lastPrintedTicket.ticketNumber}
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        العميل: <strong className="text-white">{lastPrintedTicket.customerName}</strong> • المبلغ:{" "}
                        <strong className="text-amber-400 font-mono">{lastPrintedTicket.finalAmount} ج.م</strong>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowReceiptModal(false)}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center text-sm cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* View Mode Switcher Tabs */}
                <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setReceiptPrintMode("THERMAL_80MM")}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
                      receiptPrintMode === "THERMAL_80MM"
                        ? "bg-amber-500 text-slate-950 shadow-md"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Receipt className="w-4 h-4" />
                    <span>إيصال كاشير حراري (80mm Xprinter)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReceiptPrintMode("A4_INVOICE")}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
                      receiptPrintMode === "A4_INVOICE"
                        ? "bg-amber-500 text-slate-950 shadow-md"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>فاتورة ضريبية رسمية (A4)</span>
                  </button>
                </div>

                {/* Interactive Real Paper Preview Window */}
                <div className="overflow-y-auto pr-1 flex-1 max-h-[50vh] rounded-2xl bg-slate-900/80 p-3 border border-white/10 flex justify-center">
                  {receiptPrintMode === "THERMAL_80MM" ? (
                    /* Thermal 80mm Preview Card */
                    <div className="w-[300px] bg-white text-black p-4 rounded-xl shadow-2xl font-sans text-xs space-y-2 border border-slate-300">
                      <div className="text-center space-y-1 border-b border-black pb-2">
                        <div className="text-xl">👑</div>
                        <h4 className="font-black text-sm">مجموعة صالونات وسبا الباشا VIP</h4>
                        <p className="text-[10px] font-bold text-gray-700">
                          {lastPrintedTicket.branch?.name?.includes("Skin") || lastPrintedTicket.services?.includes("ليزر")
                            ? "عيادة نيو سكين VIP (جلدية وليزر)"
                            : lastPrintedTicket.branch?.name?.includes("حمام") || isWomenTheme
                            ? "حمام وسبا الباشا VIP (حريمي)"
                            : "صالون دقن الباشا VIP (رجالي)"}
                        </p>
                        <p className="text-[9px] font-mono text-gray-500 font-semibold">
                          {lastPrintedTicket.branch?.name || "فرع حدائق القبة الملكي"}
                        </p>
                      </div>

                      <div className="text-[10px] space-y-1 border-b border-dashed border-gray-400 pb-2">
                        <div className="flex justify-between font-bold">
                          <span>إيصال رقم:</span>
                          <span className="font-mono">#{lastPrintedTicket.ticketNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>العميل:</span>
                          <strong>{lastPrintedTicket.customerName}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>المتخصص:</span>
                          <span>{lastPrintedTicket.specialist?.name || "كابتن الباشا"} (كرسي #{lastPrintedTicket.chairNumber || 1})</span>
                        </div>
                        <div className="flex justify-between">
                          <span>طريقة الدفع:</span>
                          <span className="font-bold">
                            {lastPrintedTicket.paymentMethod === "CASH"
                              ? "نقداً (كاش)"
                              : lastPrintedTicket.paymentMethod === "CARD"
                              ? "فيزا (بطاقة بنكية)"
                              : "انستاباي / محفظة"}
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="text-[10px] space-y-1 border-b border-dashed border-gray-400 pb-2">
                        {(() => {
                          let s: any[] = [];
                          try {
                            s = typeof lastPrintedTicket.services === "string" ? JSON.parse(lastPrintedTicket.services) : lastPrintedTicket.services || [];
                          } catch {}
                          return s.map((it: any, i: number) => (
                            <div key={`prev-svc-${i}`} className="flex justify-between">
                              <span className="font-semibold">{it.nameAr}</span>
                              <span className="font-mono font-bold">{it.price} ج</span>
                            </div>
                          ));
                        })()}
                        {(() => {
                          let r: any[] = [];
                          try {
                            r = typeof lastPrintedTicket.retailItems === "string" ? JSON.parse(lastPrintedTicket.retailItems) : lastPrintedTicket.retailItems || [];
                          } catch {}
                          return r.map((it: any, i: number) => (
                            <div key={`prev-ret-${i}`} className="flex justify-between">
                              <span className="font-semibold">{it.nameAr} (×{it.qty})</span>
                              <span className="font-mono font-bold">{it.total} ج</span>
                            </div>
                          ));
                        })()}
                      </div>

                      {/* Final Total */}
                      <div className="bg-gray-100 p-2 rounded border border-gray-300 flex justify-between items-center font-black text-xs">
                        <span>المبلغ المدفوع:</span>
                        <span className="font-mono text-sm text-emerald-800">{lastPrintedTicket.finalAmount} ج.م</span>
                      </div>

                      {/* Barcode & QR code preview */}
                      <div className="text-center pt-1">
                        <div
                          className="flex justify-center"
                          dangerouslySetInnerHTML={{
                            __html: generateCode128Svg(lastPrintedTicket.ticketNumber || "CHK-IN-0000", {
                              height: 32,
                              moduleWidth: 1.3,
                              includeText: true,
                              fontSize: 9,
                            }),
                          }}
                        />
                        {receiptQrDataUrl && (
                          <div className="flex justify-center pt-2">
                            <img src={receiptQrDataUrl} alt="QR" className="w-16 h-16" />
                          </div>
                        )}
                      </div>

                      <div className="text-center text-[8.5px] text-gray-500 pt-1 border-t border-gray-200">
                        شكراً لزيارتكم • دي هيبة الباشا تليق بكم 👑
                      </div>
                    </div>
                  ) : (
                    /* A4 Invoice Preview Card */
                    <div className="w-full max-w-[420px] bg-white text-black p-5 rounded-xl shadow-2xl font-sans text-[11px] space-y-3 border-2 border-amber-600/30">
                      <div className="flex justify-between items-center border-b-2 border-amber-600/40 pb-3">
                        <div>
                          <h4 className="font-black text-sm text-slate-900">مجموعة صالونات وسبا الباشا VIP</h4>
                          <p className="text-[10px] text-amber-700 font-bold">فاتورة ضريبية رسمية (TAX INVOICE)</p>
                          <p className="text-[9px] text-gray-500">{lastPrintedTicket.branch?.name || "فرع حدائق القبة"}</p>
                        </div>
                        <div className="text-2xl">👑</div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 p-2 bg-gray-50 rounded border border-gray-200 text-[10px]">
                        <div>
                          <span className="text-gray-500 block">رقم الفاتورة:</span>
                          <span className="font-mono font-bold">#{lastPrintedTicket.ticketNumber}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">التاريخ:</span>
                          <span className="font-mono font-bold">{new Date().toLocaleDateString("ar-EG")}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">اسم العميل:</span>
                          <span className="font-bold">{lastPrintedTicket.customerName}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">الكاشير:</span>
                          <span>{lastPrintedTicket.cashierName || currentUser?.name || "المايسترو"}</span>
                        </div>
                      </div>

                      {/* Items table */}
                      <table className="w-full text-right border-collapse text-[10px]">
                        <thead>
                          <tr className="bg-slate-900 text-white">
                            <th className="p-1.5 text-right">البيان</th>
                            <th className="p-1.5 text-center">الكمية</th>
                            <th className="p-1.5 text-center">السعر</th>
                            <th className="p-1.5 text-left">الإجمالي</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {(() => {
                            let s: any[] = [];
                            try {
                              s = typeof lastPrintedTicket.services === "string" ? JSON.parse(lastPrintedTicket.services) : lastPrintedTicket.services || [];
                            } catch {}
                            return s.map((it: any, i: number) => (
                              <tr key={`a4-svc-${i}`}>
                                <td className="p-1.5 font-bold">{it.nameAr}</td>
                                <td className="p-1.5 text-center">1</td>
                                <td className="p-1.5 text-center font-mono">{it.price}</td>
                                <td className="p-1.5 text-left font-mono font-bold">{it.price} ج</td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>

                      {/* Total */}
                      <div className="border-t-2 border-black pt-2 flex justify-between items-center font-black">
                        <span>إجمالي الفاتورة المدفوع:</span>
                        <span className="text-sm font-mono text-emerald-800">{lastPrintedTicket.finalAmount} ج.م</span>
                      </div>

                      {/* QR and Stamps */}
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200 text-[9px] text-gray-500">
                        {receiptQrDataUrl && <img src={receiptQrDataUrl} alt="QR" className="w-14 h-14" />}
                        <div className="text-center border border-dashed border-gray-400 p-2 rounded">
                          <div>ختم الإدارة والاعتماد</div>
                          <div className="font-bold text-amber-800 pt-0.5">مجموعة الباشا VIP 👑</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Dispatch & Print Buttons */}
                <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => executePrintThermal(lastPrintedTicket)}
                      className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>طباعة إيصال كاشير (80mm Xprinter)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => executePrintA4Invoice(lastPrintedTicket)}
                      className="py-2.5 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition flex items-center gap-2 border border-white/10 cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-amber-400" />
                      <span>طباعة فاتورة A4 رسمية</span>
                    </button>

                    {lastPrintedTicket.customerPhone && (
                      <button
                        type="button"
                        onClick={() => handleSendReceiptWhatsApp(lastPrintedTicket)}
                        className="py-2.5 px-3.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-bold text-xs transition flex items-center gap-1.5 border border-emerald-500/30 cursor-pointer"
                        title="إرسال إيصال الدفع عبر واتساب للعميل"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>إرسال واتساب</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowReceiptModal(false)}
                    className="py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition cursor-pointer"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
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

                {/* Z-Report & Audit Print Shortcuts */}
                <div className="pt-2 border-t border-white/10 space-y-2">
                  <div className="text-[11px] font-bold text-slate-400">خيارات طباعة تقارير الوردية واليومية (Z-Report):</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => executePrintShiftZReport(openShift, shiftStats)}
                      className="py-2.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>طباعة Z-Report رول (80mm Xprinter)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => executePrintShiftA4Report(openShift, shiftStats)}
                      className="py-2.5 px-3 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <FileText className="w-4 h-4" />
                      <span>طباعة تقرير تفصيلي رسمي (A4)</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SUPERVISOR CANCELLATION REQUEST MODAL (طلب إلغاء من المشرف العام)
         ───────────────────────────────────────────────────────────── */}
      {showCancelRequestModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-sans no-print"
          dir="rtl"
        >
          <div className="relative w-full max-w-md bg-[#12121a] border border-rose-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center text-lg">
                  ⚠️
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">طلب إلغاء فاتورة من المشرف العام</h3>
                  <p className="text-[11px] text-slate-400">
                    تذكرة #{showCancelRequestModal.ticketNumber} • {showCancelRequestModal.customerName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCancelRequestModal(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] leading-relaxed">
                وفقاً لتعليمات إدارة صالونات وسبا الباشا: لا يمتلك الكاشير صلاحية الحذف المباشر للفواتير. يتم رفع الطلب فوراً إلى المشرف العام <strong>(أحمد عبد الرحيم)</strong> أو مدير الفرع للمراجعة والاعتماد.
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">سبب طلب الإلغاء أو التعديل *:</label>
                <textarea
                  required
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="مثال: الزبون اعتذر لظرف طارئ قبل بدء الخدمة، أو تم تسجيل الكرسي بالخطأ..."
                  className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white font-sans text-xs focus:outline-none focus:border-rose-400"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSubmitCancelRequest}
                  disabled={submittingCancelRequest || !cancelReason.trim()}
                  className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition shadow-lg shadow-rose-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {submittingCancelRequest ? "جاري الإرسال للمشرف..." : "إرسال طلب الإلغاء للاعتماد 📤"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCancelRequestModal(null)}
                  className="py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  تراجع
                </button>
              </div>
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
                  <option value="">{isWomenTheme ? "-- اختاري خبيرة السبا --" : "-- اختر المتخصص --"}</option>
                  {filteredSpecialists.map((sp) => (
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
