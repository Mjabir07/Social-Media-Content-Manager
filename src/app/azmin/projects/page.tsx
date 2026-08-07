import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getProjects } from "@/lib/projects";
import { getCompanies } from "@/lib/companies";
import { ProjectsView } from "@/components/azmin/projects-view";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/azmin/projects");

  const [projects, companies] = await Promise.all([
    getProjects(user.workspaceId),
    getCompanies(user.workspaceId),
  ]);

  return (
    <ProjectsView
      initialProjects={projects.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        status: p.status,
        companyId: p.companyId,
        deadline: p.deadline ? p.deadline.toISOString() : null,
        budgetCents: p.budgetCents,
        currency: p.currency,
        counts: p.counts,
        progress: p.progress,
      }))}
      companies={companies.map((c) => ({ id: c.id, name: c.name }))}
      canManage={user.role !== "VIEWER"}
      userName={user.name}
      userEmail={user.email}
      userRole={user.role}
    />
  );
}
