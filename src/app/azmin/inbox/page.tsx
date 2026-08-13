import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/session";
import { getConversation, getConversations, markRead } from "@/lib/inbox";
import { getCompanies } from "@/lib/companies";
import { ACTIVE_COMPANY_COOKIE, resolveActiveCompany } from "@/lib/company-context";
import { InboxView } from "@/components/azmin/inbox-view";

export const dynamic = "force-dynamic";

export default async function InboxPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/azmin/inbox");
  const { c } = await searchParams;

  const companies = await getCompanies(user.workspaceId);
  const store = await cookies();
  const active = resolveActiveCompany(companies, store.get(ACTIVE_COMPANY_COOKIE)?.value);
  const scope = active ? { companyId: active.id, isHeadquarters: active.isHeadquarters } : undefined;

  const conversations = await getConversations(user.workspaceId, "ALL", scope);
  let selected = null;
  if (c) {
    selected = await getConversation(user.workspaceId, c);
    if (selected) await markRead(user.workspaceId, c);
  }

  const base = (process.env.NEXTAUTH_URL || "").replace(/\/$/, "");
  return (
    <InboxView
      conversations={conversations.map((v) => ({
        id: v.id, channel: v.channel, contactName: v.contactName, contactHandle: v.contactHandle,
        status: v.status, unread: v.unread, lastMessagePreview: v.lastMessagePreview,
        lastMessageAt: v.lastMessageAt.toISOString(),
      }))}
      selected={selected ? {
        id: selected.id, channel: selected.channel, contactName: selected.contactName, contactHandle: selected.contactHandle, status: selected.status,
        messages: selected.messages.map((m) => ({ id: m.id, direction: m.direction, body: m.body, status: m.status, createdAt: m.createdAt.toISOString() })),
      } : null}
      webhookUrl={base ? `${base}/api/webhooks/meta` : "/api/webhooks/meta"}
      canManage={user.role === "OWNER" || user.role === "ADMIN" || user.role === "EDITOR"}
      userName={user.name}
      userEmail={user.email}
      userRole={user.role}
    />
  );
}
