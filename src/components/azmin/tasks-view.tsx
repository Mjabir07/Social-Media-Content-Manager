"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckSquare, Plus, Loader2, Trash2, Calendar, AlertTriangle, ChevronRight, ChevronLeft, X } from "lucide-react";
import { AzminProfileMenu } from "@/components/azmin/profile-menu";
import {
  TASK_STATUSES,
  TASK_PRIORITIES,
  statusMeta,
  priorityMeta,
  groupByStatus,
  taskStats,
  isOverdue,
  type TaskStatus,
  type TaskPriority,
} from "@/lib/tasks-catalog";

export type TaskDTO = {
  id: string;
  title: string;
  notes: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  order: number;
  createdAt: string;
};

// Next status when you push a task forward / back through the board.
const NEXT: Record<TaskStatus, TaskStatus | null> = { TODO: "PENDING", PENDING: "DONE", DONE: null };
const PREV: Record<TaskStatus, TaskStatus | null> = { TODO: null, PENDING: "TODO", DONE: "PENDING" };

export function TasksView({
  initialTasks,
  canManage,
  userName,
  userEmail,
  userRole,
}: {
  initialTasks: TaskDTO[];
  canManage: boolean;
  userName: string;
  userEmail: string;
  userRole: string;
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const grouped = useMemo(() => groupByStatus(tasks.map((t) => ({ ...t, dueDate: t.dueDate }))), [tasks]);
  const stats = useMemo(() => taskStats(tasks), [tasks]);

  async function refresh() {
    const res = await fetch("/api/tasks", { cache: "no-store" });
    if (res.ok) setTasks((await res.json()).tasks ?? []);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, priority, dueDate: dueDate || null, notes: notes || null }),
    });
    setSaving(false);
    if (res.ok) {
      setTitle(""); setPriority("MEDIUM"); setDueDate(""); setNotes(""); setShowNotes(false);
      await refresh();
    }
  }

  async function move(id: string, status: TaskStatus) {
    setBusyId(id);
    // optimistic
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    const res = await fetch(`/api/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setBusyId(null);
    if (!res.ok) await refresh();
  }

  async function remove(id: string) {
    setBusyId(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    setBusyId(null);
  }

  const inputCls = "rounded-xl border border-[#B8CCE0] bg-white px-3.5 py-2.5 text-sm text-[#0f2137] outline-none placeholder:text-[#93A9BF] focus:border-[#087CFA]";

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
              <span className="mt-0.5 block text-[11px] font-extrabold uppercase tracking-[.17em] text-[#456784]">Tasks</span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/azmin" className="hidden rounded-xl border border-[#B8CCE0] bg-[#F8FBFF] px-4 py-2.5 text-xs font-bold text-[#234B70] hover:border-[#087CFA] sm:block">Command center</Link>
            <AzminProfileMenu name={userName} email={userEmail} role={userRole} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 pb-16 pt-6 sm:px-8 sm:pt-8">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[.15em] text-[#0758C9]">Daily to-do</p>
          <h1 className="mt-1 flex items-center gap-3 font-display text-3xl font-bold tracking-[-.03em]">
            <CheckSquare className="text-[#087CFA]" size={28} /> Tasks & tracking
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-[#4C6A86]">Capture what to do, park what is pending, finish each one. Move cards forward as work progresses.</p>
        </div>

        {/* Stat strip */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="To do" value={stats.todo} tone="#0758C9" />
          <Stat label="Pending" value={stats.pending} tone="#9A6711" />
          <Stat label="Done" value={stats.done} tone="#087B54" />
          <Stat label="Overdue" value={stats.overdue} tone="#B4231C" />
        </div>

        {/* Add form */}
        {canManage && (
          <form onSubmit={handleAdd} className="mt-6 rounded-2xl border border-[#C5D6E6] bg-white p-4 shadow-[0_10px_28px_rgba(3,20,46,.05)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input className={`flex-1 ${inputCls}`} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add a task… e.g. Send proposal to client" maxLength={200} required />
              <select className={inputCls} value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} aria-label="Priority">
                {TASK_PRIORITIES.map((p) => <option key={p} value={p}>{priorityMeta[p].label} priority</option>)}
              </select>
              <input className={inputCls} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} aria-label="Due date" />
              <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#087CFA] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(8,124,250,.2)] transition hover:bg-[#076BE0] disabled:opacity-60">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Add
              </button>
            </div>
            {showNotes ? (
              <textarea className={`mt-3 w-full ${inputCls}`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" rows={2} maxLength={2000} />
            ) : (
              <button type="button" onClick={() => setShowNotes(true)} className="mt-2 text-xs font-bold text-[#0758C9] hover:underline">+ Add notes</button>
            )}
          </form>
        )}

        {/* Board */}
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {TASK_STATUSES.map((status) => (
            <section key={status} className="rounded-2xl border border-[#C5D6E6] bg-white p-4 shadow-[0_10px_28px_rgba(3,20,46,.05)]">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider" style={{ color: statusMeta[status].color, background: statusMeta[status].bg }}>
                    {statusMeta[status].label}
                  </span>
                  <span className="text-xs font-bold text-[#72899E]">{grouped[status].length}</span>
                </div>
              </div>
              <p className="mb-3 text-[11px] font-semibold text-[#8299AE]">{statusMeta[status].hint}</p>
              {grouped[status].length === 0 ? (
                <p className="rounded-xl border border-dashed border-[#C4D5E6] bg-[#F7FAFE] px-3 py-6 text-center text-xs text-[#8299AE]">Nothing here.</p>
              ) : (
                <ul className="space-y-2.5">
                  {grouped[status].map((t) => {
                    const overdue = isOverdue(t);
                    return (
                      <li key={t.id} className={`rounded-xl border bg-[#FBFDFF] p-3 ${overdue ? "border-[#F0C9C4]" : "border-[#DCE7F2]"}`}>
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-bold ${status === "DONE" ? "text-[#7C93A8] line-through" : "text-[#173A5C]"}`}>{t.title}</p>
                          <span className="shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide" style={{ color: priorityMeta[t.priority].color, background: priorityMeta[t.priority].bg }}>
                            {priorityMeta[t.priority].label}
                          </span>
                        </div>
                        {t.notes && <p className="mt-1 text-xs text-[#5B7690]">{t.notes}</p>}
                        {t.dueDate && (
                          <p className={`mt-1.5 flex items-center gap-1 text-[11px] font-semibold ${overdue ? "text-[#B4231C]" : "text-[#72899E]"}`}>
                            {overdue ? <AlertTriangle size={11} /> : <Calendar size={11} />}
                            {new Date(t.dueDate).toLocaleDateString()}{overdue ? " · overdue" : ""}
                          </p>
                        )}
                        {canManage && (
                          <div className="mt-2.5 flex items-center gap-1.5 border-t border-[#EAF1F9] pt-2.5">
                            {PREV[status] && (
                              <button onClick={() => move(t.id, PREV[status]!)} disabled={busyId === t.id} title={`Move to ${statusMeta[PREV[status]!].label}`} className="inline-flex items-center gap-1 rounded-lg border border-[#B8CCE0] bg-white px-2 py-1.5 text-[11px] font-bold text-[#234B70] transition hover:border-[#087CFA] disabled:opacity-60">
                                <ChevronLeft size={12} /> {statusMeta[PREV[status]!].label}
                              </button>
                            )}
                            {NEXT[status] && (
                              <button onClick={() => move(t.id, NEXT[status]!)} disabled={busyId === t.id} title={`Move to ${statusMeta[NEXT[status]!].label}`} className="inline-flex items-center gap-1 rounded-lg bg-[#087CFA] px-2 py-1.5 text-[11px] font-bold text-white transition hover:bg-[#076BE0] disabled:opacity-60">
                                {statusMeta[NEXT[status]!].label} <ChevronRight size={12} />
                              </button>
                            )}
                            {status === "DONE" && (
                              <button onClick={() => move(t.id, "TODO")} disabled={busyId === t.id} title="Reopen" className="inline-flex items-center gap-1 rounded-lg border border-[#B8CCE0] bg-white px-2 py-1.5 text-[11px] font-bold text-[#234B70] transition hover:border-[#087CFA] disabled:opacity-60">
                                <X size={12} /> Reopen
                              </button>
                            )}
                            <button onClick={() => remove(t.id)} disabled={busyId === t.id} title="Delete" className="ml-auto inline-flex items-center rounded-lg border border-[#F0C9C4] bg-white px-2 py-1.5 text-[#C0362C] transition hover:bg-[#FDECEC] disabled:opacity-60">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-xl border border-[#C5D6E6] bg-white px-4 py-3 shadow-[0_6px_18px_rgba(3,20,46,.04)]">
      <div className="text-2xl font-black" style={{ color: tone }}>{value}</div>
      <div className="text-[11px] font-bold uppercase tracking-wider text-[#72899E]">{label}</div>
    </div>
  );
}
