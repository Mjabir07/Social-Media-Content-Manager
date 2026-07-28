import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getCompanies } from "@/lib/companies";
import { CompaniesView } from "@/components/azmin/companies-view";

export const dynamic = "force-dynamic";

export default async function CompaniesPage({ searchParams }: { searchParams: Promise<{ create?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/azmin/companies");
  const companies = await getCompanies(user.workspaceId);
  const params = await searchParams;
  return <CompaniesView companies={companies} canManage={user.role === "OWNER" || user.role === "ADMIN"} userName={user.name} userEmail={user.email} userRole={user.role} startOpen={params.create === "1"} />;
}
