import { prisma } from "../lib/prisma";

async function main() {
  console.log("Updating branches with real Facebook & flyer info...");

  // Update or create branches
  let nasr = await prisma.branch.findUnique({ where: { code: "BR-NASR-CITY" } });
  if (nasr) {
    nasr = await prisma.branch.update({
      where: { code: "BR-NASR-CITY" },
      data: {
        name: "فرع مدينة نصر (VIP)",
        address: "28 شارع مصطفى حمام، متفرع من عباس العقاد، أمام أبو العز السوري",
        phone: "01121537537",
        whatsapp: "01121537537",
        googleMapsUrl: "https://maps.google.com/?q=28+Mostafa+Hammam+Abbas+El+Akkad+Nasr+City",
      },
    });
  }

  let kobba = await prisma.branch.findUnique({ where: { code: "BR-KOBBA" } });
  if (kobba) {
    kobba = await prisma.branch.update({
      where: { code: "BR-KOBBA" },
      data: {
        name: "فرع حدائق القبة",
        address: "87 شارع مصر والسودان، حدائق القبة، القاهرة",
        phone: "01121537537",
        whatsapp: "01121537537",
        googleMapsUrl: "https://maps.google.com/?q=87+Misr+wa+El+Sudan+Hadayek+El+Qobba",
      },
    });
  }

  // Update Settings
  await prisma.systemSettings.upsert({
    where: { id: "default-settings" },
    update: {
      hadayekPhone: "01121537537",
      nasrCityPhone: "01121537537",
      hotline: "01121537537",
      whatsappNumber: "01121537537",
      facebookUrl: "https://www.facebook.com/SaddamSalon/",
    },
    create: {
      id: "default-settings",
      salonNameAr: "صالون حلاقة صدام VIP",
      salonNameEn: "SADDAM BARBER SHOP",
      logoUrl: "/logo.jpg",
      hadayekPhone: "01121537537",
      nasrCityPhone: "01121537537",
      hotline: "01121537537",
      whatsappNumber: "01121537537",
      facebookUrl: "https://www.facebook.com/SaddamSalon/",
    },
  });

  console.log("Branches & settings updated!");

  // Seed Offers
  console.log("Seeding offers from flyers...");
  await prisma.offer.deleteMany(); // fresh seed of the real flyers

  const nasrId = nasr?.id || null;
  const kobbaId = kobba?.id || null;

  await prisma.offer.createMany({
    data: [
      {
        titleAr: "عرض العريس الملكي المتكامل (GROOM VIP EXPERIENCE)",
        badge: "العرض الملكي الأقوى 👑",
        price: 3500,
        oldPrice: 4900,
        discountPercent: 29,
        image: "/offers/offer-groom-vip-3500-full.jpg",
        description: "مش مجرد خدمات .. دي تجربة ملكية متكاملة تخليك في أفضل لوك وأعلى استرخاء قبل أهم يوم في حياتك - تجربة صدام VIP",
        features: JSON.stringify([
          "قص شعر ملكي احترافي بأحدث القصات",
          "تحديد ورسم الذقن بالموس والخيط",
          "تنظيف بشرة هيدروفيشيل 11 مرحلة متكاملة",
          "وكس كامل للبشرة وإزالة الرؤوس السوداء",
          "صبغة شعر احترافية أو إخفاء الشيب",
          "جلسة ترميم شعر + حمام زيت + حمام كريم",
          "مساج استرخائي كامل للجسم",
          "ساونا وبخار ستيم تركي + ليفة مغربي",
          "جاكوزي مائي دافئ منعش",
          "باديكير كامل لليد والقدمين وتقليم أظافر",
          "سشوار وتثبيت اللوك وشاور ملكي مع تعطير",
          "توبيك لملء الفراغات في الشعر",
          "غرفة تغيير خاصة + لوكر شخصي + تعقيم كامل + مشروبات مجانية",
        ]),
        branchId: null, // all branches
        isActive: true,
        sortOrder: 1,
      },
      {
        titleAr: "العرض المميز VIP CARE PACKAGE",
        badge: "عرض خاص ومميز 🔥",
        price: 1499,
        oldPrice: 2000,
        discountPercent: 25,
        image: "/offers/offer-vip-care-1499.jpg",
        description: "خدمات متكاملة .. للعناية بمظهرك وأناقتك بأعلى جودة واحترافية (متاح بفرع عباس العقاد وفرع حدائق القبة)",
        features: JSON.stringify([
          "قص شعر احترافي وتدريج عالمي",
          "تحديد ورسم الذقن بالموس والبخار",
          "سيشوار وتثبيت اللوك",
          "توبيك لملء الفراغات في الشعر",
          "تنظيف بشرة سوفت ونضارة فورية",
          "باديكير يد متكامل",
          "باديكير قدم استرخائي",
          "شاور ملكي وتعطير كامل بعد الشاور",
          "غسيل شعر قبل الخدمة وبعد الخدمة",
        ]),
        branchId: null, // all branches
        isActive: true,
        sortOrder: 2,
      },
      {
        titleAr: "باكدج الاسترخاء الملكي VIP RELAXATION",
        badge: "خصم 46% 🔥",
        price: 1499,
        oldPrice: 2750,
        discountPercent: 46,
        image: "/offers/offer-relaxation-1499.jpg",
        description: "الراحة الكاملة في مكان واحد: استرخاء تام، نشاط وحيوية، صحة ونظافة، وتحسين الدورة الدموية",
        features: JSON.stringify([
          "جلسة مساج استرخائي كامل للجسم",
          "حمام مغربي أصلي بالليفة والصابون المغربي",
          "جلسة حجامة أو حجامة نارية لتنشيط الجسم وتفريغ الإجهاد",
          "غرفة ساونا وبخار لإزالة السموم",
          "جاكوزي مائي ساخن للاسترخاء العضلي العميق",
          "مشروب استرخاء ساخن ومياه معدنية مجاناً",
        ]),
        branchId: null, // all branches
        isActive: true,
        sortOrder: 3,
      },
      {
        titleAr: "عرض صاحب العريس",
        badge: "إطلالة مميزة 🎩",
        price: 399,
        oldPrice: 600,
        discountPercent: 34,
        image: "/offers/offer-groom-friend-399.jpg",
        description: "إطلالة مميزة ومبهرة في أهم يوم مع صاحبك أو أخوك العريس (متاح بفرعي عباس العقاد وحدائق القبة)",
        features: JSON.stringify([
          "قص شعر وتدريج احترافي",
          "تحديد ذقن بالموس الفاخر",
          "سشوار وتثبيت اللوك",
          "سكرب تنظيف ونضارة للبشرة",
          "فوطة سخنة لفتح المسام وإنعاش الوجه",
          "فوطة ساقعة لغلق المسام وشد البشرة",
          "غسيل شعر قبل الخدمة وبعد الخدمة",
        ]),
        branchId: null, // all branches
        isActive: true,
        sortOrder: 4,
      },
      {
        titleAr: "باكدج العناية المتكاملة شعر ودقن VIP",
        badge: "عرض خاص 👑",
        price: 1000,
        oldPrice: 1350,
        discountPercent: 26,
        image: "/offers/offer-vip-1000.jpg",
        description: "باكدج الأناقة والوسامة المتكاملة للرجال - عباس العقاد أمام أبو العز السوري",
        features: JSON.stringify([
          "قص شعر وتدريج عالمي حديث",
          "تحديد ورسم الدقن بالموس والبخار",
          "سشوار وتصفيف احترافي مع واكس التثبيت",
          "وكس الوجه لإزالة الشعر الزائد والشوائب",
          "جلسة ماسك تفتيح ونضارة للبشرة",
          "حمام كريم وتغذية مكثفة لألياف الشعر",
        ]),
        branchId: nasrId, // Nasr City only
        isActive: true,
        sortOrder: 5,
      },
      {
        titleAr: "SADDAM VIP COMBO باكدج الشعر والدقن",
        badge: "سعر لا يقاوم ⚡",
        price: 299,
        oldPrice: 450,
        discountPercent: 34,
        image: "/offers/offer-combo-299.jpg",
        description: "أفضل ميكس حلاقة وتصفيف سريع بأعلى دقة واحترافية بفرع عباس العقاد",
        features: JSON.stringify([
          "قص وتدريج الشعر بأحدث القصات العالمية",
          "تحديد ذقن بالموس الإيطالي الفاخر",
          "سشوار وتصفيف لوك رجالي مميز ومبهر",
        ]),
        branchId: nasrId, // Nasr City only
        isActive: true,
        sortOrder: 6,
      },
      {
        titleAr: "عرض عريس حدائق القبة (GROOM VIP)",
        badge: "حصري حدائق القبة 📍",
        price: 1099,
        oldPrice: 1500,
        discountPercent: 27,
        image: "/offers/offer-qobba-groom.jpg",
        description: "باكدج العريس الفاخر بفرع حدائق القبة (مصر والسودان) - باكدج VIP 1099 ج أو كلاسيك 799 ج",
        features: JSON.stringify([
          "قص وتصفيف شعر العريس بأعلى دقة",
          "تحديد ورسم الذقن",
          "تنظيف بشرة وماسكات نضارة وتفتيح",
          "حمام بخار واستجمام",
          "سشوار وتثبيت اللوك لليلة العمر",
        ]),
        branchId: kobbaId, // Hadayek El-Qobba only
        isActive: true,
        sortOrder: 7,
      },
    ],
  });

  console.log("Successfully seeded all 7 royal offers from Saddam flyers!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
