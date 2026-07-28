import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getCompanies } from "@/lib/companies";
import { getConnections } from "@/lib/connections";
import { getAutomations } from "@/lib/automations";
import { AutomationsHub } from "@/components/azmin/automations-hub";
import type { Action, Channel, Trigger } from "@/lib/automations-catalog";

export const dynamic = "force-dynamic";

export default async function AutomationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/azmin/automations");

  const [connections, automations, companies] = await Promise.all([
    getConnections(user.workspaceId),
    getAutomations(user.workspaceId),
    getCompanies(user.workspaceId),
  ]);

  return (
    <AutomationsHub
      connections={connections.map((c) => ({ id: c.id, channel: c.channel as Channel, displayName: c.displayName, status: c.status, companyId: c.companyId }))}
      automations={automations.map((a) => ({
        id: a.id, name: a.name, trigger: a.trigger as Trigger, action: a.action as Action,
        connectionId: a.connectionId, template: a.template, enabled: a.enabled, companyId: a.companyId,
        connection: a.connection,
      }))}
      companies={companies.map((c) => ({ id: c.id, name: c.name }))}
      canManage={user.role === "OWNER" || user.role === "ADMIN"}
      userName={user.name}
      userEmail={user.email}
      userRole={user.role}
    />
  );
}
