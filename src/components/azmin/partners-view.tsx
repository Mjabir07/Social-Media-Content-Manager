"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Handshake, Plus, Wallet, X } from "lucide-react";
import { AzminProfileMenu } from "@/components/azmin/profile-menu";
import { COMMISSION_TYPES, formatMoney, formatRate, type CommissionType } from "@/lib/commissions-catalog";

type Settlement = { earnedCents: number; paidCents: number; outstandingCents: number; wonCount: number; currency: string };
type Partner = {
  id: string; name: string | null; partnerCompanyName: string; commissionType: string;
  commissionRateBps: number; commissionFlatCents: number | null; currency: string; status: string;
  settlement: Settlement;
};
type CompanyRef = { id: string; name: string };

export function PartnersView({ partners, partnerCompanies, canManage, userName, userEmail, userRole }: {
  partners: Partner[]; partnerCompanies: CompanyRef[]; canManage: boolean; userName: string; userEmail: string; userRole: string;
}) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [payFor, setPayFor] = useState<Partner | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const totals = partners.reduce((a, p) => ({ earned: a.earned + p.settlement.earnedCents, paid: a.paid + p.settlement.paidCents, out: a.out + p.settlement.outstandingCents }), { earned: 0, paid: 0, out: 0 });

  return (
    <main data-azmin-ui className="min-h-screen bg-[#EAF1F9] text-[#03142E]">
      <header className="border-b border-[#C8D8EA] bg-white px-5 py-4 shadow-[0_1px_8px_rgba(3,20,46,.06)] sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <Link href="/azmin" className="flex items-center gap-3">
            <span className="relative h-10 w-10 shrink-0"><Image src="/brand/azmin-c1-mark.png" alt="AZMIN" fill priority sizes="40px" className="object-contain" /></span>
            <span><strong className="block font-display text-[15px] font-bold">AZMIN Digital OS</strong><span className="mt-0.5 block text-[11px] font-extrabold uppercase tracking-[.17em] text-[#456784]">Partners &amp; commissions</span></span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/azmin" className="hidden rounded-xl border border-[#B8CCE0] bg-[#F8FBFF] px-4 py-2.5 text-xs font-bold text-[#234B70] hover:border-[#087CFA] sm:block">Command center</Link>
            <AzminProfileMenu name={userName} email={userEmail} role={userRole} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 pb-16 pt-6 sm:px-8 sm:pt-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[.15em] text-[#0758C9]">Phase 2 · Partnerships</p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-[-.03em]">Partners &amp; commissions</h1>
            <p className="mt-1.5 text-sm text-[#4C6A86]">Commission is earned automatically when a partner-referred lead is marked Won. Record payments and track what&apos;s outstanding.</p>
          </div>
          {canManage && <button onClick={() => setAddOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-[#087CFA] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_26px_rgba(8,124,250,.2)]"><Plus size={16} aria-hidden /> Add partnership</button>}
        </div>

        {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}

        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          <Stat label="Commission earned" value={formatMoney(totals.earned)} tone="#0758C9" />
          <Stat label="Paid" value={formatMoney(totals.paid)} tone="#087B54" />
          <Stat label="Outstanding" value={formatMoney(totals.out)} tone="#B4231C" />
        </section>

        {partners.length === 0 ? (
          <div className="mt-7 rounded-2xl border-2 border-dashed border-[#AFC6DE] bg-[#F5F9FE] px-6 py-14 text-center">
            <h3 className="font-display text-xl font-bold">No partnerships yet</h3>
            <p className="mt-2 text-sm text-[#4C6A86]">Add a commission agreement with a partner company. Then attribute leads to them on the Leads page.</p>
            {canManage && partnerCompanies.length > 0 && <button onClick={() => setAddOpen(true)} className="mt-5 rounded-xl bg-[#087CFA] px-5 py-2.5 text-sm font-bold text-white">Add partnership</button>}
            {partnerCompanies.length === 0 && <p className="mt-3 text-xs font-semibold text-[#A16207]">Tip: first add a company with the &ldquo;Sales / commission partner&rdquo; relationship.</p>}
          </div>
        ) : (
          <div className="mt-6 grid gap-3 lg:grid-cols-2">
            {partners.map((p) => (
              <div key={p.id} className="rounded-2xl border border-[#C8D8EA] bg-white p-5 shadow-[0_10px_28px_rgba(3,20,46,.05)]">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#E5F0FF] text-[#0758C9]"><Handshake size={20} aria-hidden /></span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-base font-bold">{p.name || p.partnerCompanyName}</h3>
                    <p className="text-xs font-semibold text-[#526F8A]">{p.partnerCompanyName} · {formatRate({ commissionType: p.commissionType, commissionRateBps: p.commissionRateBps, commissionFlatCents: p.commissionFlatCents }, p.currency)} · {p.settlement.wonCount} won</p>
                  </div>
                  {canManage && <button onClick={() => { setPayFor(p); setError(""); }} className="inline-flex items-center gap-1.5 rounded-lg bg-[#EDF4FB] px-3 py-1.5 text-xs font-bold text-[#0758C9] hover:bg-[#DDEBFA]"><Wallet size={13} aria-hidden /> Record payment</button>}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <Cell label="Earned" value={formatMoney(p.settlement.earnedCents, p.currency)} />
                  <Cell label="Paid" value={formatMoney(p.settlement.paidCents, p.currency)} />
                  <Cell label="Outstanding" value={formatMoney(p.settlement.outstandingCents, p.currency)} strong />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {addOpen && <AddPartnership companies={partnerCompanies} onClose={() => setAddOpen(false)} onDone={() => { setAddOpen(false); router.refresh(); }} setError={setError} busy={busy} setBusy={setBusy} />}
      {payFor && <RecordPayment partner={payFor} onClose={() => setPayFor(null)} onDone={() => { setPayFor(null); router.refresh(); }} setError={setError} busy={busy} setBusy={setBusy} />}
    </main>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return <div className="rounded-2xl border border-[#C8D8EA] bg-white px-5 py-4 shadow-[0_10px_28px_rgba(3,20,46,.05)]"><div className="text-2xl font-black tracking-[-.02em]" style={{ color: tone }}>{value}</div><div className="mt-1 text-xs font-extrabold uppercase tracking-[.08em] text-[#234B70]">{label}</div></div>;
}
function Cell({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <div className={`rounded-xl border px-2 py-2.5 ${strong ? "border-[#F3C6C2] bg-[#FFF4F3]" : "border-[#E4ECF5] bg-[#F8FAFD]"}`}><div className={`text-sm font-bold ${strong ? "text-[#B4231C]" : "text-[#03142E]"}`}>{value}</div><div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-[#526F8A]">{label}</div></div>;
}

function AddPartnership({ companies, onClose, onDone, setError, busy, setBusy }: { companies: CompanyRef[]; onClose: () => void; onDone: () => void; setError: (s: string) => void; busy: boolean; setBusy: (b: boolean) => void }) {
  const [form, setForm] = useState({ partnerCompanyId: companies[0]?.id ?? "", name: "", commissionType: "PERCENT" as CommissionType, ratePct: "10", flat: "" });
  async function save() {
    setBusy(true); setError("");
    const body = {
      partnerCompanyId: form.partnerCompanyId, name: form.name || null, commissionType: form.commissionType,
      commissionRateBps: form.commissionType === "PERCENT" ? Math.round(Number(form.ratePct) * 100) : undefined,
      commissionFlatCents: form.commissionType === "FLAT" ? Math.round(Number(form.flat) * 100) : null,
    };
    const res = await fetch("/api/partnerships", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || "Could not add partnership."); return; }
    onDone();
  }
  return (
    <Dialog title="Add partnership" onClose={onClose}>
      <div className="grid gap-4">
        <Field label="Partner company"><select value={form.partnerCompanyId} onChange={(e) => setForm({ ...form, partnerCompanyId: e.target.value })} className={inputClass}>{companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Field label="Label (optional)"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="e.g. Referral partner" /></Field>
        <Field label="Commission type"><select value={form.commissionType} onChange={(e) => setForm({ ...form, commissionType: e.target.value as CommissionType })} className={inputClass}>{COMMISSION_TYPES.map((t) => <option key={t} value={t}>{t === "PERCENT" ? "Percentage of deal" : "Flat amount"}</option>)}</select></Field>
        {form.commissionType === "PERCENT"
          ? <Field label="Rate (%)"><input inputMode="decimal" value={form.ratePct} onChange={(e) => setForm({ ...form, ratePct: e.target.value })} className={inputClass} placeholder="10" /></Field>
          : <Field label="Flat amount"><input inputMode="decimal" value={form.flat} onChange={(e) => setForm({ ...form, flat: e.target.value })} className={inputClass} placeholder="500" /></Field>}
      </div>
      <Actions onCancel={onClose} onSave={save} busy={busy} disabled={!form.partnerCompanyId} saveLabel="Add partnership" />
    </Dialog>
  );
}

function RecordPayment({ partner, onClose, onDone, setError, busy, setBusy }: { partner: Partner; onClose: () => void; onDone: () => void; setError: (s: string) => void; busy: boolean; setBusy: (b: boolean) => void }) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  async function save() {
    const amountCents = Math.round(Number(amount) * 100);
    if (!Number.isFinite(amountCents) || amountCents < 1) { setError("Enter a valid amount."); return; }
    setBusy(true); setError("");
    const res = await fetch(`/api/partnerships/${partner.id}/payments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amountCents, note: note || null }) });
    setBusy(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || "Could not record payment."); return; }
    onDone();
  }
  return (
    <Dialog title="Record commission payment" onClose={onClose}>
      <p className="mb-4 rounded-xl bg-[#F1F5FA] px-3 py-2 text-xs leading-5 text-[#4C6A86]">Outstanding: <strong>{formatMoney(partner.settlement.outstandingCents, partner.currency)}</strong> to {partner.name || partner.partnerCompanyName}.</p>
      <div className="grid gap-4">
        <Field label={`Amount (${partner.currency})`}><input autoFocus inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} placeholder="e.g. 400" /></Field>
        <Field label="Note (optional)"><input value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} placeholder="e.g. partial settlement" /></Field>
      </div>
      <Actions onCancel={onClose} onSave={save} busy={busy} disabled={amount.trim() === ""} saveLabel="Record payment" />
    </Dialog>
  );
}

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#020B1F]/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-[24px] border border-[#BFD1E3] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4"><h2 className="font-display text-xl font-bold">{title}</h2><button onClick={onClose} aria-label="Close" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#C8D8EA] bg-[#EDF3F9] text-[#234B70] hover:border-[#087CFA]"><X size={18} aria-hidden /></button></div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
function Actions({ onCancel, onSave, busy, disabled, saveLabel }: { onCancel: () => void; onSave: () => void; busy: boolean; disabled: boolean; saveLabel: string }) {
  return <div className="mt-6 flex justify-end gap-2"><button onClick={onCancel} className="rounded-xl px-4 py-2.5 text-sm font-bold text-[#405E78]">Cancel</button><button onClick={onSave} disabled={busy || disabled} className="rounded-xl bg-[#087CFA] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(8,124,250,.2)] disabled:opacity-50">{busy ? "Saving…" : saveLabel}</button></div>;
}
const inputClass = "mt-1.5 w-full rounded-xl border border-[#AFC6DE] bg-white px-3 py-2.5 text-sm text-[#03142E] outline-none transition placeholder:text-[#7890A6] focus:border-[#087CFA] focus:ring-2 focus:ring-[#087CFA]/15";
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-xs font-bold text-[#476987]">{label}{children}</label>; }
