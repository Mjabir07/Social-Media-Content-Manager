import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { ApiVault } from "@/components/azmin/api-vault";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/azmin/settings/integrations");
  if (user.role !== "OWNER") redirect("/azmin");
  return (
    <ApiVault
      user={{ name: user.name, email: user.email }}
      workspaceName={user.workspaceName}
    />
  );
}
