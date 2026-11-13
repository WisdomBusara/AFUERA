"use client";

import { useState, useTransition } from "react";
import { Zap, ArrowRight, Plus, Trash2, Clock, MoveRight, Bell, ListTodo, Archive } from "lucide-react";
import { Stage, AutomationTrigger, AutomationAction } from "@prisma/client";
import { STAGES, stageMeta } from "@/lib/constants";
import { toggleRule, deleteRule, createRule, renameRule } from "./actions";

export type RuleDTO = {
  id: string;
  name: string;
  enabled: boolean;
  trigger: AutomationTrigger;
  triggerStage: Stage | null;
  action: AutomationAction;
  actionStage: Stage | null;
};

function triggerLabel(r: RuleDTO) {
  if (r.trigger === "CARD_ENTERS_STAGE") return `Card enters ${r.triggerStage ? stageMeta(r.triggerStage).label : "a stage"}`;
  if (r.trigger === "PUBLISH_DATE_ARRIVES") return "Publish date arrives";
  return "Campaign ends";
}
function actionMeta(r: RuleDTO): { label: string; icon: React.ComponentType<{ size?: number }> } {
  switch (r.action) {
    case "MOVE_TO_STAGE": return { label: `Move to ${r.actionStage ? stageMeta(r.actionStage).label : "a stage"}`, icon: MoveRight };
    case "NOTIFY_EMAIL": return { label: "Email the team", icon: Bell };
    case "CREATE_TASK": return { label: "Create a follow-up task", icon: ListTodo };
    case "ARCHIVE": return { label: "Archive content", icon: Archive };
    default: return { label: "Run action", icon: MoveRight };
  }
}
const isScheduled = (r: RuleDTO) => r.trigger === "PUBLISH_DATE_ARRIVES" || r.trigger === "CAMPAIGN_ENDS";

export function AutomationsClient({ initial }: { initial: RuleDTO[] }) {
  const [rules, setRules] = useState<RuleDTO[]>(initial);
  const [, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);

  function toggle(rule: RuleDTO) {
    const enabled = !rule.enabled;
    setRules((rs) => rs.map((r) => (r.id === rule.id ? { ...r, enabled } : r)));
    startTransition(() => {
      toggleRule({ id: rule.id, enabled }).catch(() => {});
    });
  }

  function remove(rule: RuleDTO) {
    setRules((rs) => rs.filter((r) => r.id !== rule.id));
    startTransition(() => {
      deleteRule({ id: rule.id }).catch(() => {});
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-5 md:px-[26px]">
      <div className="afa-panel mb-4">
        <div className="afa-panel-h">
          <Zap size={16} color="var(--afa-accent)" />
          <h3>Workflow automations</h3>
          <span className="more afa-meta">{rules.filter((r) => r.enabled).length} of {rules.length} active</span>
        </div>

        <div className="px-4 pb-2">
          {rules.map((r) => {
            const a = actionMeta(r);
            const AIcon = a.icon;
            return (
              <div key={r.id} className="flex flex-wrap items-center gap-3 border-t border-[var(--afa-line-2)] py-3.5 first:border-t-0">
                <button
                  className={"relative h-5 w-9 flex-none rounded-full transition " + (r.enabled ? "bg-[var(--afa-accent)]" : "bg-[var(--afa-line)]")}
                  onClick={() => toggle(r)}
                  aria-label={r.enabled ? "Disable" : "Enable"}
                >
                  <span className={"absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all " + (r.enabled ? "left-[18px]" : "left-0.5")} />
                </button>

                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <input
                    defaultValue={r.name}
                    maxLength={120}
                    aria-label="Rule name"
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (!v) { e.target.value = r.name; return; }
                      if (v === r.name) return;
                      setRules((rs) => rs.map((x) => (x.id === r.id ? { ...x, name: v } : x)));
                      renameRule({ id: r.id, name: v }).catch(() => {});
                    }}
                    onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                    className="rounded bg-transparent text-[13px] font-semibold outline-none focus:bg-[var(--afa-surface-3)] focus:px-1.5"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--afa-accent-soft)] bg-[var(--afa-surface)] px-2.5 py-1 text-[11.5px] font-semibold">
                      <Zap size={12} className="text-[var(--afa-accent)]" /> {triggerLabel(r)}
                    </span>
                    <ArrowRight size={14} className="text-[var(--afa-ink-4)]" />
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--afa-line)] bg-[var(--afa-surface)] px-2.5 py-1 text-[11.5px] font-semibold text-[var(--afa-ink-2)]">
                      <AIcon size={12} /> {a.label}
                    </span>
                    {isScheduled(r) && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-[var(--afa-surface-3)] px-2 py-0.5 text-[10.5px] font-semibold text-[var(--afa-ink-3)]">
                        <Clock size={10} /> checked every 15 min
                      </span>
                    )}
                  </div>
                </div>

                <button className="grid h-8 w-8 place-items-center rounded-lg text-[var(--afa-ink-3)] hover:bg-[var(--afa-surface-3)] hover:text-[var(--afa-bad)]" onClick={() => remove(r)} aria-label="Delete rule">
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
          {rules.length === 0 && <div className="py-8 text-center text-[12.5px] text-[var(--afa-ink-3)]">No automations yet.</div>}
        </div>
      </div>

      {showForm ? (
        <CreateForm
          onCancel={() => setShowForm(false)}
          onCreated={(rule) => { setRules((rs) => [...rs, rule]); setShowForm(false); }}
        />
      ) : (
        <button className="inline-flex items-center gap-2 rounded-[9px] border border-[var(--afa-line)] bg-[var(--afa-surface)] px-3.5 py-2 text-[12.5px] font-semibold text-[var(--afa-ink-2)] hover:bg-[var(--afa-surface-2)]" onClick={() => setShowForm(true)}>
          <Plus size={14} /> New automation
        </button>
      )}

      <div className="mt-4 flex items-center gap-1.5 text-[11px] text-[var(--afa-ink-3)]">
        <Clock size={11} /> Stage-entry rules run instantly when a card moves. Publish-date and campaign-end rules are checked every 15 minutes.
      </div>
    </div>
  );
}

const TRIGGERS: { key: AutomationTrigger; label: string }[] = [
  { key: "CARD_ENTERS_STAGE", label: "A card enters a stage" },
  { key: "PUBLISH_DATE_ARRIVES", label: "A scheduled card's publish date arrives" },
  { key: "CAMPAIGN_ENDS", label: "A campaign's end date passes" },
];
const ACTIONS: { key: AutomationAction; label: string; stageOnly?: boolean }[] = [
  { key: "MOVE_TO_STAGE", label: "Move the card to a stage" },
  { key: "ARCHIVE", label: "Archive the card" },
  { key: "CREATE_TASK", label: "Create a follow-up task", stageOnly: true },
  { key: "NOTIFY_EMAIL", label: "Email the team", stageOnly: true },
];

function CreateForm({ onCancel, onCreated }: { onCancel: () => void; onCreated: (r: RuleDTO) => void }) {
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState<AutomationTrigger>("CARD_ENTERS_STAGE");
  const [triggerStage, setTriggerStage] = useState<Stage>(Stage.APPROVAL);
  const [action, setAction] = useState<AutomationAction>("MOVE_TO_STAGE");
  const [actionStage, setActionStage] = useState<Stage>(Stage.SCHEDULED);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Date-based triggers can only move or archive (see createRule).
  const actions = ACTIONS.filter((a) => trigger === "CARD_ENTERS_STAGE" || !a.stageOnly);

  function pickTrigger(t: AutomationTrigger) {
    setTrigger(t);
    if (t !== "CARD_ENTERS_STAGE" && action !== "MOVE_TO_STAGE" && action !== "ARCHIVE") setAction("MOVE_TO_STAGE");
    if (t === "PUBLISH_DATE_ARRIVES") setActionStage(Stage.PUBLISHED);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const draft: RuleDTO = {
      id: "", name: "", enabled: true, trigger,
      triggerStage: trigger === "CARD_ENTERS_STAGE" ? triggerStage : null,
      action, actionStage: action === "MOVE_TO_STAGE" ? actionStage : null,
    };
    const finalName = name.trim() || `${triggerLabel(draft)} → ${actionMeta(draft).label}`;
    setBusy(true);
    setError(null);
    try {
      const res = await createRule({
        name: finalName, trigger, triggerStage: draft.triggerStage, action, actionStage: draft.actionStage,
      });
      if (res.ok) onCreated({ ...draft, id: res.id, name: finalName });
      else setError(res.error);
    } catch {
      setError("Couldn't create that rule.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="afa-panel flex flex-col gap-3.5 p-4">
      <div className="text-[13px] font-semibold">New automation</div>
      <input className="afa-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Rule name (optional)" maxLength={120} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="afa-field">
          <label className="afa-label">When</label>
          <select className="afa-select" value={trigger} onChange={(e) => pickTrigger(e.target.value as AutomationTrigger)}>
            {TRIGGERS.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
        </div>
        {trigger === "CARD_ENTERS_STAGE" && (
          <div className="afa-field">
            <label className="afa-label">Which stage</label>
            <select className="afa-select" value={triggerStage} onChange={(e) => setTriggerStage(e.target.value as Stage)}>
              {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
        )}
        <div className="afa-field">
          <label className="afa-label">Then</label>
          <select className="afa-select" value={action} onChange={(e) => setAction(e.target.value as AutomationAction)}>
            {actions.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
          </select>
        </div>
        {action === "MOVE_TO_STAGE" && (
          <div className="afa-field">
            <label className="afa-label">Move it to</label>
            <select className="afa-select" value={actionStage} onChange={(e) => setActionStage(e.target.value as Stage)}>
              {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
        )}
      </div>
      {trigger === "CAMPAIGN_ENDS" && (
        <div className="afa-meta text-[11.5px]">Applies to every unarchived card in a campaign once its end date (set on the Campaigns page) has passed.</div>
      )}
      {error && <div className="rounded-[9px] bg-[#fdecec] px-3.5 py-2.5 text-[12.5px] font-medium text-[var(--afa-bad)]">{error}</div>}
      <div className="flex justify-end gap-2">
        <button type="button" className="rounded-[9px] border border-[var(--afa-line)] px-4 py-2 text-[12.5px] font-semibold text-[var(--afa-ink-2)] hover:bg-[var(--afa-surface-3)]" onClick={onCancel}>Cancel</button>
        <button type="submit" disabled={busy} className="inline-flex items-center gap-1.5 rounded-[9px] bg-[var(--afa-accent)] px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-[var(--afa-accent-ink)] disabled:opacity-60">
          <Plus size={14} /> Create &amp; enable
        </button>
      </div>
    </form>
  );
}
