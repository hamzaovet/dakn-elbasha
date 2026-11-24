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

async function main() {
  console.log("=== UPDATING BRANCHES & USERS ===");

  // 1. Ensure 3 Official Branches Exist
  let daknBranch = await prisma.branch.findUnique({ where: { code: "BR-DAKN-MEN" } });
  if (!daknBranch) {
    daknBranch = await prisma.branch.create({
      data: {
        code: "BR-DAKN-MEN",
        name: "فرع صالون دقن الباشا (رجالي VIP)",
        address: "73 شارع ترعة الجبل، أمام مستشفى سان بول، حدائق القبة",
        phone: "01210103025",
        whatsapp: "01556782015"
      }
    });
  }

  let hammamBranch = await prisma.branch.findUnique({ where: { code: "BR-HAMMAM-WOMEN" } });
  if (!hammamBranch) {
    hammamBranch = await prisma.branch.create({
      data: {
        code: "BR-HAMMAM-WOMEN",
        name: "فرع حمام الباشا (حريمي وسبا VIP)",
        address: "84 شارع ترعة الجبل، كينج بارك مول، حدائق القبة",
        phone: "01556782015",
        whatsapp: "01556782015"
      }
    });
  }

  let newskinBranch = await prisma.branch.findUnique({ where: { code: "BR-NEWSKIN" } });
  if (!newskinBranch) {
    newskinBranch = await prisma.branch.create({
      data: {
        code: "BR-NEWSKIN",
        name: "فرع عيادة نيو سكين VIP (جلدية وليزر)",
        address: "مجموعة صالونات وسبا الباشا VIP - الطابق الملكي المخصص",
        phone: "01210103025",
        whatsapp: "01556782015"
      }
    });
  }

  // 2. Standardized Users List
  const usersToUpsert = [
    // المالك
    {
      username: "maestro",
      name: "المايسترو (مالك المنظومة والمطور)",
      passwordHash: "123456789",
      pin: "157230",
      role: "owner",
      branchId: null,
      permissions: JSON.stringify(["all"])
    },
    // المشرف العام على كل الفروع (أحمد عبد الرحيم)
    {
      username: "ahmed",
      name: "أ / أحمد عبد الرحيم (المشرف العام على العمليات والفروع)",
      passwordHash: "password123",
      pin: "157230",
      role: "general_manager",
      branchId: null, // مشرف عام على كل الفروع
      permissions: JSON.stringify([
        "view_dashboard",
        "manage_tickets",
        "approve_ticket_cancel",
        "approve_discount",
        "edit_services",
        "view_cctv",
        "view_reports",
        "manage_specialists",
        "view_attendance"
      ])
    },
    // مشرفة فرع حمام الباشا (ندى المحمدي)
    {
      username: "nada",
      name: "أ / ندى المحمدي (مديرة ومشرفة فرع حمام الباشا VIP)",
      passwordHash: "password123",
      pin: "157230",
      role: "manager",
      branchId: hammamBranch.id,
      permissions: JSON.stringify([
        "view_branch_dashboard",
        "manage_branch_tickets",
        "approve_branch_ticket_cancel",
        "view_cctv",
        "view_attendance",
        "manage_specialists"
      ])
    },
    // مشرفة فرع نيو سكين (د/ سارة إبراهيم)
    {
      username: "sara",
      name: "د / سارة إبراهيم (مديرة ومشرفة عيادة نيو سكين VIP)",
      passwordHash: "password123",
      pin: "157230",
      role: "manager",
      branchId: newskinBranch.id,
      permissions: JSON.stringify([
        "view_branch_dashboard",
        "manage_branch_tickets",
        "approve_branch_ticket_cancel",
        "view_cctv",
        "view_attendance",
        "manage_specialists"
      ])
    },
    // كاشير دقن الباشا
    {
      username: "cashier-dakn",
      name: "كاشير فرع دقن الباشا (رجالي)",
      passwordHash: "password123",
      pin: "1234",
      role: "cashier",
      branchId: daknBranch.id,
      permissions: JSON.stringify(["pos", "seat_client", "collect_payment", "print_receipt"])
    },
    // كاشير حمام الباشا
    {
      username: "cashier-hammam",
      name: "كاشير فرع حمام الباشا (حريمي)",
      passwordHash: "password123",
      pin: "1234",
      role: "cashier",
      branchId: hammamBranch.id,
      permissions: JSON.stringify(["pos", "seat_client", "collect_payment", "print_receipt"])
    },
    // كاشير نيو سكين
    {
      username: "cashier-newskin",
      name: "كاشير عيادة نيو سكين VIP",
      passwordHash: "password123",
      pin: "1234",
      role: "cashier",
      branchId: newskinBranch.id,
      permissions: JSON.stringify(["pos", "seat_client", "collect_payment", "print_receipt"])
    },
    // كابتن حسام الباشا
    {
      username: "hossam",
      name: "كابتن حسام الباشا (حلاق ومصفف VIP - كرسي #1)",
      passwordHash: "password123",
      pin: "1234",
      role: "specialist",
      branchId: daknBranch.id,
      permissions: JSON.stringify(["chair_pos", "view_ticket_services", "update_services", "punch_attendance"])
    },
    // مسؤول العروض والتسويق الرقمي
    {
      username: "marketing",
      name: "أ / شادي عادل (مسؤول العروض والتسويق الرقمي)",
      passwordHash: "password123",
      pin: "1234",
      role: "marketing",
      branchId: null,
      permissions: JSON.stringify(["manage_services", "manage_offers", "manage_social", "view_catalog"])
    }
  ];

  for (const u of usersToUpsert) {
    const existing = await prisma.user.findUnique({ where: { username: u.username } });
    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: u.name,
          passwordHash: u.passwordHash,
          pin: u.pin,
          role: u.role,
          branchId: u.branchId,
          permissions: u.permissions,
          isActive: true
        }
      });
      console.log(`Updated user: ${u.username} (${u.name})`);
    } else {
      await prisma.user.create({
        data: {
          username: u.username,
          name: u.name,
          passwordHash: u.passwordHash,
          pin: u.pin,
          role: u.role,
          branchId: u.branchId,
          permissions: u.permissions,
          isActive: true
        }
      });
      console.log(`Created user: ${u.username} (${u.name})`);
    }
  }

  // Also link Specialist record for Hossam if not linked
  const hossamUser = await prisma.user.findUnique({ where: { username: "hossam" } });
  if (hossamUser) {
    let spec = await prisma.specialist.findFirst({
      where: { name: { contains: "حسام" } }
    });
    if (spec) {
      await prisma.specialist.update({
        where: { id: spec.id },
        data: { userId: hossamUser.id, branchId: daknBranch.id }
      });
      console.log(`Linked specialist record #${spec.id} to hossam user.`);
    }
  }

  console.log("All users standardized successfully!");
}

main().catch(console.error).finally(() => pool.end());
