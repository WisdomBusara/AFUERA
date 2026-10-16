import Link from "next/link";
import { Stage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { getBriefData, sparkOfDay } from "@/lib/brief";
import { BriefEmailButton } from "./brief-email-button";
import { Sunrise, CheckCircle2, CalendarClock, FolderKanban, ArrowUpRight } from "lucide-react";

export const dynamic = "force-dynamic";

function dueLabel(d: Date | null, start: Date) {
  if (!d) return "";
  const day = new Date(d); day.setHours(0, 0, 0, 0);
  const diff = Math.round((day.getTime() - start.getTime()) / 86400000);
  if (diff < 0) return "overdue";
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default async function BriefPage() {
  const { member, workspaceId } = await requireMember();

  const [{ tasksToday, upcoming, projects, start }, approvalCount, activeCount] = await Promise.all([
    getBriefData(workspaceId),
    prisma.contentItem.count({ where: { workspaceId, stage: { in: [Stage.REVIEW, Stage.LEGAL, Stage.APPROVAL] } } }),
    prisma.contentItem.count({ where: { workspaceId, stage: { notIn: [Stage.PUBLISHED, Stage.ARCHIVED] } } }),
  ]);

  const [quote, author] = sparkOfDay();
  const dateLine = start.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const first = member.name.split(" ")[0];

  return (
    <AppShell
      title="Daily Brief"
      workspaceName={member.workspace.name}
      user={{ name: member.name, initials: member.initials, color: member.color, role: member.role }}
      boardCount={activeCount}
      approvalCount={approvalCount}
    >
      <div className="mx-auto max-w-4xl px-6 py-6 md:px-[26px]">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--afa-ink-3)]">
              <Sunrise size={13} /> Your morning brief
            </div>
            <h1 className="mt-1 text-[28px] font-bold tracking-tight">Good morning, {first}</h1>
            <div className="text-[13.5px] text-[var(--afa-ink-3)]">{dateLine}</div>
          </div>
          <BriefEmailButton />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          {/* Today */}
          <div className="afa-panel">
            <div className="afa-panel-h">
              <CheckCircle2 size={15} color="var(--afa-accent)" />
              <h3>Today</h3>
              <Link href="/projects" className="more text-[12px] font-semibold text-[var(--afa-accent-ink)] hover:underline">Open projects</Link>
            </div>
            {tasksToday.length === 0 && <div className="px-4 py-5 text-[13px] text-[var(--afa-ink-3)]">Nothing due today — enjoy the clear runway.</div>}
            {tasksToday.map((t) => {
              const dl = dueLabel(t.dueDate, start);
              return (
                <div key={t.id} className="afa-rowitem">
                  <span className="h-[7px] w-[7px] flex-none rounded-full" style={{ background: t.project?.color ?? "var(--afa-ink-4)" }} />
                  <span className="tt">{t.title}</span>
                  {t.project?.name && <span className="afa-meta">{t.project.name}</span>}
                  <span className="afa-meta" style={{ color: dl === "overdue" ? "var(--afa-bad)" : undefined }}>{dl}</span>
                </div>
              );
            })}
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            <div className="afa-panel">
              <div className="afa-panel-h"><CalendarClock size={15} color="var(--afa-warn)" /><h3>Coming up</h3></div>
              {upcoming.length === 0 && <div className="px-4 py-5 text-[13px] text-[var(--afa-ink-3)]">Nothing in the next 7 days.</div>}
              {upcoming.map((t) => (
                <div key={t.id} className="afa-rowitem">
                  <span className="tt">{t.title}</span>
                  <span className="afa-meta">{dueLabel(t.dueDate, start)}</span>
                </div>
              ))}
            </div>

            <div className="afa-panel">
              <div className="afa-panel-h"><FolderKanban size={15} color="var(--afa-accent)" /><h3>Projects</h3></div>
              <div className="flex flex-col gap-3 px-4 pb-4 pt-1">
                {projects.length === 0 && <div className="text-[13px] text-[var(--afa-ink-3)]">No active projects.</div>}
                {projects.map((p) => {
                  const total = p._count.tasks;
                  const done = p.tasks.length;
                  const pct = total ? Math.round((done / total) * 100) : 0;
                  return (
                    <div key={p.id}>
                      <div className="mb-1.5 flex items-center gap-2">
                        <span className="afa-sdot" style={{ background: p.color }} />
                        <span className="text-[12.5px] font-semibold">{p.name}</span>
                        <span className="afa-meta ml-auto">{done}/{total}</span>
                      </div>
                      <div className="afa-meter"><i style={{ width: `${pct}%`, background: p.color }} /></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Daily spark */}
        <div className="mt-4 overflow-hidden rounded-2xl p-6 text-white" style={{ background: "linear-gradient(120deg,#3b4bd8,#6d5bd0)" }}>
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/60">Daily spark</div>
          <div className="mt-2 max-w-2xl text-[17px] font-medium italic leading-relaxed">“{quote}”</div>
          <div className="mt-2 text-[13px] text-white/70">— {author}</div>
        </div>

        <div className="mt-4 flex items-center gap-1.5 text-[11px] text-[var(--afa-ink-3)]">
          <ArrowUpRight size={11} /> A copy of this lands in your inbox each morning once the daily check-in cron is enabled (see README).
        </div>
      </div>
    </AppShell>
  );
}
