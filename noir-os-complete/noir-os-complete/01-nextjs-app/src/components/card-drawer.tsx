"use client";

import { useEffect, useState } from "react";
import { X, ArrowRight, Clock, CalendarDays, Trash2, MessageSquare, Send } from "lucide-react";
import { Priority } from "@prisma/client";
import { Avatar } from "@/components/ui/avatar";
import { CHANNEL_COLOR, CHANNEL_LABEL, TYPE_LABEL, PRIORITY_LABEL, STAGES, stageMeta } from "@/lib/constants";
import type { CardDTO, CommentDTO } from "@/lib/types";
import { updateCard, deleteCard, listComments, addComment, deleteComment } from "@/app/board/actions";

// yyyy-mm-dd for <input type="date">
function toDateInput(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 10);
}
const fromDateInput = (v: string) => (v ? new Date(`${v}T09:00:00`).toISOString() : null);

export function CardDrawer({
  card,
  onClose,
  onAdvance,
  onReschedule,
  onChanged,
  onDeleted,
  pending = false,
}: {
  card: CardDTO | null;
  onClose: () => void;
  onAdvance: (card: CardDTO) => void;
  onReschedule: (card: CardDTO, iso: string | null) => void;
  /** The drawer saved an edit; the parent mirrors it into its own list. */
  onChanged: (card: CardDTO) => void;
  onDeleted: (cardId: string) => void;
  pending?: boolean;
}) {
  const [comments, setComments] = useState<CommentDTO[] | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cardId = card?.id ?? null;

  // Load the thread whenever a different card opens.
  useEffect(() => {
    setComments(null);
    setDraft("");
    setError(null);
    if (!cardId) return;
    let live = true;
    listComments({ cardId })
      .then((rows) => { if (live) setComments(rows); })
      .catch(() => { if (live) setComments([]); });
    return () => { live = false; };
  }, [cardId]);

  if (!card) return null;

  const meta = stageMeta(card.stage);
  const next = STAGES[STAGES.findIndex((s) => s.key === card.stage) + 1];

  function save(patch: { title?: string; priority?: Priority; dueDate?: string | null }) {
    if (!card) return;
    onChanged({ ...card, ...patch });
    setError(null);
    updateCard({ cardId: card.id, ...patch }).catch(() => setError("Couldn't save that change."));
  }

  async function post() {
    const body = draft.trim();
    if (!card || !body || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await addComment({ cardId: card.id, body });
      setComments((c) => [...(c ?? []), res.comment]);
      onChanged({ ...card, commentCount: card.commentCount + 1 });
      setDraft("");
    } catch {
      setError("Couldn't post that comment.");
    } finally {
      setBusy(false);
    }
  }

  function removeComment(id: string) {
    if (!card) return;
    const before = comments;
    setComments((c) => (c ?? []).filter((x) => x.id !== id));
    onChanged({ ...card, commentCount: Math.max(0, card.commentCount - 1) });
    deleteComment({ id }).catch(() => {
      setComments(before);
      onChanged(card);
      setError("You can only delete your own comments.");
    });
  }

  function remove() {
    if (!card) return;
    if (!window.confirm(`Delete "${card.title}"? Its comments and metrics are deleted too.`)) return;
    const id = card.id;
    deleteCard({ cardId: id })
      .then(() => { onDeleted(id); onClose(); })
      .catch(() => setError("Couldn't delete this card."));
  }

  return (
    <>
      <div className="afa-scrim" onClick={onClose} />
      <aside className="afa-drawer" role="dialog" aria-label={card.title}>
        <div
          className="relative h-[110px] shrink-0"
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
          <textarea
            key={card.id}
            defaultValue={card.title}
            rows={2}
            maxLength={160}
            aria-label="Title"
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (!v) { e.target.value = card.title; return; }
              if (v !== card.title) save({ title: v });
            }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); (e.target as HTMLTextAreaElement).blur(); } }}
            className="w-full resize-none rounded-md bg-transparent text-[19px] font-bold leading-tight tracking-tight outline-none focus:bg-[var(--afa-surface-3)] focus:px-1.5"
          />

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
            <input
              type="date"
              aria-label="Due date"
              className="rounded-md border border-[var(--afa-line)] bg-[var(--afa-surface)] px-2 py-1 text-[12.5px] outline-none focus:border-[var(--afa-accent)]"
              value={toDateInput(card.dueDate)}
              onChange={(e) => save({ dueDate: fromDateInput(e.target.value) })}
            />
          </div>
          <div className="afa-drawer-row">
            <span className="k">Priority</span>
            <select
              aria-label="Priority"
              className="rounded-md border border-[var(--afa-line)] bg-[var(--afa-surface)] px-2 py-1 text-[12.5px] font-medium outline-none"
              value={card.priority}
              onChange={(e) => save({ priority: e.target.value as Priority })}
            >
              {(Object.keys(PRIORITY_LABEL) as Priority[]).map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
            </select>
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
                onChange={(e) => onReschedule(card, fromDateInput(e.target.value))}
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

          {/* Comments */}
          <div className="mt-4">
            <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-[var(--afa-ink-2)]">
              <MessageSquare size={14} /> Comments{comments ? ` · ${comments.length}` : ""}
            </div>
            {comments === null && <div className="afa-meta py-1">Loading…</div>}
            {comments?.length === 0 && <div className="afa-meta py-1">No comments yet.</div>}
            {comments?.map((c) => (
              <div key={c.id} className="group border-t border-[var(--afa-line-2)] py-2 first:border-t-0">
                <div className="flex items-center gap-2 text-[11.5px]">
                  <b className="font-semibold">{c.authorName}</b>
                  <span className="afa-meta">{new Date(c.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                  <button className="ml-auto text-[var(--afa-ink-4)] opacity-0 transition hover:text-[var(--afa-bad)] group-hover:opacity-100" onClick={() => removeComment(c.id)} aria-label="Delete comment">
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="mt-0.5 whitespace-pre-wrap text-[13px] leading-snug">{c.body}</div>
              </div>
            ))}
            <div className="mt-2 flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") post(); }}
                placeholder="Add a comment…"
                maxLength={2000}
                className="flex-1 rounded-[9px] border border-[var(--afa-line)] bg-[var(--afa-surface)] px-3 py-2 text-[13px] outline-none focus:border-[var(--afa-accent)]"
              />
              <button
                onClick={post}
                disabled={!draft.trim() || busy}
                className="grid h-[38px] w-[38px] place-items-center rounded-[9px] bg-[var(--afa-accent)] text-white hover:bg-[var(--afa-accent-ink)] disabled:opacity-50"
                aria-label="Post comment"
              >
                <Send size={14} />
              </button>
            </div>
          </div>

          {error && <div className="mt-3 rounded-[9px] bg-[#fdecec] px-3.5 py-2.5 text-[12.5px] font-medium text-[var(--afa-bad)]">{error}</div>}

          {/* Actions */}
          <div className="mt-5 flex gap-2">
            <button
              className="inline-flex items-center justify-center gap-1.5 rounded-[9px] border border-[var(--afa-line)] px-3 py-2 text-[12.5px] font-semibold text-[var(--afa-ink-2)] hover:border-[var(--afa-bad)] hover:text-[var(--afa-bad)]"
              onClick={remove}
            >
              <Trash2 size={14} /> Delete
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
