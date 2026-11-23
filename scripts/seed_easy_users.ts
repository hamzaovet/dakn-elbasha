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

async function main() {
  console.log("👤 Seeding Easy Single-Word Staff Users for Dakn El Basha & Hammam El Basha...");

  // Find branches
  const daknBranch = await prisma.branch.findFirst({ where: { code: "BR-DAKN-MEN" } });
  const hammamBranch = await prisma.branch.findFirst({ where: { code: "BR-HAMMAM-WOMEN" } });

  // 1. Maestro (Owner)
  await prisma.user.upsert({
    where: { username: "maestro" },
    update: {
      passwordHash: "123456789",
      pin: "157230",
      role: "owner",
      name: "المايسترو (مالك المنظومة)",
    },
    create: {
      name: "المايسترو (مالك المنظومة)",
      username: "maestro",
      passwordHash: "123456789",
      pin: "157230",
      phone: "01018671000",
      role: "owner",
    },
  });
  console.log("  ✓ maestro (Owner): 123456789 | PIN: 157230");

  // 2. Basha (General Manager)
  await prisma.user.upsert({
    where: { username: "basha" },
    update: {
      passwordHash: "basha2026",
      pin: "246810",
      role: "general_manager",
      name: "مدير عام صالونات الباشا",
      branchId: daknBranch?.id || null,
    },
    create: {
      name: "مدير عام صالونات الباشا",
      username: "basha",
      passwordHash: "basha2026",
      pin: "246810",
      phone: "01210103025",
      role: "general_manager",
      branchId: daknBranch?.id || null,
    },
  });
  console.log("  ✓ basha (General Manager): basha2026 | PIN: 246810");

  // 3. Hammam (Ladies Spa Manager)
  await prisma.user.upsert({
    where: { username: "hammam" },
    update: {
      passwordHash: "hammam2026",
      pin: "357910",
      role: "manager",
      name: "مديرة حمام وسبا الباشا",
      branchId: hammamBranch?.id || null,
    },
    create: {
      name: "مديرة حمام وسبا الباشا",
      username: "hammam",
      passwordHash: "hammam2026",
      pin: "357910",
      phone: "01556782015",
      role: "manager",
      branchId: hammamBranch?.id || null,
    },
  });
  console.log("  ✓ hammam (Hammam Manager): hammam2026 | PIN: 357910");

  // 4. Coordinator (Salon Floor Coordinator)
  await prisma.user.upsert({
    where: { username: "coordinator" },
    update: {
      passwordHash: "coord123",
      pin: "468020",
      role: "coordinator",
      name: "منسق صالة صالون دقن الباشا",
      branchId: daknBranch?.id || null,
    },
    create: {
      name: "منسق صالة صالون دقن الباشا",
      username: "coordinator",
      passwordHash: "coord123",
      pin: "468020",
      phone: "01210103025",
      role: "coordinator",
      branchId: daknBranch?.id || null,
    },
  });
  console.log("  ✓ coordinator (Floor Coordinator): coord123 | PIN: 468020");

  // 5. Reception (Ladies Receptionist)
  await prisma.user.upsert({
    where: { username: "reception" },
    update: {
      passwordHash: "recep123",
      pin: "579130",
      role: "receptionist",
      name: "استقبال حمام الباشا للسيدات",
      branchId: hammamBranch?.id || null,
    },
    create: {
      name: "استقبال حمام الباشا للسيدات",
      username: "reception",
      passwordHash: "recep123",
      pin: "579130",
      phone: "01556782015",
      role: "receptionist",
      branchId: hammamBranch?.id || null,
    },
  });
  console.log("  ✓ reception (Ladies Reception): recep123 | PIN: 579130");

  // 6. Cashier (Cashier / POS)
  await prisma.user.upsert({
    where: { username: "cashier" },
    update: {
      passwordHash: "cashier123",
      pin: "680240",
      role: "cashier",
      name: "كاشير صالونات الباشا",
      branchId: daknBranch?.id || null,
    },
    create: {
      name: "كاشير صالونات الباشا",
      username: "cashier",
      passwordHash: "cashier123",
      pin: "680240",
      phone: "01210103025",
      role: "cashier",
      branchId: daknBranch?.id || null,
    },
  });
  console.log("  ✓ cashier (POS Cashier): cashier123 | PIN: 680240");

  console.log("✅ All easy single-word users seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding easy users:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
