"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Megaphone, Send, Sparkles, Trash2 } from "lucide-react";
import { AzminProfileMenu } from "@/components/azmin/profile-menu";
import { channelMeta, type Channel } from "@/lib/automations-catalog";
import { postStatusMeta, type PostStatus, type TargetStatus } from "@/lib/posts-catalog";
import { specsForPlatforms } from "@/lib/media-specs";

const CHANNEL_TO_PLATFORM: Record<string, string> = { INSTAGRAM: "INSTAGRAM", META_PAGE: "FACEBOOK", LINKEDIN: "LINKEDIN", YOUTUBE: "YOUTUBE" };

type Connection = { id: string; channel: Channel; displayName: string; status: string };
type Target = { id: string; channel: string; status: TargetStatus; detail: string | null };
type Post = { id: string; content: string; status: PostStatus; scheduledAt: string | null; companyId: string | null; targets: Target[] };
type CompanyRef = { id: string; name: string };

export function PublishingView({ posts, connections, companies, canManage, userName, userEmail, userRole }: {
  posts: Post[]; connections: Connection[]; companies: CompanyRef[]; canManage: boolean; userName: string; userEmail: string; userRole: string;
}) {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [content, setContent] = useState("");
  const [picked, setPicked] = useState<string[]>(connections.map((c) => c.id));
  const [companyId, setCompanyId] = useState("");
  const [schedule, setSchedule] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  function toggle(id: string) { setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id])); }

  async function aiCaption() {
    if (!topic.trim()) { setError("Type a topic first, then generate."); return; }
    setBusy("ai"); setError("");
    const res = await fetch("/api/posts/ai-caption", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic, companyId: companyId || null }) });
    setBusy("");
    if (!res.ok) { setError("Could not generate a caption."); return; }
    const d = await res.json();
    setContent(d.caption);
  }

  async function create(publish: boolean) {
    if (!content.trim() || picked.length === 0) { setError("Write content and pick at least one platform."); return; }
    setBusy(publish ? "pub" : "draft"); setError("");
    const res = await fetch("/api/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      content, companyId: companyId || null, connectionIds: picked, scheduledAt: schedule ? new Date(schedule).toISOString() : null,
    }) });
    if (!res.ok) { setBusy(""); const d = await res.json().catch(() => ({})); setError(d.error || "Could not save the post."); return; }
    const post = await res.json();
    if (publish) await fetch(`/api/posts/${post.id}/publish`, { method: "POST" });
    setBusy(""); setContent(""); setTopic(""); setSchedule("");
    router.refresh();
  }

  async function publishExisting(id: string) { setBusy(id); await fetch(`/api/posts/${id}/publish`, { method: "POST" }); setBusy(""); router.refresh(); }
  async function remove(id: string) { setBusy(id); await fetch(`/api/posts/${id}`, { method: "DELETE" }); setBusy(""); router.refresh(); }

  return (
    <main data-azmin-ui className="min-h-screen bg-[#EAF1F9] text-[#03142E]">
      <header className="border-b border-[#C8D8EA] bg-white px-5 py-4 shadow-[0_1px_8px_rgba(3,20,46,.06)] sm:px-8">
        <div className="mx-auto flex max-w-[1200px] items-center gap-3">
          <Link href="/azmin" className="flex items-center gap-3">
            <span className="relative h-10 w-10 shrink-0"><Image src="/brand/azmin-c1-mark.png" alt="AZMIN" fill priority sizes="40px" className="object-contain" /></span>
            <span><strong className="block font-display text-[15px] font-bold">AZMIN Digital OS</strong><span className="mt-0.5 block text-[11px] font-extrabold uppercase tracking-[.17em] text-[#456784]">Social publishing</span></span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/azmin" className="hidden rounded-xl border border-[#B8CCE0] bg-[#F8FBFF] px-4 py-2.5 text-xs font-bold text-[#234B70] hover:border-[#087CFA] sm:block">Command center</Link>
            <AzminProfileMenu name={userName} email={userEmail} role={userRole} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] px-5 pb-16 pt-6 sm:px-8 sm:pt-8">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[.15em] text-[#0758C9]">SMM · Publishing</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-[-.03em]">Post everywhere at once</h1>
          <p className="mt-1.5 text-sm text-[#4C6A86]">Write once, pick your platforms, and publish or schedule. AI can draft the caption for you.</p>
        </div>

        {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}

        {canManage && (
          <section className="mt-6 rounded-3xl border border-[#C8D8EA] bg-white p-5 shadow-[0_12px_40px_rgba(3,20,46,.05)] sm:p-6">
            <div className="flex flex-wrap items-end gap-2">
              <label className="min-w-0 flex-1 text-xs font-bold text-[#476987]">Topic (for AI)
                <input value={topic} onChange={(e) => setTopic(e.target.value)} className={inputClass} placeholder="e.g. Launch of our new automation service" />
              </label>
              <button onClick={aiCaption} disabled={busy === "ai"} className="inline-flex items-center gap-1.5 rounded-xl bg-[#EDE8FF] px-4 py-2.5 text-sm font-bold text-[#5C3AAE] hover:bg-[#E2D9FF] disabled:opacity-50"><Sparkles size={15} aria-hidden /> {busy === "ai" ? "Writing…" : "AI caption"}</button>
            </div>
            <label className="mt-4 block text-xs font-bold text-[#476987]">Post content
              <textarea value={content} onChange={(e) => setContent(e.target.value)} className={inputClass + " min-h-32"} placeholder="What do you want to share?" />
            </label>

            <div className="mt-4">
              <p className="text-xs font-bold text-[#476987]">Platforms</p>
              {connections.length === 0 ? (
                <p className="mt-2 rounded-xl border border-dashed border-[#AFC6DE] bg-[#F5F9FE] px-3 py-3 text-sm text-[#4C6A86]">No channels connected. <Link href="/azmin/automations" className="font-bold text-[#0758C9] hover:underline">Connect a platform</Link> first.</p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {connections.map((c) => {
                    const on = picked.includes(c.id);
                    return (
                      <button key={c.id} onClick={() => toggle(c.id)} className={`rounded-xl border px-3 py-2 text-sm font-bold transition ${on ? "border-[#087CFA] bg-[#EAF4FF] text-[#0758C9]" : "border-[#CEDBE9] bg-white text-[#526F8A] hover:border-[#087CFA]"}`}>
                        {channelMeta[c.channel]?.label ?? c.channel} · {c.displayName}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {(() => {
              const pickedPlatforms = [...new Set(connections.filter((c) => picked.includes(c.id)).map((c) => CHANNEL_TO_PLATFORM[c.channel]).filter(Boolean))];
              const specs = specsForPlatforms(pickedPlatforms);
              if (specs.length === 0) return null;
              return (
                <div className="mt-4 rounded-xl border border-[#B9E9FA] bg-[#ECFAFF] px-3.5 py-3">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#17577A]">Recommended sizes for these platforms</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {specs.map((s) => (
                      <span key={`${s.platform}-${s.format}`} className="rounded-lg bg-white px-2 py-1 text-[11px] font-bold text-[#0758C9]">{s.label} · {s.width}×{s.height} <span className="text-[#7890A6]">({s.aspect})</span></span>
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] leading-4 text-[#47708A]">Media is cropped + downscaled to each size — never upscaled, so no quality loss. Video resizing needs a media service (next step).</p>
                </div>
              );
            })()}

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {companies.length > 0 && <label className="block text-xs font-bold text-[#476987]">Company (optional)<select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className={inputClass}><option value="">— none —</option>{companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>}
              <label className="block text-xs font-bold text-[#476987]">Schedule (optional)<input type="datetime-local" value={schedule} onChange={(e) => setSchedule(e.target.value)} className={inputClass} /></label>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button onClick={() => create(false)} disabled={busy !== "" || connections.length === 0} className="rounded-xl border border-[#B8CCE0] bg-white px-5 py-2.5 text-sm font-bold text-[#234B70] hover:border-[#087CFA] disabled:opacity-50">{busy === "draft" ? "Saving…" : schedule ? "Schedule" : "Save draft"}</button>
              <button onClick={() => create(true)} disabled={busy !== "" || connections.length === 0} className="inline-flex items-center gap-2 rounded-xl bg-[#087CFA] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(8,124,250,.2)] disabled:opacity-50"><Send size={15} aria-hidden /> {busy === "pub" ? "Publishing…" : "Publish now"}</button>
            </div>
          </section>
        )}

        <section className="mt-8">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold"><Megaphone size={18} aria-hidden /> Your posts</h2>
          {posts.length === 0 ? (
            <p className="mt-3 rounded-2xl border border-dashed border-[#AFC6DE] bg-[#F5F9FE] px-5 py-8 text-center text-sm text-[#4C6A86]">No posts yet. Compose one above.</p>
          ) : (
            <div className="mt-3 space-y-2.5">
              {posts.map((p) => (
                <div key={p.id} className="rounded-2xl border border-[#C8D8EA] bg-white p-4 shadow-[0_10px_28px_rgba(3,20,46,.05)]">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 flex-1 whitespace-pre-wrap text-sm text-[#203a52]">{p.content}</p>
                    <span className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white" style={{ background: postStatusMeta[p.status].color }}>{postStatusMeta[p.status].label}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {p.targets.map((t) => (
                      <span key={t.id} title={t.detail ?? ""} className="rounded-lg bg-[#F1F5FA] px-2 py-1 text-[11px] font-bold text-[#526F8A]">
                        {channelMeta[t.channel as Channel]?.label ?? t.channel} · <span style={{ color: targetColor(t.status) }}>{t.status.toLowerCase()}</span>
                      </span>
                    ))}
                    {p.scheduledAt && <span className="rounded-lg bg-[#FFF7E5] px-2 py-1 text-[11px] font-bold text-[#8A5A0B]">⏰ {new Date(p.scheduledAt).toLocaleString()}</span>}
                    {canManage && (
                      <div className="ml-auto flex items-center gap-1.5">
                        {p.status !== "PUBLISHED" && <button onClick={() => publishExisting(p.id)} disabled={busy === p.id} className="inline-flex items-center gap-1 rounded-lg bg-[#EAF4FF] px-2.5 py-1 text-[11px] font-bold text-[#0758C9] hover:bg-[#DDEBFA] disabled:opacity-50"><Send size={12} aria-hidden /> Publish</button>}
                        <button onClick={() => remove(p.id)} disabled={busy === p.id} aria-label="Remove" className="grid h-7 w-7 place-items-center rounded-lg text-[#A12C2C] hover:bg-[#FFF0F0] disabled:opacity-50"><Trash2 size={13} aria-hidden /></button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function targetColor(status: TargetStatus) {
  return status === "PUBLISHED" ? "#087B54" : status === "SIMULATED" ? "#5C3AAE" : status === "FAILED" ? "#B4231C" : status === "SKIPPED" ? "#8A5A0B" : "#526F8A";
}
const inputClass = "mt-1.5 w-full rounded-xl border border-[#AFC6DE] bg-white px-3 py-2.5 text-sm text-[#03142E] outline-none transition placeholder:text-[#7890A6] focus:border-[#087CFA] focus:ring-2 focus:ring-[#087CFA]/15";
