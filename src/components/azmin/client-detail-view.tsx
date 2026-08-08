"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Users, ArrowLeft, Mail, Phone, Trash2, Loader2, KeyRound, CalendarClock, Wallet, Globe, Briefcase, Pencil, Building2, X } from "lucide-react";
import { AzminProfileMenu } from "@/components/azmin/profile-menu";
import { VaultView, type VaultCredentialDTO } from "@/components/azmin/vault-view";
import { RenewalsView, type ServiceRenewalDTO } from "@/components/azmin/renewals-view";
import { FinanceView, type TransactionDTO } from "@/components/azmin/finance-view";
import { WorksView, type WorkDTO } from "@/components/azmin/works-view";

export type ClientDetail = {
  id: string;
  name: string;
  type: string;
  domain: string | null;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  notes: string | null;
  credentialCount: number;
  renewalCount: number;
  workCount: number;
};

export function ClientDetailView({
  client,
  credentials,
  renewals,
  transactions,
  works,
  vaultReady,
  canManage,
  canReveal,
  userName,
  userEmail,
  userRole,
}: {
  client: ClientDetail;
  credentials: VaultCredentialDTO[];
  renewals: ServiceRenewalDTO[];
  transactions: TransactionDTO[];
  works: WorkDTO[];
  vaultReady: boolean;
  canManage: boolean;
  canReveal: boolean;
  userName: string;
  userEmail: string;
  userRole: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"credentials" | "works" | "renewals" | "finance">("credentials");
  const [busy, setBusy] = useState(false);

  // Inline client edit
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editErr, setEditErr] = useState<string | null>(null);
  const [fName, setFName] = useState(client.name);
  const [fType, setFType] = useState(client.type);
  const [fDomain, setFDomain] = useState(client.domain ?? "");
  const [fContact, setFContact] = useState(client.contactName ?? "");
  const [fEmail, setFEmail] = useState(client.email ?? "");
  const [fPhone, setFPhone] = useState(client.phone ?? "");
  const [fNotes, setFNotes] = useState(client.notes ?? "");
  const [fStatus, setFStatus] = useState(client.status);

  const isReseller = client.type === "RESELLER";

  async function remove() {
    if (!confirm(`Delete client "${client.name}"? Its credentials and renewals stay but get unlinked.`)) return;
    setBusy(true);
    await fetch(`/api/clients/${client.id}`, { method: "DELETE" });
    router.push("/azmin/clients");
  }

  async function saveClient(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setEditErr(null);
    const res = await fetch(`/api/clients/${client.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: fName, type: fType, domain: fDomain || null, contactName: fContact || null, email: fEmail || null, phone: fPhone || null, notes: fNotes || null, status: fStatus }),
    });
    setSaving(false);
    if (!res.ok) {
      setEditErr((await res.json().catch(() => ({}))).error ?? "Could not save.");
      return;
    }
    setEditing(false);
    router.refresh();
  }

  const tabCls = (active: boolean) =>
    `inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${active ? "bg-[#087CFA] text-white shadow-[0_8px_22px_rgba(8,124,250,.2)]" : "border border-[#B8CCE0] bg-white text-[#234B70] hover:border-[#087CFA]"}`;
  const fieldCls = "mt-1 w-full rounded-xl border border-[#B8CCE0] bg-white px-3.5 py-2.5 text-sm text-[#0f2137] outline-none placeholder:text-[#93A9BF] focus:border-[#087CFA]";

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
              <span className="mt-0.5 block text-[11px] font-extrabold uppercase tracking-[.17em] text-[#456784]">Client</span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/azmin/clients" className="hidden rounded-xl border border-[#B8CCE0] bg-[#F8FBFF] px-4 py-2.5 text-xs font-bold text-[#234B70] hover:border-[#087CFA] sm:block">All clients</Link>
            <AzminProfileMenu name={userName} email={userEmail} role={userRole} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 pb-16 pt-6 sm:px-8 sm:pt-8">
        <Link href="/azmin/clients" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0758C9] hover:underline">
          <ArrowLeft size={14} /> Clients
        </Link>

        {/* Client header */}
        <div className="mt-3 rounded-2xl border border-[#C5D6E6] bg-white p-6 shadow-[0_10px_28px_rgba(3,20,46,.05)]">
          {!editing ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#EAF1F9] text-lg font-black text-[#234B70]">{client.name.slice(0, 2).toUpperCase()}</span>
                <div>
                  <h1 className="flex flex-wrap items-center gap-3 font-display text-2xl font-bold tracking-[-.02em]">
                    <Users className="text-[#087CFA]" size={22} /> {client.name}
                    {isReseller && <span className="inline-flex items-center gap-1 rounded-full bg-[#EFEBFB] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#5C3AAE]"><Building2 size={11} /> Reseller</span>}
                    {client.status === "INACTIVE" && <span className="rounded-full bg-[#EEF3F8] px-2 py-0.5 text-[10px] font-bold uppercase text-[#5B7690]">Inactive</span>}
                  </h1>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-[#526F8A]">
                    {client.domain && <a href={`https://${client.domain}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-bold text-[#0758C9] hover:underline"><Globe size={12} /> {client.domain}</a>}
                    {client.contactName && <span>{client.contactName}</span>}
                    {client.email && <a href={`mailto:${client.email}`} className="flex items-center gap-1 text-[#0758C9] hover:underline"><Mail size={12} /> {client.email}</a>}
                    {client.phone && <span className="flex items-center gap-1"><Phone size={12} /> {client.phone}</span>}
                  </div>
                  {client.notes && <p className="mt-2 max-w-2xl text-sm text-[#4C6A86]">{client.notes}</p>}
                </div>
              </div>
              {canManage && (
                <div className="flex shrink-0 items-center gap-2">
                  <button onClick={() => { setEditing(true); setEditErr(null); }} className="inline-flex items-center gap-1.5 rounded-xl border border-[#B8CCE0] bg-white px-3 py-2 text-sm font-bold text-[#234B70] transition hover:border-[#087CFA]">
                    <Pencil size={14} /> Edit
                  </button>
                  <button onClick={remove} disabled={busy} className="inline-flex items-center gap-1.5 rounded-xl border border-[#F0C9C4] bg-white px-3 py-2 text-sm font-bold text-[#C0362C] transition hover:bg-[#FDECEC] disabled:opacity-60">
                    {busy ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={saveClient} className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-bold text-[#476987]">
                Company / client name
                <input className={fieldCls} value={fName} onChange={(e) => setFName(e.target.value)} required minLength={2} />
              </label>
              <label className="text-xs font-bold text-[#476987]">
                Client type
                <select className={fieldCls} value={fType} onChange={(e) => setFType(e.target.value)}>
                  <option value="DIRECT">Direct client</option>
                  <option value="RESELLER">Reseller (holds work orders for many end-customers)</option>
                </select>
              </label>
              <label className="text-xs font-bold text-[#476987]">
                Domain
                <input className={fieldCls} value={fDomain} onChange={(e) => setFDomain(e.target.value)} placeholder="client.com" />
              </label>
              <label className="text-xs font-bold text-[#476987]">
                Contact name
                <input className={fieldCls} value={fContact} onChange={(e) => setFContact(e.target.value)} placeholder="Primary contact" />
              </label>
              <label className="text-xs font-bold text-[#476987]">
                Email
                <input className={fieldCls} type="email" value={fEmail} onChange={(e) => setFEmail(e.target.value)} placeholder="contact@client.com" />
              </label>
              <label className="text-xs font-bold text-[#476987]">
                Phone
                <input className={fieldCls} value={fPhone} onChange={(e) => setFPhone(e.target.value)} placeholder="+971 …" />
              </label>
              <label className="text-xs font-bold text-[#476987]">
                Status
                <select className={fieldCls} value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </label>
              <label className="text-xs font-bold text-[#476987] sm:col-span-2">
                Notes
                <input className={fieldCls} value={fNotes} onChange={(e) => setFNotes(e.target.value)} placeholder="Anything worth remembering…" />
              </label>
              {editErr && <p className="sm:col-span-2 text-xs font-bold text-[#C0362C]">{editErr}</p>}
              <div className="flex items-center gap-2 sm:col-span-2">
                <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#087CFA] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#076BE0] disabled:opacity-60">
                  {saving && <Loader2 size={15} className="animate-spin" />} Save changes
                </button>
                <button type="button" onClick={() => setEditing(false)} className="inline-flex items-center gap-1.5 rounded-xl border border-[#B8CCE0] bg-white px-4 py-2.5 text-sm font-bold text-[#234B70]">
                  <X size={15} /> Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Tabs */}
        <div className="mt-6 flex items-center gap-2">
          <button onClick={() => setTab("credentials")} className={tabCls(tab === "credentials")}>
            <KeyRound size={16} /> Credentials <span className="rounded-full bg-white/25 px-1.5 text-xs">{client.credentialCount}</span>
          </button>
          <button onClick={() => setTab("works")} className={tabCls(tab === "works")}>
            <Briefcase size={16} /> Work Orders <span className="rounded-full bg-white/25 px-1.5 text-xs">{client.workCount}</span>
          </button>
          <button onClick={() => setTab("renewals")} className={tabCls(tab === "renewals")}>
            <CalendarClock size={16} /> Renewals <span className="rounded-full bg-white/25 px-1.5 text-xs">{client.renewalCount}</span>
          </button>
          <button onClick={() => setTab("finance")} className={tabCls(tab === "finance")}>
            <Wallet size={16} /> Finance <span className="rounded-full bg-white/25 px-1.5 text-xs">{transactions.length}</span>
          </button>
        </div>

        <div className="mt-6">
          {tab === "credentials" && (
            <VaultView
              initialCredentials={credentials}
              vaultReady={vaultReady}
              canManage={canManage}
              canReveal={canReveal}
              userName={userName}
              userEmail={userEmail}
              userRole={userRole}
              scopeClientId={client.id}
              scopeClientName={client.name}
              embedded
            />
          )}
          {tab === "works" && (
            <WorksView
              initialWorks={works}
              clientId={client.id}
              isReseller={isReseller}
              canManage={canManage}
            />
          )}
          {tab === "renewals" && (
            <RenewalsView
              initialRenewals={renewals}
              canManage={canManage}
              userName={userName}
              userEmail={userEmail}
              userRole={userRole}
              scopeClientId={client.id}
              scopeClientName={client.name}
              embedded
            />
          )}
          {tab === "finance" && (
            <FinanceView
              initialTransactions={transactions}
              clients={[{ id: client.id, name: client.name }]}
              canManage={canManage}
              userName={userName}
              userEmail={userEmail}
              userRole={userRole}
              scopeClientId={client.id}
              embedded
            />
          )}
        </div>
      </div>
    </main>
  );
}
