"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Inbox, MessageCircle, Send } from "lucide-react";
import { AzminProfileMenu } from "@/components/azmin/profile-menu";

type Convo = { id: string; channel: string; contactName: string | null; contactHandle: string | null; status: string; unread: number; lastMessagePreview: string | null; lastMessageAt: string };
type Msg = { id: string; direction: string; body: string; status: string | null; createdAt: string };
type Selected = { id: string; channel: string; contactName: string | null; contactHandle: string | null; status: string; messages: Msg[] };

const channelLabel: Record<string, string> = { WHATSAPP: "WhatsApp", MESSENGER: "Messenger", INSTAGRAM: "Instagram" };
const channelColor: Record<string, string> = { WHATSAPP: "#25D366", MESSENGER: "#0084FF", INSTAGRAM: "#E1306C" };

export function InboxView({ conversations, selected, webhookUrl, canManage, userName, userEmail, userRole }: {
  conversations: Convo[]; selected: Selected | null; webhookUrl: string; canManage: boolean; userName: string; userEmail: string; userRole: string;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function reply() {
    if (!selected || !text.trim()) return;
    setBusy(true); setError("");
    const res = await fetch(`/api/inbox/${selected.id}/reply`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
    setBusy(false);
    if (!res.ok) { setError("Could not send."); return; }
    setText(""); router.refresh();
  }
  async function close() {
    if (!selected) return;
    await fetch(`/api/inbox/${selected.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "CLOSED" }) });
    router.push("/azmin/inbox");
  }

  return (
    <main data-azmin-ui className="min-h-screen bg-[#EAF1F9] text-[#03142E]">
      <header className="border-b border-[#C8D8EA] bg-white px-5 py-4 shadow-[0_1px_8px_rgba(3,20,46,.06)] sm:px-8">
        <div className="mx-auto flex max-w-[1300px] items-center gap-3">
          <Link href="/azmin" className="flex items-center gap-3">
            <span className="relative h-10 w-10 shrink-0"><Image src="/brand/azmin-c1-mark.png" alt="AZMIN" fill priority sizes="40px" className="object-contain" /></span>
            <span><strong className="block font-display text-[15px] font-bold">AZMIN Digital OS</strong><span className="mt-0.5 block text-[11px] font-extrabold uppercase tracking-[.17em] text-[#456784]">Unified inbox</span></span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/azmin" className="hidden rounded-xl border border-[#B8CCE0] bg-[#F8FBFF] px-4 py-2.5 text-xs font-bold text-[#234B70] hover:border-[#087CFA] sm:block">Command center</Link>
            <AzminProfileMenu name={userName} email={userEmail} role={userRole} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1300px] px-4 py-5 sm:px-6">
        {conversations.length === 0 && (
          <div className="mb-4 rounded-2xl border border-[#B9E9FA] bg-[#ECFAFF] px-4 py-3 text-sm leading-6 text-[#17577A]">
            <strong>No conversations yet.</strong> Connect WhatsApp / Facebook / Instagram, then register this webhook URL in your Meta app so messages land here:
            <code className="mt-1 block break-all rounded-lg bg-white px-2 py-1 font-mono text-xs text-[#0758C9]">{webhookUrl}</code>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
          {/* Conversation list */}
          <aside className="rounded-2xl border border-[#C8D8EA] bg-white p-2 shadow-[0_10px_28px_rgba(3,20,46,.05)]">
            <div className="flex items-center gap-2 px-2 py-2 text-sm font-extrabold"><Inbox size={16} aria-hidden /> Conversations</div>
            <div className="max-h-[70vh] space-y-1 overflow-y-auto">
              {conversations.map((c) => {
                const active = selected?.id === c.id;
                return (
                  <Link key={c.id} href={`/azmin/inbox?c=${c.id}`} className={`block rounded-xl px-3 py-2.5 transition ${active ? "bg-[#EAF4FF]" : "hover:bg-[#F1F5FA]"}`}>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: channelColor[c.channel] ?? "#94A3B8" }} />
                      <span className="min-w-0 flex-1 truncate text-sm font-bold">{c.contactName || c.contactHandle || "Unknown"}</span>
                      {c.unread > 0 && <span className="rounded-full bg-[#087CFA] px-1.5 text-[10px] font-black text-white">{c.unread}</span>}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 pl-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#526F8A]">{channelLabel[c.channel] ?? c.channel}</span>
                      {c.status === "CLOSED" && <span className="text-[10px] font-bold text-[#94A3B8]">· closed</span>}
                    </div>
                    {c.lastMessagePreview && <p className="mt-0.5 truncate pl-4 text-xs text-[#4C6A86]">{c.lastMessagePreview}</p>}
                  </Link>
                );
              })}
              {conversations.length === 0 && <p className="px-3 py-6 text-center text-xs text-[#7890A6]">Nothing here yet.</p>}
            </div>
          </aside>

          {/* Thread */}
          <section className="flex min-h-[70vh] flex-col rounded-2xl border border-[#C8D8EA] bg-white shadow-[0_10px_28px_rgba(3,20,46,.05)]">
            {!selected ? (
              <div className="grid flex-1 place-items-center text-center text-sm text-[#7890A6]"><div><MessageCircle size={28} className="mx-auto mb-2 text-[#AFC6DE]" aria-hidden />Pick a conversation to read and reply.</div></div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3 border-b border-[#E4ECF5] px-5 py-3">
                  <div>
                    <div className="text-sm font-bold">{selected.contactName || selected.contactHandle || "Unknown"}</div>
                    <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: channelColor[selected.channel] }}>{channelLabel[selected.channel] ?? selected.channel}</div>
                  </div>
                  {canManage && selected.status !== "CLOSED" && <button onClick={close} className="inline-flex items-center gap-1.5 rounded-lg border border-[#CEDBE9] px-3 py-1.5 text-xs font-bold text-[#526F8A] hover:border-[#087CFA]"><CheckCheck size={13} aria-hidden /> Close</button>}
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto px-5 py-4">
                  {selected.messages.map((m) => (
                    <div key={m.id} className={`flex ${m.direction === "OUT" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${m.direction === "OUT" ? "bg-[#087CFA] text-white" : "bg-[#F1F5FA] text-[#203a52]"}`}>
                        <p className="whitespace-pre-wrap">{m.body}</p>
                        <div className={`mt-0.5 text-[10px] ${m.direction === "OUT" ? "text-white/70" : "text-[#7890A6]"}`}>{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{m.status === "FAILED" ? " · failed" : ""}</div>
                      </div>
                    </div>
                  ))}
                  {selected.messages.length === 0 && <p className="text-center text-xs text-[#7890A6]">No messages.</p>}
                </div>

                {canManage && (
                  <div className="border-t border-[#E4ECF5] p-3">
                    {error && <p className="mb-2 text-xs font-semibold text-red-600">{error}</p>}
                    <div className="flex items-end gap-2">
                      <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) reply(); }} className="min-h-11 flex-1 resize-y rounded-xl border border-[#AFC6DE] bg-white px-3 py-2.5 text-sm text-[#03142E] outline-none focus:border-[#087CFA] focus:ring-2 focus:ring-[#087CFA]/15" placeholder="Type a reply… (Ctrl/⌘+Enter to send)" />
                      <button onClick={reply} disabled={busy || !text.trim()} className="inline-flex items-center gap-1.5 rounded-xl bg-[#087CFA] px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(8,124,250,.2)] disabled:opacity-50"><Send size={15} aria-hidden /> {busy ? "…" : "Send"}</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
