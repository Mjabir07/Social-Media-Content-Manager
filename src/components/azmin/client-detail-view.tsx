"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Users, ArrowLeft, Mail, Phone, Trash2, Loader2, KeyRound, CalendarClock, Wallet, Globe } from "lucide-react";
import { AzminProfileMenu } from "@/components/azmin/profile-menu";
import { VaultView, type VaultCredentialDTO } from "@/components/azmin/vault-view";
import { RenewalsView, type ServiceRenewalDTO } from "@/components/azmin/renewals-view";
import { FinanceView, type TransactionDTO } from "@/components/azmin/finance-view";

export type ClientDetail = {
  id: string;
  name: string;
  domain: string | null;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  notes: string | null;
  credentialCount: number;
  renewalCount: number;
};

export function ClientDetailView({
  client,
  credentials,
  renewals,
  transactions,
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
  vaultReady: boolean;
  canManage: boolean;
  canReveal: boolean;
  userName: string;
  userEmail: string;
  userRole: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"credentials" | "renewals" | "finance">("credentials");
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!confirm(`Delete client "${client.name}"? Its credentials and renewals stay but get unlinked.`)) return;
    setBusy(true);
    await fetch(`/api/clients/${client.id}`, { method: "DELETE" });
    router.push("/azmin/clients");
  }

  const tabCls = (active: boolean) =>
    `inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${active ? "bg-[#087CFA] text-white shadow-[0_8px_22px_rgba(8,124,250,.2)]" : "border border-[#B8CCE0] bg-white text-[#234B70] hover:border-[#087CFA]"}`;

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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#EAF1F9] text-lg font-black text-[#234B70]">{client.name.slice(0, 2).toUpperCase()}</span>
              <div>
                <h1 className="flex items-center gap-3 font-display text-2xl font-bold tracking-[-.02em]">
                  <Users className="text-[#087CFA]" size={22} /> {client.name}
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
              <button onClick={remove} disabled={busy} className="inline-flex items-center gap-1.5 rounded-xl border border-[#F0C9C4] bg-white px-3 py-2 text-sm font-bold text-[#C0362C] transition hover:bg-[#FDECEC] disabled:opacity-60">
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex items-center gap-2">
          <button onClick={() => setTab("credentials")} className={tabCls(tab === "credentials")}>
            <KeyRound size={16} /> Credentials <span className="rounded-full bg-white/25 px-1.5 text-xs">{client.credentialCount}</span>
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
