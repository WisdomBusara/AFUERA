"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/session";

// In-memory throttle: 5 failed attempts per email locks it for 15 minutes. The app
// runs as a single process, so a Map is enough; it resets on restart.
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;
const fails = new Map<string, { count: number; until: number }>();

// Compared against when the email is unknown, so both paths cost one scrypt.
const dummyHash = hashPassword("not-a-real-password");

const signinSchema = z.object({
  email: z.string().email().max(160),
  password: z.string().min(1).max(200),
});

export async function signin(input: z.infer<typeof signinSchema>) {
  const parsed = signinSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Enter your email and password." };
  const email = parsed.data.email.trim().toLowerCase();

  const now = Date.now();
  const entry = fails.get(email);
  if (entry && entry.count >= MAX_FAILS && entry.until > now) {
    return { ok: false as const, error: "Too many attempts. Try again in a few minutes." };
  }

  const member = await prisma.member.findFirst({ where: { email, passwordHash: { not: null } } });
  const valid = await verifyPassword(parsed.data.password, member?.passwordHash ?? (await dummyHash));

  if (!member || !valid) {
    const count = entry && entry.until > now ? entry.count + 1 : 1;
    fails.set(email, { count, until: now + LOCK_MS });
    return { ok: false as const, error: "Wrong email or password." };
  }

  fails.delete(email);
  (await cookies()).set(SESSION_COOKIE, await signSession(member.id), sessionCookieOptions);
  return { ok: true as const };
}

export async function signout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
