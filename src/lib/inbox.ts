import { prisma } from "@/lib/db";
import { sendViaChannel, type ConnectionRow } from "@/lib/channel-adapters";
import type { Action, Channel } from "@/lib/automations-catalog";
import type { InboundMessage } from "@/lib/meta-webhook";
import { suggestReply } from "@/lib/ai/inbox-reply";
import { shouldAutoReply } from "@/lib/inbox-guardrails";

/**
 * Unified inbox data + reply. Conversations and messages are workspace-scoped.
 * Inbound messages arrive from the Meta webhook; replies go out through the same
 * channel adapter used everywhere else (safely simulated until live keys exist).
 */

export const INBOX_CHANNELS = ["WHATSAPP", "MESSENGER", "INSTAGRAM"] as const;

// Pick which workspace an incoming message belongs to. v1 is single-tenant:
// prefer a workspace that has a CONNECTED connection for this channel, else the
// first workspace. TODO(multi-tenant): match by the receiving page/phone id.
export async function resolveInboxWorkspace(channel: string): Promise<string | null> {
  const matchChannel = channel === "MESSENGER" || channel === "INSTAGRAM" ? "META_PAGE" : channel;
  const conn = await prisma.channelConnection.findFirst({ where: { channel: matchChannel, status: "CONNECTED" }, select: { workspaceId: true } });
  if (conn) return conn.workspaceId;
  const ws = await prisma.workspace.findFirst({ select: { id: true }, orderBy: { createdAt: "asc" } });
  return ws?.id ?? null;
}

// Upsert the conversation and append the inbound message. Returns the conversation id.
export async function recordInbound(workspaceId: string, event: InboundMessage) {
  const preview = event.text.slice(0, 140);
  const conversation = await prisma.conversation.upsert({
    where: { workspaceId_channel_externalId: { workspaceId, channel: event.channel, externalId: event.externalId } },
    create: {
      workspaceId,
      channel: event.channel,
      externalId: event.externalId,
      contactName: event.contactName ?? null,
      contactHandle: event.contactHandle ?? event.externalId,
      status: "OPEN",
      unread: 1,
      lastMessageAt: new Date(),
      lastMessagePreview: preview,
    },
    update: {
      status: "OPEN",
      unread: { increment: 1 },
      lastMessageAt: new Date(),
      lastMessagePreview: preview,
      ...(event.contactName ? { contactName: event.contactName } : {}),
    },
    select: { id: true },
  });
  await prisma.message.create({
    data: { conversationId: conversation.id, workspaceId, direction: "IN", body: event.text, externalId: event.messageId ?? null },
  });
  // If the AI auto-reply automation is on, answer immediately (safe: replying
  // inside the 24h window is a free text message).
  try {
    await autoReplyForMessage(workspaceId, conversation.id);
  } catch (error) {
    console.error("auto-reply failed", error);
  }
  return conversation.id;
}

// When an "A customer messages me → Reply automatically with AI" automation is
// enabled, draft a reply from the company brain and send it in the conversation.
async function autoReplyForMessage(workspaceId: string, conversationId: string) {
  const auto = await prisma.automation.findFirst({
    where: { workspaceId, trigger: "MESSAGE_RECEIVED", action: "AI_REPLY", enabled: true },
    select: { id: true },
  });
  if (!auto) return;

  const convo = await prisma.conversation.findFirst({
    where: { id: conversationId, workspaceId },
    include: { messages: { orderBy: { createdAt: "asc" }, take: 200 } },
  });
  if (!convo) return;

  // Safety: hand sensitive or runaway threads to a human instead of auto-replying.
  if (!shouldAutoReply(convo.messages.map((m) => ({ direction: m.direction, body: m.body }))).reply) return;

  let companyName: string | null = null;
  let salesGuidance: string | null = null;
  let contentGuidance: string | null = null;
  let aiInstructions: string | null = null;
  if (convo.companyId) {
    const company = await prisma.company.findFirst({
      where: { id: convo.companyId, workspaceId },
      select: { name: true, brain: { select: { salesGuidance: true, contentGuidance: true, aiInstructions: true } } },
    });
    companyName = company?.name ?? null;
    salesGuidance = company?.brain?.salesGuidance ?? null;
    contentGuidance = company?.brain?.contentGuidance ?? null;
    aiInstructions = company?.brain?.aiInstructions ?? null;
  }

  const result = await suggestReply({
    messages: convo.messages.map((m) => ({ direction: m.direction, body: m.body })),
    contactName: convo.contactName,
    companyName,
    salesGuidance,
    contentGuidance,
    aiInstructions,
  });
  await sendReply(workspaceId, conversationId, result.text);
}

export async function getConversations(workspaceId: string, status = "OPEN") {
  return prisma.conversation.findMany({
    where: { workspaceId, ...(status === "ALL" ? {} : { status }) },
    orderBy: { lastMessageAt: "desc" },
    take: 100,
  });
}

export async function getConversation(workspaceId: string, id: string) {
  return prisma.conversation.findFirst({
    where: { id, workspaceId },
    include: { messages: { orderBy: { createdAt: "asc" }, take: 200 } },
  });
}

export async function markRead(workspaceId: string, id: string) {
  await prisma.conversation.updateMany({ where: { id, workspaceId }, data: { unread: 0 } });
}

export async function setConversationStatus(workspaceId: string, id: string, status: string) {
  const r = await prisma.conversation.updateMany({ where: { id, workspaceId }, data: { status } });
  return r.count;
}

const REPLY_ACTION: Record<string, Action> = { WHATSAPP: "SEND_WHATSAPP", MESSENGER: "POST_META", INSTAGRAM: "POST_META" };

// Send a reply in a conversation through the matching connected channel, and
// store the outbound message with its send status.
export async function sendReply(workspaceId: string, conversationId: string, text: string) {
  const convo = await prisma.conversation.findFirst({ where: { id: conversationId, workspaceId } });
  if (!convo) return null;

  const matchChannel = convo.channel === "MESSENGER" || convo.channel === "INSTAGRAM" ? "META_PAGE" : convo.channel;
  const connection = (await prisma.channelConnection.findFirst({ where: { workspaceId, channel: matchChannel, status: "CONNECTED" } })) as ConnectionRow;

  const result = await sendViaChannel({
    action: REPLY_ACTION[convo.channel] ?? "SEND_WHATSAPP",
    channel: convo.channel as Channel,
    connection,
    message: text,
    recipient: convo.contactHandle ?? convo.externalId,
  });
  const status = result.status === "SUCCESS" || result.status === "SIMULATED" ? "SENT" : "FAILED";

  await prisma.message.create({ data: { conversationId, workspaceId, direction: "OUT", body: text, status, externalId: result.externalId ?? null } });
  await prisma.conversation.updateMany({ where: { id: conversationId, workspaceId }, data: { lastMessageAt: new Date(), lastMessagePreview: text.slice(0, 140), unread: 0 } });
  return { status, detail: result.detail };
}
