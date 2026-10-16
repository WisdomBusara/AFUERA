import { Stage } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Runs enabled automation rules for a card that just entered `enteredStage`.
 * Only handles CARD_ENTERS_STAGE triggers — these fire on the events the app
 * already produces, so no scheduler is required. Applies a single MOVE hop
 * (no recursion → no loops) and returns the resulting stage so callers can
 * reconcile their UI. Time-based triggers (PUBLISH_DATE_ARRIVES, CAMPAIGN_ENDS)
 * need a background job runner and are intentionally not executed here.
 */
export async function runStageAutomations(
  workspaceId: string,
  itemId: string,
  enteredStage: Stage
): Promise<Stage> {
  const rules = await prisma.automationRule.findMany({
    where: { workspaceId, enabled: true, trigger: "CARD_ENTERS_STAGE", triggerStage: enteredStage },
    orderBy: { order: "asc" },
  });
  if (rules.length === 0) return enteredStage;

  let finalStage = enteredStage;

  for (const rule of rules) {
    if (rule.action === "MOVE_TO_STAGE" && rule.actionStage && rule.actionStage !== finalStage) {
      const top = await prisma.contentItem.findFirst({
        where: { workspaceId, stage: rule.actionStage },
        orderBy: { position: "asc" },
        select: { position: true },
      });
      const position = (top?.position ?? 1000) - 1000;
      await prisma.contentItem.update({ where: { id: itemId }, data: { stage: rule.actionStage, position } });
      finalStage = rule.actionStage;
      break; // single hop keeps this loop-free
    }
    if (rule.action === "CREATE_TASK") {
      // Lightweight, honest proxy for "task created" without a task system.
      await prisma.contentItem.update({ where: { id: itemId }, data: { comments: { increment: 1 } } });
    }
    // NOTIFY_SLACK and campaign-end ARCHIVE would call external services / a scheduler.
  }

  return finalStage;
}
