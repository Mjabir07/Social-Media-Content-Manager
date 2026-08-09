"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FileText, Plus, Loader2, Trash2, X, AlertTriangle, Send, Check, Ban } from "lucide-react";
import { AzminProfileMenu } from "@/components/azmin/profile-menu";
import {
  quoteStatusMeta,
  nextQuoteActions,
  quoteSubtotalCents,
  formatQuoteMoney,
  type QuoteStatus,
} from "@/lib/quotes-catalog";

type LineDTO = { id?: string; description: string; quantity: number; unitPriceCents: number };
export type QuoteDTO = {
  id: string; number: number; numberLabel: string; leadId: string | null; clientId: string | null;
  title: string; contactName: string; contactEmail: string | null; contactPhone: string | null;
  currency: string; status: QuoteStatus; validUntil: string | null; notes: string | null;
  subtotalCents: number; lines: LineDTO[]; createdAt: string;
};

type FormLine = { description: string; qty: string; unit: string };
const blankLine = (): FormLine => ({ description: "", qty: "1", unit: "" });
const inputCls = "w-full rounded-xl border border-[#B8CCE0] bg-white px-3.5 py-2.5 text-sm text-[#0f2137] outline-none placeholder:text-[#93A9BF] focus:border-[#087CFA]";

export function QuotesView({
  initialQuotes, clients, canManage, userName, userEmail, userRole,
}: {
  initialQuotes: QuoteDTO[];
  clients: { id: string; name: string }[];
  canManage: boolean;
  userName: string;
  userEmail: string;
  userRole: string;
}) {
  const [quotes, setQuotes] = useState<QuoteDTO[]>(initialQuotes);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<FormLine[]>([blankLine()]);

  const lineCents = lines.map((l) => ({ quantity: Math.max(1, Math.round(parseFloat(l.qty) || 1)), unitPriceCents: l.unit ? Math.round(parseFloat(l.unit) * 100) : 0 }));
  const subtotal = quoteSubtotalCents(lineCents);

  async function refresh() {
    const res = await fetch("/api/quotes");
    if (res.ok) setQuotes((await res.json()).quotes as QuoteDTO[]);
  }

  function resetForm() {
    setEditId(null); setTitle(""); setClientId(""); setContactName(""); setContactEmail(""); setContactPhone("");
    setValidUntil(""); setNotes(""); setLines([blankLine()]); setShowForm(false); setError(null);
  }

  function startEdit(q: QuoteDTO) {
    setEditId(q.id); setTitle(q.title); setClientId(q.clientId ?? "");
    setContactName(q.contactName); setContactEmail(q.contactEmail ?? ""); setContactPhone(q.contactPhone ?? "");
    setValidUntil(q.validUntil ? q.validUntil.slice(0, 10) : ""); setNotes(q.notes ?? "");
    setLines(q.lines.length ? q.lines.map((l) => ({ description: l.description, qty: String(l.quantity), unit: String(l.unitPriceCents / 100) })) : [blankLine()]);
    setError(null); setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    const payloadLines = lines.filter((l) => l.description.trim()).map((l) => ({
      description: l.description, quantity: Math.max(1, Math.round(parseFloat(l.qty) || 1)), unitPriceCents: l.unit ? Math.round(parseFloat(l.unit) * 100) : 0,
    }));
    const editing = editId !== null;
    const body = {
      title, clientId: clientId || null, contactName, contactEmail: contactEmail || null, contactPhone: contactPhone || null,
      validUntil: validUntil || null, notes: notes || null, lines: payloadLines,
    };
    const res = await fetch(editing ? `/api/quotes/${editId}` : "/api/quotes", {
      method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) { setError((await res.json().catch(() => ({}))).error ?? "Could not save quote."); return; }
    resetForm(); await refresh();
  }

  async function runAction(id: string, action: "send" | "accept" | "decline") {
    if (action === "accept" && !confirm("Accept this quote? It creates the client + work order and an invoice.")) return;
    setBusyId(id); setError(null);
    const res = await fetch(`/api/quotes/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    setBusyId(null);
    if (!res.ok) { setError((await res.json().catch(() => ({}))).error ?? "Action failed."); return; }
    await refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this quote?")) return;
    setBusyId(id);
    await fetch(`/api/quotes/${id}`, { method: "DELETE" });
    setBusyId(null); await refresh();
  }

  return (
    <main data-azmin-ui className="min-h-screen bg-[#EAF1F9] text-[#03142E]">
      <header className="border-b border-[#C8D8EA] bg-white px-5 py-4 shadow-[0_1px_8px_rgba(3,20,46,.06)] sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <Link href="/azmin" className="flex items-center gap-3">
            <span className="relative h-10 w-10 shrink-0"><Image src="/brand/azmin-c1-mark.png" alt="AZMIN" fill priority sizes="40px" className="object-contain" /></span>
            <span>
              <strong className="block font-display text-[15px] font-bold">AZMIN Digital OS</strong>
              <span className="mt-0.5 block text-[11px] font-extrabold uppercase tracking-[.17em] text-[#456784]">Quotations</span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/azmin/leads" className="hidden rounded-xl border border-[#B8CCE0] bg-[#F8FBFF] px-4 py-2.5 text-xs font-bold text-[#234B70] hover:border-[#087CFA] sm:block">Leads</Link>
            <Link href="/azmin" className="hidden rounded-xl border border-[#B8CCE0] bg-[#F8FBFF] px-4 py-2.5 text-xs font-bold text-[#234B70] hover:border-[#087CFA] sm:block">Command center</Link>
            <AzminProfileMenu name={userName} email={userEmail} role={userRole} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 pb-16 pt-6 sm:px-8 sm:pt-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[.15em] text-[#0758C9]">Sales</p>
            <h1 className="mt-1 flex items-center gap-3 font-display text-3xl font-bold tracking-[-.03em]"><FileText className="text-[#087CFA]" size={28} /> Quotations</h1>
            <p className="mt-1.5 max-w-2xl text-sm text-[#4C6A86]">Quote → send → accept. On accept it auto-creates the client, work order and invoice.</p>
          </div>
          {canManage && !showForm && (
            <button onClick={() => { resetForm(); setShowForm(true); }} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#087CFA] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(8,124,250,.2)] transition hover:bg-[#076BE0]">
              <Plus size={16} /> New quote
            </button>
          )}
        </div>

        {error && !showForm && <p className="mt-4 flex items-center gap-2 rounded-xl border border-[#F0C9C4] bg-[#FDECEC] px-4 py-3 text-xs font-bold text-[#B4231C]"><AlertTriangle size={14} /> {error}</p>}

        {showForm && (
          <form onSubmit={handleSubmit} className="mt-6 grid gap-3 rounded-2xl border border-[#C5D6E6] bg-white p-5 shadow-[0_10px_28px_rgba(3,20,46,.05)] sm:grid-cols-2">
            {editId && <p className="sm:col-span-2 -mb-1 text-xs font-bold text-[#5C3AAE]">Editing quote</p>}
            <label className="text-xs font-bold text-[#476987] sm:col-span-2">Title
              <input className={`mt-1 ${inputCls}`} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Website + hosting package" required minLength={2} />
            </label>
            <label className="text-xs font-bold text-[#476987]">Contact name
              <input className={`mt-1 ${inputCls}`} value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Person / company" required minLength={2} />
            </label>
            <label className="text-xs font-bold text-[#476987]">Existing client <span className="font-normal text-[#93A9BF]">(optional)</span>
              <select className={`mt-1 ${inputCls}`} value={clientId} onChange={(e) => setClientId(e.target.value)}>
                <option value="">— new (create on accept) —</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="text-xs font-bold text-[#476987]">Email
              <input className={`mt-1 ${inputCls}`} type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="client@email.com" />
            </label>
            <label className="text-xs font-bold text-[#476987]">Phone <span className="font-normal text-[#93A9BF]">(WhatsApp)</span>
              <input className={`mt-1 ${inputCls}`} value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+971 …" />
            </label>
            <label className="text-xs font-bold text-[#476987]">Valid until
              <input className={`mt-1 ${inputCls}`} type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </label>

            {/* Line items */}
            <div className="sm:col-span-2">
              <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[.14em] text-[#456784]">Line items</p>
              <div className="grid gap-2">
                {lines.map((l, i) => (
                  <div key={i} className="grid grid-cols-[1fr_70px_100px_90px_32px] items-center gap-2">
                    <input className={inputCls} value={l.description} onChange={(e) => setLines((p) => p.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} placeholder="Description" />
                    <input className={inputCls} type="number" min="1" step="1" value={l.qty} onChange={(e) => setLines((p) => p.map((x, j) => j === i ? { ...x, qty: e.target.value } : x))} placeholder="Qty" />
                    <input className={inputCls} type="number" min="0" step="0.01" value={l.unit} onChange={(e) => setLines((p) => p.map((x, j) => j === i ? { ...x, unit: e.target.value } : x))} placeholder="Unit" />
                    <span className="text-right text-xs font-bold text-[#234B70]">{formatQuoteMoney(lineCents[i].quantity * lineCents[i].unitPriceCents, "AED")}</span>
                    <button type="button" onClick={() => setLines((p) => p.length > 1 ? p.filter((_, j) => j !== i) : p)} className="grid h-9 w-8 place-items-center rounded-lg text-[#C0362C] hover:bg-[#FDECEC]"><X size={14} /></button>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <button type="button" onClick={() => setLines((p) => [...p, blankLine()])} className="inline-flex items-center gap-1 rounded-lg border border-[#B8CCE0] bg-[#F8FBFF] px-3 py-1.5 text-xs font-bold text-[#234B70] hover:border-[#087CFA]"><Plus size={13} /> Add line</button>
                <span className="text-sm font-bold text-[#173A5C]">Total: {formatQuoteMoney(subtotal, "AED")}</span>
              </div>
            </div>

            <label className="text-xs font-bold text-[#476987] sm:col-span-2">Notes
              <input className={`mt-1 ${inputCls}`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Terms, scope, payment…" />
            </label>
            {error && <p className="sm:col-span-2 text-xs font-bold text-[#C0362C]">{error}</p>}
            <div className="flex items-center gap-2 sm:col-span-2">
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#087CFA] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#076BE0] disabled:opacity-60">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} {editId ? "Update quote" : "Create quote"}
              </button>
              <button type="button" onClick={resetForm} className="inline-flex items-center gap-1.5 rounded-xl border border-[#B8CCE0] bg-white px-4 py-2.5 text-sm font-bold text-[#234B70]"><X size={15} /> Cancel</button>
            </div>
          </form>
        )}

        {quotes.length === 0 && !showForm ? (
          <div className="mt-8 rounded-2xl border border-dashed border-[#B8CCE0] bg-white/60 p-10 text-center">
            <FileText className="mx-auto text-[#8FA9C2]" size={30} />
            <p className="mt-3 font-display text-lg font-bold text-[#234B70]">No quotes yet</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-[#4C6A86]">Create a quote, send it, and accept it to spin up the client, work order and invoice.</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-3">
            {quotes.map((q) => {
              const meta = quoteStatusMeta[q.status];
              const actions = nextQuoteActions(q.status);
              const busy = busyId === q.id;
              return (
                <article key={q.id} className="rounded-2xl border border-[#C5D6E6] bg-white p-5 shadow-[0_10px_28px_rgba(3,20,46,.05)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-[#EDF1F6] px-2 py-0.5 text-[11px] font-bold text-[#5A7189]">{q.numberLabel}</span>
                        <span className="font-bold text-[#173A5C]">{q.title}</span>
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: meta.color, background: meta.bg }}>{meta.label}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-[#526F8A]">
                        <span>{q.contactName}</span>
                        {q.contactEmail && <span className="text-[#8299AE]">{q.contactEmail}</span>}
                        {q.contactPhone && <span className="text-[#8299AE]">{q.contactPhone}</span>}
                        <span className="text-[#234B70]">{formatQuoteMoney(q.subtotalCents, q.currency)}</span>
                        {q.validUntil && <span className="text-[#8299AE]">valid to {new Date(q.validUntil).toLocaleDateString("en-GB")}</span>}
                      </div>
                      <ul className="mt-2 space-y-0.5 text-xs text-[#5A7189]">
                        {q.lines.map((l) => (
                          <li key={l.id ?? l.description}>{l.description} — {l.quantity} × {formatQuoteMoney(l.unitPriceCents, q.currency)} = {formatQuoteMoney(l.quantity * l.unitPriceCents, q.currency)}</li>
                        ))}
                      </ul>
                    </div>
                    {canManage && (
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        {actions.includes("send") && <button onClick={() => runAction(q.id, "send")} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg border border-[#B8CCE0] bg-white px-3 py-2 text-xs font-bold text-[#0758C9] hover:border-[#087CFA] disabled:opacity-60">{busy ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Send</button>}
                        {actions.includes("accept") && <button onClick={() => runAction(q.id, "accept")} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg border border-[#B8CCE0] bg-white px-3 py-2 text-xs font-bold text-[#087B54] hover:border-[#16A34A] disabled:opacity-60">{busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Accept</button>}
                        {actions.includes("decline") && <button onClick={() => runAction(q.id, "decline")} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg border border-[#E4C8CC] bg-white px-3 py-2 text-xs font-bold text-[#9A6711] hover:border-[#D14343] disabled:opacity-60"><Ban size={13} /> Decline</button>}
                        {actions.includes("edit") && <button onClick={() => startEdit(q)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#B8CCE0] bg-white px-3 py-2 text-xs font-bold text-[#234B70] hover:border-[#087CFA]">Edit</button>}
                        <button onClick={() => remove(q.id)} disabled={busy} className="inline-flex items-center rounded-lg border border-[#F0C9C4] bg-white px-3 py-2 text-[#C0362C] hover:bg-[#FDECEC] disabled:opacity-60"><Trash2 size={13} /></button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
