"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bolt, Plug, Plus, Power, Trash2, X } from "lucide-react";
import { AzminProfileMenu } from "@/components/azmin/profile-menu";
import { SocialIcon } from "@/components/azmin/social-icon";
import {
  ACTIONS,
  CHANNELS,
  RECIPE_TEMPLATES,
  TRIGGERS,
  actionMeta,
  channelMeta,
  describeAutomation,
  recipeTemplate,
  triggerMeta,
  type Action,
  type Channel,
  type Trigger,
} from "@/lib/automations-catalog";

type Connection = { id: string; channel: Channel; displayName: string; status: string; companyId: string | null };
type Automation = {
  id: string; name: string; trigger: Trigger; action: Action; connectionId: string | null;
  template: string | null; enabled: boolean; companyId: string | null;
  connection: { id: string; channel: string; displayName: string; status: string } | null;
};
type CompanyRef = { id: string; name: string };

export function AutomationsHub({ connections, automations, companies, canManage, userName, userEmail, userRole }: {
  connections: Connection[]; automations: Automation[]; companies: CompanyRef[]; canManage: boolean;
  userName: string; userEmail: string; userRole: string;
}) {
  const router = useRouter();
  const [connDraft, setConnDraft] = useState<null | { channel: Channel; displayName: string; secret: string; companyId: string }>(null);
  const [autoDraft, setAutoDraft] = useState<null | AutoDraft>(null);
  const [busy, setBusy] = useState(false);
  const [testingId, setTestingId] = useState("");
  const [error, setError] = useState("");

  async function testWhatsApp(id: string) {
    const to = window.prompt("Send a WhatsApp test to which number?\nInclude country code, e.g. +9715XXXXXXXX\n(Must be a number you added as a test recipient in Meta.)");
    if (!to) return;
    setTestingId(id); setError("");
    const res = await fetch(`/api/connections/${id}/whatsapp-test`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to }) });
    const d = await res.json().catch(() => ({}));
    setTestingId("");
    window.alert(res.ok ? (d.detail || "Sent — check WhatsApp.") : (d.error || d.detail || "Send failed."));
  }

  async function call(url: string, method: string, body?: unknown) {
    setBusy(true); setError("");
    const res = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
    setBusy(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || "Something went wrong."); return false; }
    router.refresh();
    return true;
  }

  async function saveConnection() {
    if (!connDraft) return;
    const ok = await call("/api/connections", "POST", { channel: connDraft.channel, displayName: connDraft.displayName, secret: connDraft.secret || null, companyId: connDraft.companyId || null });
    if (ok) setConnDraft(null);
  }
  async function saveAutomation() {
    if (!autoDraft) return;
    const body = { name: autoDraft.name, trigger: autoDraft.trigger, action: autoDraft.action, connectionId: autoDraft.connectionId || null, template: autoDraft.template || null, companyId: autoDraft.companyId || null };
    const ok = autoDraft.id
      ? await call(`/api/automations/${autoDraft.id}`, "PATCH", body)
      : await call("/api/automations", "POST", body);
    if (ok) setAutoDraft(null);
  }

  function fromRecipe(key: string) {
    const r = recipeTemplate(key);
    if (!r) return;
    setAutoDraft({ name: r.name, trigger: r.trigger, action: r.action, connectionId: "", template: r.template, companyId: "" });
  }

  return (
    <main data-azmin-ui className="min-h-screen bg-[#EAF1F9] text-[#03142E]">
      <header className="border-b border-[#C8D8EA] bg-white px-5 py-4 shadow-[0_1px_8px_rgba(3,20,46,.06)] sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <Link href="/azmin" className="flex items-center gap-3">
            <span className="relative h-10 w-10 shrink-0"><Image src="/brand/azmin-c1-mark.png" alt="AZMIN" fill priority sizes="40px" className="object-contain" /></span>
            <span><strong className="block font-display text-[15px] font-bold">AZMIN Digital OS</strong><span className="mt-0.5 block text-[11px] font-extrabold uppercase tracking-[.17em] text-[#456784]">Automations</span></span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/azmin" className="hidden rounded-xl border border-[#B8CCE0] bg-[#F8FBFF] px-4 py-2.5 text-xs font-bold text-[#234B70] hover:border-[#087CFA] sm:block">Command center</Link>
            <AzminProfileMenu name={userName} email={userEmail} role={userRole} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 pb-16 pt-6 sm:px-8 sm:pt-8">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[.15em] text-[#0758C9]">Phase 2 · Automation</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-[-.03em]">Automations</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-[#4C6A86]">Connect a channel once, then turn on simple recipes. When something happens in your workspace, AZMIN does the follow-up for you.</p>
        </div>

        {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}

        {/* Connections */}
        <section className="mt-7">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold"><Plug size={18} aria-hidden /> Your connections</h2>
            {canManage && <button onClick={() => setConnDraft({ channel: "WHATSAPP", displayName: "", secret: "", companyId: "" })} className="inline-flex items-center gap-2 rounded-xl bg-[#087CFA] px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(8,124,250,.2)]"><Plus size={16} aria-hidden /> Connect a channel</button>}
          </div>
          {connections.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-dashed border-[#AFC6DE] bg-[#F5F9FE] px-5 py-8 text-center text-sm text-[#4C6A86]">No channels connected yet. Connect WhatsApp, a Facebook Page, Email, or a webhook to start sending.</div>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {connections.map((c) => (
                <div key={c.id} className="rounded-2xl border border-[#C8D8EA] bg-white p-4 shadow-[0_10px_28px_rgba(3,20,46,.05)]">
                  <div className="flex items-center gap-3">
                    <SocialIcon channel={c.channel} size={40} rounded="0.75rem" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold">{c.displayName}</div>
                      <div className="text-xs font-semibold text-[#526F8A]">{channelMeta[c.channel]?.label ?? c.channel}</div>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${c.status === "CONNECTED" ? "bg-[#E7F8EF] text-[#087B54]" : "bg-[#EEF1F5] text-[#526F8A]"}`}>{c.status === "CONNECTED" ? "Connected" : "Off"}</span>
                    {canManage && <button onClick={() => call(`/api/connections/${c.id}`, "DELETE")} disabled={busy} aria-label="Remove" className="grid h-8 w-8 place-items-center rounded-lg text-[#A12C2C] hover:bg-[#FFF0F0] disabled:opacity-50"><Trash2 size={14} aria-hidden /></button>}
                  </div>
                  {canManage && c.channel === "WHATSAPP" && (
                    <button onClick={() => testWhatsApp(c.id)} disabled={testingId === c.id} className="mt-3 w-full rounded-lg border border-[#B8CCE0] bg-[#F8FBFF] px-3 py-2 text-xs font-bold text-[#0758C9] hover:border-[#087CFA] disabled:opacity-50">{testingId === c.id ? "Sending…" : "Send a test message"}</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Automations */}
        <section className="mt-9">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold"><Bolt size={18} aria-hidden /> Your automations</h2>
            {canManage && <button onClick={() => setAutoDraft({ name: "", trigger: "LEAD_CREATED", action: "NOTIFY", connectionId: "", template: "", companyId: "" })} className="inline-flex items-center gap-2 rounded-xl border border-[#B8CCE0] bg-white px-4 py-2.5 text-sm font-bold text-[#234B70] hover:border-[#087CFA]"><Plus size={16} aria-hidden /> New automation</button>}
          </div>

          {automations.length === 0 && canManage && (
            <div className="mt-3 rounded-2xl border border-[#C8D8EA] bg-white p-5">
              <p className="text-sm font-semibold text-[#334E68]">Start with a ready-made recipe — one click, then turn it on.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {RECIPE_TEMPLATES.map((r) => (
                  <button key={r.key} onClick={() => fromRecipe(r.key)} className="rounded-xl border border-[#C8D8EA] bg-[#F9FBFE] p-3 text-left transition hover:border-[#087CFA] hover:bg-white">
                    <div className="text-sm font-bold text-[#03142E]">{r.name}</div>
                    <div className="mt-0.5 text-xs text-[#526F8A]">{describeAutomation(r.trigger, r.action)}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {automations.length > 0 && (
            <div className="mt-3 space-y-2.5">
              {automations.map((a) => (
                <div key={a.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#C8D8EA] bg-white p-4 shadow-[0_10px_28px_rgba(3,20,46,.05)]">
                  {canManage ? (
                    <button onClick={() => call(`/api/automations/${a.id}`, "PATCH", { enabled: !a.enabled })} disabled={busy} aria-label={a.enabled ? "Turn off" : "Turn on"} className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition ${a.enabled ? "bg-[#087CFA] text-white" : "bg-[#E7EDF4] text-[#526F8A]"}`}><Power size={16} aria-hidden /></button>
                  ) : (
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${a.enabled ? "bg-[#18BFD5]" : "bg-[#C7D3DF]"}`} />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold">{a.name}</div>
                    <div className="text-xs font-semibold text-[#526F8A]">{describeAutomation(a.trigger, a.action)}{a.connection ? ` · ${a.connection.displayName}` : ""}</div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${a.enabled ? "bg-[#E7F8EF] text-[#087B54]" : "bg-[#EEF1F5] text-[#526F8A]"}`}>{a.enabled ? "On" : "Off"}</span>
                  {canManage && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => setAutoDraft({ id: a.id, name: a.name, trigger: a.trigger, action: a.action, connectionId: a.connectionId ?? "", template: a.template ?? "", companyId: a.companyId ?? "" })} className="rounded-lg px-3 py-1.5 text-xs font-bold text-[#234B70] hover:bg-[#EEF4FB]">Edit</button>
                      <button onClick={() => call(`/api/automations/${a.id}`, "DELETE")} disabled={busy} aria-label="Remove" className="grid h-8 w-8 place-items-center rounded-lg text-[#A12C2C] hover:bg-[#FFF0F0] disabled:opacity-50"><Trash2 size={14} aria-hidden /></button>
                    </div>
                  )}
                </div>
              ))}
              {canManage && (
                <div className="pt-2">
                  <p className="text-xs font-bold uppercase tracking-[.12em] text-[#526F8A]">Add another recipe</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {RECIPE_TEMPLATES.map((r) => <button key={r.key} onClick={() => fromRecipe(r.key)} className="rounded-xl border border-[#C8D8EA] bg-white px-3 py-2 text-xs font-bold text-[#234B70] hover:border-[#087CFA]">{r.name}</button>)}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {connDraft && (
        <Dialog title="Connect a channel" onClose={() => setConnDraft(null)}>
          <div className="grid gap-4">
            <Field label="Channel"><select value={connDraft.channel} onChange={(e) => setConnDraft({ ...connDraft, channel: e.target.value as Channel })} className={inputClass}>{CHANNELS.map((ch) => <option key={ch} value={ch}>{channelMeta[ch].label}</option>)}</select></Field>
            <p className="rounded-xl border border-[#B9E9FA] bg-[#ECFAFF] px-3 py-2 text-xs leading-5 text-[#17577A]">{channelMeta[connDraft.channel].blurb}</p>
            <Field label="Name (for you)"><input value={connDraft.displayName} onChange={(e) => setConnDraft({ ...connDraft, displayName: e.target.value })} className={inputClass} placeholder={`e.g. ${channelMeta[connDraft.channel].label} — main`} /></Field>
            <Field label={channelMeta[connDraft.channel].secretLabel}><input type="password" value={connDraft.secret} onChange={(e) => setConnDraft({ ...connDraft, secret: e.target.value })} className={inputClass} placeholder={channelMeta[connDraft.channel].placeholder} autoComplete="new-password" /></Field>
            {companies.length > 0 && <Field label="Belongs to"><select value={connDraft.companyId} onChange={(e) => setConnDraft({ ...connDraft, companyId: e.target.value })} className={inputClass}><option value="">Shared (all companies)</option>{companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>}
          </div>
          <DialogActions onCancel={() => setConnDraft(null)} onSave={saveConnection} busy={busy} disabled={connDraft.displayName.trim().length < 2} saveLabel="Connect" />
        </Dialog>
      )}

      {autoDraft && (
        <Dialog title={autoDraft.id ? "Edit automation" : "New automation"} onClose={() => setAutoDraft(null)}>
          <div className="grid gap-4">
            <Field label="Name"><input value={autoDraft.name} onChange={(e) => setAutoDraft({ ...autoDraft, name: e.target.value })} className={inputClass} placeholder="e.g. Welcome new leads" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="When…"><select value={autoDraft.trigger} onChange={(e) => setAutoDraft({ ...autoDraft, trigger: e.target.value as Trigger })} className={inputClass}>{TRIGGERS.map((t) => <option key={t} value={t}>{triggerMeta[t].label}</option>)}</select></Field>
              <Field label="…do this"><select value={autoDraft.action} onChange={(e) => setAutoDraft({ ...autoDraft, action: e.target.value as Action, connectionId: "" })} className={inputClass}>{ACTIONS.map((a) => <option key={a} value={a}>{actionMeta[a].label}</option>)}</select></Field>
            </div>
            {actionMeta[autoDraft.action].channel && (
              <Field label="Using connection">
                <select value={autoDraft.connectionId} onChange={(e) => setAutoDraft({ ...autoDraft, connectionId: e.target.value })} className={inputClass}>
                  <option value="">Choose a connected channel…</option>
                  {connections.filter((c) => c.channel === actionMeta[autoDraft.action].channel).map((c) => <option key={c.id} value={c.id}>{c.displayName}</option>)}
                </select>
              </Field>
            )}
            {actionMeta[autoDraft.action].needsTemplate && (
              <Field label="Message">
                <textarea value={autoDraft.template} onChange={(e) => setAutoDraft({ ...autoDraft, template: e.target.value })} className={inputClass + " min-h-28"} placeholder="Type your message. Use {{name}} to insert details." />
              </Field>
            )}
            <p className="rounded-xl bg-[#F1F5FA] px-3 py-2 text-xs leading-5 text-[#4C6A86]">You can insert: {triggerMeta[autoDraft.trigger].vars.map((v) => `{{${v}}}`).join(", ")}</p>
          </div>
          <DialogActions onCancel={() => setAutoDraft(null)} onSave={saveAutomation} busy={busy} disabled={autoDraft.name.trim().length < 2} saveLabel={autoDraft.id ? "Save" : "Create"} />
        </Dialog>
      )}
    </main>
  );
}

type AutoDraft = { id?: string; name: string; trigger: Trigger; action: Action; connectionId: string; template: string; companyId: string };

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#020B1F]/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[24px] border border-[#BFD1E3] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-xl font-bold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#C8D8EA] bg-[#EDF3F9] text-[#234B70] hover:border-[#087CFA]"><X size={18} aria-hidden /></button>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
function DialogActions({ onCancel, onSave, busy, disabled, saveLabel }: { onCancel: () => void; onSave: () => void; busy: boolean; disabled: boolean; saveLabel: string }) {
  return (
    <div className="mt-6 flex justify-end gap-2">
      <button type="button" onClick={onCancel} className="rounded-xl px-4 py-2.5 text-sm font-bold text-[#405E78]">Cancel</button>
      <button type="button" onClick={onSave} disabled={busy || disabled} className="rounded-xl bg-[#087CFA] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(8,124,250,.2)] disabled:opacity-50">{busy ? "Saving…" : saveLabel}</button>
    </div>
  );
}
const inputClass = "mt-1.5 w-full rounded-xl border border-[#AFC6DE] bg-white px-3 py-2.5 text-sm text-[#03142E] outline-none transition placeholder:text-[#7890A6] focus:border-[#087CFA] focus:ring-2 focus:ring-[#087CFA]/15";
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-xs font-bold text-[#476987]">{label}{children}</label>; }
