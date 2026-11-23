"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PushOptInButton } from "@/components/PwaBootAndPushButton";
import PwaInstallButton from "@/components/PwaInstallButton";
import { computeBookingTiming, getCairoNow } from "@/lib/booking-time";
import {
  Scissors,
  Clock,
  Users,
  Plus,
  Trash2,
  RefreshCw,
  LogOut,
  CheckCircle2,
  Calendar,
  MessageSquare,
  Send,
  Search,
  Sparkles,
  ArrowRightLeft,
  UserCheck,
  Armchair,
  Bell,
  Phone,
  X,
  Play,
  Flag,
} from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  ALL: "الكل 💈",
  OFFERS: "العروض الملكية 👑",
  HAIR: "شعر ✂️",
  BEARD: "دقن 🧔",
  VIP_PACKAGES: "بكجات VIP 👑",
  SKIN_CARE: "عناية وبشرة 🔥",
  COLOR_KERATIN: "صبغة وبروتين 💆",
  KIDS: "أطفال 👶",
};

const TIME_SLOTS = [
  "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
  "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
  "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM", "08:30 PM",
  "09:00 PM", "09:30 PM", "10:00 PM", "10:30 PM", "11:00 PM", "11:30 PM",
  "12:00 AM", "12:30 AM", "01:00 AM", "01:30 AM",
];

function parseJsonArray(val: any): any[] {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function getStatusBadge(status: string, hasActiveTicket: boolean) {
  if (hasActiveTicket || status === "WITH_CLIENT") {
    return { label: "معاه عميل على الكرسي 🔴", cls: "bg-amber-500/20 text-amber-300 border-amber-500/40" };
  }
  switch (status) {
    case "AVAILABLE":
      return { label: "فاضي ومتاح الآن 🟢", cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" };
    case "BREAK":
      return { label: "في استراحة ☕", cls: "bg-sky-500/20 text-sky-300 border-sky-500/40" };
    case "OFF_DUTY":
      return { label: "انتهت الوردية 🏠", cls: "bg-slate-700/60 text-slate-300 border-slate-500/40" };
    case "DAY_OFF":
      return { label: "إجازة 🏖️", cls: "bg-purple-500/20 text-purple-300 border-purple-500/40" };
    case "ABSENT":
      return { label: "غائب 🔴", cls: "bg-rose-500/20 text-rose-300 border-rose-500/40" };
    default:
      return { label: status, cls: "bg-white/10 text-slate-300 border-white/15" };
  }
}

export default function CoordinatorControlPage() {
  const router = useRouter();

  // Auth & Branch
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("ALL");

  // Live Core Data
  const [specialists, setSpecialists] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Navigation
  const [chairFilter, setChairFilter] = useState<"ALL" | "AVAILABLE" | "BUSY" | "AWAY">("ALL");
  const [routerTab, setRouterTab] = useState<"WAITING" | "BOOKINGS" | "CHAT">("WAITING");
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>("ALL");
  const [bookingDateScope, setBookingDateScope] = useState<"TODAY" | "ALL">("ALL");

  // Open Specialist Chair Workspace Modal (by Specialist ID)
  const [openedSpecialistId, setOpenedSpecialistId] = useState<string | null>(null);
  const [chairTab, setChairTab] = useState<"WAITING" | "BOOKINGS" | "WALKIN">("WAITING");
  const [chairCat, setChairCat] = useState<string>("ALL");
  const [chairSearch, setChairSearch] = useState<string>("");
  const [switchTargetSpecId, setSwitchTargetSpecId] = useState<string>("");
  const [confirmingFinishId, setConfirmingFinishId] = useState<string | null>(null);

  // Direct Walk-in inside Opened Chair Modal
  const [chairWalkInName, setChairWalkInName] = useState("");
  const [chairWalkInPhone, setChairWalkInPhone] = useState("");
  const [chairWalkInServices, setChairWalkInServices] = useState<any[]>([]);
  const [chairWalkInCategory, setChairWalkInCategory] = useState<string>("ALL");

  // Global Reception / Walk-in Router Modal
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInBranchId, setWalkInBranchId] = useState("");
  const [walkInName, setWalkInName] = useState("");
  const [walkInPhone, setWalkInPhone] = useState("");
  const [walkInRouteType, setWalkInRouteType] = useState<"FIRST_AVAILABLE" | "SPECIFIC">("FIRST_AVAILABLE");
  const [walkInSpecId, setWalkInSpecId] = useState("");
  const [walkInSelectedItems, setWalkInSelectedItems] = useState<any[]>([]);
  const [walkInServiceSearch, setWalkInServiceSearch] = useState("");
  const [walkInCategory, setWalkInCategory] = useState<string>("ALL");
  const [submittingWalkIn, setSubmittingWalkIn] = useState(false);

  // Seat Picker Modal (for Waiting Ticket or Arrived Online Booking)
  const [seatPickerTarget, setSeatPickerTarget] = useState<{
    type: "WAITING_TICKET" | "BOOKING";
    record: any;
  } | null>(null);

  // Edit Services of Waiting Ticket Modal
  const [editingWaitingTicketId, setEditingWaitingTicketId] = useState<string | null>(null);
  const [waitingEditCategory, setWaitingEditCategory] = useState<string>("ALL");

  // Watchdog Alerts (15-min pre-alert, Missed yesterday/today, 5-min late + busy)
  const [watchdogAlerts, setWatchdogAlerts] = useState<{
    upcomingAlerts: any[];
    overdueAlerts: any[];
    late5MinAlerts: any[];
    reminderLeadMinutes: number;
  }>({ upcomingAlerts: [], overdueAlerts: [], late5MinAlerts: [], reminderLeadMinutes: 15 });
  const prevWatchdogRef = useRef<number | null>(null);

  // Booking Schedule / Assign Specialist Modal
  const [editingBooking, setEditingBooking] = useState<any>(null);
  const [bookingForm, setBookingForm] = useState({
    bookingDate: "",
    timeSlot: "06:00 PM",
    specialistId: "",
    status: "CONFIRMED",
    notes: "",
    notifyCustomer: true,
  });

  // Shift Attendance Modal
  const [showShiftModal, setShowShiftModal] = useState(false);

  // Live Chat State
  const [chatConversations, setChatConversations] = useState<any[]>([]);
  const [activeChatCustomer, setActiveChatCustomer] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatReplyText, setChatReplyText] = useState("");
  const [chatSending, setChatSending] = useState(false);

  // Action Loading & Toast
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const prevPendingCountRef = useRef<number | null>(null);
  const prevUnreadChatRef = useRef<number | null>(null);

  const notify = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  const playChime = () => {
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return;
      if (!audioCtxRef.current) audioCtxRef.current = new AC();
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();
      const now = ctx.currentTime;
      [
        [784, 0],
        [1046.5, 0.16],
      ].forEach(([freq, delay]) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.3, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.28);
      });
    } catch {}
  };

  // Auth Guard
  useEffect(() => {
    try {
      const saved = localStorage.getItem("basha_staff_user") || localStorage.getItem("saddam_staff_user");
      if (!saved) {
        router.push("/login");
        return;
      }
      const user = JSON.parse(saved);
      if (
        user.role !== "coordinator" &&
        user.role !== "manager" &&
        user.role !== "general_manager" &&
        user.role !== "owner"
      ) {
        router.push("/login");
        return;
      }
      // كل منسق فرع أو مدير فرع لازم يكون مربوط بفرع محدد (إدارة كل الفروع للمالك والمدير العام فقط)
      if ((user.role === "coordinator" || user.role === "manager") && !user.branchId) {
        router.push("/login");
        return;
      }
      setCurrentUser(user);
      if (user.branchId) {
        setSelectedBranchId(user.branchId);
      } else {
        setSelectedBranchId("ALL");
      }
    } catch {
      router.push("/login");
    }
  }, [router]);

  const fetchAll = async (silent = true) => {
    if (!currentUser) return;
    if (!silent) setLoading(true);
    try {
      const bQuery = selectedBranchId || "ALL";
      const [resB, resSpec, resT, resBk, resS, resO, resChat, resCust, resWatch] = await Promise.all([
        fetch("/api/branches", { cache: "no-store" }),
        fetch(`/api/specialists?activeOnly=true&branchId=${bQuery}`, { cache: "no-store" }),
        fetch(`/api/tickets?activeOnly=true&branchId=${bQuery}`, { cache: "no-store" }),
        fetch(`/api/bookings?branchId=${bQuery}`, { cache: "no-store" }),
        fetch(`/api/services?branchId=${bQuery}`, { cache: "no-store" }),
        fetch(`/api/offers?activeOnly=true&branchId=${bQuery}`, { cache: "no-store" }),
        fetch(`/api/chat?branchId=${bQuery}`, { cache: "no-store" }),
        fetch(`/api/customers?branchId=${encodeURIComponent(bQuery)}`, { cache: "no-store" }),
        fetch(`/api/bookings/watchdog?branchId=${bQuery}`, { cache: "no-store" }),
      ]);

      const [dataB, dataSpec, dataT, dataBk, dataS, dataO, dataChat, dataCust, dataWatch] = await Promise.all([
        resB.json(),
        resSpec.json(),
        resT.json(),
        resBk.json(),
        resS.json(),
        resO.json(),
        resChat.json(),
        resCust.json(),
        resWatch.json().catch(() => ({ success: false })),
      ]);

      if (dataB.success && dataB.branches) setBranches(dataB.branches);
      if (dataSpec.success && dataSpec.specialists) setSpecialists(dataSpec.specialists);
      if (dataT.success && dataT.tickets) setTickets(dataT.tickets);
      if (dataBk.success && dataBk.bookings) {
        setBookings(dataBk.bookings);
        const pendingCnt = dataBk.bookings.filter((b: any) => b.status === "PENDING").length;
        if (prevPendingCountRef.current !== null && pendingCnt > prevPendingCountRef.current) {
          playChime();
          notify("info", "🔔 وصل حجز أونلاين جديد بانتظار التنسيق!");
        }
        prevPendingCountRef.current = pendingCnt;
      }
      if (dataS.success && dataS.services) setServices(dataS.services);
      if (dataO.success && dataO.offers) setOffers(dataO.offers);
      if (dataCust.success && dataCust.customers) setCustomers(dataCust.customers);
      if (dataChat.success && dataChat.conversations) {
        setChatConversations(dataChat.conversations);
        const unread = dataChat.conversations.reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0);
        if (prevUnreadChatRef.current !== null && unread > prevUnreadChatRef.current) {
          playChime();
          notify("info", "💬 وصلت رسالة جديدة من عميل في الشات!");
        }
        prevUnreadChatRef.current = unread;
      }
      if (dataWatch?.success) {
        const up = dataWatch.upcomingAlerts || [];
        const ov = dataWatch.overdueAlerts || [];
        setWatchdogAlerts({
          upcomingAlerts: up,
          overdueAlerts: ov,
          late5MinAlerts: dataWatch.late5MinAlerts || [],
          reminderLeadMinutes: dataWatch.reminderLeadMinutes || 15,
        });
        const totalAlerts = up.length + ov.length;
        if (prevWatchdogRef.current !== null && totalAlerts > prevWatchdogRef.current) {
          playChime();
          notify("info", `⏰ تنبيه رادار المواعيد: ${ov.length} متأخر/فائت • ${up.length} يقترب خلال 15 دقيقة`);
        }
        prevWatchdogRef.current = totalAlerts;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    fetchAll(false);
    const timer = setInterval(() => fetchAll(true), 4000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, selectedBranchId]);

  // Fetch messages for selected chat customer
  const fetchChatMessages = async (cust: any) => {
    if (!cust) return;
    try {
      const qs = cust.customerPhone
        ? `customerPhone=${encodeURIComponent(cust.customerPhone)}`
        : `customerId=${encodeURIComponent(cust.customerId || "")}`;
      const res = await fetch(`/api/chat?${qs}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success && data.messages) setChatMessages(data.messages);

      // Mark as read
      await fetch("/api/chat", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerPhone: cust.customerPhone,
          customerId: cust.customerId,
        }),
      });
    } catch {}
  };

  useEffect(() => {
    if (routerTab === "CHAT" && activeChatCustomer) {
      fetchChatMessages(activeChatCustomer);
      const t = setInterval(() => fetchChatMessages(activeChatCustomer), 4000);
      return () => clearInterval(t);
    }
  }, [routerTab, activeChatCustomer]);

  // Computed Queues & Maps
  const waitingTickets = useMemo(() => tickets.filter((t) => t.status === "WAITING"), [tickets]);
  const inChairTickets = useMemo(() => tickets.filter((t) => t.status === "IN_CHAIR"), [tickets]);
  const readyForCashierTickets = useMemo(() => tickets.filter((t) => t.status === "READY_FOR_CASHIER"), [tickets]);

  const activeTicketBySpecId = useMemo(() => {
    const map = new Map<string, any>();
    for (const t of inChairTickets) {
      if (t.specialistId) map.set(t.specialistId, t);
    }
    return map;
  }, [inChairTickets]);

  const availableSpecialists = useMemo(
    () => specialists.filter((s) => s.status === "AVAILABLE" && !activeTicketBySpecId.has(s.id)),
    [specialists, activeTicketBySpecId]
  );

  const busySpecialists = useMemo(
    () => specialists.filter((s) => s.status === "WITH_CLIENT" || activeTicketBySpecId.has(s.id)),
    [specialists, activeTicketBySpecId]
  );

  const pendingBookingsCount = useMemo(
    () => bookings.filter((b) => b.status === "PENDING").length,
    [bookings]
  );

  const unreadChatTotal = useMemo(
    () => chatConversations.reduce((s, c) => s + (c.unreadCount || 0), 0),
    [chatConversations]
  );

  // Smart Router Match Alerts: Waiting clients whose desired specialist or ANY specialist is now free!
  const routerReadyMatches = useMemo(() => {
    const matches: { ticket: any; specialist: any }[] = [];
    for (const wt of waitingTickets) {
      const isFirstAvailable = wt.notes?.includes("أول كابتن") || wt.notes?.includes("أقرب كرسي");
      if (isFirstAvailable) {
        const freeInBranch = availableSpecialists.find((s) => s.branchId === wt.branchId);
        if (freeInBranch) matches.push({ ticket: wt, specialist: freeInBranch });
      } else {
        const target = availableSpecialists.find((s) => s.id === wt.specialistId);
        if (target) matches.push({ ticket: wt, specialist: target });
      }
    }
    return matches;
  }, [waitingTickets, availableSpecialists]);

  const filteredSpecialists = useMemo(() => {
    return specialists.filter((s) => {
      const isBusy = s.status === "WITH_CLIENT" || activeTicketBySpecId.has(s.id);
      const isAvail = s.status === "AVAILABLE" && !activeTicketBySpecId.has(s.id);
      if (chairFilter === "AVAILABLE") return isAvail;
      if (chairFilter === "BUSY") return isBusy;
      if (chairFilter === "AWAY") return !isAvail && !isBusy;
      return true;
    });
  }, [specialists, chairFilter, activeTicketBySpecId]);

  const todayStr = getCairoNow().dateStr;

  const getCombinedCatalogItems = (branchId?: string) => {
    const branchOffers = offers
      .filter((o) => o.isActive !== false && (!branchId || branchId === "ALL" || !o.branchId || o.branchId === branchId))
      .map((o) => ({
        id: `offer-${o.id}`,
        nameAr: o.badge ? `${o.titleAr} (${o.badge})` : o.titleAr,
        price: Number(o.price || 0),
        category: "OFFERS",
        isOffer: true,
      }));
    const branchServices = services
      .filter((s) => s.isActive !== false && (!branchId || branchId === "ALL" || !s.branchId || s.branchId === branchId))
      .map((s) => ({ ...s, isOffer: false }));
    return [...branchOffers, ...branchServices];
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (bookingDateScope === "TODAY" && b.bookingDate !== todayStr) return false;
      if (bookingStatusFilter !== "ALL" && b.status !== bookingStatusFilter) return false;
      return true;
    });
  }, [bookings, bookingStatusFilter, bookingDateScope, todayStr]);

  // Opened specialist objects
  const openedSpecialist = useMemo(
    () => specialists.find((s) => s.id === openedSpecialistId) || null,
    [specialists, openedSpecialistId]
  );
  const openedActiveTicket = useMemo(
    () => (openedSpecialist ? activeTicketBySpecId.get(openedSpecialist.id) || null : null),
    [openedSpecialist, activeTicketBySpecId]
  );
  const editingWaitingTicket = useMemo(
    () => waitingTickets.find((t) => t.id === editingWaitingTicketId) || null,
    [waitingTickets, editingWaitingTicketId]
  );

  // Customer auto-suggest for Walk-in Phone/Name
  const matchedCustomerHint = useMemo(() => {
    const ph = walkInPhone.trim().replace(/\s+/g, "");
    if (ph.length < 6) return null;
    return customers.find((c) => c.phone?.includes(ph)) || null;
  }, [walkInPhone, customers]);

  // ─────────────────────────────────────────────────────────────
  // ACTIONS: TICKET / CHAIR OPERATIONS
  // ─────────────────────────────────────────────────────────────

  const handleQuickShiftStatus = async (specId: string, status: string, reason: string) => {
    try {
      setActionLoading(true);
      const res = await fetch("/api/specialists", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: specId, status, statusReason: reason }),
      });
      const data = await res.json();
      if (data.success) {
        notify("success", `تم تحديث حالة الكابتن إلى (${reason}) ✓`);
        await fetchAll(true);
      } else {
        notify("error", data.error || "فشل تحديث الحالة");
      }
    } catch {
      notify("error", "تعذر الاتصال بالخادم");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddServiceToTicket = async (ticketId: string, item: { id: string; nameAr: string; price: number }) => {
    try {
      setActionLoading(true);
      const res = await fetch("/api/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId,
          action: "ADD_SERVICE",
          serviceId: item.id,
          nameAr: item.nameAr,
          price: item.price,
        }),
      });
      const data = await res.json();
      if (data.success && data.ticket) {
        setTickets((prev) => prev.map((t) => (t.id === ticketId ? data.ticket : t)));
        notify("success", `تمت إضافة (${item.nameAr}) للشيك ✂️`);
      } else {
        notify("error", data.error || "فشل إضافة الخدمة");
      }
    } catch {
      notify("error", "تعذر الاتصال بالخادم");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveServiceFromTicket = async (ticketId: string, index: number) => {
    try {
      setActionLoading(true);
      const res = await fetch("/api/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId,
          action: "REMOVE_SERVICE",
          index,
        }),
      });
      const data = await res.json();
      if (data.success && data.ticket) {
        setTickets((prev) => prev.map((t) => (t.id === ticketId ? data.ticket : t)));
        notify("info", "تم حذف الخدمة من الشيك");
      }
    } catch {
      notify("error", "تعذر الاتصال بالخادم");
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinishChairTicket = async (ticket: any) => {
    try {
      setActionLoading(true);
      const res = await fetch("/api/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: ticket.id,
          action: "FINISH_CHAIR",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setConfirmingFinishId(null);
        notify("success", `🏁 تم إنهاء جلسة (${ticket.customerName}) وإرسال الشيك للكاشير (${ticket.finalAmount} ج.م) — الكرسي متاح الآن 🟢`);
        await fetchAll(true);
      } else {
        notify("error", data.error || "فشل إنهاء التذكرة");
      }
    } catch {
      notify("error", "تعذر الاتصال بالخادم");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSwitchSpecialist = async (ticketId: string, targetSpecialistId: string) => {
    if (!targetSpecialistId) return;
    try {
      setActionLoading(true);
      const res = await fetch("/api/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId,
          action: "SWITCH_SPECIALIST",
          targetSpecialistId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSwitchTargetSpecId("");
        setOpenedSpecialistId(targetSpecialistId);
        notify("success", "تم نقل العميل والشيك إلى الكرسي الجديد بنجاح 🔄");
        await fetchAll(true);
      } else {
        notify("error", data.error || "فشل النقل");
      }
    } catch {
      notify("error", "تعذر الاتصال بالخادم");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSeatWaitingTicket = async (waitingTicket: any, specialistId: string) => {
    try {
      setActionLoading(true);
      const res = await fetch("/api/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SEAT_NOW",
          ticketId: waitingTicket.id,
          specialistId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSeatPickerTarget(null);
        notify("success", `💺 تم إجلاس (${waitingTicket.customerName}) على الكرسي وبدء الجلسة الآن!`);
        await fetchAll(true);
      } else {
        notify("error", data.error || "فشل إجلاس العميل");
      }
    } catch {
      notify("error", "تعذر الاتصال بالخادم");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelWaitingTicket = async (ticket: any) => {
    try {
      setActionLoading(true);
      const res = await fetch("/api/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CANCEL_WAITING", ticketId: ticket.id }),
      });
      const data = await res.json();
      if (data.success) {
        notify("info", `تم إلغاء انتظار (${ticket.customerName})`);
        await fetchAll(true);
      }
    } catch {
      notify("error", "تعذر الإلغاء");
    } finally {
      setActionLoading(false);
    }
  };

  // Start direct Walk-in inside an opened Available Chair
  const handleStartWalkInOnOpenedChair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!openedSpecialist || !chairWalkInName.trim()) {
      notify("error", "يرجى إدخال اسم العميل");
      return;
    }
    try {
      setActionLoading(true);
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          specialistId: openedSpecialist.id,
          branchId: openedSpecialist.branchId,
          customerName: chairWalkInName.trim(),
          customerPhone: chairWalkInPhone.trim() || null,
          initialServices: chairWalkInServices.map((s) => ({
            id: s.id,
            nameAr: s.nameAr,
            price: s.price,
            addedAt: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
          })),
          status: "IN_CHAIR",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setChairWalkInName("");
        setChairWalkInPhone("");
        setChairWalkInServices([]);
        notify("success", `▶️ تم بدء الجلسة للعميل (${data.ticket.customerName}) على كرسي ${openedSpecialist.name}!`);
        await fetchAll(true);
      } else {
        notify("error", data.error || "فشل بدء الجلسة");
      }
    } catch {
      notify("error", "تعذر الاتصال بالخادم");
    } finally {
      setActionLoading(false);
    }
  };

  // Global Walk-in Router Modal Submit
  const handleSubmitWalkInRouter = async (mode: "IN_CHAIR" | "WAITING") => {
    if (!walkInName.trim()) {
      notify("error", "يرجى إدخال اسم العميل");
      return;
    }
    const isBranchLocked = Boolean(
      currentUser?.branchId &&
        currentUser?.role !== "owner" &&
        currentUser?.role !== "general_manager"
    );
    const targetBranchId = isBranchLocked
      ? currentUser.branchId
      : walkInBranchId || (selectedBranchId !== "ALL" ? selectedBranchId : branches[0]?.id);
    if (!targetBranchId) {
      notify("error", "يرجى تحديد الفرع");
      return;
    }

    const branchSpecs = specialists.filter((s) => s.branchId === targetBranchId);
    const freeBranchSpec = branchSpecs.find((s) => s.status === "AVAILABLE" && !activeTicketBySpecId.has(s.id));

    let chosenSpec: any = null;
    if (walkInRouteType === "FIRST_AVAILABLE") {
      chosenSpec = freeBranchSpec || branchSpecs[0];
    } else {
      chosenSpec = branchSpecs.find((s) => s.id === walkInSpecId) || branchSpecs[0];
    }

    if (!chosenSpec) {
      notify("error", "لا يوجد متخصصين مسجلين في هذا الفرع");
      return;
    }

    const isChosenFree = chosenSpec.status === "AVAILABLE" && !activeTicketBySpecId.has(chosenSpec.id);
    const finalStatus = mode === "IN_CHAIR" && isChosenFree ? "IN_CHAIR" : "WAITING";

    const preparedServices = walkInSelectedItems.map((it) => ({
      id: it.id,
      nameAr: it.nameAr,
      price: it.price,
      addedAt: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
    }));

    try {
      setSubmittingWalkIn(true);
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          specialistId: chosenSpec.id,
          branchId: targetBranchId,
          customerName: walkInName.trim(),
          customerPhone: walkInPhone.trim() || null,
          initialServices: preparedServices,
          status: finalStatus,
          waitingMode: walkInRouteType === "FIRST_AVAILABLE" ? "FIRST_AVAILABLE" : "SPECIFIC_SPECIALIST",
          notes:
            finalStatus === "WAITING"
              ? walkInRouteType === "FIRST_AVAILABLE"
                ? "🛋️ صالة الاستراحة: في انتظار أول كابتن يفضى"
                : `🛋️ صالة الاستراحة: طلب كابتن (${chosenSpec.name}) بالاسم`
              : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowWalkInModal(false);
        setWalkInName("");
        setWalkInPhone("");
        setWalkInSelectedItems([]);
        if (finalStatus === "IN_CHAIR") {
          notify("success", `💺 تم إجلاس (${data.ticket.customerName}) وبدء الجلسة مع (${chosenSpec.name}) فوراً!`);
        } else {
          notify("info", `🛋️ تم تسجيل (${data.ticket.customerName}) في صالة الانتظار بنجاح`);
        }
        await fetchAll(true);
      } else {
        notify("error", data.error || "فشل تسجيل العميل");
      }
    } catch {
      notify("error", "تعذر الاتصال بالخادم");
    } finally {
      setSubmittingWalkIn(false);
    }
  };

  // Seat or Queue an Online Booking
  const handleRouteBookingToFloor = async (
    booking: any,
    specialistId: string,
    mode: "IN_CHAIR" | "WAITING"
  ) => {
    const spec = specialists.find((s) => s.id === specialistId);
    if (!spec) {
      notify("error", "يرجى اختيار متخصص صالح");
      return;
    }
    const bookedServices = parseJsonArray(booking.serviceIds).map((s: any) => ({
      id: s.id,
      nameAr: s.nameAr || s.titleAr,
      price: Number(s.price || 0),
      addedAt: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
    }));

    try {
      setActionLoading(true);
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          specialistId: spec.id,
          branchId: booking.branchId,
          customerId: booking.customerId,
          customerName: booking.customer?.name || "عميل حجز",
          customerPhone: booking.customer?.phone || null,
          bookingId: booking.id,
          initialServices: bookedServices,
          status: mode,
          waitingMode: booking.specialistId ? "SPECIFIC_SPECIALIST" : "FIRST_AVAILABLE",
          notes:
            mode === "WAITING"
              ? booking.specialistId
                ? `🛋️ حجز #${booking.bookingNumber}: بانتظار (${spec.name})`
                : `🛋️ حجز #${booking.bookingNumber}: أول كرسي يفضى`
              : `📅 من حجز أونلاين #${booking.bookingNumber}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSeatPickerTarget(null);
        notify(
          "success",
          mode === "IN_CHAIR"
            ? `💺 تم إجلاس صاحب الحجز (${booking.customer?.name}) على كرسي (${spec.name})!`
            : `🛋️ تم إدراج الحجز (${booking.customer?.name}) في صالة الاستراحة`
        );
        await fetchAll(true);
      } else {
        notify("error", data.error || "فشل تحويل الحجز");
      }
    } catch {
      notify("error", "تعذر الاتصال بالخادم");
    } finally {
      setActionLoading(false);
    }
  };

  // Booking Confirmation / Reschedule / Assign Specialist
  const handleQuickConfirmBooking = async (booking: any) => {
    try {
      setActionLoading(true);
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: booking.id,
          status: "CONFIRMED",
          notifyCustomer: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        notify("success", `✅ تم تأكيد حجز (${booking.customer?.name}) وإرسال إشعار له في الشات`);
        await fetchAll(true);
      }
    } catch {
      notify("error", "تعذر تحديث الحجز");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEditBooking = (bk: any) => {
    setEditingBooking(bk);
    setBookingForm({
      bookingDate: bk.bookingDate || todayStr,
      timeSlot: bk.timeSlot || "06:00 PM",
      specialistId: bk.specialistId || "",
      status: bk.status === "PENDING" ? "CONFIRMED" : bk.status,
      notes: bk.notes || "تم تنسيق وتأكيد الموعد في صالونات وسبا الباشا 👑",
      notifyCustomer: true,
    });
  };

  const handleSaveBookingSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;
    try {
      setActionLoading(true);
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingBooking.id,
          status: bookingForm.status,
          bookingDate: bookingForm.bookingDate,
          timeSlot: bookingForm.timeSlot,
          specialistId: bookingForm.specialistId || null,
          notes: bookingForm.notes,
          notifyCustomer: bookingForm.notifyCustomer,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingBooking(null);
        notify("success", "تم حفظ تنسيق الموعد والمتخصص بنجاح 📅");
        await fetchAll(true);
      } else {
        notify("error", data.error || "فشل الحفظ");
      }
    } catch {
      notify("error", "تعذر الاتصال بالخادم");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelBooking = async (bk: any) => {
    try {
      setActionLoading(true);
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: bk.id,
          status: "CANCELLED",
          notifyCustomer: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        notify("info", `تم إلغاء الحجز #${bk.bookingNumber} وإبلاغ العميل`);
        await fetchAll(true);
      }
    } catch {
      notify("error", "تعذر الإلغاء");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLateFirstAvailableBooking = async (bkOrAlert: any) => {
    try {
      setActionLoading(true);
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: bkOrAlert.id,
          action: "LATE_FIRST_AVAILABLE",
        }),
      });
      const data = await res.json();
      if (data.success) {
        notify("success", `⚡ تم ترحيل حجز (#${bkOrAlert.bookingNumber}) إلى أول كرسي يفضى وإبلاغ العميل!`);
        await fetchAll(true);
      } else {
        notify("error", data.error || "تعذر ترحيل الموعد");
      }
    } catch {
      notify("error", "تعذر الاتصال بالخادم");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetBookingToConfirmed = async (bk: any) => {
    try {
      setActionLoading(true);
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: bk.id, status: "CONFIRMED" }),
      });
      const data = await res.json();
      if (data.success) {
        notify("info", `تمت إعادة الحجز #${bk.bookingNumber} لحالة (مؤكد) للمتابعة`);
        await fetchAll(true);
      }
    } catch {
      notify("error", "تعذر تحديث الحالة");
    } finally {
      setActionLoading(false);
    }
  };

  // Chat Reply
  const handleSendChatReply = async (customText?: string) => {
    const text = (customText ?? chatReplyText).trim();
    if (!text || !activeChatCustomer) return;
    try {
      setChatSending(true);
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: "SALON",
          senderName: `${currentUser?.name || "منسق الصالون"} 🧭`,
          message: text,
          customerId: activeChatCustomer.customerId,
          customerName: activeChatCustomer.customerName,
          customerPhone: activeChatCustomer.customerPhone,
          branchId: selectedBranchId !== "ALL" ? selectedBranchId : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (!customText) setChatReplyText("");
        await fetchChatMessages(activeChatCustomer);
        await fetchAll(true);
      }
    } catch {
      notify("error", "فشل إرسال الرسالة");
    } finally {
      setChatSending(false);
    }
  };

  const handleOpenChatForBooking = (bk: any) => {
    const conv = {
      key: bk.customer?.phone || bk.customerId,
      customerId: bk.customerId,
      customerPhone: bk.customer?.phone,
      customerName: bk.customer?.name || "عميل VIP",
    };
    setActiveChatCustomer(conv);
    setRouterTab("CHAT");
  };

  const handleLogout = () => {
    localStorage.removeItem("saddam_staff_user");
    router.push("/login");
  };

  const toggleWalkInService = (item: { id: string; nameAr: string; price: number }) => {
    setWalkInSelectedItems((prev) =>
      prev.some((p) => p.id === item.id) ? prev.filter((p) => p.id !== item.id) : [...prev, item]
    );
  };

  const toggleChairWalkInService = (item: { id: string; nameAr: string; price: number }) => {
    setChairWalkInServices((prev) =>
      prev.some((p) => p.id === item.id) ? prev.filter((p) => p.id !== item.id) : [...prev, item]
    );
  };

  const isGlobalViewer =
    !currentUser?.branchId &&
    (currentUser?.role === "owner" || currentUser?.role === "general_manager");

  const activeBranchName = useMemo(() => {
    const bId = currentUser?.branchId || (selectedBranchId !== "ALL" ? selectedBranchId : "");
    if (!bId) return "جميع الفروع";
    return branches.find((b) => b.id === bId)?.name || currentUser?.branch?.name || "الفرع التابع";
  }, [branches, currentUser, selectedBranchId]);

  return (
    <div className="min-h-screen bg-[#09090e] text-slate-100 flex flex-col font-sans" dir="rtl">
      {/* ─────────────────────────────────────────────────────────────
          1. COORDINATOR TOP CONTROL HEADER
         ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#0f0f17]/95 backdrop-blur-md border-b border-amber-500/25 px-3 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2.5 shadow-xl">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl overflow-hidden border-2 border-amber-400 bg-black shrink-0 shadow-lg shadow-amber-500/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/dakn-logo.jpg" alt="دقن الباشا وحمام الباشا" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-sm sm:text-lg font-black text-amber-400 truncate">
                {isGlobalViewer ? "غرفة المنسق والراوتر 🧭" : `منسق ${activeBranchName} 🧭`}
              </h1>
              <span className="py-0.5 px-2.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/35 text-[10px] font-black">
                📍 {activeBranchName}
              </span>
              <span className="py-0.5 px-2 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/35 text-[10px] font-black hidden sm:inline">
                تحكم مباشر بالكراسي 🟢
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-bold truncate">
              المسؤول: {currentUser?.name || "منسق الفرع"} • توجيه الزبائن، الحجوزات، وإدارة الكراسي
            </p>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-between sm:justify-end">
          {/* Branch Selector (Management Only) */}
          {isGlobalViewer && (
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="py-1.5 px-3 rounded-xl bg-[#181824] border border-amber-500/30 text-xs font-bold text-amber-300 focus:outline-none"
            >
              <option value="ALL">🏢 جميع الفروع</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  📍 {b.name}
                </option>
              ))}
            </select>
          )}

          {/* New Walk-in Reception */}
          <button
            type="button"
            onClick={() => {
              setWalkInBranchId(selectedBranchId !== "ALL" ? selectedBranchId : branches[0]?.id || "");
              setWalkInName("");
              setWalkInPhone("");
              setWalkInRouteType("FIRST_AVAILABLE");
              setWalkInSelectedItems([]);
              setWalkInServiceSearch("");
              setWalkInCategory("ALL");
              setShowWalkInModal(true);
            }}
            className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>استقبال زبون جديد 🚶‍♂️</span>
          </button>

          {/* Specialists Shift Control */}
          <button
            type="button"
            onClick={() => setShowShiftModal(true)}
            className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>حضور الكباتن ({availableSpecialists.length}/{specialists.length})</span>
          </button>

          {/* Shortcut to POS or Admin for Management */}
          {(currentUser?.role === "owner" ||
            currentUser?.role === "general_manager" ||
            currentUser?.role === "manager") && (
            <>
              <Link
                href="/pos"
                className="py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 font-bold text-xs transition"
              >
                الكاشير POS 💰
              </Link>
              <Link
                href="/admin"
                className="py-2 px-3 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/35 text-sky-300 font-bold text-xs transition hidden sm:inline"
              >
                الإدارة ⚙️
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={() => fetchAll(false)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition cursor-pointer"
            title="تحديث فوري"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <PwaInstallButton variant="compact" />

          <PushOptInButton
            role="COORDINATOR"
            branchId={selectedBranchId !== "ALL" ? selectedBranchId : currentUser?.branchId || null}
            userId={currentUser?.id}
            userName={currentUser?.name}
            compact
            showTestButton
          />

          <button
            type="button"
            onClick={handleLogout}
            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition cursor-pointer"
            title="خروج"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-[1550px] w-full mx-auto p-3 sm:p-5 space-y-5">
        {/* ─────────────────────────────────────────────────────────────
            2. LIVE KPI SUMMARY BAR
           ───────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-emerald-300 font-bold block">كراسي فاضية</span>
              <strong className="text-xl font-mono font-black text-white">{availableSpecialists.length}</strong>
            </div>
            <span className="text-2xl">🟢</span>
          </div>

          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-amber-300 font-bold block">كراسي مشغولة</span>
              <strong className="text-xl font-mono font-black text-white">{busySpecialists.length}</strong>
            </div>
            <span className="text-2xl">💺</span>
          </div>

          <button
            type="button"
            onClick={() => setRouterTab("WAITING")}
            className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-between text-right hover:bg-sky-500/20 transition cursor-pointer"
          >
            <div>
              <span className="text-[11px] text-sky-300 font-bold block">صالة الانتظار</span>
              <strong className="text-xl font-mono font-black text-white">{waitingTickets.length}</strong>
            </div>
            <span className="text-2xl">🛋️</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRouterTab("BOOKINGS");
              setBookingStatusFilter("PENDING");
            }}
            className={`p-3 rounded-2xl border flex items-center justify-between text-right transition cursor-pointer ${
              pendingBookingsCount > 0
                ? "bg-rose-500/15 border-rose-500/50 animate-pulse"
                : "bg-white/5 border-white/10 hover:bg-white/10"
            }`}
          >
            <div>
              <span className="text-[11px] text-rose-300 font-bold block">حجوزات بانتظار الرد</span>
              <strong className="text-xl font-mono font-black text-white">{pendingBookingsCount}</strong>
            </div>
            <span className="text-2xl">🔔</span>
          </button>

          <button
            type="button"
            onClick={() => setRouterTab("CHAT")}
            className={`p-3 rounded-2xl border flex items-center justify-between text-right transition cursor-pointer ${
              unreadChatTotal > 0
                ? "bg-purple-500/15 border-purple-500/50"
                : "bg-white/5 border-white/10 hover:bg-white/10"
            }`}
          >
            <div>
              <span className="text-[11px] text-purple-300 font-bold block">رسائل الشات</span>
              <strong className="text-xl font-mono font-black text-white">{unreadChatTotal}</strong>
            </div>
            <span className="text-2xl">💬</span>
          </button>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-300 font-bold block">بانتظار الكاشير</span>
              <strong className="text-xl font-mono font-black text-emerald-400">
                {readyForCashierTickets.length}
              </strong>
            </div>
            <span className="text-2xl">💰</span>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            2.5 BOOKING WATCHDOG: 15-MIN PRE-ALERT, OVERDUE & 5-MIN LATE ROUTING
           ───────────────────────────────────────────────────────────── */}
        {(watchdogAlerts.upcomingAlerts.length > 0 || watchdogAlerts.overdueAlerts.length > 0) && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-500/15 via-amber-500/10 to-rose-500/15 border-2 border-rose-500/45 shadow-lg space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-xs font-black text-rose-300">
                <Bell className="w-4 h-4 animate-bounce text-amber-400" />
                <span>
                  🚨 رادار المواعيد والتنبيهات ({watchdogAlerts.upcomingAlerts.length} قادم خلال {watchdogAlerts.reminderLeadMinutes}د •{" "}
                  {watchdogAlerts.overdueAlerts.length} متأخر / فائت)
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
              {watchdogAlerts.upcomingAlerts.map((al) => (
                <div
                  key={`up-${al.id}`}
                  className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 flex flex-wrap items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <span className="font-black text-amber-300 block">
                      ⏰ يقترب خلال {al.diffMinutes ?? 15} دقيقة • #{al.bookingNumber}
                    </span>
                    <span className="text-white font-bold">
                      {al.customerName} ({al.customerPhone}) — {al.timeSlot}
                      {al.specialistName ? ` • ✂️ ${al.specialistName}` : " • ⚡ أول كرسي يفضى"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {al.customerPhone && (
                      <a
                        href={`tel:${al.customerPhone}`}
                        className="py-1.5 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-[11px]"
                      >
                        📞 اتصال
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const found = bookings.find((b) => b.id === al.id) || al;
                        setSeatPickerTarget({ type: "BOOKING", record: found });
                      }}
                      className="py-1.5 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] cursor-pointer"
                    >
                      💺 إجلاس / انتظار
                    </button>
                  </div>
                </div>
              ))}

              {watchdogAlerts.overdueAlerts.map((al) => (
                <div
                  key={`ov-${al.id}`}
                  className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/45 flex flex-wrap items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <span className="font-black text-rose-300 block">
                      {al.isPastDay
                        ? `⚠️ موعد فائت من يوم (${al.bookingDate}) لم يُغلق`
                        : `⏳ تأخر +5د عن موعد (${al.timeSlot})${al.chairsBusy ? " • الكراسي مشغولة 🔴" : ""}`}
                      {" "}• #{al.bookingNumber}
                    </span>
                    <span className="text-white font-bold">
                      {al.customerName} ({al.customerPhone}) — {al.branchName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {al.customerPhone && (
                      <a
                        href={`tel:${al.customerPhone}`}
                        className="py-1.5 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-[11px]"
                      >
                        📞 اتصال
                      </a>
                    )}
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleLateFirstAvailableBooking(al)}
                      className="py-1.5 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] cursor-pointer"
                    >
                      ⚡ وصل متأخر ← ترحيل لأول كرسي يفضى
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const found = bookings.find((b) => b.id === al.id);
                        if (found) handleOpenEditBooking(found);
                      }}
                      className="py-1.5 px-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-bold text-[11px] cursor-pointer"
                    >
                      ⏱️ تأجيل
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCancelBooking(al)}
                      className="py-1.5 px-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-bold text-[11px] cursor-pointer"
                    >
                      إلغاء ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            3. SMART ROUTER READY MATCH ALERT (when waiting meets free chair)
           ───────────────────────────────────────────────────────────── */}
        {routerReadyMatches.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-emerald-500/10 to-teal-500/20 border-2 border-emerald-500/50 shadow-lg space-y-2">
            <div className="flex items-center gap-2 text-xs font-black text-emerald-300">
              <Bell className="w-4 h-4 animate-bounce" />
              <span>⚡ تنبيه الراوتر الفوري: كرسي فاضي وجاهز لزبون في صالة الانتظار!</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {routerReadyMatches.map(({ ticket, specialist }) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between gap-3 bg-black/50 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs flex-1 min-w-[260px]"
                >
                  <div>
                    <strong className="text-white font-black">{ticket.customerName}</strong>
                    <span className="text-slate-400 mx-1">← جاهز على كرسي #{specialist.chairNumber}:</span>
                    <strong className="text-emerald-300">{specialist.name}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSeatWaitingTicket(ticket, specialist.id)}
                    disabled={actionLoading}
                    className="py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] transition shrink-0 cursor-pointer"
                  >
                    إجلاس الآن 💺
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            4. MAIN 12-COL COORDINATOR DESK (LEFT 7: CHAIRS | RIGHT 5: ROUTER)
           ───────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          {/* SECTION A: LIVE SPECIALISTS & CHAIRS FLOOR (7 cols) */}
          <div className="xl:col-span-7 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-[#12121b] border border-white/10 rounded-2xl p-3">
              <div>
                <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <Armchair className="w-4 h-4 text-amber-400" />
                  <span>خريطة الكراسي والمتخصصين المباشرة ({filteredSpecialists.length})</span>
                </h2>
                <p className="text-[11px] text-slate-400">
                  اضغط على أي كرسي لفتح شاشة المتخصص (بدء، إضافة خدمات إضافية، أو إنهاء للكاشير)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1 text-[11px] font-bold">
                {[
                  { id: "ALL", label: "الكل" },
                  { id: "AVAILABLE", label: `فاضي 🟢 (${availableSpecialists.length})` },
                  { id: "BUSY", label: `معاه عميل 🔴 (${busySpecialists.length})` },
                  { id: "AWAY", label: "استراحة/إجازة" },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setChairFilter(f.id as any)}
                    className={`py-1 px-2.5 rounded-lg transition cursor-pointer ${
                      chairFilter === f.id
                        ? "bg-amber-500 text-slate-950 font-black"
                        : "bg-white/5 hover:bg-white/10 text-slate-300"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredSpecialists.length === 0 ? (
              <div className="p-8 rounded-3xl bg-[#12121b] border border-white/10 text-center text-xs text-slate-400 font-bold">
                لا يوجد متخصصين في هذا التصنيف حالياً
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {filteredSpecialists.map((spec) => {
                  const activeTicket = activeTicketBySpecId.get(spec.id);
                  const isBusy = Boolean(activeTicket) || spec.status === "WITH_CLIENT";
                  const isAvail = spec.status === "AVAILABLE" && !activeTicket;
                  const badge = getStatusBadge(spec.status, Boolean(activeTicket));
                  const ticketServices = activeTicket ? parseJsonArray(activeTicket.services) : [];
                  const elapsedMin = activeTicket?.startTime
                    ? Math.max(0, Math.floor((Date.now() - new Date(activeTicket.startTime).getTime()) / 60000))
                    : 0;
                  const specWaitingCount = waitingTickets.filter(
                    (wt) => wt.specialistId === spec.id && !wt.notes?.includes("أول كابتن")
                  ).length;

                  return (
                    <div
                      key={spec.id}
                      className={`rounded-3xl p-4 border-2 transition flex flex-col justify-between gap-3 shadow-lg ${
                        isAvail
                          ? "bg-gradient-to-b from-[#111d19] to-[#0e1017] border-emerald-500/45 hover:border-emerald-400"
                          : isBusy
                          ? "bg-gradient-to-b from-[#1f1710] to-[#111018] border-amber-500/50 hover:border-amber-400"
                          : "bg-[#12121a] border-white/10 opacity-80"
                      }`}
                    >
                      {/* Top: Barber Identity + Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-amber-400/70 bg-black shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={spec.photo || "/logo.jpg"}
                              alt={spec.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <h3 className="font-black text-sm text-white truncate">{spec.name}</h3>
                              <span className="py-0.5 px-1.5 rounded-md bg-amber-500/20 text-amber-300 font-mono text-[10px] font-black">
                                كرسي #{spec.chairNumber}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate">{spec.title}</p>
                            {selectedBranchId === "ALL" && spec.branchName && (
                              <span className="text-[10px] text-sky-300 font-bold block">
                                📍 {spec.branchName}
                              </span>
                            )}
                          </div>
                        </div>

                        <span className={`py-0.5 px-2 rounded-full text-[10px] font-black border shrink-0 ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </div>

                      {/* Middle: Active Ticket Info OR Free Status Info */}
                      {activeTicket ? (
                        <div className="p-3 rounded-2xl bg-black/50 border border-amber-500/25 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-amber-400 font-mono font-bold block">
                                #{activeTicket.ticketNumber}
                              </span>
                              <strong className="text-sm text-white font-black">
                                {activeTicket.customerName}
                              </strong>
                            </div>
                            <div className="text-left">
                              <span className="py-0.5 px-2 rounded-lg bg-amber-500/15 text-amber-300 font-mono text-[11px] font-black block">
                                ⏱️ {elapsedMin} د
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1.5 border-t border-white/10 text-[11px]">
                            <span className="text-slate-300">
                              {ticketServices.length} خدمات مسجلة
                            </span>
                            <strong className="font-mono text-sm text-emerald-400 font-black">
                              {activeTicket.finalAmount} ج.م
                            </strong>
                          </div>
                        </div>
                      ) : isBusy ? (
                        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-200 flex items-center justify-between">
                          <span>حالة الكرسي مضبوطة كمشغول بدون تذكرة نشطة</span>
                          <button
                            type="button"
                            onClick={() => handleQuickShiftStatus(spec.id, "AVAILABLE", "كرسي متاح")}
                            className="py-1 px-2.5 rounded-lg bg-emerald-500 text-slate-950 font-black text-[10px] cursor-pointer"
                          >
                            تحرير 🟢
                          </button>
                        </div>
                      ) : isAvail ? (
                        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between">
                          <span className="text-emerald-200 font-bold">
                            الكرسي جاهز لاستقبال العميل فوراً ✨
                          </span>
                          {specWaitingCount > 0 && (
                            <span className="py-0.5 px-2 rounded-full bg-sky-500/20 text-sky-300 font-black text-[10px]">
                              {specWaitingCount} ينتظرونه
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="p-3 rounded-2xl bg-black/40 border border-white/5 text-[11px] text-slate-400 flex items-center justify-between">
                          <span>📌 {spec.statusReason || "غير متاح حالياً"}</span>
                          <button
                            type="button"
                            onClick={() => handleQuickShiftStatus(spec.id, "AVAILABLE", "عاد للعمل ومتاح")}
                            className="py-1 px-2.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 font-black text-[10px] transition cursor-pointer"
                          >
                            تفعيل 🟢
                          </button>
                        </div>
                      )}

                      {/* Bottom Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setOpenedSpecialistId(spec.id);
                            setChairCat("ALL");
                            setChairSearch("");
                            setConfirmingFinishId(null);
                            setChairTab(waitingTickets.length > 0 ? "WAITING" : "WALKIN");
                          }}
                          className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md ${
                            activeTicket
                              ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20"
                              : isAvail
                              ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20"
                              : "bg-white/10 hover:bg-white/15 text-white"
                          }`}
                        >
                          <Scissors className="w-3.5 h-3.5" />
                          <span>
                            {activeTicket
                              ? "فتح الكرسي (إضافة خدمات / متابعة)"
                              : isAvail
                              ? "فتح الكرسي وبدء جلسة ▶️"
                              : "عرض شاشة الكرسي"}
                          </span>
                        </button>

                        {activeTicket && (
                          <button
                            type="button"
                            onClick={() => handleFinishChairTicket(activeTicket)}
                            disabled={actionLoading}
                            className="py-2.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/40 font-black text-xs transition flex items-center gap-1 cursor-pointer shrink-0"
                            title="إنهاء الجلسة وإرسال الشيك للكاشير"
                          >
                            <Flag className="w-3.5 h-3.5" />
                            <span>إنهاء 💰</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION B: ROUTER HUB (WAITING QUEUE + ONLINE BOOKINGS + LIVE CHAT) (5 cols) */}
          <div className="xl:col-span-5 bg-[#12121b] border border-amber-500/25 rounded-3xl overflow-hidden shadow-xl flex flex-col">
            {/* Router Tabs */}
            <div className="grid grid-cols-3 border-b border-white/10 bg-black/40 p-1.5 gap-1">
              <button
                type="button"
                onClick={() => setRouterTab("WAITING")}
                className={`py-2.5 px-2 rounded-2xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  routerTab === "WAITING"
                    ? "bg-sky-500 text-slate-950 shadow-md"
                    : "text-slate-300 hover:bg-white/5"
                }`}
              >
                <span>🛋️ الانتظار</span>
                <span className="px-1.5 py-0.5 rounded-full bg-black/20 font-mono text-[10px]">
                  {waitingTickets.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRouterTab("BOOKINGS")}
                className={`py-2.5 px-2 rounded-2xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  routerTab === "BOOKINGS"
                    ? "bg-amber-500 text-slate-950 shadow-md"
                    : "text-slate-300 hover:bg-white/5"
                }`}
              >
                <span>📅 الحجوزات</span>
                {pendingBookingsCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white font-mono text-[10px] animate-pulse">
                    {pendingBookingsCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setRouterTab("CHAT")}
                className={`py-2.5 px-2 rounded-2xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  routerTab === "CHAT"
                    ? "bg-purple-500 text-white shadow-md"
                    : "text-slate-300 hover:bg-white/5"
                }`}
              >
                <span>💬 الشات</span>
                {unreadChatTotal > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white font-mono text-[10px] animate-pulse">
                    {unreadChatTotal}
                  </span>
                )}
              </button>
            </div>

            {/* TAB 1: WAITING LOUNGE QUEUE */}
            {routerTab === "WAITING" && (
              <div className="p-4 space-y-3 max-h-[760px] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400 font-bold">
                    زبائن صالة الاستراحة بانتظار الدور أو كابتن معين
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setWalkInBranchId(selectedBranchId !== "ALL" ? selectedBranchId : branches[0]?.id || "");
                      setShowWalkInModal(true);
                    }}
                    className="py-1 px-2.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-[11px] font-black cursor-pointer"
                  >
                    + إضافة زبون
                  </button>
                </div>

                {waitingTickets.length === 0 ? (
                  <div className="py-12 text-center space-y-2 text-slate-500">
                    <div className="text-3xl">🛋️</div>
                    <p className="text-xs font-bold">صالة الانتظار فارغة حالياً</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {waitingTickets.map((wt) => {
                      const isFirstAvail = wt.notes?.includes("أول كابتن") || wt.notes?.includes("أقرب كرسي");
                      const targetSpec = specialists.find((s) => s.id === wt.specialistId);
                      const isTargetReady = targetSpec?.status === "AVAILABLE" && !activeTicketBySpecId.has(targetSpec.id);
                      const anyReady = availableSpecialists.some((s) => s.branchId === wt.branchId);
                      const wtServices = parseJsonArray(wt.services);
                      const waitMin = Math.max(1, Math.round((Date.now() - new Date(wt.createdAt).getTime()) / 60000));

                      return (
                        <div
                          key={wt.id}
                          className={`p-3.5 rounded-2xl border space-y-2.5 ${
                            (isFirstAvail && anyReady) || (!isFirstAvail && isTargetReady)
                              ? "bg-emerald-500/10 border-emerald-500/45 shadow-md"
                              : "bg-black/40 border-white/10"
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono font-black text-amber-400">#{wt.ticketNumber}</span>
                            <span className="py-0.5 px-2 rounded-lg bg-white/5 font-mono text-[10px] text-slate-300">
                              ⏱️ منذ {waitMin} د
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-black text-sm text-white">{wt.customerName}</h4>
                              {wt.customerPhone && (
                                <p className="text-[11px] text-slate-400 font-mono">{wt.customerPhone}</p>
                              )}
                            </div>
                            <span className="py-1 px-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-black">
                              {isFirstAvail
                                ? "⚡ أقرب كرسي يفضى"
                                : `👑 طلب: ${targetSpec?.name || wt.specialist?.name}`}
                            </span>
                          </div>

                          {/* Pre-selected Services Pills */}
                          <div className="p-2 rounded-xl bg-black/50 border border-white/5 space-y-1 text-[11px]">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 font-bold">
                                الخدمات المطلوبة ({wtServices.length}):
                              </span>
                              <button
                                type="button"
                                onClick={() => setEditingWaitingTicketId(wt.id)}
                                className="text-amber-400 hover:underline font-black text-[10px] cursor-pointer"
                              >
                                + تعديل الخدمات ✂️
                              </button>
                            </div>
                            {wtServices.length > 0 ? (
                              <div className="flex flex-wrap gap-1 pt-0.5">
                                {wtServices.map((srv: any, i: number) => (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 rounded-lg bg-white/5 text-slate-200 text-[10px]"
                                  >
                                    {srv.nameAr} ({srv.price}ج)
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-500">لم تُحدد خدمات مسبقة بعد</span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (!isFirstAvail && isTargetReady && targetSpec) {
                                  handleSeatWaitingTicket(wt, targetSpec.id);
                                } else {
                                  setSeatPickerTarget({ type: "WAITING_TICKET", record: wt });
                                }
                              }}
                              className={`flex-1 py-2 px-3 rounded-xl font-black text-xs transition cursor-pointer ${
                                (isFirstAvail && anyReady) || (!isFirstAvail && isTargetReady)
                                  ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                                  : "bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40"
                              }`}
                            >
                              {!isFirstAvail && isTargetReady
                                ? `إجلاس فوراً عند ${targetSpec?.name} 💺`
                                : "اختيار الكرسي والإجلاس 💺"}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCancelWaitingTicket(wt)}
                              className="py-2 px-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-bold cursor-pointer"
                              title="إلغاء الانتظار"
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
            )}

            {/* TAB 2: ONLINE BOOKINGS */}
            {routerTab === "BOOKINGS" && (
              <div className="p-4 space-y-3 max-h-[760px] overflow-y-auto">
                {/* Date + Status Filters */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setBookingDateScope("ALL")}
                      className={`py-1 px-2.5 rounded-lg cursor-pointer ${
                        bookingDateScope === "ALL" ? "bg-white/15 text-white" : "text-slate-400 bg-white/5"
                      }`}
                    >
                      كل الأيام
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingDateScope("TODAY")}
                      className={`py-1 px-2.5 rounded-lg cursor-pointer ${
                        bookingDateScope === "TODAY" ? "bg-amber-500 text-slate-950 font-black" : "text-slate-400 bg-white/5"
                      }`}
                    >
                      حجوزات اليوم 📅
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-1 text-[10px] font-bold">
                    {[
                      { id: "ALL", label: "الكل" },
                      { id: "PENDING", label: `جديد 🔔 (${pendingBookingsCount})` },
                      { id: "CONFIRMED", label: "مؤكد ✅" },
                      { id: "WAITING_LOUNGE", label: "بالاستراحة 🛋️" },
                      { id: "IN_CHAIR", label: "على الكرسي 💺" },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setBookingStatusFilter(st.id)}
                        className={`py-1 px-2 rounded-lg cursor-pointer ${
                          bookingStatusFilter === st.id
                            ? "bg-amber-500 text-slate-950 font-black"
                            : "bg-white/5 text-slate-400 hover:bg-white/10"
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredBookings.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 font-bold">
                    لا توجد حجوزات مطابقة لهذا الفلتر
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredBookings.map((bk) => {
                      const bkServices = parseJsonArray(bk.serviceIds);
                      const timing = computeBookingTiming(bk.bookingDate, bk.timeSlot, watchdogAlerts.reminderLeadMinutes || 15);
                      const isOverdueCard = (bk.status === "PENDING" || bk.status === "CONFIRMED") && timing.isOverdue;
                      const isUpcomingSoon = (bk.status === "PENDING" || bk.status === "CONFIRMED") && timing.isUpcoming15Min;
                      const hasOpenTicket = tickets.some(
                        (t) =>
                          (t.status === "WAITING" || t.status === "IN_CHAIR") &&
                          ((t.customerId && t.customerId === bk.customerId) ||
                            (t.customerPhone && bk.customer?.phone && t.customerPhone === bk.customer.phone))
                      );
                      return (
                        <div
                          key={bk.id}
                          className={`p-3.5 rounded-2xl border space-y-2.5 ${
                            isOverdueCard
                              ? "bg-rose-500/15 border-rose-500/60"
                              : isUpcomingSoon
                                ? "bg-amber-500/10 border-amber-500/50"
                                : bk.status === "PENDING"
                                  ? "bg-rose-500/10 border-rose-500/40"
                                  : "bg-black/40 border-white/10"
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-amber-400">#{bk.bookingNumber}</span>
                              {isOverdueCard && (
                                <span className="py-0.5 px-2 rounded-full bg-rose-600 text-white text-[10px] font-black animate-pulse">
                                  {timing.isPastDay ? "⚠️ حجز فائت (اتصل/رحّل)" : "⏳ تأخر +5 دقائق"}
                                </span>
                              )}
                              {isUpcomingSoon && !isOverdueCard && (
                                <span className="py-0.5 px-2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
                                  ⏰ بعد {timing.diffMinutes ?? 15} د
                                </span>
                              )}
                            </div>
                            <span
                              className={`py-0.5 px-2 rounded-full text-[10px] font-black border ${
                                bk.status === "PENDING"
                                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse"
                                  : bk.status === "CONFIRMED"
                                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                  : bk.status === "IN_CHAIR"
                                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                  : "bg-white/10 text-slate-300 border-white/15"
                              }`}
                            >
                              {bk.status === "PENDING"
                                ? "بانتظار رد المنسق 🔔"
                                : bk.status === "CONFIRMED"
                                ? "مؤكد ✅"
                                : bk.status === "WAITING_LOUNGE"
                                ? "بالاستراحة 🛋️"
                                : bk.status === "IN_CHAIR"
                                ? "على الكرسي 💺"
                                : bk.status}
                            </span>
                          </div>

                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-black text-sm text-white">{bk.customer?.name || "عميل VIP"}</h4>
                              <p className="text-[11px] text-slate-400 font-mono">{bk.customer?.phone}</p>
                              <p className="text-[11px] text-sky-300 font-bold pt-0.5">
                                📍 {bk.branch?.name} • ⏰ {bk.bookingDate} — {bk.timeSlot}
                              </p>
                            </div>
                            <div className="text-left shrink-0">
                              <span className="text-[10px] text-amber-300 font-bold block">
                                {bk.specialist ? `✂️ ${bk.specialist.name}` : "⚡ أول كرسي يفضى"}
                              </span>
                              <strong className="font-mono text-sm text-emerald-400 font-black">
                                {bk.totalAmount} ج.م
                              </strong>
                            </div>
                          </div>

                          {bkServices.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {bkServices.map((s: any, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded-lg bg-white/5 text-slate-300 text-[10px]"
                                >
                                  {s.nameAr || s.titleAr}
                                </span>
                              ))}
                            </div>
                          )}

                          {bk.notes && (
                            <p className="text-[10px] text-slate-400 bg-black/40 p-2 rounded-xl">
                              📝 {bk.notes}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-white/5">
                            {bk.status === "PENDING" && (
                              <button
                                type="button"
                                onClick={() => handleQuickConfirmBooking(bk)}
                                disabled={actionLoading}
                                className="py-1.5 px-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] cursor-pointer"
                              >
                                تأكيد الموعد ✅
                              </button>
                            )}

                            {(bk.status === "PENDING" || bk.status === "CONFIRMED") && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditBooking(bk)}
                                  className="py-1.5 px-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 font-bold text-[11px] cursor-pointer"
                                >
                                  تظبيط المعاد / الكابتن ⏱️
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSeatPickerTarget({ type: "BOOKING", record: bk })}
                                  className="py-1.5 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] cursor-pointer"
                                >
                                  وصل المحل! إجلاس / انتظار 💺
                                </button>
                                {(timing.isPastDue5Min || timing.isPastDay) && (
                                  <button
                                    type="button"
                                    disabled={actionLoading}
                                    onClick={() => handleLateFirstAvailableBooking(bk)}
                                    className="py-1.5 px-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400/50 text-amber-200 font-black text-[11px] cursor-pointer"
                                  >
                                    ⚡ ترحيل لأول كرسي يفضى
                                  </button>
                                )}
                              </>
                            )}

                            {bk.status === "IN_CHAIR" && !hasOpenTicket && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setSeatPickerTarget({ type: "BOOKING", record: bk })}
                                  className="py-1.5 px-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] cursor-pointer"
                                >
                                  فتح تذكرة بالكرسي 💺
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleResetBookingToConfirmed(bk)}
                                  className="py-1.5 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-amber-300 font-bold text-[11px] cursor-pointer"
                                >
                                  إرجاع لمؤكد ↩️
                                </button>
                              </>
                            )}

                            {bk.customer?.phone && (
                              <a
                                href={`tel:${bk.customer.phone}`}
                                className="py-1.5 px-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-bold text-[11px]"
                              >
                                اتصال 📞
                              </a>
                            )}

                            <button
                              type="button"
                              onClick={() => handleOpenChatForBooking(bk)}
                              className="py-1.5 px-2.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 font-bold text-[11px] cursor-pointer"
                            >
                              شات 💬
                            </button>

                            {bk.status !== "CANCELLED" && bk.status !== "COMPLETED" && bk.status !== "IN_CHAIR" && (
                              <button
                                type="button"
                                onClick={() => handleCancelBooking(bk)}
                                className="py-1.5 px-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-[11px] font-bold cursor-pointer"
                              >
                                إلغاء ✕
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: LIVE CUSTOMER CHAT */}
            {routerTab === "CHAT" && (
              <div className="flex flex-col h-[680px]">
                {/* Conversations Picker Strip or Two-Pane */}
                <div className="p-2.5 border-b border-white/10 bg-black/30 flex items-center gap-2 overflow-x-auto">
                  {chatConversations.length === 0 ? (
                    <span className="text-xs text-slate-500 font-bold px-2">لا توجد محادثات عملاء حالياً</span>
                  ) : (
                    chatConversations.map((c) => {
                      const active = activeChatCustomer?.key === c.key;
                      return (
                        <button
                          key={c.key}
                          type="button"
                          onClick={() => setActiveChatCustomer(c)}
                          className={`py-1.5 px-3 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 border transition cursor-pointer ${
                            active
                              ? "bg-amber-500 text-slate-950 border-amber-400 font-black"
                              : "bg-white/5 hover:bg-white/10 text-slate-200 border-white/10"
                          }`}
                        >
                          <span>{c.customerName || c.customerPhone || "عميل"}</span>
                          {c.unreadCount > 0 && (
                            <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] flex items-center justify-center font-mono">
                              {c.unreadCount}
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>

                {activeChatCustomer ? (
                  <>
                    <div className="p-3 border-b border-white/10 bg-black/20 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h4 className="font-black text-xs text-amber-400">
                          {activeChatCustomer.customerName || "عميل VIP"}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {activeChatCustomer.customerPhone}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1 text-[10px]">
                        <button
                          type="button"
                          onClick={() =>
                            handleSendChatReply(
                              "أهلاً بك يا فندم 👑 تم تأكيد موعدك وبانتظار تشريفك في صالونات وسبا الباشا VIP!"
                            )
                          }
                          className="py-1 px-2 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold cursor-pointer"
                        >
                          تأكيد ✅
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleSendChatReply(
                              "الكرسي فاضي وجاهز لاستقبالك الآن يا فندم 💺 تفضل في انتظارك!"
                            )
                          }
                          className="py-1 px-2 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold cursor-pointer"
                        >
                          الكرسي جاهز 💺
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-[#09090d]">
                      {chatMessages.map((m) => {
                        const isSalon = m.sender === "SALON";
                        return (
                          <div
                            key={m.id}
                            className={`flex ${isSalon ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[82%] rounded-2xl p-2.5 text-xs space-y-1 ${
                                isSalon
                                  ? "bg-amber-500 text-slate-950 font-bold"
                                  : "bg-[#181825] border border-white/10 text-slate-200"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3 text-[9px] opacity-75">
                                <span>{m.senderName}</span>
                                <span className="font-mono">
                                  {new Date(m.createdAt).toLocaleTimeString("ar-EG", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              <p className="leading-relaxed whitespace-pre-wrap">{m.message}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendChatReply();
                      }}
                      className="p-3 border-t border-white/10 bg-[#12121a] flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={chatReplyText}
                        onChange={(e) => setChatReplyText(e.target.value)}
                        placeholder="اكتب رد المنسق للعميل..."
                        className="flex-1 py-2 px-3 rounded-xl bg-black/60 border border-amber-500/30 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                      <button
                        type="submit"
                        disabled={chatSending || !chatReplyText.trim()}
                        className="py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 cursor-pointer disabled:opacity-40"
                      >
                        <Send className="w-3.5 h-3.5 rotate-180" />
                        <span>إرسال</span>
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500 space-y-2">
                    <MessageSquare className="w-10 h-10 opacity-40" />
                    <p className="text-xs font-bold">اختر محادثة من الأعلى للرد على العميل</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: SPECIALIST CHAIR CONTROL WORKSPACE (فتح شاشة أي متخصص)
         ───────────────────────────────────────────────────────────── */}
      {openedSpecialist && (
        <div
          className="fixed inset-0 z-[120] overflow-y-auto bg-black/85 backdrop-blur-md flex items-start sm:items-center justify-center p-3 sm:p-4 pt-6 pb-8 font-sans"
          dir="rtl"
        >
          <div className="my-auto w-full max-w-5xl bg-[#111119] border-2 border-amber-500/45 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4">
            {/* Modal Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-amber-400 bg-black shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={openedSpecialist.photo || "/logo.jpg"}
                    alt={openedSpecialist.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-amber-400">
                      شاشة {openedSpecialist.name}
                    </h3>
                    <span className="py-0.5 px-2 rounded-lg bg-amber-500/20 text-amber-300 font-mono text-[10px] font-black">
                      كرسي #{openedSpecialist.chairNumber}
                    </span>
                    <span
                      className={`py-0.5 px-2 rounded-full text-[10px] font-black border ${
                        getStatusBadge(openedSpecialist.status, Boolean(openedActiveTicket)).cls
                      }`}
                    >
                      {getStatusBadge(openedSpecialist.status, Boolean(openedActiveTicket)).label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{openedSpecialist.branchName}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!openedActiveTicket && (
                  <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-[10px] font-bold">
                    {[
                      { st: "AVAILABLE", lbl: "متاح 🟢", rsn: "حاضر وبدأ الوردية" },
                      { st: "BREAK", lbl: "استراحة ☕", rsn: "استراحة قصيرة" },
                      { st: "OFF_DUTY", lbl: "انصراف 🏠", rsn: "انتهت الوردية" },
                    ].map((opt) => (
                      <button
                        key={opt.st}
                        type="button"
                        onClick={() => handleQuickShiftStatus(openedSpecialist.id, opt.st, opt.rsn)}
                        className={`py-1 px-2 rounded-lg transition cursor-pointer ${
                          openedSpecialist.status === opt.st
                            ? "bg-amber-500 text-slate-950 font-black"
                            : "text-slate-300 hover:bg-white/10"
                        }`}
                      >
                        {opt.lbl}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setOpenedSpecialistId(null)}
                  className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 text-slate-300 flex items-center justify-center font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* IF SPECIALIST HAS ACTIVE IN_CHAIR TICKET */}
            {openedActiveTicket ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Left 5 cols: Current Check + Switch Chair + Finish */}
                <div className="lg:col-span-5 space-y-3 bg-black/40 border border-amber-500/30 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                      <div>
                        <span className="font-mono text-[10px] text-amber-400 font-black">
                          شيك #{openedActiveTicket.ticketNumber}
                        </span>
                        <h4 className="text-base font-black text-white">
                          {openedActiveTicket.customerName}
                        </h4>
                        {openedActiveTicket.customerPhone && (
                          <p className="text-xs text-slate-400 font-mono">
                            {openedActiveTicket.customerPhone}
                          </p>
                        )}
                      </div>
                      <div className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-center">
                        <span className="text-[10px] text-slate-300 block">المدة</span>
                        <strong className="font-mono text-sm text-amber-400 font-black">
                          {Math.max(
                            0,
                            Math.floor(
                              (Date.now() - new Date(openedActiveTicket.startTime).getTime()) / 60000
                            )
                          )}{" "}
                          د
                        </strong>
                      </div>
                    </div>

                    {/* Services in Check */}
                    <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                      <p className="text-xs font-bold text-slate-400">
                        الخدمات والعروض المسجلة بالشيك:
                      </p>
                      {parseJsonArray(openedActiveTicket.services).length === 0 ? (
                        <p className="text-center py-6 text-xs text-slate-500 font-bold">
                          اضغط على الخدمات من القائمة المجاورة لإضافتها للشيك ✂️
                        </p>
                      ) : (
                        parseJsonArray(openedActiveTicket.services).map((it: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-[#161622] border border-white/10 flex items-center justify-between text-xs"
                          >
                            <div>
                              <p className="font-bold text-white">{it.nameAr}</p>
                              {it.addedAt && (
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {it.addedAt}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-amber-400">
                                {it.price} ج
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveServiceFromTicket(openedActiveTicket.id, idx)
                                }
                                disabled={actionLoading}
                                className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                                title="حذف الخدمة"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Optional Switch Chair */}
                    <div className="pt-2 border-t border-white/10 flex items-center gap-1.5">
                      <select
                        value={switchTargetSpecId}
                        onChange={(e) => setSwitchTargetSpecId(e.target.value)}
                        className="flex-1 py-1.5 px-2.5 rounded-xl bg-black/60 border border-white/10 text-[11px] text-slate-200"
                      >
                        <option value="">🔄 نقل العميل لكرسي آخر...</option>
                        {specialists
                          .filter(
                            (sp) =>
                              sp.id !== openedSpecialist.id &&
                              sp.branchId === openedSpecialist.branchId
                          )
                          .map((sp) => (
                            <option key={sp.id} value={sp.id}>
                              {sp.name} (كرسي #{sp.chairNumber})
                            </option>
                          ))}
                      </select>
                      <button
                        type="button"
                        disabled={!switchTargetSpecId || actionLoading}
                        onClick={() =>
                          handleSwitchSpecialist(openedActiveTicket.id, switchTargetSpecId)
                        }
                        className="py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold disabled:opacity-40 cursor-pointer"
                      >
                        نقل
                      </button>
                    </div>
                  </div>

                  {/* Total & Finish Button */}
                  <div className="space-y-3 pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between text-base font-black">
                      <span className="text-slate-300 text-xs">إجمالي الشيك للكاشير:</span>
                      <span className="font-mono text-xl text-amber-400">
                        {openedActiveTicket.finalAmount} ج.م
                      </span>
                    </div>

                    {confirmingFinishId === openedActiveTicket.id ? (
                      <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 space-y-2">
                        <p className="text-xs font-bold text-emerald-200">
                          تأكيد إنهاء الجلسة وإرسال الشيك ({openedActiveTicket.finalAmount} ج.م) لشاشة الكاشير؟
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleFinishChairTicket(openedActiveTicket)}
                            disabled={actionLoading}
                            className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer"
                          >
                            نعم، إنهاء وإرسال للكاشير 🚀
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmingFinishId(null)}
                            className="py-2.5 px-3 rounded-xl bg-white/10 text-xs font-bold cursor-pointer"
                          >
                            تراجع
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmingFinishId(openedActiveTicket.id)}
                        disabled={
                          actionLoading ||
                          parseJsonArray(openedActiveTicket.services).length === 0
                        }
                        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 disabled:opacity-40 cursor-pointer"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        <span>إنهاء الحلاقة وإرسال الشيك للكاشير 🏁💰</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Right 7 cols: Quick Service & Offer Tap Pad */}
                <div className="lg:col-span-7 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-xs sm:text-sm font-black text-white">
                      ➕ إضافة خدمة إضافية للعميل أثناء الحلاقة:
                    </h4>
                    <div className="relative w-full sm:w-52">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                      <input
                        type="text"
                        value={chairSearch}
                        onChange={(e) => setChairSearch(e.target.value)}
                        placeholder="بحث عن خدمة..."
                        className="w-full py-1.5 pr-8 pl-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* Categories */}
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(CATEGORY_LABELS).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setChairCat(id)}
                        className={`py-1 px-2.5 rounded-xl text-[11px] font-bold cursor-pointer ${
                          chairCat === id
                            ? "bg-amber-500 text-slate-950 font-black"
                            : "bg-white/5 hover:bg-white/10 text-slate-300"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Items Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {chairCat === "OFFERS"
                      ? offers
                          .filter(
                            (o) =>
                              (!o.branchId || o.branchId === openedSpecialist.branchId) &&
                              (!chairSearch.trim() ||
                                o.titleAr.toLowerCase().includes(chairSearch.trim().toLowerCase()))
                          )
                          .map((offer) => (
                            <button
                              key={offer.id}
                              type="button"
                              disabled={actionLoading}
                              onClick={() =>
                                handleAddServiceToTicket(openedActiveTicket.id, {
                                  id: `offer-${offer.id}`,
                                  nameAr: `${offer.titleAr} 👑`,
                                  price: offer.price,
                                })
                              }
                              className="p-3 rounded-2xl bg-[#181826] hover:bg-amber-500/20 border border-amber-500/35 text-right space-y-1 transition active:scale-95 cursor-pointer"
                            >
                              <span className="text-[10px] text-amber-400 font-black block">
                                👑 عرض ملكي
                              </span>
                              <h5 className="font-black text-xs text-white line-clamp-2">
                                {offer.titleAr}
                              </h5>
                              <span className="font-mono text-xs font-black text-emerald-400 block">
                                {offer.price} ج.م
                              </span>
                            </button>
                          ))
                      : services
                          .filter(
                            (s) =>
                              (!s.branchId || s.branchId === openedSpecialist.branchId) &&
                              (chairCat === "ALL" || s.category === chairCat) &&
                              (!chairSearch.trim() ||
                                s.nameAr.toLowerCase().includes(chairSearch.trim().toLowerCase()))
                          )
                          .map((srv) => (
                            <button
                              key={srv.id}
                              type="button"
                              disabled={actionLoading}
                              onClick={() => handleAddServiceToTicket(openedActiveTicket.id, srv)}
                              className="p-3 rounded-2xl bg-[#161622] hover:bg-amber-500/20 border border-white/10 hover:border-amber-400 text-right space-y-1 transition active:scale-95 cursor-pointer"
                            >
                              <div className="flex items-center justify-between text-[10px] text-slate-400">
                                <span className="text-amber-400 font-black">+ إضافة</span>
                                <span className="font-mono">{srv.durationMinutes}د</span>
                              </div>
                              <h5 className="font-black text-xs text-white line-clamp-2">
                                {srv.nameAr}
                              </h5>
                              <span className="font-mono text-xs font-black text-amber-400 block">
                                {srv.price} ج.م
                              </span>
                            </button>
                          ))}
                  </div>
                </div>
              </div>
            ) : (
              /* IF CHAIR IS AVAILABLE: START SESSION FROM WAITING, BOOKING, OR WALK-IN */
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setChairTab("WAITING")}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-black cursor-pointer ${
                      chairTab === "WAITING"
                        ? "bg-sky-500 text-slate-950"
                        : "text-slate-300 hover:bg-white/5"
                    }`}
                  >
                    🛋️ من صالة الانتظار ({waitingTickets.filter((t) => t.branchId === openedSpecialist.branchId).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setChairTab("BOOKINGS")}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-black cursor-pointer ${
                      chairTab === "BOOKINGS"
                        ? "bg-amber-500 text-slate-950"
                        : "text-slate-300 hover:bg-white/5"
                    }`}
                  >
                    📅 من الحجوزات (
                    {
                      bookings.filter(
                        (b) =>
                          b.branchId === openedSpecialist.branchId &&
                          (b.status === "CONFIRMED" || b.status === "PENDING")
                      ).length
                    }
                    )
                  </button>
                  <button
                    type="button"
                    onClick={() => setChairTab("WALKIN")}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-black cursor-pointer ${
                      chairTab === "WALKIN"
                        ? "bg-emerald-500 text-slate-950"
                        : "text-slate-300 hover:bg-white/5"
                    }`}
                  >
                    🚶‍♂️ عميل جديد مباشر (Walk-in)
                  </button>
                </div>

                {chairTab === "WAITING" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto">
                    {waitingTickets.filter((t) => t.branchId === openedSpecialist.branchId).length ===
                    0 ? (
                      <div className="col-span-full py-10 text-center text-xs text-slate-500 font-bold">
                        لا يوجد زبائن في صالة الانتظار لهذا الفرع حالياً
                      </div>
                    ) : (
                      waitingTickets
                        .filter((t) => t.branchId === openedSpecialist.branchId)
                        .map((wt) => (
                          <div
                            key={wt.id}
                            className="p-3.5 rounded-2xl bg-black/50 border border-sky-500/30 flex items-center justify-between gap-3"
                          >
                            <div>
                              <h5 className="font-black text-sm text-white">{wt.customerName}</h5>
                              <p className="text-[11px] text-amber-300 font-bold">
                                {wt.notes?.includes("أول كابتن")
                                  ? "⚡ أول كرسي يفضى"
                                  : `طلب: ${wt.specialist?.name}`}
                              </p>
                              <span className="text-[10px] text-slate-400">
                                {parseJsonArray(wt.services).length} خدمات • {wt.finalAmount} ج.م
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSeatWaitingTicket(wt, openedSpecialist.id)}
                              disabled={actionLoading}
                              className="py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer shrink-0"
                            >
                              بدء الجلسة ▶️
                            </button>
                          </div>
                        ))
                    )}
                  </div>
                )}

                {chairTab === "BOOKINGS" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto">
                    {bookings
                      .filter(
                        (b) =>
                          b.branchId === openedSpecialist.branchId &&
                          (b.status === "CONFIRMED" || b.status === "PENDING")
                      )
                      .map((bk) => (
                        <div
                          key={bk.id}
                          className="p-3.5 rounded-2xl bg-black/50 border border-amber-500/30 flex items-center justify-between gap-3"
                        >
                          <div>
                            <h5 className="font-black text-sm text-white">
                              {bk.customer?.name} (#{bk.bookingNumber})
                            </h5>
                            <p className="text-[11px] text-sky-300 font-mono">
                              {bk.bookingDate} • {bk.timeSlot}
                            </p>
                            <span className="text-[10px] text-amber-300 font-bold">
                              {bk.specialist?.name || "أول كرسي متاح"} • {bk.totalAmount} ج.م
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleRouteBookingToFloor(bk, openedSpecialist.id, "IN_CHAIR")
                            }
                            disabled={actionLoading}
                            className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shrink-0"
                          >
                            وصل وبدء ▶️
                          </button>
                        </div>
                      ))}
                  </div>
                )}

                {chairTab === "WALKIN" && (
                  <form onSubmit={handleStartWalkInOnOpenedChair} className="space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-300 font-bold block mb-1">اسم العميل *:</label>
                        <input
                          type="text"
                          required
                          value={chairWalkInName}
                          onChange={(e) => setChairWalkInName(e.target.value)}
                          placeholder="مثال: أحمد محمود"
                          className="w-full py-2.5 px-3 rounded-xl bg-black/60 border border-white/15 text-white font-bold focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="text-slate-300 font-bold block mb-1">
                          رقم الهاتف (اختياري):
                        </label>
                        <input
                          type="tel"
                          value={chairWalkInPhone}
                          onChange={(e) => setChairWalkInPhone(e.target.value)}
                          placeholder="010XXXXXXXX"
                          className="w-full py-2.5 px-3 rounded-xl bg-black/60 border border-white/15 text-white font-mono focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="text-slate-300 font-bold">
                          الخدمات والعروض الملكية ({chairWalkInServices.length} مختار — إجمالي{" "}
                          {chairWalkInServices.reduce((s, it) => s + Number(it.price || 0), 0)} ج.م):
                        </label>
                      </div>
                      <div className="flex items-center gap-1 overflow-x-auto pb-1">
                        {Object.entries(CATEGORY_LABELS).map(([catKey, catLabel]) => (
                          <button
                            key={catKey}
                            type="button"
                            onClick={() => setChairWalkInCategory(catKey)}
                            className={`py-1 px-2.5 rounded-lg text-[10px] font-black whitespace-nowrap border cursor-pointer ${
                              chairWalkInCategory === catKey
                                ? "bg-amber-500 text-slate-950 border-amber-400"
                                : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
                            }`}
                          >
                            {catLabel}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1">
                        {getCombinedCatalogItems(openedSpecialist.branchId)
                          .filter((it) => chairWalkInCategory === "ALL" || it.category === chairWalkInCategory)
                          .map((srv) => {
                            const picked = chairWalkInServices.some((p) => p.id === srv.id);
                            return (
                              <button
                                key={srv.id}
                                type="button"
                                onClick={() => toggleChairWalkInService(srv)}
                                className={`p-2.5 rounded-xl border text-right transition cursor-pointer flex flex-col justify-between gap-1.5 min-h-[58px] ${
                                  picked
                                    ? "bg-amber-500/20 border-amber-400 text-white font-black shadow-md shadow-amber-500/10"
                                    : srv.isOffer
                                      ? "bg-amber-500/10 border-amber-500/30 text-amber-100 hover:bg-amber-500/20"
                                      : "bg-black/40 border-white/10 text-slate-200 hover:bg-white/5"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-1.5 w-full text-[11px]">
                                  <span className="leading-snug break-words flex-1 font-bold">
                                    {srv.isOffer && "👑 "}
                                    {srv.nameAr}
                                  </span>
                                  <span className="font-mono text-amber-400 font-black shrink-0">
                                    {srv.price}ج
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Play className="w-4 h-4" />
                      <span>بدء الحلاقة على كرسي {openedSpecialist.name} الآن ▶️</span>
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: GLOBAL WALK-IN ROUTER MODAL (استقبال زبون دخل الصالون)
         ───────────────────────────────────────────────────────────── */}
      {showWalkInModal && (
        <div
          className="fixed inset-0 z-[120] overflow-y-auto bg-black/85 backdrop-blur-md flex items-start sm:items-center justify-center p-3 sm:p-4 pt-6 pb-8 font-sans"
          dir="rtl"
        >
          <div className="my-auto w-full max-w-2xl bg-[#12121b] border-2 border-amber-500/45 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-black text-white">استقبال وتوجيه زبون دخل الصالون 🚶‍♂️🧭</h3>
                <p className="text-xs text-slate-400">
                  حدد بيانات الزبون، خدماته المطلوبة، وتفضيله (كابتن معين أو أقرب كرسي يفضى)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowWalkInModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {isGlobalViewer && branches.length > 1 ? (
                <div>
                  <label className="text-slate-300 font-bold block mb-1">الفرع:</label>
                  <select
                    value={walkInBranchId}
                    onChange={(e) => {
                      setWalkInBranchId(e.target.value);
                      setWalkInSpecId("");
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/15 text-white font-bold"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="py-2 px-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-black flex items-center justify-between">
                  <span>📍 الفرع المخصص:</span>
                  <span>{activeBranchName}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">اسم الزبون *:</label>
                  <input
                    type="text"
                    value={walkInName}
                    onChange={(e) => setWalkInName(e.target.value)}
                    placeholder="مثال: كريم السيد"
                    className="w-full py-2.5 px-3 rounded-xl bg-black/60 border border-white/15 text-white font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">رقم الموبايل (اختياري):</label>
                  <input
                    type="tel"
                    value={walkInPhone}
                    onChange={(e) => setWalkInPhone(e.target.value)}
                    placeholder="010XXXXXXXX"
                    className="w-full py-2.5 px-3 rounded-xl bg-black/60 border border-white/15 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                  {matchedCustomerHint && (
                    <button
                      type="button"
                      onClick={() => setWalkInName(matchedCustomerHint.name)}
                      className="mt-1 text-[10px] text-emerald-400 font-bold hover:underline cursor-pointer"
                    >
                      ✨ عميل مسجل: {matchedCustomerHint.name} ({matchedCustomerHint.totalVisits} زيارة) — اضغط لملء الاسم
                    </button>
                  )}
                </div>
              </div>

              {/* Routing Preference */}
              <div className="space-y-2">
                <label className="text-slate-300 font-bold block">توجيه الراوتر المطلوب:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWalkInRouteType("FIRST_AVAILABLE")}
                    className={`p-3 rounded-2xl border text-right transition cursor-pointer ${
                      walkInRouteType === "FIRST_AVAILABLE"
                        ? "bg-emerald-500/20 border-emerald-400 text-white font-black"
                        : "bg-black/40 border-white/10 text-slate-300"
                    }`}
                  >
                    <span className="block text-xs">⚡ أول كرسي يفضى بالمحل</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      توجيه فوري لأقرب كابتن متاح أو صالة الانتظار
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWalkInRouteType("SPECIFIC")}
                    className={`p-3 rounded-2xl border text-right transition cursor-pointer ${
                      walkInRouteType === "SPECIFIC"
                        ? "bg-amber-500/20 border-amber-400 text-white font-black"
                        : "bg-black/40 border-white/10 text-slate-300"
                    }`}
                  >
                    <span className="block text-xs">👑 اختيار متخصص بالاسم</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      الزبون يطلب كابتن معين في الصالون
                    </span>
                  </button>
                </div>

                {walkInRouteType === "SPECIFIC" && (
                  <select
                    value={walkInSpecId}
                    onChange={(e) => setWalkInSpecId(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-xl bg-black/60 border border-amber-500/30 text-white font-bold"
                  >
                    <option value="">-- اختر الكابتن --</option>
                    {specialists
                      .filter((s) => !walkInBranchId || s.branchId === walkInBranchId)
                      .map((s) => {
                        const free = s.status === "AVAILABLE" && !activeTicketBySpecId.has(s.id);
                        return (
                          <option key={s.id} value={s.id}>
                            {s.name} • كرسي #{s.chairNumber} ({free ? "متاح الآن 🟢" : "مشغول 🔴"})
                          </option>
                        );
                      })}
                  </select>
                )}
              </div>

              {/* Services Multi-Select */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-bold">
                    الخدمات / العروض المطلوبة ({walkInSelectedItems.length} — إجمالي{" "}
                    <strong className="text-amber-400 font-mono">
                      {walkInSelectedItems.reduce((s, x) => s + Number(x.price || 0), 0)} ج.م
                    </strong>
                    ):
                  </label>
                  <input
                    type="text"
                    value={walkInServiceSearch}
                    onChange={(e) => setWalkInServiceSearch(e.target.value)}
                    placeholder="فلتر الخدمات..."
                    className="py-1 px-2.5 rounded-lg bg-black/60 border border-white/10 text-[11px] text-white"
                  />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                  {Object.entries(CATEGORY_LABELS).map(([catKey, catLabel]) => (
                    <button
                      key={catKey}
                      type="button"
                      onClick={() => setWalkInCategory(catKey)}
                      className={`py-1 px-2.5 rounded-lg text-[10px] font-black whitespace-nowrap border cursor-pointer ${
                        walkInCategory === catKey
                          ? "bg-amber-500 text-slate-950 border-amber-400"
                          : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      {catLabel}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1">
                  {getCombinedCatalogItems(walkInBranchId)
                    .filter(
                      (item) =>
                        (walkInCategory === "ALL" || item.category === walkInCategory) &&
                        (!walkInServiceSearch.trim() ||
                          item.nameAr.toLowerCase().includes(walkInServiceSearch.trim().toLowerCase()))
                    )
                    .map((srv) => {
                      const picked = walkInSelectedItems.some((p) => p.id === srv.id);
                      return (
                        <button
                          key={srv.id}
                          type="button"
                          onClick={() => toggleWalkInService(srv)}
                          className={`p-2.5 rounded-xl border text-right transition cursor-pointer flex flex-col justify-between gap-1.5 min-h-[58px] ${
                            picked
                              ? "bg-amber-500/20 border-amber-400 text-white font-black shadow-md shadow-amber-500/10"
                              : srv.isOffer
                                ? "bg-amber-500/10 border-amber-500/30 text-amber-100 hover:bg-amber-500/20"
                                : "bg-black/40 border-white/10 text-slate-200 hover:bg-white/5"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1.5 w-full text-[11px]">
                            <span className="leading-snug break-words flex-1 font-bold">
                              {srv.isOffer && "👑 "}
                              {srv.nameAr}
                            </span>
                            <span className="font-mono text-amber-400 font-black shrink-0">{srv.price}ج</span>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-white/10">
                <button
                  type="button"
                  disabled={submittingWalkIn}
                  onClick={() => handleSubmitWalkInRouter("IN_CHAIR")}
                  className="py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition cursor-pointer disabled:opacity-50"
                >
                  💺 إجلاس فوري وبدء الجلسة الآن
                </button>
                <button
                  type="button"
                  disabled={submittingWalkIn}
                  onClick={() => handleSubmitWalkInRouter("WAITING")}
                  className="py-3 px-4 rounded-2xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-200 font-black text-xs transition cursor-pointer disabled:opacity-50"
                >
                  🛋️ تسجيل في صالة الانتظار
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 3: EDIT SERVICES ON WAITING TICKET
         ───────────────────────────────────────────────────────────── */}
      {editingWaitingTicket && (
        <div
          className="fixed inset-0 z-[120] overflow-y-auto bg-black/85 backdrop-blur-md flex items-start sm:items-center justify-center p-3 sm:p-4 pt-6 pb-8 font-sans"
          dir="rtl"
        >
          <div className="my-auto w-full max-w-lg bg-[#12121b] border-2 border-amber-500/45 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-sm font-black text-white">
                  تعديل خدمات ({editingWaitingTicket.customerName}) بالانتظار
                </h3>
                <p className="text-[11px] text-amber-400 font-mono">
                  #{editingWaitingTicket.ticketNumber} • الإجمالي: {editingWaitingTicket.finalAmount} ج.م
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingWaitingTicketId(null)}
                className="w-8 h-8 rounded-full bg-white/5 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {parseJsonArray(editingWaitingTicket.services).map((srv: any, idx: number) => (
                <div
                  key={idx}
                  className="p-2 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-white">{srv.nameAr}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-amber-400">{srv.price} ج</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveServiceFromTicket(editingWaitingTicket.id, idx)}
                      className="text-rose-400 hover:bg-rose-500/20 p-1 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pt-2 border-t border-white/10 pb-1">
              {Object.entries(CATEGORY_LABELS).map(([catKey, catLabel]) => (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => setWaitingEditCategory(catKey)}
                  className={`py-1 px-2 rounded-lg text-[10px] font-black whitespace-nowrap border cursor-pointer ${
                    waitingEditCategory === catKey
                      ? "bg-amber-500 text-slate-950 border-amber-400"
                      : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
                  }`}
                >
                  {catLabel}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pt-1">
              {getCombinedCatalogItems(editingWaitingTicket.branchId)
                .filter((it) => waitingEditCategory === "ALL" || it.category === waitingEditCategory)
                .map((srv) => (
                  <button
                    key={srv.id}
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleAddServiceToTicket(editingWaitingTicket.id, srv)}
                    className={`p-2.5 rounded-xl border text-right text-xs transition cursor-pointer ${
                      srv.isOffer
                        ? "bg-amber-500/5 hover:bg-amber-500/20 border-amber-500/25"
                        : "bg-white/5 hover:bg-amber-500/20 border-white/10"
                    }`}
                  >
                    <span className="font-bold text-white block leading-snug break-words">
                      {srv.isOffer && "👑 "}
                      {srv.nameAr}
                    </span>
                    <span className="font-mono text-amber-400 text-[11px] font-black">+ {srv.price} ج.م</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 4: SEAT PICKER (FOR WAITING CLIENT OR ONLINE BOOKING)
         ───────────────────────────────────────────────────────────── */}
      {seatPickerTarget && (
        <div
          className="fixed inset-0 z-[120] overflow-y-auto bg-black/85 backdrop-blur-md flex items-start sm:items-center justify-center p-3 sm:p-4 pt-6 pb-8 font-sans"
          dir="rtl"
        >
          <div className="my-auto w-full max-w-md bg-[#12121b] border-2 border-amber-500/45 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-sm font-black text-white">
                  توجيه وإجلاس:{" "}
                  {seatPickerTarget.type === "BOOKING"
                    ? seatPickerTarget.record.customer?.name
                    : seatPickerTarget.record.customerName}
                </h3>
                <p className="text-[11px] text-slate-400">
                  اختر الكابتن والكرسي لبدء الخدمة أو إدخاله للاستراحة
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSeatPickerTarget(null)}
                className="w-8 h-8 rounded-full bg-white/5 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {specialists
                .filter((sp) => sp.branchId === seatPickerTarget.record.branchId)
                .map((sp) => {
                  const free = sp.status === "AVAILABLE" && !activeTicketBySpecId.has(sp.id);
                  return (
                    <div
                      key={sp.id}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-2 ${
                        free
                          ? "bg-emerald-500/10 border-emerald-500/40"
                          : "bg-black/40 border-white/10"
                      }`}
                    >
                      <div>
                        <h4 className="font-black text-xs text-white">{sp.name}</h4>
                        <span className="text-[10px] text-slate-400">
                          كرسي #{sp.chairNumber} • {free ? "متاح الآن 🟢" : "مشغول 🔴"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => {
                            if (seatPickerTarget.type === "WAITING_TICKET") {
                              handleSeatWaitingTicket(seatPickerTarget.record, sp.id);
                            } else {
                              handleRouteBookingToFloor(seatPickerTarget.record, sp.id, "IN_CHAIR");
                            }
                          }}
                          className="py-1.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] cursor-pointer"
                        >
                          إجلاس الآن 💺
                        </button>

                        {seatPickerTarget.type === "BOOKING" && (
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() =>
                              handleRouteBookingToFloor(seatPickerTarget.record, sp.id, "WAITING")
                            }
                            className="py-1.5 px-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-[11px] font-bold cursor-pointer"
                          >
                            استراحة 🛋️
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 5: BOOKING RESCHEDULE & SPECIALIST ASSIGNMENT
         ───────────────────────────────────────────────────────────── */}
      {editingBooking && (
        <div
          className="fixed inset-0 z-[120] overflow-y-auto bg-black/85 backdrop-blur-md flex items-start sm:items-center justify-center p-3 sm:p-4 pt-6 pb-8 font-sans"
          dir="rtl"
        >
          <div className="my-auto w-full max-w-lg bg-[#12121b] border-2 border-amber-500/45 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-sm font-black text-white">
                  تنسيق موعد وحجز #{editingBooking.bookingNumber}
                </h3>
                <p className="text-[11px] text-amber-300 font-bold">
                  العميل: {editingBooking.customer?.name} ({editingBooking.customer?.phone})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingBooking(null)}
                className="w-8 h-8 rounded-full bg-white/5 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBookingSchedule} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">التاريخ:</label>
                  <input
                    type="date"
                    required
                    value={bookingForm.bookingDate}
                    onChange={(e) => setBookingForm({ ...bookingForm, bookingDate: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/15 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">المتخصص المخصص:</label>
                  <select
                    value={bookingForm.specialistId}
                    onChange={(e) => setBookingForm({ ...bookingForm, specialistId: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/15 text-white font-bold"
                  >
                    <option value="">⚡ أول كرسي يفضى بالمحل</option>
                    {specialists
                      .filter((s) => s.branchId === editingBooking.branchId)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} (كرسي #{s.chairNumber})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1.5">الموعد:</label>
                <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto p-2 rounded-2xl bg-black/40 border border-white/10">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setBookingForm({ ...bookingForm, timeSlot: slot })}
                      className={`py-1.5 rounded-xl font-mono text-[10px] font-bold cursor-pointer ${
                        bookingForm.timeSlot === slot
                          ? "bg-amber-500 text-slate-950 font-black"
                          : "bg-white/5 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">ملاحظات / رسالة التنسيق:</label>
                <input
                  type="text"
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/15 text-white"
                />
              </div>

              <label className="flex items-center gap-2 text-slate-300 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={bookingForm.notifyCustomer}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, notifyCustomer: e.target.checked })
                  }
                  className="rounded"
                />
                <span>إرسال إشعار بالموعد الجديد تلقائياً للعميل في الشات 💬</span>
              </label>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer"
              >
                اعتماد وحفظ تنسيق الحجز ✅
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 6: SPECIALISTS SHIFT ATTENDANCE CONTROL
         ───────────────────────────────────────────────────────────── */}
      {showShiftModal && (
        <div
          className="fixed inset-0 z-[120] overflow-y-auto bg-black/85 backdrop-blur-md flex items-start sm:items-center justify-center p-3 sm:p-4 pt-6 pb-8 font-sans"
          dir="rtl"
        >
          <div className="my-auto w-full max-w-2xl bg-[#12121b] border-2 border-amber-500/45 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-black text-white">إدارة حضور وورديات المتخصصين اليوم 💈</h3>
                <p className="text-xs text-slate-400">
                  حدّد من المتاح الآن أو في استراحة أو انتهت ورديته
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowShiftModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 max-h-[65vh] overflow-y-auto pr-1">
              {specialists.map((spec) => (
                <div
                  key={spec.id}
                  className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                >
                  <div>
                    <h4 className="font-black text-xs text-white">
                      {spec.name}{" "}
                      <span className="text-amber-400 font-mono">(كرسي #{spec.chairNumber})</span>
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      {spec.branchName} • {spec.statusReason || spec.title}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1 text-[11px] font-bold">
                    {[
                      { st: "AVAILABLE", lbl: "حاضر 🟢", rsn: "حاضر وبدأ الوردية" },
                      { st: "BREAK", lbl: "استراحة ☕", rsn: "استراحة قصيرة" },
                      { st: "OFF_DUTY", lbl: "انتهى 🏠", rsn: "انتهت الوردية ومشي" },
                      { st: "DAY_OFF", lbl: "إجازة 🏖️", rsn: "إجازة رسمية" },
                    ].map((opt) => (
                      <button
                        key={opt.st}
                        type="button"
                        onClick={() => handleQuickShiftStatus(spec.id, opt.st, opt.rsn)}
                        className={`py-1 px-2.5 rounded-xl border transition cursor-pointer ${
                          spec.status === opt.st
                            ? "bg-amber-500 text-slate-950 border-amber-400 font-black"
                            : "bg-white/5 hover:bg-white/10 text-slate-300 border-white/10"
                        }`}
                      >
                        {opt.lbl}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          FLOATING TOAST NOTIFICATION
         ───────────────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[150] max-w-md w-[92%] sm:w-auto font-sans">
          <div
            className={`py-3 px-4 rounded-2xl shadow-2xl border backdrop-blur-xl flex items-center gap-3 text-xs font-black ${
              toast.type === "success"
                ? "bg-emerald-950/95 border-emerald-500/60 text-emerald-200"
                : toast.type === "error"
                ? "bg-rose-950/95 border-rose-500/60 text-rose-200"
                : "bg-amber-950/95 border-amber-500/60 text-amber-200"
            }`}
          >
            <span>{toast.type === "success" ? "✅" : toast.type === "error" ? "⚠️" : "ℹ️"}</span>
            <span className="flex-1 leading-relaxed">{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-white/70 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
