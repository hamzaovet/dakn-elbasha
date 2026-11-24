"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import {
  QrCode,
  X,
  Printer,
  Sparkles,
  Smartphone,
  Globe,
  Briefcase,
  Download,
  Building,
  Phone,
  CheckCircle2,
} from "lucide-react";

interface CardQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  hadayekPhone?: string;
  nasrCityPhone?: string;
  hotline?: string;
}

export default function CardQRModal({
  isOpen,
  onClose,
  hadayekPhone = "01210103025",
  nasrCityPhone = "01556782015",
  hotline = "01210103025",
}: CardQRModalProps) {
  const [webQr, setWebQr] = useState<string>("");
  const [appQr, setAppQr] = useState<string>("");
  const [careersQr, setCareersQr] = useState<string>("");
  const [originUrl, setOriginUrl] = useState<string>("");
  const [activeView, setActiveView] = useState<"ALL" | "CLIENT" | "CAREERS">("ALL");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const origin = window.location.origin;
      setOriginUrl(origin);

      // QR 1: Website Link (حجز المواعيد والخدمات أونلاين)
      const webUrl = `${origin}/?ref=card_qr`;
      QRCode.toDataURL(webUrl, {
        width: 320,
        margin: 2,
        color: { dark: "#0a0a0e", light: "#ffffff" },
      }).then(setWebQr).catch(console.error);

      // QR 2: Installable Mobile App / PWA Link (تطبيق مجموعة الباشا الملكي)
      const appUrl = `${origin}/?source=basha_app_install`;
      QRCode.toDataURL(appUrl, {
        width: 320,
        margin: 2,
        color: { dark: "#0a0a0e", light: "#ffffff" },
      }).then(setAppQr).catch(console.error);

      // QR 3: Public Careers Application Link (بوابة التوظيف المباشر)
      const careersUrl = `${origin}/careers`;
      QRCode.toDataURL(careersUrl, {
        width: 320,
        margin: 2,
        color: { dark: "#0a0a0e", light: "#ffffff" },
      }).then(setCareersQr).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 font-sans no-print"
      dir="rtl"
    >
      <div className="relative w-full max-w-4xl bg-[#0f0f14] border-2 border-amber-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 max-h-[95vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute left-4 top-4 p-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>كارت وبوستر الـ QR الذكي الشامل</span>
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              </h3>
              <p className="text-xs text-amber-200/70">
                مجموعة صالونات وسبا وعيادات الباشا VIP: حجز المواعيد • تثبيت التطبيق • التوظيف
              </p>
            </div>
          </div>

          {/* View Mode Selector Tabs */}
          <div className="flex items-center bg-black/60 p-1 rounded-2xl border border-white/10 gap-1">
            <button
              onClick={() => setActiveView("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeView === "ALL" ? "bg-amber-500 text-black shadow-md shadow-amber-500/20" : "text-slate-400 hover:text-white"
              }`}
            >
              👑 الكارت الشامل (3 أكواد)
            </button>
            <button
              onClick={() => setActiveView("CLIENT")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeView === "CLIENT" ? "bg-amber-500 text-black shadow-md shadow-amber-500/20" : "text-slate-400 hover:text-white"
              }`}
            >
              🛍️ كارت العملاء (الحجز والتطبيق)
            </button>
            <button
              onClick={() => setActiveView("CAREERS")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeView === "CAREERS" ? "bg-amber-500 text-black shadow-md shadow-amber-500/20" : "text-slate-400 hover:text-white"
              }`}
            >
              💼 بوستر التوظيف فقط
            </button>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            PRINTABLE LUXURY POSTER / CARD AREA
           ───────────────────────────────────────────────────────────── */}
        <div
          id="printable-luxury-card"
          className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#181824] via-[#10111a] to-[#08090f] border-2 border-amber-500/40 p-6 sm:p-8 text-center shadow-2xl space-y-6"
        >
          {/* Triple Logos (Men, Women, Clinic) */}
          <div className="flex items-center justify-center gap-3 sm:gap-6 flex-wrap">
            {/* Dakn */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-lg shadow-amber-500/20 bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/dakn-logo.jpg" alt="دقن الباشا" className="w-full h-full object-cover" />
              </div>
              <span className="text-[10px] font-black text-amber-400">دقن الباشا (رجالي)</span>
            </div>

            <span className="text-sm font-black text-amber-400/60 font-mono">✦ VIP ✦</span>

            {/* Hammam */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-rose-400 shadow-lg shadow-rose-500/20 bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/hammam-logo.jpg" alt="حمام الباشا" className="w-full h-full object-cover" />
              </div>
              <span className="text-[10px] font-black text-rose-300">حمام الباشا (حريمي)</span>
            </div>

            <span className="text-sm font-black text-amber-400/60 font-mono">✦ VIP ✦</span>

            {/* New Skin */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-teal-400 shadow-lg shadow-teal-500/20 bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/newskin-logo.jpg" alt="نيو سكين" className="w-full h-full object-cover" />
              </div>
              <span className="text-[10px] font-black text-teal-300">نيو سكين (عيادة وليزر)</span>
            </div>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-amber-400 tracking-wide">
              {activeView === "CAREERS"
                ? "انضم إلى نخبة خبراء مجموعة الباشا الملكية"
                : "مجموعة صالونات وسبا وعيادات الباشا VIP"}
            </h2>
            <p className="text-xs font-mono font-bold text-amber-200/70 tracking-widest uppercase mt-0.5">
              DAKN EL BASHA • HAMMAM EL BASHA • NEW SKIN VIP
            </p>
          </div>

          {/* QR CODES GRID */}
          <div
            className={`grid gap-4 sm:gap-6 pt-1 transition-all ${
              activeView === "CAREERS"
                ? "grid-cols-1 max-w-sm mx-auto"
                : activeView === "CLIENT"
                ? "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto"
                : "grid-cols-1 sm:grid-cols-3"
            }`}
          >
            {/* QR 1: ONLINE WEBSITE */}
            {(activeView === "ALL" || activeView === "CLIENT") && (
              <div className="p-4 rounded-2xl bg-black/60 border border-amber-500/30 flex flex-col items-center gap-2.5">
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
                  <Globe className="w-4 h-4 text-amber-400" />
                  <span>حجز موعد أونلاين (الموقع)</span>
                </div>

                <div className="p-2 bg-white rounded-2xl shadow-md">
                  {webQr ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={webQr} alt="QR Code Website" className="w-32 h-32 sm:w-36 sm:h-36 object-contain" />
                  ) : (
                    <div className="w-32 h-32 flex items-center justify-center text-xs text-slate-400">
                      جارٍ التوليد...
                    </div>
                  )}
                </div>

                <p className="text-[10px] text-slate-300 font-bold leading-tight">
                  امسح الكود للاطلاع على الخدمات والأسعار وحجز موعدك فوراً 💈✨
                </p>
              </div>
            )}

            {/* QR 2: MOBILE APP (PWA INSTALL) */}
            {(activeView === "ALL" || activeView === "CLIENT") && (
              <div className="p-4 rounded-2xl bg-black/60 border border-amber-500/30 flex flex-col items-center gap-2.5">
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
                  <Smartphone className="w-4 h-4 text-amber-400" />
                  <span>تطبيق صالون وسبا الباشا</span>
                </div>

                <div className="p-2 bg-white rounded-2xl shadow-md ring-2 ring-amber-400/50">
                  {appQr ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={appQr} alt="QR Code App" className="w-32 h-32 sm:w-36 sm:h-36 object-contain" />
                  ) : (
                    <div className="w-32 h-32 flex items-center justify-center text-xs text-slate-400">
                      جارٍ التوليد...
                    </div>
                  )}
                </div>

                <p className="text-[10px] text-amber-200 font-bold leading-tight">
                  تثبيت مباشر للتطبيق على هاتفك بدون أي متجر خارجي 📱
                </p>
              </div>
            )}

            {/* QR 3: CAREERS PORTAL (وظائف شاغرة) */}
            {(activeView === "ALL" || activeView === "CAREERS") && (
              <div
                className={`p-4 rounded-2xl bg-black/60 border border-emerald-500/40 flex flex-col items-center gap-2.5 ${
                  activeView === "CAREERS" ? "ring-2 ring-emerald-400/60" : ""
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-300">
                  <Briefcase className="w-4 h-4 text-emerald-400" />
                  <span>التقديم على وظيفة (التوظيف)</span>
                </div>

                <div className="p-2 bg-white rounded-2xl shadow-md ring-2 ring-emerald-400/50">
                  {careersQr ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={careersQr} alt="QR Careers" className="w-32 h-32 sm:w-36 sm:h-36 object-contain" />
                  ) : (
                    <div className="w-32 h-32 flex items-center justify-center text-xs text-slate-400">
                      جارٍ التوليد...
                    </div>
                  )}
                </div>

                <p className="text-[10px] text-emerald-300 font-bold leading-tight">
                  امسح الكود بكاميرا الموبايل وقدم طلب التوظيف في دقيقة واحدة 💼🚀
                </p>
              </div>
            )}
          </div>

          {/* BRANCHES & CONTACT INFO BAR */}
          <div className="pt-3 border-t border-amber-500/20 text-xs text-slate-300 space-y-1.5">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 font-bold text-center text-[11px]">
              <span>📍 صالون دقن الباشا (رجالي): 73 ترعة الجبل، أمام مستشفى سان بول</span>
              <span className="hidden sm:inline">•</span>
              <span>📍 حمام الباشا (حريمي) وعيادة نيو سكين: 84 ترعة الجبل، كينج بارك مول</span>
            </div>
            <p className="text-xs text-amber-400 font-mono font-black">
              دقن الباشا: {hadayekPhone} • حمام الباشا: {nasrCityPhone} • الخط الساخن: {hotline}
            </p>
          </div>
        </div>

        {/* MODAL ACTIONS */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <p className="text-xs text-slate-400 font-mono">
            النطاق النشط: <span className="text-amber-400 font-bold">{originUrl || "dakn-elbasha.vercel.app"}</span>
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="py-2.5 px-5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الكارت الملكي 🖨️</span>
            </button>
            <button
              onClick={onClose}
              className="py-2.5 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
