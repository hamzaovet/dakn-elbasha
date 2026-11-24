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
  console.log("=== USERS IN DB ===");
  const users = await prisma.user.findMany({
    include: { branch: true },
    orderBy: { createdAt: "asc" }
  });
  console.log(JSON.stringify(users.map(u => ({
    id: u.id,
    name: u.name,
    username: u.username,
    password: u.passwordHash,
    pin: u.pin,
    role: u.role,
    branch: u.branch ? u.branch.name : "ALL",
    branchCode: u.branch ? u.branch.code : null,
    isActive: u.isActive
  })), null, 2));

  console.log("=== BRANCHES IN DB ===");
  const branches = await prisma.branch.findMany();
  console.log(JSON.stringify(branches.map(b => ({ id: b.id, name: b.name, code: b.code })), null, 2));

  console.log("=== SERVICES IN DB ===");
  const services = await prisma.service.findMany();
  console.log(`Total services in DB: ${services.length}`);
  console.log(JSON.stringify(services.map(s => ({ id: s.id, nameAr: s.nameAr, category: s.category, price: s.price })), null, 2));
}

main().catch(console.error).finally(() => pool.end());
