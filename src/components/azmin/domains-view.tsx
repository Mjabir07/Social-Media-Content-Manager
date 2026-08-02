"use client";

import Link from "next/link";
import Image from "next/image";
import { Globe, Plus, ExternalLink } from "lucide-react";
import { AzminProfileMenu } from "@/components/azmin/profile-menu";

type DomainRecord = {
  id: string;
  domainName: string;
  registrar: string | null;
  expiryDate: Date | null;
  autoRenew: boolean;
  status: string;
  company: { name: string; primaryColor: string } | null;
};

export function DomainsView({
  records,
  userName,
  userEmail,
  userRole,
}: {
  records: DomainRecord[];
  userName: string;
  userEmail: string;
  userRole: string;
}) {
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
              <span className="mt-0.5 block text-[11px] font-extrabold uppercase tracking-[.17em] text-[#456784]">Infrastructure</span>
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
            <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[.15em] text-[#0758C9]">
              <Link href="/azmin/infrastructure" className="hover:underline">Phase 6 · Infrastructure</Link>
              <span className="text-[#8FB3D0]">/</span>
              <span>Domains</span>
            </div>
            <h1 className="mt-1 flex items-center gap-3 font-display text-3xl font-bold tracking-[-.03em]">
              <Globe className="text-[#16A34A]" size={28} />
              Domains & DNS
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-[#4C6A86]">
              Track domain registrations, SSL certificates, and DNS settings for AZMIN and client sites.
            </p>
          </div>
          <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#16A34A] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(22,163,74,.2)] transition hover:bg-[#15803D]">
            <Plus size={16} />
            Add Domain
          </button>
        </div>

        <section className="mt-9">
          {records.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#AFC6DE] bg-[#F5F9FE] px-5 py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F0FDF4] text-[#16A34A]">
                <Globe size={32} />
              </div>
              <h3 className="mt-4 text-base font-bold text-[#173A5C]">No domains tracked yet</h3>
              <p className="mt-1 text-sm text-[#526F8A]">Keep track of when domains expire and where they are registered.</p>
              <button className="mt-6 rounded-xl bg-[#16A34A] px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#15803D]">
                Track a domain
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {records.map((record) => (
                <div key={record.id} className="flex flex-col justify-between rounded-2xl border border-[#C5D6E6] bg-white p-5 shadow-[0_10px_28px_rgba(3,20,46,.05)]">
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#F0FDF4] text-[#16A34A]">
                          <Globe size={20} />
                        </div>
                        <div>
                          <div className="font-bold text-[#173A5C]">{record.domainName}</div>
                          <div className="text-xs font-semibold text-[#526F8A]">{record.registrar || "Unknown Registrar"}</div>
                        </div>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${record.status === "ACTIVE" ? "bg-[#E7F8EF] text-[#087B54]" : "bg-[#FFF1D5] text-[#9A6711]"}`}>
                        {record.status}
                      </span>
                    </div>

                    <div className="mt-5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#72899E]">Assigned to</span>
                        <span className="font-bold text-[#03142E]">{record.company?.name || "AZMIN Core (Shared)"}</span>
                      </div>
                      {record.expiryDate && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#72899E]">Expiry Date</span>
                          <span className={`font-bold ${new Date(record.expiryDate).getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000 ? "text-[#A12C2C]" : "text-[#03142E]"}`}>
                            {new Date(record.expiryDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-6 flex items-center gap-2 border-t border-[#EAF1F9] pt-4">
                    <button className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#B8CCE0] bg-[#F8FBFF] py-2 text-xs font-bold text-[#234B70] transition hover:border-[#087CFA]">
                      Manage DNS
                    </button>
                    <a href={`https://${record.domainName}`} target="_blank" rel="noreferrer" className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#B8CCE0] bg-[#F8FBFF] py-2 text-xs font-bold text-[#234B70] transition hover:border-[#087CFA]">
                      Visit <ExternalLink size={14} />
                    </a>
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
