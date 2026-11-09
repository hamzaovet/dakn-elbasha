import { prisma } from "../lib/prisma";

async function main() {
  console.log("Seeding authentic salon raw materials & supplies...");

  const supplies = [
    {
      nameAr: "شفرات حلاقة دوركو تيتانيوم إيطالي (باكت 100 شفرة)",
      category: "SUPPLIES",
      price: 0,
      costPrice: 85,
      stockQty: 40,
      minStockAlert: 10,
      image: "https://i.ibb.co/BVv85Dn9/5700939b435b.jpg",
      barcode: "SUP-001",
    },
    {
      nameAr: "كريم حلاقة وتليين ذقن بالنعناع والمنثول (برطمان 1 كجم)",
      category: "SUPPLIES",
      price: 0,
      costPrice: 140,
      stockQty: 25,
      minStockAlert: 5,
      image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80",
      barcode: "SUP-002",
    },
    {
      nameAr: "صبغة شعر إسبانية لاكمي كولاج (أسود ملكي / بني غامق)",
      category: "COLOR_SUPPLIES",
      price: 0,
      costPrice: 120,
      stockQty: 60,
      minStockAlert: 15,
      image: "https://i.ibb.co/zhwZvjvc/942871181b3b.jpg",
      barcode: "COL-001",
    },
    {
      nameAr: "ماء أكسجين مثبت ومعالج ألوان 20 Vol (جالون لتر)",
      category: "COLOR_SUPPLIES",
      price: 0,
      costPrice: 95,
      stockQty: 20,
      minStockAlert: 5,
      image: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=500&auto=format&fit=crop&q=80",
      barcode: "COL-002",
    },
    {
      nameAr: "بروتين وكيراتين برازيلي أوريجينال نانو ثيرابي (1000 مل)",
      category: "PROTEIN_SUPPLIES",
      price: 0,
      costPrice: 650,
      stockQty: 15,
      minStockAlert: 3,
      image: "https://i.ibb.co/B27KJnB6/ae8d9fdff280.jpg",
      barcode: "PROT-001",
    },
    {
      nameAr: "حبيبات شمع واكس إيطالي لإزالة شعر الوجه والأذن والأنف (1 كجم)",
      category: "SUPPLIES",
      price: 0,
      costPrice: 190,
      stockQty: 18,
      minStockAlert: 4,
      image: "https://images.unsplash.com/photo-1567928815117-6d1ff8c64264?w=500&auto=format&fit=crop&q=80",
      barcode: "WAX-001",
    },
    {
      nameAr: "كحول وكولونيا تعقيم وتطهير أدوات الحلاقة 70% (عبوة 4 لتر)",
      category: "SUPPLIES",
      price: 0,
      costPrice: 110,
      stockQty: 30,
      minStockAlert: 8,
      image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=500&auto=format&fit=crop&q=80",
      barcode: "SAN-001",
    },
    {
      nameAr: "مناشف قطنية بيضاء فاخرة مطرزة بشعار صدام (دستة 12 فوطة)",
      category: "ACCESSORIES",
      price: 0,
      costPrice: 320,
      stockQty: 50,
      minStockAlert: 10,
      image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=500&auto=format&fit=crop&q=80",
      barcode: "TOWEL-001",
    },
  ];

  for (const item of supplies) {
    const existing = await prisma.product.findFirst({
      where: { nameAr: item.nameAr },
    });
    if (!existing) {
      await prisma.product.create({
        data: item,
      });
      console.log(`Created supply/material: ${item.nameAr}`);
    } else {
      console.log(`Already exists: ${item.nameAr}`);
    }
  }

  console.log("Supplies seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
