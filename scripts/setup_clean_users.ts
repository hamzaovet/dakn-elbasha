import { prisma } from "../lib/prisma";

async function main() {
  console.log("Setting up standardized, clean user roster...");

  // 1. Fetch branches
  const branches = await prisma.branch.findMany();
  const daknBranch = branches.find(b => b.code === "BR-DAKN-MEN" || b.name.includes("دقن"));
  const hammamBranch = branches.find(b => b.code === "BR-HAMMAM-WOMEN" || b.name.includes("حمام"));
  const newSkinBranch = branches.find(b => b.code === "BR-NEWSKIN" || b.name.includes("نيو سكين") || b.name.includes("Skin"));

  if (!daknBranch || !hammamBranch || !newSkinBranch) {
    throw new Error("One or more branches not found!");
  }

  // 2. The Master/Owner (The USER) -> Stays as is!
  await prisma.user.upsert({
    where: { username: "maestro" },
    update: {
      name: "المايسترو (مالك المنظومة والمطور)",
      role: "owner",
      isActive: true,
    },
    create: {
      username: "maestro",
      name: "المايسترو (مالك المنظومة والمطور)",
      passwordHash: "123456789",
      pin: "157230",
      role: "owner",
      isActive: true,
    }
  });

  // 3. The Client / Salon Owner (كابتن الباشا)
  await prisma.user.upsert({
    where: { username: "basha" },
    update: {
      name: "كابتن الباشا (المدير العام والمالك)",
      role: "general_manager",
      passwordHash: "basha123",
      pin: "112233",
      branchId: null, // multi-branch
      isActive: true,
    },
    create: {
      username: "basha",
      name: "كابتن الباشا (المدير العام والمالك)",
      role: "general_manager",
      passwordHash: "basha123",
      pin: "112233",
      branchId: null,
      isActive: true,
    }
  });

  // 4. Central Booking Dispatcher (مسئول الحجوزات العام لكافة الفروع)
  await prisma.user.upsert({
    where: { username: "booking" },
    update: {
      name: "مسئول الحجوزات المركزي لكافة الفروع",
      role: "booking_dispatcher",
      passwordHash: "booking123",
      pin: "223344",
      branchId: null,
      isActive: true,
    },
    create: {
      username: "booking",
      name: "مسئول الحجوزات المركزي لكافة الفروع",
      role: "booking_dispatcher",
      passwordHash: "booking123",
      pin: "223344",
      branchId: null,
      isActive: true,
    }
  });

  // 5. Central Warehouse Manager (مسئول المخزن العام)
  await prisma.user.upsert({
    where: { username: "warehouse" },
    update: {
      name: "مسئول المخزن العام ومستلزمات الفروع",
      role: "warehouse_manager",
      passwordHash: "store123",
      pin: "334455",
      branchId: null,
      isActive: true,
    },
    create: {
      username: "warehouse",
      name: "مسئول المخزن العام ومستلزمات الفروع",
      role: "warehouse_manager",
      passwordHash: "store123",
      pin: "334455",
      branchId: null,
      isActive: true,
    }
  });

  // 6. Branch Cashiers (كاشير لكل فرع)
  // Cashier Dakn (Men)
  await prisma.user.upsert({
    where: { username: "cashier1" },
    update: {
      name: "كاشير فرع دقن الباشا (رجالي)",
      role: "cashier",
      passwordHash: "cash123",
      pin: "445566",
      branchId: daknBranch.id,
      isActive: true,
    },
    create: {
      username: "cashier1",
      name: "كاشير فرع دقن الباشا (رجالي)",
      role: "cashier",
      passwordHash: "cash123",
      pin: "445566",
      branchId: daknBranch.id,
      isActive: true,
    }
  });

  // Cashier Hammam (Women)
  await prisma.user.upsert({
    where: { username: "cashier2" },
    update: {
      name: "كاشير فرع حمام الباشا (حريمي)",
      role: "cashier",
      passwordHash: "cash456",
      pin: "556677",
      branchId: hammamBranch.id,
      isActive: true,
    },
    create: {
      username: "cashier2",
      name: "كاشير فرع حمام الباشا (حريمي)",
      role: "cashier",
      passwordHash: "cash456",
      pin: "556677",
      branchId: hammamBranch.id,
      isActive: true,
    }
  });

  // Cashier New Skin (Clinic)
  await prisma.user.upsert({
    where: { username: "cashier3" },
    update: {
      name: "كاشير عيادة نيو سكين VIP",
      role: "cashier",
      passwordHash: "cash789",
      pin: "667788",
      branchId: newSkinBranch.id,
      isActive: true,
    },
    create: {
      username: "cashier3",
      name: "كاشير عيادة نيو سكين VIP",
      role: "cashier",
      passwordHash: "cash789",
      pin: "667788",
      branchId: newSkinBranch.id,
      isActive: true,
    }
  });

  // 7. Specialists Users (لكل مختص يوزر منفصل ومربوط ببروفايله)
  const specialists = await prisma.specialist.findMany({
    include: { branch: true }
  });

  console.log(`Found ${specialists.length} specialists. Setting up user accounts...`);

  // Mapping for single word usernames, unique pins & passwords
  const specMap: Record<string, { username: string; pin: string; pass: string }> = {
    "حسام": { username: "hossam", pin: "711201", pass: "hos123" },
    "إسلام": { username: "eslam", pin: "711202", pass: "esl123" },
    "كريم": { username: "kareem", pin: "711203", pass: "kar123" },
    "زياد": { username: "zeyad", pin: "711204", pass: "zey123" },
    "أمينة": { username: "amina", pin: "822301", pass: "ami123" },
    "مروة": { username: "marwa", pin: "822302", pass: "mar123" },
    "ياسمين الشريف": { username: "yasmin", pin: "822303", pass: "yas123" },
    "سارة": { username: "sara", pin: "822304", pass: "sar123" },
    "ياسمين محمود": { username: "dryasmin", pin: "933401", pass: "dryas123" },
    "ندى": { username: "nada", pin: "933402", pass: "nad123" },
  };

  for (const s of specialists) {
    let key = Object.keys(specMap).find(k => s.name.includes(k));
    let cfg = key ? specMap[key] : {
      username: `spec${s.chairNumber}`,
      pin: `99${s.chairNumber.toString().padStart(2, "0")}1`,
      pass: `spec${s.chairNumber}123`
    };

    const user = await prisma.user.upsert({
      where: { username: cfg.username },
      update: {
        name: s.name,
        role: "specialist",
        passwordHash: cfg.pass,
        pin: cfg.pin,
        branchId: s.branchId,
        isActive: true,
      },
      create: {
        username: cfg.username,
        name: s.name,
        role: "specialist",
        passwordHash: cfg.pass,
        pin: cfg.pin,
        branchId: s.branchId,
        isActive: true,
      }
    });

    await prisma.specialist.update({
      where: { id: s.id },
      data: { userId: user.id }
    });

    console.log(`Linked specialist [${s.name}] -> user [${cfg.username}], PIN: [${cfg.pin}]`);
  }

  console.log("All users successfully configured!");
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
