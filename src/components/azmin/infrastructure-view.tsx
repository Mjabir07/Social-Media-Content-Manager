import Link from "next/link";
import Image from "next/image";
import { AzminProfileMenu } from "@/components/azmin/profile-menu";
import { Server, Globe, Mail } from "lucide-react";

export function InfrastructureView({
  userName,
  userEmail,
  userRole,
}: {
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
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[.15em] text-[#0758C9]">Phase 6 · Infrastructure</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-[-.03em]">Infrastructure & Hosting</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-[#4C6A86]">
            Manage hosting servers, domains, and Coolify integrations across all companies.
          </p>
        </div>

        <div className="mt-9 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Coolify Integration Card */}
          <div className="rounded-2xl border border-[#C5D6E6] bg-white p-6 shadow-[0_10px_28px_rgba(3,20,46,.05)]">
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-[#EAF9FF] text-[#087CFA]">
              <Server size={24} />
            </div>
            <h3 className="font-bold text-[#173A5C]">Coolify Servers</h3>
            <p className="mt-1 text-sm text-[#526F8A]">Connect your Hetzner/VPS instances running Coolify to automate deployments.</p>
            <Link href="/azmin/infrastructure/hosting" className="mt-4 flex w-full items-center justify-center rounded-xl bg-[#087CFA] py-2 text-sm font-bold text-white shadow-[0_8px_22px_rgba(8,124,250,.2)] transition hover:bg-[#076BE0]">
              Manage Coolify Servers
            </Link>
          </div>

          {/* Domains Card */}
          <div className="rounded-2xl border border-[#C5D6E6] bg-white p-6 shadow-[0_10px_28px_rgba(3,20,46,.05)]">
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-[#F0FDF4] text-[#16A34A]">
              <Globe size={24} />
            </div>
            <h3 className="font-bold text-[#173A5C]">Domains & DNS</h3>
            <p className="mt-1 text-sm text-[#526F8A]">Track domain expirations and SSL certificate renewals for all client sites.</p>
            <button className="mt-4 w-full rounded-xl border border-[#B8CCE0] bg-[#F8FBFF] py-2 text-sm font-bold text-[#234B70] transition hover:border-[#087CFA]">
              View Domains
            </button>
          </div>

          {/* Email Services Card */}
          <div className="rounded-2xl border border-[#C5D6E6] bg-white p-6 shadow-[0_10px_28px_rgba(3,20,46,.05)]">
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-[#FFF7ED] text-[#EA580C]">
              <Mail size={24} />
            </div>
            <h3 className="font-bold text-[#173A5C]">Workspace & Email</h3>
            <p className="mt-1 text-sm text-[#526F8A]">Manage Google Workspace, Microsoft 365, and other hosted email records.</p>
            <button className="mt-4 w-full rounded-xl border border-[#B8CCE0] bg-[#F8FBFF] py-2 text-sm font-bold text-[#234B70] transition hover:border-[#087CFA]">
              View Email Services
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
