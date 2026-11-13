"use client";

import { useState } from "react";
import { Plus, Trash2, Layers, Send, CheckCircle2, ShieldCheck, CalendarDays } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { createCampaign, updateCampaign, deleteCampaign } from "./actions";

export type CampaignDTO = {
  id: string;
  name: string;
  color: string;
  objective: string;
  endDate: string | null;
  total: number;
  inReview: number;
  scheduled: number;
  published: number;
  dist: { label: string; color: string; value: number }[];
  owners: { id: string; name: string; initials: string; color: string }[];
};

const SWATCHES = ["#2E63F6", "#EC4899", "#8B5CF6", "#0EA5A4", "#F79009", "#12B76A"];
const toDateInput = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 10) : "");
const fromDateInput = (v: string) => (v ? new Date(`${v}T23:59:00`).toISOString() : null);

function Swatches({ value, onPick }: { value: string; onPick: (c: string) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      {SWATCHES.map((c) => (
        <button key={c} type="button" onClick={() => onPick(c)} aria-label={`Colour ${c}`}
          className="h-[18px] w-[18px] rounded-full transition"
          style={{ background: c, outline: value === c ? "2px solid var(--afa-ink)" : "none", outlineOffset: 2 }} />
      ))}
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--afa-surface-3)] text-[var(--afa-ink-2)]">{icon}</span>
      <div className="leading-tight">
        <div className="mono text-[14px] font-bold">{value}</div>
        <div className="afa-meta text-[10px]">{label}</div>
      </div>
    </div>
  );
}

export function CampaignsClient({ initial }: { initial: CampaignDTO[] }) {
  const [campaigns, setCampaigns] = useState<CampaignDTO[]>(initial);
  const [name, setName] = useState("");
  const [color, setColor] = useState(SWATCHES[0]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    const trimmed = name.trim();
    if (!trimmed || creating) return;
    setCreating(true);
    setError(null);
    try {
      const res = await createCampaign({ name: trimmed, color });
      setCampaigns((cs) => [
        ...cs,
        { id: res.id, name: trimmed, color, objective: "", endDate: null, total: 0, inReview: 0, scheduled: 0, published: 0, dist: [], owners: [] },
      ]);
      setName("");
    } catch {
      setError("Couldn't create that campaign.");
    } finally {
      setCreating(false);
    }
  }

  function patch(id: string, p: Partial<Pick<CampaignDTO, "name" | "color" | "objective" | "endDate">>) {
    setCampaigns((cs) => cs.map((c) => (c.id === id ? { ...c, ...p } : c)));
    setError(null);
    updateCampaign({ id, ...p }).catch(() => setError("Couldn't save that change."));
  }

  async function remove(c: CampaignDTO) {
    if (!window.confirm(`Delete the campaign "${c.name}"?`)) return;
    setError(null);
    const res = await deleteCampaign({ id: c.id }).catch(() => ({ ok: false as const, error: "Delete failed." }));
    if (res.ok) setCampaigns((cs) => cs.filter((x) => x.id !== c.id));
    else setError(res.error);
  }

  return (
    <div className="px-6 py-5 md:px-[26px]">
      <div className="afa-panel mb-4 flex flex-wrap items-center gap-2 p-3">
        <Swatches value={color} onPick={setColor} />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") add(); }}
          placeholder="New campaign name…"
          maxLength={120}
          className="min-w-[160px] flex-1 border-none bg-transparent px-2 text-[14px] outline-none"
        />
        <button onClick={add} disabled={!name.trim() || creating}
          className="inline-flex items-center gap-1.5 rounded-[9px] bg-[var(--afa-accent)] px-3.5 py-2 text-[12.5px] font-semibold text-white hover:bg-[var(--afa-accent-ink)] disabled:opacity-50">
          <Plus size={14} /> Add campaign
        </button>
      </div>

      {error && <div className="mb-4 rounded-[10px] bg-[#fdecec] px-3.5 py-2.5 text-[12.5px] font-medium text-[var(--afa-bad)]">{error}</div>}

      {campaigns.length === 0 ? (
        <div className="afa-panel py-16 text-center text-[13px] text-[var(--afa-ink-3)]">
          No campaigns yet. Add your first one above — content cards are created inside a campaign.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {campaigns.map((c) => {
            const pct = c.total ? Math.round((c.published / c.total) * 100) : 0;
            return (
              <div key={c.id} className="afa-panel overflow-hidden">
                <div style={{ height: 6, background: `linear-gradient(90deg, ${c.color}, ${c.color}88)` }} />
                <div className="p-5">
                  <div className="flex items-center gap-2.5">
                    <span className="afa-sdot" style={{ background: c.color, width: 10, height: 10 }} />
                    <input
                      defaultValue={c.name}
                      maxLength={120}
                      aria-label="Campaign name"
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (!v) { e.target.value = c.name; return; }
                        if (v !== c.name) patch(c.id, { name: v });
                      }}
                      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                      className="min-w-0 flex-1 rounded bg-transparent text-[15.5px] font-semibold tracking-tight outline-none focus:bg-[var(--afa-surface-3)] focus:px-1.5"
                    />
                    <button onClick={() => remove(c)} className="text-[var(--afa-ink-4)] hover:text-[var(--afa-bad)]" aria-label="Delete campaign">
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <textarea
                    defaultValue={c.objective}
                    rows={2}
                    maxLength={400}
                    placeholder="What is this campaign for?"
                    aria-label="Objective"
                    onBlur={(e) => { const v = e.target.value.trim(); if (v !== c.objective) patch(c.id, { objective: v }); }}
                    className="mt-2 w-full resize-none rounded bg-transparent text-[12.5px] leading-relaxed text-[var(--afa-ink-2)] outline-none placeholder:text-[var(--afa-ink-4)] focus:bg-[var(--afa-surface-3)] focus:px-1.5"
                  />

                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <Swatches value={c.color} onPick={(col) => patch(c.id, { color: col })} />
                    <label className="afa-meta ml-auto flex items-center gap-1.5 text-[11.5px]">
                      <CalendarDays size={12} /> Ends
                      <input
                        type="date"
                        value={toDateInput(c.endDate)}
                        onChange={(e) => patch(c.id, { endDate: fromDateInput(e.target.value) })}
                        className="rounded-md border border-[var(--afa-line)] bg-[var(--afa-surface)] px-2 py-1 text-[12px] outline-none focus:border-[var(--afa-accent)]"
                      />
                    </label>
                  </div>

                  <div className="mb-1.5 mt-4 flex items-center justify-between text-[11.5px]">
                    <span className="afa-meta">Published</span>
                    <span className="mono font-semibold">{c.published}/{c.total} · {pct}%</span>
                  </div>
                  <div className="afa-meter"><i style={{ width: `${pct}%`, background: c.color }} /></div>

                  <div className="mt-4">
                    <div className="afa-meta mb-1.5">Pipeline · {c.total} {c.total === 1 ? "item" : "items"}</div>
                    <div className="flex h-2 overflow-hidden rounded-full bg-[var(--afa-surface-3)]">
                      {c.dist.map((d) => (
                        <div key={d.label} title={`${d.label}: ${d.value}`} style={{ width: `${(d.value / Math.max(1, c.total)) * 100}%`, background: d.color }} />
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-5 border-t border-[var(--afa-line-2)] pt-4">
                    <Stat icon={<Layers size={14} />} value={c.total} label="Total" />
                    <Stat icon={<ShieldCheck size={14} />} value={c.inReview} label="In review" />
                    <Stat icon={<Send size={14} />} value={c.scheduled} label="Scheduled" />
                    <Stat icon={<CheckCircle2 size={14} />} value={c.published} label="Published" />
                    <div className="ml-auto flex">
                      {c.owners.slice(0, 5).map((o, k) => (
                        <div key={o.id} style={{ marginLeft: k ? -8 : 0, borderRadius: "50%", boxShadow: "0 0 0 2px var(--afa-surface)" }}>
                          <Avatar initials={o.initials} color={o.color} name={o.name} size={24} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
