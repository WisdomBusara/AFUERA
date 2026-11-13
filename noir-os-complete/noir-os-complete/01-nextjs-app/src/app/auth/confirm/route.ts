import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Supabase redirects here from the confirmation email with a token hash.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  // Only same-site paths: "//host" or "/\host" would be read as another origin.
  const requested = searchParams.get("next") ?? "/board";
  const next = /^\/(?![/\\])/.test(requested) ? requested : "/board";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) return redirectTo(next);
  }

  return redirectTo("/login?error=Could%20not%20confirm%20email");
}

// Relative Location: behind the tunnel, request.url's origin is the bind address
// (localhost:PORT), so an absolute redirect built from it would leave the site.
function redirectTo(path: string) {
  return new NextResponse(null, { status: 307, headers: { Location: path } });
}
