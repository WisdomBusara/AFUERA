import { prisma } from "@/lib/prisma";

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// Assembles the Daily Brief from a workspace's tasks + projects.
export async function getBriefData(workspaceId: string) {
  const start = startOfToday();
  const endToday = new Date(start);
  endToday.setDate(endToday.getDate() + 1);
  const in7 = new Date(start);
  in7.setDate(in7.getDate() + 7);

  const [tasksToday, upcoming, projects] = await Promise.all([
    prisma.task.findMany({
      where: { workspaceId, done: false, dueDate: { lt: endToday } },
      orderBy: { dueDate: "asc" },
      include: { project: { select: { name: true, color: true } } },
    }),
    prisma.task.findMany({
      where: { workspaceId, done: false, dueDate: { gte: endToday, lt: in7 } },
      orderBy: { dueDate: "asc" },
      take: 8,
      include: { project: { select: { name: true, color: true } } },
    }),
    prisma.project.findMany({
      where: { workspaceId, status: { not: "Done" } },
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { tasks: true } }, tasks: { where: { done: true }, select: { id: true } } },
    }),
  ]);

  return { tasksToday, upcoming, projects, start };
}

export type BriefData = Awaited<ReturnType<typeof getBriefData>>;

const SPARKS = [
  ["You do not rise to the level of your goals. You fall to the level of your systems.", "James Clear"],
  ["What you do every day matters more than what you do once in a while.", "Gretchen Rubin"],
  ["The way to get started is to quit talking and begin doing.", "Walt Disney"],
  ["Well done is better than well said.", "Benjamin Franklin"],
  ["Simplicity is the ultimate sophistication.", "Leonardo da Vinci"],
];
export function sparkOfDay() {
  const idx = new Date().getDate() % SPARKS.length;
  return SPARKS[idx];
}

const fmtDue = (d: Date | null, today: Date) => {
  if (!d) return "";
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  const diff = Math.round((day.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return "overdue";
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  return new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};

// Plain, robust HTML for the check-in email.
export function renderBriefHtml(name: string, data: BriefData) {
  const { tasksToday, upcoming, projects, start } = data;
  const [quote, author] = sparkOfDay();
  const dateLine = start.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const row = (title: string, meta: string) =>
    `<tr><td style="padding:8px 0;border-bottom:1px solid #eef1f5;font-size:14px;color:#171a21">${title}</td>
     <td style="padding:8px 0;border-bottom:1px solid #eef1f5;font-size:12px;color:#878e9c;text-align:right;white-space:nowrap">${meta}</td></tr>`;

  const todayRows = tasksToday.length
    ? tasksToday.map((t) => row(t.title, `${t.project?.name ? t.project.name + " · " : ""}${fmtDue(t.dueDate, start)}`)).join("")
    : `<tr><td style="padding:8px 0;font-size:14px;color:#878e9c">Nothing due today — enjoy the clear runway.</td></tr>`;

  const upcomingRows = upcoming.length
    ? upcoming.map((t) => row(t.title, fmtDue(t.dueDate, start))).join("")
    : "";

  const projectRows = projects
    .map((p) => {
      const total = p._count.tasks;
      const done = p.tasks.length;
      const pct = total ? Math.round((done / total) * 100) : 0;
      return `<tr><td style="padding:8px 0;font-size:14px;color:#171a21">
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:8px"></span>${p.name}</td>
        <td style="padding:8px 0;font-size:12px;color:#878e9c;text-align:right">${done}/${total} · ${pct}%</td></tr>`;
    })
    .join("");

  return `<!doctype html><html><body style="margin:0;background:#f3f5f8;font-family:-apple-system,Segoe UI,Roboto,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <div style="background:#fff;border:1px solid #e7eaf0;border-radius:16px;overflow:hidden">
      <div style="height:4px;background:linear-gradient(90deg,#5b8cff,#ffb27a)"></div>
      <div style="padding:24px">
        <div style="font-size:11px;font-weight:700;letter-spacing:.08em;color:#878e9c;text-transform:uppercase">Your Noir OS brief</div>
        <div style="font-size:22px;font-weight:700;color:#171a21;margin:4px 0 2px">Good morning, ${name.split(" ")[0]}</div>
        <div style="font-size:13px;color:#878e9c">${dateLine}</div>

        <div style="font-size:12px;font-weight:700;letter-spacing:.05em;color:#878e9c;text-transform:uppercase;margin:22px 0 4px">Today · ${tasksToday.length}</div>
        <table style="width:100%;border-collapse:collapse">${todayRows}</table>

        ${upcomingRows ? `<div style="font-size:12px;font-weight:700;letter-spacing:.05em;color:#878e9c;text-transform:uppercase;margin:22px 0 4px">Coming up</div><table style="width:100%;border-collapse:collapse">${upcomingRows}</table>` : ""}

        ${projectRows ? `<div style="font-size:12px;font-weight:700;letter-spacing:.05em;color:#878e9c;text-transform:uppercase;margin:22px 0 4px">Projects</div><table style="width:100%;border-collapse:collapse">${projectRows}</table>` : ""}

        <div style="margin-top:22px;padding:14px 16px;background:#f6f8fa;border-radius:12px">
          <div style="font-size:11px;font-weight:700;letter-spacing:.05em;color:#878e9c;text-transform:uppercase">Daily spark</div>
          <div style="font-size:14px;font-style:italic;color:#171a21;margin-top:6px">“${quote}”</div>
          <div style="font-size:12px;color:#878e9c;margin-top:4px">— ${author}</div>
        </div>
      </div>
    </div>
    <div style="text-align:center;font-size:11px;color:#aeb4c0;margin-top:16px">Assembled by Noir OS</div>
  </div></body></html>`;
}
