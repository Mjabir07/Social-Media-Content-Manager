import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getServiceRenewals } from "@/lib/renewals";
import { RenewalsView } from "@/components/azmin/renewals-view";

export const dynamic = "force-dynamic";

export default async function RenewalsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/azmin/renewals");

  const renewals = await getServiceRenewals(user.workspaceId);

  return (
    <RenewalsView
      initialRenewals={renewals.map((r) => ({
        id: r.id,
        service: r.service,
        clientName: r.clientName,
        clientEmail: r.clientEmail,
        amountCents: r.amountCents,
        costCents: r.costCents,
        vendor: r.vendor,
        currency: r.currency,
        renewalDate: r.renewalDate.toISOString(),
        status: r.status,
        notes: r.notes,
        daysLeft: r.daysLeft,
        stage: r.stage,
      }))}
      canManage={user.role !== "VIEWER"}
      userName={user.name}
      userEmail={user.email}
      userRole={user.role}
    />
  );
}
