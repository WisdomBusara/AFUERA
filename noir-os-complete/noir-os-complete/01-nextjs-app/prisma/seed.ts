import { PrismaClient, Stage, ContentType, Channel, Priority } from "@prisma/client";

const prisma = new PrismaClient();

const day = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(9, 0, 0, 0);
  return d;
};

const WINDOW_DAYS = 56; // 8 weeks
const CHANNEL_BASE: Record<Channel, number> = {
  INSTAGRAM: 4200, LINKEDIN: 2600, BLOG: 1800, YOUTUBE: 1500, X: 1200, EMAIL: 900, TIKTOK: 3000,
};

// Builds a smooth-ish daily time-series per published item: an upward drift,
// a weekend dip, and per-day noise. Denormalises channel onto each row.
async function seedMetrics(workspaceId: string, published: { id: string; channel: Channel }[]) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  type Row = {
    date: Date; channel: Channel; impressions: number; reach: number;
    engagements: number; clicks: number; contentItemId: string; workspaceId: string;
  };
  const rows: Row[] = [];

  for (const item of published) {
    const base = CHANNEL_BASE[item.channel] ?? 1500;
    for (let d = WINDOW_DAYS - 1; d >= 0; d--) {
      const date = new Date(start);
      date.setDate(start.getDate() - d);
      const t = (WINDOW_DAYS - 1 - d) / (WINDOW_DAYS - 1); // 0 oldest → 1 newest
      const trend = 0.7 + 0.45 * t;
      const weekend = date.getDay() === 0 || date.getDay() === 6 ? 0.82 : 1;
      const noise = 0.8 + Math.random() * 0.4;

      const reach = Math.round(base * trend * weekend * noise);
      const impressions = Math.round(reach * (1.3 + Math.random() * 0.5));
      const engagements = Math.round(reach * (0.035 + Math.random() * 0.03));
      const clicks = Math.round(engagements * (0.15 + Math.random() * 0.2));

      rows.push({ date, channel: item.channel, impressions, reach, engagements, clicks, contentItemId: item.id, workspaceId });
    }
  }

  if (rows.length) await prisma.dailyMetric.createMany({ data: rows });
  return rows.length;
}

async function main() {
  // Reset (order matters for FKs).
  await prisma.dailyMetric.deleteMany();
  await prisma.contentItem.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.member.deleteMany();
  await prisma.brandKit.deleteMany();
  await prisma.automationRule.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.workspace.deleteMany();

  const ws = await prisma.workspace.create({
    data: { name: "Northbound", slug: "northbound" },
  });

  // MongoDB generates ObjectId `_id`s, so we can't hand-pick ids like the Postgres
  // seed did. Each row carries a logical `key` (stripped before insert); we create the
  // rows in order and map key → the generated id. `authUserId` is a required placeholder
  // for these demo members — real members get their Supabase UUID at first login.
  const memberSeed = [
    { key: "m_sam", name: "Sam Okafor", initials: "SO", color: "#2E63F6", role: "Content lead", online: true },
    { key: "m_maya", name: "Maya Reyes", initials: "MR", color: "#EC4899", role: "Design lead", online: true },
    { key: "m_theo", name: "Theo Kallas", initials: "TK", color: "#8B5CF6", role: "Writer", online: true },
    { key: "m_priya", name: "Priya Shah", initials: "PS", color: "#0EA5A4", role: "Social lead", online: false },
    { key: "m_dan", name: "Dan Obi", initials: "DO", color: "#F79009", role: "Video producer", online: true },
    { key: "m_lena", name: "Lena Vos", initials: "LV", color: "#12B76A", role: "Marketing manager", online: false },
  ];
  const members = await Promise.all(
    memberSeed.map(({ key, ...m }) =>
      prisma.member.create({ data: { ...m, authUserId: `seed_${key}`, workspaceId: ws.id } })
    )
  );

  const campaignSeed = [
    { key: "c_launch", name: "Spring Product Launch", color: "#2E63F6", objective: "Drive pre-orders for the Aurora line", status: "On track", health: 82 },
    { key: "c_brand", name: "Always-On Brand", color: "#12B76A", objective: "Sustain reach and community growth", status: "Healthy", health: 91 },
    { key: "c_thought", name: "Q3 Thought Leadership", color: "#8B5CF6", objective: "Establish authority on cold-weather design", status: "Needs attention", health: 64 },
    { key: "c_trail", name: "Trail Stories", color: "#F79009", objective: "UGC-led storytelling from real hikes", status: "On track", health: 77 },
  ];
  const campaigns = await Promise.all(
    campaignSeed.map(({ key, ...c }) => prisma.campaign.create({ data: { ...c, workspaceId: ws.id } }))
  );

  // key (e.g. "m_sam" / "c_launch") → generated ObjectId, so the rows below read the same.
  const M = Object.fromEntries(memberSeed.map((m, i) => [m.key, members[i].id]));
  const C = Object.fromEntries(campaignSeed.map((c, i) => [c.key, campaigns[i].id]));

  type Row = [string, ContentType, Channel, Stage, string, string, number, number, number, number];
  const rows: Row[] = [
    ["Sunrise summit reel — 15s vertical", ContentType.VIDEO, Channel.INSTAGRAM, Stage.DESIGN, C.c_trail, M.m_dan, 2, 82, 3, 2],
    ["Trail-tested: 3 packs for winter thru-hikes", ContentType.ARTICLE, Channel.BLOG, Stage.WRITING, C.c_launch, M.m_theo, 4, 74, 1, 0],
    ["Base layer buying guide", ContentType.EMAIL, Channel.EMAIL, Stage.REVIEW, C.c_brand, M.m_priya, 1, 88, 5, 1],
    ["Why we switched to recycled zippers", ContentType.POST, Channel.LINKEDIN, Stage.APPROVAL, C.c_thought, M.m_theo, 1, 91, 2, 0],
    ["UGC repost — @wildlines summit shot", ContentType.POST, Channel.INSTAGRAM, Stage.SCHEDULED, C.c_brand, M.m_priya, 1, 79, 0, 1],
    ["Spring collection teaser", ContentType.AD, Channel.INSTAGRAM, Stage.LEGAL, C.c_launch, M.m_maya, 3, 68, 4, 3],
    ["Founder Q&A: designing for the cold", ContentType.VIDEO, Channel.YOUTUBE, Stage.IDEAS, C.c_thought, M.m_dan, 9, 55, 0, 0],
    ["Weekend gear giveaway", ContentType.POST, Channel.X, Stage.WRITING, C.c_brand, M.m_priya, 2, 63, 1, 0],
    ["How to layer for -10C", ContentType.ARTICLE, Channel.BLOG, Stage.PUBLISHED, C.c_brand, M.m_theo, -3, 94, 8, 1],
    ["Pack-fit explainer carousel", ContentType.POST, Channel.INSTAGRAM, Stage.DESIGN, C.c_launch, M.m_maya, 3, 77, 2, 4],
    ["Ambassador spotlight: Noa", ContentType.POST, Channel.LINKEDIN, Stage.RESEARCH, C.c_thought, M.m_theo, 6, 60, 0, 0],
    ["Holiday gift guide (repurpose)", ContentType.ARTICLE, Channel.BLOG, Stage.REPURPOSE, C.c_trail, M.m_theo, -20, 85, 3, 1],
    ["New trail app — launch announcement", ContentType.POST, Channel.INSTAGRAM, Stage.APPROVAL, C.c_launch, M.m_priya, 2, 80, 1, 2],
    ["Restock: Aurora down jacket", ContentType.EMAIL, Channel.EMAIL, Stage.SCHEDULED, C.c_brand, M.m_priya, 3, 71, 0, 0],
    ["Behind the seams — factory tour", ContentType.VIDEO, Channel.YOUTUBE, Stage.REVIEW, C.c_thought, M.m_dan, 5, 66, 2, 1],
    ["First-frost photo dump", ContentType.POST, Channel.INSTAGRAM, Stage.SCHEDULED, C.c_trail, M.m_maya, 0, 73, 1, 6],
    ["Winter care tips thread", ContentType.POST, Channel.X, Stage.PUBLISHED, C.c_brand, M.m_priya, -6, 69, 4, 0],
    ["Aurora launch — teaser video", ContentType.VIDEO, Channel.INSTAGRAM, Stage.PUBLISHED, C.c_launch, M.m_dan, -1, 87, 6, 3],
  ];

  const perColumn: Record<string, number> = {};
  const createdItems: { id: string; channel: Channel; stage: Stage }[] = [];
  for (const [title, type, channel, stage, campaignId, ownerId, due, ai, comments, attachments] of rows) {
    perColumn[stage] = (perColumn[stage] ?? 0) + 1000;
    const scheduled = stage === Stage.SCHEDULED || stage === Stage.PUBLISHED;
    const created = await prisma.contentItem.create({
      data: {
        title, type, channel, stage,
        position: perColumn[stage],
        priority: ai > 85 ? Priority.HIGH : ai > 65 ? Priority.MEDIUM : Priority.LOW,
        aiScore: ai, comments, attachments,
        dueDate: day(due),
        publishAt: scheduled ? day(due) : null,
        workspaceId: ws.id,
        campaignId, ownerId,
      },
    });
    createdItems.push({ id: created.id, channel: created.channel, stage: created.stage });
  }

  // Generate 8 weeks of realistic daily metrics for every published item.
  await seedMetrics(ws.id, createdItems.filter((i) => i.stage === Stage.PUBLISHED));

  await prisma.brandKit.create({
    data: {
      workspaceId: ws.id,
      colors: [
        { name: "Aurora Blue", hex: "#2E63F6" },
        { name: "Ridge Ink", hex: "#171A21" },
        { name: "Dawn", hex: "#FFB27A" },
        { name: "Summit Teal", hex: "#0EA5A4" },
        { name: "Alpine Mist", hex: "#F3F5F8" },
        { name: "Trail Amber", hex: "#F79009" },
      ],
      fontDisplay: "SF Pro / Inter · 700",
      fontBody: "SF Pro Text / Inter · 400",
      voiceRules: [
        { title: "Warm, not corporate", detail: "Talk like a trail buddy, not a brochure." },
        { title: "Confident, never boastful", detail: "Show the proof; skip the superlatives." },
        { title: "Plain words", detail: "Say \u201Cstays dry\u201D, not \u201Cmoisture-wicking technology\u201D." },
      ],
      hashtags: ["#Northbound", "#TrailTested", "#OutInTheOpen", "#LayerUp", "#BuiltForCold", "#EveryTrail"],
      legalDisclaimer:
        "Field-test claims must reference the internal test ID. Sustainability claims require the current lifecycle citation. Ambassador posts must include #ad or #gifted.",
      voiceSummary:
        "Northbound sounds like advice from someone who has actually been up the mountain: warm, direct, and plainspoken. Confident without boasting, and never using absolute guarantees.",
    },
  });

  await prisma.automationRule.createMany({
    data: [
      { workspaceId: ws.id, name: "Auto-schedule on approval", enabled: false, trigger: "CARD_ENTERS_STAGE", triggerStage: Stage.APPROVAL, action: "MOVE_TO_STAGE", actionStage: Stage.SCHEDULED, order: 0 },
      { workspaceId: ws.id, name: "Publish when the schedule date arrives", enabled: false, trigger: "PUBLISH_DATE_ARRIVES", action: "MOVE_TO_STAGE", actionStage: Stage.PUBLISHED, order: 1 },
      { workspaceId: ws.id, name: "Create an analytics task on publish", enabled: false, trigger: "CARD_ENTERS_STAGE", triggerStage: Stage.PUBLISHED, action: "CREATE_TASK", order: 2 },
      { workspaceId: ws.id, name: "Flag brand-voice drift in Slack", enabled: false, trigger: "CARD_ENTERS_STAGE", triggerStage: Stage.REVIEW, action: "NOTIFY_SLACK", order: 3 },
      { workspaceId: ws.id, name: "Archive content when the campaign ends", enabled: false, trigger: "CAMPAIGN_ENDS", action: "ARCHIVE", order: 4 },
    ],
  });

  // ── Noir OS: projects + tasks + day-to-day plans ───────────────────────────
  await prisma.project.create({
    data: {
      workspaceId: ws.id, name: "Noir OS launch", color: "#2E63F6", status: "Active", dueDate: day(14),
      tasks: {
        create: [
          { workspaceId: ws.id, title: "Ship Phase 1", priority: "High", dueDate: day(3), position: 1000 },
          { workspaceId: ws.id, title: "Write the launch post", priority: "Medium", dueDate: day(7), position: 2000 },
          { workspaceId: ws.id, title: "Record a demo video", priority: "Low", dueDate: day(9), position: 3000 },
          { workspaceId: ws.id, title: "Set up Vercel + Supabase", priority: "High", done: true, position: 4000 },
        ],
      },
    },
  });
  await prisma.project.create({
    data: {
      workspaceId: ws.id, name: "Home renovation", color: "#F79009", status: "Active",
      tasks: {
        create: [
          { workspaceId: ws.id, title: "Call the contractor", priority: "High", dueDate: day(0), position: 1000 },
          { workspaceId: ws.id, title: "Pick paint colours", priority: "Medium", dueDate: day(2), position: 2000 },
          { workspaceId: ws.id, title: "Order light fixtures", priority: "Low", dueDate: day(5), position: 3000 },
        ],
      },
    },
  });
  await prisma.project.create({
    data: {
      workspaceId: ws.id, name: "Marathon training", color: "#0EA5A4", status: "Active",
      tasks: {
        create: [
          { workspaceId: ws.id, title: "Long run — 18 miles", priority: "Medium", dueDate: day(1), position: 1000 },
          { workspaceId: ws.id, title: "Buy new running shoes", priority: "Low", done: true, position: 2000 },
        ],
      },
    },
  });

  // Standalone tasks = day-to-day life & plans (no project).
  await prisma.task.createMany({
    data: [
      { workspaceId: ws.id, title: "Dentist appointment — 2:00 PM", priority: "Medium", dueDate: day(0), position: 1000 },
      { workspaceId: ws.id, title: "Reply to Maya about the trip", priority: "High", dueDate: day(0), position: 2000 },
      { workspaceId: ws.id, title: "Send invoice #0412", priority: "Medium", dueDate: day(1), position: 3000 },
      { workspaceId: ws.id, title: "Book flights for the SFO trip", priority: "Medium", dueDate: day(4), position: 4000 },
      { workspaceId: ws.id, title: "Water the plants", priority: "Low", done: true, dueDate: day(0), position: 5000 },
    ],
  });

  const metricCount = await prisma.dailyMetric.count();
  console.log(`Seeded workspace "${ws.name}" · ${members.length} members · ${campaigns.length} campaigns · ${rows.length} content items · ${metricCount} daily metrics.`);
  console.log("Sign up with any email at /login — you'll be provisioned into this workspace.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
