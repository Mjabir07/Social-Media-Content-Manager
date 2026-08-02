import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getDomainRecords } from "@/lib/infrastructure";
import { DomainsView } from "@/components/azmin/domains-view";

export const dynamic = "force-dynamic";

export default async function DomainsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/azmin/infrastructure/domains");

  const records = await getDomainRecords(user.workspaceId);

  return (
    <DomainsView
      records={records}
      userName={user.name}
      userEmail={user.email}
      userRole={user.role}
    />
  );
}
