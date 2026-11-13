"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2, Save, Loader2, Sparkles, Check } from "lucide-react";
import { saveBrandKit, type BrandKitInput } from "./actions";

const label = "mb-3 text-[12px] font-semibold uppercase tracking-wide text-[var(--afa-ink-3)]";
const input = "w-full rounded-[9px] border border-[var(--afa-line)] bg-[var(--afa-surface)] px-3 py-2 text-[13px] outline-none focus:border-[var(--afa-accent)]";
const addBtn = "mt-2 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--afa-accent-ink)] hover:underline";

export function BrandClient({ initial, isNew }: { initial: BrandKitInput; isNew: boolean }) {
  const [kit, setKit] = useState<BrandKitInput>(initial);
  const [tags, setTags] = useState(initial.hashtags.join(" "));
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<{ kind: "idle" | "saved" | "error"; msg?: string }>({ kind: "idle" });

  const set = <K extends keyof BrandKitInput>(k: K, v: BrandKitInput[K]) => {
    setKit((x) => ({ ...x, [k]: v }));
    setState({ kind: "idle" });
  };

  async function save() {
    setSaving(true);
    const payload: BrandKitInput = {
      ...kit,
      // Blank rows are dropped rather than rejected.
      colors: kit.colors.filter((c) => c.name.trim()),
      voiceRules: kit.voiceRules.filter((r) => r.title.trim()),
      hashtags: tags.split(/[\s,]+/).filter(Boolean),
    };
    const res = await saveBrandKit(payload).catch(() => ({ ok: false as const, error: "Couldn't save the brand kit." }));
    setSaving(false);
    setState(res.ok ? { kind: "saved" } : { kind: "error", msg: res.error });
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-5 md:px-[26px]">
      {isNew && (
        <div className="afa-panel mb-4 p-4 text-[13px] text-[var(--afa-ink-2)]">
          No brand kit yet. Fill in what you have and save — the AI Workspace uses it as its voice guide.
        </div>
      )}

      {/* Colour */}
      <div className="afa-panel mb-4 p-6">
        <div className={label}>Colour</div>
        <div className="grid gap-3 sm:grid-cols-2">
          {kit.colors.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="color"
                value={/^#[0-9a-fA-F]{6}$/.test(c.hex) ? c.hex : "#000000"}
                onChange={(e) => set("colors", kit.colors.map((x, k) => (k === i ? { ...x, hex: e.target.value.toUpperCase() } : x)))}
                className="h-9 w-10 flex-none cursor-pointer rounded-lg border border-[var(--afa-line)] bg-transparent p-0.5"
                aria-label="Colour value"
              />
              <input className={input} value={c.name} placeholder="Colour name" maxLength={40}
                onChange={(e) => set("colors", kit.colors.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} />
              <span className="mono w-[68px] flex-none text-[11.5px] text-[var(--afa-ink-3)]">{c.hex}</span>
              <button onClick={() => set("colors", kit.colors.filter((_, k) => k !== i))} className="text-[var(--afa-ink-4)] hover:text-[var(--afa-bad)]" aria-label="Remove colour">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <button className={addBtn} onClick={() => set("colors", [...kit.colors, { name: "", hex: "#2E63F6" }])}><Plus size={13} /> Add colour</button>
      </div>

      <div className="mb-4 grid gap-4 md:grid-cols-2">
        {/* Typography */}
        <div className="afa-panel p-6">
          <div className={label}>Typography</div>
          <label className="afa-meta mb-1 block">Display font</label>
          <input className={input} value={kit.fontDisplay} maxLength={80} placeholder="e.g. Inter · 700" onChange={(e) => set("fontDisplay", e.target.value)} />
          <label className="afa-meta mb-1 mt-3 block">Body font</label>
          <input className={input} value={kit.fontBody} maxLength={80} placeholder="e.g. Inter · 400" onChange={(e) => set("fontBody", e.target.value)} />
        </div>

        {/* Voice & tone */}
        <div className="afa-panel p-6">
          <div className={label}>Voice &amp; tone rules</div>
          {kit.voiceRules.map((r, i) => (
            <div key={i} className="mb-2 flex items-start gap-2">
              <div className="flex-1">
                <input className={input} value={r.title} placeholder="Rule" maxLength={80}
                  onChange={(e) => set("voiceRules", kit.voiceRules.map((x, k) => (k === i ? { ...x, title: e.target.value } : x)))} />
                <input className={input + " mt-1.5"} value={r.detail} placeholder="What it means in practice" maxLength={300}
                  onChange={(e) => set("voiceRules", kit.voiceRules.map((x, k) => (k === i ? { ...x, detail: e.target.value } : x)))} />
              </div>
              <button onClick={() => set("voiceRules", kit.voiceRules.filter((_, k) => k !== i))} className="mt-2.5 text-[var(--afa-ink-4)] hover:text-[var(--afa-bad)]" aria-label="Remove rule">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button className={addBtn} onClick={() => set("voiceRules", [...kit.voiceRules, { title: "", detail: "" }])}><Plus size={13} /> Add rule</button>
        </div>
      </div>

      <div className="mb-4 afa-panel p-6">
        <div className={label}>Voice summary</div>
        <textarea className={input} rows={3} maxLength={1500} value={kit.voiceSummary}
          placeholder="A short paragraph describing how the brand sounds. This is given to the AI Workspace word for word."
          onChange={(e) => set("voiceSummary", e.target.value)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="afa-panel p-6">
          <div className={label}>Approved hashtags</div>
          <textarea className={input} rows={3} value={tags} placeholder="#YourBrand #AnotherTag"
            onChange={(e) => { setTags(e.target.value); setState({ kind: "idle" }); }} />
          <div className="afa-meta mt-1 text-[11px]">Separate with spaces or commas.</div>
        </div>
        <div className="afa-panel p-6">
          <div className={label}>Legal disclaimer</div>
          <textarea className={input} rows={3} maxLength={1000} value={kit.legalDisclaimer}
            placeholder="Claims, disclosures or wording your content must respect."
            onChange={(e) => set("legalDisclaimer", e.target.value)} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button onClick={save} disabled={saving}
          className="inline-flex items-center gap-2 rounded-[9px] bg-[var(--afa-accent)] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[var(--afa-accent-ink)] disabled:opacity-60">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save brand kit
        </button>
        {state.kind === "saved" && <span className="flex items-center gap-1 text-[12.5px] font-semibold text-[var(--afa-ok)]"><Check size={14} /> Saved</span>}
        {state.kind === "error" && <span className="text-[12.5px] font-medium text-[var(--afa-bad)]">{state.msg}</span>}
        <Link href="/ai" className="ml-auto inline-flex items-center gap-2 text-[12.5px] font-semibold" style={{ color: "#FF6F91" }}>
          <Sparkles size={14} /> The AI Workspace follows this kit when it generates content.
        </Link>
      </div>
    </div>
  );
}
