"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpenCheck, Pencil, Plus, Tag, Trash2, X } from "lucide-react";
import { AzminProfileMenu } from "@/components/azmin/profile-menu";
import { PRICING_MODELS, formatServicePrice, pricingModelLabels, type PricingModel } from "@/lib/services-catalog";

type Service = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  pricingModel: PricingModel;
  priceCents: number | null;
  currency: string;
  unit: string | null;
  companyId: string | null;
};
type CompanyRef = { id: string; name: string };

type Draft = {
  id?: string;
  name: string;
  category: string;
  description: string;
  pricingModel: PricingModel;
  price: string; // major units, as typed
  currency: string;
  unit: string;
  companyId: string; // "" = shared
};

const emptyDraft: Draft = { name: "", category: "", description: "", pricingModel: "PROJECT", price: "", currency: "AED", unit: "", companyId: "" };

export function ServicesView({ services, companies, canManage, userName, userEmail, userRole }: {
  services: Service[]; companies: CompanyRef[]; canManage: boolean; userName: string; userEmail: string; userRole: string;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const categories = Array.from(new Set(services.map((s) => s.category))).sort();
  const companyName = (id: string | null) => (id ? companies.find((c) => c.id === id)?.name ?? "Company" : "Shared");

  function openNew() { setError(""); setDraft({ ...emptyDraft }); }
  function openEdit(s: Service) {
    setError("");
    setDraft({
      id: s.id, name: s.name, category: s.category, description: s.description ?? "",
      pricingModel: s.pricingModel, price: s.priceCents === null ? "" : String(s.priceCents / 100),
      currency: s.currency, unit: s.unit ?? "", companyId: s.companyId ?? "",
    });
  }

  async function save() {
    if (!draft) return;
    setBusy(true); setError("");
    const priceCents = draft.price.trim() === "" ? null : Math.round(Number(draft.price) * 100);
    if (priceCents !== null && !Number.isFinite(priceCents)) { setBusy(false); setError("Enter a valid price."); return; }
    const body = {
      name: draft.name, category: draft.category, description: draft.description || null,
      pricingModel: draft.pricingModel, priceCents, currency: draft.currency || "AED",
      unit: draft.unit || null, companyId: draft.companyId || null,
    };
    const res = draft.id
      ? await fetch(`/api/services/${draft.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      : await fetch(`/api/services`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || "Could not save the service."); return; }
    setDraft(null);
    router.refresh();
  }

  async function archive(s: Service) {
    setBusy(true); setError("");
    const res = await fetch(`/api/services/${s.id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) { setError("Could not remove the service."); return; }
    router.refresh();
  }

  async function installCatalogue() {
    setBusy(true); setError("");
    const res = await fetch("/api/services/install-catalogue", { method: "POST" });
    setBusy(false);
    if (!res.ok) { const data = await res.json().catch(() => ({})); setError(data.error || "Could not install the agency catalogue."); return; }
    router.refresh();
  }

  return (
    <main data-azmin-ui className="min-h-screen bg-[#EAF1F9] text-[#03142E]">
      <header className="border-b border-[#C8D8EA] bg-white px-5 py-4 shadow-[0_1px_8px_rgba(3,20,46,.06)] sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <Link href="/azmin" className="flex items-center gap-3 rounded-xl focus-visible:ring-2 focus-visible:ring-[#087CFA]">
            <span className="relative h-10 w-10 shrink-0"><Image src="/brand/azmin-c1-mark.png" alt="AZMIN" fill priority sizes="40px" className="object-contain" /></span>
            <span>
              <strong className="block font-display text-[15px] font-bold text-[#03142E]">AZMIN Digital OS</strong>
              <span className="mt-0.5 block text-[11px] font-extrabold uppercase tracking-[.17em] text-[#456784]">Service catalogue</span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/azmin" className="hidden rounded-xl border border-[#B8CCE0] bg-[#F8FBFF] px-4 py-2.5 text-xs font-bold text-[#234B70] transition hover:border-[#087CFA] hover:text-[#0758C9] sm:block">Command center</Link>
            <AzminProfileMenu name={userName} email={userEmail} role={userRole} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 pb-14 pt-6 sm:px-8 sm:pt-8">
        <section className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[.15em] text-[#0758C9]">Phase 2 · Services</p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-[-.03em]">Service catalogue</h1>
            <p className="mt-1.5 max-w-2xl text-sm text-[#4C6A86]">Professional agency offerings used by leads, proposals, delivery workflows and agent routing. Install the standard catalogue, then customize pricing or add specialist services.</p>
          </div>
          {canManage && <div className="flex flex-wrap gap-2">
            <button onClick={installCatalogue} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-[#9AB6D1] bg-white px-4 py-3 text-sm font-bold text-[#0758C9] disabled:opacity-50"><BookOpenCheck size={16} aria-hidden /> Install agency catalogue</button>
            <button onClick={openNew} className="inline-flex items-center gap-2 rounded-xl bg-[#087CFA] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_26px_rgba(8,124,250,.2)]"><Plus size={16} aria-hidden /> Add service</button>
          </div>}
        </section>

        {error && !draft && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}

        {services.length === 0 ? (
          <div className="mt-8 rounded-2xl border-2 border-dashed border-[#AFC6DE] bg-[#F5F9FE] px-6 py-14 text-center">
            <h3 className="font-display text-xl font-bold">No services yet</h3>
            <p className="mt-2 text-sm text-[#4C6A86]">Install the professional catalogue for marketing, development, automation, cloud, hosting, managed IT and business systems.</p>
            {canManage && <button onClick={installCatalogue} disabled={busy} className="mt-5 rounded-xl bg-[#087CFA] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">Install agency catalogue</button>}
          </div>
        ) : (
          <div className="mt-7 space-y-8">
            {categories.map((cat) => (
              <div key={cat}>
                <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[.14em] text-[#526F8A]"><Tag size={13} aria-hidden /> {cat}</div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {services.filter((s) => s.category === cat).map((s) => (
                    <div key={s.id} className="flex flex-col gap-3 rounded-2xl border border-[#C8D8EA] bg-white p-4 shadow-[0_10px_28px_rgba(3,20,46,.05)]">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-display text-base font-bold">{s.name}</h3>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${s.companyId ? "bg-[#EDE8FF] text-[#5C3AAE]" : "bg-[#DDF5FF] text-[#0758C9]"}`}>{companyName(s.companyId)}</span>
                      </div>
                      {s.description && <p className="line-clamp-2 text-sm text-[#4C6A86]">{s.description}</p>}
                      <div className="mt-auto flex items-end justify-between gap-2 border-t border-[#E4ECF5] pt-3">
                        <div>
                          <div className="text-sm font-bold text-[#03142E]">{formatServicePrice(s.priceCents, s.currency, s.unit)}</div>
                          <div className="text-[11px] font-semibold text-[#526F8A]">{pricingModelLabels[s.pricingModel]}</div>
                        </div>
                        {canManage && (
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEdit(s)} aria-label="Edit" className="grid h-8 w-8 place-items-center rounded-lg text-[#234B70] hover:bg-[#EEF4FB]"><Pencil size={14} aria-hidden /></button>
                            <button onClick={() => archive(s)} disabled={busy} aria-label="Remove" className="grid h-8 w-8 place-items-center rounded-lg text-[#A12C2C] hover:bg-[#FFF0F0] disabled:opacity-50"><Trash2 size={14} aria-hidden /></button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {draft && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#020B1F]/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[24px] border border-[#BFD1E3] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[.14em] text-[#0758C9]">{draft.id ? "Edit service" : "New service"}</p>
                <h2 className="mt-1 font-display text-xl font-bold">Service details</h2>
              </div>
              <button type="button" onClick={() => setDraft(null)} aria-label="Close" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#C8D8EA] bg-[#EDF3F9] text-[#234B70] hover:border-[#087CFA]"><X size={18} aria-hidden /></button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><Field label="Service name"><input autoFocus value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={inputClass} placeholder="e.g. Make.com automation build" /></Field></div>
              <Field label="Category"><input value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className={inputClass} placeholder="e.g. Automation" /></Field>
              <Field label="Catalogue scope"><select value={draft.companyId} onChange={(e) => setDraft({ ...draft, companyId: e.target.value })} className={inputClass}><option value="">Agency-wide</option>{companies.map((c) => <option key={c.id} value={c.id}>{c.name} operating context</option>)}</select></Field>
              <Field label="Pricing model"><select value={draft.pricingModel} onChange={(e) => setDraft({ ...draft, pricingModel: e.target.value as PricingModel })} className={inputClass}>{PRICING_MODELS.map((m) => <option key={m} value={m}>{pricingModelLabels[m]}</option>)}</select></Field>
              <Field label="Unit (optional)"><input value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value })} className={inputClass} placeholder="e.g. per month" /></Field>
              <Field label="Price (blank = custom quote)"><input inputMode="decimal" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} className={inputClass} placeholder="e.g. 1500" /></Field>
              <Field label="Currency"><input value={draft.currency} onChange={(e) => setDraft({ ...draft, currency: e.target.value.toUpperCase() })} maxLength={3} className={inputClass} placeholder="AED" /></Field>
              <div className="sm:col-span-2"><Field label="Description (optional)"><textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className={inputClass + " min-h-24"} placeholder="What's included…" /></Field></div>
            </div>
            {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setDraft(null)} className="rounded-xl px-4 py-2.5 text-sm font-bold text-[#405E78]">Cancel</button>
              <button type="button" onClick={save} disabled={busy || draft.name.trim().length < 2 || draft.category.trim().length < 2} className="rounded-xl bg-[#087CFA] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(8,124,250,.2)] disabled:opacity-50">{busy ? "Saving…" : draft.id ? "Save changes" : "Create service"}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

const inputClass = "mt-1.5 w-full rounded-xl border border-[#AFC6DE] bg-white px-3 py-2.5 text-sm text-[#03142E] outline-none transition placeholder:text-[#7890A6] focus:border-[#087CFA] focus:ring-2 focus:ring-[#087CFA]/15";
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-xs font-bold text-[#476987]">{label}{children}</label>; }
