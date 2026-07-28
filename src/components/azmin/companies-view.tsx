"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AzminProfileMenu } from "@/components/azmin/profile-menu";

type CompanyRow = {
  id: string;
  name: string;
  relationshipType: string;
  industry: string | null;
  website: string | null;
  description: string | null;
  status: string;
  isHeadquarters: boolean;
  primaryColor: string;
  brandProfile: { tagline: string | null } | null;
  brain: { knowledgeStatus: string } | null;
};

const labels: Record<string, string> = {
  OWN_BRAND: "Own brand",
  CLIENT: "Agency client",
  PARTNER: "Sales / commission partner",
  JOINT_VENTURE: "Joint venture",
};

export function CompaniesView({ companies, canManage, userName, userEmail, userRole, startOpen = false }: { companies: CompanyRow[]; canManage: boolean; userName: string; userEmail: string; userRole: string; startOpen?: boolean }) {
  const [open, setOpen] = useState(startOpen);
  const active = companies.filter((company) => company.status === "ACTIVE").length;
  const configured = companies.filter((company) => company.brain?.knowledgeStatus === "CONFIGURED").length;

  return (
    <main data-azmin-ui className="min-h-screen bg-[#EAF1F9] text-[#03142E]">
      <header className="border-b border-[#C8D8EA] bg-white px-5 py-4 shadow-[0_1px_8px_rgba(3,20,46,.06)] sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <Link href="/azmin" className="flex items-center gap-3 rounded-xl focus-visible:ring-2 focus-visible:ring-[#087CFA]">
            <span className="relative h-11 w-11 overflow-hidden rounded-xl border border-[#AFC6DE] bg-[#F4FAFF] shadow-[0_8px_24px_rgba(8,124,250,.2)]">
              <Image src="/brand/azmin-c1-mark.png" alt="AZMIN" fill priority sizes="44px" className="object-contain p-0.5" />
            </span>
            <span>
              <strong className="block font-display text-[15px] font-bold text-[#03142E]">AZMIN Digital OS</strong>
              <span className="mt-0.5 block text-[11px] font-extrabold uppercase tracking-[.17em] text-[#456784]">Company management</span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/azmin" className="hidden rounded-xl border border-[#B8CCE0] bg-[#F8FBFF] px-4 py-2.5 text-xs font-bold text-[#234B70] transition hover:border-[#087CFA] hover:text-[#0758C9] sm:block">Command center</Link>
            <AzminProfileMenu name={userName} email={userEmail} role={userRole} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 pb-14 pt-6 sm:px-8 sm:pt-8">
        <section className="relative overflow-hidden rounded-[28px] bg-[#031A3B] px-6 py-7 text-white shadow-[0_20px_55px_rgba(3,26,59,.24)] sm:px-8 sm:py-9 lg:px-10">
          <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-[#087CFA]/35 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-8rem] left-1/3 h-64 w-64 rounded-full bg-[#22D3EE]/20 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#70E4FF]/40 bg-[#0A3767] px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[.15em] text-[#9EECFF]">
                <span className="h-2 w-2 rounded-full bg-[#22D3EE] shadow-[0_0_0_4px_rgba(34,211,238,.16)]" />
                Phase 1 - Multi-company foundation
              </div>
              <h1 className="mt-4 font-display text-4xl font-bold tracking-[-.045em] text-white sm:text-5xl">Your business portfolio</h1>
              <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[#D5E5F3]">
                Manage AZMIN, every client, and every sales partner from one clear view while keeping their data, brand rules, and AI instructions completely separated.
              </p>
            </div>
            {canManage && (
              <button onClick={() => setOpen(true)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#22D3EE] px-5 py-3 text-sm font-extrabold text-[#03142E] shadow-[0_12px_32px_rgba(34,211,238,.28)] transition hover:-translate-y-0.5 hover:bg-[#70E4FF]">
                <span className="text-lg leading-none">+</span> Add company
              </button>
            )}
          </div>
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-3">
          <Summary value={companies.length} label="Total companies" helper="All managed business identities" tone="blue" />
          <Summary value={active} label="Active companies" helper="Available for current operations" tone="cyan" />
          <Summary value={configured} label="Brains configured" helper="AI context is ready and isolated" tone="navy" />
        </section>

        <section className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
          <div className="rounded-[24px] border border-[#C8D8EA] bg-white p-5 shadow-[0_14px_40px_rgba(3,20,46,.08)] sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#DCE7F2] pb-5">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[.15em] text-[#0758C9]">Company directory</p>
                <h2 className="mt-1 font-display text-2xl font-bold tracking-[-.03em]">Managed companies</h2>
                <p className="mt-1 text-sm text-[#4C6A86]">Select a company to manage its profile and private AI context.</p>
              </div>
              <span className="rounded-full bg-[#E3EFFC] px-3 py-1.5 text-xs font-extrabold text-[#174F82]">{companies.length} total</span>
            </div>
            <div className="mt-4 space-y-3">
              {companies.map((company) => <CompanyCard key={company.id} company={company} />)}
              {!companies.length && (
                <div className="rounded-2xl border-2 border-dashed border-[#AFC6DE] bg-[#F5F9FE] px-6 py-12 text-center">
                  <h3 className="font-display text-xl font-bold">Create your first company</h3>
                  <p className="mt-2 text-sm font-medium text-[#4C6A86]">Start with AZMIN Digital, then add clients and partners separately.</p>
                  {canManage && <button onClick={() => setOpen(true)} className="mt-5 rounded-xl bg-[#087CFA] px-5 py-2.5 text-sm font-bold text-white">Add company</button>}
                </div>
              )}
            </div>
          </div>

          <aside className="rounded-[24px] border border-[#0B4177] bg-[#06264D] p-6 text-white shadow-[0_16px_45px_rgba(3,20,46,.16)]">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#22D3EE] text-lg font-black text-[#03142E]">AI</div>
            <p className="mt-5 text-[11px] font-extrabold uppercase tracking-[.16em] text-[#70E4FF]">Built for safe automation</p>
            <h2 className="mt-2 font-display text-xl font-bold">Every company stays independent.</h2>
            <p className="mt-3 text-sm leading-6 text-[#C7DCEC]">AZMIN agents load only the active company&apos;s approved information and instructions.</p>
            <ul className="mt-6 space-y-4">
              <SafetyItem title="Separate brand profiles" detail="Voice, audiences, services, and content rules." />
              <SafetyItem title="Private Company Brain" detail="Facts and AI instructions never mix." />
              <SafetyItem title="Server-side protection" detail="Every request is checked against your workspace." />
            </ul>
            <div className="mt-6 rounded-xl border border-[#2D5A83] bg-[#0B3561] px-4 py-3 text-xs font-semibold leading-5 text-[#D9E9F5]">Next: connect projects, services, leads, and content to the selected company.</div>
          </aside>
        </section>
      </div>
      {open && <NewCompanyDialog onClose={() => setOpen(false)} />}
    </main>
  );
}

function Summary({ value, label, helper, tone }: { value: number; label: string; helper: string; tone: "blue" | "cyan" | "navy" }) {
  const styles = {
    blue: "border-l-[#087CFA]",
    cyan: "border-l-[#13BFD9]",
    navy: "border-l-[#031A3B]",
  };
  return (
    <div className={`rounded-2xl border border-[#C8D8EA] border-l-4 ${styles[tone]} bg-white px-5 py-5 shadow-[0_10px_28px_rgba(3,20,46,.07)]`}>
      <div className="text-3xl font-black tabular-nums text-[#03142E]">{value}</div>
      <div className="mt-1 text-xs font-extrabold uppercase tracking-[.08em] text-[#234B70]">{label}</div>
      <div className="mt-1.5 text-xs font-medium text-[#45647F]">{helper}</div>
    </div>
  );
}

function CompanyCard({ company }: { company: CompanyRow }) {
  const brainReady = company.brain?.knowledgeStatus === "CONFIGURED";
  return (
    <Link href={`/azmin/companies/${company.id}`} className="group flex flex-col gap-4 rounded-2xl border border-[#BFD1E3] bg-[#F9FBFE] p-4 transition hover:border-[#087CFA] hover:bg-white hover:shadow-[0_12px_30px_rgba(8,124,250,.12)] sm:flex-row sm:items-center sm:p-5">
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-base font-black text-white shadow-md" style={{ background: `linear-gradient(135deg, ${company.primaryColor}, #0758C9)` }}>{initials(company.name)}</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-lg font-bold text-[#03142E]">{company.name}</h3>
          {company.isHeadquarters && <span className="rounded-full bg-[#CFF5FF] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#084E78]">Headquarters</span>}
        </div>
        <p className="mt-1 text-sm font-semibold text-[#41617E]">{labels[company.relationshipType] || company.relationshipType}{company.industry ? ` | ${company.industry}` : ""}</p>
        <p className="mt-2 line-clamp-1 text-sm text-[#45647F]">{company.brandProfile?.tagline || company.description || "Add company positioning and brand details."}</p>
      </div>
      <div className="flex shrink-0 items-center justify-between gap-4 border-t border-[#DCE7F2] pt-3 sm:block sm:min-w-36 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0 sm:text-right">
        <span className={`inline-flex rounded-full px-3 py-1.5 text-[11px] font-extrabold ${brainReady ? "bg-[#CFF5FF] text-[#084E78]" : "bg-[#E7EDF4] text-[#405E78]"}`}>{brainReady ? "Brain ready" : "Setup required"}</span>
        <span className="mt-0 block text-xs font-extrabold text-[#0758C9] sm:mt-3">Open workspace <span aria-hidden="true">-&gt;</span></span>
      </div>
    </Link>
  );
}

function SafetyItem({ title, detail }: { title: string; detail: string }) {
  return <li className="flex gap-3"><span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#22D3EE] text-xs font-black text-[#03142E]">OK</span><span><strong className="block text-sm">{title}</strong><span className="mt-0.5 block text-xs leading-5 text-[#AFC9DD]">{detail}</span></span></li>;
}

function NewCompanyDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", relationshipType: "CLIENT", industry: "", website: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const response = await fetch("/api/companies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) { setError(data.error || "Could not create the company."); return; }
    await fetch("/api/company-context", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId: data.id }),
    });
    router.push(`/azmin/companies/${data.id}`);
    router.refresh();
  }

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#020B1F]/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <form onSubmit={submit} className="w-full max-w-xl rounded-[26px] border border-[#BFD1E3] bg-white p-6 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-xs font-extrabold uppercase tracking-[.14em] text-[#0758C9]">Quick onboarding</p><h2 className="mt-1 font-display text-2xl font-bold">Add a company</h2><p className="mt-1 text-sm font-medium text-[#536F89]">Only five essential fields. Configure the Company Brain next.</p></div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#C8D8EA] bg-[#EDF3F9] text-xl font-bold text-[#234B70]">X</button>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Company name" required><input autoFocus required minLength={2} value={form.name} onChange={(e) => update("name", e.target.value)} className={inputClass} placeholder="e.g. Acme Trading" /></Field>
          <Field label="Relationship" required><select value={form.relationshipType} onChange={(e) => update("relationshipType", e.target.value)} className={inputClass}><option value="OWN_BRAND">Own brand</option><option value="CLIENT">Agency client</option><option value="PARTNER">Sales / commission partner</option><option value="JOINT_VENTURE">Joint venture</option></select></Field>
          <Field label="Industry"><input value={form.industry} onChange={(e) => update("industry", e.target.value)} className={inputClass} placeholder="e.g. Technology" /></Field>
          <Field label="Website"><input type="url" value={form.website} onChange={(e) => update("website", e.target.value)} className={inputClass} placeholder="https://example.com" /></Field>
          <div className="sm:col-span-2"><Field label="What does this company do?"><textarea value={form.description} onChange={(e) => update("description", e.target.value)} className={inputClass + " min-h-24 resize-y"} placeholder="A short business description..." /></Field></div>
        </div>
        {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
        <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-bold text-[#405E78]">Cancel</button><button disabled={saving || !form.name.trim()} className="rounded-xl bg-[#087CFA] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(8,124,250,.22)] disabled:opacity-50">{saving ? "Creating..." : "Create company"}</button></div>
      </form>
    </div>
  );
}

const inputClass = "mt-1.5 w-full rounded-xl border border-[#AFC6DE] bg-white px-3 py-2.5 text-sm text-[#03142E] outline-none transition placeholder:text-[#7890A6] focus:border-[#087CFA] focus:ring-2 focus:ring-[#087CFA]/15";
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) { return <label className="block text-xs font-extrabold text-[#294E6E]">{label}{required && <span className="text-[#0758C9]"> *</span>}{children}</label>; }
function initials(value: string) { return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase(); }
