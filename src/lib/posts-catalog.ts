import type { Action, Channel } from "@/lib/automations-catalog";

/**
 * Pure publishing helpers (no database) — safe for client components. A post is
 * written once and fans out to one target per connected channel; the target
 * statuses roll up into the post's overall status.
 */

export const POST_STATUS = ["DRAFT", "SCHEDULED", "PUBLISHED", "PARTIAL", "FAILED"] as const;
export type PostStatus = (typeof POST_STATUS)[number];

export const TARGET_STATUS = ["PENDING", "PUBLISHED", "SIMULATED", "FAILED", "SKIPPED"] as const;
export type TargetStatus = (typeof TARGET_STATUS)[number];

export const postStatusMeta: Record<PostStatus, { label: string; color: string }> = {
  DRAFT: { label: "Draft", color: "#94A3B8" },
  SCHEDULED: { label: "Scheduled", color: "#F4B942" },
  PUBLISHED: { label: "Published", color: "#22C55E" },
  PARTIAL: { label: "Partly published", color: "#F97316" },
  FAILED: { label: "Failed", color: "#EF4444" },
};

// Which automation adapter action publishes to a given channel.
export function channelPostAction(channel: string): Action {
  switch (channel as Channel) {
    case "WHATSAPP": return "SEND_WHATSAPP";
    case "EMAIL": return "SEND_EMAIL";
    case "WEBHOOK": return "WEBHOOK";
    default: return "POST_META"; // META_PAGE, INSTAGRAM, TELEGRAM
  }
}

// A send counts as delivered whether live (PUBLISHED) or safely SIMULATED.
export function isDelivered(status: TargetStatus): boolean {
  return status === "PUBLISHED" || status === "SIMULATED";
}

// Roll target results up into the post's overall status.
export function rollupStatus(targetStatuses: TargetStatus[]): PostStatus {
  if (targetStatuses.length === 0) return "DRAFT";
  const delivered = targetStatuses.filter(isDelivered).length;
  if (delivered === targetStatuses.length) return "PUBLISHED";
  if (delivered > 0) return "PARTIAL";
  return "FAILED";
}
