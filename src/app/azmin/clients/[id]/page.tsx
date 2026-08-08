import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getClient } from "@/lib/clients";
import { getVaultCredentials, isCredentialVaultReady } from "@/lib/client-vault";
import { getServiceRenewals } from "@/lib/renewals";
import { getTransactions } from "@/lib/finance";
import { getWorks } from "@/lib/works";
import { ClientDetailView } from "@/components/azmin/client-detail-view";
import type { TxStatus, TxType } from "@/lib/finance-core";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/azmin/clients");
  const { id } = await params;

  const client = await getClient(user.workspaceId, id);
  if (!client) notFound();

  const [credentials, renewals, transactions, works] = await Promise.all([
    getVaultCredentials(user.workspaceId, id),
    getServiceRenewals(user.workspaceId, id),
    getTransactions(user.workspaceId, { clientId: id }),
    getWorks(user.workspaceId, id),
  ]);

  return (
    <ClientDetailView
      client={{
        id: client.id,
        name: client.name,
        type: client.type,
        domain: client.domain,
        contactName: client.contactName,
        email: client.email,
        phone: client.phone,
        status: client.status,
        notes: client.notes,
        credentialCount: client.credentialCount,
        renewalCount: client.renewalCount,
        workCount: client.workCount,
      }}
      works={works.map((w) => ({
        id: w.id, clientId: w.clientId, title: w.title, serviceType: w.serviceType, endCustomer: w.endCustomer,
        amountCents: w.amountCents, currency: w.currency, status: w.status,
        startDate: w.startDate ? w.startDate.toISOString() : null,
        notes: w.notes, createdAt: w.createdAt.toISOString(),
      }))}
      credentials={credentials}
      renewals={renewals.map((r) => ({
        id: r.id, service: r.service, clientName: r.clientName, clientEmail: r.clientEmail,
        amountCents: r.amountCents, costCents: r.costCents, vendor: r.vendor, currency: r.currency,
        renewalDate: r.renewalDate.toISOString(), status: r.status,
        invoiceStatus: r.invoiceStatus,
        invoicedAt: r.invoicedAt ? r.invoicedAt.toISOString() : null,
        paidAt: r.paidAt ? r.paidAt.toISOString() : null,
        notes: r.notes, daysLeft: r.daysLeft, stage: r.stage,
      }))}
      transactions={transactions.map((t) => ({
        id: t.id, type: t.type as TxType, amountCents: t.amountCents, currency: t.currency,
        category: t.category, clientId: t.clientId, vendor: t.vendor, description: t.description,
        date: t.date.toISOString(), status: t.status as TxStatus, method: t.method,
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
