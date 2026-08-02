import Link from "next/link";
import { AzminProfileMenu } from "@/components/azmin/profile-menu";
import { Server, Globe, Mail, X } from "lucide-react";

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
    <div data-azmin-ui className="flex h-screen flex-col bg-[#F5F8FC] text-[#0A2233]">
      <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-[#C8D8EA] bg-white px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/azmin" className="flex items-center justify-center rounded-xl p-2 text-[#45647F] hover:bg-[#EAF1F8] hover:text-[#087CFA] lg:hidden">
            <X size={20} />
          </Link>
          <div className="h-6 w-px bg-[#D3E1EE] lg:hidden" />
          <h1 className="font-display text-lg font-bold tracking-tight">Infrastructure & Hosting</h1>
        </div>
        <div className="flex items-center gap-2">
          <AzminProfileMenu name={userName} email={userEmail} role={userRole} />
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8">
            <h2 className="font-display text-2xl font-bold">AZMIN Cloud Infrastructure</h2>
            <p className="mt-1 text-sm text-[#526F8A]">
              Manage hosting servers, domains, and Coolify integrations across all companies.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Coolify Integration Card */}
            <div className="rounded-2xl border border-[#C5D6E6] bg-white p-6 shadow-sm">
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-[#EAF9FF] text-[#087CFA]">
                <Server size={24} />
              </div>
              <h3 className="font-bold text-[#173A5C]">Coolify Servers</h3>
              <p className="mt-1 text-sm text-[#526F8A]">Connect your Hetzner/VPS instances running Coolify to automate deployments.</p>
              <button className="mt-4 w-full rounded-xl bg-[#087CFA] py-2 text-sm font-bold text-white transition hover:bg-[#076BE0]">
                Add Coolify Server
              </button>
            </div>

            {/* Domains Card */}
            <div className="rounded-2xl border border-[#C5D6E6] bg-white p-6 shadow-sm">
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-[#F0FDF4] text-[#16A34A]">
                <Globe size={24} />
              </div>
              <h3 className="font-bold text-[#173A5C]">Domains & DNS</h3>
              <p className="mt-1 text-sm text-[#526F8A]">Track domain expirations and SSL certificate renewals for all client sites.</p>
              <button className="mt-4 w-full rounded-xl border border-[#C8D8EA] py-2 text-sm font-bold text-[#173A5C] transition hover:bg-[#F5F8FC]">
                View Domains
              </button>
            </div>

            {/* Email Services Card */}
            <div className="rounded-2xl border border-[#C5D6E6] bg-white p-6 shadow-sm">
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-[#FFF7ED] text-[#EA580C]">
                <Mail size={24} />
              </div>
              <h3 className="font-bold text-[#173A5C]">Workspace & Email</h3>
              <p className="mt-1 text-sm text-[#526F8A]">Manage Google Workspace, Microsoft 365, and other hosted email records.</p>
              <button className="mt-4 w-full rounded-xl border border-[#C8D8EA] py-2 text-sm font-bold text-[#173A5C] transition hover:bg-[#F5F8FC]">
                View Email Services
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
