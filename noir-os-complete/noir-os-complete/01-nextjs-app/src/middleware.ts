import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

// /api routes guard themselves (session, or the cron bearer secret).
const PUBLIC_PATHS = ["/login", "/api"];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + "/"))) return NextResponse.next();

  const memberId = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (memberId) return NextResponse.next();

  return redirectTo(request, "/login");
}

// Behind a tunnel/proxy, `next start -H 127.0.0.1` makes request.nextUrl resolve to the
// bind address (localhost:PORT), so a redirect built from it sends browsers to localhost.
// Middleware redirects must be absolute, so rebuild the origin from the public Host.
function redirectTo(request: NextRequest, path: string) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
  const origin = host ? `${proto}://${host}` : request.nextUrl.origin;
  return NextResponse.redirect(new URL(path, origin));
}

export const config = {
  matcher: [
    // Run on everything except static assets and image files.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
