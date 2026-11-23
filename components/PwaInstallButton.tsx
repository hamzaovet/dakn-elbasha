"use client";

import React, { useEffect, useState } from "react";
import { Download, Monitor, CheckCircle, Sparkles, X, Smartphone, Info } from "lucide-react";

interface PwaInstallButtonProps {
  className?: string;
  variant?: "button" | "banner" | "compact";
  showPlatformLabel?: boolean;
}

export default function PwaInstallButton({
  className = "",
  variant = "button",
  showPlatformLabel = true,
}: PwaInstallButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isWindows, setIsWindows] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [installSuccess, setInstallSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if already in standalone app mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");

    if (isStandalone) {
      setIsInstalled(true);
    }

    // Detect OS
    const ua = window.navigator.userAgent.toLowerCase();
    const isWin = ua.includes("win");
    const isMob = /iphone|ipad|ipod|android|mobile/.test(ua);
    setIsWindows(isWin);
    setIsMobile(isMob);

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // Listen for appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallSuccess(true);
      setDeferredPrompt(null);
      setTimeout(() => setInstallSuccess(false), 5000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
          setIsInstalled(true);
          setInstallSuccess(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error("Install prompt error:", err);
      }
    } else {
      // If deferredPrompt is not yet triggered by browser, show friendly guidance modal
      setShowHelpModal(true);
    }
  };

  // If already running inside installed standalone app, hide or show subtle check
  if (isInstalled && !installSuccess) {
    return null;
  }

  // Label text based on platform
  const label = isWindows
    ? "تثبيت برنامج دقن الباشا للويندوز 💻"
    : isMobile
    ? "تثبيت التطبيق على الموبايل 📱"
    : "تثبيت التطبيق على الكمبيوتر 💻";

  return (
    <>
      {variant === "compact" ? (
        <button
          type="button"
          onClick={handleInstallClick}
          className={`px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all ${className}`}
          title="تثبيت التطبيق على جهاز الكمبيوتر وسطح المكتب"
        >
          {isWindows ? <Monitor size={14} /> : <Download size={14} />}
          <span>{label}</span>
        </button>
      ) : variant === "banner" ? (
        <div
          className={`p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-[#181510] via-[#12121a] to-[#181510] border border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl ${className}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
              {isWindows ? <Monitor size={20} /> : <Sparkles size={20} />}
            </div>
            <div className="text-right">
              <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                <span>تثبيت برنامج صالون دقن الباشا وحمام الباشا VIP كأبليكيشن مستقل</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                  {isWindows ? "نسخة الويندوز 10/11" : "متاح للكمبيوتر والموبايل"}
                </span>
              </h4>
              <p className="text-[11px] text-white/60 mt-0.5">
                افتح الكاشير والحجوزات والإدارة مباشرة من سطح المكتب بدون متصفح وبضغطة زر واحدة!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleInstallClick}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-95 transition-all shrink-0"
          >
            <Download size={15} />
            <span>{label}</span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleInstallClick}
          className={`px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-110 text-black font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all ${className}`}
        >
          {isWindows ? <Monitor size={15} /> : <Download size={15} />}
          <span>{label}</span>
        </button>
      )}

      {/* Success Notification */}
      {installSuccess && (
        <div className="fixed bottom-5 right-5 z-50 p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500 text-white flex items-center gap-3 shadow-2xl animate-in slide-in-from-bottom duration-300">
          <CheckCircle className="text-emerald-400" size={20} />
          <div>
            <div className="text-xs font-black text-white">تم تثبيت التطبيق بنجاح! 🎉</div>
            <div className="text-[10px] text-white/70">
              أيقونة صالون دقن الباشا وحمام الباشا VIP أصبحت الآن على سطح المكتب وقائمة Start.
            </div>
          </div>
        </div>
      )}

      {/* Manual Guidance Modal (When browser doesn't expose prompt directly) */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#12121a] border border-amber-500/40 rounded-3xl w-full max-w-md p-6 shadow-2xl text-white relative space-y-4 animate-in fade-in zoom-in-95 duration-200 text-right">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <Monitor size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    تثبيت برنامج صالون دقن الباشا وحمام الباشا VIP على الويندوز
                  </h3>
                  <p className="text-[10px] text-white/50">بضغطة واحدة من شريط المتصفح</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-white/70"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-white/80">
              {isWindows && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-black/40 to-black/60 border border-amber-500/30 space-y-2">
                  <div className="font-black text-amber-300 text-xs flex items-center gap-2">
                    <Sparkles size={15} />
                    <span>تثبيت فوري على سطح المكتب (ضغطة واحدة):</span>
                  </div>
                  <p className="text-[11px] text-white/70">
                    يمكنك تحميل أداة التثبيت الفورية، وبمجرد تشغيلها ستنشئ أيقونة صالون دقن الباشا وحمام الباشا VIP الملكية فوراً على الديسك توب وقائمة ابدأ!
                  </p>
                  <a
                    href="/saddam-desktop-installer.bat"
                    download="saddam-desktop-installer.bat"
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-110 text-black font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all text-center"
                  >
                    <Download size={15} />
                    <span>تحميل أداة التثبيت لسطح المكتب (.bat)</span>
                  </a>
                </div>
              )}

              <div className="p-3 rounded-2xl bg-black/50 border border-white/10 space-y-1.5">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Info size={14} />
                  <span>أو التثبيت من متصفح Chrome / Edge:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-white/70 pr-2">
                  <li>
                    انظر إلى <strong>شريط العنوان (URL Bar)</strong> أعلى المتصفح.
                  </li>
                  <li>
                    ستجد أيقونة تثبيت صغيرة (<strong>كمبيوتر مع سهم 💻</strong> أو علامة <strong>⊕</strong>).
                  </li>
                  <li>
                    اضغط عليها ثم اختر <strong>تثبيت (Install)</strong>.
                  </li>
                  <li>
                    أو اضغط على <strong>القائمة (⋮ ثلاث نقاط)</strong> ⬅️ <strong>تطبيقات (Apps)</strong> ⬅️ <strong>تثبيت هذا الموقع كتطبيق (Install Saddam)</strong>.
                  </li>
                </ol>
              </div>

              <div className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl text-center">
                ✓ سيتم إنشاء أيقونة رسمية فوراً على الديسك توب لفتح شاشات الكاشير والإدارة بدون متصفح!
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold"
            >
              حسناً، فهمت
            </button>
          </div>
        </div>
      )}
    </>
  );
}
