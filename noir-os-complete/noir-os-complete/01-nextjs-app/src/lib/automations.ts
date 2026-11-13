import { Stage, type AutomationRule } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

type Item = { id: string; title: string; stage: Stage; workspaceId: string };

async function topPosition(workspaceId: string, stage: Stage) {
  const top = await prisma.contentItem.findFirst({
    where: { workspaceId, stage },
    orderBy: { position: "asc" },
    select: { position: true },
  });
  return (top?.position ?? 1000) - 1000;
}

function escapeHtml(s: string) {
  const map: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
  return s.replace(/[&<>"]/g, (c) => map[c]);
}

/**
 * Applies one rule's action to one content item and returns the item's stage afterwards.
 *  - MOVE_TO_STAGE / ARCHIVE  move the card (to the top of the target column)
 *  - CREATE_TASK              adds a real day-to-day Task due today
 *  - NOTIFY_EMAIL             emails every workspace member who has an address
 */
async function applyAction(rule: AutomationRule, item: Item): Promise<Stage> {
  const target = rule.action === "ARCHIVE" ? Stage.ARCHIVED : rule.action === "MOVE_TO_STAGE" ? rule.actionStage : null;

  if (target && target !== item.stage) {
    await prisma.contentItem.update({
      where: { id: item.id },
      data: { stage: target, position: await topPosition(item.workspaceId, target) },
    });
    return target;
  }

  if (rule.action === "CREATE_TASK") {
    const last = await prisma.task.findFirst({
      where: { workspaceId: item.workspaceId, projectId: null },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    const due = new Date();
    due.setHours(9, 0, 0, 0);
    await prisma.task.create({
      data: {
        workspaceId: item.workspaceId,
        title: `Follow up: ${item.title}`.slice(0, 240),
        priority: "Medium",
        dueDate: due,
        position: (last?.position ?? 0) + 1000,
      },
    });
  }

  if (rule.action === "NOTIFY_EMAIL") {
    const members = await prisma.member.findMany({
      where: { workspaceId: item.workspaceId, email: { not: null } },
      select: { email: true },
    });
    const html =
      `<p style="font-family:sans-serif;font-size:14px">Automation <b>${escapeHtml(rule.name)}</b> fired for ` +
      `<b>${escapeHtml(item.title)}</b> (now in ${item.stage.toLowerCase()}).</p>`;
    // Best effort: sendEmail never throws, and a mail failure must not block the move.
    await Promise.all(members.map((m) => sendEmail(m.email!, `Noir OS: ${item.title}`, html)));
  }

  return item.stage;
}

/**
 * Runs enabled CARD_ENTERS_STAGE rules for a card that just entered `enteredStage`.
 * Rules run in order; the first one that moves the card ends the run (single hop, so
 * rules can never chain into a loop). Returns the card's final stage.
 */
export async function runStageAutomations(workspaceId: string, itemId: string, enteredStage: Stage): Promise<Stage> {
  const rules = await prisma.automationRule.findMany({
    where: { workspaceId, enabled: true, trigger: "CARD_ENTERS_STAGE", triggerStage: enteredStage },
    orderBy: { order: "asc" },
  });
  if (rules.length === 0) return enteredStage;

  const row = await prisma.contentItem.findUnique({ where: { id: itemId }, select: { id: true, title: true } });
  if (!row) return enteredStage;

  for (const rule of rules) {
    const next = await applyAction(rule, { id: row.id, title: row.title, stage: enteredStage, workspaceId });
    if (next !== enteredStage) return next;
  }
  return enteredStage;
}

/**
 * Time-based triggers, run by the scheduler (GET /api/cron/automations, every 15 min):
 *  - PUBLISH_DATE_ARRIVES  scheduled cards whose publish date has passed
 *  - CAMPAIGN_ENDS         every unarchived card of a campaign whose end date has passed
 * Both are idempotent: a published card is no longer "scheduled", and a campaign is
 * stamped `endHandledAt` once its rules have run.
 */
export async function runScheduledAutomations(now = new Date()) {
  const rules = await prisma.automationRule.findMany({
    where: { enabled: true, trigger: { in: ["PUBLISH_DATE_ARRIVES", "CAMPAIGN_ENDS"] } },
    orderBy: { order: "asc" },
  });
  let moved = 0;
  let campaignsEnded = 0;

  for (const rule of rules.filter((r) => r.trigger === "PUBLISH_DATE_ARRIVES")) {
    const due = await prisma.contentItem.findMany({
      where: { workspaceId: rule.workspaceId, stage: Stage.SCHEDULED, publishAt: { lte: now } },
      select: { id: true, title: true, stage: true, workspaceId: true },
    });
    for (const item of due) {
      if ((await applyAction(rule, item)) !== item.stage) moved++;
    }
  }

  const endRules = rules.filter((r) => r.trigger === "CAMPAIGN_ENDS");
  for (const workspaceId of [...new Set(endRules.map((r) => r.workspaceId))]) {
    const ended = await prisma.campaign.findMany({
      where: { workspaceId, endDate: { lte: now }, endHandledAt: null },
      select: { id: true },
    });
    for (const campaign of ended) {
      const items = await prisma.contentItem.findMany({
        where: { campaignId: campaign.id, stage: { not: Stage.ARCHIVED } },
        select: { id: true, title: true, stage: true, workspaceId: true },
      });
      for (const rule of endRules.filter((r) => r.workspaceId === workspaceId)) {
        for (const item of items) item.stage = await applyAction(rule, item);
      }
      await prisma.campaign.update({ where: { id: campaign.id }, data: { endHandledAt: now } });
      campaignsEnded++;
    }
  }

  return { rules: rules.length, moved, campaignsEnded };
}
