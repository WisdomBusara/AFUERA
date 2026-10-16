"use client";

import { Clock, MessageSquare, Paperclip, Play, Sparkles } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { CHANNEL_COLOR, CHANNEL_LABEL, TYPE_LABEL, VISUAL_STAGES } from "@/lib/constants";
import { formatDay } from "@/lib/utils";
import type { CardDTO } from "@/lib/types";

function aiColors(v: number) {
  if (v >= 85) return { color: "var(--afa-ok)", background: "#e6f7ef" };
  if (v >= 65) return { color: "var(--afa-warn)", background: "#fef3e2" };
  return { color: "var(--afa-ink-3)", background: "var(--afa-surface-3)" };
}

export function CardBody({ card }: { card: CardDTO }) {
  const showThumb = VISUAL_STAGES.includes(card.stage);
  const ai = aiColors(card.aiScore);

  return (
    <>
      {showThumb && (
        <div className="afa-thumb" style={{ background: `linear-gradient(135deg, ${card.campaign.color}, ${CHANNEL_COLOR[card.channel]})` }}>
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-[var(--afa-ink)] backdrop-blur">
            {TYPE_LABEL[card.type]}
          </span>
          {card.type === "VIDEO" && (
            <div className="absolute inset-0 grid place-items-center text-white">
              <Play size={22} fill="#fff" />
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: card.campaign.color + "18", color: card.campaign.color }}>
          <span className="afa-sdot" style={{ background: card.campaign.color, width: 5, height: 5 }} />
          {card.campaign.name.split(" ")[0]}
        </span>
        {card.priority === "HIGH" && (
          <span className="inline-flex items-center rounded-full bg-[#fdecec] px-2 py-0.5 text-[11px] font-semibold text-[var(--afa-bad)]">High</span>
        )}
      </div>

      <div className="my-2 text-[13px] font-semibold leading-snug tracking-tight">{card.title}</div>

      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-md bg-[var(--afa-surface-3)] px-2 py-0.5 text-[11px] font-semibold text-[var(--afa-ink-2)]">
          <span className="afa-sdot" style={{ background: CHANNEL_COLOR[card.channel] }} />
          {CHANNEL_LABEL[card.channel]}
        </span>
        <span className="ml-auto inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold" style={ai}>
          <Sparkles size={10} /> <span className="mono">{card.aiScore}</span>
        </span>
      </div>

      <div className="mt-2 flex items-center gap-2 border-t border-[var(--afa-line-2)] pt-2.5">
        <Avatar initials={card.owner.initials} color={card.owner.color} name={card.owner.name} />
        <span className="afa-meta flex items-center gap-1">
          <Clock size={11} /> {formatDay(card.dueDate)}
        </span>
        <span className="ml-auto flex items-center gap-2.5">
          {card.comments > 0 && (
            <span className="afa-meta flex items-center gap-1">
              <MessageSquare size={11} /> {card.comments}
            </span>
          )}
          {card.attachments > 0 && (
            <span className="afa-meta flex items-center gap-1">
              <Paperclip size={11} /> {card.attachments}
            </span>
          )}
        </span>
      </div>
    </>
  );
}
