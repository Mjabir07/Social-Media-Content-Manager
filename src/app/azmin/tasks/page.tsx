import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getTasks } from "@/lib/tasks";
import { TasksView } from "@/components/azmin/tasks-view";
import type { TaskPriority, TaskStatus } from "@/lib/tasks-catalog";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/azmin/tasks");

  const tasks = await getTasks(user.workspaceId);

  return (
    <TasksView
      initialTasks={tasks.map((t) => ({
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
