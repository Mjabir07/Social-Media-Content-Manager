"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, Bot, CheckCircle2, CircleAlert, ExternalLink, FileCheck2, Globe2, Loader2, LockKeyhole, Play, ShieldCheck, Sparkles } from "lucide-react";
import { AzminProfileMenu } from "@/components/azmin/profile-menu";
import { SMM_PACKAGES, getSmmPackage, renderPackageScope } from "@/lib/smm-packages-catalog";

type Step = { id: string; key: string; title: string; description: string | null; category: string; executionMode: string; status: string; requiresApproval: boolean; blockingReason: string | null; output: Record<string, unknown>; evidence: Record<string, unknown>; task: { id: string; status: string; dueDate: string | null } | null };
type Run = { id: string; status: string; objective: string; research: Record<string, unknown>; plan: Record<string, unknown>; summary: string | null; nextAction: string | null; lastError: string | null; approvedAt: string | null; createdAt: string; progress: { finished: number; total: number; percent: number }; steps: Step[] };
type Account = {
  id: string; status: string; timezone: string; goals: string[]; platforms: string[]; approvalMode: string; agentMode: string;
  agentEnabled: boolean; nextAgentRunAt: string | null; lastAgentRunAt: string | null; postStats: { draft: number; scheduled: number; published: number };
  company: { id: string; name: string; website: string | null; industry: string | null; primaryColor: string; brandReady: boolean; brainReady: boolean };
  client: { id: string; name: string; email: string | null; phone: string | null; domain: string | null };
  lead: { id: string; name: string; service: string | null } | null;
  connections: Array<{ id: string; channel: string; displayName: string; status: string }>;
  campaigns: Array<{ id: string; name: string; status: string }>;
  pillars: Array<{ id: string; name: string; description: string | null; targetPercent: number; active: boolean }>;
  runs: Run[];
};

const PLATFORM_OPTIONS = ["FACEBOOK", "INSTAGRAM", "LINKEDIN", "YOUTUBE", "TIKTOK", "X", "PINTEREST", "GOOGLE_BUSINESS"];

export function SmmAccountWorkspace({ account, canManage, canApprove, userName, userEmail, userRole }: { account: Account; canManage: boolean; canApprove: boolean; userName: string; userEmail: string; userRole: string }) {
  const router = useRouter();
  const [goals, setGoals] = useState(account.goals.join("\n"));
  const [platforms, setPlatforms] = useState(account.platforms);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [editingStep, setEditingStep] = useState<Step | null>(null);
  const [evidence, setEvidence] = useState("");
  const [packageId, setPackageId] = useState("");
  const [autoMode, setAutoMode] = useState(account.agentMode);
  const [autoApproval, setAutoApproval] = useState(account.approvalMode);
  const [autoEnabled, setAutoEnabled] = useState(account.agentEnabled);
  const [autoMsg, setAutoMsg] = useState("");
  async function saveAutomation(runNow: boolean) {
    setBusy(runNow ? "run" : "auto"); setError(""); setAutoMsg("");
    const response = await fetch(`/api/smm/${account.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agentMode: autoMode, approvalMode: autoApproval, agentEnabled: autoEnabled, runNow }) });
    const data = await response.json().catch(() => ({})); setBusy("");
    if (!response.ok) { setError(data.error || "Could not update automation."); return; }
    setAutoMsg(runNow ? `Agent ran — ${data.created} draft${data.created === 1 ? "" : "s"} created.` : "Automation settings saved.");
    router.refresh();
  }
  const [newPillar, setNewPillar] = useState("");
  const [newPillarDesc, setNewPillarDesc] = useState("");
  async function addPillar() {
    if (!newPillar.trim()) return;
    setBusy("pillar-add"); setError("");
    const response = await fetch(`/api/smm/${account.id}/pillars`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newPillar, description: newPillarDesc || null }) });
    const data = await response.json().catch(() => ({})); setBusy("");
    if (!response.ok) { setError(data.error || "Could not add the pillar."); return; }
    setNewPillar(""); setNewPillarDesc(""); router.refresh();
  }
  async function togglePillar(pillarId: string, active: boolean) {
    setBusy(`pillar-${pillarId}`);
    await fetch(`/api/smm/${account.id}/pillars/${pillarId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active }) });
    setBusy(""); router.refresh();
  }
  async function removePillar(pillarId: string) {
    setBusy(`pillar-${pillarId}`);
    await fetch(`/api/smm/${account.id}/pillars/${pillarId}`, { method: "DELETE" });
    setBusy(""); router.refresh();
  }
  const isPackageStep = editingStep?.key === "confirm-scope";
  const selectedPackage = getSmmPackage(packageId);
  function pickPackage(id: string) {
    setPackageId(id);
    const pkg = getSmmPackage(id);
    setEvidence(pkg ? renderPackageScope(pkg, account.company.name) : "");
  }
  const run = account.runs[0] ?? null;
  const gaps = useMemo(() => Array.isArray(run?.plan.gaps) ? run.plan.gaps.filter((item): item is string => typeof item === "string") : [], [run]);
  const sources = useMemo(() => Array.isArray(run?.research.sources) ? run.research.sources.filter((item): item is { url: string; title: string; excerpt?: string } => Boolean(item && typeof item === "object" && "url" in item && "title" in item)) : [], [run]);

  async function generatePlan() {
    setBusy("plan"); setError("");
    const response = await fetch(`/api/smm/${account.id}/agent-runs`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ goals: goals.split("\n").map((item) => item.trim()).filter(Boolean), platforms }) });
    const data = await response.json().catch(() => ({})); setBusy("");
    if (!response.ok) { setError(data.error || "Could not create the onboarding plan."); return; }
    router.refresh();
  }
  async function approvePlan() {
    if (!run) return; setBusy("approve"); setError("");
    const response = await fetch(`/api/smm/${account.id}/agent-runs/${run.id}/approve`, { method: "POST" });
    const data = await response.json().catch(() => ({})); setBusy("");
    if (!response.ok) { setError(data.error || "Could not approve the plan."); return; }
    router.refresh();
  }
  async function updateStep(status: "IN_PROGRESS" | "DONE" | "BLOCKED") {
    if (!run || !editingStep) return; setBusy(`step-${editingStep.id}`); setError("");
    const response = await fetch(`/api/smm/${account.id}/agent-runs/${run.id}/steps/${editingStep.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, evidence: evidence || null, blockingReason: status === "BLOCKED" ? evidence || "Waiting for required input or access." : null }) });
    const data = await response.json().catch(() => ({})); setBusy("");
    if (!response.ok) { setError(data.error || "Could not update the step."); return; }
    setEditingStep(null); setEvidence(""); router.refresh();
  }

  return <main data-azmin-ui className="min-h-screen bg-[#EAF1F9] text-[#03142E]">
    <header className="border-b border-[#C8D8EA] bg-white px-5 py-4 sm:px-8"><div className="mx-auto flex max-w-[1450px] items-center gap-3"><Link href="/azmin/smm" className="grid h-10 w-10 place-items-center rounded-xl border border-[#C8D8EA] text-[#405E78]"><ArrowLeft size={17} /></Link><span className="relative h-10 w-10"><Image src="/brand/azmin-c1-mark.png" alt="AZMIN" fill priority sizes="40px" className="object-contain" /></span><div className="min-w-0"><strong className="block truncate font-display text-[15px]">{account.company.name}</strong><span className="block text-[10px] font-black uppercase tracking-[.15em] text-[#456784]">SMM Delivery Agent</span></div><div className="ml-auto"><AzminProfileMenu name={userName} email={userEmail} role={userRole} /></div></div></header>

    <div className="mx-auto max-w-[1450px] px-5 py-7 sm:px-8">
      <section className="overflow-hidden rounded-[28px] bg-[#03142E] text-white"><div className="h-1.5" style={{ background: account.company.primaryColor }} /><div className="grid gap-7 p-7 lg:grid-cols-[1fr_420px] lg:p-9"><div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#0D3159] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#72E4F6]">{account.status}</span><span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider">{account.agentMode.replaceAll("_", " ")}</span></div><h1 className="mt-3 font-display text-4xl font-bold tracking-[-.045em]">From signed client to SMM-ready operation.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#AFC5D7]">The agent assesses, researches, plans, creates controlled tasks, waits for approvals, and records verification evidence before advancing.</p>{account.lead && <p className="mt-4 text-xs font-semibold text-[#72E4F6]">Origin: won lead · {account.lead.service || account.lead.name}</p>}</div>
        <div className="rounded-2xl border border-white/10 bg-white/[.07] p-5">{run ? <><div className="flex items-center justify-between"><span className="text-xs font-black uppercase tracking-wider text-[#AFC5D7]">Onboarding progress</span><strong className="text-2xl">{run.progress.percent}%</strong></div><div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#22D3EE]" style={{ width: `${run.progress.percent}%` }} /></div><p className="mt-3 text-xs text-[#AFC5D7]">{run.progress.finished} of {run.progress.total} steps verified</p><p className="mt-4 rounded-xl bg-black/20 px-3 py-2.5 text-xs font-semibold text-white">Next: {run.nextAction}</p></> : <div className="text-center"><Bot className="mx-auto text-[#72E4F6]" size={34} /><p className="mt-3 text-sm font-bold">No delivery plan yet</p><p className="mt-1 text-xs text-[#AFC5D7]">Configure the objectives below and run the agent.</p></div>}</div></div></section>

      {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}

      {!run && <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_1fr]"><Panel title="Business outcomes" subtitle="One goal per line. The agent will turn these into measurable onboarding and strategy work."><textarea disabled={!canManage} value={goals} onChange={(event) => setGoals(event.target.value)} className="mt-4 min-h-40 w-full rounded-xl border border-[#C4D5E6] bg-[#F8FBFE] p-3 text-sm outline-none focus:border-[#087CFA]" placeholder="Generate qualified enquiries\nBuild local brand awareness\nIncrease consultation bookings" /></Panel><Panel title="Target platforms" subtitle="Select only channels included in the client package."><div className="mt-4 grid grid-cols-2 gap-2">{PLATFORM_OPTIONS.map((platform) => <label key={platform} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-3 text-xs font-bold ${platforms.includes(platform) ? "border-[#087CFA] bg-[#EAF4FF] text-[#0758C9]" : "border-[#D4E0EC] bg-white text-[#496A86]"}`}><input type="checkbox" checked={platforms.includes(platform)} onChange={() => setPlatforms((current) => current.includes(platform) ? current.filter((item) => item !== platform) : [...current, platform])} className="sr-only" />{platform.replaceAll("_", " ")}</label>)}</div><button onClick={generatePlan} disabled={!canManage || busy === "plan"} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#087CFA] px-5 py-3 text-sm font-extrabold text-white disabled:opacity-50">{busy === "plan" ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />} Assess, research &amp; build plan</button></Panel></section>}

      {run && <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]"><section className="space-y-4"><Panel title="Delivery plan" subtitle={run.objective}><div className="mt-4 flex flex-wrap items-center gap-2"><StatusBadge value={run.status} /><span className="text-xs font-semibold text-[#58748D]">Created {new Date(run.createdAt).toLocaleString()}</span></div>{run.status === "AWAITING_APPROVAL" && <div className="mt-4 rounded-2xl border border-[#F0D49A] bg-[#FFF8E9] p-4"><p className="text-sm font-bold text-[#704C0E]">Approval gate</p><p className="mt-1 text-xs leading-5 text-[#7D6336]">Approval creates the execution tasks. External profile changes and publishing still require their own action approvals.</p>{canApprove ? <button onClick={approvePlan} disabled={busy === "approve"} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#8A5A0B] px-4 py-2.5 text-xs font-extrabold text-white disabled:opacity-50"><ShieldCheck size={14} /> {busy === "approve" ? "Approving…" : "Approve plan & create tasks"}</button> : <p className="mt-3 text-xs font-bold">Waiting for an owner or admin.</p>}</div>}</Panel>
        <div className="space-y-3">{run.steps.map((step, index) => <article key={step.id} className="rounded-2xl border border-[#C8D8EA] bg-white p-4 shadow-[0_8px_26px_rgba(3,20,46,.04)]"><div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#EAF4FF] text-xs font-black text-[#0758C9]">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-display text-base font-bold">{step.title}</h3><StatusBadge value={step.status} /><ModeBadge value={step.executionMode} /></div><p className="mt-1.5 text-xs leading-5 text-[#58748D]">{step.description}</p>{step.blockingReason && <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1.5 text-[11px] font-bold text-red-700"><CircleAlert size={12} /> {step.blockingReason}</p>}{typeof step.evidence.note === "string" && <p className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800"><strong>Evidence:</strong> {step.evidence.note}</p>}<div className="mt-3 flex flex-wrap items-center gap-2">{step.task && <Link href="/azmin/tasks" className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0758C9]">Task {step.task.status.toLowerCase()} <ExternalLink size={11} /></Link>}{canManage && run.status !== "AWAITING_APPROVAL" && step.status !== "SKIPPED" && <button onClick={() => { setEditingStep(step); setEvidence(typeof step.evidence.note === "string" ? step.evidence.note : ""); setPackageId(""); }} className="ml-auto rounded-lg bg-[#031A3B] px-3 py-1.5 text-[11px] font-bold text-white">{step.status === "DONE" ? "Edit" : "Update & add evidence"}</button>}</div></div></div></article>)}</div></section>
        <aside className="space-y-4"><Panel title="Content automation" subtitle="Let the agent draft content from the pillars on a daily cycle.">
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <Stat label="Drafts" value={account.postStats.draft} /><Stat label="Scheduled" value={account.postStats.scheduled} /><Stat label="Published" value={account.postStats.published} />
          </div>
          {canManage ? <div className="mt-4 space-y-3">
            <label className="flex items-center justify-between rounded-xl border border-[#D4E0EC] bg-[#F8FBFE] px-3 py-2.5 text-xs font-bold text-[#33526E]">Automation enabled<input type="checkbox" checked={autoEnabled} onChange={(e) => setAutoEnabled(e.target.checked)} className="h-4 w-4 accent-[#087CFA]" /></label>
            <div><span className="text-[10px] font-black uppercase tracking-wider text-[#0758C9]">Agent mode</span>
              <select value={autoMode} onChange={(e) => setAutoMode(e.target.value)} className="mt-1 w-full rounded-xl border border-[#C4D5E6] bg-white px-3 py-2 text-sm outline-none focus:border-[#087CFA]">
                <option value="DRAFT_ONLY">Draft only — I review every post</option>
                <option value="ASSISTED">Assisted — drafts + suggestions</option>
                <option value="AUTONOMOUS">Autonomous — auto-schedule posts</option>
              </select></div>
            <div><span className="text-[10px] font-black uppercase tracking-wider text-[#0758C9]">Approval</span>
              <select value={autoApproval} onChange={(e) => setAutoApproval(e.target.value)} className="mt-1 w-full rounded-xl border border-[#C4D5E6] bg-white px-3 py-2 text-sm outline-none focus:border-[#087CFA]">
                <option value="REQUIRED">Required — approve before publish</option>
                <option value="TRUSTED_AUTO">Trusted — publish without approval</option>
              </select></div>
            <p className="text-[11px] leading-4 text-[#6B839B]">Next run: {account.nextAgentRunAt ? new Date(account.nextAgentRunAt).toLocaleString() : "not scheduled"}{account.lastAgentRunAt ? ` · last: ${new Date(account.lastAgentRunAt).toLocaleString()}` : ""}. Publishing still needs a connected channel.</p>
            <div className="flex gap-2"><button onClick={() => saveAutomation(false)} disabled={busy === "auto" || busy === "run"} className="flex-1 rounded-xl bg-[#087CFA] px-3 py-2 text-xs font-extrabold text-white disabled:opacity-50">{busy === "auto" ? "Saving…" : "Save"}</button><button onClick={() => saveAutomation(true)} disabled={busy === "auto" || busy === "run"} className="flex-1 rounded-xl bg-[#031A3B] px-3 py-2 text-xs font-extrabold text-white disabled:opacity-50">{busy === "run" ? "Running…" : "Run now"}</button></div>
            {autoMsg && <p className="text-[11px] font-bold text-emerald-600">{autoMsg}</p>}
          </div> : <p className="mt-3 text-xs text-[#58748D]">Ask an editor or admin to configure automation.</p>}
        </Panel><Panel title="Content pillars" subtitle="Themes the agent drafts content from. Only active pillars are used.">
          <div className="mt-3 space-y-2">
            {account.pillars.length ? account.pillars.map((pillar) => <div key={pillar.id} className={`rounded-xl border px-3 py-2.5 ${pillar.active ? "border-[#CBE7F4] bg-[#F4FBFE]" : "border-[#E1E8F0] bg-[#F6F8FB] opacity-70"}`}>
              <div className="flex items-center gap-2"><span className="min-w-0 flex-1 truncate text-sm font-bold text-[#03142E]">{pillar.name}</span><span className="text-[10px] font-black text-[#6B839B]">{pillar.targetPercent}%</span></div>
              {pillar.description && <p className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-[#58748D]">{pillar.description}</p>}
              {canManage && <div className="mt-1.5 flex gap-3 text-[10px] font-black uppercase tracking-wider"><button onClick={() => togglePillar(pillar.id, !pillar.active)} disabled={busy === `pillar-${pillar.id}`} className="text-[#0758C9] disabled:opacity-40">{pillar.active ? "Pause" : "Activate"}</button><button onClick={() => removePillar(pillar.id)} disabled={busy === `pillar-${pillar.id}`} className="text-red-600 disabled:opacity-40">Delete</button></div>}
            </div>) : <p className="text-xs text-[#58748D]">No pillars yet. Add one so the agent has themes to draft from.</p>}
          </div>
          {canManage && <div className="mt-3 space-y-2 border-t border-[#E4ECF5] pt-3">
            <input value={newPillar} onChange={(e) => setNewPillar(e.target.value)} placeholder="Pillar name (e.g. Pest prevention tips)" className="w-full rounded-xl border border-[#C4D5E6] bg-white px-3 py-2 text-sm outline-none focus:border-[#087CFA]" />
            <input value={newPillarDesc} onChange={(e) => setNewPillarDesc(e.target.value)} placeholder="Short description (optional)" className="w-full rounded-xl border border-[#C4D5E6] bg-white px-3 py-2 text-sm outline-none focus:border-[#087CFA]" />
            <button onClick={addPillar} disabled={!newPillar.trim() || busy === "pillar-add"} className="w-full rounded-xl bg-[#087CFA] px-3 py-2 text-xs font-extrabold text-white disabled:opacity-50">{busy === "pillar-add" ? "Adding…" : "Add pillar"}</button>
          </div>}
        </Panel><Panel title="Assessment gaps" subtitle="Inputs the agent identified before execution.">{gaps.length ? <ul className="mt-4 space-y-2">{gaps.map((gap) => <li key={gap} className="flex gap-2 text-xs leading-5 text-[#6B4B16]"><CircleAlert className="mt-0.5 shrink-0 text-amber-600" size={14} />{gap}</li>)}</ul> : <p className="mt-4 text-sm font-semibold text-emerald-700">No initial context gaps detected.</p>}</Panel><Panel title="Research evidence" subtitle="Approved public sources retained by the agent.">{sources.length ? <div className="mt-4 space-y-3">{sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="block rounded-xl border border-[#D6E2EE] p-3 hover:border-[#087CFA]"><span className="flex items-center gap-1.5 text-xs font-bold text-[#0758C9]"><Globe2 size={13} />{source.title}</span>{source.excerpt && <span className="mt-1.5 line-clamp-3 block text-[11px] leading-5 text-[#58748D]">{source.excerpt}</span>}</a>)}</div> : <p className="mt-4 text-xs leading-5 text-[#58748D]">No public source captured. Add or verify the company website, then complete the guided research step.</p>}</Panel><Panel title="Security & evidence" subtitle="Controls applied to every run."><ul className="mt-4 space-y-2 text-xs text-[#496A86]"><li className="flex gap-2"><LockKeyhole size={14} className="shrink-0 text-[#0758C9]" />No credentials in plans, tasks, or evidence.</li><li className="flex gap-2"><FileCheck2 size={14} className="shrink-0 text-[#0758C9]" />Completion requires verification evidence.</li><li className="flex gap-2"><ShieldCheck size={14} className="shrink-0 text-[#0758C9]" />External actions remain approval-controlled.</li></ul></Panel></aside></div>}
    </div>

    {editingStep && <div className="fixed inset-0 z-50 grid place-items-center bg-[#020B1F]/80 p-4 backdrop-blur-sm"><div className="w-full max-w-lg rounded-3xl bg-white p-6"><p className="text-[10px] font-black uppercase tracking-wider text-[#0758C9]">Workflow evidence</p><h2 className="mt-1 font-display text-xl font-bold">{editingStep.title}</h2><p className="mt-2 text-xs leading-5 text-[#58748D]">{isPackageStep ? "Pick a service package — the deliverables scope fills in automatically and stays editable. This becomes the confirmed package record for the agent." : "Record what was done, how it was verified, or exactly what is blocking progress. Never enter passwords or API tokens."}</p>
      {isPackageStep && <div className="mt-4">
        <label className="block text-[11px] font-black uppercase tracking-wider text-[#0758C9]">Service package</label>
        <select value={packageId} onChange={(event) => pickPackage(event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#C4D5E6] bg-[#F8FBFE] px-3 py-2.5 text-sm outline-none focus:border-[#087CFA]">
          <option value="">Select a package…</option>
          {SMM_PACKAGES.map((pkg) => <option key={pkg.id} value={pkg.id}>{pkg.name} — {pkg.priceHint}</option>)}
        </select>
        {selectedPackage && <div className="mt-3 rounded-xl border border-[#BFE3F2] bg-[#EFFAFF] p-3">
          <p className="text-xs font-bold text-[#0A5B7E]">{selectedPackage.bestFor}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Chip>{selectedPackage.monthlyPosts} posts/mo</Chip><Chip>{selectedPackage.monthlyReels} reels</Chip><Chip>{selectedPackage.monthlyStories} stories</Chip>
            {selectedPackage.platforms.map((p) => <Chip key={p}>{p.replaceAll("_", " ")}</Chip>)}
          </div>
        </div>}
      </div>}
      <textarea value={evidence} onChange={(event) => setEvidence(event.target.value)} className="mt-4 min-h-32 w-full rounded-xl border border-[#C4D5E6] p-3 text-sm outline-none focus:border-[#087CFA]" placeholder={isPackageStep ? "Deliverables scope appears here after you pick a package — edit freely before confirming." : "Verification link, result, reviewer note, or blocking reason…"} /><div className="mt-4 flex flex-wrap justify-end gap-2"><button onClick={() => setEditingStep(null)} className="rounded-xl px-3 py-2 text-xs font-bold text-[#58748D]">Cancel</button><button onClick={() => updateStep("BLOCKED")} disabled={!evidence.trim() || busy.startsWith("step-")} className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700 disabled:opacity-50"><CircleAlert size={13} className="mr-1 inline" />Blocked</button><button onClick={() => updateStep("IN_PROGRESS")} disabled={busy.startsWith("step-")} className="rounded-xl bg-[#EAF4FF] px-3 py-2 text-xs font-bold text-[#0758C9]"><Play size={13} className="mr-1 inline" />In progress</button><button onClick={() => updateStep("DONE")} disabled={!evidence.trim() || busy.startsWith("step-")} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><CheckCircle2 size={13} className="mr-1 inline" />Verified done</button></div></div></div>}
  </main>;
}

function Stat({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border border-[#D4E0EC] bg-[#F8FBFE] py-2"><div className="text-lg font-black text-[#03142E]">{value}</div><div className="text-[9px] font-black uppercase tracking-wider text-[#6B839B]">{label}</div></div>; }
function Chip({ children }: { children: React.ReactNode }) { return <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#0A5B7E] ring-1 ring-[#BFE3F2]">{children}</span>; }
function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) { return <section className="rounded-2xl border border-[#C8D8EA] bg-white p-5 shadow-[0_8px_26px_rgba(3,20,46,.04)]"><h2 className="font-display text-lg font-bold">{title}</h2><p className="mt-1 text-xs leading-5 text-[#58748D]">{subtitle}</p>{children}</section>; }
function StatusBadge({ value }: { value: string }) { const tone = value === "DONE" || value === "COMPLETED" ? "bg-emerald-50 text-emerald-700" : value === "BLOCKED" || value === "FAILED" ? "bg-red-50 text-red-700" : value === "AWAITING_APPROVAL" || value === "WAITING_APPROVAL" ? "bg-amber-50 text-amber-700" : "bg-[#EAF4FF] text-[#0758C9]"; return <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${tone}`}>{value.replaceAll("_", " ")}</span>; }
function ModeBadge({ value }: { value: string }) { return <span className="rounded-full bg-[#F0ECFA] px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-[#65469A]">{value}</span>; }
