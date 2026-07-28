import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getCompanies } from "@/lib/companies";
import { getConnections } from "@/lib/connections";
import { getPosts } from "@/lib/posts";
import { PublishingView } from "@/components/azmin/publishing-view";
import type { Channel } from "@/lib/automations-catalog";
import type { PostStatus, TargetStatus } from "@/lib/posts-catalog";

export const dynamic = "force-dynamic";

export default async function PublishingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/azmin/publishing");

  const [posts, connections, companies] = await Promise.all([
    getPosts(user.workspaceId),
    getConnections(user.workspaceId),
    getCompanies(user.workspaceId),
  ]);

  return (
    <PublishingView
      posts={posts.map((p) => ({
        id: p.id, content: p.content, status: p.status as PostStatus,
        scheduledAt: p.scheduledAt ? p.scheduledAt.toISOString() : null, companyId: p.companyId,
        targets: p.targets.map((t) => ({ id: t.id, channel: t.channel, status: t.status as TargetStatus, detail: t.detail })),
      }))}
      connections={connections.filter((c) => c.status === "CONNECTED").map((c) => ({ id: c.id, channel: c.channel as Channel, displayName: c.displayName, status: c.status }))}
      companies={companies.map((c) => ({ id: c.id, name: c.name }))}
      canManage={user.role === "OWNER" || user.role === "ADMIN" || user.role === "EDITOR"}
      userName={user.name}
      userEmail={user.email}
      userRole={user.role}
    />
  );
}
