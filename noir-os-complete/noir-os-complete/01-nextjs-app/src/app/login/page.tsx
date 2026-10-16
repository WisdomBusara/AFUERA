"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/board");
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${location.origin}/auth/confirm` },
        });
        if (error) throw error;
        if (data.session) {
          router.push("/board");
          router.refresh();
        } else {
          setNotice("Check your email to confirm your account, then sign in.");
          setMode("signin");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const field =
    "w-full rounded-[10px] border border-[var(--afa-line)] bg-[var(--afa-surface)] px-3.5 py-2.5 text-[14px] outline-none transition focus:border-[var(--afa-accent)] focus:ring-2 focus:ring-[var(--afa-accent-soft)]";

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left: the brand / horizon panel */}
      <div className="relative hidden overflow-hidden lg:block" style={{ background: "#0e1016" }}>
        <div className="absolute inset-0" style={{ background: "radial-gradient(120% 80% at 20% 0%, rgba(91,140,255,.35), transparent 55%), radial-gradient(100% 70% at 90% 100%, rgba(255,178,122,.28), transparent 55%)" }} />
        <div className="absolute left-0 right-0 top-1/2 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,178,122,.7) 40%, rgba(91,140,255,.7) 70%, transparent)" }} />
        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="afa-mark" style={{ width: 34, height: 34 }} />
            <span className="text-[18px] font-semibold text-white">Noir OS</span>
          </div>
          <div>
            <h2 className="max-w-md text-[32px] font-semibold leading-tight tracking-tight text-white">
              Your personal operating system.
            </h2>
            <p className="mt-4 max-w-md text-[14px] leading-relaxed text-white/60">
              Projects, day-to-day plans, and a morning brief that lands in your inbox —
              your whole life in one calm, fast workspace.
            </p>
          </div>
          <div className="text-[12px] text-white/40">Noir OS</div>
        </div>
      </div>

      {/* Right: the form */}
      <div className="flex items-center justify-center bg-[var(--afa-canvas)] px-6 py-12">
        <div className="w-full max-w-[380px]">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="afa-mark" />
            <span className="text-[17px] font-semibold">Noir OS</span>
          </div>

          <h1 className="text-[22px] font-semibold tracking-tight">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1.5 text-[13.5px] text-[var(--afa-ink-2)]">
            {mode === "signin"
              ? "Sign in to your content workspace."
              : "Sign up with any email to get started."}
          </p>

          <form onSubmit={submit} className="mt-7 flex flex-col gap-3.5">
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-[var(--afa-ink-2)]">Email</label>
              <input type="email" required autoComplete="email" className={field} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-[var(--afa-ink-2)]">Password</label>
              <input type="password" required minLength={6} autoComplete={mode === "signin" ? "current-password" : "new-password"} className={field} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
            </div>

            {error && <div className="rounded-[10px] bg-[#fdecec] px-3.5 py-2.5 text-[12.5px] font-medium text-[var(--afa-bad)]">{error}</div>}
            {notice && <div className="rounded-[10px] bg-[#eafaf1] px-3.5 py-2.5 text-[12.5px] font-medium text-[var(--afa-ok)]">{notice}</div>}

            <button
              type="submit"
              disabled={loading}
              className="afa-ai-btn mt-1 justify-center py-2.5 text-[13.5px] disabled:opacity-60"
              style={{ background: "linear-gradient(120deg, var(--afa-dawn-a), var(--afa-dawn-b))" }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={15} />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-[13px] text-[var(--afa-ink-2)]">
            {mode === "signin" ? "New to Afuera? " : "Already have an account? "}
            <button
              className="font-semibold text-[var(--afa-accent-ink)] hover:underline"
              onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); setNotice(null); }}
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
