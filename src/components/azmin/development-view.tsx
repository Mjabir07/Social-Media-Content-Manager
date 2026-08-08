"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Code2, Plus, Loader2, GitBranch, ExternalLink, Trash2, X } from "lucide-react";
import { AzminProfileMenu } from "@/components/azmin/profile-menu";
import {
  DEV_PROJECT_STATUSES,
  devProjectStatusMeta,
  REPO_PROVIDERS,
  repoProviderMeta,
  allBranches,
  type DevProjectStatus,
  type RepoProvider,
} from "@/lib/dev-studio-catalog";

export type RepoDTO = {
  id: string;
  provider: RepoProvider;
  fullName: string;
  url: string;
  defaultBranch: string;
  branches: string[];
  visibility: string;
};

export type DevProjectDTO = {
  id: string;
  name: string;
  description: string | null;
  status: DevProjectStatus;
  companyId: string | null;
  productionUrl: string | null;
  createdAt: string;
  repositories: RepoDTO[];
};

const inputCls =
  "w-full rounded-xl border border-[#B8CCE0] bg-white px-3.5 py-2.5 text-sm text-[#0f2137] outline-none placeholder:text-[#93A9BF] focus:border-[#087CFA]";

export function DevelopmentView({
  initialProjects,
  companies,
  canManage,
  userName,
  userEmail,
  userRole,
}: {
  initialProjects: DevProjectDTO[];
  companies: { id: string; name: string }[];
  canManage: boolean;
  userName: string;
  userEmail: string;
  userRole: string;
}) {
  const [projects, setProjects] = useState<DevProjectDTO[]>(initialProjects);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [status, setStatus] = useState<DevProjectStatus>("ACTIVE");
  const [description, setDescription] = useState("");
  const [productionUrl, setProductionUrl] = useState("");

  async function refresh() {
    const res = await fetch("/api/dev-projects");
    if (res.ok) setProjects((await res.json()).devProjects as DevProjectDTO[]);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/dev-projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        companyId: companyId || null,
        status,
        description: description || null,
        productionUrl: productionUrl || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error ?? "Could not create project.");
      return;
    }
    setName("");
    setCompanyId("");
    setStatus("ACTIVE");
    setDescription("");
    setProductionUrl("");
    setShowForm(false);
    await refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this development project? Its tracked repositories go with it.")) return;
    setProjects((prev) => prev.filter((p) => p.id !== id));
    const res = await fetch(`/api/dev-projects/${id}`, { method: "DELETE" });
    if (!res.ok) await refresh();
  }

  const companyName = (id: string | null) => companies.find((c) => c.id === id)?.name ?? null;
  const repoCount = projects.reduce((n, p) => n + p.repositories.length, 0);

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
              <span className="mt-0.5 block text-[11px] font-extrabold uppercase tracking-[.17em] text-[#456784]">
                Development studio
              </span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/azmin/infrastructure"
              className="hidden rounded-xl border border-[#B8CCE0] bg-[#F8FBFF] px-4 py-2.5 text-xs font-bold text-[#234B70] hover:border-[#087CFA] sm:block"
            >
              Infrastructure
            </Link>
            <Link
              href="/azmin"
              className="hidden rounded-xl border border-[#B8CCE0] bg-[#F8FBFF] px-4 py-2.5 text-xs font-bold text-[#234B70] hover:border-[#087CFA] sm:block"
            >
              Command center
            </Link>
            <AzminProfileMenu name={userName} email={userEmail} role={userRole} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 pb-16 pt-6 sm:px-8 sm:pt-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[.15em] text-[#0758C9]">Phase 5 · Build</p>
            <h1 className="mt-1 flex items-center gap-3 font-display text-3xl font-bold tracking-[-.03em]">
              <Code2 className="text-[#087CFA]" size={28} /> Development studio
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-[#4C6A86]">
              Track software projects, their repositories and branches per client — the home base for coding work.
            </p>
          </div>
          {canManage && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#087CFA] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(8,124,250,.2)] transition hover:bg-[#076BE0]"
            >
              <Plus size={16} /> New project
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-[#456784]">
          <span className="rounded-full bg-white px-3 py-1.5 shadow-[0_1px_4px_rgba(3,20,46,.05)]">
            {projects.length} project{projects.length === 1 ? "" : "s"}
          </span>
          <span className="rounded-full bg-white px-3 py-1.5 shadow-[0_1px_4px_rgba(3,20,46,.05)]">
            {repoCount} repositor{repoCount === 1 ? "y" : "ies"}
          </span>
        </div>

        {showForm && (
          <form
            onSubmit={handleCreate}
            className="mt-6 grid gap-3 rounded-2xl border border-[#C5D6E6] bg-white p-5 shadow-[0_10px_28px_rgba(3,20,46,.05)] sm:grid-cols-2"
          >
            <label className="text-xs font-bold text-[#476987] sm:col-span-2">
              Project name
              <input
                className={`mt-1 ${inputCls}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ACME storefront rebuild"
                required
                minLength={2}
              />
            </label>
            <label className="text-xs font-bold text-[#476987]">
              Client
              <select className={`mt-1 ${inputCls}`} value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
                <option value="">Internal / none</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-bold text-[#476987]">
              Status
              <select
                className={`mt-1 ${inputCls}`}
                value={status}
                onChange={(e) => setStatus(e.target.value as DevProjectStatus)}
              >
                {DEV_PROJECT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {devProjectStatusMeta[s].label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-bold text-[#476987]">
              Production URL <span className="font-medium text-[#93A9BF]">(optional)</span>
              <input
                className={`mt-1 ${inputCls}`}
                value={productionUrl}
                onChange={(e) => setProductionUrl(e.target.value)}
                placeholder="acme.com"
              />
            </label>
            <label className="text-xs font-bold text-[#476987]">
              Notes <span className="font-medium text-[#93A9BF]">(optional)</span>
              <input
                className={`mt-1 ${inputCls}`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Stack, goals, context…"
              />
            </label>
            {error && <p className="text-xs font-bold text-[#D14343] sm:col-span-2">{error}</p>}
            <div className="flex gap-2 sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-[#087CFA] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(8,124,250,.2)] transition hover:bg-[#076BE0] disabled:opacity-60"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Create project
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setError(null);
                }}
                className="rounded-xl border border-[#B8CCE0] bg-[#F8FBFF] px-5 py-2.5 text-sm font-bold text-[#234B70] hover:border-[#087CFA]"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {projects.length === 0 && !showForm ? (
          <div className="mt-8 rounded-2xl border border-dashed border-[#B8CCE0] bg-white/60 p-10 text-center">
            <Code2 className="mx-auto text-[#8FA9C2]" size={30} />
            <p className="mt-3 font-display text-lg font-bold text-[#234B70]">No development projects yet</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-[#4C6A86]">
              Create a project, then link its repositories and branches so every build effort has one home.
            </p>
            {canManage && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#087CFA] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#076BE0]"
              >
                <Plus size={16} /> New project
              </button>
            )}
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            {projects.map((p) => (
              <DevProjectCard
                key={p.id}
                project={p}
                companyName={companyName(p.companyId)}
                canManage={canManage}
                onChanged={refresh}
                onDelete={() => handleDelete(p.id)}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function DevProjectCard({
  project,
  companyName,
  canManage,
  onChanged,
  onDelete,
}: {
  project: DevProjectDTO;
  companyName: string | null;
  canManage: boolean;
  onChanged: () => Promise<void>;
  onDelete: () => void;
}) {
  const meta = devProjectStatusMeta[project.status];
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<RepoProvider>("github");
  const [fullName, setFullName] = useState("");
  const [defaultBranch, setDefaultBranch] = useState("main");
  const [branchesText, setBranchesText] = useState("");

  async function handleAddRepo(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const branches = branchesText
      .split(",")
      .map((b) => b.trim())
      .filter(Boolean);
    const res = await fetch(`/api/dev-projects/${project.id}/repos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, fullName, defaultBranch, branches }),
    });
    setSaving(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error ?? "Could not add repository.");
      return;
    }
    setProvider("github");
    setFullName("");
    setDefaultBranch("main");
    setBranchesText("");
    setAdding(false);
    await onChanged();
  }

  async function handleRemoveRepo(id: string) {
    const res = await fetch(`/api/repos/${id}`, { method: "DELETE" });
    if (res.ok) await onChanged();
  }

  return (
    <article className="rounded-2xl border border-[#C5D6E6] bg-white p-5 shadow-[0_10px_28px_rgba(3,20,46,.05)]">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-lg font-bold tracking-[-.02em]">{project.name}</h2>
            <span
              className="rounded-full px-2.5 py-1 text-[11px] font-extrabold"
              style={{ color: meta.color, background: meta.bg }}
            >
              {meta.label}
            </span>
            {companyName && (
              <span className="rounded-full bg-[#EDF4FB] px-2.5 py-1 text-[11px] font-bold text-[#3B668E]">
                {companyName}
              </span>
            )}
          </div>
          {project.description && <p className="mt-1.5 text-sm text-[#4C6A86]">{project.description}</p>}
          {project.productionUrl && (
            <a
              href={project.productionUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-[#0758C9] hover:underline"
            >
              <ExternalLink size={13} /> {project.productionUrl.replace(/^https?:\/\//, "")}
            </a>
          )}
        </div>
        {canManage && (
          <button
            onClick={onDelete}
            className="grid h-9 w-9 place-items-center rounded-xl border border-[#E4C8CC] bg-[#FEF5F5] text-[#C7514B] transition hover:border-[#D14343]"
            aria-label="Remove project"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>

      <div className="mt-4 border-t border-[#E5EEF6] pt-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-extrabold uppercase tracking-[.15em] text-[#456784]">
            Repositories ({project.repositories.length})
          </p>
          {canManage && !adding && (
            <button
              onClick={() => setAdding(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-[#B8CCE0] bg-[#F8FBFF] px-2.5 py-1.5 text-xs font-bold text-[#234B70] hover:border-[#087CFA]"
            >
              <Plus size={13} /> Add repo
            </button>
          )}
        </div>

        {project.repositories.length > 0 && (
          <ul className="mt-3 grid gap-2">
            {project.repositories.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-[#DDE8F2] bg-[#F8FBFF] px-3 py-2.5"
              >
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-sm font-bold text-[#173A5C] hover:underline"
                >
                  {r.fullName}
                  <ExternalLink size={12} className="text-[#7C99B4]" />
                </a>
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#5A7189]">
                  {repoProviderMeta[r.provider].label}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    r.visibility === "public" ? "bg-[#E7F8EF] text-[#087B54]" : "bg-[#EDF1F6] text-[#5A7189]"
                  }`}
                >
                  {r.visibility}
                </span>
                <span className="ml-auto flex flex-wrap items-center gap-1.5">
                  {allBranches(r.defaultBranch, r.branches).map((b, i) => (
                    <span
                      key={b}
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        i === 0 ? "bg-[#E7F0FD] text-[#0758C9]" : "bg-white text-[#5A7189]"
                      }`}
                    >
                      <GitBranch size={10} /> {b}
                    </span>
                  ))}
                </span>
                {canManage && (
                  <button
                    onClick={() => handleRemoveRepo(r.id)}
                    className="grid h-7 w-7 place-items-center rounded-lg text-[#9A6711] hover:bg-[#FFF1D5]"
                    aria-label="Remove repository"
                  >
                    <X size={13} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {project.repositories.length === 0 && !adding && (
          <p className="mt-2 text-xs text-[#7C99B4]">No repositories linked yet.</p>
        )}

        {adding && (
          <form
            onSubmit={handleAddRepo}
            className="mt-3 grid gap-2.5 rounded-xl border border-[#DDE8F2] bg-[#F8FBFF] p-3.5 sm:grid-cols-2"
          >
            <label className="text-xs font-bold text-[#476987]">
              Provider
              <select
                className={`mt-1 ${inputCls}`}
                value={provider}
                onChange={(e) => setProvider(e.target.value as RepoProvider)}
              >
                {REPO_PROVIDERS.map((p) => (
                  <option key={p} value={p}>
                    {repoProviderMeta[p].label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-bold text-[#476987]">
              Repository (owner/repo)
              <input
                className={`mt-1 ${inputCls}`}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="acme/storefront"
                required
              />
            </label>
            <label className="text-xs font-bold text-[#476987]">
              Default branch
              <input
                className={`mt-1 ${inputCls}`}
                value={defaultBranch}
                onChange={(e) => setDefaultBranch(e.target.value)}
                placeholder="main"
              />
            </label>
            <label className="text-xs font-bold text-[#476987]">
              Tracked branches <span className="font-medium text-[#93A9BF]">(comma-separated)</span>
              <input
                className={`mt-1 ${inputCls}`}
                value={branchesText}
                onChange={(e) => setBranchesText(e.target.value)}
                placeholder="develop, staging"
              />
            </label>
            {error && <p className="text-xs font-bold text-[#D14343] sm:col-span-2">{error}</p>}
            <div className="flex gap-2 sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-[#087CFA] px-4 py-2 text-xs font-bold text-white hover:bg-[#076BE0] disabled:opacity-60"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add repository
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdding(false);
                  setError(null);
                }}
                className="rounded-lg border border-[#B8CCE0] bg-white px-4 py-2 text-xs font-bold text-[#234B70] hover:border-[#087CFA]"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </article>
  );
}
