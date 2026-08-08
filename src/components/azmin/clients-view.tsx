"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Users, Plus, Loader2, X, AlertTriangle, KeyRound, CalendarClock, ArrowRight, Search, Globe, Briefcase, Building2 } from "lucide-react";
import { AzminProfileMenu } from "@/components/azmin/profile-menu";

export type ClientCardDTO = {
  id: string;
  name: string;
  type: string;
  domain: string | null;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  credentialCount: number;
  renewalCount: number;
  workCount: number;
  nextRenewalDate: string | null;
  nextRenewalDaysLeft: number | null;
};

export function ClientsView({
  initialClients,
  canManage,
  userName,
  userEmail,
  userRole,
}: {
  initialClients: ClientCardDTO[];
  canManage: boolean;
  userName: string;
  userEmail: string;
  userRole: string;
}) {
  const [clients, setClients] = useState(initialClients);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("DIRECT");
  const [domain, setDomain] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const shown = q
    ? clients.filter((c) => [c.name, c.domain, c.contactName, c.email].some((f) => f?.toLowerCase().includes(q)))
    : clients;

  async function refresh() {
    const res = await fetch("/api/clients", { cache: "no-store" });
    if (res.ok) setClients((await res.json()).clients ?? []);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type, domain: domain || null, contactName: contactName || null, email: email || null, phone: phone || null }),
    });
    setSaving(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error ?? "Could not create client.");
      return;
    }
    setName(""); setType("DIRECT"); setDomain(""); setContactName(""); setEmail(""); setPhone(""); setShowForm(false);
    await refresh();
  }

  const inputCls = "w-full rounded-xl border border-[#B8CCE0] bg-white px-3.5 py-2.5 text-sm text-[#0f2137] outline-none placeholder:text-[#93A9BF] focus:border-[#087CFA]";

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
              <span className="mt-0.5 block text-[11px] font-extrabold uppercase tracking-[.17em] text-[#456784]">Clients</span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/azmin" className="hidden rounded-xl border border-[#B8CCE0] bg-[#F8FBFF] px-4 py-2.5 text-xs font-bold text-[#234B70] hover:border-[#087CFA] sm:block">Command center</Link>
            <AzminProfileMenu name={userName} email={userEmail} role={userRole} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 pb-16 pt-6 sm:px-8 sm:pt-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[.15em] text-[#0758C9]">Client book</p>
            <h1 className="mt-1 flex items-center gap-3 font-display text-3xl font-bold tracking-[-.03em]">
              <Users className="text-[#087CFA]" size={28} /> Clients
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-[#4C6A86]">One card per client. Open a client to see all their credentials and renewals in one place.</p>
          </div>
          {canManage && !showForm && (
            <button onClick={() => setShowForm(true)} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#087CFA] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(8,124,250,.2)] transition hover:bg-[#076BE0]">
              <Plus size={16} /> Add client
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="mt-6 grid gap-3 rounded-2xl border border-[#C5D6E6] bg-white p-5 shadow-[0_10px_28px_rgba(3,20,46,.05)] sm:grid-cols-2">
            <label className="text-xs font-bold text-[#476987]">
              Client name
              <input className={`mt-1 ${inputCls}`} value={name} onChange={(e) => setName(e.target.value)} placeholder="Client / business name" required minLength={2} />
            </label>
            <label className="text-xs font-bold text-[#476987]">
              Client type
              <select className={`mt-1 ${inputCls}`} value={type} onChange={(e) => setType(e.target.value)}>
                <option value="DIRECT">Direct client</option>
                <option value="RESELLER">Reseller (many work orders / end-customers)</option>
              </select>
            </label>
            <label className="text-xs font-bold text-[#476987]">
              Domain <span className="font-normal text-[#93A9BF]">(searchable)</span>
              <input className={`mt-1 ${inputCls}`} value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="clientdomain.com" />
            </label>
            <label className="text-xs font-bold text-[#476987]">
              Contact person
              <input className={`mt-1 ${inputCls}`} value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Main contact" />
            </label>
            <label className="text-xs font-bold text-[#476987]">
              Email
              <input className={`mt-1 ${inputCls}`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@client.com" />
            </label>
            <label className="text-xs font-bold text-[#476987]">
              Phone
              <input className={`mt-1 ${inputCls}`} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+971 …" />
            </label>
            {error && <p className="sm:col-span-2 flex items-center gap-1.5 text-xs font-semibold text-[#C0362C]"><AlertTriangle size={13} /> {error}</p>}
            <div className="flex items-center gap-2 sm:col-span-2">
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#087CFA] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#076BE0] disabled:opacity-60">
                {saving && <Loader2 size={15} className="animate-spin" />} Create client
              </button>
              <button type="button" onClick={() => { setShowForm(false); setError(null); }} className="inline-flex items-center gap-1.5 rounded-xl border border-[#B8CCE0] bg-white px-4 py-2.5 text-sm font-bold text-[#234B70]">
                <X size={15} /> Cancel
              </button>
            </div>
          </form>
        )}

        {clients.length > 0 && (
          <div className="mt-6 flex items-center gap-2 rounded-xl border border-[#B8CCE0] bg-white px-3.5 py-2.5 shadow-[0_1px_6px_rgba(3,20,46,.04)]">
            <Search size={16} className="text-[#8299AE]" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or domain…" className="w-full bg-transparent text-sm text-[#0f2137] outline-none placeholder:text-[#93A9BF]" />
            {query && <button onClick={() => setQuery("")} className="text-[#8299AE] hover:text-[#087CFA]"><X size={15} /></button>}
          </div>
        )}

        <div className="mt-4">
          {clients.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#AFC6DE] bg-[#F5F9FE] px-5 py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF9FF] text-[#087CFA]"><Users size={30} /></div>
              <h3 className="mt-4 text-base font-bold text-[#173A5C]">No clients yet</h3>
              <p className="mt-1 text-sm text-[#526F8A]">{canManage ? "Add your first client, then open it to store credentials and renewals." : "Ask an editor to add clients."}</p>
            </div>
          ) : shown.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[#AFC6DE] bg-[#F5F9FE] px-5 py-10 text-center text-sm text-[#526F8A]">No client matches “{query}”.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((c) => {
                const initials = c.name.slice(0, 2).toUpperCase();
                const dl = c.nextRenewalDaysLeft;
                return (
                  <Link key={c.id} href={`/azmin/clients/${c.id}`} className="group flex flex-col rounded-2xl border border-[#C5D6E6] bg-white p-5 shadow-[0_10px_28px_rgba(3,20,46,.05)] transition hover:border-[#087CFA]">
                    <div className="flex items-start gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#EAF1F9] font-black text-[#234B70]">{initials}</span>
                      <div className="min-w-0">
                        <h3 className="truncate font-bold text-[#173A5C]">{c.name}</h3>
                        {c.domain
                          ? <p className="flex items-center gap-1 truncate text-xs font-bold text-[#0758C9]"><Globe size={11} /> {c.domain}</p>
                          : <p className="truncate text-xs font-semibold text-[#526F8A]">{c.contactName || c.email || "—"}</p>}
                      </div>
                      <div className="ml-auto flex shrink-0 flex-col items-end gap-1">
                        {c.type === "RESELLER" && <span className="inline-flex items-center gap-1 rounded-full bg-[#EFEBFB] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#5C3AAE]"><Building2 size={10} /> Reseller</span>}
                        {c.status === "INACTIVE" && <span className="rounded-full bg-[#EEF3F8] px-2 py-0.5 text-[10px] font-bold uppercase text-[#5B7690]">Inactive</span>}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-[#526F8A]">
                      <span className="flex items-center gap-1"><KeyRound size={13} className="text-[#087CFA]" /> {c.credentialCount} cred{c.credentialCount === 1 ? "" : "s"}</span>
                      <span className="flex items-center gap-1"><Briefcase size={13} className="text-[#0758C9]" /> {c.workCount} order{c.workCount === 1 ? "" : "s"}</span>
                      <span className="flex items-center gap-1"><CalendarClock size={13} className="text-[#5C3AAE]" /> {c.renewalCount} renewal{c.renewalCount === 1 ? "" : "s"}</span>
                    </div>

                    {c.nextRenewalDate && dl != null && (
                      <p className={`mt-2 text-xs font-semibold ${dl < 0 ? "text-[#B4231C]" : dl <= 15 ? "text-[#9A6711]" : "text-[#72899E]"}`}>
                        Next renewal: {new Date(c.nextRenewalDate).toLocaleDateString()} · {dl < 0 ? `${Math.abs(dl)}d overdue` : dl === 0 ? "today" : `in ${dl}d`}
                      </p>
                    )}

                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#0758C9] group-hover:gap-2">Open client <ArrowRight size={13} /></span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
