"use client";

import { useState } from "react";
import { Plus, Trash2, Mail, ShieldCheck, Clock } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { createMember, updateMember, deleteMember } from "./actions";

export type MemberDTO = {
  id: string;
  name: string;
  initials: string;
  color: string;
  role: string;
  email: string | null;
  online: boolean;
  linked: boolean;
  owned: number;
  isSelf: boolean;
};

const SWATCHES = ["#2E63F6", "#EC4899", "#8B5CF6", "#0EA5A4", "#F79009", "#12B76A"];
const ROLES = [
  "Content lead", "Design lead", "Writer", "Social lead",
  "Video producer", "Marketing manager", "Member",
];

function initialsFrom(name: string) {
  return (
    name.split(/\s+/).filter(Boolean).map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "?"
  );
}

function ColorDots({ value, onPick }: { value: string; onPick: (c: string) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      {SWATCHES.map((c) => (
        <button
          key={c}
          onClick={() => onPick(c)}
          aria-label={`Colour ${c}`}
          className="h-[18px] w-[18px] rounded-full transition"
          style={{ background: c, outline: value === c ? "2px solid var(--afa-ink)" : "none", outlineOffset: 2 }}
        />
      ))}
    </div>
  );
}

function MemberRow({
  m,
  onUpdate,
  onDelete,
}: {
  m: MemberDTO;
  onUpdate: (patch: Partial<MemberDTO>) => void;
  onDelete: () => void;
}) {
  return (
    <div className="group flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-[var(--afa-line-2)] px-1 py-3 first:border-t-0">
      {/* Avatar + online dot */}
      <div className="relative flex-none">
        <Avatar initials={m.initials} color={m.color} size={34} name={m.name} />
        <button
          onClick={() => onUpdate({ online: !m.online })}
          title={m.online ? "Online — click to set away" : "Away — click to set online"}
          aria-label="Toggle online"
          className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[var(--afa-surface)]"
          style={{ background: m.online ? "var(--afa-ok)" : "var(--afa-ink-4)" }}
        />
      </div>

      {/* Name + role */}
      <div className="min-w-[160px] flex-1">
        <div className="flex items-center gap-1.5">
          <input
            defaultValue={m.name}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v && v !== m.name) onUpdate({ name: v, initials: initialsFrom(v) });
              else e.target.value = m.name;
            }}
            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
            className="min-w-0 rounded text-[14px] font-semibold tracking-tight outline-none focus:bg-[var(--afa-surface-3)] focus:px-1.5"
          />
          {m.isSelf && <span className="afa-meta rounded bg-[var(--afa-surface-3)] px-1.5 py-px text-[10px]">You</span>}
          {m.linked ? (
            <span className="flex items-center gap-1 text-[10.5px] font-semibold text-[var(--afa-ok)]" title="Signed in with a real login">
              <ShieldCheck size={12} /> Linked
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10.5px] font-semibold text-[var(--afa-ink-4)]" title="Roster profile — no login yet">
              <Clock size={12} /> Pending
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[var(--afa-ink-3)]">
          <Mail size={12} />
          <input
            defaultValue={m.email ?? ""}
            type="email"
            placeholder="no email"
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v !== (m.email ?? "")) onUpdate({ email: v || null });
            }}
            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
            className="min-w-0 rounded bg-transparent text-[12px] outline-none placeholder:text-[var(--afa-ink-4)] focus:bg-[var(--afa-surface-3)] focus:px-1.5"
          />
        </div>
      </div>

      {/* Role */}
      <select
        value={ROLES.includes(m.role) ? m.role : "Member"}
        onChange={(e) => onUpdate({ role: e.target.value })}
        className="rounded-full border border-[var(--afa-line)] bg-[var(--afa-surface)] py-1 pl-2.5 pr-2 text-[11.5px] font-semibold text-[var(--afa-ink-2)]"
      >
        {ROLES.map((r) => <option key={r}>{r}</option>)}
      </select>

      {/* Colour */}
      <ColorDots value={m.color} onPick={(c) => onUpdate({ color: c })} />

      {/* Owned content */}
      <span className="afa-meta w-[88px] text-right text-[11.5px]" title="Content items owned">
        {m.owned} owned
      </span>

      {/* Delete */}
      <button
        onClick={onDelete}
        disabled={m.isSelf}
        className="text-[var(--afa-ink-4)] transition hover:text-[var(--afa-bad)] disabled:opacity-30 disabled:hover:text-[var(--afa-ink-4)]"
        aria-label="Remove member"
        title={m.isSelf ? "You can't remove yourself" : "Remove member"}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

export function TeamClient({ initialMembers }: { initialMembers: MemberDTO[] }) {
  const [members, setMembers] = useState<MemberDTO[]>(initialMembers);
  const [name, setName] = useState("");
  const [role, setRole] = useState(ROLES[0]);
  const [color, setColor] = useState(SWATCHES[0]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addMember() {
    const trimmed = name.trim();
    if (!trimmed || creating) return;
    setCreating(true);
    setError(null);
    try {
      const res = await createMember({ name: trimmed, role, color });
      if (res?.ok) {
        setMembers((ms) => [
          ...ms,
          {
            id: res.id, name: trimmed, initials: res.initials, color: res.color, role,
            email: null, online: false, linked: false, owned: 0, isSelf: false,
          },
        ]);
        setName("");
      }
    } catch {
      setError("Couldn't add that member. Try again.");
    } finally {
      setCreating(false);
    }
  }

  function patch(id: string, p: Partial<MemberDTO>) {
    setMembers((ms) => ms.map((m) => (m.id === id ? { ...m, ...p } : m)));
    const { name, role, color, email, online } = p;
    updateMember({ id, name, role, color, email, online }).catch(() => {
      setError("Couldn't save that change.");
    });
  }

  async function remove(target: MemberDTO) {
    setError(null);
    const snapshot = members;
    setMembers((ms) => ms.filter((m) => m.id !== target.id)); // optimistic
    const res = await deleteMember({ id: target.id }).catch(() => ({ ok: false as const, error: "Delete failed." }));
    if (!res.ok) {
      setMembers(snapshot); // revert
      setError(res.error ?? "Couldn't remove that member.");
    }
  }

  const online = members.filter((m) => m.online).length;

  return (
    <div className="mx-auto max-w-3xl px-6 py-5 md:px-[26px]">
      {/* Add teammate */}
      <div className="afa-panel mb-4 flex flex-wrap items-center gap-2 p-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") addMember(); }}
          placeholder="Teammate name…"
          className="min-w-[150px] flex-1 border-none bg-transparent px-2 text-[14px] outline-none"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded-full border border-[var(--afa-line)] bg-[var(--afa-surface)] py-1.5 pl-2.5 pr-2 text-[11.5px] font-semibold text-[var(--afa-ink-2)]"
        >
          {ROLES.map((r) => <option key={r}>{r}</option>)}
        </select>
        <ColorDots value={color} onPick={setColor} />
        <button
          onClick={addMember}
          disabled={!name.trim() || creating}
          className="inline-flex items-center gap-1.5 rounded-[9px] bg-[var(--afa-accent)] px-3.5 py-2 text-[12.5px] font-semibold text-white hover:bg-[var(--afa-accent-ink)] disabled:opacity-50"
        >
          <Plus size={14} /> Add teammate
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-[10px] bg-[#fdecec] px-3.5 py-2.5 text-[12.5px] font-medium text-[var(--afa-bad)]">
          {error}
        </div>
      )}

      {/* Roster */}
      <div className="afa-panel p-4">
        <div className="mb-1 flex items-center gap-2.5">
          <div className="text-[15px] font-semibold tracking-tight">Members</div>
          <span className="afa-meta ml-auto">{members.length} total · {online} online</span>
        </div>
        <div className="mt-2">
          {members.map((m) => (
            <MemberRow key={m.id} m={m} onUpdate={(p) => patch(m.id, p)} onDelete={() => remove(m)} />
          ))}
          {members.length === 0 && (
            <div className="px-1 py-6 text-center text-[13px] text-[var(--afa-ink-4)]">
              No members yet — add your first teammate above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
