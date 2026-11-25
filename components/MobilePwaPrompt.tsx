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
  ExternalLink,
  ChevronLeft,
} from "lucide-react";

export default function MobilePwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [isAndroid, setIsAndroid] = useState<boolean>(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState<boolean>(false);
  const [showPrompt, setShowPrompt] = useState<boolean>(false);
  const [installedSuccess, setInstalledSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Register Service Worker for PWA compliance
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          console.log("[Basha PWA] SW registered successfully on scope:", reg.scope);
        })
        .catch((err) => console.warn("[Basha PWA] SW registration failed:", err));
    }

    // 2. Check if already installed & running in standalone app mode
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");

    setIsStandalone(standalone);
    if (standalone) return;

    // 3. Platform & Browser detection
    const ua = window.navigator.userAgent.toLowerCase();
    const isApple = /iphone|ipad|ipod/.test(ua);
    const isDroid = /android/.test(ua);
    const inApp = /fban|fbav|instagram|threads|whatsapp|tiktok|snapchat|line|micromessenger/.test(ua);

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
      // If scanned from QR or on mobile, show the prompt
      if (isFromQr || isDroid) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // 6. Native App Installed event
    window.addEventListener("appinstalled", () => {
      setInstalledSuccess(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      setTimeout(() => setInstalledSuccess(false), 7000);
    });

    // 7. Listen for explicit UI triggers (e.g. clicking "تثبيت التطبيق 📱" in header)
    const handleCustomTrigger = () => {
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

    // 8. Auto-open if arriving directly from the mobile app QR code
    if (isFromQr) {
      setShowPrompt(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("trigger-basha-pwa-install", handleCustomTrigger);
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
    } else {
      // If deferredPrompt is not yet ready or supported on this browser
      // Instructions will remain visibly highlighted in the sheet
    }
  };

  if (isStandalone && !installedSuccess) return null;
  if (!showPrompt && !installedSuccess) return null;

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────
          SUCCESS NOTIFICATION AFTER INSTALLATION
         ───────────────────────────────────────────────────────────── */}
      {installedSuccess && (
        <div className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto p-4 rounded-3xl bg-emerald-500 text-slate-950 font-bold shadow-2xl flex items-center gap-3 animate-bounce border-2 border-emerald-300" dir="rtl">
          <CheckCircle2 className="w-8 h-8 shrink-0 text-slate-950" />
          <div className="text-xs">
            <p className="font-black text-sm">تم تثبيت تطبيق صالونات وسبا الباشا بنجاح! 👑</p>
            <p className="text-emerald-950 font-medium">أيقونة التطبيق الآن جاهزة على شاشة هاتفك الرئيسية، يمكنك فتحه في أي وقت مباشرة.</p>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SMART MOBILE PWA INSTALL MODAL / BOTTOM SHEET
         ───────────────────────────────────────────────────────────── */}
      {showPrompt && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4 no-print animate-fade-in" dir="rtl">
          <aside
            aria-label="تثبيت تطبيق الباشا VIP على الهاتف"
            className="w-full max-w-md bg-[#111119] border-2 border-amber-500/60 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-white font-sans text-xs relative max-h-[92vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-400 bg-black shadow-lg shadow-amber-500/25 shrink-0 p-0.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/dakn-logo.jpg" alt="الباشا VIP" className="w-full h-full object-contain rounded-xl" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-black text-white text-base">تطبيق صالونات وسبا الباشا VIP 👑</h3>
                  </div>
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
              احصل على تجربة حجز ملكية كاملة مباشرة من شاشة هاتفك مع إشعارات المواعيد الفورية بدون الحاجة لمتجر تطبيقات!
            </p>

            {/* In-App Browser Warning (e.g., opened in WhatsApp/Instagram) */}
            {isInAppBrowser && (
              <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs space-y-1">
                <p className="font-black flex items-center gap-1.5">
                  <span>⚠️</span>
                  <span>المتصفح الداخلي لا يدعم التثبيت المباشر:</span>
                </p>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  اضغط على الثلاث نقاط (⋮) واختر <strong>&quot;فتح في المتصفح Chrome / Safari&quot;</strong> لتثبيت التطبيق على هاتفك بنقرة واحدة.
                </p>
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

            {/* 2. iOS Safari Step-by-Step Guide */}
            {isIos && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2.5 text-xs text-amber-200">
                <p className="font-black text-amber-300 flex items-center gap-2 text-sm">
                  <span>🍏 خطوات تثبيت التطبيق على الآيفون (Safari):</span>
                </p>
                <div className="space-y-2 pr-1 text-[11px] text-slate-200">
                  <div className="flex items-center gap-2.5 bg-black/40 p-2 rounded-xl border border-white/5">
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs shrink-0">
                      1
                    </span>
                    <span>اضغط على زر المشاركة أسفل متصفح Safari (أيقونة المربع وسهم لأعلى <Share2 className="w-4 h-4 inline text-amber-400 mx-1" />).</span>
                  </div>
                  <div className="flex items-center gap-2.5 bg-black/40 p-2 rounded-xl border border-white/5">
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs shrink-0">
                      2
                    </span>
                    <span>مرر للأسفل واختر <strong>&quot;إضافة إلى الشاشة الرئيسية&quot;</strong> (<PlusSquare className="w-4 h-4 inline text-amber-400 mx-1" /> Add to Home Screen).</span>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Android Chrome Step-by-Step Guide (if native prompt was dismissed or not yet ready) */}
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
                    <span>اضغط على الثلاث نقاط أعلى يسار/يمين متصفح كروم (⋮).</span>
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
                تصفح الموقع أولاً ✕
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
