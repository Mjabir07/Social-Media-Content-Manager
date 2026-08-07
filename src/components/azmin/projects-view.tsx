"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FolderKanban, Plus, Loader2, ArrowRight, AlertTriangle, Clock, X } from "lucide-react";
import { AzminProfileMenu } from "@/components/azmin/profile-menu";
import {
  PROJECT_STATUSES,
  projectStatusMeta,
  deadlineHealth,
  formatBudget,
  type ProjectStatus,
  type TaskCounts,
} from "@/lib/projects-catalog";

export type ProjectDTO = {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  companyId: string | null;
  deadline: string | null;
  budgetCents: number | null;
  currency: string;
  counts: TaskCounts;
  progress: number;
};

export function ProjectsView({
  initialProjects,
  companies,
  canManage,
  userName,
  userEmail,
  userRole,
}: {
  initialProjects: ProjectDTO[];
  companies: { id: string; name: string }[];
  canManage: boolean;
  userName: string;
  userEmail: string;
  userRole: string;
}) {
  const [projects, setProjects] = useState(initialProjects);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("ACTIVE");
  const [deadline, setDeadline] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/projects", { cache: "no-store" });
    if (res.ok) setProjects((await res.json()).projects ?? []);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, companyId: companyId || null, status, deadline: deadline || null }),
    });
    setSaving(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error ?? "Could not create project.");
      return;
    }
    setName(""); setCompanyId(""); setStatus("ACTIVE"); setDeadline(""); setShowForm(false);
    await refresh();
  }

  const companyName = (id: string | null) => companies.find((c) => c.id === id)?.name ?? null;
  const inputCls = "w-full rounded-xl border border-[#B8CCE0] bg-white px-3.5 py-2.5 text-sm text-[#0f2137] outline-none placeholder:text-[#93A9BF] focus:border-[#087CFA]";

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
              <span className="mt-0.5 block text-[11px] font-extrabold uppercase tracking-[.17em] text-[#456784]">Projects</span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/azmin/tasks" className="hidden rounded-xl border border-[#B8CCE0] bg-[#F8FBFF] px-4 py-2.5 text-xs font-bold text-[#234B70] hover:border-[#087CFA] sm:block">All tasks</Link>
            <Link href="/azmin" className="hidden rounded-xl border border-[#B8CCE0] bg-[#F8FBFF] px-4 py-2.5 text-xs font-bold text-[#234B70] hover:border-[#087CFA] sm:block">Command center</Link>
            <AzminProfileMenu name={userName} email={userEmail} role={userRole} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 pb-16 pt-6 sm:px-8 sm:pt-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[.15em] text-[#0758C9]">Delivery</p>
            <h1 className="mt-1 flex items-center gap-3 font-display text-3xl font-bold tracking-[-.03em]">
              <FolderKanban className="text-[#087CFA]" size={28} /> Projects
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-[#4C6A86]">Group tasks under a project, track progress and deadlines per client.</p>
          </div>
          {canManage && !showForm && (
            <button onClick={() => setShowForm(true)} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#087CFA] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(8,124,250,.2)] transition hover:bg-[#076BE0]">
              <Plus size={16} /> New project
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="mt-6 grid gap-3 rounded-2xl border border-[#C5D6E6] bg-white p-5 shadow-[0_10px_28px_rgba(3,20,46,.05)] sm:grid-cols-2">
            <label className="text-xs font-bold text-[#476987] sm:col-span-2">
              Project name
              <input className={`mt-1 ${inputCls}`} value={name} onChange={(e) => setName(e.target.value)} placeholder="ACME website revamp" required minLength={2} />
            </label>
            <label className="text-xs font-bold text-[#476987]">
              Client
              <select className={`mt-1 ${inputCls}`} value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
                <option value="">Internal / none</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="text-xs font-bold text-[#476987]">
              Status
              <select className={`mt-1 ${inputCls}`} value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
                {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{projectStatusMeta[s].label}</option>)}
              </select>
            </label>
            <label className="text-xs font-bold text-[#476987]">
              Deadline
              <input className={`mt-1 ${inputCls}`} type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </label>
            {error && <p className="sm:col-span-2 flex items-center gap-1.5 text-xs font-semibold text-[#C0362C]"><AlertTriangle size={13} /> {error}</p>}
            <div className="flex items-center gap-2 sm:col-span-2">
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#087CFA] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#076BE0] disabled:opacity-60">
                {saving && <Loader2 size={15} className="animate-spin" />} Create project
              </button>
              <button type="button" onClick={() => { setShowForm(false); setError(null); }} className="inline-flex items-center gap-1.5 rounded-xl border border-[#B8CCE0] bg-white px-4 py-2.5 text-sm font-bold text-[#234B70]">
                <X size={15} /> Cancel
              </button>
            </div>
          </form>
        )}

        <div className="mt-8">
          {projects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#AFC6DE] bg-[#F5F9FE] px-5 py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF9FF] text-[#087CFA]"><FolderKanban size={30} /></div>
              <h3 className="mt-4 text-base font-bold text-[#173A5C]">No projects yet</h3>
              <p className="mt-1 text-sm text-[#526F8A]">{canManage ? "Create one, then attach tasks to it." : "Ask an editor to create one."}</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => {
                const health = deadlineHealth(p.deadline, p.status);
                const budget = formatBudget(p.budgetCents, p.currency);
                return (
                  <Link key={p.id} href={`/azmin/projects/${p.id}`} className="group flex flex-col rounded-2xl border border-[#C5D6E6] bg-white p-5 shadow-[0_10px_28px_rgba(3,20,46,.05)] transition hover:border-[#087CFA]">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-[#173A5C]">{p.name}</h3>
                      <span className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: projectStatusMeta[p.status].color, background: projectStatusMeta[p.status].bg }}>
                        {projectStatusMeta[p.status].label}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs font-semibold text-[#526F8A]">{companyName(p.companyId) ?? "Internal"}</p>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs font-bold text-[#4C6A86]">
                        <span>{p.progress}% done</span>
                        <span>{p.counts.done}/{p.counts.total} tasks</span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#E7EEF6]">
                        <div className="h-full rounded-full bg-[#087CFA] transition-all" style={{ width: `${p.progress}%` }} />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-3 text-[11px] font-semibold">
                      {p.deadline && (
                        <span className={`flex items-center gap-1 ${health === "overdue" ? "text-[#B4231C]" : health === "due-soon" ? "text-[#9A6711]" : "text-[#72899E]"}`}>
                          {health === "overdue" ? <AlertTriangle size={12} /> : <Clock size={12} />}
                          {new Date(p.deadline).toLocaleDateString()}{health === "overdue" ? " · late" : health === "due-soon" ? " · soon" : ""}
                        </span>
                      )}
                      {p.counts.overdue > 0 && <span className="flex items-center gap-1 text-[#B4231C]"><AlertTriangle size={12} /> {p.counts.overdue} overdue</span>}
                      {budget && <span className="text-[#72899E]">{budget}</span>}
                    </div>

                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#0758C9] group-hover:gap-2">
                      Open board <ArrowRight size={13} />
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
