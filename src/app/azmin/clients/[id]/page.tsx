import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getClient } from "@/lib/clients";
import { getVaultCredentials, isCredentialVaultReady } from "@/lib/client-vault";
import { getServiceRenewals } from "@/lib/renewals";
import { ClientDetailView } from "@/components/azmin/client-detail-view";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/azmin/clients");
  const { id } = await params;

  const client = await getClient(user.workspaceId, id);
  if (!client) notFound();

  const [credentials, renewals] = await Promise.all([
    getVaultCredentials(user.workspaceId, id),
    getServiceRenewals(user.workspaceId, id),
  ]);

  return (
    <ClientDetailView
      client={{
        id: client.id,
        name: client.name,
        contactName: client.contactName,
        email: client.email,
        phone: client.phone,
        status: client.status,
        notes: client.notes,
        credentialCount: client.credentialCount,
        renewalCount: client.renewalCount,
      }}
      credentials={credentials}
      renewals={renewals.map((r) => ({
        id: r.id, service: r.service, clientName: r.clientName, clientEmail: r.clientEmail,
        amountCents: r.amountCents, currency: r.currency, renewalDate: r.renewalDate.toISOString(),
        status: r.status, notes: r.notes, daysLeft: r.daysLeft, stage: r.stage,
      }))}
      vaultReady={isCredentialVaultReady()}
      canManage={user.role !== "VIEWER"}
      canReveal={user.role === "OWNER" || user.role === "ADMIN"}
      userName={user.name}
      userEmail={user.email}
      userRole={user.role}
    />
  );
}
