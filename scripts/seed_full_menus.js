const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const { PrismaClient } = require("../lib/generated/client");

const rawUrl = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_ZxLPRlB4r7eD@ep-late-union-bad3s1rn-pooler.c-8.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const pool = new Pool({
  connectionString: rawUrl,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const fullServicesList = [
  // ──────────────────────────────────────────
  // 1. صالون دقن الباشا (رجالي) - DAKN EL BASHA
  // ──────────────────────────────────────────
  // قسم الحلاقة (Shaving & Hair)
  { nameAr: "حلاقة شعر", category: "HAIR", price: 180, durationMinutes: 30 },
  { nameAr: "تحديد شعر", category: "HAIR", price: 100, durationMinutes: 15 },
  { nameAr: "حلاقة شيفينج", category: "HAIR", price: 150, durationMinutes: 20 },
  { nameAr: "حلاقة ذقن", category: "BEARD", price: 100, durationMinutes: 20 },
  { nameAr: "تحديد ذقن", category: "BEARD", price: 100, durationMinutes: 15 },
  { nameAr: "حلاقة ذقن بالبخار", category: "BEARD", price: 150, durationMinutes: 25 },
  { nameAr: "صبغة ذقن (أسود أو بني)", category: "BEARD", price: 150, durationMinutes: 25 },
  { nameAr: "صبغة ذقن ألوان", category: "BEARD", price: 500, durationMinutes: 45 },
  { nameAr: "صبغة شعر (أسود أو بني)", category: "COLOR_KERATIN", price: 250, durationMinutes: 35 },
  { nameAr: "صبغة شعر ألوان وسحب لون", category: "COLOR_KERATIN", price: 700, durationMinutes: 60 },

  // قسم العناية بالبشرة (Skin Care Men)
  { nameAr: "تنظيف بشرة عادي", category: "SKIN_CARE", price: 250, durationMinutes: 30 },
  { nameAr: "تنظيف بشرة عميق بالبخار والماسك", category: "SKIN_CARE", price: 400, durationMinutes: 45 },
  { nameAr: "تنظيف بشرة هيدرافيشال كلاسيك", category: "SKIN_CARE", price: 800, durationMinutes: 60 },
  { nameAr: "تنظيف بشرة هيدرافيشال VIP ملكي", category: "SKIN_CARE", price: 1500, durationMinutes: 75 },
  { nameAr: "تنظيف بشرة أكسجينيو متقدم", category: "SKIN_CARE", price: 1200, durationMinutes: 60 },

  // قسم Body Care (باديكير رجالي)
  { nameAr: "باديكير يد رجالي", category: "BODY_CARE", price: 250, durationMinutes: 30 },
  { nameAr: "باديكير قدم رجالي", category: "BODY_CARE", price: 350, durationMinutes: 40 },
  { nameAr: "باديكير يد وقدم رجالي متكامل", category: "BODY_CARE", price: 500, durationMinutes: 60 },
  { nameAr: "باديكير علاجي للقدمين وإزالة الجلد الميت", category: "BODY_CARE", price: 450, durationMinutes: 45 },
  { nameAr: "باديكير سبا رجالي متكامل مع الشمع", category: "BODY_CARE", price: 700, durationMinutes: 60 },

  // قسم Treatment Hair (معالجات الشعر)
  { nameAr: "حمام كريم شعر مغذي بالبخار", category: "TREATMENT_HAIR", price: 300, durationMinutes: 30 },
  { nameAr: "حمام زيت Silx علاجي", category: "TREATMENT_HAIR", price: 350, durationMinutes: 30 },
  { nameAr: "حمام زيت Argan الأرجان المغربي", category: "TREATMENT_HAIR", price: 450, durationMinutes: 35 },
  { nameAr: "حمام زيت Bondex لترميم الروابط", category: "TREATMENT_HAIR", price: 650, durationMinutes: 40 },
  { nameAr: "ماسك أعشاب مغذية للشعر", category: "TREATMENT_HAIR", price: 350, durationMinutes: 30 },
  { nameAr: "تريد مينت بارد لعلاج الفروة", category: "TREATMENT_HAIR", price: 900, durationMinutes: 45 },
  { nameAr: "بروتين علاجي وفرد للشعر", category: "TREATMENT_HAIR", price: 1500, durationMinutes: 90 },
  { nameAr: "جلسة جذور كافيار محفزة للنمو", category: "TREATMENT_HAIR", price: 1200, durationMinutes: 45 },
  { nameAr: "جلسة كافيار ملكي للشعر بالكامل", category: "TREATMENT_HAIR", price: 2500, durationMinutes: 60 },
  { nameAr: "جلسة كافيار فيلر لإعادة بناء الشعر", category: "TREATMENT_HAIR", price: 3000, durationMinutes: 75 },

  // قسم الواكس (Waxing Men)
  { nameAr: "واكس بشرة الوجه بالكامل", category: "WAXING", price: 150, durationMinutes: 15 },
  { nameAr: "واكس أنف وأذن", category: "WAXING", price: 100, durationMinutes: 10 },

  // باقات الحمام الرجالي الملكي (Men Spa Baths)
  { nameAr: "حمام مغربي رجالي متكامل", category: "MEN_SPA", price: 650, durationMinutes: 60 },
  { nameAr: "حمام تركي رجالي بالفوم والصابون", category: "MEN_SPA", price: 1000, durationMinutes: 75 },
  { nameAr: "حمام إيراني رجالي استجمامي", category: "MEN_SPA", price: 1300, durationMinutes: 90 },
  { nameAr: "حمام رويال رجالي ملكي بالأعشاب والزيوت", category: "MEN_SPA", price: 1400, durationMinutes: 90 },
  { nameAr: "حمام أورينتال رجالي VIP خاص بالمسك والعود", category: "MEN_SPA", price: 1700, durationMinutes: 105 },

  // ──────────────────────────────────────────
  // 2. حمام وسبا الباشا (حريمي) - HAMMAM EL BASHA
  // ──────────────────────────────────────────
  // خدمات الحمام الحريمي الملكي (Ladies Moroccan & Turkish Baths)
  { nameAr: "الحمام المغربي الكلاسيكي الحريمي", category: "LADIES_SPA", price: 500, durationMinutes: 60 },
  { nameAr: "حمام الذهب الأزرق الحريمي (ترمس وحليب ونيلة زرقاء)", category: "LADIES_SPA", price: 600, durationMinutes: 75 },
  { nameAr: "الحمام التركي الحريمي (فوم تركي وحنة بيضاء)", category: "LADIES_SPA", price: 700, durationMinutes: 75 },
  { nameAr: "حمام الذهب الأحمر (عكر فاسي ودلكة مغربية)", category: "LADIES_SPA", price: 800, durationMinutes: 80 },
  { nameAr: "حمام الجواش الحريمي (عناية خاصة بعد الولادة)", category: "LADIES_SPA", price: 800, durationMinutes: 80 },
  { nameAr: "الحمام التونسي الملكي (الشوفان والحبوب الذهبية)", category: "LADIES_SPA", price: 900, durationMinutes: 90 },
  { nameAr: "حمام رويال الحريمي (تبريمة وتوريد وبيرفيوم باث)", category: "LADIES_SPA", price: 1000, durationMinutes: 90 },
  { nameAr: "الحمام الأورينتال الحريمي (ورد مخملي وعسل وحرير شرقي)", category: "LADIES_SPA", price: 1300, durationMinutes: 100 },
  { nameAr: "الحمام الإيراني الحريمي (أعشاب ملكية وعلاج جلد الوزة)", category: "LADIES_SPA", price: 1500, durationMinutes: 105 },
  { nameAr: "حمام الدلكة العماني (دلكة سوداني وشوكولاتة وبيرفيوم)", category: "LADIES_SPA", price: 1600, durationMinutes: 110 },
  { nameAr: "الحمام الملكي VIP الحريمي (قهوة وجوز هند وفواكه ومخمرية)", category: "LADIES_SPA", price: 1800, durationMinutes: 120 },
  { nameAr: "حمام العروسة الملكي المتكامل (ريحان وشوفان وشوكولاتة وتوريد)", category: "LADIES_SPA", price: 3200, durationMinutes: 150 },

  // قسم الشعر النسائي (Ladies Hair Salon)
  { nameAr: "قص شعر حريمي", category: "LADIES_HAIR", price: 300, durationMinutes: 45 },
  { nameAr: "قص أطراف حريمي", category: "LADIES_HAIR", price: 200, durationMinutes: 20 },
  { nameAr: "غسيل شعر حريمي بالشامبو والبلسم", category: "LADIES_HAIR", price: 100, durationMinutes: 15 },
  { nameAr: "استشوار شعر قصير", category: "LADIES_HAIR", price: 150, durationMinutes: 30 },
  { nameAr: "استشوار شعر متوسط", category: "LADIES_HAIR", price: 200, durationMinutes: 40 },
  { nameAr: "استشوار شعر طويل", category: "LADIES_HAIR", price: 250, durationMinutes: 50 },
  { nameAr: "تصفيف شعر ويفي (Wavy Style)", category: "LADIES_HAIR", price: 200, durationMinutes: 45 },
  { nameAr: "تصفيف شعر كيرلي (Curly Style)", category: "LADIES_HAIR", price: 250, durationMinutes: 45 },
  { nameAr: "تسريحة شعر بسيطة", category: "LADIES_HAIR", price: 500, durationMinutes: 60 },
  { nameAr: "تسريحة شعر سواريه للمناسبات", category: "LADIES_HAIR", price: 700, durationMinutes: 75 },
  { nameAr: "تسريحة عروسة ملكية متكاملة", category: "LADIES_HAIR", price: 1000, durationMinutes: 90 },

  // تركيب الشعر والأكستنشن (Hair Extensions)
  { nameAr: "شعر هندي طبيعي (سعر الجرام)", category: "EXTENSIONS", price: 70, durationMinutes: 60 },
  { nameAr: "شعر فيتنامي طبيعي (سعر الجرام)", category: "EXTENSIONS", price: 50, durationMinutes: 60 },
  { nameAr: "باروكة ويج شعر بديل الطبيعي بالتركيب", category: "EXTENSIONS", price: 1500, durationMinutes: 60 },
  { nameAr: "اكستنشن كلبس طبيعي (70 إلى 100 جم)", category: "EXTENSIONS", price: 3000, durationMinutes: 60 },
  { nameAr: "تركيب شعر خرز تراندت (سعر الجرام)", category: "EXTENSIONS", price: 15, durationMinutes: 60 },
  { nameAr: "تركيب شعر نانو رينج (سعر الجرام)", category: "EXTENSIONS", price: 20, durationMinutes: 60 },

  // الصبغات والتلوين الحريمي (Ladies Hair Color)
  { nameAr: "صبغة جذور حريمي", category: "LADIES_COLOR", price: 650, durationMinutes: 45 },
  { nameAr: "صبغة شعر كاملة حريمي", category: "LADIES_COLOR", price: 1000, durationMinutes: 75 },
  { nameAr: "صبغة شعر بدون أمونيا خالية من الكيماويات", category: "LADIES_COLOR", price: 1200, durationMinutes: 75 },
  { nameAr: "هايلايت خصل شعر (Highlights)", category: "LADIES_COLOR", price: 1500, durationMinutes: 90 },
  { nameAr: "لولايت شعر كلاسيك (Lowlights)", category: "LADIES_COLOR", price: 1400, durationMinutes: 90 },
  { nameAr: "بيبي لايت ناعم للشعر (Babylights)", category: "LADIES_COLOR", price: 1800, durationMinutes: 105 },
  { nameAr: "تونر رنساج للشعر (Toner)", category: "LADIES_COLOR", price: 500, durationMinutes: 30 },
  { nameAr: "سحب لون شعر آمن بدون إتلاف", category: "LADIES_COLOR", price: 1200, durationMinutes: 60 },
  { nameAr: "تصحيح لون شعر احترافي", category: "LADIES_COLOR", price: 500, durationMinutes: 60 },

  // الحواجب والرموش (Eyebrows & Lashes)
  { nameAr: "تنظيف وتهذيب حواجب", category: "BROWS_LASHES", price: 70, durationMinutes: 15 },
  { nameAr: "رسم حواجب بالحناء بايجين", category: "BROWS_LASHES", price: 150, durationMinutes: 20 },
  { nameAr: "صبغة حواجب احترافية", category: "BROWS_LASHES", price: 150, durationMinutes: 20 },
  { nameAr: "لامينيشن ورفع حواجب (Brow Lamination)", category: "BROWS_LASHES", price: 250, durationMinutes: 35 },
  { nameAr: "رفع رموش كيراتين (Lash Lift)", category: "BROWS_LASHES", price: 500, durationMinutes: 45 },
  { nameAr: "تركيب رموش هير باي هير (Classic)", category: "BROWS_LASHES", price: 350, durationMinutes: 60 },
  { nameAr: "تركيب رموش هير باي هير (Volume Lashes)", category: "BROWS_LASHES", price: 450, durationMinutes: 75 },
  { nameAr: "تركيب رموش هير باي هير (Mega Volume)", category: "BROWS_LASHES", price: 500, durationMinutes: 90 },
  { nameAr: "تركيب رموش ون باي ون شعرة بشعرة (1-by-1)", category: "BROWS_LASHES", price: 500, durationMinutes: 90 },
  { nameAr: "تركيب رموش مؤقتة شريط (One Piece Lashes)", category: "BROWS_LASHES", price: 150, durationMinutes: 15 },

  // العناية بالبشرة وتنظيف الوجه (Ladies Skin Care)
  { nameAr: "واكس بشرة الوجه حريمي", category: "LADIES_SKIN", price: 150, durationMinutes: 20 },
  { nameAr: "شيفينج ديرمابلانينج للوجه حريمي", category: "LADIES_SKIN", price: 150, durationMinutes: 25 },
  { nameAr: "تشقير حواجب حريمي", category: "LADIES_SKIN", price: 100, durationMinutes: 15 },
  { nameAr: "وجه وحواجب بالفتلة", category: "LADIES_SKIN", price: 100, durationMinutes: 25 },
  { nameAr: "تنظيف بشرة كلاسيك بالبخار والماسك", category: "LADIES_SKIN", price: 300, durationMinutes: 40 },
  { nameAr: "تنظيف بشرة عميق وتطهير المسام", category: "LADIES_SKIN", price: 450, durationMinutes: 50 },
  { nameAr: "تنظيف بشرة ألترا سونيك بالموجات", category: "LADIES_SKIN", price: 650, durationMinutes: 60 },
  { nameAr: "تنظيف بشرة أكسجينيو متقدم", category: "LADIES_SKIN", price: 1200, durationMinutes: 60 },
  { nameAr: "جلسة هيدرافيشال متكاملة", category: "LADIES_SKIN", price: 850, durationMinutes: 60 },
  { nameAr: "جلسة هيدرافيشال VIP مع أمبولات نضارة", category: "LADIES_SKIN", price: 1500, durationMinutes: 75 },
  { nameAr: "ديرما بلانينج لإزالة الجلد الميت ونضارة فورية", category: "LADIES_SKIN", price: 200, durationMinutes: 30 },
  { nameAr: "جلسة ديرما بن مع السيروم المغذي", category: "LADIES_SKIN", price: 350, durationMinutes: 45 },

  // الماسكات الإضافية للجسم والسبا (Additional Body Masks)
  { nameAr: "ماسك طمي عطري للجسم", category: "BODY_MASKS", price: 200, durationMinutes: 20 },
  { nameAr: "ماسك حنة بيضاء عطرية لتفتيح الجسم", category: "BODY_MASKS", price: 250, durationMinutes: 20 },
  { nameAr: "ماسك الترمس المطحون لتنقية البشرة", category: "BODY_MASKS", price: 200, durationMinutes: 20 },
  { nameAr: "ماسك الحرير الشرقي لنعومة فائقة", category: "BODY_MASKS", price: 350, durationMinutes: 25 },
  { nameAr: "ماسك الورد المخملي برائحة تدوم", category: "BODY_MASKS", price: 350, durationMinutes: 25 },
  { nameAr: "ماسك الشوفان المهدئ للبشرة الحساسة", category: "BODY_MASKS", price: 300, durationMinutes: 20 },
  { nameAr: "ماسك الأعشاب الملكية النادرة", category: "BODY_MASKS", price: 300, durationMinutes: 20 },
  { nameAr: "خلطة الحبوب الذهبية للتفتيح والنضارة", category: "BODY_MASKS", price: 350, durationMinutes: 25 },
  { nameAr: "خلطة الحبوب الملكية المغذية", category: "BODY_MASKS", price: 400, durationMinutes: 25 },
  { nameAr: "ماسك الملكة الخاص بسبا الباشا", category: "BODY_MASKS", price: 250, durationMinutes: 20 },
  { nameAr: "ماسك الورد الملكي المعطر", category: "BODY_MASKS", price: 350, durationMinutes: 25 },
  { nameAr: "ماسك الشيكولاتة الخام المرطبة", category: "BODY_MASKS", price: 300, durationMinutes: 20 },
  { nameAr: "ماسك التوريد للجسم والمناطق الحساسة", category: "BODY_MASKS", price: 250, durationMinutes: 20 },
  { nameAr: "ماسك القهوة المقشر ومكافح السيلوليت", category: "BODY_MASKS", price: 200, durationMinutes: 20 },
  { nameAr: "ماسك جوز الهند الطبيعي فائق الترطيب", category: "BODY_MASKS", price: 350, durationMinutes: 25 },
  { nameAr: "سكراب تقشير عميق لليدين والقدمين", category: "BODY_MASKS", price: 150, durationMinutes: 15 },
  { nameAr: "جلسة برفيوم باث عطرية فاخرة", category: "BODY_MASKS", price: 350, durationMinutes: 30 },
  { nameAr: "جلسة تبريمة مغربية أصلية لتجديد الجلد", category: "BODY_MASKS", price: 300, durationMinutes: 25 },
  { nameAr: "ماسك النيلة الزرقاء الملكية المغربية", category: "BODY_MASKS", price: 350, durationMinutes: 25 },
  { nameAr: "دلكة بالعكر الفاسي المغربي الأصلي", category: "BODY_MASKS", price: 450, durationMinutes: 30 },
  { nameAr: "جلسة دلكة سودانية لتفتيح الجسم", category: "BODY_MASKS", price: 400, durationMinutes: 30 },
  { nameAr: "جلسة تفتيح بالأعشاب الطبيعية", category: "BODY_MASKS", price: 300, durationMinutes: 25 },
  { nameAr: "جلسة صابون مغربي بالعكر الفاسي", category: "BODY_MASKS", price: 200, durationMinutes: 20 },
  { nameAr: "ماسك العود الفاخر ومسك الطهارة الملكي", category: "BODY_MASKS", price: 400, durationMinutes: 30 },

  // قسم الميكاب (Ladies Makeup)
  { nameAr: "ميكاب سواريه للمناسبات", category: "MAKEUP", price: 700, durationMinutes: 60 },
  { nameAr: "هاي سواريه فخم (High Soirée Makeup)", category: "MAKEUP", price: 1500, durationMinutes: 75 },
  { nameAr: "ميكاب خطوبة ملكي مع مثبت يدوم", category: "MAKEUP", price: 4000, durationMinutes: 90 },
  { nameAr: "ميكاب زفاف عروسة ملكي VIP كامل", category: "MAKEUP", price: 6000, durationMinutes: 120 },

  // إزالة الشعر بالسويت والواكس (Wax & Sweet)
  { nameAr: "إزالة شعر نصف ذراع (سويت)", category: "WAX_SWEET", price: 100, durationMinutes: 15 },
  { nameAr: "إزالة شعر نصف ذراع (واكس)", category: "WAX_SWEET", price: 150, durationMinutes: 15 },
  { nameAr: "إزالة شعر ذراع كامل (سويت)", category: "WAX_SWEET", price: 150, durationMinutes: 25 },
  { nameAr: "إزالة شعر ذراع كامل (واكس)", category: "WAX_SWEET", price: 250, durationMinutes: 25 },
  { nameAr: "إزالة شعر نصف رجل (سويت)", category: "WAX_SWEET", price: 150, durationMinutes: 20 },
  { nameAr: "إزالة شعر نصف رجل (واكس)", category: "WAX_SWEET", price: 250, durationMinutes: 20 },
  { nameAr: "إزالة شعر رجل كاملة (سويت)", category: "WAX_SWEET", price: 250, durationMinutes: 35 },
  { nameAr: "إزالة شعر رجل كاملة (واكس)", category: "WAX_SWEET", price: 350, durationMinutes: 35 },
  { nameAr: "إزالة شعر البطن (سويت)", category: "WAX_SWEET", price: 100, durationMinutes: 15 },
  { nameAr: "إزالة شعر البطن (واكس)", category: "WAX_SWEET", price: 150, durationMinutes: 15 },
  { nameAr: "إزالة شعر الظهر (سويت)", category: "WAX_SWEET", price: 200, durationMinutes: 20 },
  { nameAr: "إزالة شعر الظهر (واكس)", category: "WAX_SWEET", price: 250, durationMinutes: 20 },
  { nameAr: "إزالة شعر البكيني (سويت)", category: "WAX_SWEET", price: 150, durationMinutes: 20 },
  { nameAr: "إزالة شعر البكيني (واكس)", category: "WAX_SWEET", price: 200, durationMinutes: 20 },
  { nameAr: "إزالة شعر أندر آرم (سويت)", category: "WAX_SWEET", price: 100, durationMinutes: 10 },
  { nameAr: "إزالة شعر أندر آرم (واكس)", category: "WAX_SWEET", price: 150, durationMinutes: 10 },
  { nameAr: "إزالة شعر جسم كامل (سويت)", category: "WAX_SWEET", price: 500, durationMinutes: 60 },
  { nameAr: "إزالة شعر جسم كامل (واكس)", category: "WAX_SWEET", price: 700, durationMinutes: 60 },

  // مانيكير وباديكير وأظافر (Nails & Pedicure)
  { nameAr: "مانيكير كلاسيك لليدين", category: "NAILS", price: 50, durationMinutes: 20 },
  { nameAr: "باديكير كلاسيك للقدمين", category: "NAILS", price: 300, durationMinutes: 40 },
  { nameAr: "مانيكير وباديكير متكاملين", category: "NAILS", price: 350, durationMinutes: 50 },
  { nameAr: "باديكير علاجي لإزالة التشققات والجلد الميت", category: "NAILS", price: 350, durationMinutes: 45 },
  { nameAr: "سبا فاخر لليدين مع مساج وتقشير", category: "NAILS", price: 300, durationMinutes: 30 },
  { nameAr: "سبا فاخر للقدمين مع مساج وماسك", category: "NAILS", price: 400, durationMinutes: 45 },
  { nameAr: "طلاء أظافر جل بوليش يدوم طويلاً", category: "NAILS", price: 250, durationMinutes: 30 },
  { nameAr: "إزالة جل بوليش آمنة بدون إجهاد الأظافر", category: "NAILS", price: 200, durationMinutes: 20 },
  { nameAr: "تركيب أظافر فيك نيلز مع طلاء", category: "NAILS", price: 350, durationMinutes: 40 },
  { nameAr: "جلسة بناء أظافر هارد جيل (Hard Gel)", category: "NAILS", price: 450, durationMinutes: 60 },
  { nameAr: "تركيب أظافر أكريليك كاملة (Acrylic Nails)", category: "NAILS", price: 500, durationMinutes: 75 },
  { nameAr: "رسم وتصميم نيل آرت مخصص (Nail Art)", category: "NAILS", price: 50, durationMinutes: 15 },
  { nameAr: "جلسة شمع البارافين الدافئ لليدين", category: "NAILS", price: 250, durationMinutes: 25 },
  { nameAr: "جلسة شمع البارافين الدافئ للقدمين", category: "NAILS", price: 300, durationMinutes: 30 },

  // المساج والاسترخاء والحجامة (Massage & Cupping)
  { nameAr: "مساج سويدي استرخائي (30 دقيقة)", category: "MASSAGE", price: 500, durationMinutes: 30 },
  { nameAr: "مساج سويدي استرخائي (50 دقيقة)", category: "MASSAGE", price: 900, durationMinutes: 50 },
  { nameAr: "مساج ميديام لفك العضلات (30 دقيقة)", category: "MASSAGE", price: 500, durationMinutes: 30 },
  { nameAr: "مساج ميديام لفك العضلات (50 دقيقة)", category: "MASSAGE", price: 900, durationMinutes: 50 },
  { nameAr: "مساج هارد عميق لإجهاد العضلات (50 دقيقة)", category: "MASSAGE", price: 950, durationMinutes: 50 },
  { nameAr: "مساج ميديكال علاجي للمفاصل والظهر (50 دقيقة)", category: "MASSAGE", price: 1000, durationMinutes: 50 },
  { nameAr: "مساج الأحجار الساخنة هوت ستون (50 دقيقة)", category: "MASSAGE", price: 1100, durationMinutes: 50 },
  { nameAr: "هيد مساج استرخائي لفروة الرأس والرقبة (30 دقيقة)", category: "MASSAGE", price: 300, durationMinutes: 30 },
  { nameAr: "هيد مساج استرخائي مع حمام كريم للشعر", category: "MASSAGE", price: 450, durationMinutes: 40 },
  { nameAr: "هيد مساج وترطيب عميق للشعر (Hair Hydration)", category: "MASSAGE", price: 550, durationMinutes: 45 },
  { nameAr: "جلسة حجامة جافة ورطبة للظهر", category: "MASSAGE", price: 600, durationMinutes: 45 },
  { nameAr: "جلسة حجامة علاجية لكامل الجسم", category: "MASSAGE", price: 1200, durationMinutes: 75 },

  // ──────────────────────────────────────────
  // 3. عيادة نيو سكين (New Skin Aesthetic Clinic)
  // ──────────────────────────────────────────
  { nameAr: "جلسة إزالة شعر فل بدي بالليزر مع رتوش مجانية", category: "NEWSKIN_LASER", price: 1100, durationMinutes: 60 },
  { nameAr: "جلسة ليزر مناطق حساسة (بكيني + أندر آرم) مع رتوش", category: "NEWSKIN_LASER", price: 350, durationMinutes: 30 },
  { nameAr: "جلسة ليزر الوجه والرقبة بالكامل (تحديد ونضارة)", category: "NEWSKIN_LASER", price: 250, durationMinutes: 25 },
  { nameAr: "جلسة ليزر نصف جسم (أرجل كاملة أو أذرع كاملة)", category: "NEWSKIN_LASER", price: 450, durationMinutes: 40 },
  { nameAr: "باقة نبضات ليزر مخصصة (تحديد رتوش ومناطق صغيرة)", category: "NEWSKIN_LASER", price: 200, durationMinutes: 20 },
  { nameAr: "مايكروبليدينج حواجب شعرة شعرة 6D Nano (طبيعي وانسيابي)", category: "NEWSKIN_MICRO", price: 1200, durationMinutes: 90 },
  { nameAr: "مايكروشيدينج بودر وتوريد شفايف ناعم (Lip Blush)", category: "NEWSKIN_MICRO", price: 950, durationMinutes: 75 },
  { nameAr: "مايكرونيدلينج نضارة البشرة مع الكولاجين ومضادات الأكسدة", category: "NEWSKIN_MICRO", price: 450, durationMinutes: 45 },
  { nameAr: "جلسة ديرمابن نضارة متقدمة (Dermapen + Hyaluronic Acid)", category: "NEWSKIN_DERMA", price: 400, durationMinutes: 45 },
  { nameAr: "جلسة ميزوثيرابي علاج التصبغات وتوحيد لون البشرة", category: "NEWSKIN_DERMA", price: 550, durationMinutes: 45 },
  { nameAr: "جلسة تقشير كيميائي / بارد علاجي لتجديد طبقات الجلد", category: "NEWSKIN_DERMA", price: 500, durationMinutes: 45 },
  { nameAr: "باديكير سبا إيطالي علاجي (تنظيف وتقشير عميق وتوريد)", category: "NEWSKIN_PEDICURE", price: 250, durationMinutes: 40 },
  { nameAr: "باديكير برافين دافئ لليدين والقدمين مع مساج استرخائي", category: "NEWSKIN_PEDICURE", price: 350, durationMinutes: 50 },
  { nameAr: "جلسة ترميم وعناية بالأظافر مع ماسك الكولاجين", category: "NEWSKIN_PEDICURE", price: 200, durationMinutes: 30 }
];

async function main() {
  console.log("Seeding all official services from Dakn, Hammam, and New Skin...");
  let createdCount = 0;
  let updatedCount = 0;

  for (const s of fullServicesList) {
    const existing = await prisma.service.findFirst({
      where: { nameAr: s.nameAr }
    });

    if (existing) {
      await prisma.service.update({
        where: { id: existing.id },
        data: {
          category: s.category,
          price: s.price,
          durationMinutes: s.durationMinutes
        }
      });
      updatedCount++;
    } else {
      await prisma.service.create({
        data: {
          nameAr: s.nameAr,
          category: s.category,
          price: s.price,
          durationMinutes: s.durationMinutes
        }
      });
      createdCount++;
    }
  }

  const total = await prisma.service.count();
  console.log(`Finished seeding! Created: ${createdCount}, Updated: ${updatedCount}, Total services in DB: ${total}`);
}

main().catch(console.error).finally(() => pool.end());
