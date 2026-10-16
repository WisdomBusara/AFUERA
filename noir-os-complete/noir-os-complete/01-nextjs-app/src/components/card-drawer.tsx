"use client";

import { X, ArrowRight, Wand2, Clock, CalendarDays } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import {
  CHANNEL_COLOR, CHANNEL_LABEL, TYPE_LABEL, PRIORITY_LABEL, STAGES, stageMeta,
} from "@/lib/constants";
import { formatDay } from "@/lib/utils";
import type { CardDTO } from "@/lib/types";

// yyyy-mm-dd for <input type="date">
function toDateInput(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 10);
}

export function CardDrawer({
  card,
  onClose,
  onAdvance,
  onReschedule,
  pending = false,
}: {
  card: CardDTO | null;
  onClose: () => void;
  onAdvance: (card: CardDTO) => void;
  onReschedule: (card: CardDTO, iso: string | null) => void;
  pending?: boolean;
}) {
  if (!card) return null;

  const meta = stageMeta(card.stage);
  const idx = STAGES.findIndex((s) => s.key === card.stage);
  const next = STAGES[idx + 1];

  return (
    <>
      <div className="afa-scrim" onClick={onClose} />
      <aside className="afa-drawer" role="dialog" aria-label={card.title}>
        <div
          className="relative h-[150px] shrink-0"
          style={{ background: `linear-gradient(135deg, ${card.campaign.color}, ${CHANNEL_COLOR[card.channel]})` }}
        >
          <button
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-lg bg-white/90 text-[var(--afa-ink)] backdrop-blur transition hover:bg-white"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={17} />
          </button>
          <div className="absolute bottom-3.5 left-4 flex gap-2">
            <span className="inline-flex items-center rounded-md bg-white/90 px-2 py-0.5 text-[11px] font-semibold backdrop-blur">{TYPE_LABEL[card.type]}</span>
            <span className="inline-flex items-center gap-1 rounded-md bg-white/90 px-2 py-0.5 text-[11px] font-semibold backdrop-blur">
              <span className="afa-sdot" style={{ background: CHANNEL_COLOR[card.channel] }} />
              {CHANNEL_LABEL[card.channel]}
            </span>
          </div>
        </div>

        <div className="overflow-y-auto p-5">
          <h2 className="text-[19px] font-bold leading-tight tracking-tight">{card.title}</h2>

          <div className="my-3.5 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold" style={{ background: meta.color + "18", color: meta.color }}>
              <span className="afa-sdot" style={{ background: meta.color }} /> {meta.label}
            </span>
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: card.campaign.color + "18", color: card.campaign.color }}>
              {card.campaign.name}
            </span>
          </div>

          <div className="afa-drawer-row">
            <span className="k">Owner</span>
            <span className="flex items-center gap-2 font-medium">
              <Avatar initials={card.owner.initials} color={card.owner.color} name={card.owner.name} size={22} />
              {card.owner.name}
            </span>
          </div>
          <div className="afa-drawer-row">
            <span className="k">Due date</span>
            <span className="font-medium">{formatDay(card.dueDate)}</span>
          </div>
          <div className="afa-drawer-row">
            <span className="k">Priority</span>
            <span className="font-medium">{PRIORITY_LABEL[card.priority]}</span>
          </div>
          <div className="afa-drawer-row">
            <span className="k">AI score</span>
            <span className="mono font-semibold">{card.aiScore}</span>
          </div>
          <div className="afa-drawer-row">
            <span className="k">Activity</span>
            <span className="font-medium text-[var(--afa-ink-2)]">{card.comments} comments · {card.attachments} files</span>
          </div>

          {/* Scheduling — persists via rescheduleCard */}
          <div className="mt-4 rounded-xl border border-[var(--afa-line)] bg-[var(--afa-surface-2)] p-3.5">
            <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-[var(--afa-ink-2)]">
              <CalendarDays size={14} /> Publish date
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                className="flex-1 rounded-[9px] border border-[var(--afa-line)] bg-[var(--afa-surface)] px-3 py-2 text-[13px] outline-none focus:border-[var(--afa-accent)]"
                value={toDateInput(card.publishAt)}
                disabled={pending}
                onChange={(e) => {
                  const v = e.target.value;
                  onReschedule(card, v ? new Date(`${v}T09:00:00`).toISOString() : null);
                }}
              />
              {card.publishAt && (
                <button
                  className="rounded-[9px] border border-[var(--afa-line)] px-3 py-2 text-[12px] font-medium text-[var(--afa-ink-2)] hover:bg-[var(--afa-surface-3)]"
                  disabled={pending}
                  onClick={() => onReschedule(card, null)}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* AI suggestion */}
          <div className="mt-4 rounded-xl border p-3.5" style={{ background: "linear-gradient(180deg,#FFF7F2,#FFFDFC)", borderColor: "#FBE2D4" }}>
            <div className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: "#FF6F91" }}>
              <Wand2 size={14} /> AI suggestion
            </div>
            <p className="m-0 text-[12.5px] leading-relaxed text-[var(--afa-ink-2)]">
              Tighten the hook to the first 7 words and add <b>#TrailTested</b> — matches your Brand Kit and lifts save-rate on {CHANNEL_LABEL[card.channel]}.
            </p>
          </div>

          {/* Actions */}
          <div className="mt-5 flex gap-2">
            <button className="flex-1 rounded-[9px] border border-[var(--afa-line)] py-2 text-[12.5px] font-semibold text-[var(--afa-ink-2)] hover:bg-[var(--afa-surface-3)]">
              Comment
            </button>
            <button
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[9px] bg-[var(--afa-accent)] py-2 text-[12.5px] font-semibold text-white hover:bg-[var(--afa-accent-ink)] disabled:opacity-50"
              disabled={pending || !next}
              onClick={() => onAdvance(card)}
            >
              {next ? `Advance to ${next.label}` : "Final stage"} <ArrowRight size={14} />
            </button>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[var(--afa-ink-3)]">
            <Clock size={11} /> Changes save to your workspace instantly.
          </div>
        </div>
      </aside>
    </>
  );
}
