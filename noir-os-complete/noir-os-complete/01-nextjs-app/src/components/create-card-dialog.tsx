"use client";

import { useEffect, useRef, useState } from "react";
import { X, Loader2, Plus } from "lucide-react";
import { Stage, ContentType, Channel } from "@prisma/client";
import { STAGES, CHANNEL_LABEL, TYPE_LABEL } from "@/lib/constants";
import type { CardDTO } from "@/lib/types";
import { createCard } from "@/app/board/actions";

type Campaign = { id: string; name: string; color: string };
type Member = { id: string; name: string; initials: string; color: string };

export function CreateCardDialog({
  open,
  defaultStage,
  campaigns,
  members,
  onClose,
  onCreated,
}: {
  open: boolean;
  defaultStage: Stage;
  campaigns: Campaign[];
  members: Member[];
  onClose: () => void;
  onCreated: (card: CardDTO) => void;
}) {
  const [title, setTitle] = useState("");
  const [stage, setStage] = useState<Stage>(defaultStage);
  const [type, setType] = useState<ContentType>(ContentType.POST);
  const [channel, setChannel] = useState<Channel>(Channel.INSTAGRAM);
  const [campaignId, setCampaignId] = useState(campaigns[0]?.id ?? "");
  const [ownerId, setOwnerId] = useState(members[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  // Reset the form each time it opens.
  useEffect(() => {
    if (open) {
      setTitle("");
      setStage(defaultStage);
      setType(ContentType.POST);
      setChannel(Channel.INSTAGRAM);
      setCampaignId(campaigns[0]?.id ?? "");
      setOwnerId(members[0]?.id ?? "");
      setError(null);
      setTimeout(() => titleRef.current?.focus(), 40);
    }
  }, [open, defaultStage, campaigns, members]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !campaignId || !ownerId) {
      setError("Add a title, campaign, and owner.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await createCard({ title: title.trim(), stage, type, channel, campaignId, ownerId });
      if (!res?.ok) throw new Error("Could not create the card.");
      const campaign = campaigns.find((c) => c.id === campaignId)!;
      const owner = members.find((m) => m.id === ownerId)!;
      const optimistic: CardDTO = {
        id: res.id,
        title: title.trim(),
        type,
        channel,
        stage,
        position: 0, // sits at the top of its column; server holds the real value
        priority: "MEDIUM",
        aiScore: 60,
        comments: 0,
        attachments: 0,
        dueDate: null,
        publishAt: null,
        campaign: { id: campaign.id, name: campaign.name, color: campaign.color },
        owner: { id: owner.id, name: owner.name, initials: owner.initials, color: owner.color },
      };
      onCreated(optimistic);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="afa-modal-wrap" onClick={onClose}>
      <div className="afa-modal" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[var(--afa-line)] px-5 py-4">
          <div className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
            <Plus size={16} className="text-[var(--afa-accent)]" /> New content
          </div>
          <button className="grid h-8 w-8 place-items-center rounded-lg text-[var(--afa-ink-2)] hover:bg-[var(--afa-surface-3)]" onClick={onClose} aria-label="Close">
            <X size={17} />
          </button>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4 p-5">
          <div className="afa-field">
            <label className="afa-label">Title</label>
            <input
              ref={titleRef}
              className="afa-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Trailhead sunrise reel — 20s"
              maxLength={160}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="afa-field">
              <label className="afa-label">Stage</label>
              <select className="afa-select" value={stage} onChange={(e) => setStage(e.target.value as Stage)}>
                {STAGES.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="afa-field">
              <label className="afa-label">Type</label>
              <select className="afa-select" value={type} onChange={(e) => setType(e.target.value as ContentType)}>
                {(Object.keys(TYPE_LABEL) as ContentType[]).map((t) => (
                  <option key={t} value={t}>{TYPE_LABEL[t]}</option>
                ))}
              </select>
            </div>
            <div className="afa-field">
              <label className="afa-label">Channel</label>
              <select className="afa-select" value={channel} onChange={(e) => setChannel(e.target.value as Channel)}>
                {(Object.keys(CHANNEL_LABEL) as Channel[]).map((c) => (
                  <option key={c} value={c}>{CHANNEL_LABEL[c]}</option>
                ))}
              </select>
            </div>
            <div className="afa-field">
              <label className="afa-label">Campaign</label>
              <select className="afa-select" value={campaignId} onChange={(e) => setCampaignId(e.target.value)}>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="afa-field">
            <label className="afa-label">Owner</label>
            <select className="afa-select" value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {error && <div className="rounded-[9px] bg-[#fdecec] px-3.5 py-2.5 text-[12.5px] font-medium text-[var(--afa-bad)]">{error}</div>}

          <div className="mt-1 flex justify-end gap-2">
            <button type="button" className="rounded-[9px] border border-[var(--afa-line)] px-4 py-2 text-[13px] font-semibold text-[var(--afa-ink-2)] hover:bg-[var(--afa-surface-3)]" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-[9px] bg-[var(--afa-accent)] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[var(--afa-accent-ink)] disabled:opacity-60"
            >
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              Create card
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
