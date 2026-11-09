import "dotenv/config";
import { PrismaClient } from "../lib/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const rawUrl =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_ZxLPRlB4r7eD@ep-late-union-bad3s1rn-pooler.c-8.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const pool = new Pool({
  connectionString: rawUrl,
  ssl: { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool, { schema: "public" });
const prisma = new PrismaClient({ adapter });

async function seed() {
  console.log("👑 Starting Dakn El Basha & Hammam El Basha DB Seed...");

  // 1. System Settings
  await prisma.systemSettings.upsert({
    where: { id: "default-settings" },
    update: {
      salonNameAr: "مجموعة صالونات وسبا الباشا VIP (دقن الباشا & حمام الباشا)",
      salonNameEn: "EL BASHA LUXURY SALON & SPA",
      logoUrl: "/dakn-logo.jpg",
      hadayekPhone: "01061301780",
      nasrCityPhone: "01556782015",
      hotline: "19555",
      whatsappNumber: "01061301780",
      facebookUrl: "https://www.facebook.com/DaknElbashaSalon",
      defaultOpenHour: "11:00 AM",
      defaultCloseHour: "01:00 AM",
    },
    create: {
      id: "default-settings",
      salonNameAr: "مجموعة صالونات وسبا الباشا VIP (دقن الباشا & حمام الباشا)",
      salonNameEn: "EL BASHA LUXURY SALON & SPA",
      logoUrl: "/dakn-logo.jpg",
      systemLocked: false,
      lockMessage: "النظام مغلق مؤقتاً لأعمال الصيانة والتطوير الدوري.",
      hadayekPhone: "01061301780",
      nasrCityPhone: "01556782015",
      hotline: "19555",
      whatsappNumber: "01061301780",
      facebookUrl: "https://www.facebook.com/DaknElbashaSalon",
      defaultOpenHour: "11:00 AM",
      defaultCloseHour: "01:00 AM",
    },
  });
  console.log("✅ System Settings seeded");

  // 2. Branches: Branch 1 = دقن الباشا (رجالي) / Branch 2 = حمام الباشا (حريمي)
  const daknBranch = await prisma.branch.upsert({
    where: { code: "BR-DAKN-MEN" },
    update: {
      name: "فرع صالون دقن الباشا (رجالي VIP)",
      address: "73 شارع ترعة الجبل، أمام مستشفى سان بول، حدائق القبة، القاهرة",
      phone: "01061301780",
      whatsapp: "01061301780",
    },
    create: {
      name: "فرع صالون دقن الباشا (رجالي VIP)",
      code: "BR-DAKN-MEN",
      address: "73 شارع ترعة الجبل، أمام مستشفى سان بول، حدائق القبة، القاهرة",
      phone: "01061301780",
      whatsapp: "01061301780",
      googleMapsUrl: "https://maps.google.com/?q=73+Teraet+El+Gabal+Hadayek+El+Kobba+Cairo",
      isActive: true,
    },
  });

  const hammamBranch = await prisma.branch.upsert({
    where: { code: "BR-HAMMAM-WOMEN" },
    update: {
      name: "فرع حمام الباشا (حريمي وسبا VIP)",
      address: "84 ترعة الجبل، كينج بارك مول، أمام مستشفى سان بولا، حدائق القبة، القاهرة",
      phone: "01556782015",
      whatsapp: "01556782015",
    },
    create: {
      name: "فرع حمام الباشا (حريمي وسبا VIP)",
      code: "BR-HAMMAM-WOMEN",
      address: "84 ترعة الجبل، كينج بارك مول، أمام مستشفى سان بولا، حدائق القبة، القاهرة",
      phone: "01556782015",
      whatsapp: "01556782015",
      googleMapsUrl: "https://maps.google.com/?q=King+Park+Mall+Teraet+El+Gabal+Hadayek+El+Kobba+Cairo",
      isActive: true,
    },
  });
  console.log("✅ Branches seeded: دقن الباشا (رجالي) + حمام الباشا (حريمي)");

  // 3. Users
  await prisma.user.upsert({
    where: { username: "maestro" },
    update: {
      passwordHash: "password123",
      pin: "157230",
      role: "owner",
    },
    create: {
      name: "أ / حمزة عباس (المايسترو - المالك)",
      username: "maestro",
      passwordHash: "password123",
      pin: "157230",
      phone: "01061301780",
      role: "owner",
      branchId: null,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { username: "gm-basha" },
    update: {
      passwordHash: "password123",
      pin: "157230",
      role: "general_manager",
    },
    create: {
      name: "كابتن الباشا (المدير العام للمجموعة)",
      username: "gm-basha",
      passwordHash: "password123",
      pin: "157230",
      phone: "01061301780",
      role: "general_manager",
      branchId: null,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { username: "cashier-dakn" },
    update: {
      passwordHash: "password123",
      pin: "1234",
      branchId: daknBranch.id,
    },
    create: {
      name: "كاشير دقن الباشا (رجالي)",
      username: "cashier-dakn",
      passwordHash: "password123",
      pin: "1234",
      phone: "01061301780",
      role: "cashier",
      branchId: daknBranch.id,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { username: "cashier-hammam" },
    update: {
      passwordHash: "password123",
      pin: "1234",
      branchId: hammamBranch.id,
    },
    create: {
      name: "كاشير حمام الباشا (حريمي)",
      username: "cashier-hammam",
      passwordHash: "password123",
      pin: "1234",
      phone: "01556782015",
      role: "cashier",
      branchId: hammamBranch.id,
      isActive: true,
    },
  });
  console.log("✅ Users seeded (Owner, GM, 2 Cashiers)");

  // 4. Specialists (Men for Dakn El Basha, Women for Hammam El Basha)
  // Clean existing specialists to avoid duplication
  await prisma.specialist.deleteMany({});

  const menSpecialists = [
    {
      name: "كابتن حسام الباشا",
      title: "كبير مصففي دقن الباشا وخبير تدريج الشعر الملكي",
      phone: "01061301781",
      chairNumber: 1,
      commissionRate: 25,
      branchId: daknBranch.id,
      rating: 4.95,
      photo: "/Images/سيروم اللحية الفاخر بزيت الأرجان وزبدة الشيا.jpg",
    },
    {
      name: "كابتن إسلام سيف",
      title: "أخصائي تنظيف البشرة المائي وعلاج الشعر بالبروتين",
      phone: "01061301782",
      chairNumber: 2,
      commissionRate: 20,
      branchId: daknBranch.id,
      rating: 4.9,
      photo: "/Images/ماسك الفحم الكوري لتنظيف وتنعيم مسام الوجه.webp",
    },
    {
      name: "كابتن كريم عبد العزيز",
      title: "مصفف وخبير حلاقة ورسم اللحية بالموس الإيطالي",
      phone: "01061301783",
      chairNumber: 3,
      commissionRate: 20,
      branchId: daknBranch.id,
      rating: 4.88,
      photo: "/Images/كريم حلاقة وتليين ذقن بالنعناع والمنثول (برطمان 500 مل).jpg",
    },
    {
      name: "كابتن زياد المغربي",
      title: "أخصائي الحمام المغربي والمساج والجاكوزي الرجالي",
      phone: "01061301784",
      chairNumber: 4,
      commissionRate: 25,
      branchId: daknBranch.id,
      rating: 4.98,
      photo: "/Images/شمع شعر عنبر تثبيت 24 ساعة (Strong Wax).webp",
    },
  ];

  for (const s of menSpecialists) {
    await prisma.specialist.create({
      data: {
        name: s.name,
        title: s.title,
        phone: s.phone,
        chairNumber: s.chairNumber,
        commissionRate: s.commissionRate,
        branchId: s.branchId,
        rating: s.rating,
        photo: s.photo,
        status: "AVAILABLE",
        statusReason: "جاهز ومتاح لاستقبال الزبائن على الكرسي 🟢",
        isActive: true,
      },
    });
  }

  const womenSpecialists = [
    {
      name: "مدام أمينة المغربية",
      title: "كبيرة خبيرات الحمام المغربي الملكي والدلكة السودانية",
      phone: "01556782016",
      chairNumber: 1,
      commissionRate: 25,
      branchId: hammamBranch.id,
      rating: 4.99,
      photo: "/Images/مناشف قطنية بيضاء فاخرة مطرزة بشعار صدام VIP.jpg",
    },
    {
      name: "أ/ مروة فؤاد",
      title: "أخصائية العناية بالبشرة والهيدروفيشل وميزوثيرابي النضارة",
      phone: "01556782017",
      chairNumber: 2,
      commissionRate: 20,
      branchId: hammamBranch.id,
      rating: 4.92,
      photo: "/Images/ماسك الفحم الكوري لتنظيف وتنعيم مسام الوجه.webp",
    },
    {
      name: "أ/ ياسمين الشريف",
      title: "خبيرة فرد وعلاج الشعر بالبروتين والصبغات الأوروبية",
      phone: "01556782018",
      chairNumber: 3,
      commissionRate: 22,
      branchId: hammamBranch.id,
      rating: 4.89,
      photo: "/Images/صبغة شعر إسبانية لانمي كولاج (أسود ملكي  بني شوكولاتة).jpg",
    },
    {
      name: "أ/ سارة نور",
      title: "أخصائية المساج الاسترخائي والجاكوزي وباديكير العرائس",
      phone: "01556782019",
      chairNumber: 4,
      commissionRate: 25,
      branchId: hammamBranch.id,
      rating: 4.96,
      photo: "/Images/سيروم اللحية الفاخر بزيت الأرجان وزبدة الشيا.jpg",
    },
  ];

  for (const s of womenSpecialists) {
    await prisma.specialist.create({
      data: {
        name: s.name,
        title: s.title,
        phone: s.phone,
        chairNumber: s.chairNumber,
        commissionRate: s.commissionRate,
        branchId: s.branchId,
        rating: s.rating,
        photo: s.photo,
        status: "AVAILABLE",
        statusReason: "جاهزة ومتاحة لاستقبال العميلات في السبا 🟢",
        isActive: true,
      },
    });
  }
  console.log("✅ 8 Specialists seeded (4 Men for Dakn El Basha + 4 Women for Hammam El Basha)");

  // 5. Services (Clean and Seed)
  await prisma.service.deleteMany({});

  const services = [
    // --- MEN'S SERVICES (دقن الباشا) ---
    {
      nameAr: "حلاقة شعر هيبة الباشا الملكية (Classic & Fade Cut)",
      nameEn: "Royal Basha Classic Cut",
      category: "HAIR",
      price: 160,
      durationMinutes: 30,
      description: "قص وتدريج احترافي بأحدث صيحات الموضة العالمية مع غسيل وسيشوار تركي.",
      image: "/services/service-styling.webp",
      sortOrder: 1,
    },
    {
      nameAr: "تحديد وحلاقة ذقن بالبخار والموس الإيطالي",
      nameEn: "Italian Steam Beard Grooming",
      category: "BEARD",
      price: 110,
      durationMinutes: 25,
      description: "رسم وتحديد الذقن بالخيط والموس مع حمام بخار ساخن وترطيب بالزيوت الطبيعية.",
      image: "/services/service-styling.webp",
      sortOrder: 2,
    },
    {
      nameAr: "باكيدج دقن الباشا الملكي VIP (شعر + دقن + حمام زيت)",
      nameEn: "Dakn El Basha VIP Royal Combo",
      category: "VIP_PACKAGES",
      price: 330,
      durationMinutes: 60,
      description: "تجربة ملكية كاملة: قص شعر استثنائي + تحديد دقن بالبخار + حمام زيت ساخن وتدليك فروة الرأس.",
      image: "/services/service-styling.webp",
      sortOrder: 3,
    },
    {
      nameAr: "جلسة تنظيف وبخار وتقشير البشرة (Deep Hydro-Facial)",
      nameEn: "Deep Hydro-Facial Session",
      category: "SKIN_CARE",
      price: 220,
      durationMinutes: 40,
      description: "جلسة هيدروفيشل متكاملة لإزالة الرؤوس السوداء مع ماسك الفحم الكوري وترطيب عميق.",
      image: "/services/service-facial.webp",
      sortOrder: 4,
    },
    {
      nameAr: "فرد الشعر بالبروتين والمعالج البرازيلي",
      nameEn: "Brazilian Nano Protein Treatment",
      category: "COLOR_KERATIN",
      price: 650,
      durationMinutes: 90,
      description: "فرد علاجي طبيعي آمن خالٍ من الفورمالين يعيد النعومة واللمعان الطبيعي لشعرك.",
      image: "/services/service-protein.jpg",
      sortOrder: 5,
    },
    {
      nameAr: "صبغة شعر وإخفاء الشيب وتلوين احترافي للرجال",
      nameEn: "Men Hair Color & Gray Blending",
      category: "COLOR_KERATIN",
      price: 260,
      durationMinutes: 45,
      description: "صبغات أوروبية أصلية تدوم طويلاً وتمنحك لوناً طبيعياً متجانساً ومشرقاً.",
      image: "/services/service-color.jpg",
      sortOrder: 6,
    },
    {
      nameAr: "حمام مغربي رجالي ملكي متكامل + ساونا وجاكوزي",
      nameEn: "Men Royal Moroccan Bath & Sauna",
      category: "VIP_PACKAGES",
      price: 450,
      durationMinutes: 60,
      description: "جلسة استرخاء رجالية كاملة بالصابون المغربي والليفة الأصلية وغرفة البخار والجاكوزي.",
      image: "/services/service-pedicure.jpg",
      sortOrder: 7,
    },
    {
      nameAr: "باديكير رجالي متكامل وعناية باليدين والأظافر",
      nameEn: "Men Royal Spa Pedicure",
      category: "BEARD",
      price: 220,
      durationMinutes: 40,
      description: "إزالة الجلد الميت وتقليم وتنظيف الأظافر مع سكراب استرخائي لليدين والقدمين.",
      image: "/services/service-pedicure.jpg",
      sortOrder: 8,
    },
    {
      nameAr: "حلاقة أطفال مريحة ومرحة (Kids Cut)",
      nameEn: "Kids Cut Experience",
      category: "KIDS",
      price: 110,
      durationMinutes: 20,
      description: "قصات شعر مبهجة للأبطال الصغار مع كرسي خاص بالأطفال وترفيه.",
      image: "/services/service-kids.jpg",
      sortOrder: 9,
    },

    // --- WOMEN'S SERVICES (حمام الباشا) ---
    {
      nameAr: "حمام مغربي تركي ملكي متكامل للسيدات",
      nameEn: "Ladies Royal Moroccan Turkish Bath",
      category: "LADIES_SPA",
      price: 480,
      durationMinutes: 60,
      description: "جلسة دلال ملكية بالصابون البلدي المغربي والليفة الأصلية وإزالة الجلد الميت وتفتيح المسام.",
      image: "/services/service-pedicure.jpg",
      sortOrder: 10,
    },
    {
      nameAr: "جلسة طمي مغربي أصلي ودلكة سودانية لتفتيح الجسم",
      nameEn: "Original Moroccan Clay & Sudanese Dilka",
      category: "LADIES_SPA",
      price: 350,
      durationMinutes: 45,
      description: "خلطة تفتيح ونعومة ونضارة فائقة لكامل الجسم بالطمي البركاني المغربي وماء الورد.",
      image: "/services/service-facial.webp",
      sortOrder: 11,
    },
    {
      nameAr: "جلسة جاكوزي دافئ بماء الورد والزيوت العطرية",
      nameEn: "Rose Water Warm Jacuzzi Session",
      category: "LADIES_SPA",
      price: 250,
      durationMinutes: 30,
      description: "استرخاء عضلي ونفسي كامل في مياه الجاكوزي الدافئة الغنية بخلاصة الورد والزيوت العطرية.",
      image: "/services/service-pedicure.jpg",
      sortOrder: 12,
    },
    {
      nameAr: "جلسة ساونا وبخار بالأعشاب الطبيعية واللافندر",
      nameEn: "Herbal & Lavender Steam Sauna",
      category: "LADIES_SPA",
      price: 200,
      durationMinutes: 30,
      description: "تنشيط الدورة الدموية وطرد السموم مع استنشاق بخار اللافندر والبابونج المهدئ للأعصاب.",
      image: "/services/service-facial.webp",
      sortOrder: 13,
    },
    {
      nameAr: "مساج استرخائي فرعوني للسيدات بالزيوت العطرية (45 د)",
      nameEn: "Pharaonic Relaxing Oil Massage (45m)",
      category: "LADIES_SPA",
      price: 450,
      durationMinutes: 45,
      description: "تدليك استرخائي كامل لفك تشنجات الجسم والظهر والرقبة بأيدي خبيرات مساج متمرسات.",
      image: "/services/service-pedicure.jpg",
      sortOrder: 14,
    },
    {
      nameAr: "تنظيف بشرة مائي هيدروفيشل + ماسك الذهب الكوري 24K",
      nameEn: "HydraFacial 24K Gold Mask Session",
      category: "LADIES_SKIN",
      price: 280,
      durationMinutes: 50,
      description: "تنظيف عميق للمسام وتقشير مائي ماسي مع ترطيب بكولاجين الذهب الكوري لإشراقة ونضارة ملحوظة.",
      image: "/services/service-facial.webp",
      sortOrder: 15,
    },
    {
      nameAr: "باديكير ومانيكير سبا متكامل مع ماسك الشمع والبارافين",
      nameEn: "Ladies Spa Pedicure & Paraffin Mask",
      category: "LADIES_SPA",
      price: 250,
      durationMinutes: 45,
      description: "عناية فائقة بالأظافر واليدين والقدمين مع حمام الشمع والبارافين لتنعيم فائق وتوريد القدمين.",
      image: "/services/service-pedicure.jpg",
      sortOrder: 16,
    },
    {
      nameAr: "تصفيف وسيشوار وبيبي ليس ملكي للشعر (Royal Blowout)",
      nameEn: "Royal Ladies Blowout & Styling",
      category: "LADIES_HAIR",
      price: 150,
      durationMinutes: 30,
      description: "غسيل شعر احترافي بحمام كريم وتصفيف ناعم ومموج بأحدث أدوات السيشوار والبيبي ليس.",
      image: "/services/service-styling.webp",
      sortOrder: 17,
    },
    {
      nameAr: "فرد ومعالجة الشعر بالبروتين والنانو ثيرابي البرازيلي",
      nameEn: "Ladies Brazilian Nano Therapy Hair Treatment",
      category: "LADIES_HAIR",
      price: 850,
      durationMinutes: 120,
      description: "علاج مكثف لتقصف وتجعد الشعر يمنحك نعومة حريرية ولمعاناً فائقاً يدوم لشهور.",
      image: "/services/service-protein.jpg",
      sortOrder: 18,
    },
    {
      nameAr: "صبغة شعر حريمي كولاجين إسباني وسحب لون آمن",
      nameEn: "Ladies Collagen Hair Color & Tone",
      category: "LADIES_HAIR",
      price: 450,
      durationMinutes: 60,
      description: "تلوين شعر بأحدث الألوان العصرية (بلوند، تشوكليت، زيتوني) بخامات أصلية مغذية للشعر.",
      image: "/services/service-color.jpg",
      sortOrder: 19,
    },
  ];

  for (const s of services) {
    await prisma.service.create({ data: s });
  }
  console.log("✅ 19 Services seeded (Men + Women)");

  // 6. Royal Offers (Clean and Seed)
  await prisma.offer.deleteMany({});

  const offers = [
    // --- MEN'S OFFERS (دقن الباشا) ---
    {
      titleAr: "باقة عريس الباشا الملكي المتكاملة (Groom VIP Experience)",
      badge: "العرض الأقوى للعرسان 👑",
      price: 3200,
      oldPrice: 4200,
      discountPercent: 24,
      image: "/offers/offer-groom-vip-3500-full.jpg",
      description:
        "قص وتدريج شعر + تحديد دقن بالبخار + تنظيف بشرة هيدروفيشل 11 مرحلة + وكس للبشرة + صبغة شعر ولحية + حمام مغربي ملكي + ساونا وجاكوزي + مساج + سيشوار وتثبيت اللوك + شاور وتعطير كامل + ضيافة ملكية خاصة.",
      features: JSON.stringify([
        "قص وتدريج شعر ملكي",
        "تحديد ذقن بالبخار والموس",
        "تنظيف بشرة هيدروفيشل 11 مرحلة",
        "حمام مغربي رجالي ملكي",
        "ساونا وجاكوزي ومساج كامل",
        "شاور وتعطير الباشا",
      ]),
      branchId: daknBranch.id,
      sortOrder: 1,
    },
    {
      titleAr: "عرض العناية الفاخر بالباشا (VIP Care Package)",
      badge: "الأكثر طلباً للشباب 🌟",
      price: 1299,
      oldPrice: 1800,
      discountPercent: 28,
      image: "/offers/offer-vip-care-1499.jpg",
      description:
        "خدمات متكاملة للعناية بمظهرك: قص شعر + تحديد الذقن بالبخار + سيشوار وتثبيت اللوك + تنظيف بشرة سوفت هيدروفيشل + باديكير يد وقدمين + شاور وتعطير الباشا.",
      features: JSON.stringify([
        "قص شعر + دقن بالبخار",
        "تنظيف بشرة سوفت",
        "باديكير يد وقدمين",
        "سيشوار وتثبيت اللوك",
      ]),
      branchId: daknBranch.id,
      sortOrder: 2,
    },
    {
      titleAr: "كومبو الباشا السريع (شعر + دقن بالبخار + غسيل وسيشوار)",
      badge: "عرض التوفير الأسبوعي ⚡",
      price: 299,
      oldPrice: 390,
      discountPercent: 23,
      image: "/offers/offer-combo-299.jpg",
      description:
        "قص شعر + تحديد دقن بالبخار + غسيل الشعر بحمام كريم + سيشوار وترتيب المظهر في نصف ساعة فقط.",
      features: JSON.stringify([
        "قص شعر ملكي",
        "تحديد دقن بالبخار",
        "غسيل وسيشوار",
      ]),
      branchId: daknBranch.id,
      sortOrder: 3,
    },

    // --- WOMEN'S OFFERS (حمام الباشا) ---
    {
      titleAr: "باقة العروسة الملكية الشاملة VIP (Royal Bride Experience)",
      badge: "أرقى تجهيز عرائس ملكي 👑",
      price: 3900,
      oldPrice: 5500,
      discountPercent: 29,
      image: "/offers/offer-groom-3500.jpg",
      description:
        "حمام مغربي تركي ملكي + دلكة سودانية + طمي مغربي أصلي + جاكوزي دافئ بماء الورد + ساونا وبخار أعشاب + مساج استرخائي بالزيوت + هيدروفيشل ماسك الذهب الكوري + باديكير ومانيكير سبا بالبارافين + تصفيف وسيشوار ملكي + غرفة تغيير خاصة وضيافة VIP.",
      features: JSON.stringify([
        "حمام مغربي تركي أصلي",
        "دلكة سودانية وطمي مغربي",
        "جاكوزي دافئ بماء الورد",
        "مساج استرخائي كامل بالزيوت",
        "هيدروفيشل وماسك الذهب 24K",
        "باديكير ومانيكير سبا بالبارافين",
      ]),
      branchId: hammamBranch.id,
      sortOrder: 4,
    },
    {
      titleAr: "بكج الدلال والاسترخاء النسائي (Ladies Relaxation & Spa)",
      badge: "يوم دلال واستجمام 🌺",
      price: 1499,
      oldPrice: 2200,
      discountPercent: 32,
      image: "/offers/offer-relaxation-1499.jpg",
      description:
        "حمام مغربي تركي أصلي + غرفة ساونا وبخار + جاكوزي دافئ بالزيوت العطرية + ماسك تفتيح للوجه + باديكير قدمين مع تقشير وسكراب وتوريد كعب القدم.",
      features: JSON.stringify([
        "حمام مغربي تركي",
        "جاكوزي دافئ وساونا",
        "ماسك تفتيح للوجه",
        "باديكير وتوريد قدمين",
      ]),
      branchId: hammamBranch.id,
      sortOrder: 5,
    },
    {
      titleAr: "عرض السبا السريع (حمام مغربي تركي + ساونا وبخار)",
      badge: "استرخاء سريع 🧖‍♀️",
      price: 499,
      oldPrice: 650,
      discountPercent: 23,
      image: "/offers/offer-vip-1000.jpg",
      description:
        "حمام مغربي بالصابون البلدي والأعشاب والليفة الأصلية + جلسة ساونا وبخار لتفتيح المسام والاسترخاء التام.",
      features: JSON.stringify([
        "حمام مغربي بالصابون الأصلي",
        "ليفة كيس وتقشير كامل",
        "جلسة ساونا وبخار أعشاب",
      ]),
      branchId: hammamBranch.id,
      sortOrder: 6,
    },
  ];

  for (const o of offers) {
    await prisma.offer.create({ data: o });
  }
  console.log("✅ 6 Royal Offers seeded (Men + Women)");

  // 7. Products (Clean and Seed)
  await prisma.product.deleteMany({});

  const products = [
    // Men's Products (دقن الباشا)
    {
      nameAr: "عطر رجالي VIP دقن الباشا أو دي بارفيوم (100 مل)",
      category: "PERFUMES",
      price: 420,
      costPrice: 200,
      stockQty: 30,
      branchId: daknBranch.id,
      image: "/Images/عطر رجالي صدام VIP أو دي بارفيوم (100 مل).jpg",
    },
    {
      nameAr: "سيروم اللحية الفاخر بزيت الأرجان وزبدة الشيا",
      category: "BEARD_CARE",
      price: 210,
      costPrice: 90,
      stockQty: 35,
      branchId: daknBranch.id,
      image: "/Images/سيروم اللحية الفاخر بزيت الأرجان وزبدة الشيا.jpg",
    },
    {
      nameAr: "شمع شعر عنبر تثبيت 24 ساعة (Strong Wax)",
      category: "STYLING",
      price: 170,
      costPrice: 70,
      stockQty: 50,
      branchId: daknBranch.id,
      image: "/Images/شمع شعر عنبر تثبيت 24 ساعة (Strong Wax).webp",
    },
    {
      nameAr: "ماسك الفحم الكوري لتنظيف وتنعيم مسام الوجه",
      category: "SKIN_CARE",
      price: 150,
      costPrice: 60,
      stockQty: 40,
      branchId: daknBranch.id,
      image: "/Images/ماسك الفحم الكوري لتنظيف وتنعيم مسام الوجه.webp",
    },

    // Women's Products (حمام الباشا)
    {
      nameAr: "صابون مغربي أصلي بزيت الزيتون والأعشاب الطبيعية (300 جم)",
      category: "SKIN_CARE",
      price: 160,
      costPrice: 65,
      stockQty: 45,
      branchId: hammamBranch.id,
      image: "/Images/حبيبات شمع واكس إيطالي لإزالة شعر الوجه والأنف والأذن.jpg",
    },
    {
      nameAr: "ليفة مغربية كيس أصلية عالية الجودة للتقشير",
      category: "ACCESSORIES",
      price: 80,
      costPrice: 30,
      stockQty: 80,
      branchId: hammamBranch.id,
      image: "/Images/مناشف قطنية بيضاء فاخرة مطرزة بشعار صدام VIP.jpg",
    },
    {
      nameAr: "طمي مغربي أصلي معالج بماء الورد واللافندر (500 جم)",
      category: "SKIN_CARE",
      price: 140,
      costPrice: 55,
      stockQty: 40,
      branchId: hammamBranch.id,
      image: "/Images/ماسك الفحم الكوري لتنظيف وتنعيم مسام الوجه.webp",
    },
    {
      nameAr: "سيروم مغذي للشعر بزيت الأرجان والكيراتين (120 مل)",
      category: "STYLING",
      price: 240,
      costPrice: 110,
      stockQty: 30,
      branchId: hammamBranch.id,
      image: "/Images/سيروم اللحية الفاخر بزيت الأرجان وزبدة الشيا.jpg",
    },
    {
      nameAr: "لوشن معطر ومرطب للجسم برائحة الفانيليا والعود الملكي",
      category: "PERFUMES",
      price: 190,
      costPrice: 80,
      stockQty: 35,
      branchId: hammamBranch.id,
      image: "/Images/عطر رجالي صدام VIP أو دي بارفيوم (100 مل).jpg",
    },
  ];

  for (const p of products) {
    await prisma.product.create({ data: p });
  }
  console.log("✅ 9 Retail & Spa Products seeded");

  console.log("🎉 ALL SEEDING COMPLETED SUCCESSFULLY FOR DAKN EL BASHA & HAMMAM EL BASHA!");
}

seed()
  .catch((e) => {
    console.error("❌ Seed Error:", e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
