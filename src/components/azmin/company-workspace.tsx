"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Company = {
  id: string; name: string; relationshipType: string; industry: string | null; website: string | null;
  description: string | null; status: string; isHeadquarters: boolean; primaryColor: string; accentColor: string;
  brandProfile: { tagline: string | null; brandVoice: string | null; targetAudiences: string[]; offerings: string[]; differentiators: string[]; contentRules: string | null } | null;
  brain: { companyFacts: string | null; salesGuidance: string | null; contentGuidance: string | null; aiInstructions: string | null; knowledgeStatus: string } | null;
};

const relationshipLabels: Record<string, string> = { OWN_BRAND: "Own brand", CLIENT: "Agency client", PARTNER: "Sales / commission partner", JOINT_VENTURE: "Joint venture" };
type ResearchResult = {
  confidence: "low" | "medium" | "high";
  method: "company_website" | "gemini_google_search" | "anthropic_web_search";
  provider: "gemini" | "anthropic";
  sources: { url: string; title: string }[];
};

type Tab = "overview" | "brand" | "brain";

export function CompanyWorkspace({ company, canManage, isActive }: { company: Company; canManage: boolean; isActive: boolean }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [saving, setSaving] = useState(false);
  const [activating, setActivating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [research, setResearch] = useState<ResearchResult | null>(null);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: company.name, relationshipType: company.relationshipType, industry: company.industry || "", website: company.website || "", description: company.description || "",
    tagline: company.brandProfile?.tagline || "", brandVoice: company.brandProfile?.brandVoice || "", targetAudiences: (company.brandProfile?.targetAudiences || []).join("\n"),
    offerings: (company.brandProfile?.offerings || []).join("\n"), differentiators: (company.brandProfile?.differentiators || []).join("\n"), contentRules: company.brandProfile?.contentRules || "",
    companyFacts: company.brain?.companyFacts || "", salesGuidance: company.brain?.salesGuidance || "", contentGuidance: company.brain?.contentGuidance || "", aiInstructions: company.brain?.aiInstructions || "",
  });
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const lines = (value: string) => value.split("\n").map((item) => item.trim()).filter(Boolean);

  async function save() {
    setSaving(true); setMessage("");
    const response = await fetch(`/api/companies/${company.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      ...form, targetAudiences: lines(form.targetAudiences), offerings: lines(form.offerings), differentiators: lines(form.differentiators),
    }) });
    setSaving(false);
    if (response.ok) { setMessage("Company updated successfully."); router.refresh(); } else { const data = await response.json().catch(() => ({})); setMessage(data.error || "Could not save"); }
  }

  async function activateCompany() {
    setActivating(true);
    setMessage("");
    const response = await fetch("/api/company-context", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId: company.id }),
    });
    setActivating(false);
    if (!response.ok) {
      setMessage("Could not activate this company.");
      return;
    }
    setMessage("Company context activated.");
    router.refresh();
  }

  async function analyzeWebsite() {
    if (!form.website.trim()) {
      setMessage("Add the public company website first.");
      setTab("overview");
      return;
    }
    setAnalyzing(true);
    setMessage("");
    setResearch(null);
    const response = await fetch(`/api/companies/${company.id}/enrich`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ website: form.website }),
    });
    const data = await response.json().catch(() => ({}));
    setAnalyzing(false);
    if (!response.ok) {
      setMessage(data.error || "Could not analyze this website.");
      return;
    }
    const draft = data.draft;
    setForm((current) => ({
      ...current,
      tagline: draft.tagline,
      brandVoice: draft.brandVoice,
      targetAudiences: draft.targetAudiences.join("\n"),
      offerings: draft.offerings.join("\n"),
      differentiators: draft.differentiators.join("\n"),
      contentRules: draft.contentRules,
      companyFacts: draft.companyFacts,
      salesGuidance: draft.salesGuidance,
      contentGuidance: draft.contentGuidance,
      aiInstructions: draft.aiInstructions,
    }));
    setResearch({
      confidence: draft.confidence,
      method: data.researchMethod,
      provider: data.provider,
      sources: data.sources,
    });
    setMessage("AI research draft is ready. Review every field, then save.");
    setTab("brand");
  }

  return <main data-azmin-ui className="min-h-screen bg-[#EAF1F9] text-[#03142E]">
    <header className="border-b border-[#C8D8EA] bg-white/90 px-5 py-4 backdrop-blur-xl sm:px-8">
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <Link href="/azmin" className="relative h-10 w-10 overflow-hidden rounded-xl border border-[#C8D8EA] bg-[#F4FAFF]"><Image src="/brand/azmin-c1-mark.png" alt="AZMIN" fill priority sizes="40px" className="object-contain p-0.5" /></Link>
        <span className="text-[#A0B1C2]">/</span><Link href="/azmin/companies" className="text-sm font-bold text-[#405E78]">Companies</Link><span className="text-[#A0B1C2]">/</span><span className="truncate text-sm font-bold">{company.name}</span>
        <div className="ml-auto">
          {isActive ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-[#DDF5FF] px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-[#0758C9]"><span className="h-2 w-2 rounded-full bg-[#18BFD5]" />Active company</span>
          ) : (
            <button type="button" onClick={activateCompany} disabled={activating} className="rounded-xl bg-[#087CFA] px-4 py-2.5 text-xs font-extrabold text-white shadow-[0_8px_22px_rgba(8,124,250,.2)] disabled:opacity-50">{activating ? "Activating..." : "Use this company"}</button>
          )}
        </div>
      </div>
    </header>

    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
      <section className="overflow-hidden rounded-3xl bg-[#03142E] text-white shadow-[0_20px_60px_rgba(3,20,46,.2)]">
        <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${company.primaryColor}, ${company.accentColor})` }} />
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
          <span className="grid h-16 w-16 place-items-center rounded-2xl text-xl font-black text-white shadow-lg" style={{ background: company.primaryColor }}>{initials(company.name)}</span>
          <div><div className="flex flex-wrap items-center gap-2"><h1 className="font-display text-3xl font-bold tracking-[-.04em]">{company.name}</h1>{company.isHeadquarters && <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-black uppercase">AZMIN HQ</span>}</div><p className="mt-2 text-sm text-[#9EB5C7]">{relationshipLabels[company.relationshipType]}{company.industry ? ` | ${company.industry}` : ""}</p></div>
          <div className="sm:ml-auto"><div className="text-[11px] font-bold uppercase tracking-[.14em] text-[#70E4FF]">Company Brain</div><div className="mt-1 text-sm font-semibold">{company.brain?.knowledgeStatus === "CONFIGURED" ? "Configured and isolated" : "Setup required"}</div></div>
        </div>
      </section>

      <nav className="mt-6 flex gap-2 overflow-x-auto rounded-2xl border border-[#C8D8EA] bg-white p-1.5">
        <TabButton active={tab === "overview"} onClick={() => setTab("overview")}>Overview</TabButton>
        <TabButton active={tab === "brand"} onClick={() => setTab("brand")}>Brand profile</TabButton>
        <TabButton active={tab === "brain"} onClick={() => setTab("brain")}>Company Brain</TabButton>
      </nav>

      {canManage && (
        <section className="mt-5 rounded-2xl border border-[#9DDDF0] bg-gradient-to-r from-[#E9FAFF] to-[#F6FBFF] p-4 shadow-[0_10px_30px_rgba(3,20,46,.05)] sm:flex sm:items-center sm:gap-5 sm:p-5">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-[.15em] text-[#0758C9]">AI company research</p>
            <h2 className="mt-1 font-display text-lg font-bold">Build the profile from the company website</h2>
            <p className="mt-1 text-sm leading-6 text-[#476987]">AZMIN sends public website content to the configured AI and prepares an editable Brand Profile and Company Brain draft. Private AZMIN relationship details stay excluded, and nothing is saved without your review.</p>
          </div>
          <button type="button" onClick={analyzeWebsite} disabled={analyzing} className="mt-4 inline-flex min-w-48 items-center justify-center rounded-xl bg-[#031A3B] px-5 py-3 text-sm font-extrabold text-white shadow-[0_10px_26px_rgba(3,26,59,.18)] transition hover:bg-[#0758C9] disabled:cursor-wait disabled:opacity-60 sm:mt-0">
            {analyzing ? "Researching website..." : "Analyze website with AI"}
          </button>
        </section>
      )}

      {research && (
        <section className="mt-4 rounded-2xl border border-[#B8D5E8] bg-white px-4 py-3 text-sm text-[#355B78]" aria-live="polite">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="text-[#03142E]">AI draft ready for review</strong>
            <span className="rounded-full bg-[#DDF5FF] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#0758C9]">{research.confidence} confidence</span>
            <span className="rounded-full bg-[#EAF0F6] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#476987]">{research.method === "company_website" ? "Official website" : "Cited web search"}</span>
            <span className="rounded-full bg-[#EDE8FF] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#5C3AAE]">{research.provider === "gemini" ? "Gemini" : "Anthropic"}</span>
          </div>
          <p className="mt-1 text-xs leading-5">Public sources: {research.sources.map((source, index) => <span key={source.url}>{index ? ", " : ""}<a href={source.url} target="_blank" rel="noreferrer" className="font-bold text-[#0758C9] hover:underline">{source.title || new URL(source.url).hostname}</a></span>)}</p>
        </section>
      )}

      <section className="mt-5 rounded-3xl border border-[#C8D8EA] bg-white p-6 shadow-[0_12px_40px_rgba(3,20,46,.05)] sm:p-8">
        {tab === "overview" && <div><SectionTitle title="Company overview" subtitle="Basic identity and relationship with AZMIN." /><div className="mt-6 grid gap-5 sm:grid-cols-2"><Field label="Company name"><input disabled={!canManage} value={form.name} onChange={(e) => update("name", e.target.value)} className={inputClass} /></Field><Field label="Relationship"><select disabled={!canManage} value={form.relationshipType} onChange={(e) => update("relationshipType", e.target.value)} className={inputClass}><option value="OWN_BRAND">Own brand</option><option value="CLIENT">Agency client</option><option value="PARTNER">Sales / commission partner</option><option value="JOINT_VENTURE">Joint venture</option></select></Field><Field label="Industry"><input disabled={!canManage} value={form.industry} onChange={(e) => update("industry", e.target.value)} className={inputClass} /></Field><Field label="Website"><input disabled={!canManage} type="url" value={form.website} onChange={(e) => update("website", e.target.value)} className={inputClass} /></Field><div className="sm:col-span-2"><Field label="Business description"><textarea disabled={!canManage} value={form.description} onChange={(e) => update("description", e.target.value)} className={inputClass + " min-h-28"} /></Field></div></div></div>}
        {tab === "brand" && <div><SectionTitle title="Brand profile" subtitle="How AZMIN agents should understand and represent this brand." /><div className="mt-6 grid gap-5 sm:grid-cols-2"><Field label="Tagline"><input disabled={!canManage} value={form.tagline} onChange={(e) => update("tagline", e.target.value)} className={inputClass} /></Field><Field label="Brand voice"><textarea disabled={!canManage} value={form.brandVoice} onChange={(e) => update("brandVoice", e.target.value)} className={inputClass + " min-h-24"} placeholder="Professional, confident, clear..." /></Field><Field label="Target audiences (one per line)"><textarea disabled={!canManage} value={form.targetAudiences} onChange={(e) => update("targetAudiences", e.target.value)} className={inputClass + " min-h-32"} /></Field><Field label="Services / offerings (one per line)"><textarea disabled={!canManage} value={form.offerings} onChange={(e) => update("offerings", e.target.value)} className={inputClass + " min-h-32"} /></Field><Field label="Differentiators (one per line)"><textarea disabled={!canManage} value={form.differentiators} onChange={(e) => update("differentiators", e.target.value)} className={inputClass + " min-h-32"} /></Field><Field label="Content rules"><textarea disabled={!canManage} value={form.contentRules} onChange={(e) => update("contentRules", e.target.value)} className={inputClass + " min-h-32"} placeholder="Words, claims, styles, or topics to use or avoid..." /></Field></div></div>}
        {tab === "brain" && <div><SectionTitle title="Company Brain" subtitle="Private AI instructions scoped only to this company. They are never shared with another company." /><div className="mt-4 rounded-2xl border border-[#B9E9FA] bg-[#ECFAFF] px-4 py-3 text-xs leading-5 text-[#17577A]"><strong>Isolation rule:</strong> every read and update requires both this company ID and your AZMIN workspace ID.</div><div className="mt-6 grid gap-5 sm:grid-cols-2"><Field label="Approved company facts"><textarea disabled={!canManage} value={form.companyFacts} onChange={(e) => update("companyFacts", e.target.value)} className={inputClass + " min-h-40"} placeholder="Facts, locations, services, pricing principles..." /></Field><Field label="AI operating instructions"><textarea disabled={!canManage} value={form.aiInstructions} onChange={(e) => update("aiInstructions", e.target.value)} className={inputClass + " min-h-40"} placeholder="Always do..., never do..., ask approval before..." /></Field><Field label="Sales guidance"><textarea disabled={!canManage} value={form.salesGuidance} onChange={(e) => update("salesGuidance", e.target.value)} className={inputClass + " min-h-32"} placeholder="Lead qualification, objections, commission rules..." /></Field><Field label="Content guidance"><textarea disabled={!canManage} value={form.contentGuidance} onChange={(e) => update("contentGuidance", e.target.value)} className={inputClass + " min-h-32"} placeholder="Themes, formats, calls to action..." /></Field></div></div>}
        {canManage && <div className="mt-7 flex items-center justify-end gap-3 border-t border-[#E4ECF5] pt-5">{message && <span className={`text-xs font-bold ${message.includes("successfully") || message.includes("activated") || message.includes("ready") ? "text-emerald-600" : "text-red-600"}`}>{message}</span>}<button onClick={save} disabled={saving || analyzing} className="rounded-xl bg-[#087CFA] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(8,124,250,.2)] disabled:opacity-50">{saving ? "Saving..." : "Save company"}</button></div>}
      </section>
    </div>
  </main>;
}

const inputClass = "mt-1.5 w-full rounded-xl border border-[#CEDBE9] bg-[#F8FAFD] px-3 py-2.5 text-sm outline-none transition focus:border-[#087CFA] focus:ring-2 focus:ring-[#087CFA]/10 disabled:opacity-70";
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-xs font-bold text-[#476987]">{label}{children}</label>; }
function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) { return <div><p className="text-[11px] font-bold uppercase tracking-[.15em] text-[#087CFA]">Company workspace</p><h2 className="mt-1 font-display text-xl font-bold">{title}</h2><p className="mt-1 text-sm text-[#4C6A86]">{subtitle}</p></div>; }
function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button onClick={onClick} className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition ${active ? "bg-[#03142E] text-white" : "text-[#405E78] hover:bg-[#F1F5FA]"}`}>{children}</button>; }
function initials(value: string) { return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase(); }
