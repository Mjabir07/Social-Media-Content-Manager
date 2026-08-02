import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getHostingRecords } from "@/lib/infrastructure";
import { HostingView } from "@/components/azmin/hosting-view";

export const dynamic = "force-dynamic";

export default async function HostingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/azmin/infrastructure/hosting");

  const records = await getHostingRecords(user.workspaceId);

  return (
    <HostingView
      records={records}
      userName={user.name}
      userEmail={user.email}
      userRole={user.role}
    />
  );
}
