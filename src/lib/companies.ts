import { prisma } from "@/lib/db";
import { parseJson } from "@/lib/json";

export const COMPANY_RELATIONSHIPS = ["OWN_BRAND", "CLIENT", "PARTNER", "JOINT_VENTURE"] as const;
export type CompanyRelationship = (typeof COMPANY_RELATIONSHIPS)[number];

export const relationshipLabels: Record<CompanyRelationship, string> = {
  OWN_BRAND: "Own brand",
  CLIENT: "Agency client",
  PARTNER: "Sales / commission partner",
  JOINT_VENTURE: "Joint venture",
};

export function companySlug(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "company";
}

export async function uniqueCompanySlug(workspaceId: string, name: string) {
  const base = companySlug(name);
  let slug = base;
  let suffix = 2;
  while (await prisma.company.findUnique({ where: { workspaceId_slug: { workspaceId, slug } }, select: { id: true } })) {
    slug = `${base}-${suffix++}`;
  }
  return slug;
}

export async function getCompanies(workspaceId: string) {
  return prisma.company.findMany({
    where: { workspaceId, status: { not: "ARCHIVED" } },
    include: { brandProfile: true, brain: true },
    orderBy: [{ isHeadquarters: "desc" }, { name: "asc" }],
  });
}

export async function getCompany(workspaceId: string, id: string) {
  const company = await prisma.company.findFirst({
    where: { id, workspaceId, status: { not: "ARCHIVED" } },
    include: { brandProfile: true, brain: true },
  });
  if (!company) return null;
  return {
    ...company,
    brandProfile: company.brandProfile ? {
      ...company.brandProfile,
      targetAudiences: parseJson<string[]>(company.brandProfile.targetAudiences, []),
      offerings: parseJson<string[]>(company.brandProfile.offerings, []),
      differentiators: parseJson<string[]>(company.brandProfile.differentiators, []),
    } : null,
  };
}
