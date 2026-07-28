import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getCompanies } from "@/lib/companies";
import { getPartnerships, getPartnershipSettlement } from "@/lib/partnerships";
import { PartnersView } from "@/components/azmin/partners-view";

export const dynamic = "force-dynamic";

export default async function PartnersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/azmin/partners");

  const [partnerships, companies] = await Promise.all([
    getPartnerships(user.workspaceId),
    getCompanies(user.workspaceId),
  ]);

  const partners = await Promise.all(
    partnerships.map(async (p) => {
      const s = await getPartnershipSettlement(user.workspaceId, p.id);
      return {
        id: p.id,
        name: p.name,
        partnerCompanyName: p.partnerCompany?.name ?? "Partner",
        commissionType: p.commissionType,
        commissionRateBps: p.commissionRateBps,
        commissionFlatCents: p.commissionFlatCents,
        currency: p.currency,
        status: p.status,
        settlement: s ?? { earnedCents: 0, paidCents: 0, outstandingCents: 0, wonCount: 0, currency: p.currency },
      };
    }),
  );

  const partnerCompanies = companies
    .filter((c) => c.relationshipType === "PARTNER")
    .map((c) => ({ id: c.id, name: c.name }));

  return (
    <PartnersView
      partners={partners}
      partnerCompanies={partnerCompanies}
      canManage={user.role === "OWNER" || user.role === "ADMIN"}
      userName={user.name}
      userEmail={user.email}
      userRole={user.role}
    />
  );
}
