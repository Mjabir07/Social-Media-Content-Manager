"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CalendarClock, Plus, Loader2, X, AlertTriangle, CheckCircle2, FileText, RefreshCw, Trash2, Copy, Check, Mail } from "lucide-react";
import { AzminProfileMenu } from "@/components/azmin/profile-menu";
import { formatAmount, buildInvoiceEmail, type ServiceStage } from "@/lib/renewals-core";

export type ServiceRenewalDTO = {
  id: string;
  service: string;
  clientName: string;
  clientEmail: string | null;
  amountCents: number | null;
  costCents: number | null;
  vendor: string | null;
  currency: string;
  renewalDate: string;
  status: string;
  notes: string | null;
  daysLeft: number;
  stage: ServiceStage | null;
};

const STAGE_META: Record<ServiceStage, { label: string; color: string; bg: string }> = {
  invoice: { label: "Send invoice", color: "#5C3AAE", bg: "#EFEBFB" },
  "15d": { label: "15-day reminder", color: "#0758C9", bg: "#E7F0FD" },
  "7d": { label: "7-day reminder", color: "#9A6711", bg: "#FFF1D5" },
  "1d": { label: "Final reminder", color: "#B4231C", bg: "#FDECEC" },
  overdue: { label: "Overdue", color: "#8A1009", bg: "#FBE0DD" },
};

export function RenewalsView({
  initialRenewals,
  canManage,
  userName,
  userEmail,
  userRole,
  scopeClientId,
  scopeClientName,
  embedded = false,
}: {
  initialRenewals: ServiceRenewalDTO[];
  canManage: boolean;
  userName: string;
  userEmail: string;
  userRole: string;
  scopeClientId?: string;
  scopeClientName?: string;
  embedded?: boolean;
}) {
  const router = useRouter();
  const [renewals, setRenewals] = useState(initialRenewals);
  const [showForm, setShowForm] = useState(false);
  const [service, setService] = useState("Google Workspace");
  const [clientName, setClientName] = useState(scopeClientName ?? "");
  const [clientEmail, setClientEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [cost, setCost] = useState("");
  const [vendor, setVendor] = useState("");
  const [currency, setCurrency] = useState("AED");
  const [renewalDate, setRenewalDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ subject: string; body: string; email: string | null } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  function openDraft(r: ServiceRenewalDTO) {
    const { subject, body } = buildInvoiceEmail({ service: r.service, clientName: r.clientName, renewalDate: r.renewalDate, amountCents: r.amountCents, currency: r.currency });
    setDraft({ subject, body, email: r.clientEmail });
  }

  async function copyText(text: string, key: string) {
    try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500); } catch { /* blocked */ }
  }

  async function refresh() {
    const res = await fetch(`/api/renewals${scopeClientId ? `?clientId=${scopeClientId}` : ""}`, { cache: "no-store" });
    if (res.ok) setRenewals((await res.json()).renewals ?? []);
    router.refresh();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const amountCents = amount ? Math.round(parseFloat(amount) * 100) : null;
    const costCents = cost ? Math.round(parseFloat(cost) * 100) : null;
    const res = await fetch("/api/renewals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ service, clientName: scopeClientName ?? clientName, clientId: scopeClientId ?? null, clientEmail: clientEmail || null, amountCents, costCents, vendor: vendor || null, currency, renewalDate, notes: notes || null }),
    });
    setSaving(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error ?? "Could not save renewal.");
      return;
    }
    setClientName(scopeClientName ?? ""); setClientEmail(""); setAmount(""); setCost(""); setVendor(""); setRenewalDate(""); setNotes(""); setShowForm(false);
    await refresh();
  }

  async function markRenewed(id: string) {
    setBusyId(id);
    await fetch(`/api/renewals/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "markRenewed" }) });
    setBusyId(null);
    await refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this renewal?")) return;
    setBusyId(id);
    await fetch(`/api/renewals/${id}`, { method: "DELETE" });
    setBusyId(null);
    await refresh();
  }

  const inputCls = "w-full rounded-xl border border-[#B8CCE0] bg-white px-3.5 py-2.5 text-sm text-[#0f2137] outline-none placeholder:text-[#93A9BF] focus:border-[#087CFA]";

  const content = (
    <>
        {canManage && embedded && !showForm && (
          <button onClick={() => setShowForm(true)} className="mb-4 inline-flex items-center gap-2 rounded-xl bg-[#087CFA] px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(8,124,250,.2)] transition hover:bg-[#076BE0]">
            <Plus size={16} /> Add renewal
          </button>
        )}

        {/* Reminder ladder explainer */}
        <div className={`flex flex-wrap items-center gap-2 rounded-xl border border-[#D7E4F0] bg-white px-4 py-3 text-xs font-bold ${embedded ? "" : "mt-5"}`}>
          <span className="text-[#72899E]">Reminder ladder:</span>
          <Ladder color="#5C3AAE" bg="#EFEBFB" text="−30d · Send invoice" />
          <span className="text-[#C8D8EA]">→</span>
          <Ladder color="#0758C9" bg="#E7F0FD" text="−15d" />
          <span className="text-[#C8D8EA]">→</span>
          <Ladder color="#9A6711" bg="#FFF1D5" text="−7d" />
          <span className="text-[#C8D8EA]">→</span>
          <Ladder color="#B4231C" bg="#FDECEC" text="−1d · Final" />
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="mt-6 grid gap-3 rounded-2xl border border-[#C5D6E6] bg-white p-5 shadow-[0_10px_28px_rgba(3,20,46,.05)] sm:grid-cols-2">
            <label className="text-xs font-bold text-[#476987]">
              Service
              <input className={`mt-1 ${inputCls}`} value={service} onChange={(e) => setService(e.target.value)} placeholder="Google Workspace" required />
            </label>
            {!scopeClientName && (
              <label className="text-xs font-bold text-[#476987]">
                Client name
                <input className={`mt-1 ${inputCls}`} value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Client / project name" required minLength={2} />
              </label>
            )}
            <label className="text-xs font-bold text-[#476987]">
              Client email (for invoice)
              <input className={`mt-1 ${inputCls}`} type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="billing@client.com" />
            </label>
            <label className="text-xs font-bold text-[#476987]">
              Renewal date
              <input className={`mt-1 ${inputCls}`} type="date" value={renewalDate} onChange={(e) => setRenewalDate(e.target.value)} required />
            </label>
            <label className="text-xs font-bold text-[#476987]">
              You charge client / year
              <input className={`mt-1 ${inputCls}`} type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
            </label>
            <label className="text-xs font-bold text-[#476987]">
              You pay vendor / year <span className="font-normal text-[#93A9BF]">(for profit)</span>
              <input className={`mt-1 ${inputCls}`} type="number" min="0" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0.00" />
            </label>
            <label className="text-xs font-bold text-[#476987]">
              Vendor
              <input className={`mt-1 ${inputCls}`} value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="e.g. Google" />
            </label>
            <label className="text-xs font-bold text-[#476987]">
              Currency
              <select className={`mt-1 ${inputCls}`} value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {["AED", "USD", "INR", "SAR", "EUR", "GBP"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="text-xs font-bold text-[#476987] sm:col-span-2">
              Notes
              <input className={`mt-1 ${inputCls}`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Seats, admin id, support terms…" />
            </label>
            {error && <p className="sm:col-span-2 flex items-center gap-1.5 text-xs font-semibold text-[#C0362C]"><AlertTriangle size={13} /> {error}</p>}
            <div className="flex items-center gap-2 sm:col-span-2">
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#087CFA] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#076BE0] disabled:opacity-60">
                {saving && <Loader2 size={15} className="animate-spin" />} Save renewal
              </button>
              <button type="button" onClick={() => { setShowForm(false); setError(null); }} className="inline-flex items-center gap-1.5 rounded-xl border border-[#B8CCE0] bg-white px-4 py-2.5 text-sm font-bold text-[#234B70]">
                <X size={15} /> Cancel
              </button>
            </div>
          </form>
        )}

        <div className="mt-8">
          {renewals.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#AFC6DE] bg-[#F5F9FE] px-5 py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF9FF] text-[#087CFA]"><CalendarClock size={30} /></div>
              <h3 className="mt-4 text-base font-bold text-[#173A5C]">No renewals tracked</h3>
              <p className="mt-1 text-sm text-[#526F8A]">{canManage ? "Add a service renewal to start the reminder ladder." : "Ask an editor to add one."}</p>
            </div>
          ) : (
            <ul className="grid gap-3">
              {renewals.map((r) => {
                const amt = formatAmount(r.amountCents, r.currency);
                const stage = r.stage;
                const done = r.status !== "ACTIVE";
                return (
                  <li key={r.id} className="flex flex-col gap-3 rounded-2xl border border-[#C5D6E6] bg-white p-5 shadow-[0_10px_28px_rgba(3,20,46,.05)] sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-[#173A5C]">{r.service}</span>
                        <span className="text-[#8299AE]">·</span>
                        <span className="font-semibold text-[#456784]">{r.clientName}</span>
                        {stage && <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: STAGE_META[stage].color, background: STAGE_META[stage].bg }}>{STAGE_META[stage].label}</span>}
                        {done && <span className="rounded-full bg-[#E7F8EF] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#087B54]">{r.status}</span>}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs font-semibold text-[#526F8A]">
                        <span>Renews {new Date(r.renewalDate).toLocaleDateString()}</span>
                        <span className={r.daysLeft < 0 ? "text-[#B4231C]" : r.daysLeft <= 7 ? "text-[#9A6711]" : "text-[#72899E]"}>
                          {r.daysLeft < 0 ? `${Math.abs(r.daysLeft)}d overdue` : r.daysLeft === 0 ? "today" : `in ${r.daysLeft} days`}
                        </span>
                        {amt && <span className="text-[#234B70]">{amt}/yr</span>}
                        {r.costCents != null && r.costCents > 0 && <span className="text-[#8299AE]">cost {formatAmount(r.costCents, r.currency)}</span>}
                        {r.amountCents != null && r.costCents != null && r.costCents > 0 && (
                          <span className="font-bold text-[#087B54]">profit {formatAmount(r.amountCents - r.costCents, r.currency)}</span>
                        )}
                        {r.clientEmail && <span className="text-[#8299AE]">{r.clientEmail}</span>}
                      </div>
                      {r.notes && <p className="mt-1 text-xs text-[#7C93A8]">{r.notes}</p>}
                    </div>
                    {canManage && (
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <button onClick={() => openDraft(r)} title="Pre-fill the renewal invoice email" className="inline-flex items-center gap-1.5 rounded-lg border border-[#D8C9F2] bg-[#F7F1FE] px-3 py-2 text-xs font-bold text-[#5C3AAE] transition hover:border-[#5C3AAE]">
                          <FileText size={13} /> Draft invoice
                        </button>
                        <button onClick={() => markRenewed(r.id)} disabled={busyId === r.id} title="Renew +1 year and auto-log income/expense to Finance" className="inline-flex items-center gap-1.5 rounded-lg border border-[#B8CCE0] bg-white px-3 py-2 text-xs font-bold text-[#087B54] transition hover:border-[#16A34A] disabled:opacity-60">
                          {busyId === r.id ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} Mark renewed
                        </button>
                        <button onClick={() => remove(r.id)} disabled={busyId === r.id} className="inline-flex items-center gap-1.5 rounded-lg border border-[#F0C9C4] bg-white px-3 py-2 text-xs font-bold text-[#C0362C] transition hover:bg-[#FDECEC] disabled:opacity-60">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {renewals.some((r) => r.stage === "invoice" || r.stage === "overdue") && (
          <p className="mt-5 flex items-center gap-2 rounded-xl border border-[#E4D3F5] bg-[#F7F1FE] px-4 py-3 text-xs font-semibold text-[#5C3AAE]">
            <FileText size={14} /> One or more renewals are in the invoice window — time to bill the client.
          </p>
        )}
        {!embedded && <p className="mt-3 flex items-center gap-2 text-xs text-[#8299AE]"><CheckCircle2 size={13} /> Reminders post to your notifications automatically each day — no manual checking.</p>}

        {draft && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#03142E]/40 p-4" onClick={() => setDraft(null)}>
            <div className="w-full max-w-xl rounded-2xl border border-[#C5D6E6] bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-display text-lg font-bold text-[#173A5C]"><FileText size={18} className="text-[#5C3AAE]" /> Invoice email draft</h3>
                <button onClick={() => setDraft(null)} className="rounded-lg p-1 text-[#8299AE] hover:bg-[#EAF1F9]"><X size={18} /></button>
              </div>
              <label className="mt-4 block text-xs font-bold text-[#476987]">Subject
                <div className="mt-1 flex gap-2">
                  <input readOnly value={draft.subject} className="w-full rounded-xl border border-[#B8CCE0] bg-[#F7FAFE] px-3 py-2 text-sm text-[#0f2137]" />
                  <button onClick={() => copyText(draft.subject, "subj")} className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-[#B8CCE0] bg-white px-3 text-xs font-bold text-[#234B70] hover:border-[#087CFA]">{copied === "subj" ? <Check size={13} /> : <Copy size={13} />}</button>
                </div>
              </label>
              <label className="mt-3 block text-xs font-bold text-[#476987]">Body
                <textarea readOnly value={draft.body} rows={12} className="mt-1 w-full rounded-xl border border-[#B8CCE0] bg-[#F7FAFE] px-3 py-2 font-mono text-xs text-[#0f2137]" />
              </label>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button onClick={() => copyText(draft.body, "body")} className="inline-flex items-center gap-2 rounded-xl bg-[#087CFA] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#076BE0]">{copied === "body" ? <Check size={15} /> : <Copy size={15} />} Copy email</button>
                <a href={`mailto:${draft.email ?? ""}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`} className="inline-flex items-center gap-2 rounded-xl border border-[#B8CCE0] bg-white px-4 py-2.5 text-sm font-bold text-[#234B70] transition hover:border-[#087CFA]"><Mail size={15} /> Open in email</a>
              </div>
            </div>
          </div>
        )}
    </>
  );

  if (embedded) return content;

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
              <span className="mt-0.5 block text-[11px] font-extrabold uppercase tracking-[.17em] text-[#456784]">Renewals</span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/azmin/clients" className="hidden rounded-xl border border-[#B8CCE0] bg-[#F8FBFF] px-4 py-2.5 text-xs font-bold text-[#234B70] hover:border-[#087CFA] sm:block">Clients</Link>
            <Link href="/azmin" className="hidden rounded-xl border border-[#B8CCE0] bg-[#F8FBFF] px-4 py-2.5 text-xs font-bold text-[#234B70] hover:border-[#087CFA] sm:block">Command center</Link>
            <AzminProfileMenu name={userName} email={userEmail} role={userRole} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 pb-16 pt-6 sm:px-8 sm:pt-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[.15em] text-[#0758C9]">Recurring services</p>
            <h1 className="mt-1 flex items-center gap-3 font-display text-3xl font-bold tracking-[-.03em]">
              <CalendarClock className="text-[#087CFA]" size={28} /> Service renewals
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-[#4C6A86]">Track yearly licenses (Google Workspace, domains, hosting) per client. Auto-reminders keep billing on time.</p>
          </div>
          {canManage && !showForm && (
            <button onClick={() => setShowForm(true)} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#087CFA] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(8,124,250,.2)] transition hover:bg-[#076BE0]">
              <Plus size={16} /> Add renewal
            </button>
          )}
        </div>
        {content}
      </div>
    </main>
  );
}

function Ladder({ color, bg, text }: { color: string; bg: string; text: string }) {
  return <span className="rounded-full px-2.5 py-1" style={{ color, background: bg }}>{text}</span>;
}
