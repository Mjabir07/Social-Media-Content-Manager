"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Wallet, ArrowDownCircle, ArrowUpCircle, Plus, Loader2, X, AlertTriangle, Trash2, TrendingUp, Check } from "lucide-react";
import { AzminProfileMenu } from "@/components/azmin/profile-menu";
import {
  computeSummary, byCategory, byClient, byMonth, categoriesFor, categoryLabels, formatMoney,
  type TxType, type TxStatus,
} from "@/lib/finance-core";

export type TransactionDTO = {
  id: string;
  type: TxType;
  amountCents: number;
  currency: string;
  category: string;
  clientId: string | null;
  vendor: string | null;
  description: string | null;
  date: string;
  status: TxStatus;
  method: string | null;
};

const CURRENCIES = ["AED", "USD", "INR", "SAR", "EUR", "GBP"];

export function FinanceView({
  initialTransactions,
  clients,
  canManage,
  userName,
  userEmail,
  userRole,
  scopeClientId,
  embedded = false,
}: {
  initialTransactions: TransactionDTO[];
  clients: { id: string; name: string }[];
  canManage: boolean;
  userName: string;
  userEmail: string;
  userRole: string;
  scopeClientId?: string;
  embedded?: boolean;
}) {
  const [txns, setTxns] = useState(initialTransactions);
  const [fType, setFType] = useState("");
  const [fClient, setFClient] = useState("");
  const [fFrom, setFFrom] = useState("");
  const [fTo, setFTo] = useState("");
  const [showForm, setShowForm] = useState(false);

  // form
  const [type, setType] = useState<TxType>("INCOME");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("AED");
  const [category, setCategory] = useState("RENEWAL");
  const [clientId, setClientId] = useState(scopeClientId ?? "");
  const [vendor, setVendor] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<TxStatus>("PAID");
  const [method, setMethod] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const nameOf = useMemo(() => new Map(clients.map((c) => [c.id, c.name])), [clients]);
  const like = txns.map((t) => ({ type: t.type, amountCents: t.amountCents, status: t.status, category: t.category, clientId: t.clientId }));
  const summary = computeSummary(like);
  const categories = byCategory(like);
  const clientPnL = byClient(like);
  const displayCurrency = txns[0]?.currency ?? "AED";

  async function load(next: { type?: string; clientId?: string; from?: string; to?: string }) {
    const p = new URLSearchParams();
    const t = next.type ?? fType; const c = scopeClientId ?? next.clientId ?? fClient; const f = next.from ?? fFrom; const to = next.to ?? fTo;
    if (t) p.set("type", t);
    if (c) p.set("clientId", c);
    if (f) p.set("from", f);
    if (to) p.set("to", to);
    const res = await fetch(`/api/finance?${p.toString()}`, { cache: "no-store" });
    if (res.ok) setTxns((await res.json()).transactions ?? []);
  }

  function pickType(t: TxType) {
    setType(t);
    setCategory(categoriesFor(t)[0]);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const amountCents = amount ? Math.round(parseFloat(amount) * 100) : 0;
    if (amountCents <= 0) { setError("Enter an amount."); return; }
    setSaving(true); setError(null);
    const res = await fetch("/api/finance", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, amountCents, currency, category, clientId: scopeClientId ?? clientId ?? null, vendor: vendor || null, description: description || null, date, status, method: method || null }),
    });
    setSaving(false);
    if (!res.ok) { setError((await res.json().catch(() => ({}))).error ?? "Could not save."); return; }
    setAmount(""); setVendor(""); setDescription(""); setMethod(""); setShowForm(false);
    await load({});
  }

  async function markPaid(id: string) {
    setBusyId(id);
    await fetch(`/api/finance/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "PAID" }) });
    setBusyId(null);
    await load({});
  }

  async function remove(id: string) {
    if (!confirm("Delete this entry?")) return;
    setBusyId(id);
    await fetch(`/api/finance/${id}`, { method: "DELETE" });
    setBusyId(null);
    await load({});
  }

  const inputCls = "w-full rounded-xl border border-[#B8CCE0] bg-white px-3.5 py-2.5 text-sm text-[#0f2137] outline-none placeholder:text-[#93A9BF] focus:border-[#087CFA]";
  const net = summary.netCents;
  const months = useMemo(() => byMonth(txns.map((t) => ({ type: t.type, amountCents: t.amountCents, status: t.status, category: t.category, clientId: t.clientId, date: t.date }))), [txns]);

  const content = (
    <>
        {canManage && embedded && !showForm && (
          <button onClick={() => setShowForm(true)} className="mb-4 inline-flex items-center gap-2 rounded-xl bg-[#087CFA] px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(8,124,250,.2)] transition hover:bg-[#076BE0]">
            <Plus size={16} /> Add entry
          </button>
        )}

        {/* Summary cards */}
        <div className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-4 ${embedded ? "" : "mt-6"}`}>
          <Card label="Money in" value={formatMoney(summary.incomeCents, displayCurrency)} tone="#087B54" icon={<ArrowDownCircle size={18} />} sub={summary.pendingIncomeCents ? `+${formatMoney(summary.pendingIncomeCents, displayCurrency)} pending` : "received"} />
          <Card label="Money out" value={formatMoney(summary.expenseCents, displayCurrency)} tone="#B4231C" icon={<ArrowUpCircle size={18} />} sub={summary.pendingExpenseCents ? `+${formatMoney(summary.pendingExpenseCents, displayCurrency)} pending` : "spent"} />
          <Card label="Net profit" value={formatMoney(net, displayCurrency)} tone={net >= 0 ? "#087B54" : "#B4231C"} icon={<TrendingUp size={18} />} sub={net >= 0 ? "profit" : "loss"} highlight />
          <Card label="Entries" value={String(summary.count)} tone="#234B70" icon={<Wallet size={18} />} sub="in view" />
        </div>

        {/* Filters */}
        <div className="mt-5 flex flex-wrap items-center gap-2 rounded-xl border border-[#D7E4F0] bg-white px-4 py-3">
          <span className="text-xs font-bold text-[#72899E]">Filter:</span>
          <select value={fType} onChange={(e) => { setFType(e.target.value); load({ type: e.target.value }); }} className="rounded-lg border border-[#B8CCE0] bg-white px-2.5 py-1.5 text-xs font-bold text-[#234B70] outline-none focus:border-[#087CFA]">
            <option value="">All types</option>
            <option value="INCOME">Money in</option>
            <option value="EXPENSE">Money out</option>
          </select>
          {!scopeClientId && (
            <select value={fClient} onChange={(e) => { setFClient(e.target.value); load({ clientId: e.target.value }); }} className="rounded-lg border border-[#B8CCE0] bg-white px-2.5 py-1.5 text-xs font-bold text-[#234B70] outline-none focus:border-[#087CFA]">
              <option value="">All clients</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          <label className="flex items-center gap-1 text-xs font-bold text-[#72899E]">From <input type="date" value={fFrom} onChange={(e) => { setFFrom(e.target.value); load({ from: e.target.value }); }} className="rounded-lg border border-[#B8CCE0] bg-white px-2 py-1.5 text-xs text-[#0f2137] outline-none focus:border-[#087CFA]" /></label>
          <label className="flex items-center gap-1 text-xs font-bold text-[#72899E]">To <input type="date" value={fTo} onChange={(e) => { setFTo(e.target.value); load({ to: e.target.value }); }} className="rounded-lg border border-[#B8CCE0] bg-white px-2 py-1.5 text-xs text-[#0f2137] outline-none focus:border-[#087CFA]" /></label>
          {(fType || fClient || fFrom || fTo) && (
            <button onClick={() => { setFType(""); setFClient(""); setFFrom(""); setFTo(""); load({ type: "", clientId: "", from: "", to: "" }); }} className="inline-flex items-center gap-1 rounded-lg border border-[#B8CCE0] bg-white px-2.5 py-1.5 text-xs font-bold text-[#234B70] hover:border-[#087CFA]"><X size={12} /> Clear</button>
          )}
        </div>

        {/* Add form */}
        {showForm && (
          <form onSubmit={handleCreate} className="mt-5 rounded-2xl border border-[#C5D6E6] bg-white p-5 shadow-[0_10px_28px_rgba(3,20,46,.05)]">
            <div className="flex gap-2">
              <button type="button" onClick={() => pickType("INCOME")} className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition ${type === "INCOME" ? "bg-[#E7F8EF] text-[#087B54] ring-2 ring-[#087B54]" : "border border-[#B8CCE0] bg-white text-[#526F8A]"}`}>
                <ArrowDownCircle className="mr-1 inline" size={15} /> Money in
              </button>
              <button type="button" onClick={() => pickType("EXPENSE")} className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition ${type === "EXPENSE" ? "bg-[#FDECEC] text-[#B4231C] ring-2 ring-[#B4231C]" : "border border-[#B8CCE0] bg-white text-[#526F8A]"}`}>
                <ArrowUpCircle className="mr-1 inline" size={15} /> Money out
              </button>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-bold text-[#476987]">Amount
                <div className="mt-1 flex gap-2">
                  <input className={inputCls} type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required />
                  <select className="rounded-xl border border-[#B8CCE0] bg-white px-2 text-sm font-bold text-[#234B70] outline-none" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </label>
              <label className="text-xs font-bold text-[#476987]">Category
                <select className={`mt-1 ${inputCls}`} value={category} onChange={(e) => setCategory(e.target.value)}>
                  {categoriesFor(type).map((c) => <option key={c} value={c}>{categoryLabels[c] ?? c}</option>)}
                </select>
              </label>
              {!scopeClientId && (
                <label className="text-xs font-bold text-[#476987]">Client (optional)
                  <select className={`mt-1 ${inputCls}`} value={clientId} onChange={(e) => setClientId(e.target.value)}>
                    <option value="">— none —</option>
                    {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </label>
              )}
              <label className="text-xs font-bold text-[#476987]">{type === "INCOME" ? "Paid by" : "Paid to / vendor"}
                <input className={`mt-1 ${inputCls}`} value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder={type === "INCOME" ? "client / source" : "e.g. Google, Hetzner"} />
              </label>
              <label className="text-xs font-bold text-[#476987]">Date
                <input className={`mt-1 ${inputCls}`} type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </label>
              <label className="text-xs font-bold text-[#476987]">Status
                <select className={`mt-1 ${inputCls}`} value={status} onChange={(e) => setStatus(e.target.value as TxStatus)}>
                  <option value="PAID">Paid (money received)</option>
                  <option value="PENDING">Pending (awaiting payment)</option>
                </select>
              </label>
              <label className="text-xs font-bold text-[#476987]">Method
                <select className={`mt-1 ${inputCls}`} value={method} onChange={(e) => setMethod(e.target.value)}>
                  <option value="">—</option>
                  <option value="Bank transfer">Bank transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Online">Online</option>
                </select>
              </label>
              <label className="text-xs font-bold text-[#476987] sm:col-span-2">Note
                <input className={`mt-1 ${inputCls}`} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="what is this for" />
              </label>
            </div>
            {error && <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#C0362C]"><AlertTriangle size={13} /> {error}</p>}
            <div className="mt-3 flex items-center gap-2">
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#087CFA] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#076BE0] disabled:opacity-60">{saving && <Loader2 size={15} className="animate-spin" />} Save entry</button>
              <button type="button" onClick={() => { setShowForm(false); setError(null); }} className="inline-flex items-center gap-1.5 rounded-xl border border-[#B8CCE0] bg-white px-4 py-2.5 text-sm font-bold text-[#234B70]"><X size={15} /> Cancel</button>
            </div>
          </form>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Ledger */}
          <div>
            <h2 className="mb-3 font-display text-lg font-bold text-[#173A5C]">Transactions</h2>
            {txns.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#AFC6DE] bg-[#F5F9FE] px-5 py-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF9FF] text-[#087CFA]"><Wallet size={30} /></div>
                <h3 className="mt-4 text-base font-bold text-[#173A5C]">No entries</h3>
                <p className="mt-1 text-sm text-[#526F8A]">{canManage ? "Add money in / money out to see profit." : "Nothing recorded yet."}</p>
              </div>
            ) : (
              <ul className="divide-y divide-[#EAF1F9] overflow-hidden rounded-2xl border border-[#C5D6E6] bg-white">
                {txns.map((t) => {
                  const income = t.type === "INCOME";
                  return (
                    <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${income ? "bg-[#E7F8EF] text-[#087B54]" : "bg-[#FDECEC] text-[#B4231C]"}`}>
                        {income ? <ArrowDownCircle size={17} /> : <ArrowUpCircle size={17} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-[#173A5C]">{categoryLabels[t.category] ?? t.category}</span>
                          {t.clientId && nameOf.get(t.clientId) && <span className="rounded-full bg-[#EAF1F9] px-2 py-0.5 text-[10px] font-bold text-[#5B7690]">{nameOf.get(t.clientId)}</span>}
                          {t.status === "PENDING" && <span className="rounded-full bg-[#FFF1D5] px-2 py-0.5 text-[10px] font-bold uppercase text-[#9A6711]">Pending</span>}
                        </div>
                        <div className="text-xs text-[#8299AE]">{new Date(t.date).toLocaleDateString()}{t.vendor ? ` · ${t.vendor}` : ""}{t.method ? ` · ${t.method}` : ""}{t.description ? ` · ${t.description}` : ""}</div>
                      </div>
                      {canManage && t.status === "PENDING" && (
                        <button onClick={() => markPaid(t.id)} disabled={busyId === t.id} title="Mark as received (money in your account/cash)" className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[#B8CCE0] bg-white px-2.5 py-1.5 text-[11px] font-bold text-[#087B54] transition hover:border-[#16A34A] disabled:opacity-60">
                          {busyId === t.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Mark paid
                        </button>
                      )}
                      <span className={`shrink-0 font-bold ${income ? "text-[#087B54]" : "text-[#B4231C]"}`}>{income ? "+" : "−"}{formatMoney(t.amountCents, t.currency)}</span>
                      {canManage && <button onClick={() => remove(t.id)} disabled={busyId === t.id} className="shrink-0 text-[#C0362C] opacity-60 hover:opacity-100 disabled:opacity-30"><Trash2 size={14} /></button>}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Side reports */}
          <div className="space-y-6">
            {months.length > 0 && <MonthlyChart months={months} currency={displayCurrency} />}
            {!scopeClientId && clientPnL.length > 0 && (
              <div className="rounded-2xl border border-[#C5D6E6] bg-white p-5 shadow-[0_10px_28px_rgba(3,20,46,.05)]">
                <h3 className="mb-3 font-bold text-[#173A5C]">Profit by client</h3>
                <ul className="space-y-2">
                  {clientPnL.map((p) => (
                    <li key={p.clientId} className="flex items-center justify-between text-sm">
                      <span className="truncate font-semibold text-[#456784]">{nameOf.get(p.clientId) ?? "Unknown"}</span>
                      <span className={`font-bold ${p.netCents >= 0 ? "text-[#087B54]" : "text-[#B4231C]"}`}>{p.netCents >= 0 ? "+" : "−"}{formatMoney(Math.abs(p.netCents), displayCurrency)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {categories.length > 0 && (
              <div className="rounded-2xl border border-[#C5D6E6] bg-white p-5 shadow-[0_10px_28px_rgba(3,20,46,.05)]">
                <h3 className="mb-3 font-bold text-[#173A5C]">By category</h3>
                <ul className="space-y-2">
                  {categories.map((c) => (
                    <li key={c.category} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 font-semibold text-[#456784]">
                        <span className={`h-2 w-2 rounded-full ${c.type === "INCOME" ? "bg-[#087B54]" : "bg-[#B4231C]"}`} /> {c.label}
                      </span>
                      <span className="font-bold text-[#234B70]">{formatMoney(c.totalCents, displayCurrency)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
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
              <span className="mt-0.5 block text-[11px] font-extrabold uppercase tracking-[.17em] text-[#456784]">Finance</span>
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
            <p className="text-[11px] font-extrabold uppercase tracking-[.15em] text-[#0758C9]">Accounts</p>
            <h1 className="mt-1 flex items-center gap-3 font-display text-3xl font-bold tracking-[-.03em]">
              <Wallet className="text-[#087CFA]" size={28} /> Finance &amp; Profit
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-[#4C6A86]">Log money in (client charges) and money out (server, licenses, vendors). Profit is worked out for you.</p>
          </div>
          {canManage && !showForm && (
            <button onClick={() => setShowForm(true)} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#087CFA] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(8,124,250,.2)] transition hover:bg-[#076BE0]">
              <Plus size={16} /> Add entry
            </button>
          )}
        </div>
        {content}
      </div>
    </main>
  );
}

function MonthlyChart({ months, currency }: { months: { month: string; label: string; incomeCents: number; expenseCents: number; netCents: number }[]; currency: string }) {
  const recent = months.slice(-6);
  const max = Math.max(1, ...recent.map((m) => Math.max(m.incomeCents, m.expenseCents)));
  return (
    <div className="rounded-2xl border border-[#C5D6E6] bg-white p-5 shadow-[0_10px_28px_rgba(3,20,46,.05)]">
      <h3 className="mb-3 font-bold text-[#173A5C]">Monthly in / out</h3>
      <div className="flex items-end justify-between gap-2" style={{ height: 120 }}>
        {recent.map((m) => (
          <div key={m.month} className="flex flex-1 flex-col items-center justify-end gap-1" title={`${m.label}: net ${formatMoney(m.netCents, currency)}`}>
            <div className="flex w-full items-end justify-center gap-0.5" style={{ height: 90 }}>
              <div className="w-2.5 rounded-t bg-[#087B54]" style={{ height: `${(m.incomeCents / max) * 90}px` }} />
              <div className="w-2.5 rounded-t bg-[#B4231C]" style={{ height: `${(m.expenseCents / max) * 90}px` }} />
            </div>
            <span className="text-[9px] font-bold text-[#72899E]">{m.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-4 text-[10px] font-bold text-[#72899E]">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#087B54]" /> In</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#B4231C]" /> Out</span>
      </div>
    </div>
  );
}

function Card({ label, value, tone, icon, sub, highlight }: { label: string; value: string; tone: string; icon: React.ReactNode; sub: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border bg-white px-4 py-4 shadow-[0_6px_18px_rgba(3,20,46,.04)] ${highlight ? "border-[#087CFA] ring-1 ring-[#087CFA]/30" : "border-[#C5D6E6]"}`}>
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#72899E]"><span style={{ color: tone }}>{icon}</span> {label}</div>
      <div className="mt-1 text-2xl font-black" style={{ color: tone }}>{value}</div>
      <div className="text-[11px] font-semibold text-[#93A9BF]">{sub}</div>
    </div>
  );
}
