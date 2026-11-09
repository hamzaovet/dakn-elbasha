"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Sparkles, User, MapPin, Clock, Check, CheckCheck } from "lucide-react";

interface CustomerChatWidgetProps {
  customer?: any;
  branches?: any[];
  selectedBranchId?: string;
  hasActiveSelection?: boolean;
  activeMode?: "MEN" | "WOMEN";
}

export default function CustomerChatWidget({
  customer,
  branches = [],
  selectedBranchId,
  hasActiveSelection = false,
  activeMode = "MEN",
}: CustomerChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [targetBranchId, setTargetBranchId] = useState<string>("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatError, setChatError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const isWomen = activeMode === "WOMEN";
  const brandName = isWomen ? "حمام الباشا (حريمي وسبا VIP)" : "دقن الباشا (رجالي VIP)";
  const brandLogo = isWomen ? "/hammam-logo.jpg" : "/dakn-logo.jpg";
  const accentColor = isWomen ? "from-rose-500 via-pink-400 to-rose-600" : "from-amber-500 via-amber-400 to-amber-500";
  const accentBorder = isWomen ? "border-rose-400/50" : "border-amber-400/50";
  const accentText = isWomen ? "text-rose-300" : "text-amber-400";
  const buttonBg = isWomen ? "bg-rose-500 hover:bg-rose-400 text-white" : "bg-amber-500 hover:bg-amber-400 text-slate-950";

  // Initialize guest info from localStorage
  useEffect(() => {
    try {
      const savedName = localStorage.getItem("basha_chat_name") || localStorage.getItem("saddam_chat_name") || "";
      const savedPhone = localStorage.getItem("basha_chat_phone") || localStorage.getItem("saddam_chat_phone") || "";
      if (savedName) setGuestName(savedName);
      if (savedPhone) setGuestPhone(savedPhone);
    } catch {}
  }, []);

  const activePhone = customer?.phone || guestPhone;
  const activeName = customer?.name || guestName || "عميل VIP";

  // Polling messages
  useEffect(() => {
    if (!activePhone) return;

    let isMounted = true;
    const fetchChat = async () => {
      try {
        const res = await fetch(`/api/chat?customerPhone=${encodeURIComponent(activePhone)}`);
        const data = await res.json();
        if (data.success && isMounted) {
          setMessages(data.messages || []);
          if (!isOpen) {
            const unread = (data.messages || []).filter(
              (m: any) => m.sender === "SALON" && !m.isRead
            ).length;
            setUnreadCount(unread);
          } else {
            setUnreadCount(0);
          }
        }
      } catch {}
    };

    fetchChat();
    const interval = setInterval(fetchChat, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activePhone, isOpen]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || newMessage).trim();
    if (!text) return;

    if (!activePhone) {
      setChatError("يرجى كتابة رقم الهاتف واسمك الكريم أولاً لبدء المحادثة المباشرة 💬");
      return;
    }
    setChatError(null);

    try {
      setSending(true);
      // Save guest info
      if (!customer) {
        localStorage.setItem("basha_chat_name", guestName);
        localStorage.setItem("basha_chat_phone", guestPhone);
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: "CUSTOMER",
          senderName: activeName,
          message: text,
          customerPhone: activePhone,
          customerId: customer?.id || null,
          branchId: targetBranchId || selectedBranchId || null,
        }),
      });

      const data = await res.json();
      if (data.success && data.chatMessage) {
        setMessages((prev) => [...prev, data.chatMessage]);
        setNewMessage("");
      }
    } catch {
      setChatError("تعذر إرسال الرسالة، يرجى المحاولة مرة أخرى ⚠️");
    } finally {
      setSending(false);
    }
  };

  const quickChips = isWomen
    ? [
        "سؤال عن باقة العروسة الملكية 👑",
        "حجز جلسة حمام مغربي وساونا 🧖‍♀️",
        "مواعيد العمل المتاحة اليوم ⏰",
        "عنوان حمام الباشا ومول كينج بارك 📍",
      ]
    : [
        "سؤال عن عروض عريس الباشا الملكية 👑",
        "تأكيد موعد الحجز ومكاني في الدور 📅",
        "عنوان صالون دقن الباشا ومستشفى سان بول 📍",
        "مواعيد العمل المتاحة اليوم ⏰",
      ];

  return (
    <>
      {/* Floating Chat Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setUnreadCount(0);
          }}
          className={`fixed ${hasActiveSelection ? "bottom-24 sm:bottom-20" : "bottom-5"} left-5 z-40 p-3 sm:py-3 sm:px-4 rounded-full bg-gradient-to-r ${accentColor} ${isWomen ? "text-white" : "text-slate-950"} font-black text-xs shadow-2xl hover:scale-105 active:scale-95 transition flex items-center gap-2 border-2 ${isWomen ? "border-rose-300 shadow-rose-500/30" : "border-amber-300 shadow-amber-500/40"} cursor-pointer`}
          dir="rtl"
          title={`محادثة مباشرة مع ${brandName}`}
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5 fill-current" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-rose-600 text-white font-mono text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </div>
          <span className="hidden sm:inline">محادثة مباشرة مع الإدارة 💬</span>
        </button>
      )}

      {/* Chat Drawer / Popup Modal */}
      {isOpen && (
        <div
          className={`fixed bottom-5 left-5 z-50 w-full max-w-sm sm:max-w-md h-[560px] max-h-[85vh] ${isWomen ? "bg-[#140810] border-rose-500/40" : "bg-[#101018] border-amber-500/40"} border-2 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100 font-sans animate-fade-in`}
          dir="rtl"
        >
          {/* Header */}
          <div className={`p-3.5 border-b ${isWomen ? "bg-gradient-to-r from-[#200b18] via-[#160812] to-[#200b18] border-rose-500/30" : "bg-gradient-to-r from-[#181824] via-[#12121c] to-[#181824] border-amber-500/30"} flex items-center justify-between shrink-0`}>
            <div className="flex items-center gap-2.5">
              <div className={`w-10 h-10 rounded-2xl overflow-hidden border ${isWomen ? "border-rose-400" : "border-amber-400"} shadow-md bg-black shrink-0`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={brandLogo} alt={brandName} className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className={`font-black text-xs sm:text-sm ${accentText}`}>
                    خدمة عملاء {brandName}
                  </h4>
                  <Sparkles className={`w-3.5 h-3.5 ${accentText}`} />
                </div>
                <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  متصلون لخدمتك فوراً (دقن الباشا & حمام الباشا)
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Validation Warning Alert */}
          {chatError && (
            <div className="p-3 bg-rose-500/20 border-b border-rose-500/40 text-rose-200 text-xs font-bold flex items-center justify-between">
              <span>⚠️ {chatError}</span>
              <button onClick={() => setChatError(null)} className="text-white hover:text-rose-200 font-bold">✕</button>
            </div>
          )}

          {/* Guest Info Form */}
          {!customer && !guestPhone && (
            <div className={`p-4 ${isWomen ? "bg-rose-500/10 border-rose-500/20" : "bg-amber-500/10 border-amber-500/20"} border-b space-y-2 text-xs`}>
              <p className={`font-bold ${accentText}`}>
                برجاء إدخال بياناتك للتواصل المباشر مع إدارة {isWomen ? "حمام الباشا" : "دقن الباشا"}:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="الاسم الكريم"
                  value={guestName}
                  onChange={(e) => {
                    setGuestName(e.target.value);
                    if (chatError) setChatError(null);
                  }}
                  className={`py-1.5 px-2.5 rounded-xl bg-black/60 border ${accentBorder} text-white text-xs focus:outline-none`}
                />
                <input
                  type="tel"
                  placeholder="رقم الهاتف / الواتساب"
                  value={guestPhone}
                  onChange={(e) => {
                    setGuestPhone(e.target.value);
                    if (chatError) setChatError(null);
                  }}
                  className={`py-1.5 px-2.5 rounded-xl bg-black/60 border ${accentBorder} text-white font-mono text-xs focus:outline-none`}
                />
              </div>
            </div>
          )}

          {/* Quick Action Chips */}
          <div className="p-2 border-b border-white/5 flex gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
            {quickChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip)}
                className={`py-1 px-2.5 rounded-full bg-white/5 hover:${isWomen ? "bg-rose-500/20 hover:border-rose-400/40 text-slate-300 hover:text-rose-300" : "bg-amber-500/20 hover:border-amber-400/40 text-slate-300 hover:text-amber-300"} border border-white/10 text-[10px] whitespace-nowrap transition`}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${isWomen ? "bg-[#0b0408]" : "bg-[#0a0a0f]"}`}>
            {/* Welcome Message */}
            <div className="flex gap-2">
              <div className={`w-7 h-7 rounded-full ${isWomen ? "bg-rose-500 text-white" : "bg-amber-500 text-slate-950"} flex items-center justify-center text-xs font-black shrink-0`}>
                👑
              </div>
              <div className={`max-w-[80%] rounded-2xl rounded-tr-none ${isWomen ? "bg-[#1e0d18] border-rose-500/30" : "bg-[#161622] border-amber-500/30"} border p-3 text-xs text-slate-200 space-y-1 shadow-md`}>
                <p className={`font-bold ${accentText} text-[11px]`}>
                  {brandName}
                </p>
                <p className="leading-relaxed">
                  {isWomen
                    ? "أهلاً بكِ في حمام الباشا VIP! نسعد بخدمتكِ والإجابة عن استفسارات الحمام المغربي، باقات العروسة والسبا ومواعيد الحجز."
                    : "أهلاً بك يا فندم في صالون دقن الباشا الملكي! يمكنك الاستفسار عن باقات عريس الباشا، كراسي الحلاقة ومواعيد الحجز فوراً."}
                </p>
                <span className="text-[9px] text-slate-500 block font-mono text-left">الآن</span>
              </div>
            </div>

            {/* Message List */}
            {messages.map((m) => {
              const isMe = m.sender === "CUSTOMER";
              return (
                <div
                  key={m.id}
                  className={`flex gap-2 ${isMe ? "justify-end" : "justify-start"}`}
                >
                  {!isMe && (
                    <div className={`w-7 h-7 rounded-full ${isWomen ? "bg-rose-500 text-white" : "bg-amber-500 text-slate-950"} flex items-center justify-center text-xs font-black shrink-0`}>
                      👑
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-2xl p-3 text-xs space-y-1 shadow-md ${
                      isMe
                        ? isWomen
                          ? "bg-rose-500 text-white rounded-tl-none font-medium"
                          : "bg-amber-500 text-slate-950 rounded-tl-none font-medium"
                        : isWomen
                        ? "bg-[#200e1a] border border-rose-500/30 text-slate-200 rounded-tr-none"
                        : "bg-[#181826] border border-amber-500/30 text-slate-200 rounded-tr-none"
                    }`}
                  >
                    {!isMe && (
                      <p className={`font-black ${accentText} text-[10px]`}>{m.senderName}</p>
                    )}
                    <p className="leading-relaxed whitespace-pre-wrap">{m.message}</p>
                    <div className="flex items-center justify-between gap-2 pt-0.5 text-[9px] opacity-70 font-mono">
                      <span>
                        {new Date(m.createdAt).toLocaleTimeString("ar-EG", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {isMe && <CheckCheck className="w-3 h-3" />}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className={`p-3 ${isWomen ? "bg-[#170813] border-rose-500/30" : "bg-[#12121a] border-amber-500/30"} border-t flex items-center gap-2 shrink-0`}
          >
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={isWomen ? "اكتبي استفساركِ أو رسالتكِ لإدارة السبا..." : "اكتب استفسارك أو رسالتك لإدارة الصالون..."}
              className={`flex-1 py-2.5 px-3.5 rounded-xl bg-black/60 border ${accentBorder} text-xs text-white placeholder-slate-500 focus:outline-none`}
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className={`py-2.5 px-4 rounded-xl ${buttonBg} font-black text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-40 shadow-lg`}
            >
              <Send className="w-3.5 h-3.5 rotate-180" />
              <span>إرسال</span>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
