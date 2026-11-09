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
      hadayekPhone: "01210103025",
      nasrCityPhone: "01556782015",
      hotline: "01210103025",
      whatsappNumber: "01210103025",
      facebookUrl: "https://www.facebook.com/DaknElbashaSalon",
      instagramUrl: "https://www.facebook.com/hammam.elbasha1/",
      defaultOpenHour: "11:00 AM",
      defaultCloseHour: "01:00 AM",
      weeklyDayOff: "MONDAY",
      isDayOffEnabled: true,
      dayOffMessage: "عفواً، صالونات وسبا الباشا في عطلة أسبوعية يوم الإثنين - نتشرف بحجز موعدكم طوال باقي أيام الأسبوع ✂️",
    },
    create: {
      id: "default-settings",
      salonNameAr: "مجموعة صالونات وسبا الباشا VIP (دقن الباشا & حمام الباشا)",
      salonNameEn: "EL BASHA LUXURY SALON & SPA",
      logoUrl: "/dakn-logo.jpg",
      systemLocked: false,
      lockMessage: "النظام مغلق مؤقتاً لأعمال الصيانة والتطوير الدوري.",
      hadayekPhone: "01210103025",
      nasrCityPhone: "01556782015",
      hotline: "01210103025",
      whatsappNumber: "01210103025",
      facebookUrl: "https://www.facebook.com/DaknElbashaSalon",
      instagramUrl: "https://www.facebook.com/hammam.elbasha1/",
      defaultOpenHour: "11:00 AM",
      defaultCloseHour: "01:00 AM",
      weeklyDayOff: "MONDAY",
      isDayOffEnabled: true,
      dayOffMessage: "عفواً، صالونات وسبا الباشا في عطلة أسبوعية يوم الإثنين - نتشرف بحجز موعدكم طوال باقي أيام الأسبوع ✂️",
    },
  });
  console.log("✅ System Settings seeded");

  // 2. Branches: Branch 1 = دقن الباشا (رجالي) / Branch 2 = حمام الباشا (حريمي)
  const daknBranch = await prisma.branch.upsert({
    where: { code: "BR-DAKN-MEN" },
    update: {
      name: "فرع صالون دقن الباشا (رجالي VIP)",
      address: "73 شارع ترعة الجبل، أمام مستشفى سان بول، حدائق القبة، القاهرة",
      phone: "01210103025",
      whatsapp: "01210103025",
    },
    create: {
      name: "فرع صالون دقن الباشا (رجالي VIP)",
      code: "BR-DAKN-MEN",
      address: "73 شارع ترعة الجبل، أمام مستشفى سان بول، حدائق القبة، القاهرة",
      phone: "01210103025",
      whatsapp: "01210103025",
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
  console.log("✅ Branches seeded: دقن الباشا (01210103025) + حمام الباشا (01556782015)");

  // 3. System Users & Staff Accounts (14 Full Accounts)
  // Clean users first (except keep owner / GM)
  await prisma.user.upsert({
    where: { username: "maestro" },
    update: {
      passwordHash: "password123",
      pin: "157230",
      role: "owner",
      name: "أ / حمزة عباس (المايسترو - المالك)",
    },
    create: {
      name: "أ / حمزة عباس (المايسترو - المالك)",
      username: "maestro",
      passwordHash: "password123",
      pin: "157230",
      phone: "01210103025",
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
      name: "كابتن الباشا (المدير العام للمجموعة)",
    },
    create: {
      name: "كابتن الباشا (المدير العام للمجموعة)",
      username: "gm-basha",
      passwordHash: "password123",
      pin: "157230",
      phone: "01210103025",
      role: "general_manager",
      branchId: null,
      isActive: true,
    },
  });

  // Branch Managers (مدير كل فرع)
  const managerDakn = await prisma.user.upsert({
    where: { username: "manager-dakn" },
    update: {
      passwordHash: "password123",
      pin: "157230",
      phone: "01210103025",
      branchId: daknBranch.id,
      role: "manager",
      name: "أ / أحمد عبد الرحيم (مدير فرع صالون دقن الباشا)",
    },
    create: {
      name: "أ / أحمد عبد الرحيم (مدير فرع صالون دقن الباشا)",
      username: "manager-dakn",
      passwordHash: "password123",
      pin: "157230",
      phone: "01210103025",
      role: "manager",
      branchId: daknBranch.id,
      isActive: true,
    },
  });

  const managerHammam = await prisma.user.upsert({
    where: { username: "manager-hammam" },
    update: {
      passwordHash: "password123",
      pin: "157230",
      phone: "01556782015",
      branchId: hammamBranch.id,
      role: "manager",
      name: "أ / ندى المحمدي (مديرة فرع حمام الباشا VIP)",
    },
    create: {
      name: "أ / ندى المحمدي (مديرة فرع حمام الباشا VIP)",
      username: "manager-hammam",
      passwordHash: "password123",
      pin: "157230",
      phone: "01556782015",
      role: "manager",
      branchId: hammamBranch.id,
      isActive: true,
    },
  });

  // Cashiers (كاشير كل فرع)
  await prisma.user.upsert({
    where: { username: "cashier-dakn" },
    update: {
      passwordHash: "password123",
      pin: "1234",
      phone: "01210103025",
      branchId: daknBranch.id,
      role: "cashier",
      name: "كاشير دقن الباشا (رجالي)",
    },
    create: {
      name: "كاشير دقن الباشا (رجالي)",
      username: "cashier-dakn",
      passwordHash: "password123",
      pin: "1234",
      phone: "01210103025",
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
      phone: "01556782015",
      branchId: hammamBranch.id,
      role: "cashier",
      name: "كاشير حمام الباشا (حريمي)",
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

  // Specialist Accounts (أكواد وحسابات المتخصصين)
  // Men Specialist Users
  const userHossam = await prisma.user.upsert({
    where: { username: "spec-hossam" },
    update: { passwordHash: "password123", pin: "1234", branchId: daknBranch.id, role: "specialist" },
    create: {
      name: "كابتن حسام الباشا",
      username: "spec-hossam",
      passwordHash: "password123",
      pin: "1234",
      phone: "01210103021",
      role: "specialist",
      branchId: daknBranch.id,
      isActive: true,
    },
  });

  const userEslam = await prisma.user.upsert({
    where: { username: "spec-eslam" },
    update: { passwordHash: "password123", pin: "1234", branchId: daknBranch.id, role: "specialist" },
    create: {
      name: "كابتن إسلام سيف",
      username: "spec-eslam",
      passwordHash: "password123",
      pin: "1234",
      phone: "01210103022",
      role: "specialist",
      branchId: daknBranch.id,
      isActive: true,
    },
  });

  const userKareem = await prisma.user.upsert({
    where: { username: "spec-kareem" },
    update: { passwordHash: "password123", pin: "1234", branchId: daknBranch.id, role: "specialist" },
    create: {
      name: "كابتن كريم عبد العزيز",
      username: "spec-kareem",
      passwordHash: "password123",
      pin: "1234",
      phone: "01210103023",
      role: "specialist",
      branchId: daknBranch.id,
      isActive: true,
    },
  });

  const userZeyad = await prisma.user.upsert({
    where: { username: "spec-zeyad" },
    update: { passwordHash: "password123", pin: "1234", branchId: daknBranch.id, role: "specialist" },
    create: {
      name: "كابتن زياد المغربي",
      username: "spec-zeyad",
      passwordHash: "password123",
      pin: "1234",
      phone: "01210103024",
      role: "specialist",
      branchId: daknBranch.id,
      isActive: true,
    },
  });

  // Women Specialist Users
  const userAmina = await prisma.user.upsert({
    where: { username: "spec-amina" },
    update: { passwordHash: "password123", pin: "1234", branchId: hammamBranch.id, role: "specialist" },
    create: {
      name: "مدام أمينة المغربية",
      username: "spec-amina",
      passwordHash: "password123",
      pin: "1234",
      phone: "01556782016",
      role: "specialist",
      branchId: hammamBranch.id,
      isActive: true,
    },
  });

  const userMarwa = await prisma.user.upsert({
    where: { username: "spec-marwa" },
    update: { passwordHash: "password123", pin: "1234", branchId: hammamBranch.id, role: "specialist" },
    create: {
      name: "أ/ مروة فؤاد",
      username: "spec-marwa",
      passwordHash: "password123",
      pin: "1234",
      phone: "01556782017",
      role: "specialist",
      branchId: hammamBranch.id,
      isActive: true,
    },
  });

  const userYasmin = await prisma.user.upsert({
    where: { username: "spec-yasmin" },
    update: { passwordHash: "password123", pin: "1234", branchId: hammamBranch.id, role: "specialist" },
    create: {
      name: "أ/ ياسمين الشريف",
      username: "spec-yasmin",
      passwordHash: "password123",
      pin: "1234",
      phone: "01556782018",
      role: "specialist",
      branchId: hammamBranch.id,
      isActive: true,
    },
  });

  const userSara = await prisma.user.upsert({
    where: { username: "spec-sara" },
    update: { passwordHash: "password123", pin: "1234", branchId: hammamBranch.id, role: "specialist" },
    create: {
      name: "أ/ سارة نور",
      username: "spec-sara",
      passwordHash: "password123",
      pin: "1234",
      phone: "01556782019",
      role: "specialist",
      branchId: hammamBranch.id,
      isActive: true,
    },
  });

  console.log("✅ 14 Users seeded (Owner, GM, 2 Branch Managers, 2 Cashiers, 8 Specialists)");

  // 4. Specialists (Men for Dakn El Basha, Women for Hammam El Basha)
  await prisma.specialist.deleteMany({});

  const menSpecialists = [
    {
      name: "كابتن حسام الباشا",
      title: "كبير مصففي دقن الباشا وخبير تدريج الشعر الملكي",
      phone: "01210103021",
      chairNumber: 1,
      commissionRate: 25,
      branchId: daknBranch.id,
      rating: 4.95,
      photo: "/dakn-hero.jpg",
      userId: userHossam.id,
    },
    {
      name: "كابتن إسلام سيف",
      title: "أخصائي تنظيف البشرة المائي وعلاج الشعر بالبروتين",
      phone: "01210103022",
      chairNumber: 2,
      commissionRate: 20,
      branchId: daknBranch.id,
      rating: 4.9,
      photo: "/services/service-styling.webp",
      userId: userEslam.id,
    },
    {
      name: "كابتن كريم عبد العزيز",
      title: "مصفف وخبير حلاقة ورسم اللحية بالموس الإيطالي",
      phone: "01210103023",
      chairNumber: 3,
      commissionRate: 20,
      branchId: daknBranch.id,
      rating: 4.88,
      photo: "/dakn-logo.jpg",
      userId: userKareem.id,
    },
    {
      name: "كابتن زياد المغربي",
      title: "أخصائي الحمام المغربي والمساج والجاكوزي الرجالي",
      phone: "01210103024",
      chairNumber: 4,
      commissionRate: 25,
      branchId: daknBranch.id,
      rating: 4.98,
      photo: "/offers/dakn-white-friday-600.jpg",
      userId: userZeyad.id,
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
        userId: s.userId,
      },
    });
  }

  // Ladies specialists with real professional female photos
  const womenSpecialists = [
    {
      name: "مدام أمينة المغربية",
      title: "كبيرة خبيرات الحمام المغربي الملكي والدلكة السودانية",
      phone: "01556782016",
      chairNumber: 1,
      commissionRate: 25,
      branchId: hammamBranch.id,
      rating: 4.99,
      photo: "/ladies/specialist-amina.jpg",
      userId: userAmina.id,
    },
    {
      name: "أ/ مروة فؤاد",
      title: "أخصائية العناية بالبشرة والهيدروفيشل وميزوثيرابي النضارة",
      phone: "01556782017",
      chairNumber: 2,
      commissionRate: 20,
      branchId: hammamBranch.id,
      rating: 4.92,
      photo: "/ladies/specialist-marwa.jpg",
      userId: userMarwa.id,
    },
    {
      name: "أ/ ياسمين الشريف",
      title: "خبيرة فرد وعلاج الشعر بالبروتين والصبغات الأوروبية",
      phone: "01556782018",
      chairNumber: 3,
      commissionRate: 22,
      branchId: hammamBranch.id,
      rating: 4.89,
      photo: "/ladies/specialist-yasmin.jpg",
      userId: userYasmin.id,
    },
    {
      name: "أ/ سارة نور",
      title: "أخصائية المساج الاسترخائي والجاكوزي وباديكير العرائس",
      phone: "01556782019",
      chairNumber: 4,
      commissionRate: 25,
      branchId: hammamBranch.id,
      rating: 4.96,
      photo: "/ladies/specialist-sara.jpg",
      userId: userSara.id,
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
        statusReason: "جاهزة ومتاحة لاستقبال العميلات في السبا 🌸",
        isActive: true,
        userId: s.userId,
      },
    });
  }
  console.log("✅ 8 Specialists seeded with separated Men & Women photos!");

  // 5. Services (Clean and Seed)
  await prisma.service.deleteMany({});

  const services = [
    // --- MEN'S SERVICES (دقن الباشا) ---
    {
      nameAr: "حلاقة شعر هيبة الباشا الملكية (Classic & Fade Cut)",
      nameEn: "Royal Basha Classic Cut",
      category: "HAIR",
      price: 150,
      durationMinutes: 30,
      description: "قص وتدريج احترافي بأحدث صيحات الموضة العالمية مع غسيل وسيشوار تركي.",
      image: "/services/service-styling.webp",
      sortOrder: 1,
    },
    {
      nameAr: "تحديد وحلاقة ذقن بالبخار والموس الإيطالي",
      nameEn: "Italian Steam Beard Grooming",
      category: "BEARD",
      price: 100,
      durationMinutes: 25,
      description: "رسم وتحديد الذقن بالخيط والموس مع حمام بخار ساخن وترطيب بالزيوت الطبيعية.",
      image: "/services/service-styling.webp",
      sortOrder: 2,
    },
    {
      nameAr: "باكيدج دقن الباشا الملكي VIP (شعر + دقن + فوطة سخنة)",
      nameEn: "Dakn El Basha VIP Royal Combo",
      category: "VIP_PACKAGES",
      price: 250,
      durationMinutes: 45,
      description: "تجربة ملكية كاملة: قص شعر استثنائي + تحديد دقن بالبخار + فوطة سخنة وساقعة وتدليك فروة الرأس.",
      image: "/offers/dakn-white-friday-400.jpg",
      sortOrder: 3,
    },
    {
      nameAr: "جلسة تنظيف وبخار وتقشير البشرة (Deep Hydro-Facial)",
      nameEn: "Deep Hydro-Facial Session",
      category: "SKIN_CARE",
      price: 200,
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
      price: 250,
      durationMinutes: 45,
      description: "صبغات أوروبية أصلية تدوم طويلاً وتمنحك لوناً طبيعياً متجانساً ومشرقاً.",
      image: "/services/service-color.jpg",
      sortOrder: 6,
    },
    {
      nameAr: "حمام مغربي رجالي متكامل + ساونا وجاكوزي ومغطس",
      nameEn: "Men Royal Moroccan Bath & Sauna",
      category: "VIP_PACKAGES",
      price: 500,
      durationMinutes: 60,
      description: "جلسة استرخاء رجالية كاملة بمغطس ساخن وساقع وصابون مغربي وطمي وليفة أصلية واستيم وجاكوزي ومخمرية.",
      image: "/offers/dakn-white-friday-600.jpg",
      sortOrder: 7,
    },
    {
      nameAr: "باديكير رجالي متكامل وعناية باليدين والأظافر",
      nameEn: "Men Royal Spa Pedicure",
      category: "BEARD",
      price: 200,
      durationMinutes: 40,
      description: "إزالة الجلد الميت وتقليم وتنظيف الأظافر مع سكراب استرخائي لليدين والقدمين.",
      image: "/services/service-pedicure.jpg",
      sortOrder: 8,
    },
    {
      nameAr: "حلاقة أطفال مريحة ومرحة (Kids Cut)",
      nameEn: "Kids Cut Experience",
      category: "KIDS",
      price: 100,
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
      price: 350,
      durationMinutes: 60,
      description: "جلسة دلال ملكية بالصابون البلدي المغربي والليفة الأصلية وإزالة الجلد الميت وتفتيح المسام في غرفة البخار.",
      image: "/ladies/ladies-moroccan-bath.jpg",
      sortOrder: 10,
    },
    {
      nameAr: "جلسة سويت كاملة للجسم ونعومة فائقة",
      nameEn: "Full Body Sweet Wax Session",
      category: "LADIES_SPA",
      price: 250,
      durationMinutes: 45,
      description: "إزالة كاملة لشعر الجسم بمكونات طبيعية آمنة تمنح بشرتك نعومة حريرية ونضارة تدوم.",
      image: "/ladies/ladies-sweet.jpg",
      sortOrder: 11,
    },
    {
      nameAr: "جلسة طمي مغربي أصلي ودلكة سودانية لتفتيح الجسم",
      nameEn: "Original Moroccan Clay & Sudanese Dilka",
      category: "LADIES_SPA",
      price: 300,
      durationMinutes: 45,
      description: "خلطة تفتيح ونعومة ونضارة فائقة لكامل الجسم بالطمي البركاني المغربي وماء الورد والدلكة العطرية.",
      image: "/ladies/ladies-moroccan-bath.jpg",
      sortOrder: 12,
    },
    {
      nameAr: "جلسة جاكوزي دافئ بماء الورد والزيوت العطرية",
      nameEn: "Rose Water Warm Jacuzzi Session",
      category: "LADIES_SPA",
      price: 250,
      durationMinutes: 30,
      description: "استرخاء عضلي ونفسي كامل في مياه الجاكوزي الدافئة الغنية بخلاصة الورد والزيوت العطرية المهدئة.",
      image: "/ladies/ladies-jacuzzi.jpg",
      sortOrder: 13,
    },
    {
      nameAr: "مساج استرخائي فرعوني كامل للجسم بالزيوت العطرية",
      nameEn: "Pharaonic Relaxing Oil Massage (45m)",
      category: "LADIES_SPA",
      price: 400,
      durationMinutes: 45,
      description: "تدليك استرخائي كامل لفك تشنجات الجسم والظهر والرقبة بأيدي خبيرات مساج متمرسات.",
      image: "/ladies/ladies-massage.jpg",
      sortOrder: 14,
    },
    {
      nameAr: "هيد مساج استرخائي ومساج لفروة الرأس",
      nameEn: "Relaxing Head & Scalp Massage",
      category: "LADIES_SPA",
      price: 200,
      durationMinutes: 25,
      description: "تدليك مركز لفروة الرأس والصدغين لتخفيف الصداع والإرهاق وتنشيط الدورة الدموية للبصيلات.",
      image: "/ladies/ladies-massage.jpg",
      sortOrder: 15,
    },
    {
      nameAr: "تنظيف بشرة مائي هيدروفيشل + ماسك الذهب الكوري 24K",
      nameEn: "HydraFacial 24K Gold Mask Session",
      category: "LADIES_SKIN",
      price: 280,
      durationMinutes: 50,
      description: "تنظيف عميق للمسام وتقشير مائي ماسي مع ترطيب بكولاجين الذهب الكوري لإشراقة ونضارة ملحوظة.",
      image: "/ladies/ladies-facial-gold.jpg",
      sortOrder: 16,
    },
    {
      nameAr: "باديكير ومانيكير سبا متكامل مع ماسك الشمع والبارافين",
      nameEn: "Ladies Spa Pedicure & Paraffin Mask",
      category: "LADIES_SPA",
      price: 250,
      durationMinutes: 45,
      description: "عناية فائقة بالأظافر واليدين والقدمين مع حمام الشمع والبارافين لتنعيم فائق وتوريد القدمين.",
      image: "/ladies/ladies-pedicure.jpg",
      sortOrder: 17,
    },
    {
      nameAr: "تصفيف وسيشوار وبيبي ليس ملكي للشعر (Royal Blowout)",
      nameEn: "Royal Ladies Blowout & Styling",
      category: "LADIES_HAIR",
      price: 180,
      durationMinutes: 30,
      description: "غسيل شعر احترافي بحمام كريم وتصفيف ناعم ومموج بأحدث أدوات السيشوار والبيبي ليس.",
      image: "/ladies/ladies-hair-styling.jpg",
      sortOrder: 18,
    },
    {
      nameAr: "فرد ومعالجة الشعر بالبروتين والنانو ثيرابي البرازيلي",
      nameEn: "Ladies Brazilian Nano Therapy Hair Treatment",
      category: "LADIES_HAIR",
      price: 850,
      durationMinutes: 120,
      description: "علاج مكثف لتقصف وتجعد الشعر يمنحك نعومة حريرية ولمعاناً فائقاً يدوم لشهور.",
      image: "/ladies/ladies-hair-styling.jpg",
      sortOrder: 19,
    },
    {
      nameAr: "صبغة شعر حريمي كولاجين إسباني وسحب لون آمن",
      nameEn: "Ladies Collagen Hair Color & Tone",
      category: "LADIES_HAIR",
      price: 450,
      durationMinutes: 60,
      description: "تلوين شعر بأحدث الألوان العصرية (بلوند، تشوكليت، زيتوني) بخامات أصلية مغذية للشعر.",
      image: "/ladies/ladies-hair-color.jpg",
      sortOrder: 20,
    },
  ];

  for (const s of services) {
    await prisma.service.create({ data: s });
  }
  console.log("✅ 20 Services seeded (Men with Barber photos + Women with Spa photos)");

  // 6. Royal Offers (Clean and Seed matching official flyers)
  await prisma.offer.deleteMany({});

  const offers = [
    // --- MEN'S OFFERS (دقن الباشا) ---
    {
      titleAr: "عرض وايت فرايداي: باكدج العناية الرجالي المتكامل",
      badge: "عرض الوايت فرايداي الأقوى 👑",
      price: 600,
      oldPrice: 1000,
      discountPercent: 40,
      image: "/offers/dakn-white-friday-600.jpg",
      description:
        "قص شعر + تهذيب دقن + حمام مغربي متكامل يشمل: مغطس ساخن، مغطس ساقع، جاكوزي، استيم، صابون مغربي، فرك الجلد الميت من الجسم، ماسك طمي مغربي للجسم، حمام كريم للشعر، ماسك للبشرة، مخمرية في أماكن النبض.",
      features: JSON.stringify([
        "قص شعر + تهذيب دقن",
        "مغطس ساخن + مغطس ساقع + جاكوزي",
        "استيم + صابون مغربي + فرك الجلد الميت",
        "ماسك طمي مغربي كامل للجسم",
        "حمام كريم للشعر + ماسك للبشرة",
        "مخمرية أصلية في أماكن النبض",
      ]),
      branchId: daknBranch.id,
      sortOrder: 1,
    },
    {
      titleAr: "عرض وايت فرايداي: باكدج الحلاقة وتدليل البشرة الفاخر",
      badge: "توفير الوايت فرايداي ⚡",
      price: 400,
      oldPrice: 700,
      discountPercent: 43,
      image: "/offers/dakn-white-friday-400.jpg",
      description:
        "حلاقة شعر + تهذيب دقن + فوطة سخنة + فوطة ساقعة + حمام كريم + ماسك بشرة + فوطة استخدام مرة واحدة + 3 اسكرابات للبشرة + إبرة دهون + اسكربر + ماسك ترطيب + كبسولة فيتامين.",
      features: JSON.stringify([
        "حلاقة شعر احترافية + تهذيب دقن",
        "فوطة سخنة + فوطة ساقعة",
        "3 اسكرابات للبشرة + إبرة دهون واسكربر",
        "ماسك ترطيب + كبسولة فيتامين نضارة",
        "حمام كريم للشعر + فوطة شخصية لمرة واحدة",
      ]),
      branchId: daknBranch.id,
      sortOrder: 2,
    },
    {
      titleAr: "باقة عريس الباشا الملكية الكبرى (VIP Groom Experience)",
      badge: "العرض الملكي للعرسان 🤵",
      price: 2800,
      oldPrice: 3800,
      discountPercent: 26,
      image: "/offers/offer-groom-vip-3500-full.jpg",
      description:
        "تجربة العريس الشاملة: قص شعر ملكي + رسم لحية بالموس + حمام مغربي تركي بمغطس ساخن وجاكوزي + مساج كامل + تنظيف بشرة هيدروفيشل 11 مرحلة + وكس وسيشوار وثبات اللوك.",
      features: JSON.stringify([
        "قص شعر وتدريج ملكي",
        "تحديد ورسم اللحية بالبخار",
        "حمام مغربي وساونا وجاكوزي ومساج",
        "تنظيف بشرة هيدروفيشل 11 مرحلة",
        "سيشوار وتثبيت لوك الفرح وتعطير",
      ]),
      branchId: daknBranch.id,
      sortOrder: 3,
    },

    // --- WOMEN'S OFFERS (حمام الباشا) ---
    {
      titleAr: "عرض وايت فرايداي من حمام الباشا: اختاري أي خدمة بـ 250 ج",
      badge: "وايت فرايداي حمام الباشا 🌸",
      price: 250,
      oldPrice: 450,
      discountPercent: 44,
      image: "/offers/hammam-white-friday-250.jpg",
      description:
        "عرض خاص لفترة محدودة من حمام الباشا! اختاري أي خدمة من الخدمات الملكية التالية: (1. سويت - 2. حمام مغربي - 3. تنظيف بشرة - 4. هيد مساج) — الحجز متاح أونلاين فقط.",
      features: JSON.stringify([
        "1. سويت كامل لنعومة ونضارة الجسم",
        "2. حمام مغربي بالصابون البلدي والبخار",
        "3. تنظيف بشرة وتقشير وإشراقة نضارة",
        "4. هيد مساج استرخائي لفروة الرأس",
        "الحجز أونلاين فقط عبر الموقع",
      ]),
      branchId: hammamBranch.id,
      sortOrder: 4,
    },
    {
      titleAr: "باقة العروسة الملكية الشاملة VIP (Royal Bride Experience)",
      badge: "أرقى تجهيز عرائس ملكي 👑",
      price: 3500,
      oldPrice: 5000,
      discountPercent: 30,
      image: "/ladies/ladies-bridal-spa.jpg",
      description:
        "حمام مغربي تركي ملكي + دلكة سودانية + طمي مغربي أصلي + جاكوزي دافئ بماء الورد + ساونا وبخار أعشاب + مساج استرخائي بالزيوت + هيدروفيشل ماسك الذهب الكوري 24K + باديكير ومانيكير سبا بالبارافين + تصفيف وسيشوار ملكي.",
      features: JSON.stringify([
        "حمام مغربي تركي أصلي بالبخار",
        "دلكة سودانية وطمي مغربي لتفتيح الجسم",
        "جاكوزي دافئ بماء الورد واللافندر",
        "مساج استرخائي كامل بالزيوت العطرية",
        "هيدروفيشل وماسك الذهب 24K",
        "باديكير ومانيكير سبا بالبارافين",
      ]),
      branchId: hammamBranch.id,
      sortOrder: 5,
    },
    {
      titleAr: "بكج الدلال والاسترخاء النسائي (Ladies Relaxation & Spa)",
      badge: "يوم دلال واستجمام 🌺",
      price: 1200,
      oldPrice: 1800,
      discountPercent: 33,
      image: "/ladies/ladies-jacuzzi.jpg",
      description:
        "حمام مغربي تركي أصلي + غرفة ساونا وبخار + جاكوزي دافئ بالزيوت العطرية + ماسك تفتيح للوجه + باديكير قدمين مع تقشير وسكراب وتوريد كعب القدم.",
      features: JSON.stringify([
        "حمام مغربي تركي بالصابون الأصلي",
        "جاكوزي دافئ وساونا بخار",
        "ماسك تفتيح للوجه",
        "باديكير وتوريد قدمين",
      ]),
      branchId: hammamBranch.id,
      sortOrder: 6,
    },
  ];

  for (const o of offers) {
    await prisma.offer.create({ data: o });
  }
  console.log("✅ 6 Royal Offers seeded with real White Friday flyers!");

  // 7. Products (Clean and Seed)
  await prisma.product.deleteMany({});

  const products = [
    // Men's Products (دقن الباشا)
    {
      nameAr: "عطر رجالي VIP دقن الباشا أو دي بارفيوم (100 مل)",
      category: "PERFUMES",
      price: 400,
      costPrice: 200,
      stockQty: 30,
      branchId: daknBranch.id,
      image: "/dakn-logo.jpg",
    },
    {
      nameAr: "سيروم اللحية الفاخر بزيت الأرجان وزبدة الشيا",
      category: "BEARD_CARE",
      price: 200,
      costPrice: 90,
      stockQty: 35,
      branchId: daknBranch.id,
      image: "/services/service-styling.webp",
    },
    {
      nameAr: "شمع شعر عنبر تثبيت 24 ساعة (Strong Matte Wax)",
      category: "STYLING",
      price: 150,
      costPrice: 70,
      stockQty: 50,
      branchId: daknBranch.id,
      image: "/services/service-styling.webp",
    },

    // Women's Spa Products (حمام الباشا)
    {
      nameAr: "صابون مغربي بلدي أصلي بزيت الزيتون والأعشاب",
      category: "SKIN_CARE",
      price: 150,
      costPrice: 70,
      stockQty: 40,
      branchId: hammamBranch.id,
      image: "/ladies/ladies-moroccan-bath.jpg",
    },
    {
      nameAr: "طمي مغربي بركاني أصلي لتفتيح وشد الجسم",
      category: "SKIN_CARE",
      price: 180,
      costPrice: 85,
      stockQty: 35,
      branchId: hammamBranch.id,
      image: "/ladies/ladies-moroccan-bath.jpg",
    },
    {
      nameAr: "مخمرية ملكية معطرة للجسم وأماكن النبض (مسك الرمان واللافندر)",
      category: "PERFUMES",
      price: 160,
      costPrice: 75,
      stockQty: 45,
      branchId: hammamBranch.id,
      image: "/ladies/ladies-jacuzzi.jpg",
    },
  ];

  for (const p of products) {
    await prisma.product.create({ data: p });
  }
  console.log("✅ 6 Products seeded (Men + Women Spa)");

  console.log("🎉 ALL SEEDING COMPLETED SUCCESSFULLY WITH ZERO GENDER CONFLICTS!");
}

seed()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
