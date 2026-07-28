import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/session";
import { getCompany } from "@/lib/companies";
import { ACTIVE_COMPANY_COOKIE } from "@/lib/company-context";
import { CompanyWorkspace } from "@/components/azmin/company-workspace";

export const dynamic = "force-dynamic";

export default async function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/azmin/companies");
  const { id } = await params;
  const company = await getCompany(user.workspaceId, id);
  if (!company) notFound();
  const store = await cookies();
  const isActive = store.get(ACTIVE_COMPANY_COOKIE)?.value === company.id ||
    (!store.get(ACTIVE_COMPANY_COOKIE)?.value && company.isHeadquarters);
  return <CompanyWorkspace company={company} canManage={user.role === "OWNER" || user.role === "ADMIN"} isActive={isActive} />;
}
