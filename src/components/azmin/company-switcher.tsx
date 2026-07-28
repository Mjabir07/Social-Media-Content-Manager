"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Check, ChevronDown, Loader2, Plus } from "lucide-react";
import type { CompanyContextItem } from "@/lib/company-context";

export type SwitcherCompany = CompanyContextItem;

const relationshipLabels: Record<string, string> = {
  OWN_BRAND: "Own brand",
  CLIENT: "Agency client",
  PARTNER: "Sales / commission partner",
  JOINT_VENTURE: "Joint venture",
};

export function CompanySwitcher({
  companies,
  activeCompanyId,
}: {
  companies: SwitcherCompany[];
  activeCompanyId?: string;
}) {
  const router = useRouter();
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const active =
    companies.find((company) => company.id === activeCompanyId) ??
    companies.find((company) => company.isHeadquarters) ??
    companies[0];

  async function activate(companyId: string) {
    if (companyId === active?.id || switchingId) return;
    setSwitchingId(companyId);
    setError("");
    const response = await fetch("/api/company-context", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId }),
    });
    setSwitchingId(null);
    if (!response.ok) {
      setError("Could not switch company.");
      return;
    }
    detailsRef.current?.removeAttribute("open");
    router.refresh();
  }

  if (!active) {
    return (
      <Link
        href="/azmin/companies?create=1"
        className="mt-4 flex w-full items-center gap-3 rounded-xl border border-dashed border-white/20 bg-white/[0.04] px-3 py-3 text-left transition hover:border-[#22D3EE]/50 hover:bg-white/[0.08]"
      >
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#0B3158] text-[#72DFEF]">
          <Plus size={16} aria-hidden />
        </span>
        <span>
          <span className="block text-[10px] font-extrabold uppercase tracking-[.16em] text-[#91AEC2]">Company context</span>
          <span className="mt-0.5 block text-sm font-bold text-white">Create your first company</span>
        </span>
      </Link>
    );
  }

  return (
    <details ref={detailsRef} className="group mt-4">
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-xl border border-white/10 bg-white/[0.055] px-3 py-3 text-left transition hover:border-[#22D3EE]/30 hover:bg-white/[0.08] [&::-webkit-details-marker]:hidden">
        <span
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-black text-white"
          style={{ backgroundColor: active.primaryColor }}
        >
          {active.name.slice(0, 1).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-extrabold uppercase tracking-[.16em] text-[#91AEC2]">Working as</span>
          <span className="mt-0.5 block truncate text-sm font-bold text-white">{active.name}</span>
        </span>
        <ChevronDown size={16} className="text-[#91AEC2] transition group-open:rotate-180" aria-hidden />
      </summary>

      <div className="mt-2 overflow-hidden rounded-xl border border-white/10 bg-[#09213F] p-1.5 shadow-[0_14px_35px_rgba(0,0,0,.25)]">
        <div className="max-h-64 space-y-1 overflow-y-auto">
          {companies.map((company) => {
            const selected = company.id === active.id;
            const switching = company.id === switchingId;
            return (
              <button
                key={company.id}
                type="button"
                onClick={() => activate(company.id)}
                disabled={Boolean(switchingId)}
                aria-pressed={selected}
                className={
                  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left transition disabled:cursor-wait " +
                  (selected ? "bg-[#1185F7] text-white" : "text-[#D4E2EF] hover:bg-white/[0.07] hover:text-white")
                }
              >
                <span
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-[10px] font-black text-white"
                  style={{ backgroundColor: company.primaryColor }}
                >
                  {company.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold">{company.name}</span>
                  <span className={"block truncate text-[10px] font-semibold " + (selected ? "text-white/75" : "text-[#8FAAC4]")}>
                    {relationshipLabels[company.relationshipType] ?? "Company"}
                  </span>
                </span>
                {switching ? <Loader2 size={14} className="animate-spin" aria-label="Switching company" /> : selected ? <Check size={14} aria-label="Current company" /> : null}
              </button>
            );
          })}
        </div>
        {error && <p className="px-2.5 py-2 text-[11px] font-bold text-[#FFAAA5]">{error}</p>}
        <div className="my-1.5 h-px bg-white/10" />
        <Link href="/azmin/companies" className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-bold text-[#9EDFF0] hover:bg-white/[0.07] hover:text-white">
          <Building2 size={15} aria-hidden /> Manage companies
        </Link>
      </div>
    </details>
  );
}