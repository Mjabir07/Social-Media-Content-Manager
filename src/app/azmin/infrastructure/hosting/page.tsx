import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getHostingRecords } from "@/lib/infrastructure";
import { getCoolifyConnections } from "@/lib/coolify-connections";
import { HostingView } from "@/components/azmin/hosting-view";

export const dynamic = "force-dynamic";

export default async function HostingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/azmin/infrastructure/hosting");

  const [records, coolifyConnections] = await Promise.all([
    getHostingRecords(user.workspaceId),
    getCoolifyConnections(user.workspaceId),
  ]);

  return (
    <HostingView
      records={records}
      coolifyConnections={coolifyConnections.map((c) => ({
        ...c,
        lastCheckedAt: c.lastCheckedAt ? c.lastCheckedAt.toISOString() : null,
      }))}
      canManage={user.role === "OWNER" || user.role === "ADMIN"}
      userName={user.name}
      userEmail={user.email}
      userRole={user.role}
    />
  );
}
