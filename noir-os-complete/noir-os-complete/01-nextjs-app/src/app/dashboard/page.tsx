import Link from "next/link";
import { Stage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { Avatar } from "@/components/ui/avatar";
import { DashboardCharts } from "./dashboard-charts";
import { STAGES, stageMeta, CHANNEL_LABEL, CHANNEL_COLOR, TERMINAL_STAGES, OFF_BOARD_STAGES } from "@/lib/constants";
import { formatDay } from "@/lib/utils";
import {
  Sparkles, ShieldCheck, Megaphone, Clock, Activity, ArrowUpRight, BarChart3,
} from "lucide-react";

export const dynamic = "force-dynamic";

const APPROVAL_STAGES: Stage[] = [Stage.REVIEW, Stage.LEGAL, Stage.APPROVAL];
const CHANNELS = Object.keys(CHANNEL_LABEL) as (keyof typeof CHANNEL_LABEL)[];

export default async function DashboardPage() {
  const { member, workspaceId } = await requireMember();

  const [items, campaigns] = await Promise.all([
    prisma.contentItem.findMany({
      where: { workspaceId },
      include: {
        campaign: { select: { id: true, name: true, color: true } },
        owner: { select: { id: true, name: true, initials: true, color: true } },
      },
    }),
    prisma.campaign.findMany({ where: { workspaceId }, orderBy: { createdAt: "asc" } }),
  ]);

  // ── Aggregates (all derived from the one workspace query) ──────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const wip = items.filter((i) => !OFF_BOARD_STAGES.includes(i.stage));
  const approvals = items.filter((i) => APPROVAL_STAGES.includes(i.stage));
  const scheduled = items.filter((i) => i.stage === Stage.SCHEDULED);
  const published = items.filter((i) => i.stage === Stage.PUBLISHED);
  const nextPublish = scheduled
    .filter((i) => i.publishAt)
    .sort((a, b) => a.publishAt!.getTime() - b.publishAt!.getTime())[0]?.publishAt ?? null;

  const deadlines = items
    .filter((i) => i.dueDate && i.dueDate >= today && !TERMINAL_STAGES.includes(i.stage))
    .sort((a, b) => a.dueDate!.getTime() - b.dueDate!.getTime())
    .slice(0, 5);

  const recent = [...items].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 5);

  const stageData = STAGES.map((s) => ({
    label: s.label,
    value: items.filter((i) => i.stage === s.key).length,
    color: s.color,
  }));

  const channelData = CHANNELS.map((ch) => ({
    label: CHANNEL_LABEL[ch],
    value: items.filter((i) => i.channel === ch).length,
    color: CHANNEL_COLOR[ch],
  })).filter((d) => d.value > 0);

  const campaignsWithCounts = campaigns
    .map((c) => ({ ...c, count: items.filter((i) => i.campaignId === c.id).length }))
    .sort((a, b) => b.health - a.health);

  // ── Data-driven recommendations (rule-based signals) ───────────────────────
  const worst = [...campaigns].sort((a, b) => a.health - b.health)[0];
  const topPub = [...published].sort((a, b) => b.aiScore - a.aiScore)[0];
  const recs: string[] = [];
  if (worst) {
    const inCampaign = items.filter((i) => i.campaignId === worst.id).length;
    const awaiting = items.filter((i) => i.campaignId === worst.id && APPROVAL_STAGES.includes(i.stage)).length;
    recs.push(`${worst.name} is trailing at ${worst.health}% health — ${inCampaign} items in flight${awaiting ? `, ${awaiting} awaiting sign-off. Prioritise those.` : "."}`);
  }
  if (approvals.length) {
    recs.push(`${approvals.length} item${approvals.length === 1 ? " is" : "s are"} awaiting approval. Clearing the queue unblocks scheduling.`);
  }
  if (topPub) {
    recs.push(`“${topPub.title}” is your top performer (AI ${topPub.aiScore}). Repurpose it to extend reach.`);
  }

  const kpis = [
    { label: "Work in progress", value: wip.length, sub: `across ${new Set(wip.map((i) => i.campaignId)).size} campaigns`, href: "/board" },
    { label: "Awaiting approval", value: approvals.length, sub: "needs sign-off", href: "/approvals" },
    { label: "Scheduled", value: scheduled.length, sub: nextPublish ? `next ${formatDay(nextPublish)}` : "nothing queued", href: "/board/calendar" },
    { label: "Published", value: published.length, sub: "content live", href: "/board" },
  ];

  return (
    <AppShell
      title="Dashboard"
      workspaceName={member.workspace.name}
      user={{ name: member.name, initials: member.initials, color: member.color, role: member.role }}
      boardCount={wip.length}
      approvalCount={approvals.length}
    >
      <div className="px-6 py-5 md:px-[26px]">
        {/* KPI row */}
        <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {kpis.map((k) => (
            <Link key={k.label} href={k.href} className="afa-panel afa-kpi">
              <div className="flex items-center">
                <span className="lbl">{k.label}</span>
                <ArrowUpRight size={14} className="ml-auto text-[var(--afa-ink-4)]" />
              </div>
              <div className="val">{k.value}</div>
              <div className="dl text-[var(--afa-ink-3)]">{k.sub}</div>
            </Link>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          {/* Left column */}
          <div className="flex flex-col gap-4">
            <div className="afa-panel">
              <div className="afa-panel-h">
                <Sparkles size={15} color="#FF6F91" />
                <h3>AI recommendations</h3>
                <span className="more rounded-md bg-[#FFF0EA] px-2 py-0.5 text-[11px] font-semibold text-[#FF6F91]">{recs.length} signals</span>
              </div>
              <div className="pb-1.5">
                {recs.map((r, i) => (
                  <div className="afa-airec" key={i}>
                    <div className="ico"><Sparkles size={14} /></div>
                    <p>{r}</p>
                  </div>
                ))}
                {recs.length === 0 && <div className="px-4 pb-3 text-[12.5px] text-[var(--afa-ink-3)]">All clear — nothing needs attention right now.</div>}
              </div>
            </div>

            <div className="afa-panel">
              <div className="afa-panel-h">
                <ShieldCheck size={15} color="var(--afa-warn)" />
                <h3>Approval queue</h3>
                <Link href="/approvals" className="more text-[12px] font-semibold text-[var(--afa-accent-ink)] hover:underline">Open center</Link>
              </div>
              {approvals.slice(0, 5).map((it) => (
                <Link href="/approvals" key={it.id} className="afa-rowitem">
                  <span className="afa-sdot" style={{ background: stageMeta(it.stage).color }} />
                  <span className="tt">{it.title}</span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-[var(--afa-surface-3)] px-2 py-0.5 text-[11px] font-semibold text-[var(--afa-ink-2)]">
                    <span className="afa-sdot" style={{ background: CHANNEL_COLOR[it.channel] }} />
                    {CHANNEL_LABEL[it.channel]}
                  </span>
                  <Avatar initials={it.owner.initials} color={it.owner.color} name={it.owner.name} size={22} />
                  <span className="afa-meta">{formatDay(it.dueDate)}</span>
                </Link>
              ))}
              {approvals.length === 0 && <div className="px-4 py-4 text-[12.5px] text-[var(--afa-ink-3)]">Queue is clear.</div>}
            </div>

            <div className="afa-panel">
              <div className="afa-panel-h">
                <BarChart3 size={15} color="var(--afa-accent)" />
                <h3>Content overview</h3>
                <span className="more afa-meta">{items.length} items total</span>
              </div>
              <DashboardCharts stageData={stageData} channelData={channelData} />
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            <div className="afa-panel">
              <div className="afa-panel-h">
                <Megaphone size={15} color="var(--afa-accent)" />
                <h3>Campaign health</h3>
              </div>
              <div className="flex flex-col gap-3 px-4 pb-4 pt-1">
                {campaignsWithCounts.map((c) => (
                  <div key={c.id}>
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="afa-sdot" style={{ background: c.color }} />
                      <span className="text-[12.5px] font-semibold">{c.name}</span>
                      <span className="afa-meta ml-auto">{c.count} items · {c.health}%</span>
                    </div>
                    <div className="afa-meter"><i style={{ width: `${c.health}%`, opacity: c.health < 70 ? 0.6 : 1 }} /></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="afa-panel">
              <div className="afa-panel-h">
                <Clock size={15} color="var(--afa-warn)" />
                <h3>Upcoming deadlines</h3>
              </div>
              {deadlines.map((it) => (
                <Link href="/board" key={it.id} className="afa-rowitem">
                  <div className="w-9 text-center">
                    <div className="mono text-[14px] font-bold leading-none">{it.dueDate!.getDate()}</div>
                    <div className="afa-meta text-[9.5px]">{it.dueDate!.toLocaleDateString("en-US", { month: "short" }).toUpperCase()}</div>
                  </div>
                  <span className="tt">{it.title}</span>
                  <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold" style={{ background: stageMeta(it.stage).color + "18", color: stageMeta(it.stage).color }}>
                    {stageMeta(it.stage).label}
                  </span>
                </Link>
              ))}
              {deadlines.length === 0 && <div className="px-4 py-4 text-[12.5px] text-[var(--afa-ink-3)]">No upcoming deadlines.</div>}
            </div>

            <div className="afa-panel">
              <div className="afa-panel-h">
                <Activity size={15} color="var(--afa-accent)" />
                <h3>Recent updates</h3>
              </div>
              {recent.map((it) => (
                <div key={it.id} className="afa-rowitem">
                  <Avatar initials={it.owner.initials} color={it.owner.color} name={it.owner.name} size={24} />
                  <span className="tt">{it.title}</span>
                  <span className="afa-meta">{stageMeta(it.stage).label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
