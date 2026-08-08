import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getDevProjects } from "@/lib/dev-studio";
import { getCompanies } from "@/lib/companies";
import { DevelopmentView } from "@/components/azmin/development-view";

export const dynamic = "force-dynamic";

export default async function DevelopmentStudioPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/azmin/development");

  const [devProjects, companies] = await Promise.all([
    getDevProjects(user.workspaceId),
    getCompanies(user.workspaceId),
  ]);

  return (
    <DevelopmentView
      initialProjects={devProjects.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        status: p.status,
        companyId: p.companyId,
        productionUrl: p.productionUrl,
        createdAt: p.createdAt.toISOString(),
        repositories: p.repositories,
      }))}
      companies={companies.map((c) => ({ id: c.id, name: c.name }))}
      canManage={user.role !== "VIEWER"}
      userName={user.name}
      userEmail={user.email}
      userRole={user.role}
    />
  );
}
