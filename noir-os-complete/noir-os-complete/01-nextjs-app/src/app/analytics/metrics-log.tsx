"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, ClipboardList } from "lucide-react";
import { logMetric, deleteMetric } from "./actions";

export type MetricItem = { id: string; title: string; channelLabel: string };
export type MetricRow = {
  id: string;
  day: string; // yyyy-mm-dd
  title: string;
  impressions: number;
  reach: number;
  engagements: number;
  clicks: number;
};

const today = () => new Date().toISOString().slice(0, 10);
const field = "w-full rounded-[9px] border border-[var(--afa-line)] bg-[var(--afa-surface)] px-3 py-2 text-[13px] outline-none focus:border-[var(--afa-accent)]";
const NUMS = ["impressions", "reach", "engagements", "clicks"] as const;

export function MetricsLog({ items, recent }: { items: MetricItem[]; recent: MetricRow[] }) {
  const router = useRouter();
  const [itemId, setItemId] = useState(items[0]?.id ?? "");
  const [day, setDay] = useState(today());
  const [nums, setNums] = useState<Record<(typeof NUMS)[number], string>>({ impressions: "", reach: "", engagements: "", clicks: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!itemId || busy) return;
    setBusy(true);
    setError(null);
    const n = (k: (typeof NUMS)[number]) => Math.max(0, Math.floor(Number(nums[k]) || 0));
    const res = await logMetric({
      contentItemId: itemId, day,
      impressions: n("impressions"), reach: n("reach"), engagements: n("engagements"), clicks: n("clicks"),
    }).catch(() => ({ ok: false as const, error: "Couldn't save those numbers." }));
    setBusy(false);
    if (!res.ok) { setError(res.error); return; }
    setNums({ impressions: "", reach: "", engagements: "", clicks: "" });
    router.refresh(); // re-run the server aggregates with the new row
  }

  async function remove(id: string) {
    await deleteMetric({ id }).catch(() => setError("Couldn't delete that entry."));
    router.refresh();
  }

  return (
    <div className="afa-panel mt-4">
      <div className="afa-panel-h">
        <ClipboardList size={15} color="var(--afa-accent)" />
        <h3>Log performance</h3>
        <span className="more afa-meta">one entry per item per day</span>
      </div>

      {items.length === 0 ? (
        <div className="px-4 pb-4 text-[12.5px] text-[var(--afa-ink-3)]">
          Nothing is published yet. Move a card to Published on the board, then log its numbers here.
        </div>
      ) : (
        <form onSubmit={submit} className="grid gap-3 px-4 pb-4 sm:grid-cols-6">
          <div className="sm:col-span-4">
            <label className="afa-meta mb-1 block">Content</label>
            <select className={field} value={itemId} onChange={(e) => setItemId(e.target.value)}>
              {items.map((i) => <option key={i.id} value={i.id}>{i.title} · {i.channelLabel}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="afa-meta mb-1 block">Day</label>
            <input type="date" className={field} value={day} max={today()} onChange={(e) => setDay(e.target.value)} required />
          </div>
          {NUMS.map((k) => (
            <div key={k} className="sm:col-span-1">
              <label className="afa-meta mb-1 block capitalize">{k}</label>
              <input type="number" min={0} step={1} inputMode="numeric" className={field} value={nums[k]} placeholder="0"
                onChange={(e) => setNums((x) => ({ ...x, [k]: e.target.value }))} />
            </div>
          ))}
          <div className="flex items-end sm:col-span-2">
            <button type="submit" disabled={busy}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-[9px] bg-[var(--afa-accent)] px-3.5 py-2 text-[12.5px] font-semibold text-white hover:bg-[var(--afa-accent-ink)] disabled:opacity-60">
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Save entry
            </button>
          </div>
          {error && <div className="rounded-[9px] bg-[#fdecec] px-3.5 py-2.5 text-[12.5px] font-medium text-[var(--afa-bad)] sm:col-span-6">{error}</div>}
        </form>
      )}

      {recent.length > 0 && (
        <div className="overflow-x-auto border-t border-[var(--afa-line-2)] px-4 py-3">
          <table className="w-full text-left text-[12px]">
            <thead className="afa-meta">
              <tr>
                <th className="py-1 pr-3 font-medium">Day</th><th className="py-1 pr-3 font-medium">Content</th>
                <th className="py-1 pr-3 text-right font-medium">Impr.</th><th className="py-1 pr-3 text-right font-medium">Reach</th>
                <th className="py-1 pr-3 text-right font-medium">Eng.</th><th className="py-1 pr-3 text-right font-medium">Clicks</th><th />
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => (
                <tr key={r.id} className="border-t border-[var(--afa-line-2)]">
                  <td className="mono py-1.5 pr-3 whitespace-nowrap">{r.day}</td>
                  <td className="max-w-[260px] truncate py-1.5 pr-3">{r.title}</td>
                  <td className="mono py-1.5 pr-3 text-right">{r.impressions}</td>
                  <td className="mono py-1.5 pr-3 text-right">{r.reach}</td>
                  <td className="mono py-1.5 pr-3 text-right">{r.engagements}</td>
                  <td className="mono py-1.5 pr-3 text-right">{r.clicks}</td>
                  <td className="py-1.5 text-right">
                    <button onClick={() => remove(r.id)} className="text-[var(--afa-ink-4)] hover:text-[var(--afa-bad)]" aria-label="Delete entry">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
