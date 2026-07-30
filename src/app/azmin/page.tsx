import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/session";
import { emptyDashboardData, getDashboardData } from "@/lib/data";
import { getCommandStats } from "@/lib/command-center";
import { getCompanies } from "@/lib/companies";
import { ACTIVE_COMPANY_COOKIE, resolveActiveCompany } from "@/lib/company-context";
import { AzminOwnerDashboard } from "@/components/azmin/owner-dashboard";

export const dynamic = "force-dynamic";

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function AzminPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/azmin");

  const params = await searchParams;
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 29 * 86_400_000);
  const from = params.from || ymd(thirtyDaysAgo);
  const to = params.to || ymd(today);
  const companies = await getCompanies(user.workspaceId);
  const store = await cookies();
  const activeCompany = resolveActiveCompany(
    companies,
    store.get(ACTIVE_COMPANY_COOKIE)?.value,
  );
  const data = activeCompany?.isHeadquarters
    ? await getDashboardData(user.workspaceId, { from, to })
    : emptyDashboardData();
  const command = await getCommandStats(user.workspaceId);

  return (
    <AzminOwnerDashboard
      user={{ name: user.name, email: user.email, role: user.role }}
      workspaceName={user.workspaceName}
      companies={companies}
      activeCompany={activeCompany}
      data={data}
      command={command}
      from={from}
      to={to}
    />
  );
}

