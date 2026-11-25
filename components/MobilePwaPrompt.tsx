"use client";

import React, { useEffect, useState } from "react";
import {
  Smartphone,
  Download,
  Share2,
  PlusSquare,
  X,
  Sparkles,
  CheckCircle2,
  Compass,
  Copy,
  Check,
  ArrowDown,
  Info,
} from "lucide-react";

export default function MobilePwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [isAndroid, setIsAndroid] = useState<boolean>(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState<boolean>(false);
  const [showPrompt, setShowPrompt] = useState<boolean>(false);
  const [installedSuccess, setInstalledSuccess] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Register Service Worker for PWA compliance
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          console.log("[Basha PWA] SW registered on scope:", reg.scope);
        })
        .catch((err) => console.warn("[Basha PWA] SW registration failed:", err));
    }

    // 2. Check if already installed & running in standalone app mode
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      (typeof document !== "undefined" && document.referrer.includes("android-app://"));

    setIsStandalone(standalone);

    // 3. Platform & Browser detection (Robust iOS & In-App checks)
    const ua = window.navigator.userAgent.toLowerCase();
    const isApple =
      /iphone|ipad|ipod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isDroid = /android/.test(ua);
    const inApp =
      /fban|fbav|instagram|threads|whatsapp|tiktok|snapchat|line|micromessenger|crios|fxios/.test(ua) ||
      (!window.navigator.userAgent.includes("Safari") && isApple);

    setIsIos(isApple);
    setIsAndroid(isDroid);
    setIsInAppBrowser(inApp);

    // 4. Check if user arrived via QR Code scan (?source=basha_app_install)
    const urlParams = new URLSearchParams(window.location.search);
    const isFromQr =
      urlParams.get("source") === "basha_app_install" ||
      urlParams.get("source") === "pwa" ||
      urlParams.get("source") === "qr" ||
      urlParams.get("install") === "true";

    // 5. Capture Android Chrome beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (isFromQr && !standalone) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // 6. Native App Installed event
    window.addEventListener("appinstalled", () => {
      setInstalledSuccess(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      setTimeout(() => setInstalledSuccess(false), 8000);
    });

    // 7. Explicit UI Trigger (clicking "تثبيت التطبيق 📱" anywhere)
    const handleCustomTrigger = () => {
      if (standalone) {
        setInstalledSuccess(true);
        setTimeout(() => setInstalledSuccess(false), 5000);
        return;
      }
      setShowPrompt(true);
      if (deferredPrompt) {
        try {
          deferredPrompt.prompt();
        } catch (err) {
          console.warn("Auto prompt failed:", err);
        }
      }
    };

    window.addEventListener("trigger-basha-pwa-install", handleCustomTrigger);
    document.addEventListener("trigger-basha-pwa-install", handleCustomTrigger);

    // 8. Auto-open if arriving directly from the mobile app QR code
    if (isFromQr && !standalone) {
      setShowPrompt(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("trigger-basha-pwa-install", handleCustomTrigger);
      document.removeEventListener("trigger-basha-pwa-install", handleCustomTrigger);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult?.outcome === "accepted") {
          setInstalledSuccess(true);
          setShowPrompt(false);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn("[Basha PWA] Install error:", err);
      }
    }
  };

  const copyPageLink = () => {
    try {
      navigator.clipboard.writeText(window.location.origin);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {}
  };

  if (!showPrompt && !installedSuccess) return null;

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────
          SUCCESS NOTIFICATION AFTER INSTALLATION OR IF ALREADY INSTALLED
         ───────────────────────────────────────────────────────────── */}
      {installedSuccess && (
        <div
          className="fixed top-4 left-4 right-4 z-[99999] max-w-md mx-auto p-4 rounded-3xl bg-emerald-500 text-slate-950 font-bold shadow-2xl flex items-center gap-3 animate-bounce border-2 border-emerald-300"
          dir="rtl"
        >
          <CheckCircle2 className="w-8 h-8 shrink-0 text-slate-950" />
          <div className="text-xs">
            <p className="font-black text-sm">التطبيق مثبت وجاهز على هاتفك! 👑</p>
            <p className="text-emerald-950 font-medium">
              أيقونة التطبيق موجودة على شاشتك الرئيسية، ويمكنك فتحها في أي وقت مباشرة بدون متصفح.
            </p>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SMART MOBILE PWA INSTALL MODAL / BOTTOM SHEET (HIGH Z-INDEX)
         ───────────────────────────────────────────────────────────── */}
      {showPrompt && (
        <div
          className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-4 no-print animate-fade-in"
          dir="rtl"
        >
          <aside
            aria-label="تثبيت تطبيق الباشا VIP على الهاتف"
            className="w-full max-w-md bg-[#111119] border-2 border-amber-500/70 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-white font-sans text-xs relative max-h-[92vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-400 bg-black shadow-lg shadow-amber-500/30 shrink-0 p-0.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/dakn-logo.jpg" alt="الباشا VIP" className="w-full h-full object-contain rounded-xl" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">تطبيق صالونات وسبا الباشا VIP 👑</h3>
                  <span className="inline-block mt-0.5 py-0.5 px-2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/30">
                    تطبيق ويب تقدمي (PWA رسمي)
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPrompt(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center shrink-0 cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              احصل على أيقونة التطبيق الرسمية على شاشة هاتفك مباشرة مع إشعارات حجز فورية وسرعة فائقة بدون الحاجة لمتجر تطبيقات!
            </p>

            {/* In-App Browser Warning (e.g., opened in WhatsApp/Instagram/QR Scanner) */}
            {isInAppBrowser && (
              <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs space-y-2">
                <p className="font-black flex items-center gap-1.5 text-amber-300 text-xs">
                  <span>🧭</span>
                  <span>تنبيه: أنت تتصفح داخل متصفح فرعي / قارئ الكود:</span>
                </p>
                <p className="text-[11px] text-slate-200 leading-relaxed">
                  نظام Apple يتطلب فتح الصفحة في متصفح <strong>Safari الرسمي</strong> لتثبيت التطبيق على الشاشة الرئيسية:
                </p>
                <div className="bg-black/50 p-2.5 rounded-xl border border-amber-400/20 text-[11px] text-amber-300 font-bold flex items-center gap-2">
                  <Compass className="w-5 h-5 text-amber-400 shrink-0 animate-spin" />
                  <span>اضغط على أيقونة البوصلة 🧭 أسفل يمين/يسار الشاشة لفتح الموقع في متصفح Safari.</span>
                </div>
              </div>
            )}

            {/* 1. Android One-Click Native Install Button */}
            {deferredPrompt && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm transition shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95 animate-pulse"
              >
                <Download className="w-5 h-5" />
                <span>📱 تثبيت التطبيق على الهاتف الآن (بنقرة واحدة)</span>
              </button>
            )}

            {/* 2. iOS Safari Step-by-Step Visual Guide */}
            {isIos && (
              <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-500/20 to-black/60 border-2 border-amber-400/60 space-y-3 text-xs text-amber-200 shadow-xl">
                <div className="flex items-center justify-between">
                  <p className="font-black text-amber-300 flex items-center gap-1.5 text-sm">
                    <span>🍏</span>
                    <span>خطوات تثبيت التطبيق على الآيفون (Safari):</span>
                  </p>
                  <span className="py-0.5 px-2 rounded-full bg-amber-400 text-slate-950 font-black text-[10px]">
                    سهل وسريع ⚡
                  </span>
                </div>

                <div className="space-y-2.5 text-[11px] text-slate-200">
                  {/* Step 1 */}
                  <div className="flex items-center gap-3 bg-black/60 p-3 rounded-2xl border border-white/10">
                    <span className="w-7 h-7 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black flex items-center justify-center text-xs shrink-0 shadow-md">
                      1
                    </span>
                    <div className="leading-snug">
                      اضغط على زر <strong>المشاركة (Share)</strong> أسفل شاشة Safari:
                      <div className="inline-flex items-center gap-1 mr-1 px-2 py-0.5 rounded-lg bg-white/10 text-amber-300 font-bold border border-white/10">
                        <Share2 className="w-3.5 h-3.5 text-amber-400 inline" />
                        <span>أيقونة المربع وسهم لأعلى</span>
                      </div>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-center gap-3 bg-black/60 p-3 rounded-2xl border border-white/10">
                    <span className="w-7 h-7 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black flex items-center justify-center text-xs shrink-0 shadow-md">
                      2
                    </span>
                    <div className="leading-snug">
                      مرر الخيارات لأسفل واضغط على:
                      <div className="inline-flex items-center gap-1 mr-1 px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 font-black border border-amber-400/30">
                        <PlusSquare className="w-3.5 h-3.5 text-amber-400 inline" />
                        <span>إضافة إلى الشاشة الرئيسية (Add to Home Screen)</span>
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-center gap-3 bg-black/60 p-3 rounded-2xl border border-white/10">
                    <span className="w-7 h-7 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black flex items-center justify-center text-xs shrink-0 shadow-md">
                      3
                    </span>
                    <div className="leading-snug">
                      اضغط على كلمة <strong>&quot;إضافة&quot; (Add)</strong> في الزاوية العلوية.. ومبروك! ستظهر أيقونة التطبيق على شاشتك فوراً 📲👑
                    </div>
                  </div>
                </div>

                {/* Animated Pointer to the bottom bar of Safari */}
                <div className="pt-1 flex items-center justify-center gap-1.5 text-amber-300/90 text-[11px] font-black animate-pulse">
                  <ArrowDown className="w-4 h-4 animate-bounce" />
                  <span>زر المشاركة موجود في شريط سفاري السفلي بالأسفل</span>
                  <ArrowDown className="w-4 h-4 animate-bounce" />
                </div>
              </div>
            )}

            {/* Copy Link Helper */}
            <div className="pt-1">
              <button
                type="button"
                onClick={copyPageLink}
                className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">تم نسخ رابط الموقع بنجاح!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-amber-400" />
                    <span>نسخ رابط الموقع لفتحه مباشرة في Safari</span>
                  </>
                )}
              </button>
            </div>

            {/* 3. Android Chrome Step-by-Step Guide (Fallback if native prompt not ready) */}
            {isAndroid && !deferredPrompt && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2.5 text-xs text-amber-200">
                <p className="font-black text-amber-300 flex items-center gap-2 text-sm">
                  <span>🤖 خطوات تثبيت التطبيق على هاتف الأندرويد:</span>
                </p>
                <div className="space-y-2 pr-1 text-[11px] text-slate-200">
                  <div className="flex items-center gap-2.5 bg-black/40 p-2 rounded-xl border border-white/5">
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs shrink-0">
                      1
                    </span>
                    <span>اضغط على الثلاث نقاط أعلى الشاشة في متصفح كروم (⋮).</span>
                  </div>
                  <div className="flex items-center gap-2.5 bg-black/40 p-2 rounded-xl border border-white/5">
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs shrink-0">
                      2
                    </span>
                    <span>اختر من القائمة <strong>&quot;تثبيت التطبيق&quot;</strong> أو <strong>&quot;إضافة إلى الشاشة الرئيسية 📲&quot;</strong>.</span>
                  </div>
                </div>
              </div>
            )}

            {/* General Desktop/Laptop View Guide if opened on computer */}
            {!isAndroid && !isIos && !deferredPrompt && (
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs text-slate-300">
                <p className="font-bold text-amber-300">💻 لتثبيت التطبيق على الكمبيوتر:</p>
                <p className="text-[11px]">اضغط على أيقونة التثبيت أعلى شريط العنوان في متصفحك (بجوار زر النجمة ⭐) أو اختر تثبيت من قائمة المتصفح.</p>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/10">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>متوافق تماماً مع أندرويد وآيفون iOS</span>
              </span>
              <button
                type="button"
                onClick={() => setShowPrompt(false)}
                className="text-slate-400 hover:text-white underline cursor-pointer font-bold"
              >
                إغلاق ✕
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
