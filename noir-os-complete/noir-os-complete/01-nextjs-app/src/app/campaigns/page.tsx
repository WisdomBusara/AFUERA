import { Stage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { Avatar } from "@/components/ui/avatar";
import { STAGES, TERMINAL_STAGES } from "@/lib/constants";
import { Layers, Send, CheckCircle2, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

const APPROVAL_STAGES: Stage[] = [Stage.REVIEW, Stage.LEGAL, Stage.APPROVAL];

function healthColor(h: number) {
  return h >= 80 ? "var(--afa-ok)" : h >= 65 ? "var(--afa-warn)" : "var(--afa-bad)";
}
function healthBg(h: number) {
  return h >= 80 ? "#E6F7EF" : h >= 65 ? "#FEF3E2" : "#FDECEC";
}

export default async function CampaignsPage() {
  const { member, workspaceId } = await requireMember();

  const [campaigns, items] = await Promise.all([
    prisma.campaign.findMany({ where: { workspaceId }, orderBy: { createdAt: "asc" } }),
    prisma.contentItem.findMany({
      where: { workspaceId },
      select: {
        campaignId: true, stage: true,
        owner: { select: { id: true, name: true, initials: true, color: true } },
      },
    }),
  ]);

  const approvalCount = items.filter((i) => APPROVAL_STAGES.includes(i.stage)).length;
  const activeCount = items.filter((i) => !TERMINAL_STAGES.includes(i.stage)).length;

  return (
    <AppShell
      title="Campaigns"
      workspaceName={member.workspace.name}
      user={{ name: member.name, initials: member.initials, color: member.color, role: member.role }}
      boardCount={activeCount}
      approvalCount={approvalCount}
    >
      <div className="px-6 py-5 md:px-[26px]">
        <div className="grid gap-4 lg:grid-cols-2">
          {campaigns.map((c) => {
            const list = items.filter((i) => i.campaignId === c.id);
            const total = list.length;
            const published = list.filter((i) => i.stage === Stage.PUBLISHED).length;
            const scheduled = list.filter((i) => i.stage === Stage.SCHEDULED).length;
            const inReview = list.filter((i) => APPROVAL_STAGES.includes(i.stage)).length;

            const owners = Array.from(new Map(list.map((i) => [i.owner.id, i.owner])).values());
            const dist = STAGES.map((s) => ({
              color: s.color,
              label: s.label,
              value: list.filter((i) => i.stage === s.key).length,
            })).filter((d) => d.value > 0);

            const Stat = ({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) => (
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--afa-surface-3)] text-[var(--afa-ink-2)]">{icon}</span>
                <div className="leading-tight">
                  <div className="mono text-[14px] font-bold">{value}</div>
                  <div className="afa-meta text-[10px]">{label}</div>
                </div>
              </div>
            );

            return (
              <div key={c.id} className="afa-panel overflow-hidden">
                <div style={{ height: 6, background: `linear-gradient(90deg, ${c.color}, ${c.color}88)` }} />
                <div className="p-5">
                  <div className="flex items-center gap-2.5">
                    <span className="afa-sdot" style={{ background: c.color, width: 10, height: 10 }} />
                    <div className="text-[15.5px] font-semibold tracking-tight">{c.name}</div>
                    <span className="ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: healthBg(c.health), color: healthColor(c.health) }}>
                      {c.status}
                    </span>
                  </div>

                  <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--afa-ink-2)]">{c.objective}</p>

                  <div className="mb-1.5 mt-4 flex items-center justify-between text-[11.5px]">
                    <span className="afa-meta">Campaign health</span>
                    <span className="mono font-semibold" style={{ color: healthColor(c.health) }}>{c.health}%</span>
                  </div>
                  <div className="afa-meter"><i style={{ width: `${c.health}%`, opacity: c.health < 70 ? 0.6 : 1 }} /></div>

                  {/* Stage distribution */}
                  <div className="mt-4">
                    <div className="mb-1.5 afa-meta">Pipeline · {total} items</div>
                    <div className="flex h-2 overflow-hidden rounded-full bg-[var(--afa-surface-3)]">
                      {dist.map((d) => (
                        <div key={d.label} title={`${d.label}: ${d.value}`} style={{ width: `${(d.value / Math.max(1, total)) * 100}%`, background: d.color }} />
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-5 border-t border-[var(--afa-line-2)] pt-4">
                    <Stat icon={<Layers size={14} />} value={total} label="Total" />
                    <Stat icon={<ShieldCheck size={14} />} value={inReview} label="In review" />
                    <Stat icon={<Send size={14} />} value={scheduled} label="Scheduled" />
                    <Stat icon={<CheckCircle2 size={14} />} value={published} label="Published" />
                    <div className="ml-auto flex">
                      {owners.slice(0, 5).map((o, k) => (
                        <div key={o.id} style={{ marginLeft: k ? -8 : 0, borderRadius: "50%", boxShadow: "0 0 0 2px var(--afa-surface)" }}>
                          <Avatar initials={o.initials} color={o.color} name={o.name} size={24} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
