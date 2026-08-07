import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getClients } from "@/lib/clients";
import { ClientsView } from "@/components/azmin/clients-view";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/azmin/clients");

  const clients = await getClients(user.workspaceId);

  return (
    <ClientsView
      initialClients={clients}
      canManage={user.role !== "VIEWER"}
      userName={user.name}
      userEmail={user.email}
      userRole={user.role}
    />
  );
}
