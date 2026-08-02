import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { InfrastructureView } from "@/components/azmin/infrastructure-view";

export const dynamic = "force-dynamic";

export default async function InfrastructurePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/azmin/infrastructure");

  return (
    <InfrastructureView
      userName={user.name}
      userEmail={user.email}
      userRole={user.role}
    />
  );
}
