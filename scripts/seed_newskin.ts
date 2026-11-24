import { prisma } from "../lib/prisma";

async function seedNewSkin() {
  console.log("🌱 Seeding New Skin (نيو سكين)...");

  // 1. Create or update New Skin Branch
  const newSkinBranch = await prisma.branch.upsert({
    where: { code: "BR-NEWSKIN" },
    update: {
      name: "نيو سكين (New Skin VIP) — عيادة وليزر وعناية بالبشرة",
      address: "73 شارع ترعة الجبل، أمام مستشفى سان بول، حدائق القبة، القاهرة",
      phone: "01210103025",
      whatsapp: "01210103025",
      googleMapsUrl: "https://maps.google.com/?q=73+Teraet+El+Gabal+Hadayek+El+Kobba+Cairo",
      isActive: true,
    },
    create: {
      name: "نيو سكين (New Skin VIP) — عيادة وليزر وعناية بالبشرة",
      code: "BR-NEWSKIN",
      address: "73 شارع ترعة الجبل، أمام مستشفى سان بول، حدائق القبة، القاهرة",
      phone: "01210103025",
      whatsapp: "01210103025",
      googleMapsUrl: "https://maps.google.com/?q=73+Teraet+El+Gabal+Hadayek+El+Kobba+Cairo",
      isActive: true,
    },
  });

  console.log("✅ Branch created/updated:", newSkinBranch.name);

  // 2. Specialists for New Skin
  const specialists = [
    {
      name: "د / ياسمين محمود",
      title: "أخصائية الليزر والعناية المتقدمة بالبشرة",
      phone: "01210103025",
      branchId: newSkinBranch.id,
      chairNumber: 1,
      rating: 4.95,
      photo: "https://images.unsplash.com/photo-1594824813616-43a02c918349?w=400&auto=format&fit=crop&q=80",
    },
    {
      name: "أ / ندى إبراهيم",
      title: "خبيرة الديرما والمايكروبليدينج والباديكير العلاجي",
      phone: "01210103025",
      branchId: newSkinBranch.id,
      chairNumber: 2,
      rating: 4.9,
      photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
    },
  ];

  for (const sp of specialists) {
    const existing = await prisma.specialist.findFirst({
      where: { name: sp.name, branchId: sp.branchId },
    });
    if (!existing) {
      await prisma.specialist.create({ data: sp });
    }
  }

  // 3. New Skin Dynamic Services
  const newSkinServices = [
    // ══════════════════════════════════════════════════════════
    // حجرة 1: حجرة الاسكين (باديكير - ميكرو - ديرما)
    // ══════════════════════════════════════════════════════════
    
    // أ) باديكير (NEWSKIN_PEDICURE)
    {
      nameAr: "باديكير سبا إيطالي علاجي (تنظيف وتقشير عميق وتوريد)",
      nameEn: "Royal Italian Spa Pedicure & Heel Glow",
      category: "NEWSKIN_PEDICURE",
      price: 250,
      durationMinutes: 45,
      description: "جلسة باديكير استرخائية متكاملة تشمل إزالة الجلد الميت، سنفرة بالزيوت الطبيعية، ماسك مغذي، وتوريد كعب القدمين.",
      image: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=600&auto=format&fit=crop&q=80",
      sortOrder: 1,
    },
    {
      nameAr: "باديكير برافين دافئ لليدين والقدمين مع مساج استرخائي",
      nameEn: "Warm Paraffin Spa Pedicure & Hand Therapy",
      category: "NEWSKIN_PEDICURE",
      price: 350,
      durationMinutes: 50,
      description: "علاج مكثف للتشققات وجفاف الجلد باستخدام شمع البرافين الطبي الدافئ مع مساج تدليكي لتحسين الدورة الدموية والنعومة الفائقة.",
      image: "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=600&auto=format&fit=crop&q=80",
      sortOrder: 2,
    },
    {
      nameAr: "جلسة ترميم وعناية بالأظافر مع ماسك الكولاجين",
      nameEn: "Nail Repair Therapy & Collagen Mask",
      category: "NEWSKIN_PEDICURE",
      price: 200,
      durationMinutes: 30,
      description: "تنظيف الجلد المحيط بالأظافر وتشكيلها بدقة مع تطبيق سيروم الكولاجين المقوي للأظافر الهشة والضعيفة.",
      image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80",
      sortOrder: 3,
    },

    // ب) ميكرو (NEWSKIN_MICRO)
    {
      nameAr: "مايكروبليدينج حواجب شعرة شعرة 6D Nano (طبيعي وانسيابي)",
      nameEn: "6D Nano Microblading Natural Eyebrows",
      category: "NEWSKIN_MICRO",
      price: 1200,
      durationMinutes: 90,
      description: "رسم وتكثيف الحواجب بأحدث تقنيات النانو بليدينج الألمانية، شعرة بشعرة بنتيجة طبيعية تدوم حتى عام ونصف مع ألوان عضوية آمنة.",
      image: "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=600&auto=format&fit=crop&q=80",
      sortOrder: 10,
    },
    {
      nameAr: "مايكروشيدينج بودر وتوريد شفايف ناعم (Lip Blush)",
      nameEn: "Soft Lip Blush & Microshading Powder",
      category: "NEWSKIN_MICRO",
      price: 950,
      durationMinutes: 75,
      description: "جلسة توريد ونضارة الشفاه وإعطائها لوناً وردياً جذاباً طبيعياً مع تصحيح الهالات والتصبغات.",
      image: "https://images.unsplash.com/photo-1512290900672-1f55b0a23274?w=600&auto=format&fit=crop&q=80",
      sortOrder: 11,
    },
    {
      nameAr: "مايكرونيدلينج نضارة البشرة مع الكولاجين ومضادات الأكسدة",
      nameEn: "Collagen Induction Microneedling Therapy",
      category: "NEWSKIN_MICRO",
      price: 450,
      durationMinutes: 45,
      description: "تحفيز الكولاجين الطبيعي لعلاج المسام الواسعة وآثار الحبوب وشد البشرة وإعادة الحيوية والنضارة الفورية.",
      image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&auto=format&fit=crop&q=80",
      sortOrder: 12,
    },

    // ج) ديرما (NEWSKIN_DERMA)
    {
      nameAr: "جلسة ديرمابن نضارة متقدمة (Dermapen + Hyaluronic Acid)",
      nameEn: "Advanced Dermapen 4 + Pure Hyaluronic Acid",
      category: "NEWSKIN_DERMA",
      price: 400,
      durationMinutes: 45,
      description: "أحدث جهاز ديرمابن مع سيروم الهيالورونيك النقي وفيتامين C لترطيب عميق وتجديد خلايا البشرة والتخلص من الإجهاد.",
      image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80",
      sortOrder: 20,
    },
    {
      nameAr: "جلسة ميزوثيرابي علاج التصبغات وتوحيد لون البشرة",
      nameEn: "Skin Radiance & Anti-Pigmentation Mesotherapy",
      category: "NEWSKIN_DERMA",
      price: 550,
      durationMinutes: 50,
      description: "كوكتيل فيتامينات وأحماض أمينية فرنسية لعلاج الكلف، آثار الشمس، وتوحيد لون الوجه وإشراقة تدوم.",
      image: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=600&auto=format&fit=crop&q=80",
      sortOrder: 21,
    },
    {
      nameAr: "جلسة تقشير كيميائي / بارد علاجي لتجديد طبقات الجلد",
      nameEn: "Clinical Chemical & Cold Skin Peel Session",
      category: "NEWSKIN_DERMA",
      price: 500,
      durationMinutes: 40,
      description: "تقشير آمن ولطيف لإزالة التصبغات والجلد التالف وتفتيح فوري ونضارة فائقة بدون قشور مزعجة.",
      image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&auto=format&fit=crop&q=80",
      sortOrder: 22,
    },

    // ══════════════════════════════════════════════════════════
    // حجرة 2: حجرة الليزر (إزالة الشعر بالليزر)
    // ══════════════════════════════════════════════════════════
    {
      nameAr: "جلسة إزالة شعر فل بدي بالليزر مع رتوش مجانية (Full Body)",
      nameEn: "VIP Full Body Laser Hair Removal + Free Retouch",
      category: "NEWSKIN_LASER",
      price: 1100,
      durationMinutes: 75,
      description: "جلسة ليزر لكامل الجسم بأحدث جهاز ليزر تبريد مزدوج غير مؤلم تماماً ومناسب لجميع أنواع البشرة مع جلسة رتوش مجانية.",
      image: "https://images.unsplash.com/photo-1519415943484-9fa1873496d4?w=600&auto=format&fit=crop&q=80",
      sortOrder: 30,
    },
    {
      nameAr: "جلسة ليزر مناطق حساسة (بكيني + أندر آرم) مع رتوش",
      nameEn: "Bikini & Underarm Laser Hair Removal",
      category: "NEWSKIN_LASER",
      price: 350,
      durationMinutes: 25,
      description: "إزالة شعر سريعة ودقيقة بتقنية التبريد العالي بدون أي ألم وتفتيح تدريجي للمنطقة مع رتوش بعد 10 أيام.",
      image: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=600&auto=format&fit=crop&q=80",
      sortOrder: 31,
    },
    {
      nameAr: "جلسة ليزر الوجه والرقبة بالكامل (تحديد ونضارة)",
      nameEn: "Full Face & Neck Laser Hair Removal",
      category: "NEWSKIN_LASER",
      price: 250,
      durationMinutes: 20,
      description: "تنعيم وتحديد ملامح الوجه والتخلص من الشعر الوبري الدقيق بنبضات دقيقة وآمنة للبشرة الحساسة.",
      image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&auto=format&fit=crop&q=80",
      sortOrder: 32,
    },
    {
      nameAr: "جلسة ليزر نصف جسم (أرجل كاملة أو أذرع كاملة)",
      nameEn: "Half Body Laser (Full Legs or Full Arms)",
      category: "NEWSKIN_LASER",
      price: 450,
      durationMinutes: 35,
      description: "جلسة استهدافية للأرجل أو الأذرع بأعلى درجات التبريد والراحة بدون أي احمرار.",
      image: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&auto=format&fit=crop&q=80",
      sortOrder: 33,
    },
    {
      nameAr: "باقة نبضات ليزر مخصصة (تحديد رتوش ومناطق صغيرة)",
      nameEn: "Custom Laser Pulses & Touch-Up Package",
      category: "NEWSKIN_LASER",
      price: 200,
      durationMinutes: 20,
      description: "باقة مخصصة لتحديد مناطق دقيقة أو جلسات رتوش إضافية لتثبيت النتيجة المثالية.",
      image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80",
      sortOrder: 34,
    },
  ];

  for (const srv of newSkinServices) {
    const existing = await prisma.service.findFirst({
      where: { nameAr: srv.nameAr },
    });
    if (!existing) {
      await prisma.service.create({ data: srv });
    }
  }

  console.log(`✅ ${newSkinServices.length} New Skin Services seeded!`);
}

seedNewSkin()
  .catch((e) => {
    console.error("Error seeding New Skin:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
