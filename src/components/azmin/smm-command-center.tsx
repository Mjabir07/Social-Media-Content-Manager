"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowRight, Bot, Building2, CalendarDays, CheckCircle2, CircleAlert, Plus, Radio, Sparkles } from "lucide-react";
import { AzminProfileMenu } from "@/components/azmin/profile-menu";

type Account = {
  id: string; status: string; onboardingStep: number; timezone: string; goals: string[]; platforms: string[];
  approvalMode: string; agentEnabled: boolean; agentMode: string; nextAgentRunAt: string | null;
  company: { id: string; name: string; primaryColor: string; brandReady: boolean };
  client: { id: string; name: string; email: string | null };
  lead: { id: string; name: string; stage: string } | null;
  campaignCount: number; activeCampaigns: number; pillarCount: number; connectedChannels: number;
  scheduledPosts: number; publishedPosts: number; failedPosts: number;
};
type AvailableClient = { id: string; name: string; email: string | null; phone: string | null; domain: string | null };

export function SmmCommandCenter({ accounts, availableClients, canManage, userName, userEmail, userRole }: {
  accounts: Account[]; availableClients: AvailableClient[]; canManage: boolean; userName: string; userEmail: string; userRole: string;
}) {
  const router = useRouter();
  const [showOnboard, setShowOnboard] = useState(false);
  const [clientId, setClientId] = useState(availableClients[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const totals = useMemo(() => accounts.reduce((sum, account) => ({
    scheduled: sum.scheduled + account.scheduledPosts,
    published: sum.published + account.publishedPosts,
    failures: sum.failures + account.failedPosts,
    connections: sum.connections + account.connectedChannels,
  }), { scheduled: 0, published: 0, failures: 0, connections: 0 }), [accounts]);

  async function onboard() {
    if (!clientId) return;
    setBusy(true); setError("");
    const response = await fetch("/api/smm/onboard", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientId }) });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) { setError(data.error || "Could not onboard this client."); return; }
    setShowOnboard(false); router.refresh();
  }

  return <main data-azmin-ui className="min-h-screen bg-[#EAF1F9] text-[#03142E]">
    <header className="border-b border-[#C8D8EA] bg-white px-5 py-4 shadow-[0_1px_8px_rgba(3,20,46,.06)] sm:px-8">
      <div className="mx-auto flex max-w-[1450px] items-center gap-3">
        <Link href="/azmin" className="flex items-center gap-3"><span className="relative h-10 w-10"><Image src="/brand/azmin-c1-mark.png" alt="AZMIN" fill priority sizes="40px" className="object-contain" /></span><span><strong className="block font-display text-[15px] font-bold">AZMIN Digital OS</strong><span className="block text-[11px] font-extrabold uppercase tracking-[.17em] text-[#456784]">SMM Command Center</span></span></Link>
        <nav className="ml-auto hidden items-center gap-1 md:flex"><Link href="/azmin/leads" className="rounded-xl px-3 py-2 text-xs font-bold text-[#405E78] hover:bg-[#EDF4FB]">Lead funnel</Link><Link href="/azmin/publishing" className="rounded-xl px-3 py-2 text-xs font-bold text-[#405E78] hover:bg-[#EDF4FB]">Publishing</Link></nav>
        <AzminProfileMenu name={userName} email={userEmail} role={userRole} />
      </div>
    </header>

    <div className="mx-auto max-w-[1450px] px-5 pb-16 pt-7 sm:px-8">
      <section className="overflow-hidden rounded-[28px] bg-[#03142E] text-white shadow-[0_24px_70px_rgba(3,20,46,.22)]">
        <div className="grid gap-8 p-7 lg:grid-cols-[1.35fr_.65fr] lg:p-10">
          <div><p className="text-[11px] font-black uppercase tracking-[.18em] text-[#61DFF5]">Multi-company social operations</p><h1 className="mt-2 max-w-3xl font-display text-4xl font-bold tracking-[-.045em]">One agent-ready command center for every SMM client.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#AFC5D7]">Move won leads into delivery automatically, complete each brand setup, approve strategy, and operate publishing from one auditable workflow.</p>
            {canManage && <button onClick={() => setShowOnboard(true)} disabled={!availableClients.length} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#087CFA] px-5 py-3 text-sm font-extrabold text-white shadow-[0_10px_30px_rgba(8,124,250,.3)] disabled:opacity-50"><Plus size={16} /> Onboard SMM client</button>}
          </div>
          <div className="grid grid-cols-2 gap-3"><HeroMetric label="SMM clients" value={accounts.length} /><HeroMetric label="Connected channels" value={totals.connections} /><HeroMetric label="Scheduled" value={totals.scheduled} /><HeroMetric label="Needs attention" value={totals.failures} alert={totals.failures > 0} /></div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <FlowCard icon={<Building2 size={18} />} step="01" title="Onboard" detail="Lead/client → company and brand shell" />
        <FlowCard icon={<Sparkles size={18} />} step="02" title="Prepare" detail="Brand Brain, goals and content pillars" />
        <FlowCard icon={<CalendarDays size={18} />} step="03" title="Plan" detail="Campaigns, calendar and approvals" />
        <FlowCard icon={<Radio size={18} />} step="04" title="Operate" detail="Publish, engage, measure and improve" />
      </section>

      <div className="mt-8 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[11px] font-black uppercase tracking-[.15em] text-[#0758C9]">Client portfolio</p><h2 className="mt-1 font-display text-2xl font-bold">SMM accounts</h2></div><p className="text-xs font-semibold text-[#58748D]">{availableClients.length} CRM client{availableClients.length === 1 ? "" : "s"} available to onboard</p></div>

      {accounts.length ? <section className="mt-4 grid gap-4 lg:grid-cols-2">{accounts.map((account) => <AccountCard key={account.id} account={account} />)}</section> : <section className="mt-4 rounded-3xl border border-dashed border-[#AFC6DE] bg-white px-6 py-16 text-center"><Bot className="mx-auto text-[#087CFA]" size={38} /><h3 className="mt-4 font-display text-xl font-bold">No SMM clients onboarded yet</h3><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#58748D]">Win an SMM lead or onboard an existing CRM client. AZMIN will create the isolated company context and starter content pillars automatically.</p></section>}
    </div>

    {showOnboard && <div className="fixed inset-0 z-50 grid place-items-center bg-[#020B1F]/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true"><div className="w-full max-w-lg rounded-[24px] bg-white p-6 shadow-2xl"><p className="text-[11px] font-black uppercase tracking-[.15em] text-[#0758C9]">Direct onboarding</p><h2 className="mt-1 font-display text-2xl font-bold">Select an existing CRM client</h2><p className="mt-2 text-sm leading-6 text-[#58748D]">The client is kept for billing; a linked Company is created or reused for isolated brand knowledge and social operations.</p><label className="mt-5 block text-xs font-bold text-[#476987]">Client<select value={clientId} onChange={(event) => setClientId(event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#AFC6DE] bg-white px-3 py-3 text-sm outline-none focus:border-[#087CFA]">{availableClients.map((client) => <option key={client.id} value={client.id}>{client.name}{client.domain ? ` · ${client.domain}` : ""}</option>)}</select></label>{error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}<div className="mt-6 flex justify-end gap-2"><button onClick={() => setShowOnboard(false)} className="rounded-xl px-4 py-2.5 text-sm font-bold text-[#405E78]">Cancel</button><button onClick={onboard} disabled={busy || !clientId} className="rounded-xl bg-[#087CFA] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy ? "Onboarding…" : "Create SMM account"}</button></div></div></div>}
  </main>;
}

function AccountCard({ account }: { account: Account }) {
  const setup = [account.company.brandReady, account.pillarCount > 0, account.connectedChannels > 0, account.activeCampaigns > 0];
  const completed = setup.filter(Boolean).length;
  return <article className="overflow-hidden rounded-3xl border border-[#C8D8EA] bg-white shadow-[0_12px_38px_rgba(3,20,46,.06)]"><div className="h-1.5" style={{ background: account.company.primaryColor }} /><div className="p-5 sm:p-6"><div className="flex items-start gap-3"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-sm font-black text-white" style={{ background: account.company.primaryColor }}>{initials(account.company.name)}</span><div className="min-w-0"><h3 className="truncate font-display text-xl font-bold">{account.company.name}</h3><p className="mt-0.5 truncate text-xs text-[#58748D]">{account.client.email || "CRM client"}{account.lead ? " · onboarded from won lead" : " · direct onboarding"}</p></div><span className={`ml-auto rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${account.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{account.status}</span></div>
    <div className="mt-5 grid grid-cols-4 gap-2"><MiniMetric label="Channels" value={account.connectedChannels} /><MiniMetric label="Campaigns" value={account.campaignCount} /><MiniMetric label="Scheduled" value={account.scheduledPosts} /><MiniMetric label="Published" value={account.publishedPosts} /></div>
    <div className="mt-5 rounded-2xl bg-[#F3F7FB] p-4"><div className="flex items-center justify-between text-xs"><strong>Onboarding readiness</strong><span className="font-black text-[#0758C9]">{completed}/4</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#D9E5F0]"><div className="h-full rounded-full bg-[#087CFA]" style={{ width: `${completed * 25}%` }} /></div><div className="mt-3 grid gap-1.5 text-[11px] font-semibold text-[#496A86]"><Check ok={setup[0]} text="Brand Brain ready" /><Check ok={setup[1]} text={`${account.pillarCount} content pillars`} /><Check ok={setup[2]} text="Social channel connected" /><Check ok={setup[3]} text="Active campaign" /></div></div>
    <div className="mt-4 flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1.5 rounded-full bg-[#EDE8FF] px-2.5 py-1 text-[10px] font-black uppercase text-[#5C3AAE]"><Bot size={11} /> {account.agentMode.replaceAll("_", " ")}</span>{account.failedPosts > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-black uppercase text-red-700"><CircleAlert size={11} /> {account.failedPosts} failures</span>}</div>
    <div className="mt-5 flex items-center justify-between border-t border-[#E3ECF5] pt-4"><Link href={`/azmin/companies/${account.company.id}`} className="text-xs font-bold text-[#58748D] hover:text-[#0758C9]">Complete brand setup</Link><Link href={`/azmin/publishing?company=${account.company.id}`} className="inline-flex items-center gap-1.5 rounded-xl bg-[#031A3B] px-3.5 py-2.5 text-xs font-extrabold text-white">Open publishing <ArrowRight size={13} /></Link></div></div></article>;
}
function HeroMetric({ label, value, alert = false }: { label: string; value: number; alert?: boolean }) { return <div className="rounded-2xl border border-white/10 bg-white/[.07] p-4"><div className={`font-display text-3xl font-bold ${alert ? "text-[#FFB4A9]" : "text-white"}`}>{value}</div><div className="mt-1 text-[10px] font-black uppercase tracking-wider text-[#9EB5C7]">{label}</div></div>; }
function FlowCard({ icon, step, title, detail }: { icon: React.ReactNode; step: string; title: string; detail: string }) { return <div className="rounded-2xl border border-[#C8D8EA] bg-white p-4"><div className="flex items-center gap-2 text-[#0758C9]">{icon}<span className="text-[10px] font-black uppercase tracking-wider">Step {step}</span></div><h3 className="mt-2 font-display text-lg font-bold">{title}</h3><p className="mt-1 text-xs leading-5 text-[#58748D]">{detail}</p></div>; }
function MiniMetric({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border border-[#D9E5F0] bg-[#FAFCFE] px-2 py-2.5 text-center"><strong className="block text-lg">{value}</strong><span className="text-[9px] font-black uppercase tracking-wide text-[#6A8399]">{label}</span></div>; }
function Check({ ok, text }: { ok: boolean; text: string }) { return <span className="flex items-center gap-1.5">{ok ? <CheckCircle2 size={13} className="text-emerald-600" /> : <span className="h-3 w-3 rounded-full border border-[#9EB5C7]" />}{text}</span>; }
function initials(value: string) { return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase(); }
