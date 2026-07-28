import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getCompanies } from "@/lib/companies";
import { getServices } from "@/lib/services";
import { ServicesView } from "@/components/azmin/services-view";
import type { PricingModel } from "@/lib/services-catalog";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/azmin/services");

  const [services, companies] = await Promise.all([
    getServices(user.workspaceId),
    getCompanies(user.workspaceId),
  ]);

  return (
    <ServicesView
      services={services.map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        description: s.description,
        pricingModel: s.pricingModel as PricingModel,
        priceCents: s.priceCents,
        currency: s.currency,
        unit: s.unit,
        companyId: s.companyId,
      }))}
      companies={companies.map((c) => ({ id: c.id, name: c.name }))}
      canManage={user.role === "OWNER" || user.role === "ADMIN"}
      userName={user.name}
      userEmail={user.email}
      userRole={user.role}
    />
  );
}
