import { Stage, Channel, ContentType, Priority } from "@prisma/client";

export type StageMeta = { key: Stage; label: string; color: string; wip?: number };

// The content lifecycle, in order — the board renders columns in this sequence.
export const STAGES: StageMeta[] = [
  { key: Stage.IDEAS, label: "Ideas", color: "#8B93A7" },
  { key: Stage.RESEARCH, label: "Research", color: "#6E8BEF" },
  { key: Stage.WRITING, label: "Writing", color: "#2E63F6", wip: 4 },
  { key: Stage.DESIGN, label: "Design", color: "#8B5CF6", wip: 3 },
  { key: Stage.REVIEW, label: "Review", color: "#F79009" },
  { key: Stage.LEGAL, label: "Legal", color: "#B4530A" },
  { key: Stage.APPROVAL, label: "Approval", color: "#EC4899" },
  { key: Stage.SCHEDULED, label: "Scheduled", color: "#0EA5A4" },
  { key: Stage.PUBLISHED, label: "Published", color: "#12B76A" },
  { key: Stage.REPURPOSE, label: "Repurpose", color: "#0891B2" },
  { key: Stage.ARCHIVED, label: "Archived", color: "#98A2B3" },
];

export const stageMeta = (s: Stage) => STAGES.find((x) => x.key === s)!;

export const CHANNEL_COLOR: Record<Channel, string> = {
  INSTAGRAM: "#E1306C",
  LINKEDIN: "#0A66C2",
  X: "#111111",
  TIKTOK: "#111111",
  BLOG: "#2E63F6",
  EMAIL: "#F79009",
  YOUTUBE: "#FF0000",
};

export const CHANNEL_LABEL: Record<Channel, string> = {
  INSTAGRAM: "Instagram",
  LINKEDIN: "LinkedIn",
  X: "X",
  TIKTOK: "TikTok",
  BLOG: "Blog",
  EMAIL: "Email",
  YOUTUBE: "YouTube",
};

export const TYPE_LABEL: Record<ContentType, string> = {
  POST: "Post",
  ARTICLE: "Article",
  VIDEO: "Video",
  EMAIL: "Email",
  AD: "Ad",
  STORY: "Story",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

// Stages that show a visual thumbnail on their cards.
export const VISUAL_STAGES: Stage[] = [
  Stage.DESIGN,
  Stage.SCHEDULED,
  Stage.PUBLISHED,
  Stage.REPURPOSE,
];

// Stage groupings shared across views. Typed as Stage[] so `Array.includes(stage)`
// accepts any Stage — an inline `[Stage.X, ...]` literal infers a narrower union and
// TypeScript rejects passing the full Stage type to its `.includes`.
export const APPROVAL_STAGES: Stage[] = [Stage.REVIEW, Stage.LEGAL, Stage.APPROVAL];
export const TERMINAL_STAGES: Stage[] = [Stage.PUBLISHED, Stage.ARCHIVED];
export const OFF_BOARD_STAGES: Stage[] = [Stage.SCHEDULED, Stage.PUBLISHED, Stage.ARCHIVED];
