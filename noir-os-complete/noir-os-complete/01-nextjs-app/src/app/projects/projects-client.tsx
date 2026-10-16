"use client";

import { useState } from "react";
import { Plus, Trash2, Check, Calendar, FolderKanban, Inbox, ChevronDown } from "lucide-react";
import {
  createProject, updateProject, deleteProject, createTask, toggleTask, deleteTask,
} from "./actions";

export type TaskDTO = {
  id: string;
  title: string;
  done: boolean;
  priority: "Low" | "Medium" | "High";
  dueDate: string | null;
  projectId: string | null;
};
export type ProjectDTO = {
  id: string;
  name: string;
  color: string;
  status: "Active" | "On hold" | "Done";
  dueDate: string | null;
  tasks: TaskDTO[];
};

const SWATCHES = ["#2E63F6", "#EC4899", "#8B5CF6", "#0EA5A4", "#F79009", "#12B76A"];
const PRIO_COLOR: Record<string, string> = { High: "var(--afa-bad)", Medium: "var(--afa-warn)", Low: "var(--afa-ink-4)" };

function fmtDue(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  const day = new Date(d); day.setHours(0, 0, 0, 0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((day.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return { label: "overdue", overdue: true };
  if (diff === 0) return { label: "today", overdue: false };
  if (diff === 1) return { label: "tomorrow", overdue: false };
  return { label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), overdue: false };
}

function AddTask({ onAdd }: { onAdd: (title: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <div className="flex items-center gap-2 px-1 py-1.5">
      <Plus size={15} className="text-[var(--afa-ink-4)]" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && value.trim()) { onAdd(value.trim()); setValue(""); }
        }}
        placeholder="Add a task…"
        className="flex-1 border-none bg-transparent text-[13px] outline-none placeholder:text-[var(--afa-ink-4)]"
      />
    </div>
  );
}

function TaskRow({ task, onToggle, onDelete }: { task: TaskDTO; onToggle: () => void; onDelete: () => void }) {
  const due = fmtDue(task.dueDate);
  return (
    <div className="group flex items-center gap-2.5 border-t border-[var(--afa-line-2)] px-1 py-2">
      <button
        onClick={onToggle}
        className={"grid h-[18px] w-[18px] flex-none place-items-center rounded-md border transition " + (task.done ? "border-[var(--afa-accent)] bg-[var(--afa-accent)] text-white" : "border-[var(--afa-line)] hover:border-[var(--afa-accent)]")}
        aria-label={task.done ? "Mark not done" : "Mark done"}
      >
        {task.done && <Check size={12} />}
      </button>
      <span className={"flex-1 text-[13px] " + (task.done ? "text-[var(--afa-ink-4)] line-through" : "text-[var(--afa-ink)]")}>{task.title}</span>
      {!task.done && <span className="afa-sdot" style={{ background: PRIO_COLOR[task.priority] }} title={`${task.priority} priority`} />}
      {due && (
        <span className="afa-meta flex items-center gap-1" style={{ color: due.overdue ? "var(--afa-bad)" : undefined }}>
          <Calendar size={11} /> {due.label}
        </span>
      )}
      <button onClick={onDelete} className="opacity-0 transition group-hover:opacity-100 text-[var(--afa-ink-4)] hover:text-[var(--afa-bad)]" aria-label="Delete task">
        <Trash2 size={14} />
      </button>
    </div>
  );
}

export function ProjectsClient({ initialProjects, initialLoose }: { initialProjects: ProjectDTO[]; initialLoose: TaskDTO[] }) {
  const [projects, setProjects] = useState<ProjectDTO[]>(initialProjects);
  const [loose, setLoose] = useState<TaskDTO[]>(initialLoose);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(SWATCHES[0]);
  const [creating, setCreating] = useState(false);

  async function addProject() {
    const name = newName.trim();
    if (!name || creating) return;
    setCreating(true);
    try {
      const res = await createProject({ name, color: newColor });
      if (res?.ok) {
        setProjects((p) => [...p, { id: res.id, name, color: newColor, status: "Active", dueDate: null, tasks: [] }]);
        setNewName("");
      }
    } finally { setCreating(false); }
  }

  async function addTask(projectId: string | null, title: string) {
    const res = await createTask({ title, projectId });
    if (!res?.ok) return;
    const task: TaskDTO = { id: res.id, title, done: false, priority: "Medium", dueDate: null, projectId };
    if (projectId) setProjects((ps) => ps.map((p) => (p.id === projectId ? { ...p, tasks: [...p.tasks, task] } : p)));
    else setLoose((l) => [...l, task]);
  }

  function toggle(task: TaskDTO) {
    const done = !task.done;
    if (task.projectId) setProjects((ps) => ps.map((p) => (p.id === task.projectId ? { ...p, tasks: p.tasks.map((t) => (t.id === task.id ? { ...t, done } : t)) } : p)));
    else setLoose((l) => l.map((t) => (t.id === task.id ? { ...t, done } : t)));
    toggleTask({ id: task.id, done }).catch(() => {});
  }

  function removeTask(task: TaskDTO) {
    if (task.projectId) setProjects((ps) => ps.map((p) => (p.id === task.projectId ? { ...p, tasks: p.tasks.filter((t) => t.id !== task.id) } : p)));
    else setLoose((l) => l.filter((t) => t.id !== task.id));
    deleteTask({ id: task.id }).catch(() => {});
  }

  function setStatus(project: ProjectDTO, status: ProjectDTO["status"]) {
    setProjects((ps) => ps.map((p) => (p.id === project.id ? { ...p, status } : p)));
    updateProject({ id: project.id, status }).catch(() => {});
  }

  function rename(project: ProjectDTO, name: string) {
    const trimmed = name.trim();
    if (!trimmed || trimmed === project.name) return;
    setProjects((ps) => ps.map((p) => (p.id === project.id ? { ...p, name: trimmed } : p)));
    updateProject({ id: project.id, name: trimmed }).catch(() => {});
  }

  function removeProject(project: ProjectDTO) {
    setProjects((ps) => ps.filter((p) => p.id !== project.id));
    deleteProject({ id: project.id }).catch(() => {});
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-5 md:px-[26px]">
      {/* New project */}
      <div className="afa-panel mb-4 flex flex-wrap items-center gap-2 p-3">
        <div className="flex items-center gap-1.5 pl-1">
          {SWATCHES.map((c) => (
            <button key={c} onClick={() => setNewColor(c)} aria-label={`Colour ${c}`}
              className="h-5 w-5 rounded-full transition" style={{ background: c, outline: newColor === c ? "2px solid var(--afa-ink)" : "none", outlineOffset: 2 }} />
          ))}
        </div>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") addProject(); }}
          placeholder="New project name…"
          className="min-w-[160px] flex-1 border-none bg-transparent px-2 text-[14px] outline-none"
        />
        <button onClick={addProject} disabled={!newName.trim() || creating} className="inline-flex items-center gap-1.5 rounded-[9px] bg-[var(--afa-accent)] px-3.5 py-2 text-[12.5px] font-semibold text-white hover:bg-[var(--afa-accent-ink)] disabled:opacity-50">
          <Plus size={14} /> Add project
        </button>
      </div>

      {/* Projects */}
      {projects.map((p) => {
        const total = p.tasks.length;
        const done = p.tasks.filter((t) => t.done).length;
        const pct = total ? Math.round((done / total) * 100) : 0;
        return (
          <div key={p.id} className="afa-panel mb-4 p-4">
            <div className="flex items-center gap-2.5">
              <FolderKanban size={16} style={{ color: p.color }} />
              <input
                defaultValue={p.name}
                onBlur={(e) => rename(p, e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                className="min-w-0 flex-1 border-none bg-transparent text-[15px] font-semibold tracking-tight outline-none focus:bg-[var(--afa-surface-3)] focus:px-1.5 rounded"
              />
              <div className="relative">
                <select
                  value={p.status}
                  onChange={(e) => setStatus(p, e.target.value as ProjectDTO["status"])}
                  className="appearance-none rounded-full border border-[var(--afa-line)] bg-[var(--afa-surface)] py-1 pl-2.5 pr-6 text-[11px] font-semibold text-[var(--afa-ink-2)]"
                >
                  <option>Active</option><option>On hold</option><option>Done</option>
                </select>
                <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1.5 text-[var(--afa-ink-4)]" />
              </div>
              <button onClick={() => removeProject(p)} className="text-[var(--afa-ink-4)] hover:text-[var(--afa-bad)]" aria-label="Delete project">
                <Trash2 size={15} />
              </button>
            </div>

            <div className="mb-1 mt-3 flex items-center justify-between text-[11px]">
              <span className="afa-meta">{done}/{total} done</span>
              <span className="mono text-[var(--afa-ink-3)]">{pct}%</span>
            </div>
            <div className="afa-meter mb-2"><i style={{ width: `${pct}%`, background: p.color }} /></div>

            {p.tasks.map((t) => (
              <TaskRow key={t.id} task={t} onToggle={() => toggle(t)} onDelete={() => removeTask(t)} />
            ))}
            <div className="border-t border-[var(--afa-line-2)]">
              <AddTask onAdd={(title) => addTask(p.id, title)} />
            </div>
          </div>
        );
      })}

      {/* Day-to-day (no project) */}
      <div className="afa-panel p-4">
        <div className="flex items-center gap-2.5">
          <Inbox size={16} className="text-[var(--afa-ink-3)]" />
          <div className="text-[15px] font-semibold tracking-tight">Day-to-day</div>
          <span className="afa-meta ml-auto">{loose.filter((t) => !t.done).length} open</span>
        </div>
        <div className="mt-3">
          {loose.map((t) => (
            <TaskRow key={t.id} task={t} onToggle={() => toggle(t)} onDelete={() => removeTask(t)} />
          ))}
          <div className="border-t border-[var(--afa-line-2)]">
            <AddTask onAdd={(title) => addTask(null, title)} />
          </div>
        </div>
      </div>
    </div>
  );
}
