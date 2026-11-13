import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/auth", "/api"];

// Refreshes the auth session on every request and guards private routes.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: do not run logic between createServerClient and getUser().
  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));

  if (!user && !isPublic) return redirectTo("/login");
  if (user && path === "/login") return redirectTo("/board");

  return response;
}

// Redirect with a relative Location. Behind a tunnel/proxy, `next start -H 127.0.0.1`
// makes request.nextUrl resolve to the bind address (localhost:PORT), so an absolute
// redirect built from it sends browsers to localhost. A relative path is host-agnostic.
function redirectTo(path: string) {
  return new NextResponse(null, { status: 307, headers: { Location: path } });
}
