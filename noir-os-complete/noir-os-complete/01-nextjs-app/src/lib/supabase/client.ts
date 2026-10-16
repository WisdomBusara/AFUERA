import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client. Stores the session in cookies (via @supabase/ssr)
// so Server Components and the middleware can read it too.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
