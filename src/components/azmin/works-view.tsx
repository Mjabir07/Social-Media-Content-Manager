"use client";

import { useState } from "react";
import { Briefcase, Plus, Loader2, Trash2, Pencil, Building2, Wallet, X, AlertTriangle } from "lucide-react";
import {
  WORK_STATUSES,
  workStatusMeta,
  formatWorkAmount,
  worksTotalCents,
  type WorkStatus,
} from "@/lib/works-catalog";

export type WorkDTO = {
  id: string;
  clientId: string;
  title: string;
  serviceType: string | null;
  endCustomer: string | null;
  quantity: number;
  unitPriceCents: number | null;
  amountCents: number | null;
  currency: string;
  status: WorkStatus;
  invoiced: boolean;
  startDate: string | null;
  notes: string | null;
  createdAt: string;
};

const inputCls =
  "w-full rounded-xl border border-[#B8CCE0] bg-white px-3.5 py-2.5 text-sm text-[#0f2137] outline-none placeholder:text-[#93A9BF] focus:border-[#087CFA]";

export function WorksView({
  initialWorks,
  clientId,
  isReseller,
  canManage,
}: {
  initialWorks: WorkDTO[];
  clientId: string;
  isReseller: boolean;
  canManage: boolean;
}) {
  const [works, setWorks] = useState<WorkDTO[]>(initialWorks);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [endCustomer, setEndCustomer] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [status, setStatus] = useState<WorkStatus>("ACTIVE");
  const [notes, setNotes] = useState("");

  const qtyNum = Math.max(1, Math.round(parseFloat(quantity) || 1));
  const unitCents = unitPrice ? Math.round(parseFloat(unitPrice) * 100) : null;
  const previewAmount = unitCents != null ? qtyNum * unitCents : null;

  async function refresh() {
    const res = await fetch(`/api/works?clientId=${clientId}`, { cache: "no-store" });
    if (res.ok) setWorks((await res.json()).works ?? []);
  }

  function resetForm() {
    setEditId(null); setTitle(""); setServiceType(""); setEndCustomer(""); setQuantity("1"); setUnitPrice(""); setStatus("ACTIVE"); setNotes("");
    setShowForm(false); setError(null);
  }

  function startEdit(w: WorkDTO) {
    setEditId(w.id);
    setTitle(w.title);
    setServiceType(w.serviceType ?? "");
    setEndCustomer(w.endCustomer ?? "");
    setQuantity(String(w.quantity || 1));
    setUnitPrice(w.unitPriceCents != null ? String(w.unitPriceCents / 100) : "");
    setStatus(w.status);
    setNotes(w.notes ?? "");
    setError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const editing = editId !== null;
    const body = { title, serviceType: serviceType || null, endCustomer: endCustomer || null, quantity: qtyNum, unitPriceCents: unitCents, status, notes: notes || null, ...(editing ? {} : { clientId }) };
    const res = await fetch(editing ? `/api/works/${editId}` : "/api/works", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error ?? "Could not save work.");
      return;
    }
    resetForm();
    await refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this work order?")) return;
    setBusyId(id);
    await fetch(`/api/works/${id}`, { method: "DELETE" });
    setBusyId(null);
    await refresh();
  }

  const total = worksTotalCents(works);
  const currency = works[0]?.currency ?? "AED";

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {canManage && !showForm && (
          <button onClick={() => { resetForm(); setShowForm(true); }} className="inline-flex items-center gap-2 rounded-xl bg-[#087CFA] px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(8,124,250,.2)] transition hover:bg-[#076BE0]">
            <Plus size={16} /> Add work order
          </button>
        )}
        {works.length > 0 && (
          <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#456784] shadow-[0_1px_4px_rgba(3,20,46,.05)]">
            {works.length} order{works.length === 1 ? "" : "s"} · {formatWorkAmount(total, currency)}
          </span>
        )}
        {isReseller && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#EFEBFB] px-3 py-1.5 text-xs font-bold text-[#5C3AAE]">
            <Building2 size={13} /> Reseller — tag each order with its end-customer
          </span>
        )}
      </div>

      {error && !showForm && (
        <p className="mb-4 flex items-center gap-2 rounded-xl border border-[#F0C9C4] bg-[#FDECEC] px-4 py-3 text-xs font-bold text-[#B4231C]">
          <AlertTriangle size={14} /> {error}
        </p>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 grid gap-3 rounded-2xl border border-[#C5D6E6] bg-white p-5 shadow-[0_10px_28px_rgba(3,20,46,.05)] sm:grid-cols-2">
          {editId && <p className="sm:col-span-2 -mb-1 text-xs font-bold text-[#5C3AAE]">Editing work order</p>}
          <label className="text-xs font-bold text-[#476987] sm:col-span-2">
            Work order title
            <input className={`mt-1 ${inputCls}`} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Website redesign" required minLength={2} />
          </label>
          <label className="text-xs font-bold text-[#476987]">
            Service type
            <input className={`mt-1 ${inputCls}`} value={serviceType} onChange={(e) => setServiceType(e.target.value)} placeholder="Website / SEO / Email setup" />
          </label>
          <label className="text-xs font-bold text-[#476987]">
            End-customer {isReseller ? <span className="text-[#5C3AAE]">(who this order is for)</span> : <span className="font-normal text-[#93A9BF]">(optional)</span>}
            <input className={`mt-1 ${inputCls}`} value={endCustomer} onChange={(e) => setEndCustomer(e.target.value)} placeholder="End-company name" />
          </label>
          <label className="text-xs font-bold text-[#476987]">
            Quantity <span className="font-normal text-[#93A9BF]">(seats / units / licenses)</span>
            <input className={`mt-1 ${inputCls}`} type="number" min="1" step="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="1" />
          </label>
          <label className="text-xs font-bold text-[#476987]">
            Unit price
            <input className={`mt-1 ${inputCls}`} type="number" min="0" step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} placeholder="0.00" />
          </label>
          <div className="text-xs font-bold text-[#476987]">
            Amount <span className="font-normal text-[#93A9BF]">(auto: qty × unit)</span>
            <div className="mt-1 flex items-center rounded-xl border border-[#DDE8F2] bg-[#F7FAFE] px-3.5 py-2.5 text-sm font-bold text-[#173A5C]">
              {previewAmount != null ? formatWorkAmount(previewAmount, "AED") : <span className="font-normal text-[#93A9BF]">—</span>}
              {previewAmount != null && previewAmount > 0 && <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-[#9A6711]">auto-invoiced · pending</span>}
            </div>
          </div>
          <label className="text-xs font-bold text-[#476987]">
            Status
            <select className={`mt-1 ${inputCls}`} value={status} onChange={(e) => setStatus(e.target.value as WorkStatus)}>
              {WORK_STATUSES.map((s) => <option key={s} value={s}>{workStatusMeta[s].label}</option>)}
            </select>
          </label>
          <label className="text-xs font-bold text-[#476987] sm:col-span-2">
            Notes
            <input className={`mt-1 ${inputCls}`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Scope, deadline, contact…" />
          </label>
          {error && <p className="sm:col-span-2 flex items-center gap-1.5 text-xs font-bold text-[#C0362C]"><AlertTriangle size={13} /> {error}</p>}
          <div className="flex items-center gap-2 sm:col-span-2">
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#087CFA] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#076BE0] disabled:opacity-60">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} {editId ? "Update work order" : "Add work order"}
            </button>
            <button type="button" onClick={resetForm} className="inline-flex items-center gap-1.5 rounded-xl border border-[#B8CCE0] bg-white px-4 py-2.5 text-sm font-bold text-[#234B70]">
              <X size={15} /> Cancel
            </button>
          </div>
        </form>
      )}

      {works.length === 0 && !showForm ? (
        <div className="rounded-2xl border border-dashed border-[#AFC6DE] bg-[#F5F9FE] px-5 py-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF9FF] text-[#087CFA]"><Briefcase size={30} /></div>
          <h3 className="mt-4 text-base font-bold text-[#173A5C]">No work orders yet</h3>
          <p className="mt-1 text-sm text-[#526F8A]">{canManage ? "Add the first work order for this client." : "Ask an editor to add a work order."}</p>
        </div>
      ) : (
        <ul className="grid gap-3">
          {works.map((w) => {
            const meta = workStatusMeta[w.status];
            const amt = formatWorkAmount(w.amountCents, w.currency);
            const busy = busyId === w.id;
            return (
              <li key={w.id} className="flex flex-col gap-3 rounded-2xl border border-[#C5D6E6] bg-white p-5 shadow-[0_10px_28px_rgba(3,20,46,.05)] sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-[#173A5C]">{w.title}</span>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: meta.color, background: meta.bg }}>{meta.label}</span>
                    {w.serviceType && <span className="rounded-full bg-[#EDF4FB] px-2 py-0.5 text-[10px] font-bold text-[#3B668E]">{w.serviceType}</span>}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-[#526F8A]">
                    {w.endCustomer && <span className="inline-flex items-center gap-1 text-[#5C3AAE]"><Building2 size={12} /> {w.endCustomer}</span>}
                    {w.unitPriceCents != null && <span className="text-[#72899E]">{w.quantity} × {formatWorkAmount(w.unitPriceCents, w.currency)}</span>}
                    {amt && <span className="text-[#234B70]">= {amt}</span>}
                    {w.invoiced && <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF1D5] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#9A6711]"><Wallet size={11} /> Invoiced · pending</span>}
                  </div>
                  {w.notes && <p className="mt-1 text-xs text-[#7C93A8]">{w.notes}</p>}
                </div>
                {canManage && (
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <button onClick={() => startEdit(w)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#B8CCE0] bg-white px-3 py-2 text-xs font-bold text-[#234B70] transition hover:border-[#087CFA]">
                      <Pencil size={13} /> Edit
                    </button>
                    <button onClick={() => remove(w.id)} disabled={busy} className="inline-flex items-center rounded-lg border border-[#F0C9C4] bg-white px-3 py-2 text-[#C0362C] transition hover:bg-[#FDECEC] disabled:opacity-60">
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
