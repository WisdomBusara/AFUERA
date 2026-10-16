"use client";

import { useState, useTransition } from "react";
import { Check, RotateCcw, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Stage } from "@prisma/client";
import { Avatar } from "@/components/ui/avatar";
import { STAGES, stageMeta, CHANNEL_COLOR, CHANNEL_LABEL, TYPE_LABEL } from "@/lib/constants";
import { formatDay } from "@/lib/utils";
import type { CardDTO } from "@/lib/types";
import { approveItem, requestChanges } from "./actions";

const APPROVAL_STAGES: Stage[] = [Stage.REVIEW, Stage.LEGAL, Stage.APPROVAL];

export function ApprovalsClient({ initial }: { initial: CardDTO[] }) {
  const [items, setItems] = useState<CardDTO[]>(initial);
  const [pending, startTransition] = useTransition();

  function approve(card: CardDTO) {
    const idx = STAGES.findIndex((s) => s.key === card.stage);
    const next = STAGES[idx + 1];
    const stays = !!next && APPROVAL_STAGES.includes(next.key);
    setItems((prev) =>
      stays ? prev.map((c) => (c.id === card.id ? { ...c, stage: next!.key } : c)) : prev.filter((c) => c.id !== card.id)
    );
    startTransition(() => {
      approveItem({ cardId: card.id }).catch(() => {});
    });
  }

  function reject(card: CardDTO) {
    setItems((prev) => prev.filter((c) => c.id !== card.id));
    startTransition(() => {
      requestChanges({ cardId: card.id }).catch(() => {});
    });
  }

  if (items.length === 0) {
    return (
      <div className="afa-panel mx-6 mt-6 md:mx-[26px]">
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-[13px] text-[var(--afa-ink-3)]">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--afa-surface-3)] text-[var(--afa-ok)]">
            <CheckCircle2 size={24} />
          </div>
          Queue clear. Nothing needs your sign-off.
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-5 md:px-[26px]">
      <div className="afa-panel">
        <div className="afa-panel-h">
          <ShieldCheck size={16} color="var(--afa-accent)" />
          <h3>Approval queue</h3>
          <span className="more rounded-md bg-[var(--afa-warn-soft,#FEF3E2)] px-2 py-0.5 text-[11px] font-semibold text-[var(--afa-warn)]">
            {items.length} awaiting sign-off
          </span>
        </div>

        {items.map((it) => {
          const meta = stageMeta(it.stage);
          return (
            <div key={it.id} className="flex flex-wrap items-center gap-3 border-t border-[var(--afa-line-2)] px-4 py-3.5">
              <div className="h-11 w-11 flex-none rounded-[10px]" style={{ background: `linear-gradient(135deg, ${it.campaign.color}, ${CHANNEL_COLOR[it.channel]})` }} />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold leading-tight">{it.title}</div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold" style={{ background: meta.color + "18", color: meta.color }}>
                    <span className="afa-sdot" style={{ background: meta.color }} /> {meta.label}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-[var(--afa-surface-3)] px-2 py-0.5 text-[11px] font-semibold text-[var(--afa-ink-2)]">
                    <span className="afa-sdot" style={{ background: CHANNEL_COLOR[it.channel] }} /> {CHANNEL_LABEL[it.channel]}
                  </span>
                  <span className="afa-meta">{TYPE_LABEL[it.type]} · due {formatDay(it.dueDate)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Avatar initials={it.owner.initials} color={it.owner.color} name={it.owner.name} size={24} />
                <span className="afa-meta hidden sm:inline">{it.owner.name.split(" ")[0]}</span>
              </div>

              <div className="flex gap-2">
                <button
                  className="inline-flex items-center gap-1.5 rounded-[9px] border border-[var(--afa-line)] px-3 py-2 text-[12px] font-semibold text-[var(--afa-ink-2)] hover:bg-[var(--afa-surface-3)] disabled:opacity-50"
                  disabled={pending}
                  onClick={() => reject(it)}
                >
                  <RotateCcw size={13} /> Request changes
                </button>
                <button
                  className="inline-flex items-center gap-1.5 rounded-[9px] bg-[var(--afa-accent)] px-3 py-2 text-[12px] font-semibold text-white hover:bg-[var(--afa-accent-ink)] disabled:opacity-50"
                  disabled={pending}
                  onClick={() => approve(it)}
                >
                  <Check size={13} /> Approve
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
