"use client";

import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import {
  FolderArchive,
  UserCheck,
  UserX,
  UserPlus,
  Briefcase,
  Search,
  Filter,
  FileText,
  Upload,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  Download,
  QrCode,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  ShieldCheck,
  AlertTriangle,
  Eye,
  Edit3,
  Trash2,
  ExternalLink,
  ChevronRight,
  Maximize2,
  RefreshCw,
  Plus,
  HeartPulse,
  Award,
} from "lucide-react";

interface StaffDossier {
  id: string;
  fullName: string;
  nationalId?: string | null;
  phone: string;
  phoneSecondary?: string | null;
  birthDate?: string | null;
  address?: string | null;
  gender: string;
  maritalStatus?: string | null;
  militaryStatus?: string | null;
  qualification?: string | null;
  jobTitle: string;
  department: string;
  branchId?: string | null;
  branch?: any;
  hireDate?: string | null;
  status: "ACTIVE" | "ON_LEAVE" | "ARCHIVED" | "TERMINATED";
  salary: number;
  commissionRate: number;
  contractType: string;
  photoUrl?: string | null;
  nationalIdFront?: string | null;
  nationalIdBack?: string | null;
  certificates?: string | null;
  healthCertUrl?: string | null;
  healthCertExpiry?: string | null;
  criminalRecordUrl?: string | null;
  contractDocUrl?: string | null;
  additionalDocs?: string | null;
  notes?: string | null;
  createdAt: string;
}

interface JobApplication {
  id: string;
  code: string;
  fullName: string;
  phone: string;
  nationalId?: string | null;
  age?: number | null;
  address?: string | null;
  targetJob: string;
  targetDepartment: string;
  targetBranchId?: string | null;
  experienceYears: number;
  previousWorkplaces?: string | null;
  qualification?: string | null;
  expectedSalary?: number | null;
  personalPhoto?: string | null;
  nationalIdUrl?: string | null;
  cvUrl?: string | null;
  portfolioUrls?: string | null;
  notes?: string | null;
  status: "PENDING" | "REVIEWING" | "INTERVIEWED" | "ACCEPTED" | "REJECTED" | "ARCHIVED";
  interviewDate?: string | null;
  interviewNotes?: string | null;
  dossierId?: string | null;
  createdAt: string;
}

interface StaffArchiveManagementTabProps {
  branches: any[];
  currentUser: any;
  isWomenTheme?: boolean;
  isNewSkinTheme?: boolean;
  showToast: (type: "success" | "error" | "info", message: string) => void;
}

export default function StaffArchiveManagementTab({
  branches,
  currentUser,
  isWomenTheme,
  isNewSkinTheme,
  showToast,
}: StaffArchiveManagementTabProps) {
  // Navigation sub-tab
  const [subTab, setSubTab] = useState<"DOSSIERS" | "APPLICATIONS" | "QR_POSTER">("DOSSIERS");

  // Data states
  const [dossiers, setDossiers] = useState<StaffDossier[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [branchFilter, setBranchFilter] = useState("ALL");

  // Modals
  const [viewingDossier, setViewingDossier] = useState<StaffDossier | null>(null);
  const [editingDossier, setEditingDossier] = useState<StaffDossier | null>(null);
  const [showAddDossierModal, setShowAddDossierModal] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);

  // Onboard Applicant Modal
  const [onboardModalApp, setOnboardModalApp] = useState<JobApplication | null>(null);
  const [onboardBranchId, setOnboardBranchId] = useState("");
  const [onboardSalary, setOnboardSalary] = useState("6000");
  const [onboardCommission, setOnboardCommission] = useState("20");

  // Interview Schedule Modal
  const [interviewModalApp, setInterviewModalApp] = useState<JobApplication | null>(null);
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewNotes, setInterviewNotes] = useState("");

  // QR Poster Generation
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [careersPublicUrl, setCareersPublicUrl] = useState<string>("");

  // New/Edit Dossier Form State
  const [dossierForm, setDossierForm] = useState<any>({
    fullName: "",
    nationalId: "",
    phone: "",
    phoneSecondary: "",
    birthDate: "",
    address: "",
    gender: "MALE",
    maritalStatus: "أعزب",
    militaryStatus: "أدى الخدمة",
    qualification: "",
    jobTitle: "",
    department: "DAKN",
    branchId: "",
    hireDate: new Date().toISOString().split("T")[0],
    status: "ACTIVE",
    salary: 6000,
    commissionRate: 20,
    contractType: "FULL_TIME",
    photoUrl: "",
    nationalIdFront: "",
    nationalIdBack: "",
    healthCertUrl: "",
    healthCertExpiry: "",
    criminalRecordUrl: "",
    contractDocUrl: "",
    notes: "",
  });

  const [uploadingDocField, setUploadingDocField] = useState<string | null>(null);

  // Fetch Data
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/hr?type=all");
      const data = await res.json();
      if (data.success) {
        setDossiers(data.dossiers || []);
        setApplications(data.applications || []);
      }
    } catch (err) {
      console.error(err);
      showToast("error", "تعذر تحميل بيانات الأرشيف والتوظيف");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Generate QR Code on Mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/careers`;
      setCareersPublicUrl(url);

      QRCode.toDataURL(url, {
        width: 360,
        margin: 2,
        color: {
          dark: "#0b0c10",
          light: "#ffffff",
        },
      })
        .then(setQrCodeDataUrl)
        .catch(console.error);
    }
  }, []);

  // Upload handler for document files
  const handleUploadDoc = async (field: string, file: File) => {
    try {
      setUploadingDocField(field);
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && (data.url || data.displayUrl)) {
        const url = data.url || data.displayUrl;
        setDossierForm((prev: any) => ({ ...prev, [field]: url }));
        showToast("success", "تم رفع المستند بنجاح 📄");
      } else {
        showToast("error", data.error || "فشل رفع الملف");
      }
    } catch {
      showToast("error", "حدث خطأ أثناء رفع المستند");
    } finally {
      setUploadingDocField(null);
    }
  };

  // Save Dossier (Create or Update)
  const handleSaveDossier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDossier) {
        // PATCH
        const res = await fetch("/api/hr", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingDossier.id, ...dossierForm }),
        });
        const data = await res.json();
        if (data.success) {
          showToast("success", "تم تحديث ملف الموظف في الأرشيف بنجاح 💾");
          setShowAddDossierModal(false);
          setEditingDossier(null);
          fetchData();
        } else {
          showToast("error", data.error || "فشل التحديث");
        }
      } else {
        // POST create_dossier
        const res = await fetch("/api/hr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "create_dossier", ...dossierForm }),
        });
        const data = await res.json();
        if (data.success) {
          showToast("success", "تمت إضافة الموظف الجديد لأرشيف الطاقم بنجاح 📁");
          setShowAddDossierModal(false);
          fetchData();
        } else {
          showToast("error", data.error || "فشل إضافة الملف");
        }
      }
    } catch {
      showToast("error", "حدث خطأ أثناء حفظ الملف");
    }
  };

  // One-Click Onboard Action
  const handleConfirmOnboard = async () => {
    if (!onboardModalApp) return;
    try {
      const res = await fetch("/api/hr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "accept_and_onboard",
          applicationId: onboardModalApp.id,
          branchId: onboardBranchId || branches[0]?.id,
          salary: parseFloat(onboardSalary) || 6000,
          commissionRate: parseFloat(onboardCommission) || 20,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast("success", data.message);
        setOnboardModalApp(null);
        fetchData();
      } else {
        showToast("error", data.error || "فشل التعيين");
      }
    } catch {
      showToast("error", "حدث خطأ أثناء إجراء التعيين");
    }
  };

  // Update Application Status (Interview / Reject / Archive)
  const handleUpdateAppStatus = async (
    appId: string,
    status: "REVIEWING" | "INTERVIEWED" | "REJECTED" | "ARCHIVED",
    iDate?: string,
    iNotes?: string
  ) => {
    try {
      const res = await fetch("/api/hr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_application_status",
          applicationId: appId,
          status,
          interviewDate: iDate,
          interviewNotes: iNotes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast("success", data.message);
        setInterviewModalApp(null);
        fetchData();
      } else {
        showToast("error", data.error || "فشل تحديث الحالة");
      }
    } catch {
      showToast("error", "حدث خطأ أثناء التحديث");
    }
  };

  // Filtered Dossiers
  const filteredDossiers = dossiers.filter((d) => {
    if (departmentFilter !== "ALL" && d.department !== departmentFilter) return false;
    if (statusFilter !== "ALL" && d.status !== statusFilter) return false;
    if (branchFilter !== "ALL" && d.branchId !== branchFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = d.fullName?.toLowerCase().includes(q);
      const matchId = d.nationalId?.includes(q);
      const matchPhone = d.phone?.includes(q);
      const matchJob = d.jobTitle?.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchPhone && !matchJob) return false;
    }
    return true;
  });

  // Filtered Job Applications
  const filteredApplications = applications.filter((a) => {
    if (departmentFilter !== "ALL" && a.targetDepartment !== departmentFilter && a.targetDepartment !== "ALL")
      return false;
    if (statusFilter !== "ALL" && a.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = a.fullName?.toLowerCase().includes(q);
      const matchPhone = a.phone?.includes(q);
      const matchCode = a.code?.toLowerCase().includes(q);
      const matchJob = a.targetJob?.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchCode && !matchJob) return false;
    }
    return true;
  });

  const pendingAppsCount = applications.filter((a) => a.status === "PENDING").length;

  return (
    <div className="space-y-6 font-sans text-slate-100" dir="rtl">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & SUB-TABS (DOSSIERS vs APPLICATIONS vs QR POSTER)
         ───────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0e1017] via-[#141724] to-[#0c0d14] border-2 border-amber-500/40 p-5 sm:p-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                👑 إدارة الموارد البشرية وشؤون العاملين VIP
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs font-mono font-bold">
                {dossiers.length} موظف مسجل • {applications.length} متقدم للعمل
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <FolderArchive className="w-6 h-6 text-amber-400" />
              <span>أرشيف العاملين وبوابة التوظيف الذكية برمز الـ QR</span>
            </h2>

            <p className="text-xs text-slate-400 max-w-2xl">
              ملفات رسمية متكاملة لكل فرد بالطاقم (صور البطاقات، شهادات التخرج، الشهادات الصحية، عقود العمل) مع إدارة طلبات التوظيف الواردة عبر الكيو آر كود والقبول بنقرة واحدة.
            </p>
          </div>

          {/* Sub-Tabs Selector */}
          <div className="flex items-center bg-black/60 p-1.5 rounded-2xl border border-white/10 flex-wrap gap-1">
            <button
              onClick={() => {
                setSubTab("DOSSIERS");
                setStatusFilter("ALL");
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                subTab === "DOSSIERS"
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <FolderArchive className="w-4 h-4" />
              <span>أرشيف العاملين ({dossiers.length})</span>
            </button>

            <button
              onClick={() => {
                setSubTab("APPLICATIONS");
                setStatusFilter("ALL");
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer relative ${
                subTab === "APPLICATIONS"
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>طلبات التوظيف ({applications.length})</span>
              {pendingAppsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                  {pendingAppsCount} جديد
                </span>
              )}
            </button>

            <button
              onClick={() => setSubTab("QR_POSTER")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                subTab === "QR_POSTER"
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>بوستر الـ QR للطباعة 📱</span>
            </button>
          </div>
        </div>

        {/* ─── FILTERS & SEARCH BAR ─── */}
        {subTab !== "QR_POSTER" && (
          <div className="mt-5 pt-4 border-t border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  subTab === "DOSSIERS"
                    ? "ابحث بالاسم، الرقم القومي (14 رقم)، الهاتف، أو الوظيفة..."
                    : "ابحث باسم المتقدم، كود الطلب (APP-XXXXXX)، أو الهاتف..."
                }
                className="w-full py-2 pr-10 pl-3 rounded-xl bg-black/60 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Department & Status Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {/* Department */}
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
              >
                <option value="ALL">كافة الأقسام والكيانات</option>
                <option value="DAKN">💈 صالون دقن الباشا (رجالي)</option>
                <option value="HAMMAM">🧖‍♀️ حمام وسبا الباشا (حريمي)</option>
                <option value="NEWSKIN">✨ عيادة نيو سكين (New Skin VIP)</option>
                <option value="MANAGEMENT">👑 إدارة وحسابات</option>
              </select>

              {/* Status */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
              >
                {subTab === "DOSSIERS" ? (
                  <>
                    <option value="ALL">كافة حالات العمل</option>
                    <option value="ACTIVE">🟢 على رأس العمل (نشط)</option>
                    <option value="ON_LEAVE">🟡 في إجازة</option>
                    <option value="ARCHIVED">📦 في الأرشيف (سابق)</option>
                    <option value="TERMINATED">🔴 منتهي خدمته</option>
                  </>
                ) : (
                  <>
                    <option value="ALL">كافة حالات الطلبات</option>
                    <option value="PENDING">🟡 قيد المراجعة (جديد)</option>
                    <option value="INTERVIEWED">🔵 تمت المقابلة</option>
                    <option value="ACCEPTED">🟢 تم القبول والتعيين</option>
                    <option value="ARCHIVED">📁 في الأرشيف للاحتياج</option>
                    <option value="REJECTED">🔴 مرفوض</option>
                  </>
                )}
              </select>

              {/* Add New Dossier Button */}
              {subTab === "DOSSIERS" && (
                <button
                  onClick={() => {
                    setEditingDossier(null);
                    setDossierForm({
                      fullName: "",
                      nationalId: "",
                      phone: "",
                      phoneSecondary: "",
                      birthDate: "",
                      address: "",
                      gender: "MALE",
                      maritalStatus: "أعزب",
                      militaryStatus: "أدى الخدمة",
                      qualification: "",
                      jobTitle: "",
                      department: "DAKN",
                      branchId: branches[0]?.id || "",
                      hireDate: new Date().toISOString().split("T")[0],
                      status: "ACTIVE",
                      salary: 6000,
                      commissionRate: 20,
                      contractType: "FULL_TIME",
                      photoUrl: "",
                      nationalIdFront: "",
                      nationalIdBack: "",
                      healthCertUrl: "",
                      healthCertExpiry: "",
                      criminalRecordUrl: "",
                      contractDocUrl: "",
                      notes: "",
                    });
                    setShowAddDossierModal(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-1 shrink-0 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة ملف موظف جديد +</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. TAB 1: STAFF DOSSIERS ARCHIVE
         ───────────────────────────────────────────────────────────── */}
      {subTab === "DOSSIERS" && (
        <div className="space-y-4">
          {loading ? (
            <div className="h-64 rounded-3xl bg-[#12121a] border border-white/10 flex flex-col items-center justify-center space-y-2">
              <RefreshCw className="w-7 h-7 text-amber-400 animate-spin" />
              <p className="text-xs text-slate-300 font-bold">جارٍ تحميل أرشيف العاملين والملفات...</p>
            </div>
          ) : filteredDossiers.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-[#12121a] border border-white/10 space-y-3">
              <FolderArchive className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">لا توجد ملفات تطابق الفلتر الحالي</h3>
              <p className="text-xs text-slate-400">يمكنك إضافة ملف موظف جديد أو تعديل معايير البحث.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDossiers.map((dossier) => {
                const isHealthExpired =
                  dossier.healthCertExpiry && new Date(dossier.healthCertExpiry) < new Date();

                return (
                  <div
                    key={dossier.id}
                    className="relative group rounded-3xl bg-[#12121a] border-2 border-white/10 hover:border-amber-500/40 transition-all p-5 shadow-xl flex flex-col justify-between space-y-4"
                  >
                    {/* Header: Photo, Name, Dept Badge */}
                    <div className="flex items-start gap-3.5">
                      {/* Avatar */}
                      <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-400/50 bg-black shrink-0 shadow-md">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={dossier.photoUrl || "/dakn-hero.jpg"}
                          alt={dossier.fullName}
                          className="w-full h-full object-cover"
                        />
                        {/* Status Dot */}
                        <span
                          className={`absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border border-black ${
                            dossier.status === "ACTIVE"
                              ? "bg-emerald-400"
                              : dossier.status === "ON_LEAVE"
                              ? "bg-amber-400"
                              : "bg-slate-500"
                          }`}
                          title={dossier.status}
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <h3 className="text-sm font-black text-white truncate" title={dossier.fullName}>
                            {dossier.fullName}
                          </h3>
                        </div>

                        <p className="text-xs text-amber-300 font-bold truncate">{dossier.jobTitle}</p>

                        <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                          {/* Dept Badge */}
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold ${
                              dossier.department === "DAKN"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-400/30"
                                : dossier.department === "HAMMAM"
                                ? "bg-rose-500/20 text-rose-300 border border-rose-400/30"
                                : dossier.department === "NEWSKIN"
                                ? "bg-teal-500/20 text-teal-300 border border-teal-400/30"
                                : "bg-purple-500/20 text-purple-300 border border-purple-400/30"
                            }`}
                          >
                            {dossier.department === "DAKN" && "دقن الباشا (رجالي)"}
                            {dossier.department === "HAMMAM" && "حمام الباشا (سبا)"}
                            {dossier.department === "NEWSKIN" && "نيو سكين (عيادة)"}
                            {dossier.department === "MANAGEMENT" && "الإدارة"}
                          </span>

                          {/* Branch */}
                          {dossier.branch && (
                            <span className="text-slate-400">📍 {dossier.branch.name}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Official Details & Papers Checklist */}
                    <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1.5 text-[11px]">
                      {/* National ID */}
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">الرقم القومي:</span>
                        <code className="text-white font-mono font-bold tracking-wider">
                          {dossier.nationalId || "غير مسجل"}
                        </code>
                      </div>

                      {/* Phone */}
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">الهاتف:</span>
                        <a
                          href={`tel:${dossier.phone}`}
                          className="text-amber-400 font-mono font-bold hover:underline flex items-center gap-1"
                        >
                          <span>{dossier.phone}</span>
                          <Phone className="w-3 h-3" />
                        </a>
                      </div>

                      {/* Salary / Commission */}
                      <div className="flex items-center justify-between text-slate-300 border-t border-white/5 pt-1">
                        <span className="text-slate-400">الراتب والعمولة:</span>
                        <span className="text-emerald-400 font-bold">
                          {dossier.salary ? `${dossier.salary} ج.م` : "عمولة فقط"} ({dossier.commissionRate}%)
                        </span>
                      </div>

                      {/* Health Card Expiry Alert */}
                      {dossier.healthCertExpiry && (
                        <div
                          className={`flex items-center justify-between pt-1 border-t border-white/5 ${
                            isHealthExpired ? "text-rose-400 font-bold" : "text-slate-400"
                          }`}
                        >
                          <span className="flex items-center gap-1">
                            <HeartPulse className="w-3 h-3" />
                            <span>الشهادة الصحية:</span>
                          </span>
                          <span className="font-mono text-[10px]">
                            {isHealthExpired ? "⚠️ منتهية وتحتاج تجديد" : `سارية حتى ${dossier.healthCertExpiry}`}
                          </span>
                        </div>
                      )}

                      {/* Document Presence Pills */}
                      <div className="flex items-center gap-1 pt-1.5 border-t border-white/5 flex-wrap">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            dossier.nationalIdFront ? "bg-emerald-500/20 text-emerald-300" : "bg-white/5 text-slate-500"
                          }`}
                          title="صورة البطاقة وجه وظهر"
                        >
                          {dossier.nationalIdFront ? "بطاقة ✓" : "بدون بطاقة"}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            dossier.healthCertUrl ? "bg-emerald-500/20 text-emerald-300" : "bg-white/5 text-slate-500"
                          }`}
                          title="الشهادة الصحية الرسمية"
                        >
                          {dossier.healthCertUrl ? "شهادة صحية ✓" : "بدون صحية"}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            dossier.criminalRecordUrl ? "bg-emerald-500/20 text-emerald-300" : "bg-white/5 text-slate-500"
                          }`}
                          title="صحيفة الحالة الجنائية"
                        >
                          {dossier.criminalRecordUrl ? "فيش ✓" : "بدون فيش"}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            dossier.contractDocUrl ? "bg-emerald-500/20 text-emerald-300" : "bg-white/5 text-slate-500"
                          }`}
                          title="عقد العمل الموقع"
                        >
                          {dossier.contractDocUrl ? "عقد عمل ✓" : "بدون عقد"}
                        </span>
                      </div>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="flex items-center justify-between gap-1.5 pt-1">
                      {/* View Full Dossier */}
                      <button
                        onClick={() => setViewingDossier(dossier)}
                        className="flex-1 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>فتح الأرشيف والمستندات 📂</span>
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => {
                          setEditingDossier(dossier);
                          setDossierForm({
                            fullName: dossier.fullName,
                            nationalId: dossier.nationalId || "",
                            phone: dossier.phone,
                            phoneSecondary: dossier.phoneSecondary || "",
                            birthDate: dossier.birthDate || "",
                            address: dossier.address || "",
                            gender: dossier.gender || "MALE",
                            maritalStatus: dossier.maritalStatus || "أعزب",
                            militaryStatus: dossier.militaryStatus || "أدى الخدمة",
                            qualification: dossier.qualification || "",
                            jobTitle: dossier.jobTitle,
                            department: dossier.department,
                            branchId: dossier.branchId || "",
                            hireDate: dossier.hireDate || "",
                            status: dossier.status,
                            salary: dossier.salary,
                            commissionRate: dossier.commissionRate,
                            contractType: dossier.contractType || "FULL_TIME",
                            photoUrl: dossier.photoUrl || "",
                            nationalIdFront: dossier.nationalIdFront || "",
                            nationalIdBack: dossier.nationalIdBack || "",
                            healthCertUrl: dossier.healthCertUrl || "",
                            healthCertExpiry: dossier.healthCertExpiry || "",
                            criminalRecordUrl: dossier.criminalRecordUrl || "",
                            contractDocUrl: dossier.contractDocUrl || "",
                            notes: dossier.notes || "",
                          });
                          setShowAddDossierModal(true);
                        }}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
                        title="تعديل بيانات الملف"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. TAB 2: JOB APPLICATIONS & CANDIDATES
         ───────────────────────────────────────────────────────────── */}
      {subTab === "APPLICATIONS" && (
        <div className="space-y-4">
          {loading ? (
            <div className="h-64 rounded-3xl bg-[#12121a] border border-white/10 flex flex-col items-center justify-center space-y-2">
              <RefreshCw className="w-7 h-7 text-amber-400 animate-spin" />
              <p className="text-xs text-slate-300 font-bold">جارٍ تحميل طلبات التوظيف...</p>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-[#12121a] border border-white/10 space-y-3">
              <Briefcase className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">لا توجد طلبات توظيف تطابق البحث</h3>
              <p className="text-xs text-slate-400">
                يمكن للمتقدمين مسح كود الـ QR الخاص بالصالون والتقديم عبر الرابط مباشرة ليظهروا هنا.
              </p>
              <button
                onClick={() => setSubTab("QR_POSTER")}
                className="px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition"
              >
                عرض وطباعة بوستر الـ QR 📱
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredApplications.map((app) => (
                <div
                  key={app.id}
                  className="rounded-3xl bg-[#12121a] border-2 border-white/10 hover:border-amber-500/40 transition-all p-5 shadow-xl flex flex-col justify-between space-y-4"
                >
                  {/* Candidate Header */}
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-400/50 bg-black shrink-0 shadow-md">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={app.personalPhoto || "/dakn-hero.jpg"}
                        alt={app.fullName}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="text-sm font-black text-white truncate" title={app.fullName}>
                          {app.fullName}
                        </h3>
                        <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">
                          {app.code}
                        </span>
                      </div>

                      <p className="text-xs text-amber-300 font-bold truncate">{app.targetJob}</p>

                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 flex-wrap">
                        {app.age && <span>السن: {app.age} سنة</span>}
                        {app.experienceYears > 0 && <span>• خبرة {app.experienceYears} سنوات</span>}
                        {app.expectedSalary && (
                          <span className="text-emerald-400 font-bold">• متوقع: {app.expectedSalary} ج.م</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Previous Experience & Notes */}
                  <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1.5 text-[11px]">
                    <div className="text-slate-300">
                      <strong className="text-slate-400 block mb-0.5">أماكن العمل السابقة:</strong>
                      <p className="line-clamp-2 text-slate-200">{app.previousWorkplaces || "لم تذكر أماكن سابقة"}</p>
                    </div>

                    {app.notes && (
                      <div className="text-slate-300 pt-1 border-t border-white/5">
                        <strong className="text-slate-400 block mb-0.5">رسالة المتقدم:</strong>
                        <p className="line-clamp-2 text-slate-200">{app.notes}</p>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="pt-1.5 border-t border-white/5 flex items-center justify-between">
                      <span className="text-slate-400 text-[10px]">الحالة الحالية:</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          app.status === "PENDING"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-400/30"
                            : app.status === "ACCEPTED"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                            : app.status === "INTERVIEWED"
                            ? "bg-blue-500/20 text-blue-300 border border-blue-400/30"
                            : app.status === "ARCHIVED"
                            ? "bg-purple-500/20 text-purple-300 border border-purple-400/30"
                            : "bg-rose-500/20 text-rose-300 border border-rose-400/30"
                        }`}
                      >
                        {app.status === "PENDING" && "قيد المراجعة ⏳"}
                        {app.status === "ACCEPTED" && "مقبول ومُعيّن ✅"}
                        {app.status === "INTERVIEWED" && "تمت المقابلة 📞"}
                        {app.status === "ARCHIVED" && "في الأرشيف للاحتياج 📁"}
                        {app.status === "REJECTED" && "مرفوض ✕"}
                      </span>
                    </div>

                    {/* Document Previews */}
                    <div className="flex items-center gap-1.5 pt-1.5 border-t border-white/5">
                      {app.nationalIdUrl && (
                        <button
                          type="button"
                          onClick={() => setLightboxImage({ url: app.nationalIdUrl!, title: `بطاقة: ${app.fullName}` })}
                          className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>معاينة البطاقة</span>
                        </button>
                      )}
                      {app.cvUrl && (
                        <button
                          type="button"
                          onClick={() => setLightboxImage({ url: app.cvUrl!, title: `شهادة / سيرة: ${app.fullName}` })}
                          className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <FileText className="w-3 h-3" />
                          <span>معاينة الشهادة</span>
                        </button>
                      )}
                      <a
                        href={`https://wa.me/2${app.phone.replace(/^0/, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-[10px] text-emerald-300 font-bold flex items-center gap-1 cursor-pointer mr-auto"
                      >
                        <span>واتساب 💬</span>
                      </a>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="space-y-1.5 pt-1">
                    {app.status !== "ACCEPTED" ? (
                      <>
                        <button
                          onClick={() => {
                            setOnboardModalApp(app);
                            setOnboardSalary(app.expectedSalary ? String(app.expectedSalary) : "6000");
                            setOnboardCommission("20");
                            setOnboardBranchId(app.targetBranchId || branches[0]?.id || "");
                          }}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>قبول وتعيين في طاقم العمل فوراً ✅</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setInterviewModalApp(app);
                              setInterviewDate("");
                              setInterviewNotes("");
                            }}
                            className="flex-1 py-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-400/30 text-blue-300 font-bold text-xs transition cursor-pointer"
                          >
                            📅 مقابلة
                          </button>

                          <button
                            onClick={() => handleUpdateAppStatus(app.id, "ARCHIVED")}
                            className="flex-1 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-400/30 text-purple-300 font-bold text-xs transition cursor-pointer"
                            title="حفظ في الأرشيف للاحتياج المستقبلي"
                          >
                            📁 حفظ للأرشيف
                          </button>

                          <button
                            onClick={() => handleUpdateAppStatus(app.id, "REJECTED")}
                            className="py-1.5 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/30 text-rose-300 font-bold text-xs transition cursor-pointer"
                            title="رفض الطلب"
                          >
                            ✕ رفض
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-center text-xs font-bold">
                        تم تعيين هذا المرشح وإضافته للأرشيف الرسمي 👑
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. TAB 3: CAREERS QR POSTER (OFFICIAL PRINTABLE POSTER)
         ───────────────────────────────────────────────────────────── */}
      {subTab === "QR_POSTER" && (
        <div className="max-w-xl mx-auto space-y-4">
          {/* Printable Luxury Poster Container */}
          <div
            id="careers-qr-poster"
            className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#141522] via-[#0f101a] to-[#07080d] border-4 border-amber-500/50 p-6 sm:p-8 shadow-2xl text-center space-y-5"
          >
            {/* Corner Ornaments */}
            <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-amber-400 pointer-events-none" />
            <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-amber-400 pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-amber-400 pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-amber-400 pointer-events-none" />

            {/* Triple Brand Logos */}
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-amber-400 bg-black shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/dakn-logo.jpg" alt="دقن الباشا" className="w-full h-full object-cover" />
              </div>
              <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-rose-400 bg-black shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/hammam-logo.jpg" alt="حمام الباشا" className="w-full h-full object-cover" />
              </div>
              <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-teal-400 bg-black shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/newskin-logo.jpg" alt="نيو سكين" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Poster Titles */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-amber-300 font-mono tracking-widest block">
                ★ DAKN EL BASHA VIP RECRUITMENT ★
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                انضم إلى نخبة خبراء مجموعة الباشا الملكية
              </h2>
              <p className="text-xs text-slate-300 font-bold">
                دقن الباشا (رجالي) • حمام وسبا الباشا (حريمي) • عيادة نيو سكين VIP
              </p>
            </div>

            {/* The High-Resolution QR Code */}
            <div className="p-4 rounded-3xl bg-white border-4 border-amber-400 inline-block shadow-2xl mx-auto">
              {qrCodeDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrCodeDataUrl} alt="QR Code" className="w-56 h-56 mx-auto" />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 text-black animate-spin" />
                </div>
              )}
            </div>

            {/* CTA Instructions */}
            <div className="space-y-1 text-xs">
              <p className="text-amber-300 font-black text-sm">
                📲 امسح الكود بكاميرا هاتفك وقدم طلب التوظيف في دقيقة واحدة
              </p>
              <p className="text-slate-400 text-[11px]">
                نستقبل طلبات: الحلاقين المحترفين • خبيرات العناية بالبشرة والمساج • أخصائيات الليزر • الكاشير والاستقبال
              </p>
            </div>

            {/* Footer Contact */}
            <div className="pt-3 border-t border-white/10 text-[11px] text-slate-400 flex items-center justify-between">
              <span>فرع حدائق القبة: 01210103025</span>
              <span>فرع مدينة نصر: 01556782015</span>
            </div>
          </div>

          {/* Action Buttons: Print & Download */}
          <div className="flex items-center justify-center gap-3 no-print">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-2 cursor-pointer shadow-xl shadow-amber-500/20"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة البوستر الرسمي A4 🖨️</span>
            </button>

            {qrCodeDataUrl && (
              <a
                href={qrCodeDataUrl}
                download="Basha-Careers-QR-Poster.png"
                className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>تنزيل صورة الكود (PNG)</span>
              </a>
            )}

            <a
              href={careersPublicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3 rounded-2xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>فتح صفحة التقديم</span>
            </a>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. MODAL 1: VIEW FULL DOSSIER & DOCUMENTS (THE HR FILE)
         ───────────────────────────────────────────────────────────── */}
      {viewingDossier && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 font-sans"
          dir="rtl"
        >
          <div className="relative w-full max-w-2xl bg-[#12121a] border-2 border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-amber-400 bg-black shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={viewingDossier.photoUrl || "/dakn-hero.jpg"}
                    alt={viewingDossier.fullName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">{viewingDossier.fullName}</h3>
                  <p className="text-xs text-amber-300 font-bold">{viewingDossier.jobTitle}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingDossier(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-white/5 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Detailed Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-0.5">
                <span className="text-[10px] text-slate-400 block font-bold">الرقم القومي (14 رقم):</span>
                <span className="text-white font-mono font-bold tracking-wider">{viewingDossier.nationalId || "—"}</span>
              </div>

              <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-0.5">
                <span className="text-[10px] text-slate-400 block font-bold">رقم الهاتف:</span>
                <span className="text-amber-400 font-mono font-bold">{viewingDossier.phone}</span>
              </div>

              <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-0.5">
                <span className="text-[10px] text-slate-400 block font-bold">هاتف الطوارئ:</span>
                <span className="text-slate-300 font-mono">{viewingDossier.phoneSecondary || "—"}</span>
              </div>

              <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-0.5">
                <span className="text-[10px] text-slate-400 block font-bold">تاريخ الميلاد:</span>
                <span className="text-white font-mono">{viewingDossier.birthDate || "—"}</span>
              </div>

              <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-0.5">
                <span className="text-[10px] text-slate-400 block font-bold">العنوان ومحل الإقامة:</span>
                <span className="text-white truncate block">{viewingDossier.address || "—"}</span>
              </div>

              <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-0.5">
                <span className="text-[10px] text-slate-400 block font-bold">المؤهل الدراسي:</span>
                <span className="text-white truncate block">{viewingDossier.qualification || "—"}</span>
              </div>

              <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-0.5">
                <span className="text-[10px] text-slate-400 block font-bold">الراتب الأساسي:</span>
                <span className="text-emerald-400 font-bold font-mono">
                  {viewingDossier.salary} ج.م ({viewingDossier.commissionRate}%)
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-0.5">
                <span className="text-[10px] text-slate-400 block font-bold">تاريخ التعيين:</span>
                <span className="text-white font-mono">{viewingDossier.hireDate || "—"}</span>
              </div>

              <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-0.5">
                <span className="text-[10px] text-slate-400 block font-bold">الشهادة الصحية:</span>
                <span className="text-amber-400 font-mono">
                  {viewingDossier.healthCertExpiry || "غير مسجل"}
                </span>
              </div>
            </div>

            {/* Official Uploaded Documents Gallery */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <h4 className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                <span>المستندات والأوراق الثبوتية المؤرشفة:</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* 1. National ID Front */}
                <div className="p-2.5 rounded-2xl bg-black/60 border border-white/10 text-center space-y-1.5">
                  <span className="text-[10px] text-slate-300 font-bold block">البطاقة (الوجه)</span>
                  {viewingDossier.nationalIdFront ? (
                    <button
                      type="button"
                      onClick={() =>
                        setLightboxImage({
                          url: viewingDossier.nationalIdFront!,
                          title: `البطاقة الشخصية (وجه): ${viewingDossier.fullName}`,
                        })
                      }
                      className="relative w-full h-20 rounded-xl overflow-hidden border border-emerald-400/40 block group cursor-pointer"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={viewingDossier.nationalIdFront} alt="وجه البطاقة" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-bold">
                        تكبير 🔍
                      </div>
                    </button>
                  ) : (
                    <div className="h-20 rounded-xl bg-white/5 border border-dashed border-white/10 flex items-center justify-center text-[10px] text-slate-500">
                      غير مرفق
                    </div>
                  )}
                </div>

                {/* 2. National ID Back */}
                <div className="p-2.5 rounded-2xl bg-black/60 border border-white/10 text-center space-y-1.5">
                  <span className="text-[10px] text-slate-300 font-bold block">البطاقة (الظهر)</span>
                  {viewingDossier.nationalIdBack ? (
                    <button
                      type="button"
                      onClick={() =>
                        setLightboxImage({
                          url: viewingDossier.nationalIdBack!,
                          title: `البطاقة الشخصية (ظهر): ${viewingDossier.fullName}`,
                        })
                      }
                      className="relative w-full h-20 rounded-xl overflow-hidden border border-emerald-400/40 block group cursor-pointer"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={viewingDossier.nationalIdBack} alt="ظهر البطاقة" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-bold">
                        تكبير 🔍
                      </div>
                    </button>
                  ) : (
                    <div className="h-20 rounded-xl bg-white/5 border border-dashed border-white/10 flex items-center justify-center text-[10px] text-slate-500">
                      غير مرفق
                    </div>
                  )}
                </div>

                {/* 3. Health Certificate */}
                <div className="p-2.5 rounded-2xl bg-black/60 border border-white/10 text-center space-y-1.5">
                  <span className="text-[10px] text-slate-300 font-bold block">الشهادة الصحية</span>
                  {viewingDossier.healthCertUrl ? (
                    <button
                      type="button"
                      onClick={() =>
                        setLightboxImage({
                          url: viewingDossier.healthCertUrl!,
                          title: `الشهادة الصحية: ${viewingDossier.fullName}`,
                        })
                      }
                      className="relative w-full h-20 rounded-xl overflow-hidden border border-emerald-400/40 block group cursor-pointer"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={viewingDossier.healthCertUrl} alt="الشهادة الصحية" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-bold">
                        تكبير 🔍
                      </div>
                    </button>
                  ) : (
                    <div className="h-20 rounded-xl bg-white/5 border border-dashed border-white/10 flex items-center justify-center text-[10px] text-slate-500">
                      غير مرفق
                    </div>
                  )}
                </div>

                {/* 4. Criminal Record / Contract */}
                <div className="p-2.5 rounded-2xl bg-black/60 border border-white/10 text-center space-y-1.5">
                  <span className="text-[10px] text-slate-300 font-bold block">الفيش / عقد العمل</span>
                  {viewingDossier.criminalRecordUrl || viewingDossier.contractDocUrl ? (
                    <button
                      type="button"
                      onClick={() =>
                        setLightboxImage({
                          url: viewingDossier.criminalRecordUrl || viewingDossier.contractDocUrl!,
                          title: `عقد العمل / الفيش: ${viewingDossier.fullName}`,
                        })
                      }
                      className="relative w-full h-20 rounded-xl overflow-hidden border border-emerald-400/40 block group cursor-pointer"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={viewingDossier.criminalRecordUrl || viewingDossier.contractDocUrl!}
                        alt="عقد العمل"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-bold">
                        تكبير 🔍
                      </div>
                    </button>
                  ) : (
                    <div className="h-20 rounded-xl bg-white/5 border border-dashed border-white/10 flex items-center justify-center text-[10px] text-slate-500">
                      غير مرفق
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            {viewingDossier.notes && (
              <div className="p-3 rounded-2xl bg-black/40 border border-white/5 text-xs text-slate-300">
                <strong className="text-amber-400 block mb-0.5">ملاحظات وتقييم الإدارة:</strong>
                <p>{viewingDossier.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة ملف الموظف 🖨️</span>
              </button>

              <button
                type="button"
                onClick={() => setViewingDossier(null)}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition cursor-pointer"
              >
                إغلاق الملف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. MODAL 2: ADD / EDIT DOSSIER (ADD STAFF TO ARCHIVE)
         ───────────────────────────────────────────────────────────── */}
      {showAddDossierModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 font-sans"
          dir="rtl"
        >
          <div className="relative w-full max-w-2xl bg-[#12121a] border-2 border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <FolderArchive className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">
                  {editingDossier ? "تعديل ملف الموظف في الأرشيف ⚙️" : "إضافة ملف موظف جديد لأرشيف شؤون العاملين 📁"}
                </h3>
              </div>
              <button
                onClick={() => setShowAddDossierModal(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDossier} className="space-y-4 text-xs">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">الاسم رباعي (كما بالبطاقة) *:</label>
                  <input
                    type="text"
                    required
                    value={dossierForm.fullName}
                    onChange={(e) => setDossierForm({ ...dossierForm, fullName: e.target.value })}
                    placeholder="مثال: محمد حسام الدين الباشا"
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">الرقم القومي (14 رقم):</label>
                  <input
                    type="text"
                    maxLength={14}
                    value={dossierForm.nationalId}
                    onChange={(e) => setDossierForm({ ...dossierForm, nationalId: e.target.value })}
                    placeholder="29XXXXXXXXXXXX"
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">رقم الهاتف *:</label>
                  <input
                    type="tel"
                    required
                    value={dossierForm.phone}
                    onChange={(e) => setDossierForm({ ...dossierForm, phone: e.target.value })}
                    placeholder="010XXXXXXXX"
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">هاتف الطوارئ / بديل:</label>
                  <input
                    type="tel"
                    value={dossierForm.phoneSecondary}
                    onChange={(e) => setDossierForm({ ...dossierForm, phoneSecondary: e.target.value })}
                    placeholder="011XXXXXXXX"
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">تاريخ الميلاد:</label>
                  <input
                    type="date"
                    value={dossierForm.birthDate}
                    onChange={(e) => setDossierForm({ ...dossierForm, birthDate: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Job, Department, Branch */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">المسمى الوظيفي *:</label>
                  <input
                    type="text"
                    required
                    value={dossierForm.jobTitle}
                    onChange={(e) => setDossierForm({ ...dossierForm, jobTitle: e.target.value })}
                    placeholder="مثال: خبير حلاقة وتصفيف VIP"
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">القسم / الكيان:</label>
                  <select
                    value={dossierForm.department}
                    onChange={(e) => setDossierForm({ ...dossierForm, department: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="DAKN">💈 صالون دقن الباشا (رجالي)</option>
                    <option value="HAMMAM">🧖‍♀️ حمام وسبا الباشا (حريمي)</option>
                    <option value="NEWSKIN">✨ عيادة نيو سكين VIP (ليزر وتجميل)</option>
                    <option value="MANAGEMENT">👑 إدارة وحسابات</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">الفرع التابع له:</label>
                  <select
                    value={dossierForm.branchId}
                    onChange={(e) => setDossierForm({ ...dossierForm, branchId: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="">(عام / غير مقيد بفرع)</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Salary, Commission, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">الراتب الأساسي (ج.م):</label>
                  <input
                    type="number"
                    value={dossierForm.salary}
                    onChange={(e) => setDossierForm({ ...dossierForm, salary: e.target.value })}
                    placeholder="6000"
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">نسبة العمولة (%):</label>
                  <input
                    type="number"
                    value={dossierForm.commissionRate}
                    onChange={(e) => setDossierForm({ ...dossierForm, commissionRate: e.target.value })}
                    placeholder="20"
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">حالة العمل:</label>
                  <select
                    value={dossierForm.status}
                    onChange={(e) => setDossierForm({ ...dossierForm, status: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="ACTIVE">🟢 على رأس العمل (نشط)</option>
                    <option value="ON_LEAVE">🟡 في إجازة</option>
                    <option value="ARCHIVED">📦 في الأرشيف (سابق)</option>
                    <option value="TERMINATED">🔴 منتهي خدمته</option>
                  </select>
                </div>
              </div>

              {/* Uploads (ID front, ID back, Health Card, Contract) */}
              <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                <span className="text-[11px] font-bold text-amber-300 block">رفع وتحديث المستندات والأوراق الثبوتية:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* Photo */}
                  <div>
                    <label className="text-slate-400 text-[10px] block mb-0.5">الصورة الشخصية:</label>
                    <label className="block p-2 border border-dashed border-white/20 rounded-xl text-center cursor-pointer hover:border-amber-400 text-[10px]">
                      {dossierForm.photoUrl ? "تم الرفع ✓" : "رفع صورة"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleUploadDoc("photoUrl", e.target.files[0]);
                        }}
                      />
                    </label>
                  </div>

                  {/* ID Front */}
                  <div>
                    <label className="text-slate-400 text-[10px] block mb-0.5">البطاقة (وجه):</label>
                    <label className="block p-2 border border-dashed border-white/20 rounded-xl text-center cursor-pointer hover:border-amber-400 text-[10px]">
                      {dossierForm.nationalIdFront ? "تم الرفع ✓" : "رفع الوجه"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleUploadDoc("nationalIdFront", e.target.files[0]);
                        }}
                      />
                    </label>
                  </div>

                  {/* ID Back */}
                  <div>
                    <label className="text-slate-400 text-[10px] block mb-0.5">البطاقة (ظهر):</label>
                    <label className="block p-2 border border-dashed border-white/20 rounded-xl text-center cursor-pointer hover:border-amber-400 text-[10px]">
                      {dossierForm.nationalIdBack ? "تم الرفع ✓" : "رفع الظهر"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleUploadDoc("nationalIdBack", e.target.files[0]);
                        }}
                      />
                    </label>
                  </div>

                  {/* Health Card */}
                  <div>
                    <label className="text-slate-400 text-[10px] block mb-0.5">الشهادة الصحية:</label>
                    <label className="block p-2 border border-dashed border-white/20 rounded-xl text-center cursor-pointer hover:border-amber-400 text-[10px]">
                      {dossierForm.healthCertUrl ? "تم الرفع ✓" : "رفع الشهادة"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleUploadDoc("healthCertUrl", e.target.files[0]);
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 text-[10px] block mb-0.5">تاريخ انتهاء الشهادة الصحية:</label>
                  <input
                    type="date"
                    value={dossierForm.healthCertExpiry}
                    onChange={(e) => setDossierForm({ ...dossierForm, healthCertExpiry: e.target.value })}
                    className="w-full py-1.5 px-2.5 rounded-lg bg-black/60 border border-white/10 text-white text-xs font-mono"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">ملاحظات وتقييم الإدارة:</label>
                <textarea
                  rows={2}
                  value={dossierForm.notes}
                  onChange={(e) => setDossierForm({ ...dossierForm, notes: e.target.value })}
                  placeholder="أي ملاحظات إدارية، تقييمات، شهادات إضافية، سبب إنهاء العمل..."
                  className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddDossierModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={uploadingDocField !== null}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingDossier ? "حفظ التعديلات 💾" : "حفظ ملف الموظف في الأرشيف 📁"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          7. MODAL 3: ONBOARD APPLICANT CONFIRMATION
         ───────────────────────────────────────────────────────────── */}
      {onboardModalApp && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 font-sans"
          dir="rtl"
        >
          <div className="relative w-full max-w-md bg-[#12121a] border-2 border-emerald-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-black text-white">قبول وتعيين المتقدم في طاقم العمل 👑</h3>
              </div>
              <button
                onClick={() => setOnboardModalApp(null)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              سيتم إنشاء ملف رسمي للموظف <strong className="text-amber-400">{onboardModalApp.fullName}</strong> ونقل
              كافة مستنداته وصوره إلى أرشيف شؤون العاملين الرسمي تلقائياً.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">الفرع التابع له:</label>
                <select
                  value={onboardBranchId}
                  onChange={(e) => setOnboardBranchId(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-emerald-400"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">الراتب المتفق عليه (ج.م):</label>
                  <input
                    type="number"
                    value={onboardSalary}
                    onChange={(e) => setOnboardSalary(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">نسبة العمولة (%):</label>
                  <input
                    type="number"
                    value={onboardCommission}
                    onChange={(e) => setOnboardCommission(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setOnboardModalApp(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmOnboard}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>تأكيد التعيين ونقل الملف للأرشيف 👑</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          8. MODAL 4: INTERVIEW SCHEDULING MODAL
         ───────────────────────────────────────────────────────────── */}
      {interviewModalApp && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 font-sans"
          dir="rtl"
        >
          <div className="relative w-full max-w-md bg-[#12121a] border-2 border-blue-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-black text-white">تحديد موعد مقابلة شخصية 📅</h3>
              </div>
              <button
                onClick={() => setInterviewModalApp(null)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">موعد وتوقيت المقابلة:</label>
                <input
                  type="datetime-local"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white font-mono focus:outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">ملاحظات وموقع المقابلة:</label>
                <textarea
                  rows={3}
                  value={interviewNotes}
                  onChange={(e) => setInterviewNotes(e.target.value)}
                  placeholder="مثال: المقابلة بفرع حدائق القبة مع المدير العام لتجربة عملية للحلاقة..."
                  className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-blue-400 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setInterviewModalApp(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() =>
                  handleUpdateAppStatus(interviewModalApp.id, "INTERVIEWED", interviewDate, interviewNotes)
                }
                className="px-5 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-black transition flex items-center gap-1.5 shadow-lg shadow-blue-500/20 cursor-pointer"
              >
                <span>حفظ موعد المقابلة 📅</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          9. MODAL 5: DOCUMENT LIGHTBOX (FULL-SCREEN IMAGE ZOOM)
         ───────────────────────────────────────────────────────────── */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4"
          dir="rtl"
        >
          <div className="relative max-w-3xl w-full bg-[#12121a] border border-white/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 bg-black/60 flex items-center justify-between border-b border-white/10">
              <h4 className="text-sm font-bold text-white truncate">{lightboxImage.title}</h4>
              <button
                onClick={() => setLightboxImage(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-white/10 transition cursor-pointer text-sm"
              >
                إغلاق ✕
              </button>
            </div>

            <div className="p-4 max-h-[80vh] overflow-auto flex items-center justify-center bg-black/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={lightboxImage.url} alt="وثيقة" className="max-w-full max-h-[70vh] object-contain rounded-xl" />
            </div>

            <div className="p-3 bg-black/60 flex items-center justify-between border-t border-white/10 text-xs">
              <a
                href={lightboxImage.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:underline flex items-center gap-1 font-bold"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>فتح الصورة بالحجم الكامل في نافذة جديدة</span>
              </a>
              <button
                onClick={() => setLightboxImage(null)}
                className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold cursor-pointer"
              >
                تم
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
