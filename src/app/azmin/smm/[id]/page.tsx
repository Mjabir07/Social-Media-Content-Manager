import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getSmmDeliveryWorkspace } from "@/lib/smm-agent";
import { SmmAccountWorkspace } from "@/components/azmin/smm-account-workspace";

export const dynamic = "force-dynamic";

export default async function SmmAccountPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  const { id } = await params;
  if (!user) redirect(`/login?callbackUrl=/azmin/smm/${id}`);
  const account = await getSmmDeliveryWorkspace(user.workspaceId, id);
  if (!account) notFound();
  return <SmmAccountWorkspace account={account} canManage={["OWNER", "ADMIN", "EDITOR"].includes(user.role)} canApprove={["OWNER", "ADMIN"].includes(user.role)} userName={user.name} userEmail={user.email} userRole={user.role} />;
}
