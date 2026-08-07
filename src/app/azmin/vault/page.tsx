import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getVaultCredentials, isCredentialVaultReady } from "@/lib/client-vault";
import { VaultView } from "@/components/azmin/vault-view";

export const dynamic = "force-dynamic";

export default async function VaultPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/azmin/vault");

  const credentials = await getVaultCredentials(user.workspaceId);

  return (
    <VaultView
      initialCredentials={credentials}
      vaultReady={isCredentialVaultReady()}
      canManage={user.role !== "VIEWER"}
      canReveal={user.role === "OWNER" || user.role === "ADMIN"}
      userName={user.name}
      userEmail={user.email}
      userRole={user.role}
    />
  );
}
