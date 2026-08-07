import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getProject } from "@/lib/projects";
import { getTasks } from "@/lib/tasks";
import { getCompanies } from "@/lib/companies";
import { ProjectDetailView } from "@/components/azmin/project-detail-view";
import type { TaskPriority, TaskStatus } from "@/lib/tasks-catalog";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/azmin/projects");
  const { id } = await params;

  const project = await getProject(user.workspaceId, id);
  if (!project) notFound();

  const [tasks, companies] = await Promise.all([
    getTasks(user.workspaceId, { projectId: id }),
    getCompanies(user.workspaceId),
  ]);
  const clientName = companies.find((c) => c.id === project.companyId)?.name ?? null;

  return (
    <ProjectDetailView
      project={{
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        clientName,
        deadline: project.deadline ? project.deadline.toISOString() : null,
        budgetCents: project.budgetCents,
        currency: project.currency,
        counts: project.counts,
        progress: project.progress,
      }}
      tasks={tasks.map((t) => ({
        id: t.id,
        title: t.title,
        notes: t.notes,
        status: t.status as TaskStatus,
        priority: t.priority as TaskPriority,
        dueDate: t.dueDate ? t.dueDate.toISOString() : null,
        order: t.order,
        createdAt: t.createdAt.toISOString(),
      }))}
      canManage={user.role !== "VIEWER"}
      userName={user.name}
      userEmail={user.email}
      userRole={user.role}
    />
  );
}
