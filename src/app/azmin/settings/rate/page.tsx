import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getRateSettings } from "@/lib/workspace-settings";
import { RateSettingsView } from "@/components/azmin/rate-settings-view";

export const dynamic = "force-dynamic";

export default async function RateSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/azmin/settings/rate");

  const settings = await getRateSettings(user.workspaceId);

  return (
    <RateSettingsView
      settings={settings}
      canManage={user.role === "OWNER" || user.role === "ADMIN"}
      userName={user.name}
      userEmail={user.email}
      userRole={user.role}
    />
  );
}
