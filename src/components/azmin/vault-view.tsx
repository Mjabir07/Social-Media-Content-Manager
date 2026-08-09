"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { KeyRound, Plus, Loader2, X, AlertTriangle, Eye, EyeOff, Copy, Check, Trash2, Pencil, ExternalLink, ShieldCheck } from "lucide-react";
import { AzminProfileMenu } from "@/components/azmin/profile-menu";
import { VAULT_CATEGORIES, vaultCategoryMeta, groupByClient, type VaultCategory } from "@/lib/vault-catalog";

export type VaultCredentialDTO = {
  id: string;
  clientName: string;
  category: VaultCategory;
  label: string;
  username: string | null;
  url: string | null;
  maskedHint: string | null;
  hasSecret: boolean;
  notes: string | null;
  renewalId: string | null;
  createdAt: string;
};

export function VaultView({
  initialCredentials,
  vaultReady,
  canManage,
  canReveal,
  userName,
  userEmail,
  userRole,
  scopeClientId,
  scopeClientName,
  embedded = false,
}: {
  initialCredentials: VaultCredentialDTO[];
  vaultReady: boolean;
  canManage: boolean;
  canReveal: boolean;
  userName: string;
  userEmail: string;
  userRole: string;
  scopeClientId?: string;
  scopeClientName?: string;
  embedded?: boolean;
}) {
  const [creds, setCreds] = useState(initialCredentials);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [clientName, setClientName] = useState(scopeClientName ?? "");
  const [category, setCategory] = useState<VaultCategory>("EMAIL");
  const [label, setLabel] = useState("");
  const [username, setUsername] = useState("");
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const groups = groupByClient(creds);

  async function refresh() {
    const res = await fetch(`/api/vault${scopeClientId ? `?clientId=${scopeClientId}` : ""}`, { cache: "no-store" });
    if (res.ok) setCreds((await res.json()).credentials ?? []);
  }

  function resetForm() {
    setEditId(null); setLabel(""); setUsername(""); setUrl(""); setSecret(""); setNotes("");
    setClientName(scopeClientName ?? ""); setCategory("EMAIL");
    setShowForm(false); setError(null);
  }

  // Open the shared form pre-filled for an existing credential. The secret box
  // stays blank on purpose — leave it empty to keep the stored password.
  function startEdit(c: VaultCredentialDTO) {
    setEditId(c.id);
    setClientName(c.clientName);
    setCategory(c.category);
    setLabel(c.label);
    setUsername(c.username ?? "");
    setUrl(c.url ?? "");
    setSecret("");
    setNotes(c.notes ?? "");
    setError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    // On edit, only send the secret when the user actually typed a new one.
    const editing = editId !== null;
    const body = editing
      ? { clientName: scopeClientName ?? clientName, category, label, username: username || null, url: url || null, notes: notes || null, ...(secret ? { secret } : {}) }
      : { clientName: scopeClientName ?? clientName, clientId: scopeClientId ?? null, category, label, username: username || null, url: url || null, secret: secret || null, notes: notes || null };
    const res = await fetch(editing ? `/api/vault/${editId}` : "/api/vault", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error ?? "Could not save.");
      return;
    }
    resetForm();
    await refresh();
  }

  async function reveal(id: string) {
    setBusyId(id);
    const res = await fetch(`/api/vault/${id}/reveal`, { method: "POST" });
    setBusyId(null);
    if (!res.ok) { setError("Could not reveal (need admin access)."); return; }
    const { secret } = await res.json();
    setRevealed((r) => ({ ...r, [id]: secret }));
    // Auto-hide after 30s so secrets don't linger on screen.
    setTimeout(() => setRevealed((r) => { const n = { ...r }; delete n[id]; return n; }), 30_000);
  }

  function hide(id: string) {
    setRevealed((r) => { const n = { ...r }; delete n[id]; return n; });
  }

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
    } catch { /* clipboard blocked */ }
  }

  async function remove(id: string) {
    if (!confirm("Delete this credential?")) return;
    setBusyId(id);
    await fetch(`/api/vault/${id}`, { method: "DELETE" });
    setBusyId(null);
    hide(id);
    await refresh();
  }

  const inputCls = "w-full rounded-xl border border-[#B8CCE0] bg-white px-3.5 py-2.5 text-sm text-[#0f2137] outline-none placeholder:text-[#93A9BF] focus:border-[#087CFA]";

  // One shared form, rendered either at the top (Add) or inline under the card
  // being edited. Only one shows at a time, so a single element is reused.
  const credentialForm = showForm ? (
    <form onSubmit={handleSubmit} className="grid gap-3 rounded-2xl border border-[#C5D6E6] bg-white p-5 shadow-[0_10px_28px_rgba(3,20,46,.05)] sm:grid-cols-2">
      {editId && <p className="sm:col-span-2 -mb-1 text-xs font-bold text-[#5C3AAE]">Editing credential</p>}
      {!scopeClientName && (
        <label className="text-xs font-bold text-[#476987]">
          Client
          <input className={`mt-1 ${inputCls}`} value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Client / project name" required minLength={2} />
        </label>
      )}
      <label className="text-xs font-bold text-[#476987]">
        Category
        <select className={`mt-1 ${inputCls}`} value={category} onChange={(e) => setCategory(e.target.value as VaultCategory)}>
          {VAULT_CATEGORIES.map((c) => <option key={c} value={c}>{vaultCategoryMeta[c].label}</option>)}
        </select>
      </label>
      <label className="text-xs font-bold text-[#476987]">
        Label
        <input className={`mt-1 ${inputCls}`} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. GoDaddy domain panel / info@domain.com" required minLength={2} />
      </label>
      <label className="text-xs font-bold text-[#476987]">
        Username / login
        <input className={`mt-1 ${inputCls}`} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="login id or email" autoComplete="off" />
      </label>
      <label className="text-xs font-bold text-[#476987]">
        Password / secret
        <input className={`mt-1 ${inputCls}`} type="password" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder={editId ? "leave blank to keep current" : "stored encrypted"} autoComplete="new-password" />
      </label>
      <label className="text-xs font-bold text-[#476987]">
        Panel URL
        <input className={`mt-1 ${inputCls}`} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
      </label>
      <label className="text-xs font-bold text-[#476987] sm:col-span-2">
        Notes
        <input className={`mt-1 ${inputCls}`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Seats, 2FA info, recovery email…" />
      </label>
      {error && <p className="sm:col-span-2 flex items-center gap-1.5 text-xs font-semibold text-[#C0362C]"><AlertTriangle size={13} /> {error}</p>}
      <div className="flex items-center gap-2 sm:col-span-2">
        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#087CFA] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#076BE0] disabled:opacity-60">
          {saving && <Loader2 size={15} className="animate-spin" />} {editId ? "Update credential" : "Save credential"}
        </button>
        <button type="button" onClick={resetForm} className="inline-flex items-center gap-1.5 rounded-xl border border-[#B8CCE0] bg-white px-4 py-2.5 text-sm font-bold text-[#234B70]">
          <X size={15} /> Cancel
        </button>
      </div>
    </form>
  ) : null;

  const content = (
    <>
        {canManage && embedded && !showForm && (
          <button onClick={() => { resetForm(); setShowForm(true); }} className="mb-4 inline-flex items-center gap-2 rounded-xl bg-[#087CFA] px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(8,124,250,.2)] transition hover:bg-[#076BE0]">
            <Plus size={16} /> Add credential
          </button>
        )}

        {!embedded && (
          <p className="mt-4 flex items-center gap-2 rounded-xl border border-[#CDE8D6] bg-[#F2FBF5] px-4 py-2.5 text-xs font-semibold text-[#0F7A46]">
            <ShieldCheck size={14} /> Secrets are AES-256-GCM encrypted at rest. Only admins can reveal them, and every reveal is logged in Activity.
          </p>
        )}

        {!vaultReady && (
          <p className="mt-3 flex items-center gap-2 rounded-xl border border-[#F3D8A8] bg-[#FFF7E8] px-4 py-2.5 text-xs font-semibold text-[#9A6711]">
            <AlertTriangle size={14} /> Encryption key not set on the server. Add <code className="mx-1 rounded bg-white px-1 py-0.5">AZMIN_CREDENTIAL_ENCRYPTION_KEY</code> to store passwords.
          </p>
        )}

        {/* Add form only at the top; edits render inline under their card. */}
        {showForm && editId === null && <div className="mt-6">{credentialForm}</div>}

        <div className={`space-y-8 ${embedded ? "" : "mt-8"}`}>
          {groups.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#AFC6DE] bg-[#F5F9FE] px-5 py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF9FF] text-[#087CFA]"><KeyRound size={30} /></div>
              <h3 className="mt-4 text-base font-bold text-[#173A5C]">{embedded ? "No credentials yet" : "Vault is empty"}</h3>
              <p className="mt-1 text-sm text-[#526F8A]">{canManage ? "Add a credential — domain panel, email logins, hosting." : "Ask an editor to add credentials."}</p>
            </div>
          ) : (
            groups.map((group) => (
              <section key={group.clientName}>
                {!embedded && (
                  <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-[#173A5C]">
                    {group.clientName}
                    <span className="rounded-full bg-[#EAF1F9] px-2 py-0.5 text-xs font-bold text-[#5B7690]">{group.items.length}</span>
                  </h2>
                )}
                <ul className="grid gap-3">
                  {group.items.map((c) => {
                    const meta = vaultCategoryMeta[c.category];
                    const shown = revealed[c.id];
                    return (
                      <li key={c.id} className="rounded-xl border border-[#D7E4F0] bg-white p-4 shadow-[0_6px_18px_rgba(3,20,46,.04)]">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: meta.color, background: meta.bg }}>{meta.label}</span>
                              <span className="font-bold text-[#173A5C]">{c.label}</span>
                            </div>
                            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#526F8A]">
                              {c.username && (
                                <span className="flex items-center gap-1">
                                  <span className="font-semibold text-[#72899E]">User:</span> {c.username}
                                  <button onClick={() => copy(c.username!, `u-${c.id}`)} className="text-[#8299AE] hover:text-[#087CFA]">{copied === `u-${c.id}` ? <Check size={12} /> : <Copy size={12} />}</button>
                                </span>
                              )}
                              {c.url && (
                                <a href={c.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-semibold text-[#0758C9] hover:underline">
                                  Open panel <ExternalLink size={11} />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Secret row */}
                        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-[#F7FAFE] px-3 py-2">
                          <span className="font-mono text-sm text-[#0f2137]">
                            {c.hasSecret ? (shown ?? (c.maskedHint || "••••••••")) : <span className="text-[#93A9BF] italic">no secret stored</span>}
                          </span>
                          {c.hasSecret && canReveal && (
                            shown ? (
                              <>
                                <button onClick={() => copy(shown, `s-${c.id}`)} className="ml-1 inline-flex items-center gap-1 rounded-md border border-[#B8CCE0] bg-white px-2 py-1 text-[11px] font-bold text-[#234B70] hover:border-[#087CFA]">{copied === `s-${c.id}` ? <Check size={12} /> : <Copy size={12} />} Copy</button>
                                <button onClick={() => hide(c.id)} className="inline-flex items-center gap-1 rounded-md border border-[#B8CCE0] bg-white px-2 py-1 text-[11px] font-bold text-[#234B70] hover:border-[#087CFA]"><EyeOff size={12} /> Hide</button>
                              </>
                            ) : (
                              <button onClick={() => reveal(c.id)} disabled={busyId === c.id} className="ml-1 inline-flex items-center gap-1 rounded-md bg-[#087CFA] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#076BE0] disabled:opacity-60">{busyId === c.id ? <Loader2 size={12} className="animate-spin" /> : <Eye size={12} />} Reveal</button>
                            )
                          )}
                          {c.hasSecret && !canReveal && <span className="text-[11px] font-semibold text-[#93A9BF]">admin only</span>}
                          {shown && <span className="text-[10px] font-semibold text-[#93A9BF]">auto-hides in 30s</span>}
                          {canManage && (
                            <button onClick={() => startEdit(c)} className="ml-auto inline-flex items-center gap-1 rounded-md border border-[#B8CCE0] bg-white px-2 py-1 text-[11px] font-bold text-[#234B70] hover:border-[#087CFA]"><Pencil size={12} /> Edit</button>
                          )}
                          {canManage && (
                            <button onClick={() => remove(c.id)} disabled={busyId === c.id} className="inline-flex items-center rounded-md border border-[#F0C9C4] bg-white px-2 py-1 text-[#C0362C] hover:bg-[#FDECEC] disabled:opacity-60"><Trash2 size={12} /></button>
                          )}
                        </div>

                        {c.notes && <p className="mt-2 text-xs text-[#7C93A8]">{c.notes}</p>}

                        {editId === c.id && showForm && (
                          <div className="mt-3 border-t border-dashed border-[#CBDBEB] pt-3">{credentialForm}</div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))
          )}
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
              <span className="mt-0.5 block text-[11px] font-extrabold uppercase tracking-[.17em] text-[#456784]">Client Vault</span>
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
            <p className="text-[11px] font-extrabold uppercase tracking-[.15em] text-[#0758C9]">Secure store</p>
            <h1 className="mt-1 flex items-center gap-3 font-display text-3xl font-bold tracking-[-.03em]">
              <KeyRound className="text-[#087CFA]" size={28} /> Client Vault
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-[#4C6A86]">Domain panels, email logins, hosting — encrypted &amp; grouped per client. Reveal a password in one click when a client asks.</p>
          </div>
          {canManage && !showForm && (
            <button onClick={() => { resetForm(); setShowForm(true); }} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#087CFA] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(8,124,250,.2)] transition hover:bg-[#076BE0]">
              <Plus size={16} /> Add credential
            </button>
          )}
        </div>
        {content}
      </div>
    </main>
  );
}
