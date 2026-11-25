"use client";

import React, { useEffect, useState } from "react";
import { Smartphone, Download, Share2, PlusSquare, X, Sparkles, CheckCircle2 } from "lucide-react";

export default function MobilePwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [isAndroid, setIsAndroid] = useState<boolean>(false);
  const [showPrompt, setShowPrompt] = useState<boolean>(false);
  const [installedSuccess, setInstalledSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Register Service Worker for PWA compliance
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => console.log("[Basha PWA] SW registered:", reg.scope))
        .catch((err) => console.warn("[Basha PWA] SW failed:", err));
    }

    // 2. Check if already installed & running in standalone app mode
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");

    setIsStandalone(standalone);
    if (standalone) return; // Don't show prompt if already installed

    // 3. Detect platform
    const ua = window.navigator.userAgent.toLowerCase();
    const isApple = /iphone|ipad|ipod/.test(ua);
    const isDroid = /android/.test(ua);
    setIsIos(isApple);
    setIsAndroid(isDroid);

    // 4. Check if user came from QR scan (?source=basha_app_install or ?source=pwa)
    const urlParams = new URLSearchParams(window.location.search);
    const isFromQr =
      urlParams.get("source") === "basha_app_install" ||
      urlParams.get("source") === "pwa" ||
      urlParams.get("install") === "true";

    // 5. Listen for Android Chrome native prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Auto-show prompt if scanned from QR or on mobile
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    window.addEventListener("appinstalled", () => {
      setInstalledSuccess(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      setTimeout(() => setInstalledSuccess(false), 6000);
    });

    // If on iOS or mobile and scanned from QR, show prompt immediately
    if (isFromQr || isApple || isDroid) {
      setShowPrompt(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setInstalledSuccess(true);
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      // iOS doesn't support programmatic install; guide is displayed
    }
  };

  if (isStandalone || (!showPrompt && !installedSuccess)) return null;

  return (
    <>
      {/* Success Notification */}
      {installedSuccess && (
        <div className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto p-4 rounded-2xl bg-emerald-500 text-slate-950 font-bold shadow-2xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-6 h-6 shrink-0" />
          <div className="text-xs">
            <p className="font-black text-sm">تم تثبيت تطبيق الباشا بنجاح! 👑</p>
            <p>يمكنك الآن فتح التطبيق مباشرة من شاشة هاتفك الرئيسية في أي وقت بدون إنترنت.</p>
          </div>
        </div>
      )}

      {/* Floating Bottom Sheet for Mobile PWA Installation */}
      {showPrompt && (
        <aside
          aria-label="تثبيت تطبيق الباشا VIP"
          className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-[#12121a]/95 border-2 border-amber-500/50 backdrop-blur-xl rounded-3xl p-5 shadow-2xl space-y-3.5 text-white font-sans text-xs"
          dir="rtl"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-amber-400 bg-black shadow-md shadow-amber-500/20 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/dakn-logo.jpg" alt="الباشا VIP" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-black text-white text-sm">تطبيق صالونات وسبا الباشا VIP 👑</h4>
                  <span className="py-0.5 px-2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                    PWA
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  ثبت التطبيق على هاتفك مجاناً لحجز أسرع وتنبيهات فورية بدون متجر تطبيقات!
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPrompt(false)}
              className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center text-xs shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Android Chrome Install Button */}
          {deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs transition shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>📱 تثبيت التطبيق على الهاتف الآن (بنقرة واحدة)</span>
            </button>
          )}

          {/* iOS Safari Guide (When deferredPrompt is not supported) */}
          {isIos && !deferredPrompt && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2 text-[11px] text-amber-200">
              <p className="font-black text-xs text-amber-300 flex items-center gap-1.5">
                <span>🍏 خطوات تثبيت التطبيق على الآيفون (Safari):</span>
              </p>
              <div className="space-y-1.5 pr-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-[10px] shrink-0">
                    1
                  </span>
                  <span>اضغط على زر المشاركة أسفل متصفح سفاري (أيقونة المربع وسهم لأعلى <Share2 className="w-3.5 h-3.5 inline text-amber-400" />).</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-[10px] shrink-0">
                    2
                  </span>
                  <span>اختر من القائمة <strong>&quot;إضافة إلى الشاشة الرئيسية&quot;</strong> (<PlusSquare className="w-3.5 h-3.5 inline text-amber-400" /> Add to Home Screen).</span>
                </div>
              </div>
            </div>
          )}

          {/* Android Chrome Manual Guide (Fallback) */}
          {isAndroid && !deferredPrompt && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2 text-[11px] text-amber-200">
              <p className="font-black text-xs text-amber-300 flex items-center gap-1.5">
                <span>🤖 تثبيت التطبيق على هاتف أندرويد:</span>
              </p>
              <p>اضغط على الثلاث نقاط أعلى المتصفح (⋮) ثم اختر <strong>&quot;تثبيت التطبيق&quot;</strong> أو <strong>&quot;إضافة إلى الشاشة الرئيسية&quot;</strong>.</p>
            </div>
          )}

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/5">
            <span>متوافق مع أندرويد وآيفون iOS</span>
            <button
              onClick={() => setShowPrompt(false)}
              className="text-slate-400 hover:text-white underline cursor-pointer"
            >
              لاحقاً
            </button>
          </div>
        </aside>
      )}
    </>
  );
}
