/**
 * Makes an existing account an admin (D-107). The panel lets admins promote
 * others, so this is only needed for the first one.
 *
 *   npm run admin:grant -- someone@example.com
 *
 * Uses DATABASE_URL like the seed: from .env.local by default; set
 * $env:DATABASE_URL in the same terminal to target production. The person
 * must have signed up already.
 */
import path from "node:path";

import { config as loadEnv } from "dotenv";
import { PrismaClient, UserRole } from "@prisma/client";

loadEnv({ path: path.join(process.cwd(), ".env.local") });

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    console.error("Pakai: npm run admin:grant -- email@contoh.com");
    process.exitCode = 1;
    return;
  }

  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.error(`Akun ${email} belum ada. Daftar dulu lewat /register, lalu ulangi.`);
      process.exitCode = 1;
      return;
    }
    if (user.role === UserRole.ADMIN) {
      console.log(`${email} sudah admin.`);
      return;
    }
    await prisma.user.update({ where: { id: user.id }, data: { role: UserRole.ADMIN } });
    await prisma.auditLog.create({
      data: {
        userId: null,
        action: "admin.set_role",
        resourceType: "user",
        resourceId: user.id,
        metadata: { from: user.role, to: UserRole.ADMIN, via: "script" },
      },
    });
    console.log(`${email} sekarang admin. Buka /dashboard/admin.`);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
