import type { Prisma } from "@prisma/client";
import type { CardDTO } from "@/lib/types";

// The relations every card view needs. Use with `include: cardInclude`.
export const cardInclude = {
  campaign: { select: { id: true, name: true, color: true } },
  owner: { select: { id: true, name: true, initials: true, color: true } },
  _count: { select: { comments: true } },
} satisfies Prisma.ContentItemInclude;

type CardRow = Prisma.ContentItemGetPayload<{ include: typeof cardInclude }>;

export function toCardDTO(i: CardRow): CardDTO {
  return {
    id: i.id,
    title: i.title,
    type: i.type,
    channel: i.channel,
    stage: i.stage,
    position: i.position,
    priority: i.priority,
    commentCount: i._count.comments,
    dueDate: i.dueDate ? i.dueDate.toISOString() : null,
    publishAt: i.publishAt ? i.publishAt.toISOString() : null,
    campaign: i.campaign,
    owner: i.owner,
  };
}
