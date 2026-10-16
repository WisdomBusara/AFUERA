"use client";

import { useMemo, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Stage } from "@prisma/client";
import { CHANNEL_COLOR, STAGES } from "@/lib/constants";
import type { CardDTO } from "@/lib/types";
import { CardDrawer } from "@/components/card-drawer";
import { rescheduleCard, moveCard } from "../actions";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const iso = (d: Date) => {
  const c = new Date(d);
  c.setHours(9, 0, 0, 0);
  return c.toISOString();
};
const dayKey = (d: string | Date) => new Date(d).toISOString().slice(0, 10);

export function CalendarClient({ initialCards }: { initialCards: CardDTO[] }) {
  // Only cards with a publish date live on the calendar.
  const [cards, setCards] = useState<CardDTO[]>(() => initialCards.filter((c) => c.publishAt));
  const [monthOffset, setMonthOffset] = useState(0);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);
  const [selected, setSelected] = useState<CardDTO | null>(null);
  const [pending, startTransition] = useTransition();

  const base = useMemo(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth() + monthOffset, 1);
  }, [monthOffset]);

  const days = useMemo(() => {
    const start = new Date(base.getFullYear(), base.getMonth(), 1);
    start.setDate(1 - start.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [base]);

  const byDay = useMemo(() => {
    const map: Record<string, CardDTO[]> = {};
    for (const c of cards) if (c.publishAt) (map[dayKey(c.publishAt)] ??= []).push(c);
    return map;
  }, [cards]);

  const todayKey = dayKey(new Date());

  function reschedule(cardId: string, targetIso: string) {
    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, publishAt: targetIso } : c)));
    startTransition(() => {
      rescheduleCard({ cardId, publishAt: targetIso }).catch(() => {});
    });
  }

  function handleDrawerReschedule(card: CardDTO, target: string | null) {
    if (target === null) {
      // Unscheduling removes the card from the calendar.
      setCards((prev) => prev.filter((c) => c.id !== card.id));
      setSelected(null);
    } else {
      const updated = { ...card, publishAt: target };
      setCards((prev) => prev.map((c) => (c.id === card.id ? updated : c)));
      setSelected(updated);
    }
    startTransition(() => {
      rescheduleCard({ cardId: card.id, publishAt: target }).catch(() => {});
    });
  }

  function handleAdvance(card: CardDTO) {
    const idx = STAGES.findIndex((s) => s.key === card.stage);
    const next = STAGES[idx + 1];
    if (!next) return;
    const staysOnCalendar = next.key === Stage.SCHEDULED || next.key === Stage.PUBLISHED;
    const updated = { ...card, stage: next.key };

    if (staysOnCalendar) {
      setCards((prev) => prev.map((c) => (c.id === card.id ? updated : c)));
      setSelected(updated);
    } else {
      setCards((prev) => prev.filter((c) => c.id !== card.id));
      setSelected(null);
    }
    startTransition(() => {
      moveCard({ cardId: card.id, toStage: next.key, position: card.position }).catch(() => {});
    });
  }

  return (
    <div className="px-[26px] py-5">
      <div className="mb-3.5 flex items-center gap-3">
        <button className="grid h-9 w-9 place-items-center rounded-lg text-[var(--afa-ink-2)] hover:bg-[var(--afa-surface-3)]" onClick={() => setMonthOffset((m) => m - 1)} aria-label="Previous month">
          <ChevronLeft size={17} />
        </button>
        <div className="min-w-[190px] text-[19px] font-bold tracking-tight">
          {base.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </div>
        <button className="grid h-9 w-9 place-items-center rounded-lg text-[var(--afa-ink-2)] hover:bg-[var(--afa-surface-3)]" onClick={() => setMonthOffset((m) => m + 1)} aria-label="Next month">
          <ChevronRight size={17} />
        </button>
        <button className="rounded-[9px] border border-[var(--afa-line)] bg-[var(--afa-surface)] px-3 py-1.5 text-[12px] font-medium text-[var(--afa-ink-2)] hover:bg-[var(--afa-surface-2)]" onClick={() => setMonthOffset(0)}>
          Today
        </button>
        <span className="afa-meta ml-auto">Drag a chip to reschedule · colours map to channel</span>
      </div>

      <div className="afa-cal">
        {DOW.map((d) => (
          <div className="afa-dow" key={d}>{d}</div>
        ))}
        {days.map((d, i) => {
          const off = d.getMonth() !== base.getMonth();
          const key = dayKey(d);
          return (
            <div
              key={i}
              className={"afa-cell" + (off ? " off" : "") + (overKey === key ? " over" : "")}
              onDragOver={(e) => { e.preventDefault(); setOverKey(key); }}
              onDragLeave={(e) => { if (e.currentTarget === e.target) setOverKey(null); }}
              onDrop={() => {
                if (dragId) reschedule(dragId, iso(d));
                setOverKey(null);
                setDragId(null);
              }}
            >
              <div className={"dn" + (key === todayKey ? " today" : "")}>{d.getDate()}</div>
              {(byDay[key] ?? []).map((c) => (
                <div
                  key={c.id}
                  className="afa-chip"
                  draggable
                  style={{ background: CHANNEL_COLOR[c.channel] }}
                  onDragStart={() => setDragId(c.id)}
                  onDragEnd={() => setDragId(null)}
                  onClick={() => setSelected(c)}
                >
                  {c.stage === "PUBLISHED" ? <Check size={10} /> : <span className="cd" />}
                  <span>{c.title}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <CardDrawer
        card={selected}
        pending={pending}
        onClose={() => setSelected(null)}
        onAdvance={handleAdvance}
        onReschedule={handleDrawerReschedule}
      />
    </div>
  );
}
