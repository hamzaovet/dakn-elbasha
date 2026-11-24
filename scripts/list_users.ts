import { prisma } from "../lib/prisma";

async function main() {
  const users = await prisma.user.findMany({
    include: { branch: true, specialistProfile: true }
  });
  console.log("Total users:", users.length);
  for (const u of users) {
    console.log(JSON.stringify({
      id: u.id,
      name: u.name,
      username: u.username,
      role: u.role,
      pin: u.pin,
      branch: u.branch?.name,
      branchId: u.branchId,
      specialist: u.specialistProfile?.name
    }));
  }
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
