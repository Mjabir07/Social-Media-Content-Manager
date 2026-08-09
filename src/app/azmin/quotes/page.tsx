import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getQuotes } from "@/lib/quotes";
import { getClients } from "@/lib/clients";
import { QuotesView } from "@/components/azmin/quotes-view";

export const dynamic = "force-dynamic";

export default async function QuotesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/azmin/quotes");

  const [quotes, clients] = await Promise.all([
    getQuotes(user.workspaceId),
    getClients(user.workspaceId),
  ]);

  return (
    <QuotesView
      initialQuotes={quotes}
      clients={clients.map((c) => ({ id: c.id, name: c.name }))}
      canManage={user.role !== "VIEWER"}
      userName={user.name}
      userEmail={user.email}
      userRole={user.role}
    />
  );
}
