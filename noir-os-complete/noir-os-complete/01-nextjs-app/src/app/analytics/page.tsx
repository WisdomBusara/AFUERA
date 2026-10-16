import { Stage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { TrendChart, type TrendPoint } from "./analytics-charts";
import { CHANNEL_LABEL, CHANNEL_COLOR } from "@/lib/constants";
import { TrendingUp, BarChart3, Hash, Star, ArrowUpRight, ArrowDownRight } from "lucide-react";

export const dynamic = "force-dynamic";

const APPROVAL_STAGES: Stage[] = [Stage.REVIEW, Stage.LEGAL, Stage.APPROVAL];

const fmtBig = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
  : n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}K`
  : `${n}`;

function Delta({ value, unit }: { value: number; unit: "%" | "pt" }) {
  const up = value >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="dl" style={{ color: up ? "var(--afa-ok)" : "var(--afa-bad)" }}>
      <Icon size={13} />
      {up ? "+" : ""}{value.toFixed(unit === "%" ? 1 : 2)}{unit} <span className="text-[var(--afa-ink-3)] font-normal">WoW</span>
    </span>
  );
}

export default async function AnalyticsPage() {
  const { member, workspaceId } = await requireMember();

  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - 56);

  const [byDay, byChannel, byContent, approvalCount, activeCount] = await Promise.all([
    prisma.dailyMetric.groupBy({
      by: ["date"],
      where: { workspaceId, date: { gte: cutoff } },
      _sum: { reach: true, engagements: true, impressions: true, clicks: true },
      orderBy: { date: "asc" },
    }),
    prisma.dailyMetric.groupBy({
      by: ["channel"],
      where: { workspaceId, date: { gte: cutoff } },
      _sum: { reach: true },
    }),
    prisma.dailyMetric.groupBy({
      by: ["contentItemId"],
      where: { workspaceId, date: { gte: cutoff } },
      _sum: { reach: true, engagements: true },
      orderBy: { _sum: { reach: "desc" } },
      take: 5,
    }),
    prisma.contentItem.count({ where: { workspaceId, stage: { in: APPROVAL_STAGES } } }),
    prisma.contentItem.count({ where: { workspaceId, stage: { notIn: [Stage.PUBLISHED, Stage.ARCHIVED] } } }),
  ]);

  const shell = {
    title: "Analytics",
    workspaceName: member.workspace.name,
    user: { name: member.name, initials: member.initials, color: member.color, role: member.role },
    boardCount: activeCount,
    approvalCount,
  };

  // Empty state (no metrics yet).
  if (byDay.length === 0) {
    return (
      <AppShell {...shell}>
        <div className="px-6 py-16 text-center text-[13px] text-[var(--afa-ink-3)]">
          No analytics yet. Publish content and daily metrics will appear here.
        </div>
      </AppShell>
    );
  }

  // ── Series + window aggregates ─────────────────────────────────────────────
  const series: TrendPoint[] = byDay.map((m) => {
    const d = new Date(m.date);
    return {
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      reach: m._sum.reach ?? 0,
      engagements: m._sum.engagements ?? 0,
    };
  });

  const daily = byDay.map((m) => ({
    reach: m._sum.reach ?? 0,
    eng: m._sum.engagements ?? 0,
    imp: m._sum.impressions ?? 0,
    clk: m._sum.clicks ?? 0,
  }));
  const n = daily.length;
  const sum = (arr: number[], s: number, e: number) => arr.slice(Math.max(0, s), e).reduce((a, b) => a + b, 0);

  const reachArr = daily.map((d) => d.reach);
  const engArr = daily.map((d) => d.eng);
  const impArr = daily.map((d) => d.imp);
  const clkArr = daily.map((d) => d.clk);

  const totals = {
    reach: reachArr.reduce((a, b) => a + b, 0),
    eng: engArr.reduce((a, b) => a + b, 0),
    imp: impArr.reduce((a, b) => a + b, 0),
    clk: clkArr.reduce((a, b) => a + b, 0),
  };

  const last7 = { reach: sum(reachArr, n - 7, n), eng: sum(engArr, n - 7, n), imp: sum(impArr, n - 7, n), clk: sum(clkArr, n - 7, n) };
  const prev7 = { reach: sum(reachArr, n - 14, n - 7), eng: sum(engArr, n - 14, n - 7), imp: sum(impArr, n - 14, n - 7), clk: sum(clkArr, n - 14, n - 7) };
  const pct = (a: number, b: number) => (b > 0 ? ((a - b) / b) * 100 : 0);
  const rate = (num: number, den: number) => (den > 0 ? (num / den) * 100 : 0);

  const engRateNow = rate(last7.eng, last7.imp);
  const ctrNow = rate(last7.clk, last7.imp);

  const kpis = [
    { label: "Reach", value: fmtBig(totals.reach), delta: pct(last7.reach, prev7.reach), unit: "%" as const },
    { label: "Engagements", value: fmtBig(totals.eng), delta: pct(last7.eng, prev7.eng), unit: "%" as const },
    { label: "Eng. rate", value: `${rate(totals.eng, totals.imp).toFixed(1)}%`, delta: engRateNow - rate(prev7.eng, prev7.imp), unit: "pt" as const },
    { label: "CTR", value: `${rate(totals.clk, totals.imp).toFixed(2)}%`, delta: ctrNow - rate(prev7.clk, prev7.imp), unit: "pt" as const },
  ];

  // ── Channel breakdown ──────────────────────────────────────────────────────
  const channels = byChannel
    .map((m) => ({ channel: m.channel, reach: m._sum.reach ?? 0 }))
    .sort((a, b) => b.reach - a.reach);
  const channelMax = Math.max(1, ...channels.map((c) => c.reach));

  // ── Top content (join groupBy result back to titles) ───────────────────────
  const topIds = byContent.map((m) => m.contentItemId);
  const topItems = await prisma.contentItem.findMany({
    where: { id: { in: topIds } },
    include: { campaign: { select: { name: true, color: true } } },
  });
  const itemMap = new Map(topItems.map((i) => [i.id, i]));
  const top = byContent
    .map((m) => {
      const it = itemMap.get(m.contentItemId);
      return it ? { id: it.id, title: it.title, channel: it.channel, campaign: it.campaign, reach: m._sum.reach ?? 0 } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return (
    <AppShell {...shell}>
      <div className="px-6 py-5 md:px-[26px]">
        {/* KPI row */}
        <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.label} className="afa-panel afa-kpi">
              <span className="lbl">{k.label}</span>
              <div className="val">{k.value}</div>
              <Delta value={k.delta} unit={k.unit} />
            </div>
          ))}
        </div>

        {/* Trend */}
        <div className="afa-panel mb-4">
          <div className="afa-panel-h">
            <TrendingUp size={15} color="var(--afa-accent)" />
            <h3>Reach &amp; engagement</h3>
            <span className="more afa-meta">last 8 weeks · daily</span>
          </div>
          <div className="flex items-center gap-4 px-4 pb-1 pt-1">
            <span className="flex items-center gap-1.5 text-[11.5px] text-[var(--afa-ink-2)]"><span className="afa-sdot" style={{ background: "#2E63F6" }} /> Reach</span>
            <span className="flex items-center gap-1.5 text-[11.5px] text-[var(--afa-ink-2)]"><span className="afa-sdot" style={{ background: "#FF6F91" }} /> Engagements</span>
          </div>
          <div className="px-3 pb-3">
            <TrendChart series={series} />
          </div>
        </div>

        {/* Channel + top content */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="afa-panel">
            <div className="afa-panel-h">
              <Hash size={15} color="var(--afa-accent)" />
              <h3>Reach by channel</h3>
              <span className="more afa-meta">8-week total</span>
            </div>
            <div className="flex flex-col gap-3 px-4 pb-4 pt-2">
              {channels.map((c) => (
                <div key={c.channel}>
                  <div className="mb-1.5 flex items-center gap-2 text-[12px]">
                    <span className="afa-sdot" style={{ background: CHANNEL_COLOR[c.channel] }} />
                    <span className="font-medium">{CHANNEL_LABEL[c.channel]}</span>
                    <span className="mono ml-auto font-semibold text-[var(--afa-ink-2)]">{fmtBig(c.reach)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--afa-surface-3)]">
                    <div className="h-full rounded-full" style={{ width: `${(c.reach / channelMax) * 100}%`, background: CHANNEL_COLOR[c.channel] }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="afa-panel">
            <div className="afa-panel-h">
              <Star size={15} color="var(--afa-warn)" />
              <h3>Top performing content</h3>
              <span className="more afa-meta">by reach</span>
            </div>
            {top.map((it, i) => (
              <div key={it.id} className="afa-rowitem">
                <span className="mono w-4 text-[13px] font-bold text-[var(--afa-ink-3)]">{i + 1}</span>
                <span className="tt">{it.title}</span>
                <span className="inline-flex items-center gap-1 rounded-md bg-[var(--afa-surface-3)] px-2 py-0.5 text-[11px] font-semibold text-[var(--afa-ink-2)]">
                  <span className="afa-sdot" style={{ background: CHANNEL_COLOR[it.channel] }} />
                  {CHANNEL_LABEL[it.channel]}
                </span>
                <span className="mono text-[12px] font-semibold">{fmtBig(it.reach)}</span>
              </div>
            ))}
            {top.length === 0 && <div className="px-4 py-4 text-[12.5px] text-[var(--afa-ink-3)]">No published content yet.</div>}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1.5 px-1 text-[11px] text-[var(--afa-ink-3)]">
          <BarChart3 size={12} /> Metrics aggregate the workspace&apos;s DailyMetric rows over the last 56 days.
        </div>
      </div>
    </AppShell>
  );
}
