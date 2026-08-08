import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getTransactions } from "@/lib/finance";
import { getClients } from "@/lib/clients";
import { FinanceView } from "@/components/azmin/finance-view";
import type { TxType, TxStatus } from "@/lib/finance-core";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/azmin/finance");

  const [transactions, clients] = await Promise.all([
    getTransactions(user.workspaceId),
    getClients(user.workspaceId),
  ]);

  return (
    <FinanceView
      initialTransactions={transactions.map((t) => ({
        id: t.id,
        type: t.type as TxType,
        amountCents: t.amountCents,
        currency: t.currency,
        category: t.category,
        clientId: t.clientId,
        vendor: t.vendor,
        description: t.description,
        date: t.date.toISOString(),
        status: t.status as TxStatus,
        method: t.method,
      }))}
      clients={clients.map((c) => ({ id: c.id, name: c.name }))}
      canManage={user.role !== "VIEWER"}
      userName={user.name}
      userEmail={user.email}
      userRole={user.role}
    />
  );
}
