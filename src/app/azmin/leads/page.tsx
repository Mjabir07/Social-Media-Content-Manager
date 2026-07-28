import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getCompanies } from "@/lib/companies";
import { getServices } from "@/lib/services";
import { getLeads } from "@/lib/leads";
import { getPartnerships } from "@/lib/partnerships";
import { LeadsView } from "@/components/azmin/leads-view";
import type { LeadStage } from "@/lib/leads-catalog";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/azmin/leads");

  const [leads, companies, services, partnerships] = await Promise.all([
    getLeads(user.workspaceId),
    getCompanies(user.workspaceId),
    getServices(user.workspaceId),
    getPartnerships(user.workspaceId),
  ]);

  return (
    <LeadsView
      leads={leads.map((l) => ({
        id: l.id, name: l.name, email: l.email, phone: l.phone, source: l.source,
        serviceId: l.serviceId, companyId: l.companyId, valueCents: l.valueCents, currency: l.currency,
        notes: l.notes, stage: l.stage as LeadStage, score: l.score, aiSummary: l.aiSummary,
      }))}
      companies={companies.map((c) => ({ id: c.id, name: c.name }))}
      services={services.map((s) => ({ id: s.id, name: s.name }))}
      partners={partnerships.map((p) => ({ id: p.id, name: p.name || p.partnerCompany?.name || "Partner" }))}
      canManage={user.role === "OWNER" || user.role === "ADMIN" || user.role === "EDITOR"}
      userName={user.name}
      userEmail={user.email}
      userRole={user.role}
    />
  );
}
