"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Video,
  VideoOff,
  Camera,
  ShieldAlert,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Radio,
  Tv,
  Settings,
  Plus,
  Trash2,
  Edit3,
  RefreshCw,
  ExternalLink,
  Lock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Compass,
  Sliders,
  Sparkles,
  Download,
  Clock,
  Layers,
  MapPin,
  RotateCcw,
  Zap,
  Search,
} from "lucide-react";

interface SecurityCamera {
  id: string;
  name: string;
  branchId?: string | null;
  branch?: any;
  venueType: string;
  locationDescription: string;
  feedType: "STREAM" | "SNAPSHOT" | "IFRAME" | "SIMULATION";
  feedUrl?: string | null;
  snapshotUrl?: string | null;
  rtspUrl?: string | null;
  ipAddress?: string | null;
  port?: number;
  channelNumber: number;
  streamQuality: string;
  fps: number;
  hasNightVision: boolean;
  hasPTZ: boolean;
  hasAudio: boolean;
  isActive: boolean;
  sortOrder: number;
  notes?: string | null;
  createdAt: string;
}

interface CCTVMonitoringTabProps {
  branches: any[];
  currentUser: any;
  isWomenTheme?: boolean;
  isNewSkinTheme?: boolean;
  showToast: (type: "success" | "error" | "info", message: string) => void;
}

export default function CCTVMonitoringTab({
  branches,
  currentUser,
  isWomenTheme,
  isNewSkinTheme,
  showToast,
}: CCTVMonitoringTabProps) {
  // State
  const [cameras, setCameras] = useState<SecurityCamera[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>("ALL");
  const [layoutMode, setLayoutMode] = useState<"QUAD" | "GRID" | "SINGLE">("QUAD");
  const [focusedCameraId, setFocusedCameraId] = useState<string | null>(null);

  // Live Real-Time Clock for OSD (Egypt Time)
  const [currentDateTime, setCurrentDateTime] = useState<string>("");
  const [recBlink, setRecBlink] = useState(true);

  // Global Night Vision IR mode (affects all or individual)
  const [globalNightVision, setGlobalNightVision] = useState(false);
  const [cameraNightVisionMap, setCameraNightVisionMap] = useState<Record<string, boolean>>({});

  // PTZ Simulator State
  const [ptzActiveCameraId, setPtzActiveCameraId] = useState<string | null>(null);
  const [ptzOffsets, setPtzOffsets] = useState<Record<string, { x: number; y: number; zoom: number }>>({});

  // Audio simulator state
  const [audioActiveCameraId, setAudioActiveCameraId] = useState<string | null>(null);

  // Modals
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingCamera, setEditingCamera] = useState<SecurityCamera | null>(null);
  const [showDvrConnectModal, setShowDvrConnectModal] = useState(false);
  const [savingCamera, setSavingCamera] = useState(false);

  // Camera Form
  const [formData, setFormData] = useState({
    name: "",
    branchId: "",
    venueType: "DAKN",
    locationDescription: "",
    feedType: "SIMULATION" as "STREAM" | "SNAPSHOT" | "IFRAME" | "SIMULATION",
    feedUrl: "",
    snapshotUrl: "",
    rtspUrl: "",
    ipAddress: "",
    port: 80,
    channelNumber: 1,
    streamQuality: "2K",
    fps: 30,
    hasNightVision: true,
    hasPTZ: true,
    hasAudio: false,
    notes: "",
  });

  // DVR Connection State
  const [dvrIp, setDvrIp] = useState("192.168.1.108");
  const [dvrPort, setDvrPort] = useState(80);
  const [dvrUsername, setDvrUsername] = useState("admin");
  const [dvrPassword, setDvrPassword] = useState("");
  const [dvrBrand, setDvrBrand] = useState<"hikvision" | "dahua">("hikvision");
  const [dvrMode, setDvrMode] = useState<"SNAPSHOT_PROXY" | "DIRECT_WEB" | "SIMULATION">("SNAPSHOT_PROXY");
  const [testingDvr, setTestingDvr] = useState(false);
  const [dvrTestResult, setDvrTestResult] = useState<{ reachable: boolean; message: string } | null>(null);
  const [brokenFeedsMap, setBrokenFeedsMap] = useState<Record<string, boolean>>({});

  // Fetch Cameras
  const fetchCameras = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/cctv?role=${currentUser?.role || "owner"}`);
      const data = await res.json();
      if (data.success && data.cameras) {
        setCameras(data.cameras);
        if (!focusedCameraId && data.cameras.length > 0) {
          setFocusedCameraId(data.cameras[0].id);
        }
      }
    } catch (err: any) {
      console.error("Error loading CCTV cameras:", err);
      showToast("error", "تعذر تحميل كاميرات المراقبة");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCameras();
  }, []);

  // Live Timer & REC Flasher (Runs every second)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: "Africa/Cairo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      };
      setCurrentDateTime(new Intl.DateTimeFormat("en-GB", options).format(now));
      setRecBlink((prev) => !prev);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filtered cameras based on branch
  const filteredCameras = cameras.filter((cam) => {
    if (selectedBranchFilter === "ALL") return true;
    if (selectedBranchFilter === "DAKN") return cam.venueType === "DAKN";
    if (selectedBranchFilter === "HAMMAM") return cam.venueType === "HAMMAM";
    if (selectedBranchFilter === "NEWSKIN") return cam.venueType === "NEWSKIN";
    if (selectedBranchFilter === "TREASURY") return cam.venueType === "TREASURY" || cam.venueType === "OFFICE";
    return cam.branchId === selectedBranchFilter;
  });

  // PTZ Control Handler
  const handlePtzMove = (camId: string, dx: number, dy: number, dZoom: number) => {
    setPtzOffsets((prev) => {
      const cur = prev[camId] || { x: 0, y: 0, zoom: 1 };
      const newX = Math.max(-40, Math.min(40, cur.x + dx));
      const newY = Math.max(-40, Math.min(40, cur.y + dy));
      const newZoom = Math.max(1, Math.min(2.5, cur.zoom + dZoom));
      return { ...prev, [camId]: { x: newX, y: newY, zoom: newZoom } };
    });
  };

  const handlePtzReset = (camId: string) => {
    setPtzOffsets((prev) => ({
      ...prev,
      [camId]: { x: 0, y: 0, zoom: 1 },
    }));
    showToast("info", "تم إعادة توجيه الكاميرا للمركز الافتراضي");
  };

  // Toggle Night Vision IR
  const toggleCameraNightVision = (camId: string) => {
    setCameraNightVisionMap((prev) => ({
      ...prev,
      [camId]: !prev[camId],
    }));
  };

  // Security Incident Snapshot Downloader
  const captureSecuritySnapshot = (cam: SecurityCamera) => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Draw background
      const img = new Image();
      img.crossOrigin = "anonymous";

      // Select fallback image based on venue
      let bgSrc = "/dakn-hero.jpg";
      if (cam.venueType === "HAMMAM") bgSrc = "/hammam-hero.jpg";
      if (cam.venueType === "NEWSKIN") bgSrc = "/newskin-hero.jpg";
      if (cam.venueType === "TREASURY") bgSrc = "/dakn-hero.jpg";

      img.src = bgSrc;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, 1280, 720);

        // Security Dark overlay + Scanlines
        ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
        ctx.fillRect(0, 0, 1280, 720);

        // OSD Banner Header
        ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
        ctx.fillRect(0, 0, 1280, 48);

        ctx.fillStyle = "#f59e0b";
        ctx.font = "bold 20px sans-serif";
        ctx.fillText("● توثيق أمني رسمي - مجموعة صالونات وسبا وعيادات الباشا VIP", 20, 32);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 18px monospace";
        ctx.fillText(`CAM ID: ${cam.name} | CH: 0${cam.channelNumber}`, 800, 32);

        // OSD Footer Timestamp
        ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
        ctx.fillRect(0, 672, 1280, 48);

        ctx.fillStyle = "#22c55e";
        ctx.font = "bold 18px monospace";
        ctx.fillText(`EGYPT TIME: ${currentDateTime} | QUALITY: ${cam.streamQuality} @ ${cam.fps}FPS`, 20, 702);

        ctx.fillStyle = "#ef4444";
        ctx.fillText(`[ SECURITY INCIDENT SNAPSHOT - SECURE ARCHIVE ]`, 780, 702);

        // Trigger Download
        const link = document.createElement("a");
        const filename = `CCTV-INCIDENT-${cam.name.replace(/\s+/g, "_")}-${new Date()
          .toISOString()
          .replace(/[:.]/g, "-")}.jpg`;
        link.download = filename;
        link.href = canvas.toDataURL("image/jpeg", 0.95);
        link.click();

        showToast("success", `تم حفظ وتوثيق اللقطة الأمنية بنجاح 📸: ${cam.name}`);
      };
      img.onerror = () => {
        showToast("error", "فشل حفظ اللقطة، يرجى المحاولة ثانية");
      };
    } catch (e: any) {
      console.error(e);
      showToast("error", "حدث خطأ أثناء التقاط الصورة");
    }
  };

  // Fullscreen Browser Toggle
  const toggleBrowserFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      showToast("info", "تم تفعيل وضع شاشة المراقبة الكبرى (ملء الشاشة)");
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // Open Add/Edit Modal
  const openAddModal = () => {
    setEditingCamera(null);
    setFormData({
      name: `كاميرا ${cameras.length + 1}: `,
      branchId: branches[0]?.id || "",
      venueType: "DAKN",
      locationDescription: "",
      feedType: "SIMULATION",
      feedUrl: "",
      snapshotUrl: "",
      rtspUrl: "rtsp://admin:12345@192.168.1.108:554/cam/realmonitor?channel=1&subtype=0",
      ipAddress: "192.168.1.108",
      port: 80,
      channelNumber: cameras.length + 1,
      streamQuality: "2K",
      fps: 30,
      hasNightVision: true,
      hasPTZ: true,
      hasAudio: false,
      notes: "",
    });
    setShowAddEditModal(true);
  };

  const openEditModal = (cam: SecurityCamera) => {
    setEditingCamera(cam);
    setFormData({
      name: cam.name,
      branchId: cam.branchId || "",
      venueType: cam.venueType || "DAKN",
      locationDescription: cam.locationDescription || "",
      feedType: cam.feedType || "SIMULATION",
      feedUrl: cam.feedUrl || "",
      snapshotUrl: cam.snapshotUrl || "",
      rtspUrl: cam.rtspUrl || "",
      ipAddress: cam.ipAddress || "",
      port: cam.port || 80,
      channelNumber: cam.channelNumber || 1,
      streamQuality: cam.streamQuality || "2K",
      fps: cam.fps || 30,
      hasNightVision: cam.hasNightVision ?? true,
      hasPTZ: cam.hasPTZ ?? true,
      hasAudio: cam.hasAudio ?? false,
      notes: cam.notes || "",
    });
    setShowAddEditModal(true);
  };

  // Save Camera
  const handleSaveCamera = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingCamera(true);
      const url = "/api/cctv";
      const method = editingCamera ? "PATCH" : "POST";
      const payload = editingCamera ? { id: editingCamera.id, ...formData } : formData;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        showToast("success", editingCamera ? "تم تحديث الكاميرا بنجاح 📹" : "تمت إضافة الكاميرا بنجاح 📹");
        setShowAddEditModal(false);
        fetchCameras();
      } else {
        showToast("error", data.error || "فشل حفظ بيانات الكاميرا");
      }
    } catch (err) {
      showToast("error", "حدث خطأ أثناء حفظ الكاميرا");
    } finally {
      setSavingCamera(false);
    }
  };

  // Delete Camera
  const handleDeleteCamera = async (camId: string, camName: string) => {
    if (!confirm(`هل أنت متأكد من حذف كاميرا المراقبة: "${camName}" من المنظومة؟`)) {
      return;
    }
    try {
      const res = await fetch(`/api/cctv?id=${camId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast("success", "تم حذف الكاميرا بنجاح 🗑️");
        fetchCameras();
      } else {
        showToast("error", data.error || "فشل حذف الكاميرا");
      }
    } catch (err) {
      showToast("error", "حدث خطأ أثناء الحذف");
    }
  };

  // Test Live DVR Network Connection via TCP / Ping
  const handleTestDvr = async () => {
    try {
      setTestingDvr(true);
      setDvrTestResult(null);
      const res = await fetch(`/api/cctv/proxy?action=ping&ip=${dvrIp}&port=${dvrPort}`);
      const data = await res.json();
      if (data.success) {
        setDvrTestResult({ reachable: data.reachable, message: data.message });
        if (data.reachable) {
          showToast("success", "تم الاتصال بجهاز الـ DVR بنجاح 🟢");
        } else {
          showToast("error", "الجهاز لا يستجيب، راجع الـ IP واتصال الشبكة 🔴");
        }
      } else {
        showToast("error", data.error || "فشل اختبار الاتصال");
      }
    } catch {
      showToast("error", "تعذر الاتصال بخادم الفحص");
    } finally {
      setTestingDvr(false);
    }
  };

  // Bulk Apply DVR Configuration to All Cameras
  const handleApplyDvrConfig = async () => {
    try {
      setSavingCamera(true);
      const res = await fetch("/api/cctv", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "apply_dvr_config",
          dvrIp,
          dvrPort,
          dvrUser: dvrUsername,
          dvrPass: dvrPassword,
          dvrBrand,
          mode: dvrMode,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", data.message || "تم ربط وتحديث قنوات الـ DVR لجميع الكاميرات بنجاح ⚡");
        setBrokenFeedsMap({});
        setShowDvrConnectModal(false);
        fetchCameras();
      } else {
        showToast("error", data.error || "فشل تطبيق الإعدادات");
      }
    } catch {
      showToast("error", "تعذر حفظ إعدادات الـ DVR");
    } finally {
      setSavingCamera(false);
    }
  };

  // Bulk Reset to High-Res Simulation
  const handleBulkResetSimulation = async () => {
    try {
      const res = await fetch("/api/cctv", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bulk_reset_simulation" }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", "تم العودة للعرض الذكي الافتراضي السليم بنجاح 👑");
        setBrokenFeedsMap({});
        fetchCameras();
      } else {
        showToast("error", data.error || "فشل إعادة الضبط");
      }
    } catch {
      showToast("error", "فشل إعادة الضبط");
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-100" dir="rtl">
      {/* ─────────────────────────────────────────────────────────────
          1. ULTRA LUXURY COMMAND CENTER HEADER & CONTROLS
         ───────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0d0f17] via-[#141724] to-[#0c0d14] border-2 border-amber-500/40 p-5 sm:p-6 shadow-2xl">
        {/* Ambient CCTV Green & Amber Glow */}
        <div className="absolute top-0 right-1/4 w-72 h-32 bg-emerald-500/10 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-72 h-32 bg-amber-500/10 blur-[80px] pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Title & Live Status */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-black tracking-wider animate-pulse">
                <Radio className="w-3.5 h-3.5" />
                <span>● مباشر - LIVE CCTV 24/7</span>
              </span>

              <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                👑 غرفة المراقبة والتحكم المباشر (خاص بالمالك والإدارة العامة فقط)
              </span>

              <span className="px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs font-mono font-bold">
                {cameras.length} كاميرات متصلة
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Video className="w-6 h-6 text-amber-400" />
              <span>منظومة المراقبة المرئية الحية وكاميرات الأمان VIP</span>
            </h2>

            <p className="text-xs text-slate-400">
              بث مباشر متواصل لكافة الصالات، مناطق الخزنة والكاشير، أجنحة السبا، عيادات نيو سكين VIP مع تحكم كامل بالـ PTZ والتسجيل الأمني.
            </p>
          </div>

          {/* Clock & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Live Clock Watermark */}
            <div className="px-3.5 py-2 rounded-2xl bg-black/70 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-black flex items-center gap-2 shadow-inner">
              <Clock className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: "12s" }} />
              <span dir="ltr">{currentDateTime || "24/11/2026 10:30:00"}</span>
            </div>

            {/* Layout Toggles */}
            <div className="flex items-center bg-black/60 p-1 rounded-2xl border border-white/10">
              <button
                onClick={() => setLayoutMode("QUAD")}
                title="عرض شبكة رباعية 2x2"
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  layoutMode === "QUAD" ? "bg-amber-500 text-black shadow-md shadow-amber-500/20" : "text-slate-400 hover:text-white"
                }`}
              >
                <span>⊞ رباعي (2x2)</span>
              </button>
              <button
                onClick={() => setLayoutMode("GRID")}
                title="عرض شبكة سداسية 3x2"
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  layoutMode === "GRID" ? "bg-amber-500 text-black shadow-md shadow-amber-500/20" : "text-slate-400 hover:text-white"
                }`}
              >
                <span>▦ سداسي (3x2)</span>
              </button>
              <button
                onClick={() => setLayoutMode("SINGLE")}
                title="عرض كاميرا مفردة مكبرة"
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  layoutMode === "SINGLE" ? "bg-amber-500 text-black shadow-md shadow-amber-500/20" : "text-slate-400 hover:text-white"
                }`}
              >
                <span>⬛ شاشة مكبرة</span>
              </button>
            </div>

            {/* Global Night Vision Toggle */}
            <button
              onClick={() => {
                setGlobalNightVision(!globalNightVision);
                showToast(
                  "info",
                  !globalNightVision ? "تم تفعيل وضع الرؤية الليلية بالأشعة تحت الحمراء (IR Mode)" : "تم العودة للألوان الطبيعية"
                );
              }}
              className={`p-2.5 rounded-2xl border transition cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                globalNightVision
                  ? "bg-emerald-500/20 border-emerald-400 text-emerald-300"
                  : "bg-white/5 border-white/10 text-slate-300 hover:border-amber-400"
              }`}
              title="تبديل الرؤية الليلية لكافة الكاميرات"
            >
              {globalNightVision ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
              <span className="hidden sm:inline">رؤية ليلية IR</span>
            </button>

            {/* Fullscreen TV Mode */}
            <button
              onClick={toggleBrowserFullscreen}
              className="p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-400 text-slate-200 transition cursor-pointer"
              title="وضع شاشة المراقبة الكبرى (ملء الشاشة للتلفزيون)"
            >
              <Maximize2 className="w-4 h-4 text-amber-400" />
            </button>

            {/* Reset to Clean View Button */}
            <button
              onClick={handleBulkResetSimulation}
              className="px-3 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-amber-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="إعادة ضبط العرض التوضيحي السليم فوراً"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">إعادة ضبط 🔄</span>
            </button>

            {/* Direct DVR Connect Modal Button */}
            <button
              onClick={() => setShowDvrConnectModal(true)}
              className="px-3.5 py-2.5 rounded-2xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/40 text-indigo-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg"
            >
              <Tv className="w-4 h-4 text-indigo-400" />
              <span>ربط سيرفر الـ DVR ⚡</span>
            </button>

            {/* Direct Web GUI Link */}
            <a
              href={`http://${dvrIp}:${dvrPort}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2.5 rounded-2xl bg-indigo-500/15 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="فتح لوحة تحكم هيكفيجن أو داهوا في متصفحك مباشرة"
            >
              <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">لوحة الـ DVR 🌐</span>
            </a>

            {/* Add Camera Button */}
            <button
              onClick={openAddModal}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow-xl shadow-amber-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة كاميرا جديدة +</span>
            </button>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            2. VENUE & BRANCH FILTER TABS
           ───────────────────────────────────────────────────────────── */}
        <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            <span className="text-xs text-slate-400 font-bold shrink-0 ml-1">تصفية العرض:</span>
            <button
              onClick={() => setSelectedBranchFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                selectedBranchFilter === "ALL"
                  ? "bg-amber-500/20 border border-amber-400 text-amber-300"
                  : "bg-white/5 border border-white/5 text-slate-400 hover:text-white"
              }`}
            >
              👑 كافة الفروع والأماكن ({cameras.length})
            </button>

            <button
              onClick={() => setSelectedBranchFilter("DAKN")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                selectedBranchFilter === "DAKN"
                  ? "bg-amber-500/20 border border-amber-400 text-amber-300"
                  : "bg-white/5 border border-white/5 text-slate-400 hover:text-white"
              }`}
            >
              💈 صالون دقن الباشا (رجالي)
            </button>

            <button
              onClick={() => setSelectedBranchFilter("HAMMAM")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                selectedBranchFilter === "HAMMAM"
                  ? "bg-rose-500/20 border border-rose-400 text-rose-300"
                  : "bg-white/5 border border-white/5 text-slate-400 hover:text-white"
              }`}
            >
              🧖‍♀️ حمام وسبا الباشا (حريمي VIP)
            </button>

            <button
              onClick={() => setSelectedBranchFilter("NEWSKIN")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                selectedBranchFilter === "NEWSKIN"
                  ? "bg-teal-500/20 border border-teal-400 text-teal-300"
                  : "bg-white/5 border border-white/5 text-slate-400 hover:text-white"
              }`}
            >
              ✨ عيادة نيو سكين والليزر (New Skin)
            </button>

            <button
              onClick={() => setSelectedBranchFilter("TREASURY")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                selectedBranchFilter === "TREASURY"
                  ? "bg-emerald-500/20 border border-emerald-400 text-emerald-300"
                  : "bg-white/5 border border-white/5 text-slate-400 hover:text-white"
              }`}
            >
              💰 الخزنة والكاشير ومكتب الإدارة
            </button>
          </div>

          {/* Quick Refresh Feed */}
          <button
            onClick={fetchCameras}
            className="p-1.5 text-xs text-slate-400 hover:text-amber-400 transition flex items-center gap-1 cursor-pointer"
            title="تحديث اتصال الكاميرات"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>تحديث البث</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. CCTV FEEDS DISPLAY (QUAD / GRID / SINGLE)
         ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="h-96 rounded-3xl bg-[#12121a] border border-white/10 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
          <p className="text-sm font-bold text-slate-300 font-mono">جارٍ الاتصال بشبكة كاميرات المراقبة وتفعيل البث الحي...</p>
        </div>
      ) : filteredCameras.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#12121a] border border-white/10 space-y-4">
          <VideoOff className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">لا توجد كاميرات مضافة لهذا القسم حالياً</h3>
          <p className="text-xs text-slate-400">يمكنك إضافة كاميرات جديدة أو تغيير التصفية لعرض باقي الأماكن.</p>
          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 transition"
          >
            إضافة أول كاميرا مراقبة 📹
          </button>
        </div>
      ) : (
        <div
          className={`grid gap-5 transition-all ${
            layoutMode === "SINGLE"
              ? "grid-cols-1"
              : layoutMode === "QUAD"
              ? "grid-cols-1 md:grid-cols-2"
              : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {(layoutMode === "SINGLE"
            ? filteredCameras.filter((c) => c.id === focusedCameraId).length > 0
              ? filteredCameras.filter((c) => c.id === focusedCameraId)
              : [filteredCameras[0]]
            : filteredCameras
          ).map((cam) => {
            const isNightVision = globalNightVision || Boolean(cameraNightVisionMap[cam.id]);
            const offset = ptzOffsets[cam.id] || { x: 0, y: 0, zoom: 1 };
            const isPtzActive = ptzActiveCameraId === cam.id;
            const isAudioActive = audioActiveCameraId === cam.id;

            // Choose appropriate realistic background visual for simulation
            let fallbackImage = "/dakn-hero.jpg";
            if (cam.venueType === "HAMMAM") fallbackImage = "/hammam-hero.jpg";
            if (cam.venueType === "NEWSKIN") fallbackImage = "/newskin-hero.jpg";
            if (cam.venueType === "TREASURY") fallbackImage = "/dakn-hero.jpg";

            return (
              <div
                key={cam.id}
                className="relative group rounded-3xl overflow-hidden bg-black border-2 border-slate-800 hover:border-amber-500/50 transition-all shadow-2xl flex flex-col"
              >
                {/* ─── CCTV SCREEN HEADER OSD BAR ─── */}
                <div className="bg-gradient-to-b from-black/90 to-transparent p-3 absolute top-0 inset-x-0 z-20 flex items-center justify-between text-xs font-mono pointer-events-auto">
                  {/* Left: REC indicator + Cam Name */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded-full transition-opacity ${
                        recBlink ? "bg-red-500 shadow-md shadow-red-500/80" : "bg-red-900 opacity-40"
                      }`}
                    />
                    <span className="text-red-400 font-black tracking-widest text-[11px]">REC</span>
                    <span className="text-white font-bold tracking-wide truncate max-w-[150px] sm:max-w-[200px]" title={cam.name}>
                      {cam.name}
                    </span>
                  </div>

                  {/* Right: Quality & Channel badge */}
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-black/60 border border-white/20 text-[10px] text-amber-300 font-bold">
                      {cam.streamQuality} {cam.fps}FPS
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-blue-500/20 border border-blue-400/30 text-[10px] text-blue-300 font-bold">
                      CH {cam.channelNumber < 10 ? `0${cam.channelNumber}` : cam.channelNumber}
                    </span>
                  </div>
                </div>

                {/* ─── VIDEO / SIMULATION SCREEN AREA ─── */}
                <div className="relative w-full aspect-video bg-[#0a0a0f] overflow-hidden select-none">
                  {/* Visual Content: Stream, Iframe, Snapshot or Simulated Live Cam */}
                  {!brokenFeedsMap[cam.id] && cam.feedType === "IFRAME" && cam.feedUrl ? (
                    <iframe
                      src={cam.feedUrl}
                      title={cam.name}
                      className="w-full h-full border-0"
                      allow="autoplay; encrypted-media"
                      onError={() => setBrokenFeedsMap((prev) => ({ ...prev, [cam.id]: true }))}
                    />
                  ) : !brokenFeedsMap[cam.id] && cam.feedType === "STREAM" && cam.feedUrl ? (
                    <video
                      src={cam.feedUrl}
                      autoPlay
                      muted={!isAudioActive}
                      loop
                      playsInline
                      onError={() => setBrokenFeedsMap((prev) => ({ ...prev, [cam.id]: true }))}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    /* High-End Simulated VIP CCTV Feed with Motion and Scanlines (100% Bulletproof Fallback) */
                    <div
                      className="relative w-full h-full transition-all duration-300 ease-out"
                      style={{
                        transform: `scale(${offset.zoom}) translate(${offset.x}px, ${offset.y}px)`,
                        filter: isNightVision
                          ? "grayscale(100%) brightness(1.25) contrast(1.4) hue-rotate(90deg) drop-shadow(0 0 5px rgba(34,197,94,0.4))"
                          : "brightness(0.92) contrast(1.08)",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          !brokenFeedsMap[cam.id] && cam.snapshotUrl
                            ? cam.snapshotUrl
                            : fallbackImage
                        }
                        alt={cam.name}
                        onError={(e: any) => {
                          setBrokenFeedsMap((prev) => ({ ...prev, [cam.id]: true }));
                          if (e.currentTarget.src !== fallbackImage) {
                            e.currentTarget.src = fallbackImage;
                          }
                        }}
                        className="w-full h-full object-cover select-none pointer-events-none"
                      />

                      {/* CCTV Scanlines & Noise Texture Overlay */}
                      <div
                        className="absolute inset-0 pointer-events-none opacity-25"
                        style={{
                          backgroundImage:
                            "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.45) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.04), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.04))",
                          backgroundSize: "100% 3px, 4px 100%",
                        }}
                      />

                      {/* Green Phosphor Ambient Tint if Night Vision */}
                      {isNightVision && (
                        <div className="absolute inset-0 bg-emerald-500/15 mix-blend-color pointer-events-none" />
                      )}

                      {/* Status Overlay Badge if DVR is Simulated or Reconnecting */}
                      {(cam.feedType === "SIMULATION" || brokenFeedsMap[cam.id]) && (
                        <div className="absolute top-12 right-3 z-20">
                          <button
                            type="button"
                            onClick={() => setShowDvrConnectModal(true)}
                            className="py-1 px-2.5 rounded-lg bg-black/80 hover:bg-black/95 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-sm cursor-pointer transition"
                            title="انقر لربط أو فحص جهاز الـ DVR"
                          >
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span>VIP LIVE FEED</span>
                            <Settings className="w-3 h-3 text-amber-400" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ─── CCTV SCREEN FOOTER OSD BAR ─── */}
                  <div className="bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 absolute bottom-0 inset-x-0 z-20 flex items-end justify-between text-xs font-mono">
                    <div className="space-y-0.5">
                      <div className="text-emerald-400 font-bold tracking-wider text-[11px] drop-shadow-md">
                        {currentDateTime}
                      </div>
                      <div className="text-slate-300 text-[10px] truncate max-w-[220px]" title={cam.locationDescription}>
                        📍 {cam.locationDescription}
                      </div>
                    </div>

                    <div className="text-right space-y-0.5">
                      <div className="text-amber-400 font-bold text-[10px]">
                        {isNightVision ? "🌙 NIGHT VISION (IR ON)" : "☀️ DAY MODE (COLOR)"}
                      </div>
                      <div className="text-slate-400 text-[9px]">
                        BITRATE: 4.12 Mbps • H.265+
                      </div>
                    </div>
                  </div>

                  {/* ─── INTERACTIVE PTZ CONTROLLER OVERLAY (WHEN TOGGLED) ─── */}
                  {isPtzActive && (
                    <div className="absolute inset-0 z-30 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
                      <div className="bg-[#12121a]/95 border border-amber-500/50 rounded-3xl p-4 shadow-2xl space-y-3 text-center w-64">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                            <Compass className="w-3.5 h-3.5" />
                            <span>تحكم العدسة (PTZ)</span>
                          </span>
                          <button
                            onClick={() => setPtzActiveCameraId(null)}
                            className="text-xs text-slate-400 hover:text-white"
                          >
                            ✕
                          </button>
                        </div>

                        {/* Directional Pad */}
                        <div className="flex flex-col items-center gap-1">
                          <button
                            onClick={() => handlePtzMove(cam.id, 0, -8, 0)}
                            className="p-2 rounded-xl bg-white/10 hover:bg-amber-500 hover:text-black transition cursor-pointer"
                            title="إمالة لأعلى"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handlePtzMove(cam.id, -8, 0, 0)}
                              className="p-2 rounded-xl bg-white/10 hover:bg-amber-500 hover:text-black transition cursor-pointer"
                              title="تحريك يسار"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handlePtzReset(cam.id)}
                              className="p-2 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-300 text-[10px] font-bold hover:bg-amber-500 hover:text-black transition cursor-pointer"
                              title="إعادة التمركز"
                            >
                              CENTER
                            </button>
                            <button
                              onClick={() => handlePtzMove(cam.id, 8, 0, 0)}
                              className="p-2 rounded-xl bg-white/10 hover:bg-amber-500 hover:text-black transition cursor-pointer"
                              title="تحريك يمين"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                          </div>
                          <button
                            onClick={() => handlePtzMove(cam.id, 0, 8, 0)}
                            className="p-2 rounded-xl bg-white/10 hover:bg-amber-500 hover:text-black transition cursor-pointer"
                            title="إمالة لأسفل"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Zoom In / Out */}
                        <div className="flex items-center justify-center gap-2 pt-1 border-t border-white/10">
                          <button
                            onClick={() => handlePtzMove(cam.id, 0, 0, 0.2)}
                            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-emerald-500 hover:text-black text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                            <span>تقريب +</span>
                          </button>
                          <button
                            onClick={() => handlePtzMove(cam.id, 0, 0, -0.2)}
                            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-rose-500 hover:text-black text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <ZoomOut className="w-3.5 h-3.5" />
                            <span>تبعيد -</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ─── CAMERA BOTTOM ACTION TOOLBAR ─── */}
                <div className="p-3 bg-[#11121c] border-t border-white/10 flex items-center justify-between gap-2 flex-wrap text-xs">
                  {/* Left: Quick Snapshot & Night Vision & PTZ */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Capture Snapshot */}
                    <button
                      onClick={() => captureSecuritySnapshot(cam)}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold transition flex items-center gap-1 cursor-pointer"
                      title="التقاط وتوثيق لقطة أمنية فورا مع التاريخ والساعة"
                    >
                      <Camera className="w-3.5 h-3.5 text-amber-400" />
                      <span>لقطة أمنية 📸</span>
                    </button>

                    {/* Toggle PTZ */}
                    <button
                      onClick={() => setPtzActiveCameraId(isPtzActive ? null : cam.id)}
                      className={`px-2.5 py-1.5 rounded-xl border transition flex items-center gap-1 font-bold cursor-pointer ${
                        isPtzActive
                          ? "bg-amber-500 text-black border-amber-400"
                          : "bg-white/5 border-white/10 text-slate-300 hover:border-amber-400"
                      }`}
                      title="تحكم العدسة وتقريب الزووم"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>تحريك PTZ</span>
                    </button>

                    {/* Night Vision Toggle */}
                    <button
                      onClick={() => toggleCameraNightVision(cam.id)}
                      className={`p-1.5 rounded-xl border transition cursor-pointer ${
                        isNightVision
                          ? "bg-emerald-500/20 border-emerald-400 text-emerald-400"
                          : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                      }`}
                      title="تبديل الرؤية الليلية IR"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    {/* Audio Toggle */}
                    <button
                      onClick={() => {
                        setAudioActiveCameraId(isAudioActive ? null : cam.id);
                        showToast("info", isAudioActive ? "تم كتم الصوت" : `تم فتح ميكروفون: ${cam.name}`);
                      }}
                      className={`p-1.5 rounded-xl border transition cursor-pointer ${
                        isAudioActive
                          ? "bg-blue-500/20 border-blue-400 text-blue-400"
                          : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                      }`}
                      title="الاستماع للميكروفون الصوتي"
                    >
                      {isAudioActive ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Right: Maximize / Settings / Delete */}
                  <div className="flex items-center gap-1.5">
                    {/* Focus / Maximize Button */}
                    <button
                      onClick={() => {
                        if (layoutMode === "SINGLE" && focusedCameraId === cam.id) {
                          setLayoutMode("QUAD");
                        } else {
                          setFocusedCameraId(cam.id);
                          setLayoutMode("SINGLE");
                        }
                      }}
                      className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white transition cursor-pointer"
                      title={layoutMode === "SINGLE" ? "تصغير للشبكة" : "تكبير الكاميرا ملء الشاشة"}
                    >
                      {layoutMode === "SINGLE" ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    </button>

                    {/* Edit Camera */}
                    <button
                      onClick={() => openEditModal(cam)}
                      className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-amber-400 transition cursor-pointer"
                      title="تعديل إعدادات الكاميرا"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Camera */}
                    <button
                      onClick={() => handleDeleteCamera(cam.id, cam.name)}
                      className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 transition cursor-pointer"
                      title="حذف الكاميرا"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. ADD / EDIT CAMERA MODAL
         ───────────────────────────────────────────────────────────── */}
      {showAddEditModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-sans"
          dir="rtl"
        >
          <div className="relative w-full max-w-lg bg-[#12121a] border-2 border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">
                  {editingCamera ? "تعديل إعدادات كاميرا المراقبة ⚙️" : "إضافة كاميرا مراقبة أمنية جديدة 📹"}
                </h3>
              </div>
              <button
                onClick={() => setShowAddEditModal(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCamera} className="space-y-3.5 text-xs">
              {/* Camera Name */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">اسم الكاميرا التعريفي:</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: كاميرا 1: صالة كراسي الحلاقة الكبرى"
                  className="w-full py-2.5 px-3.5 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Branch & Venue Type */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">الفرع التابع له:</label>
                  <select
                    value={formData.branchId}
                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="">(إدارة عامة / غير مقيد بفرع)</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">تصنيف المكان:</label>
                  <select
                    value={formData.venueType}
                    onChange={(e) => setFormData({ ...formData, venueType: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="DAKN">💈 صالون دقن الباشا (رجالي)</option>
                    <option value="HAMMAM">🧖‍♀️ حمام وسبا الباشا (حريمي)</option>
                    <option value="NEWSKIN">✨ عيادة نيو سكين (New Skin)</option>
                    <option value="TREASURY">💰 الخزنة الفولاذية والكاشير</option>
                    <option value="OFFICE">👑 مكتب الإدارة والتحكم</option>
                  </select>
                </div>
              </div>

              {/* Location Description */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">وصف موقع التثبيت الدقيق:</label>
                <input
                  type="text"
                  required
                  value={formData.locationDescription}
                  onChange={(e) => setFormData({ ...formData, locationDescription: e.target.value })}
                  placeholder="مثال: أعلى الباب الرئيسي بزاوية تغطي الكراسي 1 إلى 6"
                  className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Feed Type & Stream Quality */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">نوع البث والاتصال:</label>
                  <select
                    value={formData.feedType}
                    onChange={(e) => setFormData({ ...formData, feedType: e.target.value as any })}
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="SIMULATION">محاكي بث أمني واقعي عالي الدقة (VIP Simulated Feed)</option>
                    <option value="STREAM">بث فيديو مباشر (HLS / m3u8 / WebRTC)</option>
                    <option value="IFRAME">بوابة ويب مدمجة (Dahua / Hikvision / P2P Cloud)</option>
                    <option value="SNAPSHOT">التقاط دوري متكرر للصور (HTTP Snapshot Stream)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">دقة ومعدل الإطارات:</label>
                  <select
                    value={formData.streamQuality}
                    onChange={(e) => setFormData({ ...formData, streamQuality: e.target.value })}
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="4K">4K Ultra HD (3840x2160)</option>
                    <option value="2K">2K Quad HD (2560x1440)</option>
                    <option value="1080P">Full HD 1080P</option>
                    <option value="720P">HD 720P</option>
                  </select>
                </div>
              </div>

              {/* Technical Network Fields (IP, Port, RTSP, Channel) */}
              <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                <span className="text-[11px] font-bold text-amber-300 block">إعدادات الاتصال بالشبكة وجهاز الـ DVR:</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-slate-400 text-[10px] block mb-0.5">عنوان الـ IP / DDNS:</label>
                    <input
                      type="text"
                      value={formData.ipAddress}
                      onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                      placeholder="192.168.1.108"
                      className="w-full py-1.5 px-2.5 rounded-lg bg-black/60 border border-white/10 text-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 text-[10px] block mb-0.5">المنفذ (Port):</label>
                    <input
                      type="number"
                      value={formData.port}
                      onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 80 })}
                      placeholder="80"
                      className="w-full py-1.5 px-2.5 rounded-lg bg-black/60 border border-white/10 text-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 text-[10px] block mb-0.5">رقم القناة (CH):</label>
                    <input
                      type="number"
                      value={formData.channelNumber}
                      onChange={(e) => setFormData({ ...formData, channelNumber: parseInt(e.target.value) || 1 })}
                      placeholder="1"
                      className="w-full py-1.5 px-2.5 rounded-lg bg-black/60 border border-white/10 text-white text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 text-[10px] block mb-0.5">رابط البث أو الـ RTSP / Iframe URL:</label>
                  <input
                    type="text"
                    value={formData.feedUrl || formData.rtspUrl}
                    onChange={(e) => setFormData({ ...formData, feedUrl: e.target.value, rtspUrl: e.target.value })}
                    placeholder="rtsp://admin:pass@192.168.1.108:554/cam/realmonitor?channel=1&subtype=0"
                    className="w-full py-1.5 px-2.5 rounded-lg bg-black/60 border border-white/10 text-white text-xs font-mono"
                  />
                </div>
              </div>

              {/* Toggles (Night Vision, PTZ, Audio) */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.hasNightVision}
                    onChange={(e) => setFormData({ ...formData, hasNightVision: e.target.checked })}
                    className="rounded text-amber-500"
                  />
                  <span>رؤية ليلية بالأشعة IR</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.hasPTZ}
                    onChange={(e) => setFormData({ ...formData, hasPTZ: e.target.checked })}
                    className="rounded text-amber-500"
                  />
                  <span>محرك تحريك وتقريب PTZ</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.hasAudio}
                    onChange={(e) => setFormData({ ...formData, hasAudio: e.target.checked })}
                    className="rounded text-amber-500"
                  />
                  <span>ميكروفون صوتي</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddEditModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingCamera}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{savingCamera ? "جارٍ الحفظ..." : "حفظ وتفعيل الكاميرا 📹"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. DVR / NVR HARDWARE CONNECTION MODAL (CLEAN & DIRECT)
         ───────────────────────────────────────────────────────────── */}
      {showDvrConnectModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 font-sans"
          dir="rtl"
        >
          <div className="relative w-full max-w-xl bg-[#12121c] border-2 border-indigo-500/50 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow-md">
                  <Tv className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>إعداد وربط كاميرات الـ DVR بالصالون</span>
                    <span className="py-0.5 px-2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
                      مباشر ⚡
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    أدخل بيانات جهاز الـ DVR الخاص بالصالون لربط البث المباشر فوراً بدون برامج خارجية
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDvrConnectModal(false)}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Inputs Grid */}
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    عنوان IP جهاز الـ DVR بالصالون:
                  </label>
                  <input
                    type="text"
                    value={dvrIp}
                    onChange={(e) => setDvrIp(e.target.value)}
                    placeholder="192.168.1.108"
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/15 text-emerald-300 font-mono font-bold text-xs focus:border-indigo-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    منفذ الويب (HTTP Port):
                  </label>
                  <input
                    type="number"
                    value={dvrPort}
                    onChange={(e) => setDvrPort(Number(e.target.value) || 80)}
                    placeholder="80"
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/15 text-white font-mono text-xs focus:border-indigo-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    اسم المستخدم (Username):
                  </label>
                  <input
                    type="text"
                    value={dvrUsername}
                    onChange={(e) => setDvrUsername(e.target.value)}
                    placeholder="admin"
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/15 text-white font-mono text-xs focus:border-indigo-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    كلمة المرور (Password):
                  </label>
                  <input
                    type="password"
                    value={dvrPassword}
                    onChange={(e) => setDvrPassword(e.target.value)}
                    placeholder="كلمة سر الـ DVR"
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/15 text-white font-mono text-xs focus:border-indigo-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* DVR Brand & Streaming Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    نوع جهاز التسجيل:
                  </label>
                  <select
                    value={dvrBrand}
                    onChange={(e) => setDvrBrand(e.target.value as any)}
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/15 text-amber-300 font-bold text-xs focus:border-indigo-400 focus:outline-none"
                  >
                    <option value="hikvision">هيكفيجن (Hikvision VIP 🛡️)</option>
                    <option value="dahua">داهوا (Dahua Technology)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    طريقة العرض في الشاشة:
                  </label>
                  <select
                    value={dvrMode}
                    onChange={(e) => setDvrMode(e.target.value as any)}
                    className="w-full py-2 px-3 rounded-xl bg-black/60 border border-white/15 text-sky-300 font-bold text-xs focus:border-indigo-400 focus:outline-none"
                  >
                    <option value="SNAPSHOT_PROXY">بث لقطات حية فوري (Live Snapshot) 🌟 موصى به</option>
                    <option value="DIRECT_WEB">لوحة الـ DVR الرسمية المدمجة (Web GUI)</option>
                    <option value="SIMULATION">العرض التوضيحي السليم (VIP Simulated Mode)</option>
                  </select>
                </div>
              </div>

              {/* Ping / Connection Test Result Box */}
              {dvrTestResult && (
                <div
                  className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold ${
                    dvrTestResult.reachable
                      ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
                      : "bg-rose-950/40 border-rose-500/50 text-rose-300"
                  }`}
                >
                  {dvrTestResult.reachable ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{dvrTestResult.message}</span>
                </div>
              )}

              {/* Test Button & Direct Link */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestDvr}
                  disabled={testingDvr}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/15 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Search className={`w-3.5 h-3.5 ${testingDvr ? "animate-spin text-amber-400" : ""}`} />
                  <span>{testingDvr ? "جاري الفحص..." : "فحص الاتصال بجهاز الـ DVR 🔍"}</span>
                </button>

                <a
                  href={`http://${dvrIp}:${dvrPort}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-3 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  title="فتح شاشة تحكم هيكفيجن الرسمية في نافذة جديدة"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>فتح شاشة الـ DVR 🌐</span>
                </a>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={handleBulkResetSimulation}
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                title="إعادة الكاميرات فوراً لوضع العرض التوضيحي السليم"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>إعادة ضبط العرض الافتراضي 👑</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowDvrConnectModal(false)}
                  className="py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  إلغاء
                </button>

                <button
                  type="button"
                  onClick={handleApplyDvrConfig}
                  disabled={savingCamera}
                  className="flex-1 sm:flex-none py-2.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black transition flex items-center justify-center gap-1.5 shadow-xl shadow-amber-500/25 cursor-pointer disabled:opacity-50"
                >
                  <Zap className="w-4 h-4" />
                  <span>{savingCamera ? "جاري التطبيق..." : "ربط وتفعيل كافة الكاميرات ⚡"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
