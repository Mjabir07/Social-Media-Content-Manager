import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getSmmCommandCenter } from "@/lib/smm";
import { SmmCommandCenter } from "@/components/azmin/smm-command-center";

export const dynamic = "force-dynamic";

export default async function SmmPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/azmin/smm");
  const data = await getSmmCommandCenter(user.workspaceId);
  return <SmmCommandCenter {...data} canManage={["OWNER", "ADMIN", "EDITOR"].includes(user.role)} userName={user.name} userEmail={user.email} userRole={user.role} />;
}
