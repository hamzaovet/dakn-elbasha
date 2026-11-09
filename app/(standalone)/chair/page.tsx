"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Scissors,
  CheckCircle2,
  Clock,
  User,
  Plus,
  Trash2,
  DollarSign,
  LogOut,
  Sparkles,
  Award,
  RefreshCw,
  Phone,
  Flame,
  Check,
  ChevronRight,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

export default function SpecialistChairPage() {
  const router = useRouter();

  // Specialist Auth
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [specialist, setSpecialist] = useState<any>(null);

  // Active Ticket on Chair
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Available Services & Offers
  const [services, setServices] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Waiting Bookings Queue
  const [waitingBookings, setWaitingBookings] = useState<any[]>([]);
  // Waiting Lounge Queue (Walk-ins waiting for this specialist or first available)
  const [waitingLoungeTickets, setWaitingLoungeTickets] = useState<any[]>([]);

  // Walk-in modal
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInName, setWalkInName] = useState("");
  const [walkInPhone, setWalkInPhone] = useState("");
  const [startingTicket, setStartingTicket] = useState(false);

  // VIP Finish Confirmation Modal & Toast States (No native Windows alerts!)
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  const notify = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  // Elapsed time on chair
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  // Action status
  const [actionLoading, setActionLoading] = useState(false);

  // Check Auth on Mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("basha_staff_user") || localStorage.getItem("saddam_staff_user");
      if (!saved) {
        router.push("/login");
        return;
      }
      const user = JSON.parse(saved);
      if (user.role !== "specialist" && user.role !== "owner" && user.role !== "general_manager" && user.role !== "manager") {
        router.push("/login");
        return;
      }
      setCurrentUser(user);
    } catch {
      router.push("/login");
    }
  }, [router]);

  // Load Specialist Profile, Active Ticket & Services
  const fetchChairData = async () => {
    if (!currentUser) return;
    try {
      // Find specialist profile
      const resSpec = await fetch(`/api/specialists?activeOnly=false`);
      const dataSpec = await resSpec.json();
      if (dataSpec.success && dataSpec.specialists) {
        let matched = dataSpec.specialists.find(
          (s: any) => s.userId === currentUser.id || s.id === currentUser.specialistId
        );
        // Fallback for owner / manager testing chair
        if (!matched && dataSpec.specialists.length > 0) {
          matched = dataSpec.specialists[0];
        }
        setSpecialist(matched);

        if (matched) {
          // Fetch active ticket for this specialist
          const resTickets = await fetch(`/api/tickets?specialistId=${matched.id}&status=IN_CHAIR`);
          const dataTickets = await resTickets.json();
          if (dataTickets.success && dataTickets.tickets && dataTickets.tickets.length > 0) {
            setActiveTicket(dataTickets.tickets[0]);
          } else {
            setActiveTicket(null);
          }

          // Fetch waiting bookings for today
          const today = new Date().toISOString().split("T")[0];
          const resBookings = await fetch(
            `/api/bookings?branchId=${matched.branchId}&status=CONFIRMED&bookingDate=${today}`
          );
          const dataBookings = await resBookings.json();
          if (dataBookings.success && dataBookings.bookings) {
            setWaitingBookings(dataBookings.bookings);
          }

          // Fetch waiting lounge tickets for this specialist or first available
          const resWaiting = await fetch(`/api/tickets?branchId=${matched.branchId}&status=WAITING`);
          const dataWaiting = await resWaiting.json();
          if (dataWaiting.success && dataWaiting.tickets) {
            const forMe = dataWaiting.tickets.filter(
              (t: any) => t.specialistId === matched.id || t.notes?.includes("أول كابتن")
            );
            setWaitingLoungeTickets(forMe);
          } else {
            setWaitingLoungeTickets([]);
          }
        }
      }

      // Fetch all services & royal offers
      const [resS, resO] = await Promise.all([
        fetch("/api/services", { cache: "no-store" }),
        fetch("/api/offers?activeOnly=true", { cache: "no-store" }),
      ]);
      const [dataS, dataO] = await Promise.all([resS.json(), resO.json()]);
      if (dataS.success && dataS.services) setServices(dataS.services);
      if (dataO.success && dataO.offers) setOffers(dataO.offers);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchChairData();
      const interval = setInterval(fetchChairData, 5000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  // Elapsed Timer
  useEffect(() => {
    if (activeTicket?.startTime) {
      const updateTimer = () => {
        const start = new Date(activeTicket.startTime).getTime();
        const now = Date.now();
        const diff = Math.max(0, Math.floor((now - start) / 60000));
        setElapsedMinutes(diff);
      };
      updateTimer();
      const t = setInterval(updateTimer, 30000);
      return () => clearInterval(t);
    } else {
      setElapsedMinutes(0);
    }
  }, [activeTicket]);

  // Start Chair Ticket for Walk-in Client
  const handleStartWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInName.trim() || !specialist) return;

    try {
      setStartingTicket(true);
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          specialistId: specialist.id,
          branchId: specialist.branchId,
          customerName: walkInName.trim(),
          customerPhone: walkInPhone.trim() || null,
        }),
      });

      const data = await res.json();
      if (data.success && data.ticket) {
        setActiveTicket(data.ticket);
        setShowWalkInModal(false);
        setWalkInName("");
        setWalkInPhone("");
        fetchChairData();
        notify("success", `تم بدء جلسة الحلاقة للعميل (${data.ticket.customerName}) بنجاح ✂️`);
      } else {
        notify("error", data.error || "فشل بدء التذكرة");
      }
    } catch {
      notify("error", "حدث خطأ أثناء الاتصال بالخادم");
    } finally {
      setStartingTicket(false);
    }
  };

  // Admit Booked Client to Chair
  const handleAdmitBooking = async (booking: any) => {
    if (!specialist) return;
    try {
      setStartingTicket(true);
      let parsedServices: any[] = [];
      try {
        parsedServices =
          typeof booking.serviceIds === "string"
            ? JSON.parse(booking.serviceIds)
            : booking.serviceIds || [];
      } catch {
        parsedServices = [];
      }

      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          specialistId: specialist.id,
          branchId: specialist.branchId,
          customerId: booking.customerId,
          customerName: booking.customer?.name || "عميل حجز",
          customerPhone: booking.customer?.phone || null,
          bookingId: booking.id,
          initialServices: parsedServices,
        }),
      });

      const data = await res.json();
      if (data.success && data.ticket) {
        setActiveTicket(data.ticket);
        fetchChairData();
        notify("success", `تم استقبال العميل (${booking.customer?.name}) على الكرسي بنجاح 💺`);
      } else {
        notify("error", data.error || "فشل استقبال العميل");
      }
    } catch {
      notify("error", "تعذر استقبال العميل");
    } finally {
      setStartingTicket(false);
    }
  };

  // Admit Waiting Lounge Client Directly onto Chair
  const handleAdmitWaitingClient = async (waitingTicket: any) => {
    if (!specialist) return;
    try {
      setStartingTicket(true);
      const res = await fetch("/api/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SEAT_NOW",
          ticketId: waitingTicket.id,
          specialistId: specialist.id,
        }),
      });

      const data = await res.json();
      if (data.success && data.ticket) {
        setActiveTicket(data.ticket);
        fetchChairData();
        notify("success", `تم إجلاس العميل (${waitingTicket.customerName}) على كرسيك وبدء الجلسة 💺✨`);
      } else {
        notify("error", data.error || "فشل إجلاس العميل");
      }
    } catch {
      notify("error", "تعذر الاتصال بالخادم");
    } finally {
      setStartingTicket(false);
    }
  };

  // Add Service To Active Ticket (One-Tap!)
  const handleAddService = async (service: any) => {
    if (!activeTicket) return;
    try {
      setActionLoading(true);
      const res = await fetch("/api/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: activeTicket.id,
          action: "ADD_SERVICE",
          serviceId: service.id,
          nameAr: service.nameAr,
          price: service.price,
        }),
      });

      const data = await res.json();
      if (data.success && data.ticket) {
        setActiveTicket(data.ticket);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Add Royal Offer / Package To Active Ticket (One-Tap!)
  const handleAddOffer = async (offer: any) => {
    if (!activeTicket) return;
    try {
      setActionLoading(true);
      const res = await fetch("/api/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: activeTicket.id,
          action: "ADD_SERVICE",
          serviceId: `offer-${offer.id}`,
          nameAr: `${offer.titleAr} (${offer.badge || "عرض خاص"}) 👑`,
          price: offer.price,
        }),
      });

      const data = await res.json();
      if (data.success && data.ticket) {
        setActiveTicket(data.ticket);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Remove Service
  const handleRemoveService = async (index: number) => {
    if (!activeTicket) return;
    try {
      setActionLoading(true);
      const res = await fetch("/api/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: activeTicket.id,
          action: "REMOVE_SERVICE",
          index,
        }),
      });

      const data = await res.json();
      if (data.success && data.ticket) {
        setActiveTicket(data.ticket);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Finish Chair Styling -> Opens Custom VIP Modal (No Native Alerts)
  const handleFinishChair = () => {
    if (!activeTicket) return;
    setShowFinishModal(true);
  };

  const executeFinishChair = async () => {
    if (!activeTicket) return;
    try {
      setActionLoading(true);
      const res = await fetch("/api/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: activeTicket.id,
          action: "FINISH_CHAIR",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowFinishModal(false);
        notify(
          "success",
          `تم تصدير تذكرة (${activeTicket.customerName}) بنجاح إلى الكاشير بإجمالي: ${activeTicket.finalAmount} ج.م! تم إخلاء الكرسي 🏁`
        );
        setActiveTicket(null);
        fetchChairData();
      } else {
        notify("error", data.error || "فشل تصدير التذكرة");
      }
    } catch {
      notify("error", "تعذر الاتصال بالخادم، يرجى إعادة المحاولة");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("basha_staff_user");
    localStorage.removeItem("saddam_staff_user");
    router.push("/login");
  };

  // Parse active ticket services
  let ticketServices: any[] = [];
  try {
    ticketServices =
      typeof activeTicket?.services === "string"
        ? JSON.parse(activeTicket.services)
        : activeTicket?.services || [];
  } catch {
    ticketServices = [];
  }

  return (
    <div className="min-h-screen bg-[#0a0a0e] text-slate-100 flex flex-col font-sans" dir="rtl">
      {/* ─────────────────────────────────────────────────────────────
          1. CHAIR TOP HEADER
         ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#0f0f15]/95 backdrop-blur-md border-b border-amber-500/25 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-amber-400 bg-black shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={specialist?.photo || "/dakn-logo.jpg"}
              alt={specialist?.name || "Specialist"}
              className="w-full h-full object-cover"
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-amber-400">
                {specialist?.name || currentUser?.name || "شاشة المتخصص"}
              </h2>
              <span className="py-0.5 px-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black">
                كرسي رقم #{specialist?.chairNumber || 1}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-bold">
              {specialist?.branchName || currentUser?.branchName || "فرع حدائق القبة"}
            </p>
          </div>
        </div>

        {/* Chair Status & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {waitingLoungeTickets.length > 0 && (
            <span className="py-1 px-3 rounded-full text-xs font-black bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1 animate-pulse">
              <span>🛋️</span>
              <span>{waitingLoungeTickets.length} بالاستراحة</span>
            </span>
          )}

          <span
            className={`py-1 px-3 rounded-full text-xs font-black flex items-center gap-1.5 ${
              activeTicket
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                activeTicket ? "bg-amber-400 animate-ping" : "bg-emerald-400"
              }`}
            />
            <span>{activeTicket ? "على الكرسي 💺" : "الكرسي متاح 🟢"}</span>
          </span>

          <button
            onClick={fetchChairData}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition"
            title="تحديث البيانات"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleLogout}
            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition text-xs font-bold flex items-center gap-1"
            title="تسجيل الخروج"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">خروج</span>
          </button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN CHAIR WORKSPACE
         ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* If NO active ticket: Empty Chair screen */}
        {!activeTicket ? (
          <div className="space-y-6 animate-fade-in">
            {/* Big Welcoming Banner */}
            <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-[#161620] to-[#0e0e14] border-2 border-dashed border-amber-500/30 text-center space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border-2 border-amber-400/40 text-amber-400 flex items-center justify-center mx-auto text-3xl font-black shadow-lg">
                💺
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 py-1 px-3 rounded-full border border-amber-500/20 inline-block">
                  {specialist ? `${specialist.name} • كرسي رقم #${specialist.chairNumber} (${specialist.branch?.name || "الفرع"})` : "الكرسي متاح"}
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white pt-1">
                  الكرسي جاهز ومتاح لاستقبال الزبون القادم 👑
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 font-medium max-w-lg mx-auto leading-relaxed">
                  يقوم الكاشير أو الإدارة بتوجيه العميل إلى كرسيك مباشرة من شاشة الكاشير، وستظهر التذكرة وبيانات العميل هنا فوراً دون الحاجة للكتابة.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setShowWalkInModal(true)}
                  className="py-2.5 px-6 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-bold text-xs transition flex items-center gap-2 border border-white/10"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>إجلاس عميل يدوي مباشر (اختياري) ✂️</span>
                </button>
              </div>
            </div>

            {/* Waiting Lounge Queue for this Specialist */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <span className="text-lg">🛋️</span>
                  <span>زبائن بانتظارك في صالة الاستراحة ({waitingLoungeTickets.length} زبائن)</span>
                </h4>
                {waitingLoungeTickets.length > 0 && (
                  <span className="text-[11px] text-amber-300 font-bold animate-pulse">
                    ⚡ يمكنك إجلاس الزبون التالي فوراً
                  </span>
                )}
              </div>

              {waitingLoungeTickets.length === 0 ? (
                <div className="p-5 rounded-2xl bg-[#121218] border border-white/5 text-center text-xs text-slate-500 font-bold">
                  لا يوجد زبائن بانتظارك في صالة الاستراحة حالياً.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {waitingLoungeTickets.map((wt) => {
                    const waitMin = Math.max(1, Math.round((Date.now() - new Date(wt.createdAt).getTime()) / 60000));
                    const isSpecific = !wt.notes?.includes("أول كابتن");

                    return (
                      <div
                        key={wt.id}
                        className="p-4 rounded-2xl bg-gradient-to-b from-[#181824] to-[#121218] border border-sky-500/30 space-y-3 flex flex-col justify-between shadow-lg"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs text-amber-400 font-black">
                            #{wt.ticketNumber}
                          </span>
                          <span className="py-0.5 px-2 rounded-lg bg-sky-500/10 text-sky-300 font-mono text-[10px] font-bold border border-sky-500/20">
                            ⏱️ ينتظر منذ {waitMin} د
                          </span>
                        </div>

                        <div>
                          <h5 className="font-black text-sm text-white">{wt.customerName}</h5>
                          {wt.customerPhone && (
                            <p className="text-xs text-slate-400 font-mono">{wt.customerPhone}</p>
                          )}
                          <span className="text-[10px] text-amber-300 font-bold block pt-1">
                            {isSpecific ? "👑 طلبك بالاسم شخصياً" : "⏳ في انتظار أول كابتن متاح"}
                          </span>
                        </div>

                        <button
                          onClick={() => handleAdmitWaitingClient(wt)}
                          disabled={startingTicket}
                          className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                        >
                          <Scissors className="w-3.5 h-3.5" />
                          <span>إدخال وإجلاس على الكرسي الآن 💺</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Waiting Bookings Queue */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>قائمة انتظار المواعيد اليوم ({waitingBookings.length} حجز مؤكد)</span>
                </h4>
              </div>

              {waitingBookings.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[#121218] border border-white/5 text-center text-xs text-slate-500 font-bold">
                  لا توجد حجوزات مسبقة في قائمة الانتظار حالياً.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {waitingBookings.map((bk) => (
                    <div
                      key={bk.id}
                      className="p-4 rounded-2xl bg-[#14141c] border border-amber-500/20 space-y-3 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-amber-400 font-black">
                          #{bk.bookingNumber}
                        </span>
                        <span className="py-0.5 px-2 rounded-lg bg-white/5 text-slate-300 font-mono text-[11px] font-bold">
                          {bk.timeSlot}
                        </span>
                      </div>

                      <div>
                        <h5 className="font-black text-sm text-white">{bk.customer?.name}</h5>
                        <p className="text-xs text-slate-400 font-mono">{bk.customer?.phone}</p>
                      </div>

                      <button
                        onClick={() => handleAdmitBooking(bk)}
                        disabled={startingTicket}
                        className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 disabled:opacity-50"
                      >
                        <Scissors className="w-3.5 h-3.5" />
                        <span>إجلاس العميل وبدء الحلاقة 💺</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ACTIVE TICKET IN PROGRESS ON CHAIR */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
            {/* LEFT / MAIN COLUMN: QUICK SERVICE & OFFERS TAP PAD (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <Scissors className="w-5 h-5 text-amber-400" />
                    <span>لوحة الخدمات والعروض الملكية السريعة ⚡</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    اضغط على أي خدمة أو عرض لتسجيله فوراً في حساب الكاشير 💈
                  </p>
                </div>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 border-b border-white/5 pb-2">
                {[
                  { id: "ALL", label: "جميع الخدمات 💈" },
                  { id: "OFFERS", label: `العروض الملكية 👑 (${offers.length})` },
                  { id: "HAIR", label: "شعر ✂️" },
                  { id: "BEARD", label: "دقن 🧔" },
                  { id: "VIP_PACKAGES", label: "بكجات VIP 👑" },
                  { id: "SKIN_CARE", label: "عناية وتنظيف البشرة 🔥" },
                  { id: "COLOR_KERATIN", label: "فرد وصبغة وبروتين 💆" },
                  { id: "KIDS", label: "أطفال 👶" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold transition ${
                      selectedCategory === cat.id
                        ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20"
                        : "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Royal Offers Grid */}
              {selectedCategory === "OFFERS" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
                  {offers.map((offer) => (
                    <button
                      key={offer.id}
                      onClick={() => handleAddOffer(offer)}
                      disabled={actionLoading}
                      className="p-3.5 rounded-2xl bg-[#14141e] hover:bg-amber-500/15 border-2 border-amber-500/30 hover:border-amber-400 transition text-right flex items-center gap-3 group active:scale-95 disabled:opacity-50 shadow-lg"
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden border border-amber-400 bg-black shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={offer.image || "/offers/offer-vip-1000.jpg"}
                          alt={offer.titleAr}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black">
                            {offer.badge || "عرض خاص"}
                          </span>
                          <span className="font-mono text-amber-400 font-black text-sm">
                            {offer.price} ج.م
                          </span>
                        </div>
                        <h4 className="font-black text-xs text-white truncate">{offer.titleAr}</h4>
                        {offer.oldPrice && (
                          <span className="text-[10px] text-rose-400 line-through font-mono block">
                            بدلاً من {offer.oldPrice} ج
                          </span>
                        )}
                        <span className="text-[10px] text-emerald-400 font-bold block">
                          + اضغط لإضافة الباكدج للتذكرة
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Regular Services Grid */}
              {selectedCategory !== "OFFERS" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-fade-in">
                  {services
                    .filter((s) => selectedCategory === "ALL" || s.category === selectedCategory)
                    .map((srv) => (
                      <button
                        key={srv.id}
                        onClick={() => handleAddService(srv)}
                        disabled={actionLoading}
                        className="p-4 rounded-2xl bg-[#14141e] hover:bg-amber-500/15 border border-amber-500/20 hover:border-amber-400 transition text-right space-y-1.5 shadow-md flex flex-col justify-between group active:scale-95 disabled:opacity-50"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center text-xs font-bold group-hover:bg-amber-500 group-hover:text-black transition">
                            +
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold font-mono">
                            {srv.durationMinutes || 30} د
                          </span>
                        </div>

                        <div>
                          <span className="text-[9px] text-amber-300/80 font-bold block mb-0.5">
                            {srv.category}
                          </span>
                          <h4 className="font-black text-xs sm:text-sm text-white group-hover:text-amber-300 transition line-clamp-2">
                            {srv.nameAr}
                          </h4>
                        </div>

                        <span className="font-mono text-amber-400 font-black text-sm block">
                          {srv.price} ج.م
                        </span>
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: CURRENT CLIENT IN-CHAIR INVOICE (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="p-5 rounded-3xl bg-[#14141e] border-2 border-amber-500/40 shadow-xl space-y-4">
                {/* Active Client Info */}
                <div className="border-b border-white/10 pb-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-amber-400 font-mono font-black uppercase">
                      تذكرة #{activeTicket.ticketNumber}
                    </span>
                    <h4 className="text-base font-black text-white">{activeTicket.customerName}</h4>
                    {activeTicket.customerPhone && (
                      <p className="text-xs text-slate-400 font-mono">{activeTicket.customerPhone}</p>
                    )}
                  </div>

                  {/* Elapsed Timer Badge */}
                  <div className="text-center p-2 rounded-xl bg-black/60 border border-amber-500/30">
                    <span className="text-[10px] text-slate-400 block font-bold">الوقت</span>
                    <strong className="text-sm font-mono text-amber-400 font-black">
                      {elapsedMinutes} د
                    </strong>
                  </div>
                </div>

                {/* Services List Recorded on Chair */}
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  <p className="text-xs font-bold text-slate-400">
                    الخدمات المنفذة ({ticketServices.length}):
                  </p>

                  {ticketServices.length === 0 ? (
                    <p className="text-center py-6 text-xs text-slate-500 font-bold">
                      اضغط على الخدمات من اللوحة لإضافتها ✂️
                    </p>
                  ) : (
                    ticketServices.map((it, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-white">{it.nameAr}</p>
                          <span className="text-[10px] text-slate-500 font-mono">{it.addedAt}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-400">{it.price} ج</span>
                          <button
                            onClick={() => handleRemoveService(idx)}
                            disabled={actionLoading}
                            className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/20 transition"
                            title="حذف الخدمة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Subtotal & Summary */}
                <div className="pt-3 border-t border-white/10 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>إجمالي الخدمات:</span>
                    <span className="font-mono text-white font-bold">
                      {activeTicket.servicesTotal} ج.م
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-black text-amber-400 pt-1 border-t border-white/5">
                    <span>المطلوب للكاشير:</span>
                    <span className="font-mono text-lg">{activeTicket.finalAmount} ج.م</span>
                  </div>
                </div>

                {/* BIG FINISH CHAIR BUTTON */}
                <button
                  onClick={handleFinishChair}
                  disabled={actionLoading || ticketServices.length === 0}
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>إنهاء الحلاقة وتصدير للحساب 🏁</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ─────────────────────────────────────────────────────────────
          3. WALK-IN CLIENT MODAL
         ───────────────────────────────────────────────────────────── */}
      {showWalkInModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-sans"
          dir="rtl"
        >
          <div className="relative w-full max-w-sm bg-[#12121a] border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setShowWalkInModal(false)}
              className="absolute left-4 top-4 p-1.5 rounded-xl text-slate-400 hover:text-white bg-white/5"
            >
              ✕
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto text-xl font-bold">
                💺
              </div>
              <h3 className="text-lg font-black text-white">استقبال زبون على الكرسي</h3>
              <p className="text-xs text-amber-200/70">
                أدخل اسم العميل لبدء تسجيل الخدمات فوراً
              </p>
            </div>

            <form onSubmit={handleStartWalkIn} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">اسم العميل:</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  placeholder="مثال: محمد علي"
                  className="w-full py-2.5 px-3.5 rounded-xl bg-black/60 border border-amber-500/30 text-xs text-white font-bold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">رقم الهاتف (اختياري):</label>
                <input
                  type="tel"
                  value={walkInPhone}
                  onChange={(e) => setWalkInPhone(e.target.value)}
                  placeholder="010XXXXXXXX"
                  className="w-full py-2.5 px-3.5 rounded-xl bg-black/60 border border-amber-500/30 text-xs text-white font-mono focus:outline-none focus:border-amber-400 text-left"
                />
              </div>

              <button
                type="submit"
                disabled={startingTicket}
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                <span>{startingTicket ? "جارٍ الفتح..." : "بدء الجلسة على الكرسي ✂️"}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. CUSTOM LUXURY FINISH CONFIRMATION MODAL (NO WINDOWS ALERTS!)
         ───────────────────────────────────────────────────────────── */}
      {showFinishModal && activeTicket && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-sans animate-fade-in"
          dir="rtl"
        >
          <div className="relative w-full max-w-md bg-gradient-to-b from-[#161622] via-[#12121a] to-[#0e0e14] border-2 border-amber-500/50 rounded-3xl p-6 shadow-2xl space-y-5 text-right">
            {/* Modal Header */}
            <div className="flex items-center gap-3.5 border-b border-amber-500/20 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-2 border-amber-400 text-amber-400 flex items-center justify-center text-xl shadow-lg shadow-amber-500/10 shrink-0">
                🏁
              </div>
              <div>
                <h3 className="text-base font-black text-white">إنهاء الحلاقة وتصدير للحساب</h3>
                <p className="text-xs text-amber-300 font-bold">مجموعة صالونات وسبا الباشا VIP 👑</p>
              </div>
            </div>

            {/* Ticket & Customer Summary Card */}
            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">العميل:</span>
                <span className="font-black text-amber-300 text-sm">{activeTicket.customerName}</span>
              </div>
              {activeTicket.customerPhone && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">الهاتف:</span>
                  <span className="font-mono text-slate-300">{activeTicket.customerPhone}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">رقم التذكرة:</span>
                <span className="font-mono font-bold text-white">#{activeTicket.ticketNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">الخدمات المنفذة:</span>
                <span className="text-slate-200 font-bold">{ticketServices.length} خدمات وبكجات</span>
              </div>
              <div className="flex justify-between items-center border-t border-white/10 pt-2.5 font-black">
                <span className="text-slate-300 text-xs">المطلوب تحصيله عند الكاشير:</span>
                <span className="font-mono text-lg text-amber-400">{activeTicket.finalAmount} ج.م</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              هل انتهيت من كافة متطلبات الحلاقة والعناية للزبون وتريد تصدير التذكرة فوراً لشاشة الكاشير للتحصيل وإعادة حالة الكرسي إلى متاح لاستقبال الزبون التالي؟
            </p>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={actionLoading}
                onClick={executeFinishChair}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <span>{actionLoading ? "جارٍ التصدير للكاشير..." : "تأكيد وتصدير للكاشير 🚀"}</span>
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setShowFinishModal(false)}
                className="py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition border border-white/10 cursor-pointer"
              >
                تراجع / استمرار الحلاقة ❌
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. LUXURY VIP FLOATING TOAST NOTIFICATION (NO WINDOWS ALERTS!)
         ───────────────────────────────────────────────────────────── */}
      {toast && (
        <div
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] sm:w-auto animate-fade-in font-sans"
          dir="rtl"
        >
          <div
            className={`py-3 px-5 rounded-2xl shadow-2xl border backdrop-blur-xl flex items-center gap-3 text-xs font-black ${
              toast.type === "success"
                ? "bg-emerald-950/90 border-emerald-500/60 text-emerald-200 shadow-emerald-950/50"
                : toast.type === "error"
                ? "bg-rose-950/90 border-rose-500/60 text-rose-200 shadow-rose-950/50"
                : "bg-amber-950/90 border-amber-500/60 text-amber-200 shadow-amber-950/50"
            }`}
          >
            <span className="text-base">
              {toast.type === "success" ? "✅" : toast.type === "error" ? "⚠️" : "ℹ️"}
            </span>
            <span className="flex-1 leading-relaxed">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
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
