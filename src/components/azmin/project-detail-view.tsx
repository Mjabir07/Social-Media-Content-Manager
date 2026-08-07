"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FolderKanban, ArrowLeft, Trash2, Loader2, AlertTriangle, Clock } from "lucide-react";
import { AzminProfileMenu } from "@/components/azmin/profile-menu";
import { TasksView, type TaskDTO } from "@/components/azmin/tasks-view";
import {
  PROJECT_STATUSES,
  projectStatusMeta,
  deadlineHealth,
  formatBudget,
  type ProjectStatus,
  type TaskCounts,
} from "@/lib/projects-catalog";

export type ProjectDetailDTO = {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  clientName: string | null;
  deadline: string | null;
  budgetCents: number | null;
  currency: string;
  counts: TaskCounts;
  progress: number;
};

export function ProjectDetailView({
  project,
  tasks,
  canManage,
  userName,
  userEmail,
  userRole,
}: {
  project: ProjectDetailDTO;
  tasks: TaskDTO[];
  canManage: boolean;
  userName: string;
  userEmail: string;
  userRole: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [busy, setBusy] = useState(false);
  const health = deadlineHealth(project.deadline, status);
  const budget = formatBudget(project.budgetCents, project.currency);

  async function changeStatus(next: ProjectStatus) {
    setStatus(next);
    setBusy(true);
    await fetch(`/api/projects/${project.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) });
    setBusy(false);
    router.refresh();
  }

  async function remove() {
    if (!confirm(`Delete project "${project.name}"? Its tasks stay but get unlinked.`)) return;
    setBusy(true);
    await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    router.push("/azmin/projects");
  }

  return (
    <main data-azmin-ui className="min-h-screen bg-[#EAF1F9] text-[#03142E]">
      <header className="border-b border-[#C8D8EA] bg-white px-5 py-4 shadow-[0_1px_8px_rgba(3,20,46,.06)] sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <Link href="/azmin" className="flex items-center gap-3">
            <span className="relative h-10 w-10 shrink-0">
              <Image src="/brand/azmin-c1-mark.png" alt="AZMIN" fill priority sizes="40px" className="object-contain" />
            </span>
            <span>
              <strong className="block font-display text-[15px] font-bold">AZMIN Digital OS</strong>
              <span className="mt-0.5 block text-[11px] font-extrabold uppercase tracking-[.17em] text-[#456784]">Project</span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/azmin/projects" className="hidden rounded-xl border border-[#B8CCE0] bg-[#F8FBFF] px-4 py-2.5 text-xs font-bold text-[#234B70] hover:border-[#087CFA] sm:block">All projects</Link>
            <AzminProfileMenu name={userName} email={userEmail} role={userRole} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 pb-16 pt-6 sm:px-8 sm:pt-8">
        <Link href="/azmin/projects" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0758C9] hover:underline">
          <ArrowLeft size={14} /> Projects
        </Link>

        {/* Project summary */}
        <div className="mt-3 rounded-2xl border border-[#C5D6E6] bg-white p-6 shadow-[0_10px_28px_rgba(3,20,46,.05)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="flex items-center gap-3 font-display text-2xl font-bold tracking-[-.02em]">
                <FolderKanban className="text-[#087CFA]" size={24} /> {project.name}
              </h1>
              <p className="mt-1 text-sm font-semibold text-[#526F8A]">{project.clientName ?? "Internal"}</p>
              {project.description && <p className="mt-2 max-w-2xl text-sm text-[#4C6A86]">{project.description}</p>}
            </div>
            <div className="flex items-center gap-2">
              {canManage ? (
                <select value={status} onChange={(e) => changeStatus(e.target.value as ProjectStatus)} disabled={busy} className="rounded-xl border border-[#B8CCE0] bg-white px-3 py-2 text-sm font-bold text-[#234B70] outline-none focus:border-[#087CFA]">
                  {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{projectStatusMeta[s].label}</option>)}
                </select>
              ) : (
                <span className="rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wider" style={{ color: projectStatusMeta[status].color, background: projectStatusMeta[status].bg }}>{projectStatusMeta[status].label}</span>
              )}
              {canManage && (
                <button onClick={remove} disabled={busy} className="inline-flex items-center gap-1.5 rounded-xl border border-[#F0C9C4] bg-white px-3 py-2 text-sm font-bold text-[#C0362C] transition hover:bg-[#FDECEC] disabled:opacity-60">
                  {busy ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              )}
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between text-xs font-bold text-[#4C6A86]">
              <span>{project.progress}% complete</span>
              <span>{project.counts.done}/{project.counts.total} tasks done</span>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-[#E7EEF6]">
              <div className="h-full rounded-full bg-[#087CFA] transition-all" style={{ width: `${project.progress}%` }} />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-semibold">
            {project.deadline && (
              <span className={`flex items-center gap-1 ${health === "overdue" ? "text-[#B4231C]" : health === "due-soon" ? "text-[#9A6711]" : "text-[#72899E]"}`}>
                {health === "overdue" ? <AlertTriangle size={13} /> : <Clock size={13} />}
                Deadline {new Date(project.deadline).toLocaleDateString()}{health === "overdue" ? " · late" : health === "due-soon" ? " · soon" : ""}
              </span>
            )}
            {project.counts.overdue > 0 && <span className="flex items-center gap-1 text-[#B4231C]"><AlertTriangle size={13} /> {project.counts.overdue} overdue task{project.counts.overdue === 1 ? "" : "s"}</span>}
            {budget && <span className="text-[#72899E]">Budget {budget}</span>}
          </div>
        </div>

        {/* Task board scoped to this project */}
        <div className="mt-8">
          <h2 className="mb-4 font-display text-lg font-bold text-[#173A5C]">Project tasks</h2>
          <TasksView
            initialTasks={tasks}
            canManage={canManage}
            userName={userName}
            userEmail={userEmail}
            userRole={userRole}
            projectId={project.id}
            embedded
          />
        </div>
      </div>
    </main>
  );
}
