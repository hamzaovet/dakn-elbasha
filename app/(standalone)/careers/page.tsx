"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  User,
  Phone,
  FileText,
  Upload,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Building,
  GraduationCap,
  Calendar,
  DollarSign,
  Camera,
  MapPin,
  Clock,
  ShieldCheck,
} from "lucide-react";

export default function CareersApplicationPage() {
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    nationalId: "",
    age: "",
    address: "",
    targetDepartment: "ALL",
    targetJob: "حلاق رجالي خبير VIP",
    targetBranchId: "",
    experienceYears: "3",
    previousWorkplaces: "",
    qualification: "",
    expectedSalary: "",
    personalPhoto: "",
    nationalIdUrl: "",
    cvUrl: "",
    notes: "",
  });

  // Handle Cloud Image Upload (ImgBB)
  const handleFileUpload = async (field: "personalPhoto" | "nationalIdUrl" | "cvUrl", file: File) => {
    try {
      setUploadingField(field);
      setError(null);

      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && (data.url || data.displayUrl)) {
        const uploadedUrl = data.url || data.displayUrl;
        setForm((prev) => ({ ...prev, [field]: uploadedUrl }));
      } else {
        setError(data.error || "فشل رفع الملف، يرجى المحاولة مرة أخرى");
      }
    } catch (err: any) {
      console.error(err);
      setError("حدث خطأ أثناء رفع الملف");
    } finally {
      setUploadingField(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.phone.trim() || !form.targetJob) {
      setError("يرجى ملء الحقول الإجبارية (الاسم، الهاتف، والوظيفة)");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/hr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_application",
          ...form,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmittedCode(data.code);
      } else {
        setError(data.error || "فشل إرسال الطلب، يرجى مراجعة البيانات");
      }
    } catch (err) {
      setError("حدث خطأ في الاتصال بالخادم، يرجى المحاولة لاحقاً");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#07070b] text-slate-100 flex flex-col items-center justify-center p-3 sm:p-6 font-sans selection:bg-amber-500 selection:text-black relative"
      dir="rtl"
    >
      {/* Background Glows */}
      <div className="absolute w-96 h-96 bg-amber-500/10 blur-[130px] rounded-full pointer-events-none -top-10 -right-10" />
      <div className="absolute w-96 h-96 bg-rose-500/10 blur-[130px] rounded-full pointer-events-none -bottom-10 -left-10" />

      <div className="relative w-full max-w-2xl bg-[#12121a]/95 border-2 border-amber-500/30 rounded-3xl p-5 sm:p-8 shadow-2xl space-y-6 my-6">
        {/* Brand Triple Logos & Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl overflow-hidden border-2 border-amber-400 bg-black shadow-lg shadow-amber-500/20" title="دقن الباشا">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/dakn-logo.jpg" alt="دقن الباشا" className="w-full h-full object-cover" />
            </div>
            <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl overflow-hidden border-2 border-rose-400 bg-black shadow-lg shadow-rose-500/20" title="حمام الباشا">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/hammam-logo.jpg" alt="حمام الباشا" className="w-full h-full object-cover" />
            </div>
            <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl overflow-hidden border-2 border-teal-400 bg-black shadow-lg shadow-teal-500/20" title="نيو سكين VIP">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/newskin-logo.jpg" alt="نيو سكين New Skin VIP" className="w-full h-full object-cover" />
            </div>
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>بوابة التوظيف والانضمام لفريق الباشا VIP</span>
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              طلب الالتحاق والعمل بمجموعة الباشا الملكية
            </h1>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
              دقن الباشا (رجالي) • حمام الباشا (حريمي وسبا) • عيادة نيو سكين (New Skin VIP). نبحث دائماً عن أمهر الكفاءات وأصحاب الخبرة.
            </p>
          </div>
        </div>

        {/* Success Screen after submission */}
        {submittedCode ? (
          <div className="p-6 sm:p-8 rounded-3xl bg-emerald-950/40 border-2 border-emerald-500/40 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/20">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-white">تم استلام طلب التوظيف بنجاح! 🎉</h2>
              <p className="text-xs text-emerald-300">
                شكراً لاهتمامك بالانضمام لعائلة الباشا. تم إرسال ملفك مباشرة إلى إدارة التوظيف والموارد البشرية.
              </p>
            </div>

            {/* Application Code Badge */}
            <div className="p-4 rounded-2xl bg-black/70 border border-emerald-500/40 inline-block space-y-1">
              <span className="text-[11px] text-slate-400 block font-bold">كود المتابعة الرسمي لطلبك:</span>
              <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono tracking-widest select-all">
                {submittedCode}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed max-w-sm mx-auto">
              سيقوم مسئول التوظيف بمراجعة بياناتك والتواصل معك عبر الواتساب أو الهاتف لتحديد موعد المقابلة الشخصية. يرجى الاحتفاظ بكود الطلب.
            </p>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSubmittedCode(null);
                  setForm({
                    fullName: "",
                    phone: "",
                    nationalId: "",
                    age: "",
                    address: "",
                    targetDepartment: "ALL",
                    targetJob: "حلاق رجالي خبير VIP",
                    targetBranchId: "",
                    experienceYears: "3",
                    previousWorkplaces: "",
                    qualification: "",
                    expectedSalary: "",
                    personalPhoto: "",
                    nationalIdUrl: "",
                    cvUrl: "",
                    notes: "",
                  });
                }}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition cursor-pointer"
              >
                تقديم طلب آخر
              </button>
              <Link
                href="/"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black transition cursor-pointer shadow-lg shadow-amber-500/20"
              >
                العودة للرئيسية
              </Link>
            </div>
          </div>
        ) : (
          /* Application Form */
          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* 1. Basic Personal Info */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-amber-300 flex items-center gap-1.5 border-b border-white/10 pb-1.5">
                <User className="w-4 h-4" />
                <span>1. البيانات الشخصية الأساسية:</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    الاسم رباعي (كما بالبطاقة) <span className="text-rose-400">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    placeholder="مثال: حسام أحمد محمد الباشا"
                    className="w-full py-2.5 px-3.5 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    رقم الهاتف والواتساب <span className="text-rose-400">*</span>:
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="010XXXXXXXX أو 011XXXXXXXX"
                    className="w-full py-2.5 px-3.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">الرقم القومي (14 رقم):</label>
                  <input
                    type="text"
                    maxLength={14}
                    value={form.nationalId}
                    onChange={(e) => setForm({ ...form, nationalId: e.target.value })}
                    placeholder="29XXXXXXXXXXXX"
                    className="w-full py-2.5 px-3.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">السن (بالسنوات):</label>
                  <input
                    type="number"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                    placeholder="مثال: 27"
                    className="w-full py-2.5 px-3.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">محل الإقامة / المنطقة:</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="مثال: مصر الجديدة، القاهرة"
                    className="w-full py-2.5 px-3.5 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>

            {/* 2. Target Job & Department */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-amber-300 flex items-center gap-1.5 border-b border-white/10 pb-1.5">
                <Briefcase className="w-4 h-4" />
                <span>2. الوظيفة المرغوبة والتخصص:</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    الوظيفة المتقدم إليها <span className="text-rose-400">*</span>:
                  </label>
                  <select
                    value={form.targetJob}
                    onChange={(e) => setForm({ ...form, targetJob: e.target.value })}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="حلاق رجالي خبير VIP">💈 حلاق رجالي خبير VIP</option>
                    <option value="مساعد حلاق ومغسلة">✂️ مساعد حلاق واستشوار ومغسلة</option>
                    <option value="مصفف شعر واستشوار">💇‍♂️ كوافير ومصفف شعر</option>
                    <option value="خبيرة عناية بالبشرة وميكرو (حريمي)">🧖‍♀️ خبيرة عناية بالبشرة وميكروبليدنج</option>
                    <option value="أخصائية ليزر وتجميل (New Skin)">✨ أخصائية ليزر وديرما وتجميل</option>
                    <option value="خبيرة حمام مغربي ومساج">🌸 خبيرة حمام مغربي ودلكة ومساج</option>
                    <option value="كاشير وحسابات">💵 كاشير ومسئول خزينة</option>
                    <option value="موظف/ة استقبال وريسبشن">👩‍💼 موظف/ة استقبال وخدمة عملاء</option>
                    <option value="خدمات عامة ونظافة وضيافة">🧹 خدمات عامة ونظافة وضيافة</option>
                    <option value="مدير فرع / صالة">👔 مدير فرع / منسق صالة</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">القسم أو الكيان المفضل:</label>
                  <select
                    value={form.targetDepartment}
                    onChange={(e) => setForm({ ...form, targetDepartment: e.target.value })}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="ALL">🌟 متاح للعمل في أي قسم حسب الشاغر</option>
                    <option value="DAKN">💈 صالون دقن الباشا (رجالي VIP)</option>
                    <option value="HAMMAM">🧖‍♀️ حمام وسبا الباشا (حريمي VIP)</option>
                    <option value="NEWSKIN">✨ عيادة نيو سكين VIP (جلدية وليزر)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">سنوات الخبرة السابقة:</label>
                  <input
                    type="number"
                    min="0"
                    value={form.experienceYears}
                    onChange={(e) => setForm({ ...form, experienceYears: e.target.value })}
                    placeholder="مثال: 4"
                    className="w-full py-2.5 px-3.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">المؤهل الدراسي أو المهني:</label>
                  <input
                    type="text"
                    value={form.qualification}
                    onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                    placeholder="مثال: دبلوم / بكالوريوس / شهادة تدريب"
                    className="w-full py-2.5 px-3.5 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">الراتب المتوقع (شهرياً ج.م):</label>
                  <input
                    type="number"
                    value={form.expectedSalary}
                    onChange={(e) => setForm({ ...form, expectedSalary: e.target.value })}
                    placeholder="مثال: 7000"
                    className="w-full py-2.5 px-3.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  الصالونات أو العيادات التي عملت بها سابقاً (إن وجدت):
                </label>
                <input
                  type="text"
                  value={form.previousWorkplaces}
                  onChange={(e) => setForm({ ...form, previousWorkplaces: e.target.value })}
                  placeholder="مثال: صالون رويال مدينة نصر (سنتين)، سبا الجونة (سنة)"
                  className="w-full py-2.5 px-3.5 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* 3. Document & Photo Uploads */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-amber-300 flex items-center gap-1.5 border-b border-white/10 pb-1.5">
                <Upload className="w-4 h-4" />
                <span>3. رفع المستندات والصور (تصوير بالموبايل أو رفع ملف):</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. National ID Photo */}
                <div className="p-3 rounded-2xl bg-black/50 border border-white/10 text-center space-y-2">
                  <span className="text-[11px] font-bold text-slate-300 block">صورة بطاقة الرقم القومي:</span>
                  {form.nationalIdUrl ? (
                    <div className="relative w-full h-24 rounded-xl overflow-hidden border border-emerald-400/50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={form.nationalIdUrl} alt="البطاقة" className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 right-1 bg-emerald-500 text-black text-[9px] font-bold px-1.5 rounded">
                        تم الرفع ✓
                      </span>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-white/15 rounded-xl hover:border-amber-400 transition cursor-pointer p-2">
                      <Camera className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-[10px] text-slate-400 font-bold">
                        {uploadingField === "nationalIdUrl" ? "جارٍ الرفع..." : "التقاط أو رفع صورة البطاقة"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleFileUpload("nationalIdUrl", e.target.files[0]);
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* 2. Personal Photo */}
                <div className="p-3 rounded-2xl bg-black/50 border border-white/10 text-center space-y-2">
                  <span className="text-[11px] font-bold text-slate-300 block">الصورة الشخصية:</span>
                  {form.personalPhoto ? (
                    <div className="relative w-full h-24 rounded-xl overflow-hidden border border-emerald-400/50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={form.personalPhoto} alt="الصورة الشخصية" className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 right-1 bg-emerald-500 text-black text-[9px] font-bold px-1.5 rounded">
                        تم الرفع ✓
                      </span>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-white/15 rounded-xl hover:border-amber-400 transition cursor-pointer p-2">
                      <User className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-[10px] text-slate-400 font-bold">
                        {uploadingField === "personalPhoto" ? "جارٍ الرفع..." : "التقاط صورة سيلفي / شخصية"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="user"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleFileUpload("personalPhoto", e.target.files[0]);
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* 3. CV or Certificate */}
                <div className="p-3 rounded-2xl bg-black/50 border border-white/10 text-center space-y-2">
                  <span className="text-[11px] font-bold text-slate-300 block">شهادة التخرج / السيرة الذاتية:</span>
                  {form.cvUrl ? (
                    <div className="relative w-full h-24 rounded-xl overflow-hidden border border-emerald-400/50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={form.cvUrl} alt="شهادة" className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 right-1 bg-emerald-500 text-black text-[9px] font-bold px-1.5 rounded">
                        تم الرفع ✓
                      </span>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-white/15 rounded-xl hover:border-amber-400 transition cursor-pointer p-2">
                      <FileText className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-[10px] text-slate-400 font-bold">
                        {uploadingField === "cvUrl" ? "جارٍ الرفع..." : "رفع شهادة أو سيرة ذاتية"}
                      </span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleFileUpload("cvUrl", e.target.files[0]);
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* 4. Notes / Cover Letter */}
            <div>
              <label className="text-slate-300 font-bold block mb-1">
                نبذة عنك، ولماذا ترغب بالانضمام لمجموعة الباشا VIP؟
              </label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="اكتب نبذة مختصرة عن مهاراتك الخاصة والخدمات التي تجيدها وتميزك عن غيرك..."
                className="w-full py-2.5 px-3.5 rounded-xl bg-black/60 border border-white/10 text-white focus:outline-none focus:border-amber-400 resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || uploadingField !== null}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm transition flex items-center justify-center gap-2 shadow-2xl shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {loading
                  ? "جارٍ تسجيل طلبك وإرساله للإدارة..."
                  : uploadingField
                  ? "جارٍ رفع المستند..."
                  : "إرسال طلب التوظيف الرسمي الآن 🚀"}
              </span>
            </button>
          </form>
        )}

        {/* Footer Signature */}
        <div className="pt-3 border-t border-white/10 text-center text-[10px] text-amber-400/80 font-bold flex items-center justify-between">
          <Link href="/" className="text-slate-400 hover:text-white transition flex items-center gap-1">
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            <span>العودة لصفحة الحجز الرئيسية</span>
          </Link>
          <span>تطوير شركة أوركا للحلول البرمجية (Orca Tech) 🐬</span>
        </div>
      </div>
    </div>
  );
}
