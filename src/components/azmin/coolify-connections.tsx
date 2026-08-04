"use client";

import { useState } from "react";
import { Server, Plus, Trash2, Loader2, CheckCircle2, AlertTriangle, X, Activity } from "lucide-react";

export type CoolifyConnectionDTO = {
  id: string;
  name: string;
  baseUrl: string;
  status: string;
  lastError: string | null;
  lastCheckedAt: string | Date | null;
};

const STATUS_STYLE: Record<string, string> = {
  CONNECTED: "bg-[#E7F8EF] text-[#087B54]",
  ERROR: "bg-[#FDECEC] text-[#C0362C]",
  DISCONNECTED: "bg-[#EEF3F8] text-[#5B7690]",
};

export function CoolifyConnections({
  initialConnections,
  canManage,
}: {
  initialConnections: CoolifyConnectionDTO[];
  canManage: boolean;
}) {
  const [connections, setConnections] = useState(initialConnections);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [token, setToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/coolify", { cache: "no-store" });
    if (res.ok) setConnections((await res.json()).connections ?? []);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/coolify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, baseUrl, token }),
    });
    setSaving(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error ?? "Could not save connection.");
      return;
    }
    setName("");
    setBaseUrl("");
    setToken("");
    setShowForm(false);
    await refresh();
  }

  async function handleTest(id: string) {
    setBusyId(id);
    await fetch(`/api/coolify/${id}/test`, { method: "POST" });
    setBusyId(null);
    await refresh();
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    await fetch(`/api/coolify/${id}`, { method: "DELETE" });
    setBusyId(null);
    await refresh();
  }

  const inputCls = "w-full rounded-xl border border-[#B8CCE0] bg-white px-3.5 py-2.5 text-sm text-[#0f2137] outline-none placeholder:text-[#93A9BF] focus:border-[#087CFA]";

  return (
    <section className="rounded-2xl border border-[#C5D6E6] bg-white p-6 shadow-[0_10px_28px_rgba(3,20,46,.05)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#EAF9FF] text-[#087CFA]">
            <Server size={22} />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-[#173A5C]">Coolify connections</h2>
            <p className="text-sm text-[#526F8A]">Connect your VPS running Coolify. The API token is encrypted in the vault.</p>
          </div>
        </div>
        {canManage && !showForm && (
          <button onClick={() => setShowForm(true)} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#087CFA] px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(8,124,250,.2)] transition hover:bg-[#076BE0]">
            <Plus size={16} /> Connect Coolify
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mt-5 grid gap-3 rounded-xl border border-[#D7E4F0] bg-[#F7FAFE] p-4 sm:grid-cols-2">
          <label className="text-xs font-bold text-[#476987]">
            Name
            <input className={`mt-1 ${inputCls}`} value={name} onChange={(e) => setName(e.target.value)} placeholder="Hetzner Coolify" required minLength={2} />
          </label>
          <label className="text-xs font-bold text-[#476987]">
            Base URL
            <input className={`mt-1 ${inputCls}`} value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://coolify.yourdomain.com" type="url" required />
          </label>
          <label className="text-xs font-bold text-[#476987] sm:col-span-2">
            API token
            <input className={`mt-1 ${inputCls}`} value={token} onChange={(e) => setToken(e.target.value)} placeholder="Coolify → Keys & Tokens → API tokens" type="password" required minLength={8} autoComplete="off" />
          </label>
          {error && (
            <p className="sm:col-span-2 flex items-center gap-1.5 text-xs font-semibold text-[#C0362C]"><AlertTriangle size={13} /> {error}</p>
          )}
          <div className="flex items-center gap-2 sm:col-span-2">
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#087CFA] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#076BE0] disabled:opacity-60">
              {saving && <Loader2 size={15} className="animate-spin" />} Save connection
            </button>
            <button type="button" onClick={() => { setShowForm(false); setError(null); }} className="inline-flex items-center gap-1.5 rounded-xl border border-[#B8CCE0] bg-white px-4 py-2.5 text-sm font-bold text-[#234B70]">
              <X size={15} /> Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mt-5">
        {connections.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#AFC6DE] bg-[#F5F9FE] px-4 py-8 text-center text-sm text-[#526F8A]">
            No Coolify instances connected yet. {canManage ? "Add one to manage deployments from AZMIN." : "Ask an admin to connect one."}
          </p>
        ) : (
          <ul className="grid gap-3">
            {connections.map((c) => (
              <li key={c.id} className="flex flex-col gap-3 rounded-xl border border-[#D7E4F0] bg-[#FBFDFF] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-bold text-[#173A5C]">{c.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLE[c.status] ?? STATUS_STYLE.DISCONNECTED}`}>
                      {c.status}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs font-semibold text-[#526F8A]">{c.baseUrl}</p>
                  {c.status === "ERROR" && c.lastError && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-[#C0362C]"><AlertTriangle size={12} /> {c.lastError}</p>
                  )}
                  {c.status === "CONNECTED" && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-[#087B54]"><CheckCircle2 size={12} /> Reachable{c.lastCheckedAt ? ` · ${new Date(c.lastCheckedAt).toLocaleString()}` : ""}</p>
                  )}
                </div>
                {canManage && (
                  <div className="flex shrink-0 items-center gap-2">
                    <button onClick={() => handleTest(c.id)} disabled={busyId === c.id} className="inline-flex items-center gap-1.5 rounded-lg border border-[#B8CCE0] bg-white px-3 py-2 text-xs font-bold text-[#234B70] transition hover:border-[#087CFA] disabled:opacity-60">
                      {busyId === c.id ? <Loader2 size={13} className="animate-spin" /> : <Activity size={13} />} Test
                    </button>
                    <button onClick={() => handleDelete(c.id)} disabled={busyId === c.id} className="inline-flex items-center gap-1.5 rounded-lg border border-[#F0C9C4] bg-white px-3 py-2 text-xs font-bold text-[#C0362C] transition hover:bg-[#FDECEC] disabled:opacity-60">
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
