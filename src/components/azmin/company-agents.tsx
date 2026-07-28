"use client";

import { useEffect, useState } from "react";
import { Bot, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  AGENT_AUTONOMY,
  AGENT_TEMPLATES,
  agentTemplate,
  autonomyMeta,
  type AgentAutonomy,
} from "@/lib/agents-catalog";

type Agent = {
  id: string;
  name: string;
  role: string;
  systemPrompt: string;
  autonomy: AgentAutonomy;
  providerId: string | null;
  status: string;
  isDefault: boolean;
};

type Draft = {
  id?: string;
  name: string;
  role: string;
  systemPrompt: string;
  autonomy: AgentAutonomy;
  providerId: string;
};

const AI_PROVIDERS: { id: string; name: string }[] = [
  { id: "", name: "Router default (recommended)" },
  { id: "GEMINI", name: "Google Gemini" },
  { id: "GROQ", name: "GroqCloud" },
  { id: "ANTHROPIC", name: "Anthropic Claude" },
  { id: "OPENROUTER", name: "OpenRouter" },
  { id: "CLOUDFLARE", name: "Cloudflare Workers AI" },
];

const emptyDraft: Draft = { name: "", role: "", systemPrompt: "", autonomy: "SUGGEST", providerId: "" };

export function CompanyAgents({ companyId, canManage }: { companyId: string; canManage: boolean }) {
  const [agents, setAgents] = useState<Agent[] | null>(null);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch(`/api/companies/${companyId}/agents`, { cache: "no-store" });
    if (!res.ok) { setError("Could not load agents."); return; }
    const data = await res.json();
    setAgents(data.agents);
  }

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/companies/${companyId}/agents`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { if (!cancelled) setAgents(d.agents); })
      .catch(() => { if (!cancelled) setError("Could not load agents."); });
    return () => { cancelled = true; };
  }, [companyId]);

  function openBlank() { setDraft({ ...emptyDraft }); }
  function openTemplate(key: string) {
    const t = agentTemplate(key);
    if (!t) return;
    setDraft({ name: t.name, role: t.role, systemPrompt: t.systemPrompt, autonomy: t.autonomy, providerId: "" });
  }
  function openEdit(a: Agent) {
    setDraft({ id: a.id, name: a.name, role: a.role, systemPrompt: a.systemPrompt, autonomy: a.autonomy, providerId: a.providerId ?? "" });
  }

  async function save() {
    if (!draft) return;
    setBusy(true); setError("");
    const body = { ...draft, providerId: draft.providerId || null };
    const res = draft.id
      ? await fetch(`/api/companies/${companyId}/agents/${draft.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      : await fetch(`/api/companies/${companyId}/agents`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || "Could not save the agent."); return; }
    setDraft(null);
    await load();
  }

  async function archive(a: Agent) {
    setBusy(true); setError("");
    const res = await fetch(`/api/companies/${companyId}/agents/${a.id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) { setError("Could not remove the agent."); return; }
    await load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.15em] text-[#087CFA]">Company workspace</p>
          <h2 className="mt-1 font-display text-xl font-bold">AI agents</h2>
          <p className="mt-1 text-sm text-[#4C6A86]">Named AI operators for this company. Each one runs only on this company&apos;s approved brand and brain — never another&apos;s.</p>
        </div>
        {canManage && (
          <button type="button" onClick={openBlank} className="inline-flex items-center gap-2 rounded-xl bg-[#087CFA] px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(8,124,250,.2)]">
            <Plus size={16} aria-hidden /> New agent
          </button>
        )}
      </div>

      {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}

      {agents === null ? (
        <div className="mt-6 flex items-center gap-2 text-sm text-[#4C6A86]"><Loader2 size={16} className="animate-spin" aria-hidden /> Loading agents…</div>
      ) : agents.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-[#AFC6DE] bg-[#F5F9FE] p-6">
          <h3 className="font-display text-lg font-bold">Start with a ready-made agent</h3>
          <p className="mt-1 text-sm text-[#4C6A86]">Pick a role to pre-fill, then tune it. Add as many as you need.</p>
          {canManage && <TemplateGrid onPick={openTemplate} />}
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {agents.map((a) => (
            <div key={a.id} className="flex flex-col gap-3 rounded-2xl border border-[#C8D8EA] bg-white p-4 shadow-[0_10px_28px_rgba(3,20,46,.05)]">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#E5F0FF] text-[#0758C9]"><Bot size={18} aria-hidden /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-base font-bold">{a.name}</h3>
                    <AutonomyBadge autonomy={a.autonomy} />
                    {a.status === "DISABLED" && <span className="rounded-full bg-[#EEF1F5] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#526F8A]">Disabled</span>}
                  </div>
                  <p className="mt-0.5 text-sm font-semibold text-[#41617E]">{a.role}</p>
                </div>
              </div>
              <p className="line-clamp-2 text-sm text-[#4C6A86]">{a.systemPrompt}</p>
              {canManage && (
                <div className="mt-auto flex items-center gap-2 border-t border-[#E4ECF5] pt-3">
                  <button type="button" onClick={() => openEdit(a)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-[#234B70] hover:bg-[#EEF4FB]"><Pencil size={13} aria-hidden /> Edit</button>
                  <button type="button" onClick={() => archive(a)} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-[#A12C2C] hover:bg-[#FFF0F0] disabled:opacity-50"><Trash2 size={13} aria-hidden /> Remove</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {canManage && agents !== null && agents.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-bold uppercase tracking-[.12em] text-[#526F8A]">Add another from a template</p>
          <TemplateGrid onPick={openTemplate} compact />
        </div>
      )}

      {draft && <AgentDialog draft={draft} setDraft={setDraft} onClose={() => setDraft(null)} onSave={save} busy={busy} />}
    </div>
  );
}

function TemplateGrid({ onPick, compact = false }: { onPick: (key: string) => void; compact?: boolean }) {
  return (
    <div className={`grid gap-2 ${compact ? "mt-2 sm:grid-cols-3 lg:grid-cols-4" : "mt-4 sm:grid-cols-2 lg:grid-cols-4"}`}>
      {AGENT_TEMPLATES.map((t) => (
        <button key={t.key} type="button" onClick={() => onPick(t.key)} className="rounded-xl border border-[#C8D8EA] bg-white p-3 text-left transition hover:border-[#087CFA] hover:shadow-[0_8px_20px_rgba(8,124,250,.1)]">
          <div className="text-sm font-bold text-[#03142E]">{t.name}</div>
          <div className="mt-0.5 text-xs text-[#4C6A86]">{t.role}</div>
        </button>
      ))}
    </div>
  );
}

function AutonomyBadge({ autonomy }: { autonomy: AgentAutonomy }) {
  const tone: Record<AgentAutonomy, string> = {
    SUGGEST: "bg-[#EEF1F5] text-[#526F8A]",
    DRAFT: "bg-[#DDF5FF] text-[#0758C9]",
    AUTOPILOT: "bg-[#E7F8EF] text-[#087B54]",
  };
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tone[autonomy]}`}>{autonomyMeta[autonomy].label}</span>;
}

function AgentDialog({ draft, setDraft, onClose, onSave, busy }: { draft: Draft; setDraft: (d: Draft) => void; onClose: () => void; onSave: () => void; busy: boolean }) {
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft({ ...draft, [key]: value });
  const valid = draft.name.trim().length >= 2 && draft.role.trim().length >= 2 && draft.systemPrompt.trim().length > 0;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#020B1F]/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[24px] border border-[#BFD1E3] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.14em] text-[#0758C9]">{draft.id ? "Edit agent" : "New agent"}</p>
            <h2 className="mt-1 font-display text-xl font-bold">Configure the AI operator</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#C8D8EA] bg-[#EDF3F9] text-[#234B70] hover:border-[#087CFA]"><X size={18} aria-hidden /></button>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Name"><input value={draft.name} onChange={(e) => set("name", e.target.value)} className={inputClass} placeholder="e.g. Content Writer" /></Field>
          <Field label="Role"><input value={draft.role} onChange={(e) => set("role", e.target.value)} className={inputClass} placeholder="e.g. Long-form content" /></Field>
          <Field label="Autonomy">
            <select value={draft.autonomy} onChange={(e) => set("autonomy", e.target.value as AgentAutonomy)} className={inputClass}>
              {AGENT_AUTONOMY.map((a) => <option key={a} value={a}>{autonomyMeta[a].label}</option>)}
            </select>
          </Field>
          <Field label="Model provider">
            <select value={draft.providerId} onChange={(e) => set("providerId", e.target.value)} className={inputClass}>
              {AI_PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <p className="mb-2 rounded-xl border border-[#B9E9FA] bg-[#ECFAFF] px-3 py-2 text-xs leading-5 text-[#17577A]">{autonomyMeta[draft.autonomy].description}</p>
          </div>
          <div className="sm:col-span-2"><Field label="Instructions (its job)"><textarea value={draft.systemPrompt} onChange={(e) => set("systemPrompt", e.target.value)} className={inputClass + " min-h-40"} placeholder="What this agent does, how it should work, what to avoid…" /></Field></div>
        </div>
        <p className="mt-3 text-xs leading-5 text-[#4C6A86]">At run time this is combined with {`${draft.name || "the agent"}`}&apos;s company brand and Company Brain. It never sees another company&apos;s data.</p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-bold text-[#405E78]">Cancel</button>
          <button type="button" onClick={onSave} disabled={busy || !valid} className="rounded-xl bg-[#087CFA] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(8,124,250,.2)] disabled:opacity-50">{busy ? "Saving…" : draft.id ? "Save changes" : "Create agent"}</button>
        </div>
      </div>
    </div>
  );
}

const inputClass = "mt-1.5 w-full rounded-xl border border-[#CEDBE9] bg-[#F8FAFD] px-3 py-2.5 text-sm outline-none transition focus:border-[#087CFA] focus:ring-2 focus:ring-[#087CFA]/10";
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-xs font-bold text-[#476987]">{label}{children}</label>; }
