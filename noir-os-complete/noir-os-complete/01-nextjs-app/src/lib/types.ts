import type { Stage, Channel, ContentType, Priority } from "@prisma/client";

// Plain, serialisable shape passed from server components to client components.
// Prisma returns Date objects; we convert to ISO strings at the boundary.
export type CardDTO = {
  id: string;
  title: string;
  type: ContentType;
  channel: Channel;
  stage: Stage;
  position: number;
  priority: Priority;
  aiScore: number;
  comments: number;
  attachments: number;
  dueDate: string | null;
  publishAt: string | null;
  campaign: { id: string; name: string; color: string };
  owner: { id: string; name: string; initials: string; color: string };
};
