import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getSmmDeliveryWorkspace } from "@/lib/smm-agent";
import { getPosts } from "@/lib/posts";
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
  return <SmmAccountWorkspace account={account} posts={posts} canManage={["OWNER", "ADMIN", "EDITOR"].includes(user.role)} canApprove={["OWNER", "ADMIN"].includes(user.role)} userName={user.name} userEmail={user.email} userRole={user.role} />;
}
