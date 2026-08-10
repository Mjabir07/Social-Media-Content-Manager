"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Sparkles, Trash2, X } from "lucide-react";
import { AzminProfileMenu } from "@/components/azmin/profile-menu";
import { LEAD_STAGES, leadTemperature, stageMeta, type LeadStage } from "@/lib/leads-catalog";

type Lead = {
  id: string; name: string; email: string | null; phone: string | null; source: string | null;
  serviceId: string | null; companyId: string | null; valueCents: number | null; currency: string;
  notes: string | null; stage: LeadStage; score: number | null; aiSummary: string | null;
  clientId: string | null; wonAt: string | null;
};
type Ref = { id: string; name: string; category?: string };

type Draft = { name: string; email: string; phone: string; source: string; companyId: string; serviceId: string; partnershipId: string; value: string; notes: string };
const emptyDraft: Draft = { name: "", email: "", phone: "", source: "", companyId: "", serviceId: "", partnershipId: "", value: "", notes: "" };

export function LeadsView({ leads, companies, services, partners, canManage, userName, userEmail, userRole }: {
  leads: Lead[]; companies: Ref[]; services: Ref[]; partners: Ref[]; canManage: boolean; userName: string; userEmail: string; userRole: string;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState<string>("");
  const [error, setError] = useState("");

  async function call(url: string, method: string, body?: unknown, tag = "x") {
    setBusy(tag); setError("");
    const res = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
    setBusy("");
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || "Something went wrong."); return false; }
    router.refresh();
    return true;
  }

  async function addLead() {
    if (!draft) return;
    const valueCents = draft.value.trim() === "" ? null : Math.round(Number(draft.value) * 100);
    const ok = await call("/api/leads", "POST", {
      name: draft.name, email: draft.email || null, phone: draft.phone || null, source: draft.source || null,
      companyId: draft.companyId || null, serviceId: draft.serviceId || null, partnershipId: draft.partnershipId || null,
      valueCents: Number.isFinite(valueCents as number) ? valueCents : null, notes: draft.notes || null,
    }, "add");
    if (ok) setDraft(null);
  }

  async function onboardSmm(leadId: string) {
    setBusy(`smm${leadId}`); setError("");
    const res = await fetch(`/api/leads/${leadId}/smm-onboard`, { method: "POST" });
    setBusy("");
    if (!res.ok) { const data = await res.json().catch(() => ({})); setError(data.error || "Could not onboard this SMM client."); return; }
    router.push("/azmin/smm");
    router.refresh();
  }

  const totalOpen = leads.filter((l) => stageMeta[l.stage].open).length;
  const won = leads.filter((l) => l.stage === "WON");
  const wonValue = won.reduce((s, l) => s + (l.valueCents ?? 0), 0);
  const serviceCategories = Array.from(new Set(services.map((service) => service.category || "Other")));

  return (
    <main data-azmin-ui className="min-h-screen bg-[#EAF1F9] text-[#03142E]">
      <header className="border-b border-[#C8D8EA] bg-white px-5 py-4 shadow-[0_1px_8px_rgba(3,20,46,.06)] sm:px-8">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3">
          <Link href="/azmin" className="flex items-center gap-3">
            <span className="relative h-10 w-10 shrink-0"><Image src="/brand/azmin-c1-mark.png" alt="AZMIN" fill priority sizes="40px" className="object-contain" /></span>
            <span><strong className="block font-display text-[15px] font-bold">AZMIN Digital OS</strong><span className="mt-0.5 block text-[11px] font-extrabold uppercase tracking-[.17em] text-[#456784]">Leads &amp; pipeline</span></span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/azmin" className="hidden rounded-xl border border-[#B8CCE0] bg-[#F8FBFF] px-4 py-2.5 text-xs font-bold text-[#234B70] hover:border-[#087CFA] sm:block">Command center</Link>
            <AzminProfileMenu name={userName} email={userEmail} role={userRole} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-5 pb-16 pt-6 sm:px-8 sm:pt-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[.15em] text-[#0758C9]">Phase 2 · Sales</p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-[-.03em]">Leads &amp; pipeline</h1>
            <p className="mt-1.5 text-sm text-[#4C6A86]">{totalOpen} open · {won.length} won ({fmt(wonValue, won[0]?.currency)}). New leads auto-run your automations.</p>
          </div>
          {canManage && <button onClick={() => setDraft({ ...emptyDraft })} className="inline-flex items-center gap-2 rounded-xl bg-[#087CFA] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_26px_rgba(8,124,250,.2)]"><Plus size={16} aria-hidden /> Add lead</button>}
        </div>

        {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}

        <div className="mt-6 grid gap-3 md:grid-cols-3 xl:grid-cols-5">
          {LEAD_STAGES.map((stage) => {
            const items = leads.filter((l) => l.stage === stage);
            return (
              <div key={stage} className="rounded-2xl border border-[#C8D8EA] bg-[#F7FAFE] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider" style={{ color: stageMeta[stage].color }}><span className="h-2.5 w-2.5 rounded-full" style={{ background: stageMeta[stage].color }} /> {stageMeta[stage].label}</span>
                  <span className="text-xs font-bold text-[#526F8A]">{items.length}</span>
                </div>
                <div className="space-y-2.5">
                  {items.map((l) => (
                    <div key={l.id} className="rounded-xl border border-[#D6E2EF] bg-white p-3 shadow-[0_6px_16px_rgba(3,20,46,.05)]">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0"><div className="truncate text-sm font-bold">{l.name}</div>{(l.email || l.phone) && <div className="truncate text-xs text-[#526F8A]">{l.email || l.phone}</div>}</div>
                        {l.score !== null && <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black" style={{ background: tempBg(l.score), color: tempFg(l.score) }}>{l.score}</span>}
                      </div>
                      {l.valueCents ? <div className="mt-1 text-xs font-bold text-[#03142E]">{fmt(l.valueCents, l.currency)}</div> : null}
                      {l.aiSummary && <p className="mt-1.5 line-clamp-3 text-xs leading-5 text-[#4C6A86]">{l.aiSummary}</p>}
                      {canManage && (
                        <div className="mt-2.5 flex items-center gap-1.5 border-t border-[#EAF1F8] pt-2">
                          <button onClick={() => call(`/api/leads/${l.id}/qualify`, "POST", undefined, `q${l.id}`)} disabled={busy === `q${l.id}`} className="inline-flex items-center gap-1 rounded-lg bg-[#EDE8FF] px-2 py-1 text-[11px] font-bold text-[#5C3AAE] hover:bg-[#E2D9FF] disabled:opacity-50"><Sparkles size={12} aria-hidden /> {busy === `q${l.id}` ? "…" : "AI qualify"}</button>
                          <select value={l.stage} onChange={(e) => call(`/api/leads/${l.id}`, "PATCH", { stage: e.target.value })} className="rounded-lg border border-[#CEDBE9] bg-white px-1.5 py-1 text-[11px] font-bold text-[#234B70]">
                            {LEAD_STAGES.map((s) => <option key={s} value={s}>{stageMeta[s].label}</option>)}
                          </select>
                          {l.stage === "WON" && l.clientId && <button onClick={() => onboardSmm(l.id)} disabled={busy === `smm${l.id}`} className="rounded-lg bg-[#DDF5FF] px-2 py-1 text-[11px] font-bold text-[#0758C9] disabled:opacity-50">{busy === `smm${l.id}` ? "Opening…" : "Onboard SMM"}</button>}
                          <button onClick={() => call(`/api/leads/${l.id}`, "DELETE")} aria-label="Remove" className="ml-auto grid h-7 w-7 place-items-center rounded-lg text-[#A12C2C] hover:bg-[#FFF0F0]"><Trash2 size={13} aria-hidden /></button>
                        </div>
                      )}
                    </div>
                  ))}
                  {items.length === 0 && <div className="rounded-xl border border-dashed border-[#CEDBE9] px-2 py-6 text-center text-[11px] text-[#7890A6]">Empty</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {draft && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#020B1F]/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[24px] border border-[#BFD1E3] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4"><h2 className="font-display text-xl font-bold">Add a lead</h2><button onClick={() => setDraft(null)} aria-label="Close" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#C8D8EA] bg-[#EDF3F9] text-[#234B70] hover:border-[#087CFA]"><X size={18} aria-hidden /></button></div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><Field label="Name"><input autoFocus value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={inputClass} placeholder="Lead name" /></Field></div>
              <Field label="Email"><input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} className={inputClass} placeholder="name@company.com" /></Field>
              <Field label="Phone"><input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} className={inputClass} placeholder="+971…" /></Field>
              <Field label="Source"><input value={draft.source} onChange={(e) => setDraft({ ...draft, source: e.target.value })} className={inputClass} placeholder="Website, WhatsApp, Referral…" /></Field>
              <Field label="Estimated value"><input inputMode="decimal" value={draft.value} onChange={(e) => setDraft({ ...draft, value: e.target.value })} className={inputClass} placeholder="e.g. 5000" /></Field>
              {companies.length > 0 && <Field label="Company"><select value={draft.companyId} onChange={(e) => setDraft({ ...draft, companyId: e.target.value })} className={inputClass}><option value="">— none —</option>{companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>}
              {services.length > 0 && <Field label="Interested service"><select value={draft.serviceId} onChange={(e) => setDraft({ ...draft, serviceId: e.target.value })} className={inputClass}><option value="">Select service</option>{serviceCategories.map((category) => <optgroup key={category} label={category}>{services.filter((service) => (service.category || "Other") === category).map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</optgroup>)}</select></Field>}
              {partners.length > 0 && <Field label="Referred by partner"><select value={draft.partnershipId} onChange={(e) => setDraft({ ...draft, partnershipId: e.target.value })} className={inputClass}><option value="">— none —</option>{partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>}
              <div className="sm:col-span-2"><Field label="Notes"><textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} className={inputClass + " min-h-24"} placeholder="What do they need?" /></Field></div>
            </div>
            <p className="mt-3 rounded-xl bg-[#F1F5FA] px-3 py-2 text-xs leading-5 text-[#4C6A86]">Saving fires your <strong>LEAD_CREATED</strong> automations (WhatsApp welcome, team alert…) if any are on.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setDraft(null)} className="rounded-xl px-4 py-2.5 text-sm font-bold text-[#405E78]">Cancel</button>
              <button onClick={addLead} disabled={busy === "add" || draft.name.trim().length < 2} className="rounded-xl bg-[#087CFA] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(8,124,250,.2)] disabled:opacity-50">{busy === "add" ? "Saving…" : "Add lead"}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function fmt(cents: number, currency = "AED") { return `${currency} ${(cents / 100).toLocaleString()}`; }
function tempBg(score: number) { const t = leadTemperature(score); return t === "Hot" ? "#FFE3E1" : t === "Warm" ? "#FFF1D5" : "#EAF1F8"; }
function tempFg(score: number) { const t = leadTemperature(score); return t === "Hot" ? "#B4231C" : t === "Warm" ? "#8A5A0B" : "#526F8A"; }
const inputClass = "mt-1.5 w-full rounded-xl border border-[#AFC6DE] bg-white px-3 py-2.5 text-sm text-[#03142E] outline-none transition placeholder:text-[#7890A6] focus:border-[#087CFA] focus:ring-2 focus:ring-[#087CFA]/15";
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-xs font-bold text-[#476987]">{label}{children}</label>; }
