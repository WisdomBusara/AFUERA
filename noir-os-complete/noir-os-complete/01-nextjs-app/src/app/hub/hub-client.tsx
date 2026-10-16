"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Sparkles, ArrowUpRight } from "lucide-react";
import { Stage } from "@prisma/client";
import { CHANNEL_COLOR, CHANNEL_LABEL, TYPE_LABEL, stageMeta, OFF_BOARD_STAGES } from "@/lib/constants";
import type { CardDTO } from "@/lib/types";

const FILTERS: { key: string; label: string; test: (s: Stage) => boolean }[] = [
  { key: "all", label: "All", test: () => true },
  { key: "progress", label: "In progress", test: (s) => !OFF_BOARD_STAGES.includes(s) },
  { key: "scheduled", label: "Scheduled", test: (s) => s === Stage.SCHEDULED },
  { key: "published", label: "Published", test: (s) => s === Stage.PUBLISHED },
  { key: "archived", label: "Archived", test: (s) => s === Stage.ARCHIVED },
];

function aiStyle(v: number) {
  if (v >= 85) return { color: "var(--afa-ok)", background: "#e6f7ef" };
  if (v >= 65) return { color: "var(--afa-warn)", background: "#fef3e2" };
  return { color: "var(--afa-ink-3)", background: "var(--afa-surface-3)" };
}

export function HubClient({ initial }: { initial: CardDTO[] }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");

  const results = useMemo(() => {
    const f = FILTERS.find((x) => x.key === filter)!;
    const query = q.trim().toLowerCase();
    return initial.filter((c) => f.test(c.stage) && (!query || c.title.toLowerCase().includes(query)));
  }, [initial, q, filter]);

  return (
    <div className="px-6 py-5 md:px-[26px]">
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-[10px] border border-[var(--afa-line)] bg-[var(--afa-surface)] px-3 py-2 focus-within:border-[var(--afa-accent)]">
          <Search size={15} className="text-[var(--afa-ink-3)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search all content, forever…"
            className="w-full border-none bg-transparent text-[13.5px] outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={
                "rounded-[9px] border px-3 py-2 text-[12px] font-semibold transition " +
                (filter === f.key
                  ? "border-[var(--afa-accent)] bg-[var(--afa-accent-soft)] text-[var(--afa-accent-ink)]"
                  : "border-[var(--afa-line)] bg-[var(--afa-surface)] text-[var(--afa-ink-2)] hover:bg-[var(--afa-surface-2)]")
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 text-[12px] text-[var(--afa-ink-3)]">
        {results.length} {results.length === 1 ? "item" : "items"}
      </div>

      {results.length === 0 ? (
        <div className="afa-panel py-16 text-center text-[13px] text-[var(--afa-ink-3)]">No content matches that search.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((c) => {
            const meta = stageMeta(c.stage);
            return (
              <Link
                key={c.id}
                href="/board"
                className="afa-panel group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-[var(--sh-2)]"
              >
                <div className="relative h-[92px]" style={{ background: `linear-gradient(135deg, ${c.campaign.color}, ${CHANNEL_COLOR[c.channel]})` }}>
                  <span className="absolute left-2.5 top-2.5 rounded-md bg-white/90 px-2 py-0.5 text-[11px] font-semibold backdrop-blur">{TYPE_LABEL[c.type]}</span>
                  <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold" style={aiStyle(c.aiScore)}>
                    <Sparkles size={10} /> <span className="mono">{c.aiScore}</span>
                  </span>
                </div>
                <div className="p-3.5">
                  <div className="mb-2.5 text-[13px] font-semibold leading-snug">{c.title}</div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold" style={{ background: meta.color + "18", color: meta.color }}>
                      <span className="afa-sdot" style={{ background: meta.color }} /> {meta.label}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-[var(--afa-surface-3)] px-2 py-0.5 text-[11px] font-semibold text-[var(--afa-ink-2)]">
                      <span className="afa-sdot" style={{ background: CHANNEL_COLOR[c.channel] }} /> {CHANNEL_LABEL[c.channel]}
                    </span>
                    <ArrowUpRight size={14} className="ml-auto text-[var(--afa-ink-4)] opacity-0 transition group-hover:opacity-100" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
