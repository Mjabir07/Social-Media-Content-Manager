"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Calculator, Loader2, Check, ArrowLeft } from "lucide-react";
import { AzminProfileMenu } from "@/components/azmin/profile-menu";
import {
  computeHourlyRateCents,
  billableHours,
  DEFAULT_WORKING_HOURS,
  DEFAULT_BILLABLE_PERCENT,
  type RateSettings,
} from "@/lib/rate-catalog";

const money = (cents: number | null, currency: string) =>
  cents == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(cents / 100);

export function RateSettingsView({
  settings,
  canManage,
  userName,
  userEmail,
  userRole,
}: {
  settings: RateSettings;
  canManage: boolean;
  userName: string;
  userEmail: string;
  userRole: string;
}) {
  const [currency, setCurrency] = useState(settings.currency || "AED");
  const [overhead, setOverhead] = useState(settings.monthlyOverheadCents != null ? String(settings.monthlyOverheadCents / 100) : "");
  const [pay, setPay] = useState(settings.monthlyPayTargetCents != null ? String(settings.monthlyPayTargetCents / 100) : "");
  const [hours, setHours] = useState(settings.workingHoursPerMonth != null ? String(settings.workingHoursPerMonth) : String(DEFAULT_WORKING_HOURS));
  const [billable, setBillable] = useState(settings.billablePercent != null ? String(settings.billablePercent) : String(DEFAULT_BILLABLE_PERCENT));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toCents = (v: string) => (v ? Math.round(parseFloat(v) * 100) : null);
  const overheadC = toCents(overhead);
  const payC = toCents(pay);
  const hoursN = hours ? Math.max(1, Math.round(parseFloat(hours))) : null;
  const billableN = billable ? Math.min(100, Math.max(1, Math.round(parseFloat(billable)))) : null;

  const billHrs = billableHours(hoursN, billableN);
  const rate = computeHourlyRateCents({ monthlyOverheadCents: overheadC, monthlyPayTargetCents: payC, workingHoursPerMonth: hoursN, billablePercent: billableN });

  async function save() {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/settings/rate", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currency, monthlyOverheadCents: overheadC, monthlyPayTargetCents: payC, workingHoursPerMonth: hoursN, billablePercent: billableN }),
    });
    setSaving(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error ?? "Could not save.");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const inputCls = "mt-1 w-full rounded-xl border border-[#B8CCE0] bg-white px-3.5 py-2.5 text-sm text-[#0f2137] outline-none placeholder:text-[#93A9BF] focus:border-[#087CFA]";

  return (
    <main data-azmin-ui className="min-h-screen bg-[#EAF1F9] text-[#03142E]">
      <header className="border-b border-[#C8D8EA] bg-white px-5 py-4 shadow-[0_1px_8px_rgba(3,20,46,.06)] sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <Link href="/azmin" className="flex items-center gap-3">
            <span className="relative h-10 w-10 shrink-0"><Image src="/brand/azmin-c1-mark.png" alt="AZMIN" fill priority sizes="40px" className="object-contain" /></span>
            <span>
              <strong className="block font-display text-[15px] font-bold">AZMIN Digital OS</strong>
              <span className="mt-0.5 block text-[11px] font-extrabold uppercase tracking-[.17em] text-[#456784]">Settings · Hourly rate</span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/azmin" className="hidden rounded-xl border border-[#B8CCE0] bg-[#F8FBFF] px-4 py-2.5 text-xs font-bold text-[#234B70] hover:border-[#087CFA] sm:block">Command center</Link>
            <AzminProfileMenu name={userName} email={userEmail} role={userRole} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 pb-16 pt-6 sm:px-8 sm:pt-8">
        <Link href="/azmin" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0758C9] hover:underline"><ArrowLeft size={14} /> Back</Link>

        <div className="mt-3">
          <p className="text-[11px] font-extrabold uppercase tracking-[.15em] text-[#0758C9]">Costing</p>
          <h1 className="mt-1 flex items-center gap-3 font-display text-3xl font-bold tracking-[-.03em]"><Calculator className="text-[#087CFA]" size={28} /> Your hourly cost rate</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-[#4C6A86]">Work out what one hour of your time truly costs. This becomes the default <strong>Hourly rate</strong> on new work orders, so profit is honest.</p>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="grid gap-3 rounded-2xl border border-[#C5D6E6] bg-white p-5 shadow-[0_10px_28px_rgba(3,20,46,.05)] sm:grid-cols-2">
            <label className="text-xs font-bold text-[#476987]">
              Currency
              <input className={inputCls} value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase().slice(0, 3))} maxLength={3} disabled={!canManage} />
            </label>
            <div className="hidden sm:block" />
            <label className="text-xs font-bold text-[#476987]">
              Monthly business cost <span className="font-normal text-[#93A9BF]">(tools, rent, subs)</span>
              <input className={inputCls} type="number" min="0" step="0.01" value={overhead} onChange={(e) => setOverhead(e.target.value)} placeholder="0.00" disabled={!canManage} />
            </label>
            <label className="text-xs font-bold text-[#476987]">
              Your monthly pay target <span className="font-normal text-[#93A9BF]">(take-home)</span>
              <input className={inputCls} type="number" min="0" step="0.01" value={pay} onChange={(e) => setPay(e.target.value)} placeholder="0.00" disabled={!canManage} />
            </label>
            <label className="text-xs font-bold text-[#476987]">
              Working hours / month
              <input className={inputCls} type="number" min="1" step="1" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="160" disabled={!canManage} />
            </label>
            <label className="text-xs font-bold text-[#476987]">
              Billable %  <span className="font-normal text-[#93A9BF]">(of worked hours)</span>
              <input className={inputCls} type="number" min="1" max="100" step="1" value={billable} onChange={(e) => setBillable(e.target.value)} placeholder="60" disabled={!canManage} />
            </label>

            {error && <p className="sm:col-span-2 text-xs font-bold text-[#C0362C]">{error}</p>}
            {canManage && (
              <div className="flex items-center gap-2 sm:col-span-2">
                <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#087CFA] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#076BE0] disabled:opacity-60">
                  {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <Check size={15} /> : null} {saved ? "Saved" : "Save rate"}
                </button>
                <span className="text-xs text-[#8299AE]">Prefills new work orders. Re-run whenever your costs change.</span>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[#B7D7C6] bg-gradient-to-br from-[#0B7B54] to-[#0A5E43] p-6 text-white shadow-[0_16px_40px_rgba(7,60,43,.25)]">
            <p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-[#B9F0D6]">Your hourly cost</p>
            <div className="mt-2 font-display text-4xl font-black tracking-[-.04em]">{rate != null ? money(rate, currency) : "—"}<span className="text-lg font-bold text-[#B9F0D6]">/hr</span></div>
            <div className="mt-4 space-y-1.5 text-sm text-[#DDF5E9]">
              <div className="flex justify-between"><span>To cover / month</span><strong>{money((overheadC ?? 0) + (payC ?? 0) || null, currency)}</strong></div>
              <div className="flex justify-between"><span>Billable hours / month</span><strong>{billHrs.toFixed(0)} h</strong></div>
              <div className="mt-2 border-t border-white/15 pt-2 text-xs text-[#B9F0D6]">= (cost + pay) ÷ (hours × billable%)</div>
            </div>
            <p className="mt-4 text-xs leading-5 text-[#CDEFDD]">Charge above this to profit. On a work order, hours × this rate = your labor cost.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
