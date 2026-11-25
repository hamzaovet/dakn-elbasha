import "dotenv/config";
import fs from "fs";
import path from "path";
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

const srcDir = "D:\\Work\\dakn-elbasha\\خدمات وأسعار\\حمام الباشا";
const destDir = "D:\\Work\\dakn-elbasha\\public\\services\\hammam";

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Map Arabic filenames in source directory to clean English slug filenames
const fileMapping: Record<string, string> = {
  // Page 1: Hair
  "قص شعر.jpg": "hair-cut.jpg",
  "قص أطراف.jpg": "hair-trim.jpg",
  "غسيل شعر.jpg": "hair-wash.jpg",
  "استشوار قصير.jpg": "blowout-short.jpg",
  "استشوار متوسط.jpg": "blowout-medium.jpg",
  "استشوار طويل.jpg": "blowout-long.jpg",
  "ويفي.jpg": "hair-wavy.jpg",
  "كيرلي.jpg": "hair-curly.jpg",
  "تسريحة بسيطة.jpg": "hair-updo-simple.jpg",
  "تسريحة سواريه.jpg": "hair-updo-soiree.jpg",
  "تسريحة عروسة.jpg": "hair-updo-bridal.jpg",

  // Page 2: Extensions
  "جرام شعر هندي.jpg": "ext-indian-virgin.jpg",
  "جرام شعر فيتنامي.jpg": "ext-vietnamese-virgin.jpg",
  "ويج شعر.jpg": "ext-wig.jpg",
  "اكستنشن كليبس.jpg": "ext-clipin.jpg",
  "تركيب شعر تريندات.jpg": "ext-thread.jpg",
  "تركيب شعر نانو.jpg": "ext-nano-ring.jpg",

  // Page 3: Color
  "صبغة جذور.jpg": "color-roots.jpg",
  "صبغة كاملة.jpg": "color-full.jpg",
  "صبغة بدون امونيا.jpg": "color-ammonia-free.jpg",
  "هايلايت.jpg": "color-highlights.jpg",
  "لولايت.jpg": "color-lowlights.jpg",
  "بيبي لايت.jpg": "color-babylights.jpg",
  "تونر.jpg": "color-toner.jpg",
  "سحب لون.jpg": "color-bleach.jpg",
  "تصحيح لون.jpg": "color-correction.jpg",

  // Page 4: Treatment Hair
  "حمام كريم.jpg": "treat-cream.jpg",
  "حمام زيت سيلكس.jpg": "treat-oil-silx.jpg",
  "حمام زيت ارجان.jpg": "treat-oil-argan.jpg",
  "حمام زيت بوندكس.jpg": "treat-oil-bondex.jpg",
  "ماسك اعشاب.jpg": "treat-herbal-mask.jpg",
  "تريد منت بارد.jpg": "treat-cold-cryo.jpg",
  "بروتين.jpg": "treat-protein.jpg",
  "جدور كافيار.jpg": "treat-caviar-roots.jpg",
  "كافيار.jpg": "treat-caviar-full.jpg",
  "كافيار فيلر.jpg": "treat-caviar-filler.jpg",

  // Page 5: Brows & Lashes
  "تنظيف حواجب.jpg": "brows-clean.jpg",
  "رسم حواجب بايجن.jpg": "brows-bigen.jpg",
  "صبغة حواجب.jpg": "brows-tint.jpg",
  "لامينشن حواجب.jpg": "brows-lamination.jpg",
  "رفع رموش.jpg": "lashes-lift.jpg",
  "تركيب رموش كلاسيك.jpg": "lashes-classic.jpg",
  "تركيب رموش فوليام.jpg": "lashes-volume.jpg",
  "تركيب رموش ميجا فوليام.jpg": "lashes-mega-volume.jpg",
  "تركيب رموش وان باي وان.jpg": "lashes-one-by-one.jpg",
  "وان بيس لاش.jpg": "lashes-one-piece.jpg",

  // Page 6: Skin Care
  "واكس بشرة.jpg": "skin-facial-wax.jpg",
  "شيفينج.jpg": "skin-shaving.jpg",
  "تشقير حواجب.jpg": "skin-brow-bleach.jpg",
  "وش وحواجب فتلة.jpg": "skin-threading.jpg",

  // Page 7: Facials
  "تنظيف بشرة كلاسيك.jpg": "facial-classic.jpg",
  "تنظيف بشرة عميق.jpg": "facial-deep.jpg",
  "تنظيف الترا سونيك.jpg": "facial-ultrasonic.jpg",
  "تنظيف اكسجينو.jpg": "facial-oxygeneo.jpg",
  "هيدرافيشال.jpg": "facial-hydra.jpg",
  "هيدرافيشال في اي بي.jpg": "facial-hydra-vip.jpg",
  "ديرما بلانينج.jpg": "facial-dermaplaning.jpg",
  "ديرما بن.jpg": "facial-dermapen.jpg",

  // Page 8: Body Masks
  "طمي عطري.jpg": "mask-aromatic-clay.jpg",
  "حنة بيضاء عطرية.jpg": "mask-white-henna.jpg",
  "ترمس.jpg": "mask-lupin.jpg",
  "الحرير الشرقي.jpg": "mask-oriental-silk.jpg",
  "الورد المخملي.jpg": "mask-velvet-rose.jpg",
  "شوفان.jpg": "mask-oatmeal.jpg",
  "الأعشاب الملكية.jpg": "mask-royal-herbs.jpg",
  "خلطة الحبوب الذهبية.jpg": "mask-golden-grains.jpg",
  "خلطة الحبوب الملكية.jpg": "mask-royal-grains.jpg",
  "الملكة.jpg": "mask-the-queen.jpg",
  "الورد الملكي.jpg": "mask-royal-rose.jpg",
  "الشيكولاتة.jpg": "mask-chocolate.jpg",
  "توريد.jpg": "mask-blushing-glow.jpg",
  "القهوة.jpg": "mask-coffee.jpg",
  "جوزهند.jpg": "mask-coconut.jpg",
  "اسكراب تقشير للايد والقدم.jpg": "mask-hand-foot-scrub.jpg",
  "برفيوم باث.jpg": "mask-perfume-bath.jpg",
  "تبريمة.jpg": "mask-tabrima.jpg",
  "نيلة زرقاء.jpg": "mask-blue-nila.jpg",
  "دلكة بالعكر الفاسي.jpg": "mask-dilka-aker-fassi.jpg",
  "دلكة سوداني.jpg": "mask-dilka-sudanese.jpg",
  "جلسة تفتيح الاعشاب.jpg": "mask-herbal-whitening.jpg",
  "صابون مغربي بالعكر الفاسي.jpg": "mask-soap-aker-fassi.jpg",
  "ماسك العود ومسك الطهارة.jpg": "mask-oud-musk-tahara.jpg",

  // Page 9: Makeup
  "ميكب سواريه.jpg": "makeup-soiree.jpg",
  "هاي سواريه.jpg": "makeup-high-soiree.jpg",
  "خطوبة.jpg": "makeup-engagement.jpg",
  "زفاف.jpg": "makeup-wedding-bridal.jpg",

  // Page 10: Wax & Sweet
  "سويت طبيعي للجسم.jpg": "wax-sweet-natural.jpg",
  "واكس ايطالي.jpg": "wax-italian-gentle.jpg",

  // Page 11: Nails
  "مانيكير.jpg": "nails-manicure.jpg",
  "باديكير.jpg": "nails-pedicure.jpg",
  "مانيكير وباديكير.jpg": "nails-mani-pedi.jpg",
  "باديكير علاجي.jpg": "nails-medical-pedicure.jpg",
  "سبا لليدين.jpg": "nails-hand-spa.jpg",
  "سبا للقدمين.jpg": "nails-foot-spa.jpg",
  "جل بوليش.jpg": "nails-gel-polish.jpg",
  "ازالة جل.jpg": "nails-gel-removal.jpg",
  "فيك نيلر.jpg": "nails-press-on.jpg",
  "هارت جل.jpg": "nails-hard-gel.jpg",
  "أكريليك.jpg": "nails-acrylic.jpg",
  "رسم نيلز.jpg": "nails-art-design.jpg",
  "بارافين يدين.jpg": "nails-paraffin-hands.jpg",
  "بارافين قدمين.jpg": "nails-paraffin-feet.jpg",

  // Page 12: Massage
  "مساج سويدي.jpg": "massage-swedish.jpg",
  "مساج ميديام.jpg": "massage-medium.jpg",
  "مساج هارد ديب.jpg": "massage-deep-tissue.jpg",
  "مساج ميديكال.jpg": "massage-medical.jpg",
  "مساج هوت ستون.jpg": "massage-hot-stone.jpg",
  "هيد مساج.jpg": "massage-head-scalp.jpg",
  "هيد مساج وهير كريم.jpg": "massage-head-cream.jpg",
  "حجامة ظهر.jpg": "massage-cupping-back.jpg",
  "حجامة جسم كامل.jpg": "massage-cupping-full.jpg",

  // Pages 13-16: Royal Baths
  "حمام مغربي اصلي.jpg": "bath-moroccan-classic.jpg",
  "حمام مغربي وسبا.jpg": "bath-moroccan-spa.jpg",
  "حمام الذهب الازرق.jpg": "bath-blue-gold.jpg",
  "الحمام التركي السلطاني.jpg": "bath-turkish-sultana.jpg",
  "حمام الذهب الاحمر.jpg": "bath-red-gold.jpg",
  "حمام الجواش.jpg": "bath-postpartum-jawash.jpg",
  "الحمام التونسي الملكي.jpg": "bath-tunisian-royal.jpg",
  "حمام رويال.jpg": "bath-royal-vip.jpg",
  "حمام اورينتال شرقي.jpg": "bath-oriental-empress.jpg",
  "الحمام الايراني.jpg": "bath-persian-saffron.jpg",
  "حمام الدلكة العماني.jpg": "bath-omani-dilka.jpg",
  "الحمام الملكي الامبراطوري.jpg": "bath-imperial-royal.jpg",
  "حمام العروسة الملكي.jpg": "bath-royal-bride.jpg",
};

// Direct service name to image slug mapping
const serviceImageMap: Record<string, string> = {
  // Page 1: Hair
  "قص شعر": "hair-cut.jpg",
  "قص اطراف": "hair-trim.jpg",
  "غسيل شعر": "hair-wash.jpg",
  "استشوار قصير": "blowout-short.jpg",
  "استشوار متوسط": "blowout-medium.jpg",
  "استشوار طويل": "blowout-long.jpg",
  "ويفي": "hair-wavy.jpg",
  "كيرلي": "hair-curly.jpg",
  "تسريحة بسيطة": "hair-updo-simple.jpg",
  "تسريحة سوارية": "hair-updo-soiree.jpg",
  "تسريحة عروسة": "hair-updo-bridal.jpg",

  // Page 2: Extensions
  "جرام الشعر هندي طبيعي": "ext-indian-virgin.jpg",
  "جرام الشعر فيتنامي طبيعي": "ext-vietnamese-virgin.jpg",
  "ويج شعر بديل الطبيعي بالتركيب": "ext-wig.jpg",
  "اكستنشن كلبس من 70 الى 100 جرام حسب الطول": "ext-clipin.jpg",
  "تركيب شعر تراندت الجرام": "ext-thread.jpg",
  "تركيب شعر نانو الجرام": "ext-nano-ring.jpg",

  // Page 3: Color
  "صبغة جذور": "color-roots.jpg",
  "صبغة كاملة": "color-full.jpg",
  "صبغة بدون امونيا": "color-ammonia-free.jpg",
  "هايلايت": "color-highlights.jpg",
  "لولايت": "color-lowlights.jpg",
  "بيبي لايت": "color-babylights.jpg",
  "تونر": "color-toner.jpg",
  "سحب لون": "color-bleach.jpg",
  "تصحيح لون": "color-correction.jpg",

  // Page 4: Treatment Hair
  "حمام كريم": "treat-cream.jpg",
  "حمام زيت silx": "treat-oil-silx.jpg",
  "حمام زيت Argan": "treat-oil-argan.jpg",
  "حمام زيت Bondex": "treat-oil-bondex.jpg",
  "ماسك اعشاب": "treat-herbal-mask.jpg",
  "تريد مينت بارد": "treat-cold-cryo.jpg",
  "بروتين": "treat-protein.jpg",
  "جدور كافيار": "treat-caviar-roots.jpg",
  "كافيار": "treat-caviar-full.jpg",
  "كافيار فيلر": "treat-caviar-filler.jpg",

  // Page 5: Brows & Lashes
  "تنظيف حواجب": "brows-clean.jpg",
  "رسم حواجب بايجين": "brows-bigen.jpg",
  "صبغة حواجب": "brows-tint.jpg",
  "لامينشن حواجب": "brows-lamination.jpg",
  "رفع رموش Lash Lift": "lashes-lift.jpg",
  "تركيب رموش هير باي هير classic": "lashes-classic.jpg",
  "تركيب رموش هير باي هير Volume Lashes": "lashes-volume.jpg",
  "تركيب رموش هير باي هير Mega Volume": "lashes-mega-volume.jpg",
  "تركيب رموش وان باي وان": "lashes-one-by-one.jpg",
  "One piece Lashe": "lashes-one-piece.jpg",

  // Page 6: Skin Care
  "واكس البشرة": "skin-facial-wax.jpg",
  "شيفينج": "skin-shaving.jpg",
  "تشقير حواجب": "skin-brow-bleach.jpg",
  "وش وحواجب فتلة": "skin-threading.jpg",

  // Page 7: Facials
  "تنظيف بشرة كلاسيك": "facial-classic.jpg",
  "تنظيف بشرة عميق": "facial-deep.jpg",
  "تنظيف ألترا سونيك": "facial-ultrasonic.jpg",
  "تنظيف أكسجينيو": "facial-oxygeneo.jpg",
  "هيدرافيشال": "facial-hydra.jpg",
  "VIP هيدرافيشال": "facial-hydra-vip.jpg",
  "ديرما بلانينج": "facial-dermaplaning.jpg",
  "ديرما بن": "facial-dermapen.jpg",

  // Page 8: Body Masks
  "طمي عطري": "mask-aromatic-clay.jpg",
  "حنة بيضاء عطرية": "mask-white-henna.jpg",
  "ترمس": "mask-lupin.jpg",
  "الحرير الشرقي": "mask-oriental-silk.jpg",
  "الورد المخملي": "mask-velvet-rose.jpg",
  "شوفان": "mask-oatmeal.jpg",
  "الاعشاب الملكية": "mask-royal-herbs.jpg",
  "خلطة الحبوب الذهبية": "mask-golden-grains.jpg",
  "خلطة الحبوب الملكية": "mask-royal-grains.jpg",
  "الملكة": "mask-the-queen.jpg",
  "الورد الملكي": "mask-royal-rose.jpg",
  "الشيكولاتة": "mask-chocolate.jpg",
  "توريد": "mask-blushing-glow.jpg",
  "القهوة": "mask-coffee.jpg",
  "جوز هند": "mask-coconut.jpg",
  "اسكراب تقشير للايد والقدم": "mask-hand-foot-scrub.jpg",
  "برفيوم باث": "mask-perfume-bath.jpg",
  "تبريمة": "mask-tabrima.jpg",
  "نيلة زرقاء": "mask-blue-nila.jpg",
  "دلكة بالعكر الفاسي": "mask-dilka-aker-fassi.jpg",
  "دلكة سوداني": "mask-dilka-sudanese.jpg",
  "جلسة تفتيح الاعشاب": "mask-herbal-whitening.jpg",
  "صابون مغربي بالعكر الفاسي": "mask-soap-aker-fassi.jpg",
  "ماسك العود ومسك الطهارة": "mask-oud-musk-tahara.jpg",

  // Page 9: Makeup
  "ميكب سوارية": "makeup-soiree.jpg",
  "هاي سوارية": "makeup-high-soiree.jpg",
  "خطوبة": "makeup-engagement.jpg",
  "زفاف": "makeup-wedding-bridal.jpg",

  // Page 10: Wax & Sweet
  "سويت نصف ذراع": "wax-sweet-natural.jpg",
  "واكس نصف ذراع": "wax-italian-gentle.jpg",
  "سويت نصف رجل": "wax-sweet-natural.jpg",
  "واكس نصف رجل": "wax-italian-gentle.jpg",
  "سويت بطن": "wax-sweet-natural.jpg",
  "واكس بطن": "wax-italian-gentle.jpg",
  "سويت ظهر": "wax-sweet-natural.jpg",
  "واكس ظهر": "wax-italian-gentle.jpg",
  "سويت بكيني": "wax-sweet-natural.jpg",
  "واكس بكيني": "wax-italian-gentle.jpg",
  "سويت اندر ارم": "wax-sweet-natural.jpg",
  "واكس اندر ارم": "wax-italian-gentle.jpg",
  "سويت بكيني لاين": "wax-sweet-natural.jpg",
  "واكس بكيني لاين": "wax-italian-gentle.jpg",
  "سويت ذراع كامل": "wax-sweet-natural.jpg",
  "واكس ذراع كامل": "wax-italian-gentle.jpg",
  "سويت رجل كاملة": "wax-sweet-natural.jpg",
  "واكس رجل كاملة": "wax-italian-gentle.jpg",
  "سويت جسم كامل": "wax-sweet-natural.jpg",
  "واكس جسم كامل": "wax-italian-gentle.jpg",

  // Page 11: Nails
  "مانيكير": "nails-manicure.jpg",
  "باديكير": "nails-pedicure.jpg",
  "مانيكير & باديكير": "nails-mani-pedi.jpg",
  "باديكير علاجي": "nails-medical-pedicure.jpg",
  "سبا لليدين": "nails-hand-spa.jpg",
  "سبا للقدمين": "nails-foot-spa.jpg",
  "جل بوليش": "nails-gel-polish.jpg",
  "إزالة جل": "nails-gel-removal.jpg",
  "فيك نيلز": "nails-press-on.jpg",
  "هارت جيل": "nails-hard-gel.jpg",
  "أكريليك": "nails-acrylic.jpg",
  "رسم نيلز": "nails-art-design.jpg",
  "بارافين يدين": "nails-paraffin-hands.jpg",
  "بارافين قدمين": "nails-paraffin-feet.jpg",

  // Page 12: Massage
  "مساج سويدي (30 دقيقة)": "massage-swedish.jpg",
  "مساج ميديم (30 دقيقة)": "massage-medium.jpg",
  "مساج هارد ديب تيشو (30 دقيقة)": "massage-deep-tissue.jpg",
  "مساج ميديكال علاجي (30 دقيقة)": "massage-medical.jpg",
  "مساج هوت ستون بالأحجار الساخنة (30 دقيقة)": "massage-hot-stone.jpg",
  "هيد مساج (30 دقيقة)": "massage-head-scalp.jpg",
  "هيد مساج & هير كريم": "massage-head-cream.jpg",
  "هيد مساج & Hair Hydration": "massage-head-cream.jpg",
  "حجامة ظهر": "massage-cupping-back.jpg",
  "حجامة جسم كامل": "massage-cupping-full.jpg",

  // Pages 13-16: Royal Baths
  "الحمام المغربي": "bath-moroccan-classic.jpg",
  "الحمام الذهب الازرق": "bath-blue-gold.jpg",
  "الحمام التركي": "bath-turkish-sultana.jpg",
  "الحمام الذهب الاحمر": "bath-red-gold.jpg",
  "حمام الجواش ( بعد الولادة )": "bath-postpartum-jawash.jpg",
  "الحمام التونسي": "bath-tunisian-royal.jpg",
  "حمام رويال": "bath-royal-vip.jpg",
  "الحمام الأورينتال": "bath-oriental-empress.jpg",
  "الحمام الايراني": "bath-persian-saffron.jpg",
  "حمام الدلكة العماني": "bath-omani-dilka.jpg",
  "الحمام الملكي": "bath-imperial-royal.jpg",
  "حمام العروسة الملكي": "bath-royal-bride.jpg",
};

async function main() {
  console.log("🌸 Copying and mapping Hammam El Basha images...");

  // 1. Copy and rename images to clean slug names
  let copiedCount = 0;
  for (const [arabicFile, slugFile] of Object.entries(fileMapping)) {
    const srcPath = path.join(srcDir, arabicFile);
    const destPath = path.join(destDir, slugFile);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      copiedCount++;
    } else {
      console.warn(`⚠️ Source file not found: ${arabicFile}`);
    }
  }
  console.log(`✅ Copied & renamed ${copiedCount} images into ${destDir}`);

  // 2. Fetch all services and update their image URL in the database
  const services = await prisma.service.findMany();
  console.log(`📊 Total services in DB: ${services.length}`);

  let updatedCount = 0;
  for (const s of services) {
    const matchedSlug = serviceImageMap[s.nameAr];
    if (matchedSlug) {
      const imageUrl = `/services/hammam/${matchedSlug}`;
      await prisma.service.update({
        where: { id: s.id },
        data: { image: imageUrl },
      });
      updatedCount++;
      console.log(`✨ Linked [${s.category}] ${s.nameAr} -> ${imageUrl}`);
    }
  }

  console.log(`\n🎉 Successfully updated ${updatedCount} Hammam El Basha services in DB with their official images!`);
  pool.end();
}

main().catch((e) => {
  console.error("❌ Error:", e);
  pool.end();
  process.exit(1);
});
