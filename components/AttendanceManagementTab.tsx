"use client";

import React, { useState, useEffect, useRef } from "react";
import { playAttendanceChime, sendDesktopNotification } from "@/lib/attendance-sound";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  UserX,
  Search,
  RefreshCw,
  Plus,
  Calendar,
  Building2,
  Users,
  LogOut,
  MapPin,
  Sparkles,
  Bell,
  Volume2,
} from "lucide-react";

interface AttendanceTabProps {
  branches: any[];
  users: any[];
  isWomenTheme: boolean;
  isNewSkinTheme: boolean;
  activeBranchId: string;
  showToast: (type: "success" | "error" | "info", message: string) => void;
  currentUser: any;
}

export default function AttendanceManagementTab({
  branches,
  users,
  isWomenTheme,
  isNewSkinTheme,
  activeBranchId,
  showToast,
  currentUser,
}: AttendanceTabProps) {
  const [dateFilter, setDateFilter] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [branchFilter, setBranchFilter] = useState<string>(
    activeBranchId !== "ALL" ? activeBranchId : "ALL"
  );
  const [records, setRecords] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Manual Punch Modal
  const [showManualModal, setShowManualModal] = useState<boolean>(false);
  const [manualForm, setManualForm] = useState({
    userId: "",
    action: "CHECK_IN",
    branchId: "",
    notes: "",
  });
  const [submittingManual, setSubmittingManual] = useState<boolean>(false);
  const prevCountRef = useRef<number | null>(null);

  // Fetch Attendance Records
  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const bParam = branchFilter !== "ALL" ? branchFilter : "";
      const res = await fetch(
        `/api/attendance?date=${dateFilter}&branchId=${bParam}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (data.success) {
        const fetchedRecords = data.records || [];
        setRecords(fetchedRecords);
        setSummary(data.summary || null);

        // Audible Ding-Dong Alarm & Desktop Push if a new attendance punch occurred
        if (prevCountRef.current !== null && fetchedRecords.length > prevCountRef.current) {
          const newest = fetchedRecords[0];
          playAttendanceChime(newest.checkOutTime ? "CHECK_OUT" : "CHECK_IN");
          const msg = `سجل [ ${newest.user?.name} ] ${
            newest.checkOutTime ? "انصراف" : "حضور"
          } بفرع (${newest.branch?.name})`;
          sendDesktopNotification("بصمة حضور مجموعة الباشا VIP ⏰", msg);
          showToast("info", `🔔 تنبيه فوري: ${msg}`);
        }
        prevCountRef.current = fetchedRecords.length;
      } else {
        showToast("error", data.error || "فشل جلب بيانات الحضور");
      }
    } catch {
      showToast("error", "تعذر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
    const interval = setInterval(fetchAttendance, 10000);
    return () => clearInterval(interval);
  }, [dateFilter, branchFilter]);

  // Handle Quick Checkout for staff from table
  const handleQuickCheckout = async (userId: string, staffName: string) => {
    if (!confirm(`هل تريد تسجيل انصراف [ ${staffName} ] الآن؟`)) return;
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "CHECK_OUT" }),
      });
      const data = await res.json();
      if (data.success) {
        playAttendanceChime("CHECK_OUT");
        showToast("success", data.message);
        fetchAttendance();
      } else {
        showToast("error", data.error || "فشل تسجيل الانصراف");
      }
    } catch {
      showToast("error", "تعذر تسجيل الانصراف");
    }
  };

  // Submit Manual Attendance Punch
  const handleSubmitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.userId) {
      showToast("error", "يرجى اختيار الموظف أولاً");
      return;
    }
    try {
      setSubmittingManual(true);
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: manualForm.userId,
          action: manualForm.action,
          branchId: manualForm.branchId || undefined,
          notes: manualForm.notes ? `(تسجيل إداري): ${manualForm.notes}` : "تسجيل إداري يدوي بواسطة المدير",
        }),
      });
      const data = await res.json();
      if (data.success) {
        playAttendanceChime(manualForm.action as any);
        showToast("success", data.message);
        setShowManualModal(false);
        setManualForm({ userId: "", action: "CHECK_IN", branchId: "", notes: "" });
        fetchAttendance();
      } else {
        showToast("error", data.error || "فشل تسجيل البصمة");
      }
    } catch {
      showToast("error", "حدث خطأ أثناء الاتصال بالخادم");
    } finally {
      setSubmittingManual(false);
    }
  };

  // Filtered by Search
  const filteredRecords = records.filter((r) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      r.user?.name?.toLowerCase().includes(q) ||
      r.user?.username?.toLowerCase().includes(q) ||
      r.user?.role?.toLowerCase().includes(q) ||
      r.branch?.name?.toLowerCase().includes(q) ||
      r.notes?.toLowerCase().includes(q)
    );
  });

  const themeBorder = isNewSkinTheme
    ? "border-emerald-500/30"
    : isWomenTheme
    ? "border-rose-500/30"
    : "border-amber-500/30";

  const themeAccent = isNewSkinTheme
    ? "text-emerald-400"
    : isWomenTheme
    ? "text-rose-400"
    : "text-amber-400";

  const themeBgGradient = isNewSkinTheme
    ? "from-[#081510] to-[#050d0a]"
    : isWomenTheme
    ? "from-[#170614] to-[#0c030a]"
    : "from-[#161622] to-[#0e0e14]";

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* ─────────────────────────────────────────────────────────────
          1. LIVE ATTENDANCE KPI CARDS
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Recorded Today */}
        <div className={`p-4 rounded-3xl bg-gradient-to-b ${themeBgGradient} border ${themeBorder} shadow-lg space-y-1`}>
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>سجلوا اليوم</span>
            <span className="p-1.5 rounded-xl bg-white/5 text-amber-400">📅</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {summary?.totalToday || records.length || 0}
          </div>
          <p className="text-[10px] text-slate-400 font-bold">إجمالي بصمات اليوم</p>
        </div>

        {/* Card 2: Active on Duty Right Now */}
        <div className={`p-4 rounded-3xl bg-gradient-to-b ${themeBgGradient} border border-emerald-500/35 shadow-lg space-y-1`}>
          <div className="flex items-center justify-between text-emerald-400 text-xs font-bold">
            <span>على رأس العمل الآن</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-300">
            {summary?.activeNowCount || records.filter((r) => !r.checkOutTime).length || 0}
          </div>
          <p className="text-[10px] text-emerald-400/80 font-bold">طاقم حاضر ولم يسجل انصراف</p>
        </div>

        {/* Card 3: Shift Completed & Checked Out */}
        <div className={`p-4 rounded-3xl bg-gradient-to-b ${themeBgGradient} border border-sky-500/35 shadow-lg space-y-1`}>
          <div className="flex items-center justify-between text-sky-400 text-xs font-bold">
            <span>أتموا الوردية وانصرفوا</span>
            <span className="p-1.5 rounded-xl bg-white/5 text-sky-400">🚪</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-sky-300">
            {summary?.completedTodayCount || records.filter((r) => !!r.checkOutTime).length || 0}
          </div>
          <p className="text-[10px] text-sky-400/80 font-bold">تسجيل انصراف مكتمل</p>
        </div>

        {/* Card 4: Late Arrivals */}
        <div className={`p-4 rounded-3xl bg-gradient-to-b ${themeBgGradient} border border-amber-500/35 shadow-lg space-y-1`}>
          <div className="flex items-center justify-between text-amber-400 text-xs font-bold">
            <span>حالات التأخير</span>
            <span className="p-1.5 rounded-xl bg-white/5 text-amber-400">⚠️</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300">
            {records.filter((r) => r.status === "LATE").length || 0}
          </div>
          <p className="text-[10px] text-amber-400/80 font-bold">حضور بعد الموعد المحدد</p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. FILTER & ACTION BAR
         ───────────────────────────────────────────────────────────── */}
      <div className={`p-4 sm:p-5 rounded-3xl bg-gradient-to-b ${themeBgGradient} border ${themeBorder} shadow-xl flex flex-wrap items-center justify-between gap-3`}>
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Date Selector */}
          <div className="flex items-center gap-1.5 bg-black/60 border border-white/10 rounded-2xl px-3 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent text-white text-xs font-mono font-bold outline-none cursor-pointer"
            />
            {dateFilter !== new Date().toISOString().split("T")[0] && (
              <button
                onClick={() => setDateFilter(new Date().toISOString().split("T")[0])}
                className="text-[10px] text-amber-400 hover:underline mr-1 font-bold"
              >
                اليوم
              </button>
            )}
          </div>

          {/* Branch Filter */}
          <div className="flex items-center gap-1.5 bg-black/60 border border-white/10 rounded-2xl px-3 py-1.5">
            <Building2 className="w-3.5 h-3.5 text-sky-400" />
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="bg-transparent text-white text-xs font-bold outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#12121a] text-white">كافة الفروع 🌟</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id} className="bg-[#12121a] text-white">
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 min-w-[160px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث باسم الموظف أو الوظيفة..."
              className="w-full py-1.5 pr-8 pl-3 rounded-2xl bg-black/60 border border-white/10 text-white text-xs font-bold outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              playAttendanceChime("CHECK_IN");
              sendDesktopNotification("مجموعة الباشا VIP ⏰", "تم اختبار صوت جرس الحضور والانصراف بنجاح 🔔");
              showToast("success", "🔔 تم تجربة صوت جرس البصمة وتأكيد تفعيل الصوت!");
            }}
            className="py-2 px-3 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-300 font-bold text-xs transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
            title="انقر لتشغيل جرس التنبيه وتأكيد تفعيل الصوت"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>تجربة صوت الجرس 🔔</span>
          </button>

          <button
            onClick={() => setShowManualModal(true)}
            className="py-2 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs transition flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل بصمة إدارية ➕</span>
          </button>

          <button
            onClick={fetchAttendance}
            className="p-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition"
            title="تحديث البيانات الآن"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-amber-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. ATTENDANCE RECORDS TABLE
         ───────────────────────────────────────────────────────────── */}
      <div className={`rounded-3xl bg-[#0f0f16] border ${themeBorder} overflow-hidden shadow-2xl`}>
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className={`w-5 h-5 ${themeAccent}`} />
            <h3 className="font-black text-white text-sm sm:text-base">
              سجل بصمات الحضور والانصراف ({filteredRecords.length} حركة)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono font-bold">
            التاريخ المعروض: {dateFilter}
          </span>
        </div>

        {loading && records.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs font-bold space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400" />
            <p>جارٍ تحميل سجل البصمة الرقمية...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs font-bold space-y-2">
            <div className="text-4xl">⏰</div>
            <p>لا توجد سجلات حضور أو انصراف مسجلة لهذا التاريخ أو الفرع المحدد.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-black/60 text-slate-400 border-b border-white/10 font-black">
                  <th className="p-3.5">الموظف</th>
                  <th className="p-3.5">الوظيفة والفرع</th>
                  <th className="p-3.5">وقت الحضور</th>
                  <th className="p-3.5">وقت الانصراف</th>
                  <th className="p-3.5">ساعات العمل</th>
                  <th className="p-3.5">الحالة</th>
                  <th className="p-3.5">ملاحظات</th>
                  <th className="p-3.5 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredRecords.map((r) => {
                  const checkIn = new Date(r.checkInTime);
                  const checkOut = r.checkOutTime ? new Date(r.checkOutTime) : null;
                  
                  // Duration
                  let durationStr = "-";
                  if (checkOut) {
                    const diffMs = checkOut.getTime() - checkIn.getTime();
                    const hours = Math.floor(diffMs / (1000 * 60 * 60));
                    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                    durationStr = `${hours} س و ${mins} د`;
                  } else {
                    const diffMs = Date.now() - checkIn.getTime();
                    const hours = Math.floor(diffMs / (1000 * 60 * 60));
                    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                    durationStr = `${hours} س و ${mins} د (مستمر)`;
                  }

                  const isActive = !checkOut;
                  const isLate = r.status === "LATE";

                  return (
                    <tr key={r.id} className="hover:bg-white/[0.03] transition">
                      {/* Employee Info */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-black flex items-center justify-center text-xs shrink-0">
                            {r.user?.name?.slice(0, 1) || "ب"}
                          </div>
                          <div>
                            <strong className="text-white font-bold block">{r.user?.name}</strong>
                            <span className="text-[10px] text-slate-400 font-mono">@{r.user?.username}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role & Branch */}
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <span className="py-0.5 px-2 rounded-full text-[10px] font-bold bg-white/5 text-slate-300 border border-white/10 inline-block">
                            {r.user?.role === "owner" && "المالك (Maestro) 👑"}
                            {r.user?.role === "general_manager" && "المدير العام 🏢"}
                            {r.user?.role === "booking_dispatcher" && "مسئول الحجوزات المركزي 📅"}
                            {r.user?.role === "warehouse_manager" && "مسئول المخزن 📦"}
                            {r.user?.role === "cashier" && "كاشير 💳"}
                            {r.user?.role === "specialist" && "متخصص / خبيرة ✂️"}
                            {r.user?.role === "manager" && "مدير فرع 👔"}
                            {!["owner", "general_manager", "booking_dispatcher", "warehouse_manager", "cashier", "specialist", "manager"].includes(r.user?.role) && r.user?.role}
                          </span>
                          <p className="text-[10px] text-slate-400 font-bold">{r.branch?.name}</p>
                        </div>
                      </td>

                      {/* Check-In */}
                      <td className="p-3.5 font-mono text-emerald-300 font-bold">
                        {checkIn.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit", hour12: true })}
                      </td>

                      {/* Check-Out */}
                      <td className="p-3.5 font-mono text-slate-300">
                        {checkOut ? (
                          <span className="text-sky-300 font-bold">
                            {checkOut.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit", hour12: true })}
                          </span>
                        ) : (
                          <span className="text-emerald-400 text-[11px] font-bold">حاضر الآن 🟢</span>
                        )}
                      </td>

                      {/* Duration */}
                      <td className="p-3.5 font-mono text-[11px] text-slate-300">
                        {durationStr}
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        {isActive ? (
                          <span className="py-1 px-2.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/35 text-[10px] font-black inline-flex items-center gap-1 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            حاضر الآن
                          </span>
                        ) : isLate ? (
                          <span className="py-1 px-2.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/35 text-[10px] font-black inline-flex items-center gap-1">
                            ⚠️ تأخر وانصرف
                          </span>
                        ) : (
                          <span className="py-1 px-2.5 rounded-full bg-slate-700/50 text-slate-300 border border-white/10 text-[10px] font-black inline-flex items-center gap-1">
                            🏁 أتم الوردية
                          </span>
                        )}
                      </td>

                      {/* Notes */}
                      <td className="p-3.5 text-slate-400 text-[11px] max-w-xs truncate">
                        {r.notes || "-"}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center">
                        {isActive && (
                          <button
                            onClick={() => handleQuickCheckout(r.userId, r.user?.name)}
                            className="py-1 px-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-rose-300 text-[10px] font-black transition flex items-center gap-1 mx-auto"
                            title="تسجيل انصراف فوري لهذا الموظف"
                          >
                            <LogOut className="w-3 h-3" />
                            <span>تسجيل انصراف</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. MANUAL PUNCH MODAL
         ───────────────────────────────────────────────────────────── */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-sans" dir="rtl">
          <div className="relative w-full max-w-md bg-[#12121a] border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-black text-white">تسجيل بصمة إدارية يدوية</h3>
              </div>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-xl bg-white/5"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitManual} className="space-y-4 text-xs">
              {/* Employee Selector */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">الموظف المعني:</label>
                <select
                  required
                  value={manualForm.userId}
                  onChange={(e) => setManualForm({ ...manualForm, userId: e.target.value })}
                  className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-bold outline-none focus:border-amber-400"
                >
                  <option value="">اختر الموظف...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} (@{u.username}) — {u.branchName || "الكل"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Type */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setManualForm({ ...manualForm, action: "CHECK_IN" })}
                  className={`py-2 px-3 rounded-xl font-black text-xs transition border flex items-center justify-center gap-1.5 ${
                    manualForm.action === "CHECK_IN"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : "bg-black/40 text-slate-400 border-white/10"
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>تسجيل حضور 🟢</span>
                </button>

                <button
                  type="button"
                  onClick={() => setManualForm({ ...manualForm, action: "CHECK_OUT" })}
                  className={`py-2 px-3 rounded-xl font-black text-xs transition border flex items-center justify-center gap-1.5 ${
                    manualForm.action === "CHECK_OUT"
                      ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                      : "bg-black/40 text-slate-400 border-white/10"
                  }`}
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>تسجيل انصراف 🚪</span>
                </button>
              </div>

              {/* Branch */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">الفرع المسجل عليه:</label>
                <select
                  value={manualForm.branchId}
                  onChange={(e) => setManualForm({ ...manualForm, branchId: e.target.value })}
                  className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-bold outline-none focus:border-amber-400"
                >
                  <option value="">نفس فرع الموظف الافتراضي</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">سبب أو ملاحظة التسجيل اليدوي:</label>
                <input
                  type="text"
                  value={manualForm.notes}
                  onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                  placeholder="مثال: نسي البصمة، عذر مسبق، تعديل شفت..."
                  className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-bold outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submittingManual}
                  className="w-full py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submittingManual ? "جارٍ التثبيت..." : "تأكيد وتثبيت البصمة في السجل 💾"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
