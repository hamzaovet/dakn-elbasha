"use client";

import React, { useState, useEffect } from "react";
import {
  Printer,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Trash2,
  Download,
  Wrench,
  FileText,
  Zap,
  Check,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Layers,
  HelpCircle,
  X,
  Play,
  RotateCw,
} from "lucide-react";

interface PrinterDiagnosticsToolProps {
  onClose?: () => void;
  isModal?: boolean;
  defaultBranch?: string;
}

export default function PrinterDiagnosticsTool({
  onClose,
  isModal = false,
  defaultBranch = "DAKN",
}: PrinterDiagnosticsToolProps) {
  // Tabs
  const [activeTab, setActiveTab] = useState<
    "printers" | "drivers" | "troubleshoot" | "testprint"
  >("printers");

  // State
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [diagData, setDiagData] = useState<any>(null);
  const [driverCatalog, setDriverCatalog] = useState<any[]>([]);
  const [selectedBranchForReceipt, setSelectedBranchForReceipt] = useState<string>(defaultBranch);
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  const showToast = (type: "success" | "error" | "info", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Fetch Live Diagnostics
  const fetchDiagnostics = async () => {
    setLoading(true);
    try {
      // 1. Try relative endpoint
      let res = await fetch("/api/printer/diagnose", { cache: "no-store" });

      // 2. If on cloud and not localhost, try local companion server if reachable
      if (
        typeof window !== "undefined" &&
        window.location.hostname !== "localhost" &&
        window.location.hostname !== "127.0.0.1"
      ) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1800);
          const localRes = await fetch("http://localhost:3098/api/printer/diagnose", {
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          if (localRes.ok) {
            res = localRes;
          }
        } catch {}
      }

      const data = await res.json();
      if (data.success) {
        setDiagData(data);
      } else {
        showToast("error", data.error || "تعذر قراءة بيانات الطابعات");
      }
    } catch (err: any) {
      showToast("error", "فشل الاتصال بخدمة فحص الطابعات");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Drivers Catalog
  const fetchDrivers = async () => {
    try {
      const res = await fetch("/api/printer/driver");
      const data = await res.json();
      if (data.success && data.catalog) {
        setDriverCatalog(data.catalog);
      }
    } catch {}
  };

  useEffect(() => {
    fetchDiagnostics();
    fetchDrivers();
  }, []);

  // Post Actions (Restart Spooler, Clear Queue, Set Default, Windows Test Page)
  const handleAction = async (action: string, printerName?: string) => {
    setActionLoading(action + (printerName ? `_${printerName}` : ""));
    try {
      let endpoint = "/api/printer/diagnose";
      // If we got diagnostic from localhost companion, use it
      if (
        typeof window !== "undefined" &&
        window.location.hostname !== "localhost" &&
        diagData &&
        !diagData.isCloud
      ) {
        endpoint = "http://localhost:3098/api/printer/diagnose";
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, printerName }),
      });

      const data = await res.json();
      if (data.success) {
        showToast("success", data.message || "تم تنفيذ الإجراء بنجاح");
        await fetchDiagnostics();
      } else {
        showToast("error", data.error || "فشل تنفيذ الإجراء");
      }
    } catch {
      showToast("error", "تعذر إرسال الأمر لمحرك الطباعة");
    } finally {
      setActionLoading(null);
    }
  };

  // Trigger Royal 80mm Thermal Receipt Test Page via Browser
  const executeThermalTestReceipt = () => {
    const isMen = selectedBranchForReceipt === "DAKN";
    const isWomen = selectedBranchForReceipt === "HAMMAM";
    const isClinic = selectedBranchForReceipt === "NEWSKIN";

    const title = isMen
      ? "صالون دقن الباشا الملكي VIP"
      : isWomen
      ? "حمام الباشا الملكي وسبا VIP"
      : "عيادات نيو سكين VIP";

    const subtitle = isMen
      ? "DAKN EL BASHA - THERMAL PRINTER TEST"
      : isWomen
      ? "HAMMAM EL BASHA - THERMAL PRINTER TEST"
      : "NEW SKIN CLINIC - THERMAL PRINTER TEST";

    const logo = isMen
      ? "/dakn-logo.jpg"
      : isWomen
      ? "/hammam-logo.jpg"
      : "/newskin-logo.jpg";

    const printWin = window.open("", "_blank", "width=420,height=650");
    if (!printWin) {
      window.print();
      return;
    }

    const testTime = new Date().toLocaleString("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    printWin.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8" />
          <title>اختبار طابعة إيصالات 80mm — مجموعة الباشا VIP</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              width: 72mm;
              margin: 0 auto;
              padding: 4mm 2mm 10mm 2mm;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              color: #000;
              background: #fff;
              font-size: 11px;
              line-height: 1.35;
              text-align: center;
              box-sizing: border-box;
            }
            .header-logo {
              width: 48px;
              height: 48px;
              object-fit: cover;
              border-radius: 50%;
              border: 1px solid #000;
              margin-bottom: 4px;
            }
            .title {
              font-size: 13px;
              font-weight: 900;
              margin: 2px 0;
            }
            .subtitle {
              font-size: 9px;
              font-family: monospace;
              letter-spacing: 0.5px;
              margin-bottom: 6px;
            }
            .divider {
              border-top: 1px dashed #000;
              margin: 6px 0;
            }
            .double-divider {
              border-top: 2px solid #000;
              margin: 6px 0;
            }
            .badge {
              display: inline-block;
              padding: 2px 6px;
              border: 1px solid #000;
              border-radius: 4px;
              font-weight: bold;
              font-size: 10px;
              margin: 4px 0;
            }
            .meta-table {
              width: 100%;
              font-size: 10px;
              margin: 4px 0;
              border-collapse: collapse;
            }
            .meta-table td {
              padding: 2px 0;
              text-align: right;
            }
            .meta-table td.val {
              text-align: left;
              font-family: monospace;
              font-weight: bold;
            }
            .test-grid {
              border: 1px solid #000;
              margin: 6px 0;
              padding: 4px;
              font-size: 9px;
              text-align: center;
            }
            .qr-mock {
              margin: 8px auto;
              width: 80px;
              height: 80px;
              border: 2px solid #000;
              display: flex;
              align-items: center;
              justify-content: center;
              font-family: monospace;
              font-size: 9px;
              font-weight: bold;
            }
            .footer {
              font-size: 9px;
              font-weight: bold;
              margin-top: 8px;
            }
            .cut-line {
              margin-top: 12px;
              border-top: 1px dotted #888;
              padding-top: 4px;
              font-size: 8px;
              color: #555;
            }
          </style>
        </head>
        <body>
          <img src="${logo}" class="header-logo" alt="Logo" />
          <div class="title">${title}</div>
          <div class="subtitle">${subtitle}</div>
          <div class="badge">اختبار توافق طابعة الفواتير (80mm) ✅</div>
          
          <div class="divider"></div>
          
          <table class="meta-table">
            <tr>
              <td>تاريخ ووقت الاختبار:</td>
              <td class="val">${testTime}</td>
            </tr>
            <tr>
              <td>عرض بكرة الورق:</td>
              <td class="val">80mm (Thermal Roll)</td>
            </tr>
            <tr>
              <td>حالة السائق والاتصال:</td>
              <td class="val">متصل ومفعل 100%</td>
            </tr>
            <tr>
              <td>الخط الساخن للمجموعة:</td>
              <td class="val">01121537537</td>
            </tr>
          </table>

          <div class="double-divider"></div>

          <div class="test-grid">
            <strong>اختبار وضوح النصوص والأبعاد الحرارية</strong><br/>
            الأبجدية العربية: أ ب ت ث ج ح خ د ذ ر ز س ش ص ض<br/>
            English Alphabet: ABCDEFGHIJKLMNOPQRSTUVWXYZ<br/>
            Numbers: 0123456789 - EGP 999.00
          </div>

          <div class="qr-mock">
            [ QR CODE ]<br/>
            DAKN VIP
          </div>

          <div class="divider"></div>
          <div class="footer">
            منظومة إدارة صالونات وسبا وعيادات الباشا VIP 👑<br/>
            طابعة الفواتير تعمل بأعلى كفاءة وجاهزة للخدمة
          </div>

          <div class="cut-line">
            - - - - - - - - - - [ خط قص الورقة التلقائي ] - - - - - - - - - -
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

  const isWindows = diagData && diagData.platform === "win32";
  const health = diagData?.health || { score: 100, status: "EXCELLENT", issues: [], tips: [] };

  return (
    <div
      className={`font-sans text-xs text-slate-200 select-none ${
        isModal
          ? "fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5"
          : "space-y-6"
      }`}
      dir="rtl"
    >
      <div
        className={`relative w-full ${
          isModal ? "max-w-5xl bg-[#101018] border border-amber-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl" : ""
        } space-y-6`}
      >
        {/* Toast Alert */}
        {toastMessage && (
          <div
            className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 font-bold text-xs transition-all border animate-bounce ${
              toastMessage.type === "success"
                ? "bg-emerald-950/95 text-emerald-300 border-emerald-500/50"
                : toastMessage.type === "error"
                ? "bg-rose-950/95 text-rose-300 border-rose-500/50"
                : "bg-sky-950/95 text-sky-300 border-sky-500/50"
            }`}
          >
            {toastMessage.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {toastMessage.type === "error" && <AlertTriangle className="w-4 h-4 text-rose-400" />}
            {toastMessage.type === "info" && <HelpCircle className="w-4 h-4 text-sky-400" />}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* 1. HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-[#141420] border border-amber-500/30 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">
                  مركز الفحص الذكي وإدارة طابعات الفواتير والـ POS 🖨️
                </h3>
                <span className="py-0.5 px-2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono border border-amber-500/30">
                  REAL HARDWARE SUITE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                فحص فوري لهاردوير الويندوز، فك تعليق طابور الأوامر، إعادة تشغيل Spooler، وتنزيل تعريفات Xprinter المعتمدة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={fetchDiagnostics}
              disabled={loading}
              className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition flex items-center gap-1.5 border border-white/10 text-xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
              <span>إعادة فحص الطابعات ⚡</span>
            </button>

            {isModal && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 flex items-center justify-center transition border border-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 2. LIVE HEALTH & OVERVIEW BANNER */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Health Card */}
          <div
            className={`p-4 rounded-2xl border flex flex-col justify-between ${
              health.status === "EXCELLENT"
                ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-300"
                : health.status === "WARNING"
                ? "bg-amber-950/20 border-amber-500/40 text-amber-300"
                : "bg-rose-950/20 border-rose-500/40 text-rose-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300">مؤشر كفاءة الطباعة:</span>
              <span className="text-xs font-black font-mono px-2 py-0.5 rounded-full bg-black/40">
                {health.score}%
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2 font-black text-sm text-white">
              {health.status === "EXCELLENT" && (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>جاهزة لطباعة الفواتير 🟢</span>
                </>
              )}
              {health.status === "WARNING" && (
                <>
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <span>تنبيه يحتاج فحص 🟡</span>
                </>
              )}
              {health.status === "CRITICAL" && (
                <>
                  <AlertCircle className="w-5 h-5 text-rose-400" />
                  <span>عطل في محرك الطباعة 🔴</span>
                </>
              )}
            </div>
          </div>

          {/* Spooler Service Card */}
          <div className="p-4 rounded-2xl bg-[#141420] border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400">خدمة Print Spooler:</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  diagData?.spooler?.isHealthy
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                }`}
              >
                {diagData?.spooler?.status || "Unknown"}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">محرك الويندوز</span>
              {isWindows && (
                <button
                  type="button"
                  onClick={() => handleAction("RESTART_SPOOLER")}
                  disabled={actionLoading === "RESTART_SPOOLER"}
                  className="py-1 px-2.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <RotateCw
                    className={`w-3 h-3 ${actionLoading === "RESTART_SPOOLER" ? "animate-spin" : ""}`}
                  />
                  <span>إعادة تشغيل 🔄</span>
                </button>
              )}
            </div>
          </div>

          {/* Stuck Queue Card */}
          <div className="p-4 rounded-2xl bg-[#141420] border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400">طابور الأوامر المعلقة:</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  (diagData?.stuckFilesCount || 0) === 0
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse"
                }`}
              >
                {diagData?.stuckFilesCount || 0} مهام عالقة
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">تنظيف المنافذ</span>
              {isWindows && (
                <button
                  type="button"
                  onClick={() => handleAction("CLEAR_QUEUE")}
                  disabled={actionLoading === "CLEAR_QUEUE"}
                  className="py-1 px-2.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Trash2
                    className={`w-3 h-3 ${actionLoading === "CLEAR_QUEUE" ? "animate-spin" : ""}`}
                  />
                  <span>تفريغ الطابور 🗑️</span>
                </button>
              )}
            </div>
          </div>

          {/* Default Printer Card */}
          <div className="p-4 rounded-2xl bg-[#141420] border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400">الطابعة الافتراضية:</span>
              <span className="text-[10px] font-bold text-amber-400">Default ⭐</span>
            </div>
            <div className="mt-2 truncate font-bold text-white text-xs">
              {diagData?.defaultPrinter?.name || "لم يتم تعيين طابعة"}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              المنفذ: {diagData?.defaultPrinter?.portName || "N/A"}
            </div>
          </div>
        </div>

        {/* Cloud Notice if running on Vercel */}
        {diagData?.isCloud && (
          <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-200 text-xs flex items-center gap-2.5">
            <HelpCircle className="w-5 h-5 text-sky-400 shrink-0" />
            <div>
              <strong>ملاحظة التشغيل السحابي:</strong> المنظومة تعمل حالياً عبر خادم السحابة. يمكنك استخدام اختبار الطباعة الحرارية 80mm المباشر وتنزيل التعريفات، أو إذا كان هذا جهاز الكاشير افتح النظام محلياً على{" "}
              <a
                href="http://localhost:3098/admin"
                target="_blank"
                rel="noreferrer"
                className="underline font-bold text-amber-400"
              >
                http://localhost:3098
              </a>{" "}
              لإدارة وتفريغ منافذ الويندوز الفعلية.
            </div>
          </div>
        )}

        {/* 3. TABS NAVIGATION */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("printers")}
            className={`py-2 px-4 rounded-xl font-bold text-xs transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "printers"
                ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
                : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/5"
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>الطابعات المثبتة والتشخيص المباشر 🖨️</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("drivers")}
            className={`py-2 px-4 rounded-xl font-bold text-xs transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "drivers"
                ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
                : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/5"
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>مركز تنزيل وتثبيت التعريفات 📥</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("testprint")}
            className={`py-2 px-4 rounded-xl font-bold text-xs transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "testprint"
                ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
                : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/5"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>اختبار بون حراري 80mm فوري 🧾</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("troubleshoot")}
            className={`py-2 px-4 rounded-xl font-bold text-xs transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "troubleshoot"
                ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
                : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/5"
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>حل المشاكل ومعايرة الحساس (FEED) 🛠️</span>
          </button>
        </div>

        {/* 4. TAB CONTENT */}

        {/* TAB 1: INSTALLED PRINTERS */}
        {activeTab === "printers" && (
          <div className="space-y-4">
            {loading ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
                <span className="font-bold">جاري فحص منافذ وطابعات الويندوز الفعلية...</span>
              </div>
            ) : diagData?.printers && diagData.printers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {diagData.printers.map((p: any, idx: number) => {
                  const isActionActive = actionLoading?.includes(p.name);
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl bg-[#141420] border transition-all flex flex-col justify-between ${
                        p.isDefault
                          ? "border-amber-500/60 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40"
                          : "border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Printer
                              className={`w-5 h-5 ${p.isThermal ? "text-amber-400" : "text-slate-400"}`}
                            />
                            <h4 className="font-black text-white text-xs truncate max-w-[180px]">
                              {p.name}
                            </h4>
                          </div>

                          <div className="flex items-center gap-1">
                            {p.isDefault && (
                              <span className="py-0.5 px-2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                                افتراضية ⭐
                              </span>
                            )}
                            {p.isThermal && (
                              <span className="py-0.5 px-2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                                حرارية 80mm
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1 text-[11px] text-slate-400 pt-1">
                          <div className="flex items-center justify-between">
                            <span>المنفذ (Port):</span>
                            <span className="font-mono text-slate-200 font-bold">{p.portName}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>التعريف (Driver):</span>
                            <span className="font-mono text-slate-300 truncate max-w-[150px]">
                              {p.driverName}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>حالة الاتصال:</span>
                            <span
                              className={`font-bold ${
                                p.isOffline ? "text-rose-400" : "text-emerald-400"
                              }`}
                            >
                              {p.statusText} {p.isOffline ? "🔴" : "🟢"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="pt-3 border-t border-white/5 mt-3 grid grid-cols-2 gap-2">
                        {!p.isDefault && isWindows && (
                          <button
                            type="button"
                            onClick={() => handleAction("SET_DEFAULT", p.name)}
                            disabled={isActionActive}
                            className="py-1.5 px-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>تعيين كافتراضية</span>
                          </button>
                        )}

                        {isWindows && (
                          <button
                            type="button"
                            onClick={() => handleAction("WINDOWS_TEST_PAGE", p.name)}
                            disabled={isActionActive}
                            className="py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <Play className="w-3 h-3 text-amber-400" />
                            <span>صفحة ويندوز 📄</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={executeThermalTestReceipt}
                          className="col-span-2 py-1.5 px-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-[11px] transition flex items-center justify-center gap-1 cursor-pointer shadow-md shadow-amber-500/20"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>طباعة بون تجريبي حراري 80mm 🧾</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl bg-[#141420] border border-amber-500/30 space-y-3">
                <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
                <h4 className="font-black text-white text-sm">
                  لم يتم اكتشاف أي طابعة حرارية مثبتة على هذا الجهاز!
                </h4>
                <p className="text-slate-400 text-xs max-w-md mx-auto">
                  تأكد من توصيل كابل USB الخاص بالطابعة وتشغيل مفتاح الطاقة، ثم انتقل لتبويب (مركز تنزيل وتثبيت التعريفات) لتحميل وتثبيت تعريف Xprinter المعتمد في 30 ثانية.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("drivers")}
                  className="py-2 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  <Download className="w-4 h-4" />
                  <span>الانتقال لمركز تنزيل التعريفات 📥</span>
                </button>
              </div>
            )}

            {/* Diagnostic Tips & Warnings */}
            {health.issues && health.issues.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-950/25 border border-amber-500/30 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-300 text-xs">
                  <AlertCircle className="w-4 h-4" />
                  <span>تنبيهات الفاحص الذكي:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-300 text-xs pr-1">
                  {health.issues.map((iss: string, i: number) => (
                    <li key={i}>{iss}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DRIVER INSTALLATION HUB */}
        {activeTab === "drivers" && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <div>
                <h4 className="font-black text-white text-sm">
                  حزم التعريفات الرسمية المعتمدة لطابعات الباشا VIP 📥
                </h4>
                <p className="text-slate-300 text-xs mt-0.5">
                  جميع التعريفات مفحوصة ومتوافقة مع Windows 7, 8, 10, 11 (32 و 64 بت) وتدعم مقاسات 80 مم و 58 مم وقص الورق التلقائي
                </p>
              </div>
              <span className="text-2xl">📦</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {driverCatalog.map((driver) => (
                <div
                  key={driver.id}
                  className="p-5 rounded-2xl bg-[#141420] border border-white/10 hover:border-amber-500/40 transition space-y-3.5 flex flex-col justify-between shadow-xl"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-black text-amber-400 text-sm">{driver.name}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span>الإصدار: {driver.version}</span>
                          <span>•</span>
                          <span>المطور: {driver.vendor}</span>
                        </div>
                      </div>
                      <span className="py-0.5 px-2 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono">
                        {driver.compatibility}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300">{driver.recommendedFor}</p>

                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold block">
                        الموديلات المدعومة:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {driver.supportedModels?.map((m: string, i: number) => (
                          <span
                            key={i}
                            className="py-0.5 px-2 rounded bg-amber-500/10 text-amber-300 text-[10px] font-mono"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Step-by-step installation checklist */}
                    <div className="space-y-1 text-[11px] text-slate-300 pt-1">
                      <span className="text-amber-400 font-bold block text-[11px]">
                        طريقة التثبيت السريعة:
                      </span>
                      <ol className="list-decimal list-inside space-y-0.5 text-slate-400 text-[10px]">
                        {driver.instructions?.map((step: string, sIdx: number) => (
                          <li key={sIdx}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center gap-2">
                    <a
                      href={driver.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20"
                    >
                      <Download className="w-4 h-4" />
                      <span>تحميل التعريف المعتمد (سريع) 📥</span>
                    </a>
                    {driver.fallbackUrl && (
                      <a
                        href={driver.fallbackUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="رابط بديل"
                        className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center justify-center border border-white/10"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: DIRECT THERMAL TEST RECEIPT */}
        {activeTab === "testprint" && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-[#141420] border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h4 className="font-black text-white text-sm flex items-center gap-2">
                  <span>أداة اختبار بون الحساب الحراري (80mm)</span>
                  <span className="py-0.5 px-2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                    معاينة حية
                  </span>
                </h4>
                <p className="text-slate-400 text-xs mt-0.5">
                  تختبر هذه الأداة خروج الورقة بدقة، سلامة الخطوط العربية والإنجليزية، مقاس البكرة (80 مم)، وقص الورق التلقائي
                </p>
              </div>

              {/* Branch Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300">الفرع المعتمد:</span>
                <select
                  value={selectedBranchForReceipt}
                  onChange={(e) => setSelectedBranchForReceipt(e.target.value)}
                  className="py-1.5 px-3 rounded-xl bg-black/60 border border-white/20 text-amber-300 font-bold text-xs focus:border-amber-400"
                >
                  <option value="DAKN">دقن الباشا (رجالي 💈)</option>
                  <option value="HAMMAM">حمام الباشا (حريمي وسبا 🌸)</option>
                  <option value="NEWSKIN">نيو سكين (عيادات VIP ✨)</option>
                </select>
              </div>
            </div>

            {/* Receipt Preview Box */}
            <div className="p-6 rounded-2xl bg-black/60 border border-white/10 flex flex-col items-center justify-center">
              <div className="w-[300px] bg-white text-black p-5 rounded shadow-2xl font-mono text-[11px] leading-snug text-center space-y-2 select-text">
                <div className="font-black text-sm">
                  {selectedBranchForReceipt === "DAKN"
                    ? "صالون دقن الباشا الملكي VIP"
                    : selectedBranchForReceipt === "HAMMAM"
                    ? "حمام الباشا الملكي وسبا VIP"
                    : "عيادات نيو سكين VIP"}
                </div>
                <div className="text-[9px] text-gray-600">
                  {selectedBranchForReceipt === "DAKN"
                    ? "DAKN EL BASHA - THERMAL 80MM"
                    : selectedBranchForReceipt === "HAMMAM"
                    ? "HAMMAM EL BASHA - THERMAL 80MM"
                    : "NEW SKIN CLINIC - THERMAL 80MM"}
                </div>
                <div className="border-t border-dashed border-black my-2"></div>
                <div className="text-[10px] text-right space-y-1">
                  <div>التاريخ: {new Date().toLocaleDateString("ar-EG")}</div>
                  <div>الكاشير: أ / كاشير الفرع</div>
                  <div>المنفذ: USB001 Thermal High-Speed</div>
                </div>
                <div className="border-t border-black my-2"></div>
                <div className="py-1 font-bold text-xs bg-gray-100 rounded">
                  ✅ اختبار طباعة ناجح 100%
                </div>
                <div className="text-[9px] text-gray-500 pt-2">
                  - - - - - - [ خط القص التلقائي ] - - - - - -
                </div>
              </div>

              <button
                type="button"
                onClick={executeThermalTestReceipt}
                className="mt-6 py-3 px-8 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition flex items-center gap-2 shadow-xl shadow-amber-500/25 cursor-pointer"
              >
                <Zap className="w-5 h-5" />
                <span>إرسال أمر الطباعة التجريبية للطابعة الآن 🖨️✨</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: TROUBLESHOOTING & HARDWARE CALIBRATION */}
        {activeTab === "troubleshoot" && (
          <div className="space-y-4">
            {/* Red LED / Gap Sensor */}
            <div className="p-5 rounded-2xl bg-[#141420] border border-rose-500/30 space-y-3">
              <div className="flex items-center gap-2 text-rose-400 font-black text-sm">
                <AlertTriangle className="w-5 h-5" />
                <h4>حل مشكلة اللمبة الحمراء وتخطي الورق (معايرة زر FEED في 10 ثوانٍ)</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                إذا كانت الطابعة تخرج ورقاً أبيض بدون توقف أو تضيء لمبة حمراء (Red Error LED)، فهذا يعني أن حساس أبعاد الورق يحتاج لمعايرة ذاتية بسيطة:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-black flex items-center justify-center">
                    1
                  </span>
                  <strong className="block text-white text-[11px]">إيقاف الطاقة</strong>
                  <span className="text-[10px] text-slate-400">أغلق مفتاح الكهرباء الخلفي (Power OFF)</span>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-black flex items-center justify-center">
                    2
                  </span>
                  <strong className="block text-white text-[11px]">ضغط مستمر</strong>
                  <span className="text-[10px] text-slate-400">اضغط بإصبعك واستمر بالضغط على زر (FEED)</span>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-black flex items-center justify-center">
                    3
                  </span>
                  <strong className="block text-white text-[11px]">تشغيل الطاقة</strong>
                  <span className="text-[10px] text-slate-400">شغل المفتاح الخلفي وأنت ضاغط على FEED</span>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-black flex items-center justify-center">
                    4
                  </span>
                  <strong className="block text-white text-[11px]">سماع الصفارتين</strong>
                  <span className="text-[10px] text-slate-400">انتظر سماع صوت (Beep ... Beep)</span>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-black flex items-center justify-center">
                    5
                  </span>
                  <strong className="block text-white text-[11px]">ارفع إصبعك فوراً</strong>
                  <span className="text-[10px] text-slate-400">ستسحب الطابعة استيكراً وتضيء اللمبة بالأزرق الثابت!</span>
                </div>
              </div>
            </div>

            {/* Faded Print */}
            <div className="p-5 rounded-2xl bg-[#141420] border border-amber-500/30 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-black text-sm">
                <Wrench className="w-4 h-4" />
                <h4>الطباعة باهتة أو غير واضحة (Faded Thermal Print)</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                1. نظف رأس الطباعة الحراري بقطعة قطن مبللة بكحول إيزوبروبيل 99% لإزالة بقايا الشمع والغبار.<br/>
                2. من لوحة التحكم في الويندوز (Devices and Printers) اضغط كليك يمين على الطابعة واختر (Printing Preferences) ثم اضغط على تبويب (Options) وارفع درجة الكثافة (Darkness) إلى 10 أو 12.
              </p>
            </div>

            {/* Cash Drawer */}
            <div className="p-5 rounded-2xl bg-[#141420] border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-slate-200 font-black text-sm">
                <Zap className="w-4 h-4 text-amber-400" />
                <h4>درج النقدية (الكاشير) لا يفتح تلقائياً مع الفاتورة</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                تأكد من توصيل كابل RJ11 (سلك التليفون) الخارج من الدرج في مخرج (Drawer/DK) خلف طابعة الفواتير. في خصائص الطابعة (Printer Properties ➔ Device Settings) فعل خيار (Cash Drawer ➔ Open Before Printing).
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
