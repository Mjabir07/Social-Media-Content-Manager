import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getSmmDeliveryWorkspace } from "@/lib/smm-agent";
import { getPosts } from "@/lib/posts";
import { getConversations } from "@/lib/inbox";
import { SmmAccountWorkspace } from "@/components/azmin/smm-account-workspace";

export const dynamic = "force-dynamic";

export default async function SmmAccountPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  const { id } = await params;
  if (!user) redirect(`/login?callbackUrl=/azmin/smm/${id}`);
  const account = await getSmmDeliveryWorkspace(user.workspaceId, id);
  if (!account) notFound();
  const rawPosts = await getPosts(user.workspaceId, account.company.id);
  const posts = rawPosts.map((post) => ({
    id: post.id, content: post.content, status: post.status,
    scheduledAt: post.scheduledAt ? post.scheduledAt.toISOString() : null,
    targetCount: post.targets.length,
  }));
  const rawConvos = await getConversations(user.workspaceId, "ALL", { companyId: account.company.id, isHeadquarters: false });
  const conversations = rawConvos.map((c) => ({
    id: c.id, channel: c.channel, contactName: c.contactName, contactHandle: c.contactHandle,
    status: c.status, unread: c.unread, lastMessagePreview: c.lastMessagePreview,
    lastMessageAt: c.lastMessageAt ? c.lastMessageAt.toISOString() : null,
  }));
  return <SmmAccountWorkspace account={account} posts={posts} conversations={conversations} canManage={["OWNER", "ADMIN", "EDITOR"].includes(user.role)} canApprove={["OWNER", "ADMIN"].includes(user.role)} userName={user.name} userEmail={user.email} userRole={user.role} />;
}
