"use client";

import { useState } from "react";
import { Mail, Loader2, Check } from "lucide-react";
import { sendDailyBrief } from "./actions";

export function BriefEmailButton() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [msg, setMsg] = useState<string | null>(null);

  async function send() {
    setState("sending");
    setMsg(null);
    const res = await sendDailyBrief();
    if (res.ok) {
      setState("sent");
      setMsg(`Sent to ${res.to}`);
      setTimeout(() => setState("idle"), 4000);
    } else {
      setState("error");
      setMsg(res.error ?? "Couldn't send.");
    }
  }

  return (
    <div className="flex items-center gap-2.5">
      <button
        onClick={send}
        disabled={state === "sending"}
        className="inline-flex items-center gap-2 rounded-[10px] border border-[var(--afa-line)] bg-[var(--afa-surface)] px-3.5 py-2 text-[12.5px] font-semibold text-[var(--afa-ink-2)] transition hover:bg-[var(--afa-surface-2)] disabled:opacity-60"
      >
        {state === "sending" ? <Loader2 size={14} className="animate-spin" /> : state === "sent" ? <Check size={14} className="text-[var(--afa-ok)]" /> : <Mail size={14} />}
        Email me this brief
      </button>
      {msg && <span className="afa-meta" style={{ color: state === "error" ? "var(--afa-bad)" : "var(--afa-ok)" }}>{msg}</span>}
    </div>
  );
}
