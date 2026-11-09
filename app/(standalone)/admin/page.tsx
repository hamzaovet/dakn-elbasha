"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CardQRModal from "@/components/CardQRModal";
import {
  LayoutDashboard,
  Scissors,
  Users,
  ShoppingBag,
  Calendar,
  Settings,
  DollarSign,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  LogOut,
  MapPin,
  Clock,
  UserCheck,
  UserX,
  Lock,
  Unlock,
  AlertTriangle,
  QrCode,
  ExternalLink,
  Search,
  CheckCircle2,
  X,
  CreditCard,
  Banknote,
  Smartphone,
  Phone,
  Mail,
  Award,
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  MessageSquare,
  Send,
  CheckCheck,
  Check,
  Tag,
  Eye,
  Upload,
  FileText,
  Printer,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  Wallet,
} from "lucide-react";

export default function AdminPage() {
  const router = useRouter();

  // Auth & Permissions
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("ALL");

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "treasury"
    | "specialists"
    | "services"
    | "offers"
    | "inventory"
    | "bookings"
    | "chat"
    | "customers"
    | "users"
    | "branches"
    | "settings"
  >("overview");

  // Data States
  const [settings, setSettings] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [specialists, setSpecialists] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Treasury, Cash Accounts & Shifts States
  const [treasuryPeriod, setTreasuryPeriod] = useState<string>("TODAY");
  const [treasurySummary, setTreasurySummary] = useState<any>(null);
  const [treasuryTransactions, setTreasuryTransactions] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [specialistsSummary, setSpecialistsSummary] = useState<any[]>([]);
  const [specialistStatement, setSpecialistStatement] = useState<any>(null);
  const [selectedLedgerSpecialistId, setSelectedLedgerSpecialistId] = useState<string>("");
  const selectedLedgerSpecialistIdRef = useRef<string>("");
  const [specialistSubView, setSpecialistSubView] = useState<"CARDS" | "STATEMENT">("CARDS");

  const handleSelectLedgerSpecialist = (id: string) => {
    selectedLedgerSpecialistIdRef.current = id;
    setSelectedLedgerSpecialistId(id);
    fetchSpecialistStatement(id);
  };

  // Expense Modal State
  const [showExpenseModal, setShowExpenseModal] = useState<boolean>(false);
  const [expenseForm, setExpenseForm] = useState({
    amount: 0,
    category: "SUPPLIES",
    paymentMethod: "CASH",
    description: "",
    recipientName: "",
    branchId: "",
  });

  // Shift Close Modal in Admin
  const [showAdminCloseShiftModal, setShowAdminCloseShiftModal] = useState<boolean>(false);
  const [adminShiftStats, setAdminShiftStats] = useState<any>(null);
  const [adminOpenShift, setAdminOpenShift] = useState<any>(null);
  const [adminShiftForm, setAdminShiftForm] = useState({
    actualCash: 0,
    handedTo: "أ/ حمزة عباس (المايسترو - المالك) 👑",
    notes: "",
  });

  // Dynamic Settings Form State
  const [settingsForm, setSettingsForm] = useState({
    salonNameAr: "مجموعة صالونات وسبا الباشا VIP (دقن الباشا & حمام الباشا)",
    salonNameEn: "EL BASHA LUXURY SALON & SPA",
    logoUrl: "/dakn-logo.jpg",
    hadayekPhone: "01210103025",
    nasrCityPhone: "01556782015",
    hotline: "01210103025",
    whatsappNumber: "01210103025",
    facebookUrl: "https://www.facebook.com/DaknElbashaSalon",
    instagramUrl: "https://www.facebook.com/hammam.elbasha1/",
    defaultOpenHour: "11:00 AM",
    defaultCloseHour: "01:00 AM",
    weeklyDayOff: "MONDAY",
    isDayOffEnabled: true,
    dayOffMessage: "عفواً، صالونات وسبا الباشا في عطلة أسبوعية يوم الإثنين - نتشرف بحجز موعدكم طوال باقي أيام الأسبوع ✂️",
    bookingSlotInterval: 30,
    reminderMinutesBefore: 15,
    receiptFooterNotes: "شكراً لزيارتكم مجموعة صالونات وسبا الباشا VIP 👑 تجربة ملكية استثنائية",
    systemLocked: false,
    lockMessage: "النظام مغلق مؤقتاً لأعمال الصيانة والتطوير الدوري.",
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Reschedule Booking Modal State
  const [showRescheduleModal, setShowRescheduleModal] = useState<boolean>(false);
  const [rescheduleTargetBooking, setRescheduleTargetBooking] = useState<any>(null);
  const [rescheduleForm, setRescheduleForm] = useState({
    bookingDate: "",
    timeSlot: "06:00 PM",
    notes: "تم اقتراح موعد بديل لتفادي الزحمة وضمان أفضل خدمة لك 💈",
    notifyCustomer: true,
  });

  // Audio Alarm State for Bookings
  const [alarmBooking, setAlarmBooking] = useState<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const alarmIntervalRef = useRef<any>(null);
  const lastAcknowledgedBookingId = useRef<string | null>(null);

  // Modals States
  const [showQrModal, setShowQrModal] = useState(false);

  // Specialist Modal (Create/Edit)
  const [showSpecialistModal, setShowSpecialistModal] = useState(false);
  const [editingSpecialist, setEditingSpecialist] = useState<any>(null);
  const [specForm, setSpecForm] = useState({
    name: "",
    phone: "",
    title: "خبير حلاقة وتصفيف",
    branchId: "",
    chairNumber: 1,
    payType: "SALARY_PLUS_COMMISSION",
    baseSalary: 6000,
    commissionRate: 20,
    photo: "",
    username: "",
    password: "",
  });

  // Payout / Advance Modal
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutSpecialist, setPayoutSpecialist] = useState<any>(null);
  const [payoutType, setPayoutType] = useState<string>("ADVANCE_WITHDRAWAL");
  const [payoutAmount, setPayoutAmount] = useState<number>(500);
  const [payoutNotes, setPayoutNotes] = useState<string>("");

  // Shift Attendance Status Modal
  const [showShiftStatusModal, setShowShiftStatusModal] = useState(false);
  const [statusTargetSpecialist, setStatusTargetSpecialist] = useState<any>(null);
  const [newShiftStatus, setNewShiftStatus] = useState<string>("AVAILABLE");
  const [shiftStatusReason, setShiftStatusReason] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Service Modal (Create/Edit)
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [serviceForm, setServiceForm] = useState({
    nameAr: "",
    category: "HAIR",
    price: 150,
    durationMinutes: 30,
    description: "",
    image: "",
    sortOrder: 0,
    isActive: true,
  });

  // Offer Modal (Create/Edit)
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<any>(null);
  const [offerForm, setOfferForm] = useState({
    titleAr: "",
    badge: "خصم 46% 🔥",
    price: 1000,
    oldPrice: 1350,
    discountPercent: 26,
    image: "/offers/offer-vip-1000.jpg",
    description: "",
    features: "قص شعر وتدريج عالمي\nتحديد دقن بالموس والبخار\nسشوار وتصفيف احترافي",
    branchId: "",
    isActive: true,
    sortOrder: 1,
  });

  // Product & Raw Materials Modal (Create/Edit)
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productForm, setProductForm] = useState({
    nameAr: "",
    category: "STYLING",
    price: 180,
    costPrice: 100,
    stockQty: 50,
    minStockAlert: 10,
    image: "",
    barcode: "",
    branchId: "",
    isActive: true,
  });
  const [productTypeFilter, setProductTypeFilter] = useState<"ALL" | "RETAIL" | "SUPPLIES">("ALL");
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>("ALL");
  const [productSearch, setProductSearch] = useState("");

  // VIP Admin Toast Notification (No Native Windows Alerts!)
  const [adminToast, setAdminToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const showToast = (type: "success" | "error" | "info", message: string) => {
    setAdminToast({ type, message });
    setTimeout(() => {
      setAdminToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  // Branch Modal
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [branchForm, setBranchForm] = useState({
    name: "",
    code: "",
    address: "",
    phone: "01121537537",
    whatsapp: "01121537537",
  });

  // User Modal (Create & Full Edit)
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userForm, setUserForm] = useState({
    name: "",
    username: "",
    password: "",
    pin: "157230",
    role: "cashier",
    branchId: "",
    phone: "",
    isActive: true,
  });

  // Chat Tab State
  const [chatConversations, setChatConversations] = useState<any[]>([]);
  const [activeChatCustomer, setActiveChatCustomer] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatReplyText, setChatReplyText] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [unreadChatTotal, setUnreadChatTotal] = useState(0);

  // Bookings Filter
  const [bookingFilterStatus, setBookingFilterStatus] = useState<string>("ALL");

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
        user.role !== "owner" &&
        user.role !== "general_manager" &&
        user.role !== "manager"
      ) {
        router.push("/login");
        return;
      }
      setCurrentUser(user);
      if (user.branchId && user.role === "manager") {
        setSelectedBranchId(user.branchId);
      }
    } catch {
      router.push("/login");
    }
  }, [router]);

  // Audio Alarm Logic (Web Audio API Synthesizer - Royal Chime)
  const startAlarmSound = () => {
    try {
      if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
      const playBeep = () => {
        try {
          if (!audioCtxRef.current) {
            const AC = window.AudioContext || (window as any).webkitAudioContext;
            if (AC) audioCtxRef.current = new AC();
          }
          const ctx = audioCtxRef.current;
          if (!ctx) return;
          if (ctx.state === "suspended") ctx.resume();

          const now = ctx.currentTime;
          // Three royal harmonic chime tones
          [[880, 0], [1174.66, 0.2], [1760, 0.4]].forEach(([freq, delay]) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.5, now + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.3);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + delay);
            osc.stop(now + delay + 0.35);
          });
        } catch {}
      };

      playBeep();
      alarmIntervalRef.current = setInterval(playBeep, 2500);
    } catch {}
  };

  const isBookingMuted = (bookingId: string) => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("basha_muted_bookings") || localStorage.getItem("saddam_muted_bookings") || "[]"
      );
      return saved.includes(bookingId);
    } catch {
      return false;
    }
  };

  const stopAlarmSound = (bookingIdToMute?: string) => {
    const id = bookingIdToMute || alarmBooking?.id;
    if (id) {
      try {
        const saved = JSON.parse(
        localStorage.getItem("basha_muted_bookings") || localStorage.getItem("saddam_muted_bookings") || "[]"
      );
        if (!saved.includes(id)) {
          saved.push(id);
          localStorage.setItem("basha_muted_bookings", JSON.stringify(saved.slice(-50)));
        }
      } catch {}
      lastAcknowledgedBookingId.current = id;
    }
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
    setAlarmBooking(null);
  };

  // Load All Admin Data
  const loadAllData = async () => {
    try {
      setLoading(true);
      const [
        resSet,
        resB,
        resSpec,
        resS,
        resO,
        resP,
        resBk,
        resCust,
        resU,
        resT,
        resL,
        resChat,
        resTreasury,
        resShifts,
      ] = await Promise.all([
        fetch("/api/settings"),
        fetch("/api/branches"),
        fetch(`/api/specialists?activeOnly=false`),
        fetch("/api/services?activeOnly=false"),
        fetch("/api/offers?activeOnly=false"),
        fetch("/api/products"),
        fetch("/api/bookings"),
        fetch("/api/customers"),
        fetch("/api/users"),
        fetch("/api/tickets"),
        fetch(`/api/ledgers?specialistId=${selectedLedgerSpecialistIdRef.current || ""}&branchId=${selectedBranchId}`),
        fetch("/api/chat?limit=50"),
        fetch(`/api/treasury?period=${treasuryPeriod}&branchId=${selectedBranchId}`),
        fetch(`/api/shifts?branchId=${selectedBranchId}`),
      ]);

      const [
        dataSet,
        dataB,
        dataSpec,
        dataS,
        dataO,
        dataP,
        dataBk,
        dataCust,
        dataU,
        dataT,
        dataL,
        dataChat,
        dataTreasury,
        dataShifts,
      ] = await Promise.all([
        resSet.json(),
        resB.json(),
        resSpec.json(),
        resS.json(),
        resO.json(),
        resP.json(),
        resBk.json(),
        resCust.json(),
        resU.json(),
        resT.json(),
        resL.json(),
        resChat.json(),
        resTreasury.json(),
        resShifts.json(),
      ]);

      if (dataSet.success && dataSet.settings) {
        setSettings(dataSet.settings);
        setSettingsForm((prev) => ({ ...prev, ...dataSet.settings }));
      }
      if (dataB.success && dataB.branches) {
        setBranches(dataB.branches);
        if (dataB.branches.length > 0 && !specForm.branchId) {
          setSpecForm((prev) => ({ ...prev, branchId: dataB.branches[0].id }));
        }
      }
      if (dataSpec.success && dataSpec.specialists) {
        setSpecialists(dataSpec.specialists);
        if (!selectedLedgerSpecialistIdRef.current && dataSpec.specialists.length > 0) {
          selectedLedgerSpecialistIdRef.current = dataSpec.specialists[0].id;
          setSelectedLedgerSpecialistId(dataSpec.specialists[0].id);
        }
      }
      if (dataS.success && dataS.services) setServices(dataS.services);
      if (dataO.success && dataO.offers) setOffers(dataO.offers);
      if (dataP.success && dataP.products) setProducts(dataP.products);
      if (dataCust.success && dataCust.customers) setCustomers(dataCust.customers);
      if (dataU.success && dataU.users) setUsers(dataU.users);
      if (dataT.success && dataT.tickets) setTickets(dataT.tickets);
      if (dataL.success && dataL.ledgers) {
        setLedgers(dataL.ledgers);
        if (dataL.statement) {
          if (!selectedLedgerSpecialistIdRef.current || dataL.statement.specialist?.id === selectedLedgerSpecialistIdRef.current) {
            setSpecialistStatement(dataL.statement);
          }
        }
        if (dataL.specialistsSummary) setSpecialistsSummary(dataL.specialistsSummary);
      }
      if (dataTreasury.success && dataTreasury.summary) {
        setTreasurySummary(dataTreasury.summary);
        setTreasuryTransactions(dataTreasury.transactions || []);
      }
      if (dataShifts.success && dataShifts.shifts) {
        setShifts(dataShifts.shifts);
      }

      // Bookings & Audio Alarm Check
      if (dataBk.success && dataBk.bookings) {
        setBookings(dataBk.bookings);
        const pendingBookings = dataBk.bookings.filter(
          (b: any) =>
            b.status === "PENDING" &&
            (selectedBranchId === "ALL" || b.branchId === selectedBranchId)
        );
        const newest = pendingBookings[0];
        if (
          newest &&
          newest.id !== lastAcknowledgedBookingId.current &&
          !isBookingMuted(newest.id) &&
          !alarmBooking
        ) {
          setAlarmBooking(newest);
          startAlarmSound();
        }
      }

      // Chat Data
      if (dataChat.success) {
        setChatConversations(dataChat.conversations || []);
        const totalUnread = (dataChat.conversations || []).reduce(
          (sum: number, c: any) => sum + (c.unreadCount || 0),
          0
        );
        setUnreadChatTotal(totalUnread);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecialistStatement = async (specId: string) => {
    if (!specId) return;
    try {
      const res = await fetch(`/api/ledgers?specialistId=${specId}&branchId=${selectedBranchId}`);
      const data = await res.json();
      if (data.success) {
        if (data.statement) setSpecialistStatement(data.statement);
        if (data.ledgers) setLedgers(data.ledgers);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadAllData();
      const interval = setInterval(loadAllData, 4000);
      return () => clearInterval(interval);
    }
  }, [currentUser, selectedBranchId]);

  // Master Kill Switch Toggle
  const handleToggleKillSwitch = async () => {
    if (currentUser?.role !== "owner") {
      showToast("error", "عفواً، خاصية تعطيل النظام بالكامل مخصصة للمالك فقط (Maestro)");
      return;
    }

    const currentLocked = settings?.systemLocked || false;
    const confirmMsg = currentLocked
      ? "هل تريد إلغاء قفل النظام وإعادة تفعيله لجميع المستخدمين؟"
      : "⚠️ تحذير أمني: هل تريد قفل النظام بالكامل وتعطيل دخول جميع الموظفين مؤقتاً؟";

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemLocked: !currentLocked,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        showToast(
          "success",
          data.settings.systemLocked
            ? "تم قفل النظام بالكامل بنجاح 🔒"
            : "تم فتح النظام وإلغاء القفل بنجاح 🔓"
        );
      }
    } catch {
      showToast("error", "فشل تحديث حالة القفل");
    }
  };

  // Save General System Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsForm),
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        showToast("success", "تم حفظ وتحديث إعدادات الصالون والمنظومة بنجاح 👑💾");
      } else {
        showToast("error", data.error || "فشل حفظ الإعدادات");
      }
    } catch {
      showToast("error", "تعذر الاتصال بالخادم");
    } finally {
      setSavingSettings(false);
    }
  };

  // Open Reschedule Modal
  const handleOpenRescheduleModal = (bk: any) => {
    setRescheduleTargetBooking(bk);
    setRescheduleForm({
      bookingDate: bk.bookingDate || new Date().toISOString().split("T")[0],
      timeSlot: bk.timeSlot || "06:00 PM",
      notes: "تم اقتراح موعد بديل لتفادي الزحمة وضمان أفضل خدمة لك 💈",
      notifyCustomer: true,
    });
    setShowRescheduleModal(true);
  };

  // Execute Reschedule Booking
  const handleExecuteReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleTargetBooking) return;
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: rescheduleTargetBooking.id,
          status: "CONFIRMED",
          bookingDate: rescheduleForm.bookingDate,
          timeSlot: rescheduleForm.timeSlot,
          notes: rescheduleForm.notes,
          notifyCustomer: rescheduleForm.notifyCustomer,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", `تم اعتماد الموعد الجديد بنجاح وإشعار العميل عبر الشات ⏰`);
        setShowRescheduleModal(false);
        setRescheduleTargetBooking(null);
        await loadAllData();
      } else {
        showToast("error", data.error || "فشل تعديل الموعد");
      }
    } catch {
      showToast("error", "تعذر الاتصال بالخادم");
    }
  };

  // Booking Actions
  const handleUpdateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      if (alarmBooking?.id === bookingId) {
        stopAlarmSound(bookingId);
      }
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: bookingId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmAlarmBooking = (bookingId: string) => {
    handleUpdateBookingStatus(bookingId, "CONFIRMED");
    stopAlarmSound(bookingId);
  };

  // Open Chat from Booking
  const handleOpenChatFromBooking = (bk: any) => {
    setActiveTab("chat");
    const conv = {
      key: bk.customer?.phone || bk.customer?.id,
      customerId: bk.customerId,
      customerPhone: bk.customer?.phone,
      customerName: bk.customer?.name,
    };
    handleSelectCustomerChat(conv);
  };

  // Toggle User Active Status
  const handleToggleUserActive = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, isActive: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isActive: !currentStatus } : u))
        );
      } else {
        showToast("error", data.error || "فشل تعديل حالة الحساب");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Edit User Modal
  const handleOpenEditUser = (u: any) => {
    setEditingUser(u);
    setUserForm({
      name: u.name,
      username: u.username,
      password: "",
      pin: u.pin || "157230",
      role: u.role,
      branchId: u.branchId || "",
      phone: u.phone || "",
      isActive: u.isActive !== undefined ? u.isActive : true,
    });
    setShowUserModal(true);
  };

  // Open Create User Modal
  const handleOpenCreateUser = () => {
    setEditingUser(null);
    setUserForm({
      name: "",
      username: "",
      password: "",
      pin: "157230",
      role: "cashier",
      branchId: branches[0]?.id || "",
      phone: "",
      isActive: true,
    });
    setShowUserModal(true);
  };

  // Save or Update User
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const payload: any = {
          id: editingUser.id,
          name: userForm.name,
          username: userForm.username,
          phone: userForm.phone,
          role: userForm.role,
          branchId: userForm.branchId || null,
          pin: userForm.pin,
          isActive: userForm.isActive,
        };
        if (userForm.password.trim()) {
          payload.password = userForm.password.trim();
        }

        const res = await fetch("/api/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          const branchObj = branches.find((b) => b.id === userForm.branchId);
          setUsers((prev) =>
            prev.map((u) =>
              u.id === editingUser.id
                ? {
                    ...u,
                    ...data.user,
                    branchName: branchObj?.name || "إشراف عام على كل الفروع",
                  }
                : u
            )
          );
          setShowUserModal(false);
          setEditingUser(null);
          showToast("success", "تم حفظ وتحديث بيانات المستخدم بنجاح! ✅");
        } else {
          showToast("error", data.error || "فشل تعديل المستخدم");
        }
      } else {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userForm),
        });
        const data = await res.json();
        if (data.success) {
          await loadAllData();
          setShowUserModal(false);
          showToast("success", "تم إضافة المستخدم بنجاح! ✅");
        } else {
          showToast("error", data.error || "فشل إضافة المستخدم");
        }
      }
    } catch {
      showToast("error", "تعذر الاتصال بالخادم");
    }
  };

  // Offers Actions
  const handleOpenCreateOffer = () => {
    setEditingOffer(null);
    setOfferForm({
      titleAr: "",
      badge: "خصم 46% 🔥",
      price: 1000,
      oldPrice: 1350,
      discountPercent: 26,
      image: "/offers/offer-vip-1000.jpg",
      description: "",
      features: "قص شعر وتدريج عالمي\nتحديد دقن بالموس والبخار\nسشوار وتصفيف احترافي",
      branchId: "",
      isActive: true,
      sortOrder: (offers.length || 0) + 1,
    });
    setShowOfferModal(true);
  };

  const handleOpenEditOffer = (offer: any) => {
    setEditingOffer(offer);
    let featuresStr = "";
    try {
      const parsed = JSON.parse(offer.features || "[]");
      featuresStr = Array.isArray(parsed) ? parsed.join("\n") : "";
    } catch {
      featuresStr = offer.features || "";
    }

    setOfferForm({
      titleAr: offer.titleAr,
      badge: offer.badge || "",
      price: offer.price,
      oldPrice: offer.oldPrice || "",
      discountPercent: offer.discountPercent || "",
      image: offer.image || "/offers/offer-vip-1000.jpg",
      description: offer.description || "",
      features: featuresStr,
      branchId: offer.branchId || "",
      isActive: offer.isActive,
      sortOrder: offer.sortOrder || 1,
    });
    setShowOfferModal(true);
  };

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const featuresArr = offerForm.features
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean);

      const payload = {
        titleAr: offerForm.titleAr,
        badge: offerForm.badge,
        price: Number(offerForm.price),
        oldPrice: offerForm.oldPrice ? Number(offerForm.oldPrice) : null,
        discountPercent: offerForm.discountPercent ? Number(offerForm.discountPercent) : null,
        image: offerForm.image,
        description: offerForm.description,
        features: featuresArr,
        branchId: offerForm.branchId || null,
        isActive: offerForm.isActive,
        sortOrder: Number(offerForm.sortOrder),
      };

      if (editingOffer) {
        const res = await fetch("/api/offers", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingOffer.id, ...payload }),
        });
        const data = await res.json();
        if (data.success) {
          setOffers((prev) =>
            prev.map((o) => (o.id === editingOffer.id ? { ...o, ...data.offer } : o))
          );
          setShowOfferModal(false);
          setEditingOffer(null);
          showToast("success", "تم تعديل العرض الملكي بنجاح! 👑");
        } else {
          showToast("error", data.error || "فشل تعديل العرض");
        }
      } else {
        const res = await fetch("/api/offers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          setOffers((prev) => [...prev, data.offer]);
          setShowOfferModal(false);
          showToast("success", "تم إضافة العرض الملكي الجديد بنجاح! 👑");
        } else {
          showToast("error", data.error || "فشل إضافة العرض");
        }
      }
    } catch {
      showToast("error", "تعذر الاتصال بالخادم");
    }
  };

  const handleDeleteOffer = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا العرض الملكي نهائياً؟")) return;
    try {
      const res = await fetch(`/api/offers?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setOffers((prev) => prev.filter((o) => o.id !== id));
        showToast("success", "تم حذف العرض بنجاح 🗑️");
      } else {
        showToast("error", data.error || "فشل الحذف");
      }
    } catch {
      showToast("error", "تعذر الاتصال بالخادم");
    }
  };

  const handleToggleOfferActive = async (offer: any) => {
    try {
      const res = await fetch("/api/offers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: offer.id, isActive: !offer.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        setOffers((prev) =>
          prev.map((o) => (o.id === offer.id ? { ...o, isActive: !offer.isActive } : o))
        );
      }
    } catch {}
  };

  // Chat Tab Actions
  const handleSelectCustomerChat = async (conv: any) => {
    setActiveChatCustomer(conv);
    try {
      const res = await fetch(
        `/api/chat?customerPhone=${encodeURIComponent(
          conv.customerPhone || ""
        )}&customerId=${encodeURIComponent(conv.customerId || "")}`
      );
      const data = await res.json();
      if (data.success) {
        setChatMessages(data.messages || []);
        // Mark read
        await fetch("/api/chat", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerPhone: conv.customerPhone,
            customerId: conv.customerId,
          }),
        });
        setChatConversations((prev) =>
          prev.map((c) => (c.key === conv.key ? { ...c, unreadCount: 0 } : c))
        );
      }
    } catch {}
  };

  const handleSendAdminReply = async (textToSend?: string) => {
    const text = (textToSend || chatReplyText).trim();
    if (!text || !activeChatCustomer) return;
    try {
      setChatSending(true);
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: "SALON",
          senderName: `${currentUser?.name || "إدارة مجموعة الباشا VIP"} 👑`,
          message: text,
          customerPhone: activeChatCustomer.customerPhone,
          customerId: activeChatCustomer.customerId,
          customerName: activeChatCustomer.customerName,
          branchId: selectedBranchId !== "ALL" ? selectedBranchId : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setChatMessages((prev) => [...prev, data.chatMessage]);
        setChatReplyText("");
      }
    } catch {
      showToast("error", "فشل إرسال الرد");
    } finally {
      setChatSending(false);
    }
  };

  // Specialist Actions
  const handleSaveSpecialist = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = "/api/specialists";
      const method = editingSpecialist ? "PATCH" : "POST";
      const body = editingSpecialist
        ? { id: editingSpecialist.id, ...specForm }
        : specForm;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        await loadAllData();
        setShowSpecialistModal(false);
        setEditingSpecialist(null);
        showToast("success", "تم حفظ بيانات المتخصص بنجاح ✂️");
      } else {
        showToast("error", data.error || "فشل حفظ بيانات المتخصص");
      }
    } catch {
      showToast("error", "تعذر الاتصال بالخادم");
    }
  };

  const handleDeleteSpecialist = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف المتخصص "${name}" نهائياً من السيستم؟`)) return;
    try {
      const res = await fetch(`/api/specialists?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        await loadAllData();
        showToast("success", `تم حذف المتخصص "${name}" بنجاح 🗑️`);
      } else {
        showToast("error", data.error || "فشل حذف المتخصص");
      }
    } catch {
      showToast("error", "تعذر الاتصال بالخادم");
    }
  };

  const handleOpenShiftModal = (spec: any) => {
    setStatusTargetSpecialist(spec);
    setNewShiftStatus(spec.status || "AVAILABLE");
    setShiftStatusReason(spec.statusReason || "");
    setShowShiftStatusModal(true);
  };

  const handleSaveShiftStatus = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!statusTargetSpecialist) return;
    try {
      const res = await fetch("/api/specialists", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: statusTargetSpecialist.id,
          status: newShiftStatus,
          statusReason: shiftStatusReason.trim() || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await loadAllData();
        setShowShiftStatusModal(false);
        setStatusTargetSpecialist(null);
        showToast("success", "تم تحديث حالة الوردية والحضور بنجاح 🟢");
      } else {
        showToast("error", data.error || "فشل تحديث حالة الوردية");
      }
    } catch {
      showToast("error", "تعذر الاتصال بالخادم");
    }
  };

  const handleQuickSetStatus = async (spec: any, status: string, reason: string) => {
    try {
      const res = await fetch("/api/specialists", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: spec.id,
          status,
          statusReason: reason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await loadAllData();
      }
    } catch {}
  };

  const handleRecordPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutSpecialist) return;

    try {
      const res = await fetch("/api/ledgers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          specialistId: payoutSpecialist.id,
          branchId: payoutSpecialist.branchId,
          type: payoutType,
          amount: Number(payoutAmount),
          notes: payoutNotes,
          recordedBy: currentUser?.name || "المالك (Maestro)",
        }),
      });

      const data = await res.json();
      if (data.success) {
        await loadAllData();
        setShowPayoutModal(false);
        showToast("success", "تم تسجيل المعاملة المالية في سجل المتخصص والخزينة بنجاح! 💵");
      } else {
        showToast("error", data.error || "فشل تسجيل الحركة المالية");
      }
    } catch {
      showToast("error", "تعذر الاتصال بالخادم");
    }
  };

  // Service Actions
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = "/api/services";
      const method = editingService ? "PATCH" : "POST";
      const body = editingService ? { id: editingService.id, ...serviceForm } : serviceForm;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        await loadAllData();
        setShowServiceModal(false);
        setEditingService(null);
        showToast("success", "تم حفظ بيانات الخدمة بنجاح 💈");
      } else {
        showToast("error", data.error || "فشل حفظ الخدمة");
      }
    } catch {
      showToast("error", "تعذر الاتصال بالخادم");
    }
  };

  // Upload image to ImgBB and return URL
  const handleUploadFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onSuccess: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        onSuccess(data.url);
      } else {
        showToast("error", data.error || "فشل رفع الصورة على ImgBB");
      }
    } catch {
      showToast("error", "تعذر الاتصال بخادم رفع الصور");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleOpenEditService = (srv: any) => {
    setEditingService(srv);
    setServiceForm({
      nameAr: srv.nameAr || "",
      category: srv.category || "HAIR",
      price: srv.price || 150,
      durationMinutes: srv.durationMinutes || 30,
      description: srv.description || "",
      image: srv.image || "",
      sortOrder: srv.sortOrder || 0,
      isActive: srv.isActive !== false,
    });
    setShowServiceModal(true);
  };

  const handleDeleteService = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف الخدمة "${name}" نهائياً من السيستم؟`)) return;
    try {
      const res = await fetch(`/api/services?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        await loadAllData();
        showToast("success", `تم حذف الخدمة "${name}" بنجاح 🗑️`);
      } else {
        showToast("error", data.error || "فشل حذف الخدمة");
      }
    } catch {
      showToast("error", "تعذر الاتصال بالخادم");
    }
  };

  const handleToggleServiceActive = async (srv: any) => {
    try {
      const res = await fetch("/api/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: srv.id, isActive: !srv.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        await loadAllData();
      }
    } catch {}
  };

  // ─────────────────────────────────────────────────────────────
  // Product & Raw Materials Handlers (CRUD & Live ImgBB)
  // ─────────────────────────────────────────────────────────────
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      nameAr: "",
      category: "STYLING",
      price: 180,
      costPrice: 100,
      stockQty: 50,
      minStockAlert: 10,
      image: "",
      barcode: "",
      branchId: selectedBranchId !== "ALL" ? selectedBranchId : "",
      isActive: true,
    });
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (prod: any) => {
    setEditingProduct(prod);
    setProductForm({
      nameAr: prod.nameAr || "",
      category: prod.category || "STYLING",
      price: prod.price || 0,
      costPrice: prod.costPrice || 0,
      stockQty: prod.stockQty !== undefined ? prod.stockQty : 50,
      minStockAlert: prod.minStockAlert !== undefined ? prod.minStockAlert : 10,
      image: prod.image || "",
      barcode: prod.barcode || "",
      branchId: prod.branchId || "",
      isActive: prod.isActive !== false,
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.nameAr.trim()) {
      showToast("error", "اسم المنتج أو الخامة مطلوب");
      return;
    }

    try {
      const isEditing = Boolean(editingProduct);
      const url = "/api/products";
      const method = isEditing ? "PATCH" : "POST";
      const payload = isEditing ? { id: editingProduct.id, ...productForm } : productForm;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        showToast(
          "success",
          isEditing ? "تم تحديث بيانات المنتج / الخامة بنجاح ✅" : "تمت إضافة المنتج / الخامة بنجاح إلى المخزن 🛍️"
        );
        setShowProductModal(false);
        setEditingProduct(null);
        await loadAllData();
      } else {
        showToast("error", data.error || "فشل حفظ المنتج");
      }
    } catch {
      showToast("error", "تعذر الاتصال بالخادم");
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف الصنف "${name}" نهائياً من المخزن؟`)) return;
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast("success", `تم حذف الصنف "${name}" بنجاح 🗑️`);
        await loadAllData();
      } else {
        showToast("error", data.error || "فشل حذف الصنف");
      }
    } catch {
      showToast("error", "تعذر الاتصال بالخادم");
    }
  };

  const handleAdjustStock = async (prod: any, diff: number) => {
    const newQty = Math.max(0, (prod.stockQty || 0) + diff);
    try {
      const res = await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: prod.id, stockQty: newQty }),
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === prod.id ? { ...p, stockQty: newQty } : p))
        );
        showToast("info", `تم تحديث رصيد (${prod.nameAr}) إلى ${newQty} عبوة`);
      }
    } catch {
      showToast("error", "فشل تحديث المخزون");
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Treasury & Expense Handlers
  // ─────────────────────────────────────────────────────────────
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.amount || !expenseForm.description.trim()) {
      showToast("error", "المبلغ والبيان مطلوبان لتسجيل المصروف");
      return;
    }
    try {
      const res = await fetch("/api/treasury", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...expenseForm,
          recordedBy: currentUser?.name || "المالك (Maestro)",
          branchId: expenseForm.branchId || (selectedBranchId !== "ALL" ? selectedBranchId : branches[0]?.id),
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", "تم تسجيل المصروف بالخزينة بنجاح 🧾");
        setShowExpenseModal(false);
        setExpenseForm({
          amount: 0,
          category: "SUPPLIES",
          paymentMethod: "CASH",
          description: "",
          recipientName: "",
          branchId: "",
        });
        await loadAllData();
      } else {
        showToast("error", data.error || "فشل تسجيل المصروف");
      }
    } catch {
      showToast("error", "تعذر الاتصال بالخادم");
    }
  };

  const handleOpenAdminCloseShift = async () => {
    try {
      const res = await fetch(`/api/shifts?branchId=${selectedBranchId}`);
      const data = await res.json();
      if (data.success) {
        setAdminShiftStats(data.liveStats);
        setAdminOpenShift(data.openShift);
        setAdminShiftForm({
          actualCash: data.liveStats?.expectedCash || 0,
          handedTo: "أ/ حمزة عباس (المايسترو - المالك) 👑",
          notes: "",
        });
        setShowAdminCloseShiftModal(true);
      }
    } catch {
      showToast("error", "تعذر جلب بيانات الوردية الحالية");
    }
  };

  const handleAdminExecuteCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminOpenShift) {
      showToast("error", "لا توجد وردية مفتوحة حالياً لهذا الفرع لتسليمها");
      return;
    }
    try {
      const res = await fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CLOSE",
          shiftId: adminOpenShift.id,
          actualCash: Number(adminShiftForm.actualCash),
          handedTo: adminShiftForm.handedTo,
          notes: adminShiftForm.notes,
          expectedCash: adminShiftStats?.expectedCash || 0,
          ticketsCount: adminShiftStats?.ticketsCount || 0,
          servicesTotal: adminShiftStats?.servicesTotal || 0,
          retailTotal: adminShiftStats?.retailTotal || 0,
          cashCollected: adminShiftStats?.cashCollected || 0,
          visaCollected: adminShiftStats?.visaCollected || 0,
          instapayCollected: adminShiftStats?.instapayCollected || 0,
          vodafoneCollected: adminShiftStats?.vodafoneCollected || 0,
          advancesPayouts: adminShiftStats?.advancesPayouts || 0,
          expensesTotal: adminShiftStats?.expensesTotal || 0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", `تم اعتماد وإقفال الوردية بنجاح وتسليم النقدية إلى (${adminShiftForm.handedTo}) 🔒`);
        setShowAdminCloseShiftModal(false);
        await loadAllData();
      } else {
        showToast("error", data.error || "فشل إقفال الوردية");
      }
    } catch {
      showToast("error", "تعذر الاتصال بالخادم");
    }
  };

  // Branch Actions
  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(branchForm),
      });
      const data = await res.json();
      if (data.success) {
        await loadAllData();
        setShowBranchModal(false);
        setBranchForm({
          name: "",
          code: "",
          address: "",
          phone: "01121537537",
          whatsapp: "01121537537",
        });
        showToast("success", "تم إضافة الفرع الجديد بنجاح 📍");
      } else {
        showToast("error", data.error || "فشل إضافة الفرع");
      }
    } catch {
      showToast("error", "تعذر الاتصال بالخادم");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("basha_staff_user");
    localStorage.removeItem("saddam_staff_user");
    router.push("/login");
  };

  // Filter Bookings by Tab / Status / Branch
  const filteredBookings = bookings.filter((bk) => {
    const matchBranch = selectedBranchId === "ALL" || bk.branchId === selectedBranchId;
    const matchStatus =
      bookingFilterStatus === "ALL" || bk.status === bookingFilterStatus;
    return matchBranch && matchStatus;
  });

  // Calculate Metrics
  const totalRevenue = tickets
    .filter((t) => selectedBranchId === "ALL" || t.branchId === selectedBranchId)
    .reduce((sum, t) => sum + (t.finalAmount || 0), 0);

  const totalClientsServed = tickets.filter(
    (t) => selectedBranchId === "ALL" || t.branchId === selectedBranchId
  ).length;

  const totalRetailSales = tickets
    .filter((t) => selectedBranchId === "ALL" || t.branchId === selectedBranchId)
    .reduce((sum, t) => sum + (t.retailTotal || 0), 0);

  return (
    <div className="min-h-screen bg-[#07070b] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black" dir="rtl">
      {/* ─────────────────────────────────────────────────────────────
          1. AUDIO ALARM BANNER (NEW PENDING BOOKINGS)
         ───────────────────────────────────────────────────────────── */}
      {alarmBooking && (
        <div className="bg-gradient-to-r from-rose-600 via-amber-600 to-rose-600 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 animate-pulse shadow-2xl z-50 border-b-2 border-amber-300">
          <div className="flex items-center gap-2.5 font-black text-xs sm:text-sm">
            <BellRing className="w-5 h-5 animate-bounce text-amber-200 shrink-0" />
            <span>
              🔔 جرس تنبيه عاجل: حجز موعد جديد بانتظار التأكيد! رقم #{alarmBooking.bookingNumber} للعميل (
              {alarmBooking.customer?.name || "عميل VIP"}) بمبلغ {alarmBooking.totalAmount} ج.م (
              {alarmBooking.branch?.name})
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleConfirmAlarmBooking(alarmBooking.id)}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition shadow-lg flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>عرض وتأكيد الموعد ✅</span>
            </button>
            <button
              onClick={() => stopAlarmSound(alarmBooking.id)}
              className="px-3.5 py-2 rounded-xl bg-black/60 hover:bg-black/80 text-white border border-white/20 font-bold text-xs transition flex items-center gap-1"
            >
              <VolumeX className="w-4 h-4 text-amber-300" />
              <span>كتم التنبيه 🔇</span>
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. TOP HEADER
         ───────────────────────────────────────────────────────────── */}
      <header className="bg-[#0f0f16] border-b border-amber-500/30 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl overflow-hidden border border-amber-400 shadow-md bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={settingsForm.logoUrl || "/dakn-logo.jpg"} alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-amber-400">
                لوحة إدارة مجموعة صالونات وسبا الباشا VIP
              </h2>
              <span className="py-0.5 px-2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/40">
                {currentUser?.role === "owner" ? "المالك (Maestro) 👑" : currentUser?.role}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-bold">
              مرحباً بك، أ / {currentUser?.name}
            </p>
          </div>
        </div>

        {/* Top Controls: Branch Switch, Kill Switch, POS link, QR, Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Branch Filter Switcher */}
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="py-1.5 px-3 rounded-xl bg-[#181822] border border-amber-500/30 text-xs font-bold text-amber-300 focus:outline-none"
          >
            <option value="ALL">إجمالي كل الفروع</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Master Kill Switch Toggle Button (Maestro Power) */}
          {currentUser?.role === "owner" && (
            <button
              onClick={handleToggleKillSwitch}
              className={`py-1.5 px-3 rounded-xl text-xs font-black transition flex items-center gap-1.5 border ${
                settings?.systemLocked
                  ? "bg-rose-600 text-white border-rose-400 animate-pulse"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
              }`}
              title="التحكم الأمني في قفل النظام بالكامل"
            >
              {settings?.systemLocked ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>النظام مغلق 🔒</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>النظام مفعّل 🔓</span>
                </>
              )}
            </button>
          )}

          {/* POS Shortcut */}
          <Link
            href="/pos"
            className="py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition hidden sm:inline"
          >
            نقطة البيع POS 💰
          </Link>

          {/* Card 2 QR */}
          <button
            onClick={() => setShowQrModal(true)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-amber-300 transition"
            title="كارت الـ 2 QR"
          >
            <QrCode className="w-4 h-4" />
          </button>

          <button
            onClick={loadAllData}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition"
            title="تحديث البيانات"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

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
          3. NAVIGATION TABS (RESPONSIVE & CLEAN MULTI-ROW WRAP)
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#0e0e14] border-b border-amber-500/20 px-3 sm:px-6 py-2.5">
        <div className="flex flex-wrap items-center gap-1.5 max-w-7xl mx-auto">
          {[
            { id: "overview", label: "نظرة عامة 📊", icon: LayoutDashboard },
            { id: "treasury", label: "الخزنة والحسابات 💰", icon: DollarSign },
            { id: "bookings", label: `الحجوزات 📅 ${bookings.filter(b => b.status === "PENDING").length > 0 ? `(${bookings.filter(b => b.status === "PENDING").length})` : ""}`, icon: Calendar },
            { id: "offers", label: "العروض الملكية 👑", icon: Sparkles },
            { id: "chat", label: `شات العملاء 💬 ${unreadChatTotal > 0 ? `(${unreadChatTotal})` : ""}`, icon: MessageSquare },
            { id: "specialists", label: "المتخصصين وكشف الأجور ✂️", icon: Scissors },
            { id: "services", label: "الخدمات والأسعار 💈", icon: Award },
            { id: "inventory", label: "المخزن والتجميل 🛍️", icon: ShoppingBag },
            { id: "customers", label: "قاعدة العملاء 👥", icon: Users },
            { id: "users", label: "الصلاحيات والمستخدمين 🔒", icon: ShieldCheck },
            { id: "branches", label: "الفروع 📍", icon: MapPin },
            { id: "settings", label: "الإعدادات ⚙️", icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-1.5 px-3 rounded-xl transition flex items-center gap-1.5 text-xs font-bold ${
                  isCurrent
                    ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/25 ring-1 ring-amber-400"
                    : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. MAIN CONTENT AREA
         ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* ========================================================
            TAB 1: OVERVIEW & SALES KPIS
           ======================================================== */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-3xl bg-[#14141e] border border-amber-500/30 space-y-2">
                <span className="text-xs text-slate-400 font-bold block">إجمالي الإيرادات</span>
                <p className="text-2xl font-black text-amber-400 font-mono">
                  {totalRevenue.toLocaleString()} ج.م
                </p>
                <span className="text-[10px] text-emerald-400 font-bold">شامل الخدمات والمبيعات</span>
              </div>

              <div className="p-4 rounded-3xl bg-[#14141e] border border-amber-500/30 space-y-2">
                <span className="text-xs text-slate-400 font-bold block">العملاء المخدومين</span>
                <p className="text-2xl font-black text-white font-mono">{totalClientsServed}</p>
                <span className="text-[10px] text-amber-300 font-bold">تذاكر حلاقة مكتملة</span>
              </div>

              <div className="p-4 rounded-3xl bg-[#14141e] border border-amber-500/30 space-y-2">
                <span className="text-xs text-slate-400 font-bold block">مبيعات مستحضرات التجميل</span>
                <p className="text-2xl font-black text-emerald-400 font-mono">
                  {totalRetailSales.toLocaleString()} ج.م
                </p>
                <span className="text-[10px] text-slate-400 font-bold">منتجات العناية بالكرسي والكاشير</span>
              </div>

              <div className="p-4 rounded-3xl bg-[#14141e] border border-amber-500/30 space-y-2">
                <span className="text-xs text-slate-400 font-bold block">الحجوزات القادمة</span>
                <p className="text-2xl font-black text-amber-300 font-mono">{bookings.length}</p>
                <span className="text-[10px] text-rose-400 font-bold">
                  {bookings.filter((b) => b.status === "PENDING").length} بانتظار التأكيد
                </span>
              </div>
            </div>

            {/* Quick Links & Shortcuts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-3xl bg-[#12121a] border border-white/5 space-y-3">
                <h4 className="font-black text-sm text-amber-400">📍 فروع مجموعة الباشا المفعّلة:</h4>
                <div className="space-y-2 text-xs">
                  {branches.map((b) => (
                    <div key={b.id} className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
                      <strong className="text-white block">{b.name}</strong>
                      <p className="text-slate-400 text-[11px]">{b.address}</p>
                      <p className="font-mono text-amber-300 text-[11px]">هاتف: {b.phone}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-[#12121a] border border-white/5 space-y-3">
                <h4 className="font-black text-sm text-amber-400">👑 العروض الملكية النشطة:</h4>
                <p className="text-xs text-slate-300 font-bold">
                  يوجد حالياً <strong className="text-amber-300 font-mono">{offers.length}</strong> عروض وباكدجات
                  مفعّلة على صفحة الحجز، بما فيها باكدجات العرسان والاسترخاء بخصومات تصل إلى 46%.
                </p>
                <button
                  onClick={() => setActiveTab("offers")}
                  className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition"
                >
                  إدارة العروض والباكدجات 👑
                </button>
              </div>

              <div className="p-5 rounded-3xl bg-[#12121a] border border-white/5 space-y-3">
                <h4 className="font-black text-sm text-amber-400">💬 الشات المباشر مع العملاء:</h4>
                <p className="text-xs text-slate-300">
                  تواصل فوري ولحظي مع الزبائن للرد على استفسارات المواعيد، عروض العرسان وتعديل الحجوزات.
                </p>
                <button
                  onClick={() => setActiveTab("chat")}
                  className="py-2 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                  <span>فتح نافذة المحادثات 💬</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB: TREASURY, CASH REGISTER & SHIFT HANDOVERS (الخزنة والحسابات وإقفال الوردية)
           ======================================================== */}
        {activeTab === "treasury" && (
          <div className="space-y-6 animate-fade-in">
            {/* Treasury Header & Control Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span>الخزنة والحسابات اليومية وإقفال الورديات 💰</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                    مباشر لحظي
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  متابعة شاملة لإيرادات الحلاقة، مبيعات المنتجات، النقدية بالدرج، وسجل تسليم الورديات للمالك 👑
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(true)}
                  className="py-2 px-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition flex items-center gap-1.5 border border-white/10 cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>تسجيل مصروف / نثريات 🧾</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenAdminCloseShift}
                  className="py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>إقفال وتسليم الوردية 🔒</span>
                </button>
              </div>
            </div>

            {/* Period Filter Buttons */}
            <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-2xl border border-white/10 w-fit flex-wrap">
              {[
                { id: "TODAY", label: "اليوم 📅" },
                { id: "YESTERDAY", label: "أمس ⏪" },
                { id: "WEEK", label: "هذا الأسبوع 📊" },
                { id: "MONTH", label: "هذا الشهر 🗓️" },
                { id: "ALL", label: "كل الفترات ♾️" },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setTreasuryPeriod(p.id)}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                    treasuryPeriod === p.id
                      ? "bg-amber-500 text-slate-950 font-black shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* 5 Financial Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {/* 1. Total Inflow */}
              <div className="p-4 rounded-3xl bg-[#14141e] border border-amber-500/30 space-y-2 relative overflow-hidden shadow-lg">
                <span className="text-xs text-slate-400 font-bold block">إجمالي الإيرادات (Inflow)</span>
                <p className="text-2xl font-black text-amber-400 font-mono">
                  {(treasurySummary?.totalRevenue || 0).toLocaleString()} ج.م
                </p>
                <div className="text-[10px] text-slate-400 space-y-0.5 pt-1 border-t border-white/5 font-medium">
                  <div className="flex justify-between">
                    <span>حلاقة وبكجات:</span>
                    <span className="text-amber-300 font-mono font-bold">{treasurySummary?.servicesRevenue || 0} ج</span>
                  </div>
                  <div className="flex justify-between">
                    <span>مبيعات منتجات:</span>
                    <span className="text-cyan-300 font-mono font-bold">{treasurySummary?.retailRevenue || 0} ج</span>
                  </div>
                  {treasurySummary?.tipsTotal > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>إكراميات Tips:</span>
                      <span className="font-mono font-bold">+{treasurySummary.tipsTotal} ج</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Cash Collected */}
              <div className="p-4 rounded-3xl bg-[#14141e] border border-emerald-500/30 space-y-2 relative overflow-hidden shadow-lg">
                <span className="text-xs text-slate-400 font-bold block">النقدية الكاش المحصلة</span>
                <p className="text-2xl font-black text-emerald-400 font-mono">
                  {(treasurySummary?.cashRevenue || 0).toLocaleString()} ج.م
                </p>
                <span className="text-[10px] text-emerald-300 font-bold block pt-1 border-t border-white/5">
                  💵 المقبوض نقداً بالدرج
                </span>
              </div>

              {/* 3. Electronic Payments */}
              <div className="p-4 rounded-3xl bg-[#14141e] border border-sky-500/30 space-y-2 relative overflow-hidden shadow-lg">
                <span className="text-xs text-slate-400 font-bold block">الدفع الإلكتروني (فيزا/محافظ)</span>
                <p className="text-2xl font-black text-sky-400 font-mono">
                  {(
                    (treasurySummary?.visaRevenue || 0) +
                    (treasurySummary?.instapayRevenue || 0) +
                    (treasurySummary?.vodafoneRevenue || 0)
                  ).toLocaleString()}{" "}
                  ج.م
                </p>
                <div className="text-[10px] text-slate-400 space-y-0.5 pt-1 border-t border-white/5 font-medium">
                  <div className="flex justify-between">
                    <span>فيزا 💳:</span>
                    <span className="text-sky-300 font-mono">{treasurySummary?.visaRevenue || 0} ج</span>
                  </div>
                  <div className="flex justify-between">
                    <span>انستاباي 📱:</span>
                    <span className="text-purple-300 font-mono">{treasurySummary?.instapayRevenue || 0} ج</span>
                  </div>
                  <div className="flex justify-between">
                    <span>فودافون كاش 🔴:</span>
                    <span className="text-rose-300 font-mono">{treasurySummary?.vodafoneRevenue || 0} ج</span>
                  </div>
                </div>
              </div>

              {/* 4. Outflows: Advances, Salaries & Expenses */}
              <div className="p-4 rounded-3xl bg-[#14141e] border border-rose-500/30 space-y-2 relative overflow-hidden shadow-lg">
                <span className="text-xs text-slate-400 font-bold block">المسحوبات والمصروفات</span>
                <p className="text-2xl font-black text-rose-400 font-mono">
                  {(
                    (treasurySummary?.specialistPayouts || 0) +
                    (treasurySummary?.specialistAdvances || 0) +
                    (treasurySummary?.generalExpenses || 0)
                  ).toLocaleString()}{" "}
                  ج.م
                </p>
                <div className="text-[10px] text-slate-400 space-y-0.5 pt-1 border-t border-white/5 font-medium">
                  <div className="flex justify-between">
                    <span>سلف متخصصين:</span>
                    <span className="text-rose-300 font-mono">{treasurySummary?.specialistAdvances || 0} ج</span>
                  </div>
                  <div className="flex justify-between">
                    <span>أجور ومستحقات:</span>
                    <span className="text-amber-300 font-mono">{treasurySummary?.specialistPayouts || 0} ج</span>
                  </div>
                  <div className="flex justify-between">
                    <span>نثريات وخامات:</span>
                    <span className="text-slate-300 font-mono">{treasurySummary?.generalExpenses || 0} ج</span>
                  </div>
                </div>
              </div>

              {/* 5. Net Cash In Drawer */}
              <div className="p-4 rounded-3xl bg-gradient-to-b from-amber-500/20 via-[#14141e] to-[#101018] border-2 border-amber-400 space-y-2 relative overflow-hidden shadow-2xl">
                <span className="text-xs text-amber-300 font-black block">صافي النقدية بالدرج (العهدة)</span>
                <p className="text-2xl font-black text-amber-300 font-mono">
                  {(treasurySummary?.netCashInDrawer || 0).toLocaleString()} ج.م
                </p>
                <span className="text-[10px] text-slate-300 font-bold block pt-1 border-t border-amber-500/20">
                  🪙 المطلوب تسليمه عند الإقفال
                </span>
              </div>
            </div>

            {/* Split Sections: 1. Live Financial Transactions / 2. Closed Shifts Handover Register */}
            <div className="space-y-6">
              {/* SECTION A: Real-Time Financial Ledger */}
              <div className="p-5 rounded-3xl bg-[#14141e] border border-amber-500/25 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <div>
                    <h4 className="text-sm font-black text-white flex items-center gap-2">
                      <span>سجل حركات الخزينة والإيرادات اللحظية 📑</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-amber-300 font-mono font-bold">
                        {treasuryTransactions.length} حركة مسجلة
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      كل إيراد حلاقة، مبيعات منتجات، سلفة أجور، ومصروف نثريات مسجل بالوقت وطريقة الدفع
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400">
                        <th className="py-2.5 px-3">التاريخ والوقت</th>
                        <th className="py-2.5 px-3">نوع الحركة</th>
                        <th className="py-2.5 px-3">البيان والتفاصيل</th>
                        <th className="py-2.5 px-3">الفرع</th>
                        <th className="py-2.5 px-3">طريقة الدفع</th>
                        <th className="py-2.5 px-3 font-mono">المبلغ</th>
                        <th className="py-2.5 px-3">المسجل بواسطة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {treasuryTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-500 font-bold">
                            لا توجد حركات مالية مسجلة خلال هذه الفترة
                          </td>
                        </tr>
                      ) : (
                        treasuryTransactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-white/5 transition">
                            <td className="py-3 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                              {new Date(tx.date).toLocaleDateString("ar-EG", {
                                month: "numeric",
                                day: "numeric",
                              })}{" "}
                              •{" "}
                              {new Date(tx.date).toLocaleTimeString("ar-EG", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                                  tx.type === "INCOME_TICKET"
                                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                    : tx.type === "SALARY_PAYOUT"
                                    ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                    : tx.type === "ADVANCE_WITHDRAWAL"
                                    ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                                    : "bg-purple-500/15 text-purple-300 border-purple-500/30"
                                }`}
                              >
                                {tx.badge}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-bold text-white max-w-xs truncate">
                              {tx.title}
                              {tx.details?.retailTotal > 0 && (
                                <span className="text-[10px] text-cyan-300 block font-normal">
                                  منها منتجات: {tx.details.retailTotal} ج.م • حلاقة: {tx.details.servicesTotal} ج.م
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                              {tx.branchName || "الصالون العام"}
                            </td>
                            <td className="py-3 px-3 font-bold text-[11px] whitespace-nowrap">
                              {tx.paymentMethod === "CASH" && "💵 كاش نقدي"}
                              {tx.paymentMethod === "CARD" && "💳 فيزا / ماستر"}
                              {tx.paymentMethod === "INSTAPAY" && "📱 انستاباي"}
                              {tx.paymentMethod === "VODAFONE_CASH" && "🔴 فودافون كاش"}
                            </td>
                            <td className="py-3 px-3 font-mono font-black text-sm whitespace-nowrap">
                              <span className={tx.isCredit ? "text-emerald-400" : "text-rose-400"}>
                                {tx.isCredit ? "+" : "-"}
                                {tx.amount.toLocaleString()} ج.م
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                              {tx.recordedBy}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION B: Closed Shifts & Cash Handover Archive (مين استلم الفلوس) */}
              <div className="p-5 rounded-3xl bg-[#14141e] border border-amber-500/25 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <div>
                    <h4 className="text-sm font-black text-white flex items-center gap-2">
                      <span>سجل إقفال الورديات وتسليم النقدية 🔒 (مين استلم الفلوس)</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                        {shifts.length} وردية مقفلة
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      بيان رسمي معتمد بكل وردية أقفلت، المبالغ المسلمة، واسم الشخص الذي استلم النقدية باليد
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400">
                        <th className="py-2.5 px-3">رقم الوردية</th>
                        <th className="py-2.5 px-3">الفرع والكاشير</th>
                        <th className="py-2.5 px-3">وقت الإقفال</th>
                        <th className="py-2.5 px-3 font-mono">الحلاقة والمنتجات</th>
                        <th className="py-2.5 px-3 font-mono">الكاش المتوقع</th>
                        <th className="py-2.5 px-3 font-mono">الكاش الفعلي</th>
                        <th className="py-2.5 px-3 font-mono">الفارق</th>
                        <th className="py-2.5 px-3">تم تسليم النقدية إلى</th>
                        <th className="py-2.5 px-3">الملاحظات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {shifts.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-slate-500 font-bold">
                            لا توجد ورديات مقفلة ومسلمة حتى الآن
                          </td>
                        </tr>
                      ) : (
                        shifts.map((s) => (
                          <tr key={s.id} className="hover:bg-white/5 transition">
                            <td className="py-3 px-3 font-mono font-black text-amber-300 whitespace-nowrap">
                              #{s.shiftNumber}
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className="font-bold text-white block">{s.cashierName}</span>
                              <span className="text-[10px] text-slate-400">{s.branch?.name}</span>
                            </td>
                            <td className="py-3 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                              {s.closedAt
                                ? new Date(s.closedAt).toLocaleDateString("ar-EG") +
                                  " • " +
                                  new Date(s.closedAt).toLocaleTimeString("ar-EG", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "مفتوحة حالياً 🟢"}
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-300 text-[11px] whitespace-nowrap">
                              حلاقة: {s.servicesTotal} ج | منتجات: {s.retailTotal} ج
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-300 font-bold whitespace-nowrap">
                              {s.expectedCash} ج.م
                            </td>
                            <td className="py-3 px-3 font-mono font-black text-amber-400 whitespace-nowrap">
                              {s.actualCash} ج.م
                            </td>
                            <td className="py-3 px-3 font-mono font-bold whitespace-nowrap">
                              {s.difference === 0 ? (
                                <span className="text-emerald-400">متطابق ✅</span>
                              ) : s.difference < 0 ? (
                                <span className="text-rose-400">عجز: {s.difference} ج</span>
                              ) : (
                                <span className="text-emerald-300">زيادة: +{s.difference} ج</span>
                              )}
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-black text-xs inline-block">
                                👑 {s.handedTo || "أ/ حمزة عباس (المايسترو)"}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-400 text-[11px] max-w-xs truncate">
                              {s.notes || "تم التسليم بالكامل دون ملاحظات"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: BOOKINGS & APPOINTMENTS (WITH DIRECT ACTIONS & CONFIRMATION)
           ======================================================== */}
        {activeTab === "bookings" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-white">جدول الحجوزات والمواعيد</h3>
                <p className="text-xs text-slate-400">
                  تأكيد مواعيد الحجز الجديدة، بدء الجلسة على الكرسي، أو التواصل المباشر مع العميل 📅
                </p>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                {["ALL", "PENDING", "CONFIRMED", "IN_CHAIR", "COMPLETED", "CANCELLED"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setBookingFilterStatus(st)}
                    className={`py-1.5 px-3 rounded-xl font-bold transition whitespace-nowrap ${
                      bookingFilterStatus === st
                        ? "bg-amber-500 text-slate-950 font-black"
                        : "bg-white/5 hover:bg-white/10 text-slate-400"
                    }`}
                  >
                    {st === "ALL" && "الكل"}
                    {st === "PENDING" && "بانتظار التأكيد 🔔"}
                    {st === "CONFIRMED" && "مؤكد ✅"}
                    {st === "IN_CHAIR" && "على الكرسي 💺"}
                    {st === "COMPLETED" && "مكتمل 🏆"}
                    {st === "CANCELLED" && "ملغي ❌"}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#14141e]">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-black/40 text-slate-400 font-bold">
                    <th className="p-3.5">رقم الحجز</th>
                    <th className="p-3.5">العميل</th>
                    <th className="p-3.5">الفرع</th>
                    <th className="p-3.5">المتخصص</th>
                    <th className="p-3.5">التاريخ والوقت</th>
                    <th className="p-3.5">المبلغ</th>
                    <th className="p-3.5">الحالة</th>
                    <th className="p-3.5 text-center">الإجراءات والتحكم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredBookings.map((bk) => (
                    <tr key={bk.id} className="hover:bg-white/5 transition">
                      <td className="p-3.5 font-mono font-black text-amber-400">
                        #{bk.bookingNumber}
                      </td>
                      <td className="p-3.5 font-bold text-white">
                        {bk.customer?.name}
                        <span className="block text-[10px] text-slate-400 font-mono">
                          {bk.customer?.phone}
                        </span>
                      </td>
                      <td className="p-3.5">{bk.branch?.name}</td>
                      <td className="p-3.5 text-amber-300 font-bold">
                        {bk.specialist?.name || "أي متخصص متاح"}
                      </td>
                      <td className="p-3.5 font-mono">
                        {bk.bookingDate} • {bk.timeSlot}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-white">{bk.totalAmount} ج</td>
                      <td className="p-3.5">
                        <span
                          className={`py-0.5 px-2.5 rounded-full text-[10px] font-black border ${
                            bk.status === "PENDING"
                              ? "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse"
                              : bk.status === "CONFIRMED"
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                              : bk.status === "IN_CHAIR"
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                              : bk.status === "COMPLETED"
                              ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                              : "bg-slate-500/20 text-slate-400 border-slate-500/40"
                          }`}
                        >
                          {bk.status === "PENDING" && "بانتظار التأكيد 🔔"}
                          {bk.status === "CONFIRMED" && "مؤكد ✅"}
                          {bk.status === "IN_CHAIR" && "على الكرسي 💺"}
                          {bk.status === "COMPLETED" && "مكتمل 🏆"}
                          {bk.status === "CANCELLED" && "ملغي ❌"}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {bk.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => handleUpdateBookingStatus(bk.id, "CONFIRMED")}
                                className="py-1 px-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] transition flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>تأكيد الموعد ✅</span>
                              </button>
                              <button
                                onClick={() => handleOpenRescheduleModal(bk)}
                                className="py-1 px-2.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 font-black text-[10px] transition flex items-center gap-1 cursor-pointer"
                                title="اقتراح أو تعديل موعد بديل للعميل وإشعاره بالشات"
                              >
                                <Clock className="w-3 h-3" />
                                <span>موعد بديل ⏱️</span>
                              </button>
                            </>
                          )}

                          {bk.status === "CONFIRMED" && (
                            <>
                              <button
                                onClick={() => handleUpdateBookingStatus(bk.id, "IN_CHAIR")}
                                className="py-1 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] transition flex items-center gap-1"
                              >
                                <Scissors className="w-3 h-3" />
                                <span>بدء بالكرسي 💺</span>
                              </button>
                              <button
                                onClick={() => handleOpenRescheduleModal(bk)}
                                className="py-1 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-sky-300 border border-sky-500/30 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                                title="تعديل وقت الموعد بناءً على طلب العميل"
                              >
                                <Clock className="w-3 h-3" />
                                <span>تعديل الموعد ⏱️</span>
                              </button>
                            </>
                          )}

                          {bk.status === "IN_CHAIR" && (
                            <button
                              onClick={() => handleUpdateBookingStatus(bk.id, "COMPLETED")}
                              className="py-1 px-2.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-white font-black text-[10px] transition"
                            >
                              اكتمل 🏆
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenChatFromBooking(bk)}
                            className="py-1 px-2 rounded-lg bg-white/5 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-[10px] font-bold transition flex items-center gap-1"
                            title="محادثة العميل"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>شات 💬</span>
                          </button>

                          {bk.status !== "CANCELLED" && bk.status !== "COMPLETED" && (
                            <button
                              onClick={() => handleUpdateBookingStatus(bk.id, "CANCELLED")}
                              className="py-1 px-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-[10px] font-bold transition"
                              title="إلغاء الموعد"
                            >
                              إلغاء ❌
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 3: ROYAL OFFERS & PACKAGES (DYNAMIC FLYERS MANAGEMENT)
           ======================================================== */}
        {activeTab === "offers" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-white">
                  العروض والباكدجات الملكية الحصرية (VIP Offers)
                </h3>
                <p className="text-xs text-slate-400">
                  إدارة العروض المعلنة على صفحة الحجز، التحكم في الفروع المتاحة، والخصومات والأسعار 👑
                </p>
              </div>

              <button
                onClick={handleOpenCreateOffer}
                className="py-2.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-md shadow-amber-500/20 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة عرض جديد 👑</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {offers.map((offer) => {
                let featuresList: string[] = [];
                try {
                  featuresList = JSON.parse(offer.features || "[]");
                } catch {
                  featuresList = [];
                }

                return (
                  <div
                    key={offer.id}
                    className="rounded-3xl bg-[#14141e] border-2 border-amber-500/30 overflow-hidden flex flex-col shadow-xl group hover:border-amber-400 transition"
                  >
                    {/* Flyer Banner Preview */}
                    <div className="relative h-48 w-full bg-black overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={offer.image || "/offers/offer-vip-1000.jpg"}
                        alt={offer.titleAr}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                      {offer.badge && (
                        <span className="absolute top-3 right-3 py-1 px-3 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] shadow-lg">
                          {offer.badge}
                        </span>
                      )}

                      <span
                        className={`absolute top-3 left-3 py-1 px-2.5 rounded-full text-[10px] font-black ${
                          offer.isActive
                            ? "bg-emerald-500/90 text-slate-950"
                            : "bg-rose-500/90 text-white"
                        }`}
                      >
                        {offer.isActive ? "نشط ومتاح 🟢" : "معطل 🔴"}
                      </span>

                      <div className="absolute bottom-3 right-3 left-3 flex items-end justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-amber-300 block">
                            {offer.branch?.name || "متاح في جميع الفروع 📍"}
                          </span>
                          <h4 className="font-black text-sm text-white drop-shadow-md">
                            {offer.titleAr}
                          </h4>
                        </div>
                        <div className="text-left font-mono">
                          {offer.oldPrice && (
                            <span className="text-xs text-rose-400 line-through block">
                              {offer.oldPrice} ج
                            </span>
                          )}
                          <span className="text-base font-black text-amber-400">
                            {offer.price} ج.م
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Features & Description */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      {offer.description && (
                        <p className="text-xs text-slate-300 leading-relaxed font-medium">
                          {offer.description}
                        </p>
                      )}

                      {featuresList.length > 0 && (
                        <ul className="space-y-1 text-[11px] text-slate-300 border-t border-white/5 pt-2">
                          {featuresList.slice(0, 4).map((f, i) => (
                            <li key={i} className="flex items-center gap-1.5">
                              <span className="text-amber-400 font-bold">✓</span>
                              <span className="truncate">{f}</span>
                            </li>
                          ))}
                          {featuresList.length > 4 && (
                            <li className="text-[10px] text-amber-400 font-bold">
                              + {featuresList.length - 4} مميزات ملكية أخرى...
                            </li>
                          )}
                        </ul>
                      )}

                      {/* Control Buttons */}
                      <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-3">
                        <button
                          onClick={() => handleToggleOfferActive(offer)}
                          className={`py-1.5 px-3 rounded-xl text-[11px] font-bold transition border ${
                            offer.isActive
                              ? "bg-rose-500/10 text-rose-300 border-rose-500/20 hover:bg-rose-500/20"
                              : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20"
                          }`}
                        >
                          {offer.isActive ? "تعطيل 🚫" : "تفعيل 🟢"}
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditOffer(offer)}
                            className="p-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition text-xs font-bold flex items-center gap-1"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>تعديل</span>
                          </button>

                          <button
                            onClick={() => handleDeleteOffer(offer.id)}
                            className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 4: IN-APP LIVE CHAT WITH CUSTOMERS
           ======================================================== */}
        {activeTab === "chat" && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h3 className="text-base font-black text-white">
                الشات المباشر وتواصل العملاء اللحظي 💬
              </h3>
              <p className="text-xs text-slate-400">
                متابعة استفسارات الزبائن، تأكيد المواعيد، وتنسيق باكدجات العرسان لحظة بلحظة 📱
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px] rounded-3xl border border-amber-500/30 overflow-hidden bg-[#12121a]">
              {/* Left Column: Conversations List */}
              <div className="border-l border-white/10 flex flex-col overflow-hidden bg-[#0e0e14]">
                <div className="p-3.5 border-b border-white/10 bg-black/40">
                  <span className="text-xs font-black text-amber-400">المحادثات النشطة</span>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                  {chatConversations.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      لا توجد محادثات واردة حتى الآن
                    </div>
                  ) : (
                    chatConversations.map((conv) => {
                      const isSelected = activeChatCustomer?.key === conv.key;
                      return (
                        <div
                          key={conv.key}
                          onClick={() => handleSelectCustomerChat(conv)}
                          className={`p-3.5 cursor-pointer transition flex items-start justify-between gap-2 ${
                            isSelected
                              ? "bg-amber-500/15 border-r-4 border-amber-400"
                              : "hover:bg-white/5"
                          }`}
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h5 className="font-black text-xs text-white truncate">
                                {conv.customerName || "عميل VIP"}
                              </h5>
                              {conv.unreadCount > 0 && (
                                <span className="w-4 h-4 rounded-full bg-rose-600 text-white font-mono text-[9px] font-bold flex items-center justify-center animate-pulse">
                                  {conv.unreadCount}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-amber-300 font-mono font-bold">
                              {conv.customerPhone || "بدون هاتف"}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
                              {conv.lastMessage}
                            </p>
                          </div>
                          <span className="text-[9px] text-slate-500 font-mono shrink-0">
                            {new Date(conv.lastTime).toLocaleTimeString("ar-EG", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Active Conversation */}
              <div className="md:col-span-2 flex flex-col h-full bg-[#101018]">
                {activeChatCustomer ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-3.5 border-b border-amber-500/30 bg-black/40 flex items-center justify-between">
                      <div>
                        <h4 className="font-black text-sm text-amber-400">
                          {activeChatCustomer.customerName || "عميل VIP"}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {activeChatCustomer.customerPhone}
                        </p>
                      </div>

                      {/* Quick Reply Chips */}
                      <div className="hidden sm:flex items-center gap-1.5 text-[10px]">
                        <button
                          onClick={() =>
                            handleSendAdminReply(
                              "أهلاً بك يا فندم! تم تأكيد موعدك ونحن بانتظارك في الصالون لتقديم أرقى تجربة ملكية 👑"
                            )
                          }
                          className="py-1 px-2.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition"
                        >
                          تأكيد الموعد ✅
                        </button>
                        <button
                          onClick={() =>
                            handleSendAdminReply(
                              "فرع مدينة نصر: 28 شارع مصطفى حمام، متفرع من عباس العقاد، أمام أبو العز السوري مباشرة 📍"
                            )
                          }
                          className="py-1 px-2.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition"
                        >
                          عنوان مدينة نصر 📍
                        </button>
                      </div>
                    </div>

                    {/* Chat Messages Body */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0a0a0f]">
                      {chatMessages.map((m) => {
                        const isSalon = m.sender === "SALON";
                        return (
                          <div
                            key={m.id}
                            className={`flex gap-2 ${isSalon ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[75%] rounded-2xl p-3 text-xs space-y-1 shadow-md ${
                                isSalon
                                  ? "bg-amber-500 text-slate-950 font-bold rounded-tl-none"
                                  : "bg-[#181826] border border-amber-500/30 text-slate-200 rounded-tr-none"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 text-[10px]">
                                <span className={isSalon ? "text-slate-900 font-black" : "text-amber-400 font-bold"}>
                                  {m.senderName}
                                </span>
                                <span className="opacity-70 font-mono text-[9px]">
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

                    {/* Chat Input */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendAdminReply();
                      }}
                      className="p-3 bg-[#12121a] border-t border-amber-500/30 flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={chatReplyText}
                        onChange={(e) => setChatReplyText(e.target.value)}
                        placeholder="اكتب رد الصالون المباشر للعميل..."
                        className="flex-1 py-2.5 px-3.5 rounded-xl bg-black/60 border border-amber-500/30 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                      <button
                        type="submit"
                        disabled={chatSending || !chatReplyText.trim()}
                        className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 disabled:opacity-40"
                      >
                        <Send className="w-3.5 h-3.5 rotate-180" />
                        <span>إرسال</span>
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-2 text-slate-500">
                    <MessageSquare className="w-12 h-12 text-slate-700" />
                    <p className="text-sm font-bold text-slate-400">
                      اختر محادثة من القائمة للرد على العميل
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 5: SPECIALISTS & PAYROLL
           ======================================================== */}
        {activeTab === "specialists" && (
          <div className="space-y-6 animate-fade-in">
            {/* Tab Header & View Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-amber-400" />
                  <span>طاقم المتخصصين والحسابات والمستحقات المالية</span>
                </h3>
                <p className="text-xs text-slate-400">
                  إدارة كراسي العمل، حضور الورديات، كشف الحساب التفصيلي، صرف الأجور، ونسب العمولات والسلف ✂️
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Sub-view switcher */}
                <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/60 border border-white/10">
                  <button
                    type="button"
                    onClick={() => setSpecialistSubView("CARDS")}
                    className={`py-1.5 px-3.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                      specialistSubView === "CARDS"
                        ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    <span>بطاقات الحلاقين والورديات ✂️</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSpecialistSubView("STATEMENT");
                      if (!selectedLedgerSpecialistIdRef.current && specialists.length > 0) {
                        handleSelectLedgerSpecialist(specialists[0].id);
                      }
                    }}
                    className={`py-1.5 px-3.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                      specialistSubView === "STATEMENT"
                        ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>كشف الحساب والمستحقات 📑</span>
                  </button>
                </div>

                {specialistSubView === "CARDS" && (
                  <button
                    onClick={() => {
                      setEditingSpecialist(null);
                      setSpecForm({
                        name: "",
                        phone: "",
                        title: "خبير حلاقة وتصفيف",
                        branchId: branches[0]?.id || "",
                        chairNumber: 1,
                        payType: "SALARY_PLUS_COMMISSION",
                        baseSalary: 6000,
                        commissionRate: 20,
                        photo: "",
                        username: "",
                        password: "",
                      });
                      setShowSpecialistModal(true);
                    }}
                    className="py-2 px-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-md shadow-amber-500/20 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة متخصص جديد ✂️</span>
                  </button>
                )}
              </div>
            </div>

            {/* ─────────────────────────────────────────────────────────────
                VIEW A: SPECIALIST CARDS & SHIFTS
               ───────────────────────────────────────────────────────────── */}
            {specialistSubView === "CARDS" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {specialists.map((spec) => {
                  const summary = specialistsSummary.find((s) => s.specialist?.id === spec.id);
                  const balanceDue = summary ? summary.balanceDue : 0;

                  return (
                    <div
                      key={spec.id}
                      className="p-5 rounded-3xl bg-[#14141e] border-2 border-amber-500/30 space-y-4 shadow-xl flex flex-col justify-between hover:border-amber-400 transition"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-400 bg-black shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={spec.photo || "/logo.jpg"}
                              alt={spec.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-black text-sm text-white truncate">{spec.name}</h4>
                            <p className="text-[11px] text-slate-400 truncate">{spec.title}</p>
                            <span className="text-[10px] text-amber-300 font-bold block pt-0.5">
                              {spec.branch?.name} • كرسي #{spec.chairNumber}
                            </span>
                          </div>
                        </div>

                        {/* Shift Attendance Status & Reasons */}
                        <div className="p-3 rounded-2xl bg-black/60 border border-white/5 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-slate-400 font-bold">حالة الوردية والحضور:</span>
                            <span
                              className={`text-[10px] font-black py-0.5 px-2.5 rounded-full border ${
                                spec.status === "AVAILABLE"
                                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                  : spec.status === "WITH_CLIENT"
                                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                  : spec.status === "BREAK"
                                  ? "bg-sky-500/20 text-sky-300 border-sky-500/40"
                                  : spec.status === "OFF_DUTY"
                                  ? "bg-slate-700/80 text-slate-300 border-slate-600"
                                  : spec.status === "DAY_OFF"
                                  ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                                  : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                              }`}
                            >
                              {spec.status === "AVAILABLE" && "حاضر وبدأ الوردية 🟢"}
                              {spec.status === "WITH_CLIENT" && "على الكرسي مع عميل 💺"}
                              {spec.status === "BREAK" && "استراحة مؤقتة ☕"}
                              {spec.status === "OFF_DUTY" && "انتهت الوردية ومشي 🏠"}
                              {spec.status === "DAY_OFF" && "إجازة رسمية 🏖️"}
                              {spec.status === "ABSENT" && "غائب / معطل 🔴"}
                            </span>
                          </div>

                          {spec.statusReason && (
                            <p className="text-[10px] text-amber-300/90 bg-amber-500/5 px-2.5 py-1 rounded-xl border border-amber-500/15">
                              📌 السبب: {spec.statusReason}
                            </p>
                          )}

                          {/* Quick Shift Controls */}
                          <div className="flex items-center gap-1 pt-1 border-t border-white/5">
                            <button
                              type="button"
                              onClick={() => handleQuickSetStatus(spec, "AVAILABLE", "حاضر وبدأ الوردية")}
                              className={`flex-1 py-1 px-1 rounded-lg text-[10px] font-bold transition border ${
                                spec.status === "AVAILABLE"
                                  ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm"
                                  : "bg-white/5 hover:bg-emerald-500/20 text-emerald-300 border-white/5"
                              }`}
                              title="تفعيل وحضور - بدأ الوردية"
                            >
                              بدأ 🟢
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickSetStatus(spec, "WITH_CLIENT", "على الكرسي مع عميل")}
                              className={`flex-1 py-1 px-1 rounded-lg text-[10px] font-bold transition border ${
                                spec.status === "WITH_CLIENT"
                                  ? "bg-amber-500 text-slate-950 border-amber-400 shadow-sm"
                                  : "bg-white/5 hover:bg-amber-500/20 text-amber-300 border-white/5"
                              }`}
                              title="على الكرسي حالياً"
                            >
                              كرسي 💺
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickSetStatus(spec, "BREAK", "استراحة راحة")}
                              className={`flex-1 py-1 px-1 rounded-lg text-[10px] font-bold transition border ${
                                spec.status === "BREAK"
                                  ? "bg-sky-500 text-slate-950 border-sky-400 shadow-sm"
                                  : "bg-white/5 hover:bg-sky-500/20 text-sky-300 border-white/5"
                              }`}
                              title="استراحة مؤقتة"
                            >
                              استراحة ☕
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenShiftModal(spec)}
                              className="py-1 px-2 rounded-lg text-[10px] font-bold bg-white/5 hover:bg-white/10 text-amber-300 border border-white/10"
                              title="تحديد سبب التعطيل أو إجازة أو نهاية الوردية"
                            >
                              تعطيل/إجازة ⚙️
                            </button>
                          </div>
                        </div>

                        {/* Payroll Breakdown */}
                        <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-400">نظام الأجر:</span>
                            <span className="font-bold text-amber-300">{spec.payType}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">الراتب الأساسي:</span>
                            <span className="font-mono text-white">{spec.baseSalary} ج.م</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">نسبة العمولة:</span>
                            <span className="font-mono text-amber-400 font-bold">{spec.commissionRate}%</span>
                          </div>
                        </div>

                        {/* Live Balance Due Badge */}
                        <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                          <span className="text-slate-300 text-[11px] font-bold">الرصيد المستحق حالياً:</span>
                          <span
                            className={`font-mono font-black text-xs ${
                              balanceDue > 0
                                ? "text-emerald-400"
                                : balanceDue < 0
                                ? "text-rose-400"
                                : "text-amber-300"
                            }`}
                          >
                            {balanceDue > 0 ? `+${balanceDue} ج.م` : `${balanceDue} ج.م`}
                          </span>
                        </div>
                      </div>

                      {/* Actions: Statement Button + Payout, Edit, Delete */}
                      <div className="space-y-2 pt-2 border-t border-white/10">
                        <button
                          type="button"
                          onClick={() => {
                            handleSelectLedgerSpecialist(spec.id);
                            setSpecialistSubView("STATEMENT");
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-400/30 font-black text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>كشف الحساب والمستحقات التفصيلي 📑</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setPayoutSpecialist(spec);
                              setPayoutType("SALARY_PAYOUT");
                              setPayoutAmount(balanceDue > 0 ? balanceDue : 500);
                              setPayoutNotes("صرف وتصفية مستحقات المتخصص");
                              setShowPayoutModal(true);
                            }}
                            className="flex-1 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-xs transition"
                          >
                            صرف مستحقات 💸
                          </button>
                          <button
                            onClick={() => {
                              setPayoutSpecialist(spec);
                              setPayoutType("ADVANCE_WITHDRAWAL");
                              setPayoutAmount(200);
                              setPayoutNotes("سلفة كاش تحت الحساب");
                              setShowPayoutModal(true);
                            }}
                            className="py-2 px-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold text-xs transition"
                            title="تسجيل سلفة نقدية"
                          >
                            سلفة 📉
                          </button>
                          <button
                            onClick={() => {
                              setEditingSpecialist(spec);
                              setSpecForm({
                                name: spec.name,
                                phone: spec.phone || "",
                                title: spec.title,
                                branchId: spec.branchId,
                                chairNumber: spec.chairNumber,
                                payType: spec.payType,
                                baseSalary: spec.baseSalary,
                                commissionRate: spec.commissionRate,
                                photo: spec.photo || "",
                                username: "",
                                password: "",
                              });
                              setShowSpecialistModal(true);
                            }}
                            className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition"
                            title="تعديل بيانات المتخصص"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSpecialist(spec.id, spec.name)}
                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition"
                            title="حذف المتخصص نهائياً"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                VIEW B: STATEMENT OF ACCOUNT & FINANCIAL LEDGER (كشف الحساب)
               ───────────────────────────────────────────────────────────── */}
            {specialistSubView === "STATEMENT" && (
              <div className="space-y-6">
                {/* Specialist Selector & Action Bar */}
                <div className="p-4 rounded-3xl bg-[#14141e] border-2 border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSpecialistSubView("CARDS")}
                      className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 border border-white/5"
                    >
                      <span>العودة للبطاقات ✂️</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-slate-400">اختر المتخصص:</label>
                      <select
                        value={selectedLedgerSpecialistId}
                        onChange={(e) => {
                          handleSelectLedgerSpecialist(e.target.value);
                        }}
                        className="py-2 px-3 rounded-xl bg-black/60 border border-amber-500/40 text-amber-300 text-xs font-bold focus:outline-none"
                      >
                        {specialists.map((sp) => (
                          <option key={sp.id} value={sp.id}>
                            {sp.name} • كرسي #{sp.chairNumber} ({sp.branch?.name})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="py-2 px-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition flex items-center gap-1.5 border border-white/10 cursor-pointer shadow-sm"
                    >
                      <Printer className="w-3.5 h-3.5 text-amber-400" />
                      <span>طباعة كشف الحساب 🖨️</span>
                    </button>

                    {(() => {
                      const curSpec = specialists.find((s) => s.id === selectedLedgerSpecialistId);
                      if (!curSpec) return null;
                      const summary = specialistsSummary.find((s) => s.specialist?.id === curSpec.id);
                      const due = summary ? summary.balanceDue : 0;

                      return (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setPayoutSpecialist(curSpec);
                              setPayoutType("SALARY_PAYOUT");
                              setPayoutAmount(due > 0 ? due : 500);
                              setPayoutNotes(`تصفية وصرف مستحقات ${curSpec.name}`);
                              setShowPayoutModal(true);
                            }}
                            className="py-2 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
                          >
                            <Wallet className="w-3.5 h-3.5" />
                            <span>صرف وتصفية المستحقات 💸</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPayoutSpecialist(curSpec);
                              setPayoutType("ADVANCE_WITHDRAWAL");
                              setPayoutAmount(200);
                              setPayoutNotes(`سلفة نقدية على الحساب لـ ${curSpec.name}`);
                              setShowPayoutModal(true);
                            }}
                            className="py-2 px-3 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>سلفة كاش 📉</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPayoutSpecialist(curSpec);
                              setPayoutType("BONUS");
                              setPayoutAmount(100);
                              setPayoutNotes(`مكافأة تميز وإتقان لـ ${curSpec.name}`);
                              setShowPayoutModal(true);
                            }}
                            className="py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>مكافأة 🌟</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPayoutSpecialist(curSpec);
                              setPayoutType("DEDUCTION");
                              setPayoutAmount(50);
                              setPayoutNotes(`خصم أو جزاء على ${curSpec.name}`);
                              setShowPayoutModal(true);
                            }}
                            className="py-2 px-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            title="تسجيل خصم مالي"
                          >
                            <span>خصم ⚠️</span>
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Selected Specialist Profile & Contract Summary */}
                {(() => {
                  const curSpec = specialists.find((s) => s.id === selectedLedgerSpecialistId);
                  if (!curSpec) return null;
                  const summary = specialistsSummary.find((s) => s.specialist?.id === curSpec.id);
                  const netDue = summary ? summary.balanceDue : specialistStatement?.netDue || 0;

                  return (
                    <div className="space-y-4">
                      {/* Specialist Profile Banner */}
                      <div className="p-5 rounded-3xl bg-gradient-to-r from-[#161622] via-[#101018] to-[#161622] border-2 border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xl">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-400 bg-black shrink-0 shadow-lg">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={curSpec.photo || "/logo.jpg"}
                              alt={curSpec.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-black text-white">{curSpec.name}</h3>
                              <span className="py-0.5 px-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black">
                                كرسي #{curSpec.chairNumber}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 font-bold">{curSpec.title} • {curSpec.branch?.name}</p>
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                              📞 {curSpec.phone || "لا يوجد هاتف مسجل"}
                            </p>
                          </div>
                        </div>

                        {/* Contract Specs Badge */}
                        <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-black/50 border border-white/5 text-xs">
                          <div>
                            <span className="text-slate-400 block text-[10px]">نظام التعاقد:</span>
                            <span className="font-bold text-amber-300">{curSpec.payType}</span>
                          </div>
                          <div className="h-6 w-px bg-white/10 mx-1" />
                          <div>
                            <span className="text-slate-400 block text-[10px]">الراتب الأساسي:</span>
                            <span className="font-mono text-white font-bold">{curSpec.baseSalary} ج.م</span>
                          </div>
                          <div className="h-6 w-px bg-white/10 mx-1" />
                          <div>
                            <span className="text-slate-400 block text-[10px]">نسبة العمولة:</span>
                            <span className="font-mono text-amber-400 font-black">{curSpec.commissionRate}%</span>
                          </div>
                        </div>
                      </div>

                      {/* 5 Financial Statement KPI Cards */}
                      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                        {/* 1. Net Balance Due */}
                        <div className="col-span-2 lg:col-span-1 p-4 rounded-3xl bg-[#14141e] border-2 border-amber-500/40 space-y-1 shadow-lg relative overflow-hidden">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-amber-300">الرصيد الصافي المتبقي له:</span>
                            <Wallet className="w-4 h-4 text-amber-400" />
                          </div>
                          <div className="pt-1">
                            <span
                              className={`text-2xl font-mono font-black ${
                                netDue > 0
                                  ? "text-emerald-400"
                                  : netDue < 0
                                  ? "text-rose-400"
                                  : "text-slate-300"
                              }`}
                            >
                              {netDue > 0 ? `+${netDue}` : netDue} ج.م
                            </span>
                            <span className="block text-[10px] text-slate-400 mt-0.5 font-bold">
                              {netDue > 0
                                ? "مستحق له بالذمة المالية 🟢"
                                : netDue < 0
                                ? "مديونية / سحب زائد 🔴"
                                : "تمت التصفية بالكامل ⚖️"}
                            </span>
                          </div>
                        </div>

                        {/* 2. Total Commissions Earned */}
                        <div className="p-4 rounded-3xl bg-[#14141e] border border-white/10 space-y-1 shadow-md">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-300">عمولات حلاقة وبكجات:</span>
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div className="pt-1">
                            <span className="text-xl font-mono font-black text-emerald-300">
                              +{summary?.totalCommissions || specialistStatement?.totalCommissions || 0} ج.م
                            </span>
                            <span className="block text-[10px] text-slate-400 mt-0.5">
                              مكتسبة من تذاكر الحلاقة
                            </span>
                          </div>
                        </div>

                        {/* 3. Tips & Bonuses */}
                        <div className="p-4 rounded-3xl bg-[#14141e] border border-white/10 space-y-1 shadow-md">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-300">إكراميات ومكافآت:</span>
                            <Sparkles className="w-4 h-4 text-amber-400" />
                          </div>
                          <div className="pt-1">
                            <span className="text-xl font-mono font-black text-amber-300">
                              +{((summary?.totalBonuses || 0) + (specialistStatement?.totalTips || 0))} ج.م
                            </span>
                            <span className="block text-[10px] text-slate-400 mt-0.5">
                              Tips زبائن ومكافآت إدارة
                            </span>
                          </div>
                        </div>

                        {/* 4. Total Advances Withdrawn */}
                        <div className="p-4 rounded-3xl bg-[#14141e] border border-white/10 space-y-1 shadow-md">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-300">سلف مسحوبة:</span>
                            <ArrowDownLeft className="w-4 h-4 text-rose-400" />
                          </div>
                          <div className="pt-1">
                            <span className="text-xl font-mono font-black text-rose-400">
                              -{summary?.totalAdvances || specialistStatement?.totalAdvances || 0} ج.م
                            </span>
                            <span className="block text-[10px] text-slate-400 mt-0.5">
                              سلف كاش منصرفة من الدرج
                            </span>
                          </div>
                        </div>

                        {/* 5. Total Salaries / Payouts Settled */}
                        <div className="p-4 rounded-3xl bg-[#14141e] border border-white/10 space-y-1 shadow-md">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-300">مستحقات مسددة:</span>
                            <CheckCircle2 className="w-4 h-4 text-sky-400" />
                          </div>
                          <div className="pt-1">
                            <span className="text-xl font-mono font-black text-sky-300">
                              -{summary?.totalPayouts || specialistStatement?.totalPayouts || 0} ج.م
                            </span>
                            <span className="block text-[10px] text-slate-400 mt-0.5">
                              رواتب وتصفيات مسلمة له
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Detailed Statement Table with Running Balance */}
                      <div className="p-5 rounded-3xl bg-[#14141e] border border-white/10 space-y-4 shadow-xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-black text-white flex items-center gap-2">
                              <FileText className="w-4 h-4 text-amber-400" />
                              <span>حركات كشف الحساب التفصيلي (Ledger Transactions)</span>
                            </h4>
                            <p className="text-[11px] text-slate-400">
                              سجل كامل لجميع العمولات المستحقة، السلف، المكافآت، والمسدد من الخزينة
                            </p>
                          </div>
                          <span className="text-xs font-mono font-bold text-slate-400">
                            إجمالي الحركات: {ledgers.filter((l) => l.specialistId === curSpec.id).length}
                          </span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-right text-xs">
                            <thead>
                              <tr className="border-b border-white/10 text-slate-400 text-[11px]">
                                <th className="py-2.5 px-3">تاريخ ووقت الحركة</th>
                                <th className="py-2.5 px-3">نوع العملية</th>
                                <th className="py-2.5 px-3">البيان ورقم التذكرة</th>
                                <th className="py-2.5 px-3">دائن (+) له</th>
                                <th className="py-2.5 px-3">مدين (-) عليه</th>
                                <th className="py-2.5 px-3">بواسطة</th>
                                <th className="py-2.5 px-3">ملاحظات</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {(() => {
                                const specLedgers = ledgers.filter((l) => l.specialistId === curSpec.id);
                                if (specLedgers.length === 0) {
                                  return (
                                    <tr>
                                      <td colSpan={7} className="py-8 text-center text-slate-500 font-bold">
                                        لا توجد حركات مالية مسجلة في كشف حساب هذا المتخصص حتى الآن 📑
                                      </td>
                                    </tr>
                                  );
                                }

                                return specLedgers.map((item) => {
                                  const isCredit =
                                    item.type === "COMMISSION_EARNED" ||
                                    item.type === "BONUS" ||
                                    item.type === "TIP_EARNED";

                                  return (
                                    <tr key={item.id} className="hover:bg-white/[0.02] transition">
                                      <td className="py-3 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                                        {new Date(item.date).toLocaleDateString("ar-EG")} •{" "}
                                        {new Date(item.date).toLocaleTimeString("ar-EG", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </td>
                                      <td className="py-3 px-3 whitespace-nowrap">
                                        <span
                                          className={`py-0.5 px-2.5 rounded-full text-[10px] font-black border inline-block ${
                                            item.type === "COMMISSION_EARNED"
                                              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                              : item.type === "TIP_EARNED"
                                              ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                              : item.type === "BONUS"
                                              ? "bg-purple-500/15 text-purple-300 border-purple-500/30"
                                              : item.type === "ADVANCE_WITHDRAWAL"
                                              ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                                              : item.type === "SALARY_PAYOUT"
                                              ? "bg-sky-500/15 text-sky-300 border-sky-500/30"
                                              : "bg-orange-500/15 text-orange-300 border-orange-500/30"
                                          }`}
                                        >
                                          {item.type === "COMMISSION_EARNED" && "عمولة حلاقة وبكج ✂️"}
                                          {item.type === "TIP_EARNED" && "إكرامية زبون 💰"}
                                          {item.type === "BONUS" && "مكافأة إدارة 🌟"}
                                          {item.type === "ADVANCE_WITHDRAWAL" && "سلفة نقدية 📉"}
                                          {item.type === "SALARY_PAYOUT" && "صرف أجر / راتب 💸"}
                                          {item.type === "DEDUCTION" && "خصم مالي ⚠️"}
                                        </span>
                                      </td>
                                      <td className="py-3 px-3 text-slate-200 font-bold whitespace-nowrap">
                                        {item.ticketId ? (
                                          <span className="font-mono text-amber-300">
                                            تذكرة #{item.ticketId.slice(-6)}
                                          </span>
                                        ) : (
                                          item.notes || "حركة نقدية بالخزينة"
                                        )}
                                      </td>
                                      <td className="py-3 px-3 font-mono font-bold whitespace-nowrap">
                                        {isCredit ? (
                                          <span className="text-emerald-400">+{item.amount} ج.م</span>
                                        ) : (
                                          <span className="text-slate-600">-</span>
                                        )}
                                      </td>
                                      <td className="py-3 px-3 font-mono font-bold whitespace-nowrap">
                                        {!isCredit ? (
                                          <span className="text-rose-400">-{item.amount} ج.م</span>
                                        ) : (
                                          <span className="text-slate-600">-</span>
                                        )}
                                      </td>
                                      <td className="py-3 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                                        {item.recordedBy || "المايسترو (المالك)"}
                                      </td>
                                      <td className="py-3 px-3 text-slate-400 text-[11px] max-w-xs truncate">
                                        {item.notes || "لا توجد ملاحظات"}
                                      </td>
                                    </tr>
                                  );
                                });
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Staff Comparison Balances Register */}
                      <div className="p-5 rounded-3xl bg-[#14141e] border border-white/10 space-y-4 shadow-xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-black text-white flex items-center gap-2">
                              <Users className="w-4 h-4 text-amber-400" />
                              <span>كشف مقارن لأرصدة ومستحقات جميع المتخصصين</span>
                            </h4>
                            <p className="text-[11px] text-slate-400">
                              نظرة شاملة لرواتب، عمولات، وسلف كافة الحلاقين بالصالون
                            </p>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-right text-xs">
                            <thead>
                              <tr className="border-b border-white/10 text-slate-400 text-[11px]">
                                <th className="py-2.5 px-3">المتخصص والكرسي</th>
                                <th className="py-2.5 px-3">الفرع</th>
                                <th className="py-2.5 px-3">نظام الأجر</th>
                                <th className="py-2.5 px-3">إجمالي المكتسب (+)</th>
                                <th className="py-2.5 px-3">إجمالي السلف (-)</th>
                                <th className="py-2.5 px-3">المسدد والمنصرف (-)</th>
                                <th className="py-2.5 px-3">صافي المستحق له الآن</th>
                                <th className="py-2.5 px-3 text-center">إجراءات</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {specialistsSummary.length === 0 ? (
                                <tr>
                                  <td colSpan={8} className="py-6 text-center text-slate-500">
                                    جاري تحميل أرصدة المتخصصين...
                                  </td>
                                </tr>
                              ) : (
                                specialistsSummary.map((row) => (
                                  <tr
                                    key={row.specialist?.id}
                                    className={`hover:bg-white/[0.02] transition ${
                                      row.specialist?.id === selectedLedgerSpecialistId ? "bg-amber-500/5" : ""
                                    }`}
                                  >
                                    <td className="py-3 px-3 font-bold text-white whitespace-nowrap flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-xl overflow-hidden border border-amber-400/40 bg-black shrink-0">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                          src={row.specialist?.photo || "/logo.jpg"}
                                          alt={row.specialist?.name}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <div>
                                        <span className="block">{row.specialist?.name}</span>
                                        <span className="text-[10px] text-slate-400">
                                          كرسي #{row.specialist?.chairNumber}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="py-3 px-3 text-slate-300 text-[11px] whitespace-nowrap">
                                      {row.specialist?.branch?.name || "حدائق القبة"}
                                    </td>
                                    <td className="py-3 px-3 text-amber-300 text-[11px] whitespace-nowrap">
                                      {row.specialist?.payType}
                                    </td>
                                    <td className="py-3 px-3 font-mono font-bold text-emerald-400 whitespace-nowrap">
                                      +{row.totalEarned} ج.م
                                    </td>
                                    <td className="py-3 px-3 font-mono font-bold text-rose-400 whitespace-nowrap">
                                      -{row.totalAdvances} ج.م
                                    </td>
                                    <td className="py-3 px-3 font-mono font-bold text-sky-400 whitespace-nowrap">
                                      -{row.totalPayouts} ج.م
                                    </td>
                                    <td className="py-3 px-3 font-mono font-black text-sm whitespace-nowrap">
                                      <span
                                        className={
                                          row.balanceDue > 0
                                            ? "text-emerald-400"
                                            : row.balanceDue < 0
                                            ? "text-rose-400"
                                            : "text-amber-300"
                                        }
                                      >
                                        {row.balanceDue > 0 ? `+${row.balanceDue}` : row.balanceDue} ج.م
                                      </span>
                                    </td>
                                    <td className="py-3 px-3 text-center whitespace-nowrap">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleSelectLedgerSpecialist(row.specialist?.id);
                                          setSpecialistSubView("STATEMENT");
                                        }}
                                        className="py-1 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold transition"
                                      >
                                        عرض الكشف 📑
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 6: SERVICES CATALOG (FULLY DYNAMIC & EDITABLE)
           ======================================================== */}
        {activeTab === "services" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-white">قائمة الخدمات التجميلية وأسعار الحلاقة (ربط مباشر باللاندينج)</h3>
                <p className="text-xs text-slate-400">إضافة وتعديل وحذف الخدمات والأسعار وتفعيلها ديناميكياً على الصفحة الرئيسية 💈</p>
              </div>

              <button
                onClick={() => {
                  setEditingService(null);
                  setServiceForm({
                    nameAr: "",
                    category: "HAIR",
                    price: 150,
                    durationMinutes: 30,
                    description: "",
                    image: "",
                    sortOrder: 0,
                    isActive: true,
                  });
                  setShowServiceModal(true);
                }}
                className="py-2.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-md shadow-amber-500/20 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة خدمة جديدة 💈</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((srv) => (
                <div key={srv.id} className="rounded-3xl bg-[#14141e] border-2 border-amber-500/30 overflow-hidden flex flex-col justify-between shadow-xl hover:border-amber-400 transition group">
                  {/* Service Image Banner Preview */}
                  <div className="relative h-32 w-full bg-black overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        srv.image ||
                        "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600&auto=format&fit=crop&q=80"
                      }
                      alt={srv.nameAr}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#14141e] via-black/30 to-transparent" />
                    
                    <span className="absolute top-2.5 right-2.5 py-0.5 px-2.5 rounded-xl bg-black/75 backdrop-blur-md text-[10px] font-bold text-amber-300 border border-white/10">
                      {srv.category}
                    </span>
                    <span className="absolute top-2.5 left-2.5 py-0.5 px-2.5 rounded-xl text-[10px] font-bold bg-black/75 backdrop-blur-md text-slate-300 border border-white/10 font-mono">
                      {srv.durationMinutes || 30} دقيقة
                    </span>
                    <span className={`absolute bottom-2.5 right-2.5 py-0.5 px-2 rounded-full text-[10px] font-black ${
                      srv.isActive !== false ? "bg-emerald-500/90 text-slate-950" : "bg-rose-500/90 text-white"
                    }`}>
                      {srv.isActive !== false ? "نشط ومتاح 🟢" : "معطل 🔴"}
                    </span>
                  </div>

                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-black text-sm text-white group-hover:text-amber-300 transition">{srv.nameAr}</h4>
                        <span className="font-mono text-sm font-black text-amber-400">{srv.price} ج.م</span>
                      </div>
                      {srv.description && (
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">{srv.description}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-3 mt-2">
                      <button
                        onClick={() => handleToggleServiceActive(srv)}
                        className={`py-1.5 px-3 rounded-xl text-[11px] font-bold transition border ${
                          srv.isActive !== false
                            ? "bg-rose-500/10 text-rose-300 border-rose-500/20 hover:bg-rose-500/20"
                            : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20"
                        }`}
                      >
                        {srv.isActive !== false ? "تعطيل 🚫" : "تفعيل 🟢"}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditService(srv)}
                          className="py-1.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1 transition"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>تعديل</span>
                        </button>
                        <button
                          onClick={() => handleDeleteService(srv.id, srv.nameAr)}
                          className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition"
                          title="حذف الخدمة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 7: PRODUCTS & SALON SUPPLIES (INVENTORY & RAW MATERIALS)
           ======================================================== */}
        {activeTab === "inventory" && (
          <div className="space-y-6 animate-fade-in">
            {/* Tab Header & Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span>بضاعة التجميل والمخزن والخامات التشغيلية 🛍️</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                    {products.length} صنف مسجل
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  إدارة شاملة لمنتجات البيع المباشر للزبائن وخامات ومستلزمات الحلاقة والتشغيل بالصالون 💈
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenAddProduct}
                className="py-2.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة منتج أو خامة جديدة ➕</span>
              </button>
            </div>

            {/* Filter Pills & Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Type Switcher */}
              <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-2xl border border-white/10 flex-wrap">
                <button
                  type="button"
                  onClick={() => setProductTypeFilter("ALL")}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                    productTypeFilter === "ALL"
                      ? "bg-amber-500 text-slate-950 font-black shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  الكل ({products.length})
                </button>
                <button
                  type="button"
                  onClick={() => setProductTypeFilter("RETAIL")}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    productTypeFilter === "RETAIL"
                      ? "bg-amber-500 text-slate-950 font-black shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span>🛍️ منتجات بيع للعملاء</span>
                  <span className="font-mono text-[10px]">
                    ({products.filter((p) => !["SUPPLIES", "COLOR_SUPPLIES", "PROTEIN_SUPPLIES", "ACCESSORIES"].includes(p.category)).length})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setProductTypeFilter("SUPPLIES")}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    productTypeFilter === "SUPPLIES"
                      ? "bg-amber-500 text-slate-950 font-black shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span>💈 خامات ومستلزمات تشغيل</span>
                  <span className="font-mono text-[10px]">
                    ({products.filter((p) => ["SUPPLIES", "COLOR_SUPPLIES", "PROTEIN_SUPPLIES", "ACCESSORIES"].includes(p.category)).length})
                  </span>
                </button>
              </div>

              {/* Search Box */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="بحث باسم المنتج، الباركود، الفئة..."
                  className="w-full py-2 pr-9 pl-3 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-sans"
                />
              </div>
            </div>

            {/* Products & Supplies Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products
                .filter((p) => {
                  const isSupply = ["SUPPLIES", "COLOR_SUPPLIES", "PROTEIN_SUPPLIES", "ACCESSORIES"].includes(p.category);
                  if (productTypeFilter === "RETAIL" && isSupply) return false;
                  if (productTypeFilter === "SUPPLIES" && !isSupply) return false;
                  if (productSearch.trim()) {
                    const q = productSearch.toLowerCase();
                    const matchName = p.nameAr?.toLowerCase().includes(q);
                    const matchCode = p.barcode?.toLowerCase().includes(q);
                    const matchCat = p.category?.toLowerCase().includes(q);
                    if (!matchName && !matchCode && !matchCat) return false;
                  }
                  return true;
                })
                .map((prod) => {
                  const isSupply = ["SUPPLIES", "COLOR_SUPPLIES", "PROTEIN_SUPPLIES", "ACCESSORIES"].includes(prod.category);
                  const isLowStock = (prod.stockQty || 0) <= (prod.minStockAlert || 5);
                  const isOutOfStock = (prod.stockQty || 0) <= 0;

                  return (
                    <div
                      key={prod.id}
                      className="rounded-3xl bg-[#14141e] border border-amber-500/25 overflow-hidden flex flex-col justify-between hover:border-amber-400/50 transition group shadow-lg"
                    >
                      {/* Product Image & Badges */}
                      <div className="relative h-40 w-full bg-black overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            prod.image ||
                            (isSupply
                              ? "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500&auto=format&fit=crop&q=80"
                              : "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=500&auto=format&fit=crop&q=80")
                          }
                          alt={prod.nameAr}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#14141e] via-transparent to-black/30" />

                        {/* Type & Category Badges */}
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black border backdrop-blur-md ${
                              isSupply
                                ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/40"
                                : "bg-amber-500/20 text-amber-300 border-amber-400/40"
                            }`}
                          >
                            {isSupply ? "خامة تشغيل 💈" : "منتج زبون 🛍️"}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-black/70 text-[9px] font-bold text-slate-300 border border-white/10">
                            {prod.category}
                          </span>
                        </div>

                        {/* Branch badge */}
                        {prod.branch && (
                          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/80 text-[9px] font-bold text-amber-300 border border-amber-500/30">
                            📍 {prod.branch.name}
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-black text-sm text-white group-hover:text-amber-300 transition leading-snug">
                            {prod.nameAr}
                          </h4>
                          {prod.barcode && (
                            <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                              باركود: {prod.barcode}
                            </span>
                          )}
                        </div>

                        {/* Financials: Sell Price & Cost Price */}
                        <div className="p-2.5 rounded-2xl bg-black/50 border border-white/5 space-y-1.5 text-xs">
                          {!isSupply ? (
                            <>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-400">سعر البيع للزبون:</span>
                                <span className="font-mono font-black text-amber-400 text-sm">
                                  {prod.price} ج.م
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-[11px] text-slate-400">
                                <span>التكلفة: {prod.costPrice || 0} ج.م</span>
                                <span className="text-emerald-400 font-bold">
                                  الربح: {Math.max(0, (prod.price || 0) - (prod.costPrice || 0))} ج.م
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400">سعر الشراء / التكلفة:</span>
                              <span className="font-mono font-black text-cyan-300 text-sm">
                                {prod.costPrice || 0} ج.م
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Stock Quantity & Quick Adjustment */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] text-slate-400">الرصيد بالمخزن:</span>
                            <span
                              className={`text-xs font-mono font-black px-2 py-0.5 rounded-lg border ${
                                isOutOfStock
                                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                                  : isLowStock
                                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                  : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                              }`}
                            >
                              {isOutOfStock ? "نفذ (0 عبوة)" : `${prod.stockQty} عبوة`}
                            </span>
                          </div>

                          {/* Quick Adjust Buttons */}
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleAdjustStock(prod, -1)}
                              className="flex-1 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono font-bold transition border border-white/5 cursor-pointer"
                              title="سحب عبوة (-1)"
                            >
                              -1
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdjustStock(prod, 1)}
                              className="flex-1 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-emerald-300 text-xs font-mono font-bold transition border border-white/5 cursor-pointer"
                              title="إضافة عبوة (+1)"
                            >
                              +1
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdjustStock(prod, 10)}
                              className="flex-1 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-mono font-bold transition border border-amber-500/20 cursor-pointer"
                              title="إضافة دستة (+10)"
                            >
                              +10
                            </button>
                          </div>
                        </div>

                        {/* Card Actions */}
                        <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                          <button
                            type="button"
                            onClick={() => handleOpenEditProduct(prod)}
                            className="flex-1 py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>تعديل الصنف ✏️</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(prod.id, prod.nameAr)}
                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition cursor-pointer"
                            title="حذف الصنف من المخزن"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 8: CUSTOMERS CRM & MARKETING
           ======================================================== */}
        {activeTab === "customers" && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-base font-black text-white">قاعدة بيانات العملاء والتسويق والدعاية</h3>
              <p className="text-xs text-slate-400">
                سجل متكامل ببيانات العملاء وأرقام هواتفهم وإجمالي زياراتهم لأغراض الدعاية ورسائل الواتساب 📱
              </p>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#14141e]">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-black/40 text-slate-400 font-bold">
                    <th className="p-3.5">اسم العميل</th>
                    <th className="p-3.5">رقم الهاتف</th>
                    <th className="p-3.5">البريد الإلكتروني</th>
                    <th className="p-3.5">عدد الزيارات</th>
                    <th className="p-3.5">إجمالي المنصرف</th>
                    <th className="p-3.5">تصنيف VIP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-white/5 transition">
                      <td className="p-3.5 font-black text-white">{c.name}</td>
                      <td className="p-3.5 font-mono text-amber-300 font-bold">{c.phone}</td>
                      <td className="p-3.5 font-mono text-slate-400">{c.email || "غير مسجل"}</td>
                      <td className="p-3.5 font-mono text-white font-bold">{c.totalVisits} زيارة</td>
                      <td className="p-3.5 font-mono text-amber-400 font-black">{c.totalSpent} ج.م</td>
                      <td className="p-3.5">
                        <span className="py-0.5 px-2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black">
                          {c.vipLevel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 9: USERS & RBAC ACCESS CONTROL (FULL EDITING ADDED)
           ======================================================== */}
        {activeTab === "users" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-white">طاقم العمل والمستخدمين والصلاحيات</h3>
                <p className="text-xs text-slate-400">
                  إدارة وتعديل حسابات المديرين، الكاشير، المتخصصين والعمال مع إمكانية التعديل الشامل والتعطيل الفوري 🔒
                </p>
              </div>

              <button
                onClick={handleOpenCreateUser}
                className="py-2.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-md shadow-amber-500/20 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة مستخدم جديد 👤</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#14141e]">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-black/40 text-slate-400 font-bold">
                    <th className="p-3.5">المستخدم</th>
                    <th className="p-3.5">اسم الدخول</th>
                    <th className="p-3.5">الدور والصلاحية</th>
                    <th className="p-3.5">الفرع</th>
                    <th className="p-3.5">PIN السري</th>
                    <th className="p-3.5">الحالة</th>
                    <th className="p-3.5 text-center">التحكم والتعديل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-white/5 transition">
                      <td className="p-3.5 font-black text-white">{u.name}</td>
                      <td className="p-3.5 font-mono text-amber-300 font-bold">{u.username}</td>
                      <td className="p-3.5 font-bold">
                        <span className={`py-1 px-2.5 rounded-lg text-[10px] font-black border ${
                          u.role === "owner"
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            : u.role === "general_manager"
                            ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                            : u.role === "manager"
                            ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                            : u.role === "cashier"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            : "bg-pink-500/20 text-pink-300 border-pink-500/40"
                        }`}>
                          {u.role === "owner" && "المالك (Maestro) 👑"}
                          {u.role === "general_manager" && "المدير العام 🏢"}
                          {u.role === "manager" && "مدير فرع 👔"}
                          {u.role === "cashier" && "كاشير POS 💳"}
                          {u.role === "specialist" && "متخصص / خبيرة ✂️"}
                          {u.role === "worker" && "عامل ضيافة ☕"}
                          {!["owner", "general_manager", "manager", "cashier", "specialist", "worker"].includes(u.role) && u.role}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-400">{u.branchName}</td>
                      <td className="p-3.5 font-mono text-slate-400 font-bold">••••••</td>
                      <td className="p-3.5">
                        <span
                          className={`py-0.5 px-2 rounded-full text-[10px] font-black ${
                            u.isActive
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                          }`}
                        >
                          {u.isActive ? "نشط 🟢" : "معطل 🔴"}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditUser(u)}
                            className="py-1 px-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold transition flex items-center gap-1"
                          >
                            <Edit className="w-3 h-3" />
                            <span>تعديل ✏️</span>
                          </button>

                          {u.username !== "maestro" && (
                            <button
                              onClick={() => handleToggleUserActive(u.id, u.isActive)}
                              className={`py-1 px-2.5 rounded-xl text-[11px] font-bold transition border ${
                                u.isActive
                                  ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30"
                                  : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                              }`}
                            >
                              {u.isActive ? "تعطيل 🚫" : "تفعيل 🟢"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 10: MULTI-BRANCH SYSTEM
           ======================================================== */}
        {activeTab === "branches" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-white">فروع مجموعة الباشا والتوسعات المستقبلية</h3>
                <p className="text-xs text-slate-400">
                  إمكانية إضافة عدد غير محدود من الفروع ديناميكياً مع تخصيص كراسيها وموظفيها 📍
                </p>
              </div>

              <button
                onClick={() => setShowBranchModal(true)}
                className="py-2.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-md shadow-amber-500/20 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة فرع جديد 📍</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {branches.map((b) => (
                <div key={b.id} className="p-5 rounded-3xl bg-[#14141e] border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-base text-amber-400">{b.name}</h4>
                    <span className="font-mono text-xs font-bold text-slate-400">{b.code}</span>
                  </div>
                  <p className="text-xs text-slate-300">{b.address}</p>
                  <p className="text-xs font-mono text-amber-300 font-bold">الهاتف والواتساب: {b.phone}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 11: SYSTEM SETTINGS
           ======================================================== */}
        {activeTab === "settings" && (
          <div className="space-y-6 animate-fade-in font-sans text-xs" dir="rtl">
            {/* Header with Title and Quick Save Button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-[#14141e] border border-amber-500/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Settings className="w-6 h-6 animate-spin-slow" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>مركز التحكم في إعدادات المنظومة وهوية الصالون</span>
                    <span className="py-0.5 px-2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono">
                      VIP SYSTEM
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    التحكم في الهوية، الخط الساخن، العطلة الأسبوعية للحلاقين، ومواعيد العمل ونصوص الفواتير
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="py-2.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
              >
                {savingSettings ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جارٍ الحفظ...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>حفظ كافة الإعدادات 💾</span>
                  </>
                )}
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. BRAND & IDENTITY */}
                <div className="p-6 rounded-3xl bg-[#14141e] border border-amber-500/30 space-y-4 shadow-xl">
                  <div className="flex items-center gap-2 pb-3 border-b border-white/10 text-amber-400 font-black text-sm">
                    <Sparkles className="w-4 h-4" />
                    <h4>الهوية الملكية واسم الصالون والشعار</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-300 font-bold block mb-1">اسم الصالون (عربي):</label>
                      <input
                        type="text"
                        value={settingsForm.salonNameAr}
                        onChange={(e) => setSettingsForm({ ...settingsForm, salonNameAr: e.target.value })}
                        className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-bold focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 font-bold block mb-1">اسم الصالون (إنجليزي):</label>
                      <input
                        type="text"
                        value={settingsForm.salonNameEn}
                        onChange={(e) => setSettingsForm({ ...settingsForm, salonNameEn: e.target.value })}
                        className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* Logo Upload & Preview */}
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                    <label className="text-slate-300 font-bold block">شعار الصالون (Logo):</label>
                    <div className="flex items-center gap-4">
                      {settingsForm.logoUrl && (
                        <div className="w-16 h-16 rounded-2xl bg-[#0c0c12] border-2 border-amber-500/40 p-1 shrink-0 overflow-hidden shadow-lg flex items-center justify-center">
                          <img
                            src={settingsForm.logoUrl}
                            alt="Logo Preview"
                            className="w-full h-full object-cover rounded-xl"
                            onError={(e: any) => {
                              e.currentTarget.src = "/logo.jpg";
                            }}
                          />
                        </div>
                      )}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer py-2 px-3.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition flex items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5" />
                            <span>رفع شعار جديد عبر ImgBB 📷</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) =>
                                handleUploadFile(e, (url: string) =>
                                  setSettingsForm((prev) => ({ ...prev, logoUrl: url }))
                                )
                              }
                            />
                          </label>
                          {uploadingImage && (
                            <span className="text-[11px] text-amber-300 animate-pulse flex items-center gap-1">
                              <RefreshCw className="w-3 h-3 animate-spin" /> جارٍ الرفع...
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={settingsForm.logoUrl}
                          onChange={(e) => setSettingsForm({ ...settingsForm, logoUrl: e.target.value })}
                          placeholder="أو ضع رابط الشعار المباشر هنا..."
                          className="w-full py-1.5 px-3 rounded-xl bg-black/60 border border-white/10 text-slate-300 font-mono text-[11px] focus:border-amber-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. CONTACTS, HOTLINE & SOCIAL */}
                <div className="p-6 rounded-3xl bg-[#14141e] border border-amber-500/30 space-y-4 shadow-xl">
                  <div className="flex items-center gap-2 pb-3 border-b border-white/10 text-amber-400 font-black text-sm">
                    <Phone className="w-4 h-4" />
                    <h4>أرقام التواصل والخط الساخن والروابط</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-300 font-bold block mb-1">الخط الساخن الموحد (Hotline):</label>
                      <input
                        type="text"
                        value={settingsForm.hotline}
                        onChange={(e) => setSettingsForm({ ...settingsForm, hotline: e.target.value })}
                        placeholder="01121537537"
                        className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-amber-300 font-mono font-bold focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 font-bold block mb-1">رقم الواتساب الرسمي المعتمد:</label>
                      <input
                        type="text"
                        value={settingsForm.whatsappNumber}
                        onChange={(e) => setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })}
                        placeholder="01121537537"
                        className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-emerald-300 font-mono font-bold focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 font-bold block mb-1">هاتف صالون دقن الباشا (رجالي):</label>
                      <input
                        type="text"
                        value={settingsForm.hadayekPhone}
                        onChange={(e) => setSettingsForm({ ...settingsForm, hadayekPhone: e.target.value })}
                        placeholder="01210103025"
                        className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 font-bold block mb-1">هاتف حمام الباشا (حريمي وسبا):</label>
                      <input
                        type="text"
                        value={settingsForm.nasrCityPhone}
                        onChange={(e) => setSettingsForm({ ...settingsForm, nasrCityPhone: e.target.value })}
                        placeholder="01556782015"
                        className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 font-bold block mb-1">رابط فيسبوك دقن الباشا (رجالي):</label>
                      <input
                        type="text"
                        value={settingsForm.facebookUrl}
                        onChange={(e) => setSettingsForm({ ...settingsForm, facebookUrl: e.target.value })}
                        placeholder="https://www.facebook.com/DaknElbashaSalon"
                        className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-sky-400 font-mono text-[11px] focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 font-bold block mb-1">رابط فيسبوك حمام الباشا (حريمي وسبا):</label>
                      <input
                        type="text"
                        value={settingsForm.instagramUrl}
                        onChange={(e) => setSettingsForm({ ...settingsForm, instagramUrl: e.target.value })}
                        placeholder="https://www.facebook.com/hammam.elbasha1/"
                        className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-pink-400 font-mono text-[11px] focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. BARBER WEEKLY DAY OFF & WORKING HOURS */}
                <div className="p-6 rounded-3xl bg-[#14141e] border border-amber-500/30 space-y-4 shadow-xl">
                  <div className="flex items-center gap-2 pb-3 border-b border-white/10 text-amber-400 font-black text-sm">
                    <Scissors className="w-4 h-4" />
                    <h4>العطلة الأسبوعية للحلاقين ومواعيد العمل الرسمية 💈</h4>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="font-bold text-white text-xs block">
                          تفعيل الإجازة الأسبوعية للصالون
                        </span>
                        <span className="text-[11px] text-slate-400">
                          إغلاق الحجوزات وإعلام الزبائن بأن الصالون في عطلة أسبوعية
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settingsForm.isDayOffEnabled}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, isDayOffEnabled: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="text-slate-300 font-bold block mb-1">
                          يوم العطلة الأسبوعية للحلاقين:
                        </label>
                        <select
                          value={settingsForm.weeklyDayOff}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, weeklyDayOff: e.target.value })
                          }
                          className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-amber-300 font-bold focus:border-amber-400"
                        >
                          <option value="MONDAY">الإثنين (الإجازة الرسمية لصالونات الحلاقة 💈 - موصى بها)</option>
                          <option value="SUNDAY">الأحد</option>
                          <option value="TUESDAY">الثلاثاء</option>
                          <option value="WEDNESDAY">الأربعاء</option>
                          <option value="THURSDAY">الخميس</option>
                          <option value="FRIDAY">الجمعة</option>
                          <option value="SATURDAY">السبت</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-slate-300 font-bold block mb-1">
                          فترات المواعيد (Slot Interval):
                        </label>
                        <select
                          value={settingsForm.bookingSlotInterval}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              bookingSlotInterval: Number(e.target.value),
                            })
                          }
                          className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono focus:border-amber-400"
                        >
                          <option value={15}>كل 15 دقيقة</option>
                          <option value={20}>كل 20 دقيقة</option>
                          <option value={30}>كل 30 دقيقة (الافتراضي الملكي)</option>
                          <option value={45}>كل 45 دقيقة</option>
                          <option value={60}>كل 60 دقيقة (ساعة كاملة)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-300 font-bold block mb-1">
                        رسالة التنبيه التي تظهر للعميل في يوم الإجازة:
                      </label>
                      <input
                        type="text"
                        value={settingsForm.dayOffMessage}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, dayOffMessage: e.target.value })
                        }
                        className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-amber-200 text-xs focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-300 font-bold block mb-1">وقت فتح الصالون (بدء الدوام):</label>
                      <input
                        type="text"
                        value={settingsForm.defaultOpenHour}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, defaultOpenHour: e.target.value })
                        }
                        placeholder="12:00 PM"
                        className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono font-bold focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 font-bold block mb-1">وقت الإغلاق (انتهاء الدوام):</label>
                      <input
                        type="text"
                        value={settingsForm.defaultCloseHour}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, defaultCloseHour: e.target.value })
                        }
                        placeholder="02:00 AM"
                        className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono font-bold focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. RECEIPT CUSTOMIZATION & 15-MIN REMINDER */}
                <div className="p-6 rounded-3xl bg-[#14141e] border border-amber-500/30 space-y-4 shadow-xl">
                  <div className="flex items-center gap-2 pb-3 border-b border-white/10 text-amber-400 font-black text-sm">
                    <Receipt className="w-4 h-4" />
                    <h4>إعدادات بون الحساب ونظام التذكير الذكي (15 دقيقة)</h4>
                  </div>

                  {/* 15-Minute Reminder Policy */}
                  <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-sky-400" />
                        <span className="font-bold text-white text-xs">
                          نظام التنبيه التلقائي قبل الموعد الملكي
                        </span>
                      </div>
                      <span className="py-0.5 px-2.5 rounded-full bg-sky-500/20 text-sky-300 font-mono text-[11px] font-bold">
                        {settingsForm.reminderMinutesBefore} دقيقة قبل الموعد
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      يقوم السيستم بإطلاق تنبيه صوتي وشريط ملكي في واجهة العميل عند اقتراب موعده بـ {settingsForm.reminderMinutesBefore} دقيقة لتذكيره بالوصول في الموعد المحدد.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <label className="text-slate-300 font-bold text-xs">تعديل زمن التذكير:</label>
                      <select
                        value={settingsForm.reminderMinutesBefore}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            reminderMinutesBefore: Number(e.target.value),
                          })
                        }
                        className="py-1 px-3 rounded-xl bg-black/60 border border-white/10 text-sky-300 font-mono text-xs focus:border-amber-400"
                      >
                        <option value={10}>قبل الموعد بـ 10 دقائق</option>
                        <option value={15}>قبل الموعد بـ 15 دقيقة (الموصى به)</option>
                        <option value={20}>قبل الموعد بـ 20 دقيقة</option>
                        <option value={30}>قبل الموعد بـ 30 دقيقة</option>
                      </select>
                    </div>
                  </div>

                  {/* Receipt Footer Notes */}
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-bold block">
                      ديباجة وتذييل الإيصال الحراري المطبوع (Thermal Receipt Footer):
                    </label>
                    <textarea
                      rows={2}
                      value={settingsForm.receiptFooterNotes}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, receiptFooterNotes: e.target.value })
                      }
                      placeholder="شكراً لزيارتكم مجموعة صالونات وسبا الباشا VIP 👑 تجربة ملكية استثنائية"
                      className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-amber-300 text-xs focus:border-amber-400 leading-relaxed"
                    />
                    <p className="text-[10px] text-slate-500">
                      ملاحظة: الفاتورة تطبع تلقائياً اسم المتخصص، رقم الكرسي، اسم العميل، عنوان الفرع، والخط الساخن.
                    </p>
                  </div>

                  {/* Emergency Lock */}
                  <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-rose-300 font-bold">
                        <Lock className="w-4 h-4" />
                        <span>قفل المنظومة للصيانة أو الطوارئ</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settingsForm.systemLocked}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, systemLocked: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                      </label>
                    </div>
                    {settingsForm.systemLocked && (
                      <input
                        type="text"
                        value={settingsForm.lockMessage}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, lockMessage: e.target.value })
                        }
                        placeholder="رسالة تظهر للعملاء أثناء الصيانة..."
                        className="w-full py-1.5 px-3 rounded-xl bg-black/60 border border-rose-500/40 text-rose-200 text-xs focus:border-rose-400"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Sticky-like Action Bar */}
              <div className="p-5 rounded-3xl bg-gradient-to-r from-[#161622] via-[#1a1a28] to-[#161622] border-2 border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
                    👑
                  </div>
                  <div>
                    <h4 className="font-black text-white text-sm">حفظ كافة التغييرات على المنظومة</h4>
                    <p className="text-slate-400 text-xs">
                      يتم تفعيل المواعيد والإعدادات فوراً في واجهة العملاء ونقطة البيع (POS).
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingSettings}
                  className="w-full sm:w-auto py-3 px-8 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 disabled:opacity-50 cursor-pointer"
                >
                  {savingSettings ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جارٍ حفظ الإعدادات...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>اعتماد وحفظ كافة الإعدادات الملكية 💾</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* ─────────────────────────────────────────────────────────────
          5. MODALS
         ───────────────────────────────────────────────────────────── */}
      {/* 1. SPECIALIST MODAL */}
      {showSpecialistModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-sans" dir="rtl">
          <div className="relative w-full max-w-md bg-[#12121a] border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-black text-white">إضافة / تعديل متخصص حلاقة</h3>
              <button onClick={() => setShowSpecialistModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveSpecialist} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">الاسم:</label>
                <input
                  type="text"
                  required
                  value={specForm.name}
                  onChange={(e) => setSpecForm({ ...specForm, name: e.target.value })}
                  placeholder="مثال: كابتن حسام الباشا أو مدام أمينة المغربية"
                  className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">المسمى المهني والتخصص:</label>
                  <input
                    type="text"
                    value={specForm.title}
                    onChange={(e) => setSpecForm({ ...specForm, title: e.target.value })}
                    placeholder="كبير خبراء التصفيف والحلاقة"
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">رقم الهاتف:</label>
                  <input
                    type="text"
                    value={specForm.phone}
                    onChange={(e) => setSpecForm({ ...specForm, phone: e.target.value })}
                    placeholder="010XXXXXXXX"
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5 p-3 rounded-2xl bg-black/40 border border-white/10">
                <label className="text-slate-300 font-bold block text-xs">
                  الصورة الشخصية للمتخصص (رفع فوري عبر ImgBB 📷):
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-400 bg-black shrink-0 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={specForm.photo || "/logo.jpg"}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="w-full py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-400/30 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm">
                      <Upload className="w-4 h-4 text-amber-400" />
                      <span>{uploadingImage ? "جاري الرفع على ImgBB..." : "اختر صورة للمتخصص لرفعها 📷"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingImage}
                        onChange={(e) =>
                          handleUploadFile(e, (url) => setSpecForm({ ...specForm, photo: url }))
                        }
                      />
                    </label>
                    <input
                      type="text"
                      value={specForm.photo}
                      onChange={(e) => setSpecForm({ ...specForm, photo: e.target.value })}
                      placeholder="رابط ImgBB المولد تلقائياً"
                      className="w-full py-1 px-2.5 rounded-lg bg-black/60 border border-white/10 text-white font-mono text-[10px] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">الفرع:</label>
                  <select
                    value={specForm.branchId}
                    onChange={(e) => setSpecForm({ ...specForm, branchId: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">رقم الكرسي:</label>
                  <input
                    type="number"
                    min={1}
                    value={specForm.chairNumber}
                    onChange={(e) => setSpecForm({ ...specForm, chairNumber: Number(e.target.value) })}
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">نظام الحساب:</label>
                <select
                  value={specForm.payType}
                  onChange={(e) => setSpecForm({ ...specForm, payType: e.target.value })}
                  className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white"
                >
                  <option value="DAILY">راتب يومي</option>
                  <option value="WEEKLY">راتب أسبوعي</option>
                  <option value="MONTHLY">راتب شهري</option>
                  <option value="COMMISSION_ONLY">عمولة فقط (%)</option>
                  <option value="SALARY_PLUS_COMMISSION">راتب أساسي + عمولة (%)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">الراتب الأساسي (ج.م):</label>
                  <input
                    type="number"
                    min={0}
                    value={specForm.baseSalary}
                    onChange={(e) => setSpecForm({ ...specForm, baseSalary: Number(e.target.value) })}
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">نسبة العمولة (%):</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={specForm.commissionRate}
                    onChange={(e) => setSpecForm({ ...specForm, commissionRate: Number(e.target.value) })}
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition mt-2"
              >
                حفظ بيانات المتخصص 💾
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. USER MODAL (CREATE & FULL EDIT) */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-sans" dir="rtl">
          <div className="relative w-full max-w-md bg-[#12121a] border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-black text-white">
                {editingUser ? `تعديل المستخدم (${editingUser.name})` : "إضافة مستخدم جديد للطاقم"}
              </h3>
              <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">الاسم بالكامل:</label>
                <input
                  type="text"
                  required
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="مثال: أحمد عبد الرحمن"
                  className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">اسم الدخول (Username):</label>
                  <input
                    type="text"
                    required
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    placeholder="cashier-nasr"
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">رمز PIN السري (6 أرقام):</label>
                  <input
                    type="password"
                    maxLength={6}
                    value={userForm.pin}
                    onChange={(e) => setUserForm({ ...userForm, pin: e.target.value })}
                    placeholder="157230"
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-center tracking-widest focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  {editingUser ? "كلمة المرور (اتركها فارغة للاحتفاظ بالحالية):" : "كلمة المرور:"}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder={editingUser ? "••••••••" : "كلمة المرور"}
                  className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">الدور والصلاحية:</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="owner">المالك (Maestro)</option>
                    <option value="general_manager">المدير العام</option>
                    <option value="manager">مدير فرع</option>
                    <option value="cashier">كاشير نقطة البيع POS</option>
                    <option value="specialist">متخصص / خبيرة (حلاقة أو سبا)</option>
                    <option value="worker">عامل صالون وضيافة</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">الفرع التابع له:</label>
                  <select
                    value={userForm.branchId}
                    onChange={(e) => setUserForm({ ...userForm, branchId: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="">إشراف عام على كل الفروع</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">رقم الهاتف:</label>
                <input
                  type="tel"
                  value={userForm.phone}
                  onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                  placeholder="01121537537"
                  className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition mt-2 shadow-lg shadow-amber-500/20"
              >
                {editingUser ? "حفظ التعديلات على المستخدم 💾" : "إضافة المستخدم الآن 👤"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. OFFER MODAL (CREATE & FULL EDIT) */}
      {showOfferModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-sans" dir="rtl">
          <div className="relative w-full max-w-lg bg-[#12121a] border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-black text-white">
                {editingOffer ? `تعديل العرض الملكي (${editingOffer.titleAr})` : "إضافة عرض ملكي جديد 👑"}
              </h3>
              <button onClick={() => setShowOfferModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveOffer} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">عنوان العرض / الباكدج:</label>
                <input
                  type="text"
                  required
                  value={offerForm.titleAr}
                  onChange={(e) => setOfferForm({ ...offerForm, titleAr: e.target.value })}
                  placeholder="مثال: عرض العريس الملكي المتكامل"
                  className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">السعر الحالي (ج.م):</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={offerForm.price}
                    onChange={(e) => setOfferForm({ ...offerForm, price: Number(e.target.value) })}
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono font-bold text-amber-400"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">السعر الأصلي (ج.م):</label>
                  <input
                    type="number"
                    value={offerForm.oldPrice}
                    onChange={(e) => setOfferForm({ ...offerForm, oldPrice: e.target.value as any })}
                    placeholder="4000"
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">الشارة الترويجية (Badge):</label>
                  <input
                    type="text"
                    value={offerForm.badge}
                    onChange={(e) => setOfferForm({ ...offerForm, badge: e.target.value })}
                    placeholder="خصم 46% 🔥"
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5 p-3 rounded-2xl bg-black/40 border border-white/10">
                <label className="text-slate-300 font-bold block text-xs">
                  فلاير أو صورة العرض الإعلانية (رفع فوري عبر ImgBB 📷):
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-400 bg-black shrink-0 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={offerForm.image || "/offers/offer-vip-1000.jpg"}
                      alt="Flyer Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="w-full py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-400/30 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm">
                      <Upload className="w-4 h-4 text-amber-400" />
                      <span>{uploadingImage ? "جاري الرفع على ImgBB..." : "اختر فلاير العرض لرفعه 📷"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingImage}
                        onChange={(e) =>
                          handleUploadFile(e, (url) => setOfferForm({ ...offerForm, image: url }))
                        }
                      />
                    </label>
                    <input
                      type="text"
                      required
                      value={offerForm.image}
                      onChange={(e) => setOfferForm({ ...offerForm, image: e.target.value })}
                      placeholder="/offers/offer-vip-1000.jpg أو رابط ImgBB"
                      className="w-full py-1 px-2.5 rounded-lg bg-black/60 border border-white/10 text-white font-mono text-[10px] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">الفرع المتاح به العرض:</label>
                  <select
                    value={offerForm.branchId}
                    onChange={(e) => setOfferForm({ ...offerForm, branchId: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white"
                  >
                    <option value="">متاح في جميع الفروع 📍</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">ترتيب الظهور:</label>
                  <input
                    type="number"
                    min={1}
                    value={offerForm.sortOrder}
                    onChange={(e) => setOfferForm({ ...offerForm, sortOrder: Number(e.target.value) })}
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">وصف العرض المختصر:</label>
                <input
                  type="text"
                  value={offerForm.description}
                  onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
                  placeholder="تجربة متكاملة تخليك في أفضل لوك قبل أهم يوم في حياتك"
                  className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  المميزات والمراحل (اكتب كل ميزة في سطر منفصل):
                </label>
                <textarea
                  rows={4}
                  value={offerForm.features}
                  onChange={(e) => setOfferForm({ ...offerForm, features: e.target.value })}
                  placeholder="قص شعر وتدريج ملكي احترافي&#10;تحديد ورسم الذقن بالبخار&#10;تنظيف بشرة هيدروفيشيل 11 مرحلة&#10;مساج كامل للجسم"
                  className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition mt-2 shadow-lg shadow-amber-500/20"
              >
                {editingOffer ? "حفظ تعديلات العرض الملكي 👑" : "نشر العرض الملكي الآن 👑"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. PAYOUT / ADVANCE MODAL */}
      {showPayoutModal && payoutSpecialist && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-sans" dir="rtl">
          <div className="relative w-full max-w-sm bg-[#12121a] border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-sm font-black text-white">تسجيل حركة مالية</h3>
                <p className="text-[11px] text-amber-300 font-bold">{payoutSpecialist.name}</p>
              </div>
              <button onClick={() => setShowPayoutModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleRecordPayout} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">نوع الحركة:</label>
                <select
                  value={payoutType}
                  onChange={(e) => setPayoutType(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white"
                >
                  <option value="ADVANCE_WITHDRAWAL">سلفة على الحساب 💸</option>
                  <option value="SALARY_PAYOUT">صرف راتب / أجر كامل 💰</option>
                  <option value="BONUS">مكافأة إضافية 🎁</option>
                  <option value="DEDUCTION">خصم 🔻</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">المبلغ (ج.م):</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(Number(e.target.value))}
                  className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">ملاحظات أو بيان:</label>
                <input
                  type="text"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  placeholder="مثال: سلفة نقدية من الخزينة"
                  className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition"
              >
                تأكيد وتسجيل الحركة 💵
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SHIFT ATTENDANCE & REASON MODAL */}
      {showShiftStatusModal && statusTargetSpecialist && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-sans" dir="rtl">
          <div className="relative w-full max-w-sm bg-[#12121a] border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-sm font-black text-white">تحديد حالة الوردية والحضور</h3>
                <p className="text-[11px] text-amber-300 font-bold">{statusTargetSpecialist.name}</p>
              </div>
              <button onClick={() => setShowShiftStatusModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveShiftStatus} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">الحالة المطلوبة:</label>
                <select
                  value={newShiftStatus}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewShiftStatus(val);
                    if (val === "AVAILABLE" && !shiftStatusReason) setShiftStatusReason("حاضر وبدأ الوردية");
                    if (val === "OFF_DUTY" && !shiftStatusReason) setShiftStatusReason("انتهت الوردية وغادر الصالون");
                    if (val === "DAY_OFF" && !shiftStatusReason) setShiftStatusReason("إجازة رسمية / أسبوعية");
                    if (val === "BREAK" && !shiftStatusReason) setShiftStatusReason("استراحة قصيرة");
                    if (val === "ABSENT" && !shiftStatusReason) setShiftStatusReason("غائب بدون إذن");
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-bold"
                >
                  <option value="AVAILABLE">🟢 حاضر ومتاح وبدأ الوردية</option>
                  <option value="WITH_CLIENT">💺 على الكرسي مع عميل</option>
                  <option value="BREAK">☕ في استراحة مؤقتة</option>
                  <option value="OFF_DUTY">🏠 انتهت الوردية ومشي (تعطيل اليوم)</option>
                  <option value="DAY_OFF">🏖️ إجازة رسمية (تعطيل اليوم)</option>
                  <option value="ABSENT">🔴 غائب بدون إذن (تعطيل اليوم)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">سبب التعطيل / الملاحظة (يظهر للعميل والإدارة):</label>
                <input
                  type="text"
                  value={shiftStatusReason}
                  onChange={(e) => setShiftStatusReason(e.target.value)}
                  placeholder="مثال: إجازة أسبوعية، راحة غداء، غادر بعد انتهاء الوردية"
                  className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {["بدأ الوردية الصباحية", "راحة غداء ☕", "انتهت الوردية ومشي 🏠", "إجازة أسبوعية 🏖️", "إجازة مرضية 🏥"].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setShiftStatusReason(chip)}
                      className="text-[10px] py-0.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition mt-2 shadow-lg shadow-amber-500/20"
              >
                تطبيق وتحديث حالة الوردية 💈
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. SERVICE MODAL */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-sans" dir="rtl">
          <div className="relative w-full max-w-md bg-[#12121a] border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-black text-white">
                {editingService ? `تعديل خدمة (${editingService.nameAr})` : "إضافة خدمة تجميل جديدة"}
              </h3>
              <button onClick={() => setShowServiceModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">اسم الخدمة (عربي):</label>
                <input
                  type="text"
                  required
                  value={serviceForm.nameAr}
                  onChange={(e) => setServiceForm({ ...serviceForm, nameAr: e.target.value })}
                  placeholder="مثال: حلاقة شعر ملكية كلاسيك"
                  className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">السعر (ج.م):</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm({ ...serviceForm, price: Number(e.target.value) })}
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">المدة التقديرية (بالدقائق):</label>
                  <input
                    type="number"
                    min={5}
                    value={serviceForm.durationMinutes}
                    onChange={(e) => setServiceForm({ ...serviceForm, durationMinutes: Number(e.target.value) })}
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">القسم والتصنيف:</label>
                  <select
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white"
                  >
                    <option value="HAIR">شعر ✂️</option>
                    <option value="BEARD">دقن 🧔</option>
                    <option value="VIP_PACKAGES">بكجات VIP 👑</option>
                    <option value="SKIN_CARE">عناية بالبشرة 🔥</option>
                    <option value="COLOR_KERATIN">فرد وصبغة وبروتين 💆</option>
                    <option value="KIDS">أطفال 👶</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">حالة الخدمة:</label>
                  <select
                    value={serviceForm.isActive ? "true" : "false"}
                    onChange={(e) => setServiceForm({ ...serviceForm, isActive: e.target.value === "true" })}
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white"
                  >
                    <option value="true">نشط ومتاح للحجز 🟢</option>
                    <option value="false">معطل ومخفي 🔴</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5 p-3 rounded-2xl bg-black/40 border border-white/10">
                <label className="text-slate-300 font-bold block text-xs">
                  صورة الخدمة (رفع فوري عبر ImgBB 📷):
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-400 bg-black shrink-0 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        serviceForm.image ||
                        "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600&auto=format&fit=crop&q=80"
                      }
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="w-full py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-400/30 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm">
                      <Upload className="w-4 h-4 text-amber-400" />
                      <span>{uploadingImage ? "جاري الرفع على ImgBB..." : "اختر صورة للخدمة لرفعها 📷"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingImage}
                        onChange={(e) =>
                          handleUploadFile(e, (url) => setServiceForm({ ...serviceForm, image: url }))
                        }
                      />
                    </label>
                    <input
                      type="text"
                      value={serviceForm.image}
                      onChange={(e) => setServiceForm({ ...serviceForm, image: e.target.value })}
                      placeholder="رابط ImgBB أو مسار الصورة"
                      className="w-full py-1 px-2.5 rounded-lg bg-black/60 border border-white/10 text-white font-mono text-[10px] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">وصف الخدمة:</label>
                <textarea
                  rows={2}
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  placeholder="تفاصيل الخدمة وما تقدمه للزبون..."
                  className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition mt-2 shadow-lg shadow-amber-500/20"
              >
                {editingService ? "حفظ تعديلات الخدمة 💈" : "إضافة ونشر الخدمة 💈"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 6. BRANCH MODAL */}
      {showBranchModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-sans" dir="rtl">
          <div className="relative w-full max-w-sm bg-[#12121a] border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-black text-white">إضافة فرع جديد لمجموعة الباشا</h3>
              <button onClick={() => setShowBranchModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveBranch} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">اسم الفرع:</label>
                <input
                  type="text"
                  required
                  value={branchForm.name}
                  onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                  placeholder="مثال: فرع المهندسين"
                  className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">كود الفرع:</label>
                <input
                  type="text"
                  required
                  value={branchForm.code}
                  onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                  placeholder="BR-MOHANDESSIN"
                  className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">العنوان التفصيلي:</label>
                <input
                  type="text"
                  required
                  value={branchForm.address}
                  onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                  placeholder="شارع جامعة الدول العربية"
                  className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">رقم الهاتف والواتساب:</label>
                <input
                  type="tel"
                  required
                  value={branchForm.phone}
                  onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value, whatsapp: e.target.value })}
                  placeholder="01121537537"
                  className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition cursor-pointer"
              >
                حفظ وإضافة الفرع 📍
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. PRODUCT & RAW MATERIALS MODAL (CREATE / EDIT & LIVE IMGBB)
         ───────────────────────────────────────────────────────────── */}
      {showProductModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-sans"
          dir="rtl"
        >
          <div className="relative w-full max-w-lg bg-[#12121a] border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <span>🛍️</span>
                <span>{editingProduct ? `تعديل الصنف (${editingProduct.nameAr})` : "إضافة منتج أو خامة جديدة للمخزن"}</span>
              </h3>
              <button
                onClick={() => {
                  setShowProductModal(false);
                  setEditingProduct(null);
                }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
              {/* Category with Optgroups */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">نوع وتصنيف الصنف:</label>
                <select
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-bold"
                >
                  <optgroup label="🛍️ منتجات بيع للعملاء">
                    <option value="STYLING">تصفيف شعر وواكس ومات (STYLING)</option>
                    <option value="BEARD_CARE">عناية باللحية وزيوت وسيروم (BEARD_CARE)</option>
                    <option value="SKIN_CARE">عناية بالبشرة وماسكات وغسول (SKIN_CARE)</option>
                    <option value="PERFUMES">عطور رجالية ومخمرية نسائية VIP (PERFUMES)</option>
                  </optgroup>
                  <optgroup label="💈 خامات ومستلزمات تشغيل الصالون">
                    <option value="SUPPLIES">خامات حلاقة وتشغيل (شفرات، قطن، فازلين، شمع)</option>
                    <option value="COLOR_SUPPLIES">خامات صبغات وتلوين وأكسجين (COLOR)</option>
                    <option value="PROTEIN_SUPPLIES">خامات بروتين ومعالجات وكيراتين (PROTEIN)</option>
                    <option value="ACCESSORIES">مناشف ومستلزمات تعقيم وأدوات صالون</option>
                  </optgroup>
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">اسم الصنف أو الخامة بالعربي:</label>
                <input
                  type="text"
                  required
                  value={productForm.nameAr}
                  onChange={(e) => setProductForm({ ...productForm, nameAr: e.target.value })}
                  placeholder="مثال: شمع شعر عنبر تثبيت 24 ساعة أو شفرات حلاقة دوركو تيتانيوم"
                  className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white"
                />
              </div>

              {/* Branch */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">الفرع المتاح به الصنف:</label>
                <select
                  value={productForm.branchId}
                  onChange={(e) => setProductForm({ ...productForm, branchId: e.target.value })}
                  className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white"
                >
                  <option value="">متاح بجميع الفروع (عام للمنظومة)</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price & Cost */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    سعر البيع للزبون (ج.م):
                    <span className="text-[10px] text-amber-300 mr-1">(0 للخامات)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">سعر الشراء / التكلفة (ج.م):</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={productForm.costPrice}
                    onChange={(e) => setProductForm({ ...productForm, costPrice: Number(e.target.value) })}
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono"
                  />
                </div>
              </div>

              {/* Stock & Min Alert */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">الكمية المتاحة بالمخزن:</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={productForm.stockQty}
                    onChange={(e) => setProductForm({ ...productForm, stockQty: Number(e.target.value) })}
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">حد التنبيه عند نقص المخزون:</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={productForm.minStockAlert}
                    onChange={(e) => setProductForm({ ...productForm, minStockAlert: Number(e.target.value) })}
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono"
                  />
                </div>
              </div>

              {/* Barcode */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">الباركود (اختياري):</label>
                <input
                  type="text"
                  value={productForm.barcode}
                  onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })}
                  placeholder="مثال: SUP-001 أو باركود العبوة"
                  className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono"
                />
              </div>

              {/* ImgBB Direct Upload & Preview */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-black/40 border border-white/10">
                <label className="text-slate-300 font-bold block text-xs">
                  صورة الصنف (رفع فوري ومباشر عبر ImgBB 📷):
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-400 bg-black shrink-0 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        productForm.image ||
                        "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=500&auto=format&fit=crop&q=80"
                      }
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="w-full py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-400/30 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm">
                      <Upload className="w-4 h-4 text-amber-400" />
                      <span>{uploadingImage ? "جاري الرفع على ImgBB..." : "اختر صورة لرفعها من جهازك 📷"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingImage}
                        onChange={(e) =>
                          handleUploadFile(e, (url: string) => {
                            setProductForm((prev) => ({ ...prev, image: url }));
                            showToast("success", "تم رفع صورة الصنف بنجاح عبر ImgBB 📸");
                          })
                        }
                      />
                    </label>
                    <input
                      type="url"
                      value={productForm.image}
                      onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                      placeholder="أو اكتب رابط الصورة هنا"
                      className="w-full py-1.5 px-3 rounded-xl bg-black/60 border border-white/10 text-white text-[11px] font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                {editingProduct ? "حفظ التعديلات على الصنف 💾" : "حفظ وإضافة الصنف للمخزن 🛍️"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. TREASURY EXPENSE MODAL (تسجيل مصروف / نثريات)
         ───────────────────────────────────────────────────────────── */}
      {showExpenseModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-sans"
          dir="rtl"
        >
          <div className="relative w-full max-w-md bg-[#12121a] border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-black text-white">تسجيل مصروف / نثريات من الخزينة</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowExpenseModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">بند وتصنيف المصروف:</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-bold"
                >
                  <option value="SUPPLIES">مستلزمات وخامات حلاقة وعناية 🧴</option>
                  <option value="REFRESHMENTS">ضيافة وبوفيه ومشروبات زبائن ☕</option>
                  <option value="RENT_UTILITIES">إيجار وكهرباء ومياه وإنترنت ⚡</option>
                  <option value="MAINTENANCE">صيانة ونظافة وأدوات صالون 🧹</option>
                  <option value="MARKETING">تسويق ودعاية وإعلانات 📢</option>
                  <option value="GENERAL">نثريات ومصروفات عامة 🧾</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">المبلغ (ج.م):</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={expenseForm.amount || ""}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono font-bold text-sm"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">طريقة الصرف:</label>
                  <select
                    value={expenseForm.paymentMethod}
                    onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-bold"
                  >
                    <option value="CASH">كاش من درج الخزينة 💵</option>
                    <option value="INSTAPAY">انستاباي InstaPay ⚡</option>
                    <option value="VODAFONE_CASH">فودافون كاش 📱</option>
                    <option value="CARD">فيزا / بطاقة بنكية 💳</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">البيان والغرض من المصروف:</label>
                <input
                  type="text"
                  required
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="مثال: شراء كحول وشفرات حلاقة دوركو تيتانيوم"
                  className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  اسم المستلم أو الجهة المصروف لها (اختياري):
                </label>
                <input
                  type="text"
                  value={expenseForm.recipientName}
                  onChange={(e) => setExpenseForm({ ...expenseForm, recipientName: e.target.value })}
                  placeholder="مثال: مندوب شركة الأدوات أو المحاسب"
                  className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white"
                />
              </div>

              {branches.length > 1 && (
                <div>
                  <label className="text-slate-300 font-bold block mb-1">الفرع المنسوب إليه المصروف:</label>
                  <select
                    value={expenseForm.branchId || branches[0]?.id}
                    onChange={(e) => setExpenseForm({ ...expenseForm, branchId: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-bold"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300">
                ⚠️ سيتم خصم هذا المبلغ فورياً من رصيد الخزينة والدرج للفرع المختار، وتسجيله في كشف الحسابات العام.
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                تأكيد وتسجيل المصروف بالخزينة 🧾
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. ADMIN CLOSE SHIFT MODAL (إقفال واعتماد الوردية وتسليم النقدية)
         ───────────────────────────────────────────────────────────── */}
      {showAdminCloseShiftModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex justify-center items-start sm:items-center py-6 sm:py-10 px-3 font-sans"
          dir="rtl"
        >
          <div className="relative w-full max-w-lg my-auto bg-[#12121a] border border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-black text-white">إقفال واعتماد وردية الخزينة والتسليم</h3>
                  <p className="text-[11px] text-amber-300 font-bold">
                    وردية #{adminOpenShift?.shiftNumber || 1} • {adminOpenShift?.branch?.name || "الفرع الحالي"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAdminCloseShiftModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto pr-1 space-y-3 flex-1 text-xs">

            {/* Live Shift Breakdown Statistics */}
            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2 pb-2 border-b border-white/10">
                <div>
                  <span className="text-slate-400 block text-[10px]">الكاشير المسؤول:</span>
                  <span className="text-white font-bold">{adminOpenShift?.openedBy || currentUser?.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">وقت بدء الوردية:</span>
                  <span className="text-amber-300 font-mono text-[11px]">
                    {adminOpenShift?.openedAt
                      ? new Date(adminOpenShift.openedAt).toLocaleTimeString("ar-EG", {
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
                    {adminShiftStats?.servicesTotal || 0} ج
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-slate-400 block text-[10px]">إيراد المنتجات:</span>
                  <span className="font-mono font-bold text-white">
                    {adminShiftStats?.retailTotal || 0} ج
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-slate-400 block text-[10px]">سلف المختصين:</span>
                  <span className="font-mono font-bold text-rose-300">
                    -{adminShiftStats?.advancesPayouts || 0} ج
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-slate-400 block text-[10px]">المصروفات:</span>
                  <span className="font-mono font-bold text-rose-300">
                    -{adminShiftStats?.expensesTotal || 0} ج
                  </span>
                </div>
              </div>

              {/* Payment Methods Breakdown */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px]">
                <span className="text-slate-400 font-bold">المقبوضات:</span>
                <span className="font-mono text-slate-300">
                  كاش: <strong className="text-amber-300">{adminShiftStats?.cashCollected || 0} ج</strong> • 
                  إلكتروني:{" "}
                  <strong className="text-sky-300">
                    {(adminShiftStats?.visaCollected || 0) +
                      (adminShiftStats?.instapayCollected || 0) +
                      (adminShiftStats?.vodafoneCollected || 0)}{" "}
                    ج
                  </strong>
                </span>
              </div>

              {/* Expected Cash in Drawer */}
              <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-amber-300 block">النقدية المحسوبة المتوقعة بالدرج:</span>
                  <span className="text-[10px] text-slate-400">كاش المقبوضات - سلف الكاش - مصروفات الكاش</span>
                </div>
                <span className="text-lg font-mono font-black text-amber-400">
                  {adminShiftStats?.expectedCash || 0} ج.م
                </span>
              </div>
            </div>

            <form onSubmit={handleAdminExecuteCloseShift} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  النقدية الفعلية بعد الجرد بالدرج (ج.م) *:
                </label>
                <input
                  type="number"
                  required
                  value={adminShiftForm.actualCash}
                  onChange={(e) =>
                    setAdminShiftForm({ ...adminShiftForm, actualCash: Number(e.target.value) })
                  }
                  className="w-full py-2.5 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono font-bold text-base focus:border-amber-400"
                />
              </div>

              {/* Live difference indicator */}
              {(() => {
                const diff =
                  Number(adminShiftForm.actualCash) - Number(adminShiftStats?.expectedCash || 0);
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
                    value={adminShiftForm.handedTo}
                    onChange={(e) => setAdminShiftForm({ ...adminShiftForm, handedTo: e.target.value })}
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
                        onClick={() => setAdminShiftForm({ ...adminShiftForm, handedTo: opt })}
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
                  value={adminShiftForm.notes}
                  onChange={(e) => setAdminShiftForm({ ...adminShiftForm, notes: e.target.value })}
                  placeholder="أي ملاحظات حول التوريد أو الوردية"
                  className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>إقفال الوردية وتسليم النقدية للمالك 🔒</span>
              </button>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. RESCHEDULE / ALTERNATIVE APPOINTMENT MODAL
         ───────────────────────────────────────────────────────────── */}
      {showRescheduleModal && rescheduleTargetBooking && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-sans animate-fade-in"
          dir="rtl"
        >
          <div className="relative w-full max-w-lg bg-gradient-to-b from-[#161622] via-[#12121a] to-[#0e0e14] border-2 border-amber-500/50 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    اقتراح / تعديل موعد الحجز للعميل ⏱️📅
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    تحديد تاريخ وساعة بديلة مع إشعار فوري للعميل في الشات
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowRescheduleModal(false);
                  setRescheduleTargetBooking(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-white/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Booking Info Card */}
            <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-amber-400">
                  حجز #{rescheduleTargetBooking.bookingNumber}
                </span>
                <span className="py-0.5 px-2 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold text-[10px]">
                  {rescheduleTargetBooking.branch?.name || "فرع الصالون"}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>
                  العميل:{" "}
                  <strong className="text-white">
                    {rescheduleTargetBooking.customer?.name || rescheduleTargetBooking.customerName || "عميل VIP"}
                  </strong>
                </span>
                <span className="font-mono text-slate-400">
                  {rescheduleTargetBooking.customer?.phone || rescheduleTargetBooking.customerPhone || ""}
                </span>
              </div>
              <div className="text-slate-400 text-[11px] pt-1 border-t border-white/5 flex items-center justify-between">
                <span>الموعد المطلوب حالياً:</span>
                <span className="font-bold text-rose-300 font-mono">
                  {rescheduleTargetBooking.bookingDate} • {rescheduleTargetBooking.timeSlot}
                </span>
              </div>
            </div>

            <form onSubmit={handleExecuteReschedule} className="space-y-4 text-xs">
              {/* Date Input */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold block flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>التاريخ الجديد المقترح للموعد *:</span>
                </label>
                <input
                  type="date"
                  required
                  value={rescheduleForm.bookingDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) =>
                    setRescheduleForm({ ...rescheduleForm, bookingDate: e.target.value })
                  }
                  className="w-full py-2.5 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono font-bold focus:border-amber-400"
                />

                {/* Day off warning if user picks day off */}
                {(() => {
                  if (!rescheduleForm.bookingDate) return null;
                  const dayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
                  const selectedDayName = dayNames[new Date(rescheduleForm.bookingDate).getDay()];
                  if (settings?.isDayOffEnabled && selectedDayName === settings?.weeklyDayOff) {
                    return (
                      <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>
                          تنبيه: هذا اليوم يوافق العطلة الأسبوعية للصالون ({settings?.dayOffMessage || "يوم الإثنين عطلة"})!
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Time Slot Picker */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold block flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>الساعة والموعد البديل *:</span>
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 max-h-36 overflow-y-auto p-2 rounded-xl bg-black/40 border border-white/10">
                  {[
                    "12:00 PM",
                    "12:30 PM",
                    "01:00 PM",
                    "01:30 PM",
                    "02:00 PM",
                    "02:30 PM",
                    "03:00 PM",
                    "03:30 PM",
                    "04:00 PM",
                    "04:30 PM",
                    "05:00 PM",
                    "05:30 PM",
                    "06:00 PM",
                    "06:30 PM",
                    "07:00 PM",
                    "07:30 PM",
                    "08:00 PM",
                    "08:30 PM",
                    "09:00 PM",
                    "09:30 PM",
                    "10:00 PM",
                    "10:30 PM",
                    "11:00 PM",
                    "11:30 PM",
                    "12:00 AM",
                    "12:30 AM",
                    "01:00 AM",
                    "01:30 AM",
                  ].map((slot) => {
                    const isSelected = rescheduleForm.timeSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setRescheduleForm({ ...rescheduleForm, timeSlot: slot })}
                        className={`py-1 px-1.5 rounded-lg text-[10px] font-mono font-bold transition ${
                          isSelected
                            ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20 scale-105"
                            : "bg-white/5 text-slate-300 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reason / Notes */}
              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">
                  سبب التعديل أو رسالة للعميل:
                </label>
                <input
                  type="text"
                  value={rescheduleForm.notes}
                  onChange={(e) =>
                    setRescheduleForm({ ...rescheduleForm, notes: e.target.value })
                  }
                  placeholder="مثال: تم اختيار موعد جديد تفادياً للزحمة ولراحتك"
                  className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white focus:border-amber-400"
                />
              </div>

              {/* Notify Customer via Chat Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <input
                  type="checkbox"
                  checked={rescheduleForm.notifyCustomer}
                  onChange={(e) =>
                    setRescheduleForm({ ...rescheduleForm, notifyCustomer: e.target.checked })
                  }
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <span className="text-slate-200 text-[11px] font-bold">
                  إرسال رسالة شات فورية للعميل لإعلامه بالموعد الجديد المعتمد 💬
                </span>
              </label>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowRescheduleModal(false);
                    setRescheduleTargetBooking(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black transition flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>اعتماد الموعد الجديد وإشعار العميل ⏰</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          7. LUXURY VIP ADMIN TOAST NOTIFICATION (NO WINDOWS ALERTS!)
         ───────────────────────────────────────────────────────────── */}
      {adminToast && (
        <div
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] sm:w-auto animate-fade-in font-sans"
          dir="rtl"
        >
          <div
            className={`py-3 px-5 rounded-2xl shadow-2xl border backdrop-blur-xl flex items-center gap-3 text-xs font-black ${
              adminToast.type === "success"
                ? "bg-emerald-950/90 border-emerald-500/60 text-emerald-200 shadow-emerald-950/50"
                : adminToast.type === "error"
                ? "bg-rose-950/90 border-rose-500/60 text-rose-200 shadow-rose-950/50"
                : "bg-amber-950/90 border-amber-500/60 text-amber-200 shadow-amber-950/50"
            }`}
          >
            <span className="text-base">
              {adminToast.type === "success" ? "✅" : adminToast.type === "error" ? "⚠️" : "👑"}
            </span>
            <span className="flex-1 leading-relaxed">{adminToast.message}</span>
            <button
              onClick={() => setAdminToast(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 8. CARD 2 QR MODAL */}
      <CardQRModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        hadayekPhone={settings?.hadayekPhone || "01121537537"}
        nasrCityPhone={settings?.nasrCityPhone || "01121537537"}
        hotline={settings?.hotline || "01121537537"}
      />
    </div>
  );
}
