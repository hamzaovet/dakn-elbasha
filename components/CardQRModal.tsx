"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { QrCode, X, Printer, Sparkles, Smartphone, Globe } from "lucide-react";

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
  hadayekPhone = "01061301780",
  nasrCityPhone = "01556782015",
  hotline = "19555",
}: CardQRModalProps) {
  const [webQr, setWebQr] = useState<string>("");
  const [appQr, setAppQr] = useState<string>("");
  const [originUrl, setOriginUrl] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const origin = window.location.origin;
      setOriginUrl(origin);

      // QR 1: Website Link (حجز المواعيد والخدمات أونلاين)
      const webUrl = `${origin}/?ref=card_qr`;
      QRCode.toDataURL(webUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: "#0a0a0e",
          light: "#ffffff",
        },
      }).then(setWebQr).catch(console.error);

      // QR 2: Installable Mobile App / PWA Link (تطبيق مجموعة الباشا الملكي)
      const appUrl = `${origin}/?source=basha_app_install`;
      QRCode.toDataURL(appUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: "#0a0a0e",
          light: "#ffffff",
        },
      }).then(setAppQr).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 font-sans no-print"
      dir="rtl"
    >
      <div className="relative w-full max-w-2xl bg-[#0f0f14] border border-amber-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl shadow-amber-500/10 space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute left-4 top-4 p-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <span>كارت الدعاية الفخم (2 كيو آر كود)</span>
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            </h3>
            <p className="text-xs text-amber-200/70">
              كارت مخصص لمجموعة الباشا VIP: كود الحجز أونلاين وكود تثبيت التطبيق على الهاتف
            </p>
          </div>
        </div>

        {/* PRINTABLE CARD AREA */}
        <div
          id="printable-luxury-card"
          className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#181820] to-[#0d0d12] border-2 border-amber-500/40 p-6 sm:p-8 text-center shadow-xl space-y-6"
        >
          {/* Dual Logos for Men & Women */}
          <div className="flex items-center justify-center gap-4 sm:gap-8">
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-lg shadow-amber-500/20 bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/dakn-logo.jpg" alt="دقن الباشا" className="w-full h-full object-cover" />
              </div>
              <span className="text-[11px] font-black text-amber-400">دقن الباشا (رجالي)</span>
            </div>

            <div className="text-xl font-black text-amber-400/60 font-mono">✦ VIP ✦</div>

            <div className="flex flex-col items-center gap-1.5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-rose-400 shadow-lg shadow-rose-500/20 bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/hammam-logo.jpg" alt="حمام الباشا" className="w-full h-full object-cover" />
              </div>
              <span className="text-[11px] font-black text-rose-300">حمام الباشا (حريمي)</span>
            </div>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-amber-400 tracking-wide">
              مجموعة صالونات وسبا الباشا VIP
            </h2>
            <p className="text-xs font-mono font-bold text-amber-200/70 tracking-widest uppercase mt-0.5">
              DAKN EL BASHA • HAMMAM EL BASHA • ROYAL EXPERIENCE
            </p>
          </div>

          {/* TWO QR CODES SIDE BY SIDE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-1">
            {/* QR 1: ONLINE WEBSITE */}
            <div className="p-4 rounded-2xl bg-black/60 border border-amber-500/30 flex flex-col items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
                <Globe className="w-4 h-4 text-amber-400" />
                <span>حجز موعد أونلاين (الموقع)</span>
              </div>

              <div className="p-2.5 bg-white rounded-2xl shadow-md">
                {webQr ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={webQr} alt="QR Code Website" className="w-36 h-36 object-contain" />
                ) : (
                  <div className="w-36 h-36 flex items-center justify-center text-xs text-slate-400">
                    جارٍ التوليد...
                  </div>
                )}
              </div>

              <p className="text-[11px] text-slate-300 font-bold">
                امسح الكود للاطلاع على الخدمات والأسعار وحجز موعدك فوراً 💈✨
              </p>
            </div>

            {/* QR 2: MOBILE APP (PWA INSTALL) */}
            <div className="p-4 rounded-2xl bg-black/60 border border-amber-500/30 flex flex-col items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
                <Smartphone className="w-4 h-4 text-amber-400" />
                <span>تطبيق صالون وسبا الباشا (موبايل)</span>
              </div>

              <div className="p-2.5 bg-white rounded-2xl shadow-md ring-2 ring-amber-400/50">
                {appQr ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={appQr} alt="QR Code App" className="w-36 h-36 object-contain" />
                ) : (
                  <div className="w-36 h-36 flex items-center justify-center text-xs text-slate-400">
                    جارٍ التوليد...
                  </div>
                )}
              </div>

              <p className="text-[11px] text-amber-200 font-bold">
                تثبيت مباشر للتطبيق على هاتفك بدون أي متجر خارجي 📱
              </p>
            </div>
          </div>

          {/* BRANCHES & CONTACT INFO BAR */}
          <div className="pt-3 border-t border-amber-500/20 text-xs text-slate-300 space-y-1.5">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 font-bold text-center">
              <span>📍 صالون دقن الباشا (رجالي): 73 ترعة الجبل، أمام مستشفى سان بول</span>
              <span className="hidden sm:inline">•</span>
              <span>📍 حمام الباشا (حريمي): 84 ترعة الجبل، كينج بارك مول</span>
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
