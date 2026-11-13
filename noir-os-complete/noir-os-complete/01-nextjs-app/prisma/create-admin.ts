import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

// Creates (or resets the password of) a super admin who can sign in.
//   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='...' [ADMIN_NAME='Your Name'] npm run db:admin
// Safe to re-run: an existing member with that email is updated in place.

const prisma = new PrismaClient();
const PALETTE = ["#2E63F6", "#EC4899", "#8B5CF6", "#0EA5A4", "#F79009", "#12B76A"];

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Set ADMIN_EMAIL to a valid email address.");
  if (password.length < 12) throw new Error("Set ADMIN_PASSWORD to at least 12 characters.");

  const name = (process.env.ADMIN_NAME ?? "").trim() || "Super Admin";
  const initials = name.split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase();
  const passwordHash = await hashPassword(password);

  const ws =
    (await prisma.workspace.findFirst({ orderBy: { createdAt: "asc" } })) ??
    (await prisma.workspace.create({ data: { name: "Noir OS", slug: "noir-os" } }));

  const existing = await prisma.member.findFirst({ where: { email } });
  if (existing) {
    await prisma.member.update({ where: { id: existing.id }, data: { passwordHash, isSuperAdmin: true } });
    console.log(`Updated ${email}: password reset, super admin on.`);
  } else {
    await prisma.member.create({
      data: {
        name, initials, email, passwordHash, isSuperAdmin: true,
        color: PALETTE[0], role: "Super admin", online: true,
        authUserId: `local_${randomUUID()}`, workspaceId: ws.id,
      },
    });
    console.log(`Created super admin ${email} in workspace "${ws.name}".`);
  }
}

main()
  .catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
