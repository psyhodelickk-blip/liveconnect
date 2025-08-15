// liveconnect-backend/prisma/seed.js
import bcrypt from "bcryptjs";
import prisma from "../prismaClient.js";

async function main() {
  const users = [
    { username: "lesto", password: "test12345", email: "lesto@example.com" },
    { username: "lesto2", password: "test23456", email: "lesto2@example.com" },
  ];

  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: {
        username: u.username,
        email: u.email,
        passwordHash: hash,
      },
    });
  }

  console.log("Seed OK");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
