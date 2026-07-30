/**
 * Pure safety rules for AI auto-reply. Keeps the agent from answering when a
 * human should step in (complaints, refunds, "talk to a human"…) and stops a
 * runaway back-and-forth. No database — easy to test and reuse.
 */

export const ESCALATION_KEYWORDS = [
  "refund", "complaint", "complain", "cancel", "human", "agent", "representative",
  "manager", "lawyer", "legal", "angry", "urgent", "not happy", "disappointed",
];

export const MAX_AUTO_REPLIES = 6;

export function shouldAutoReply(
  messages: { direction: string; body: string }[],
  opts?: { escalateKeywords?: string[]; maxOutbound?: number },
): { reply: boolean; reason?: string } {
  const lastIn = [...messages].reverse().find((m) => m.direction === "IN");
  if (!lastIn) return { reply: false, reason: "no inbound message" };

  const text = lastIn.body.toLowerCase();
  const keywords = opts?.escalateKeywords ?? ESCALATION_KEYWORDS;
  if (keywords.some((k) => text.includes(k))) return { reply: false, reason: "escalation keyword — left for a human" };

  const outbound = messages.filter((m) => m.direction === "OUT").length;
  if (outbound >= (opts?.maxOutbound ?? MAX_AUTO_REPLIES)) return { reply: false, reason: "auto-reply cap reached" };

  return { reply: true };
}
