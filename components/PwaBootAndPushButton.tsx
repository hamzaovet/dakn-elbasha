"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Bell, BellRing, BellOff, Loader2, CheckCircle2, Send } from "lucide-react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PwaRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        console.log("[Basha PWA] Service Worker registered:", reg.scope);
      })
      .catch((err) => {
        console.warn("[Basha PWA] Service Worker registration failed:", err);
      });
  }, []);

  return null;
}

interface PushOptInButtonProps {
  role: "OWNER" | "ADMIN" | "COORDINATOR" | "POS" | "CUSTOMER";
  branchId?: string | null;
  userId?: string | null;
  userName?: string | null;
  customerPhone?: string | null;
  className?: string;
  compact?: boolean;
  showTestButton?: boolean;
}

export function PushOptInButton({
  role,
  branchId = null,
  userId = null,
  userName = null,
  customerPhone = null,
  className = "",
  compact = false,
  showTestButton = false,
}: PushOptInButtonProps) {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [currentEndpoint, setCurrentEndpoint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const syncSubscriptionWithServer = useCallback(
    async (sub: PushSubscription) => {
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: sub.toJSON(),
          role,
          branchId,
          userId,
          userName,
          customerPhone,
        }),
      });
      if (!res.ok) throw new Error("فشل مزامنة اشتراك الإشعارات");
      setIsSubscribed(true);
      setCurrentEndpoint(sub.endpoint);
    },
    [role, branchId, userId, userName, customerPhone]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isPushSupported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;

    setSupported(isPushSupported);
    if (!isPushSupported) return;

    setPermission(Notification.permission);

    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then(async (sub) => {
        if (sub) {
          setIsSubscribed(true);
          setCurrentEndpoint(sub.endpoint);
          await syncSubscriptionWithServer(sub).catch(() => {});
        }
      })
      .catch(() => {});
  }, [syncSubscriptionWithServer]);

  const handleEnablePush = async () => {
    if (!supported) return;
    setLoading(true);
    setStatusMsg(null);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== "granted") {
        setStatusMsg("تم رفض الإشعارات — يرجى السماح بها من إعدادات المتصفح");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();

      if (!sub) {
        const keyRes = await fetch("/api/push/vapid-public-key");
        const keyData = await keyRes.json();
        if (!keyData.publicKey) throw new Error("مفتاح VAPID غير متوفر");

        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(keyData.publicKey),
        });
      }

      await syncSubscriptionWithServer(sub);
      setStatusMsg("تم تفعيل إشعارات الخلفية بنجاح! 🔔");
      setTimeout(() => setStatusMsg(null), 4500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "تعذر تفعيل الإشعارات";
      setStatusMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTest = async () => {
    setTesting(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/push/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: currentEndpoint || undefined,
          role,
          branchId,
          customerPhone,
        }),
      });
      const data = await res.json();
      if (data.sent > 0) {
        setStatusMsg("تم إرسال إشعار تجريبي 🎉");
      } else {
        setStatusMsg("تأكد من تفعيل الإشعارات أولاً");
      }
      setTimeout(() => setStatusMsg(null), 3500);
    } catch {
      setStatusMsg("تعذر إرسال الإشعار التجريبي");
    } finally {
      setTesting(false);
    }
  };

  if (!supported) return null;

  if (permission === "denied") {
    return (
      <div
        className={`inline-flex items-center gap-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 px-2.5 py-1.5 text-[11px] font-bold text-rose-400 ${className}`}
        title="تم حظر الإشعارات من المتصفح"
      >
        <BellOff className="w-3.5 h-3.5 shrink-0" />
        <span>{compact ? "محظور" : "الإشعارات محظورة من المتصفح"}</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 flex-wrap ${className}`}>
      <button
        type="button"
        onClick={handleEnablePush}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 rounded-xl font-black text-xs transition-all border ${
          isSubscribed
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
            : "bg-gradient-to-l from-amber-500 to-yellow-400 border-amber-400 text-zinc-950 shadow-lg shadow-amber-500/20 hover:opacity-95 animate-pulse"
        } ${compact ? "px-2.5 py-1.5" : "px-3.5 py-2"}`}
        title={isSubscribed ? "إشعارات الخلفية مفعلة وتعمل حتى عند إغلاق التطبيق" : "اضغط لتفعيل إشعارات الخلفية الفورية"}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
        ) : isSubscribed ? (
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        ) : (
          <BellRing className="w-3.5 h-3.5 shrink-0" />
        )}
        <span>
          {isSubscribed
            ? compact
              ? "إشعارات الخلفية ✓"
              : "إشعارات الخلفية مفعلة 🔔"
            : compact
              ? "تفعيل التنبيهات 🔔"
              : "تفعيل تنبيهات الخلفية (حتى والتطبيق مقفول)"}
        </span>
      </button>

      {showTestButton && isSubscribed && (
        <button
          type="button"
          onClick={handleSendTest}
          disabled={testing}
          className="inline-flex items-center gap-1 rounded-xl bg-amber-500/15 border border-amber-500/30 px-2.5 py-1.5 text-[11px] font-black text-amber-300 hover:bg-amber-500/25 transition-all"
          title="إرسال إشعار تجريبي الآن"
        >
          {testing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
          <span>تجربة 🔔</span>
        </button>
      )}

      {statusMsg && (
        <span className="text-[11px] font-bold text-amber-300 animate-fade-in flex items-center gap-1">
          <Bell className="w-3 h-3" /> {statusMsg}
        </span>
      )}
    </div>
  );
}
