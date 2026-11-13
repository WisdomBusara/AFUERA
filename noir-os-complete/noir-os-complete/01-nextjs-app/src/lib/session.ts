import { SignJWT, jwtVerify } from "jose";

// Signed session cookie (HS256 JWT whose subject is the Member id). Kept free of
// next/headers so the middleware (edge runtime) can import it too.
export const SESSION_COOKIE = "afuera_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET must be set (32+ characters).");
  return new TextEncoder().encode(secret);
}

export async function signSession(memberId: string) {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(memberId)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(key());
}

/** Returns the member id for a valid, unexpired token; null otherwise. */
export async function verifySession(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE,
};
