import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { COMPANY_RELATIONSHIPS, uniqueCompanySlug } from "@/lib/companies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  relationshipType: z.enum(COMPANY_RELATIONSHIPS),
  industry: z.string().trim().max(100).optional().or(z.literal("")),
  website: z.string().trim().url().max(240).optional().or(z.literal("")),
  description: z.string().trim().max(600).optional().or(z.literal("")),
});

export async function GET() {
  const g = await guard("VIEWER");
  if (!g.ok) return g.response;
  const companies = await prisma.company.findMany({
    where: { workspaceId: g.user.workspaceId, status: { not: "ARCHIVED" } },
    select: { id: true, name: true, relationshipType: true, industry: true, status: true, isHeadquarters: true },
    orderBy: [{ isHeadquarters: "desc" }, { name: "asc" }],
  });
  return Response.json(companies);
}

export async function POST(req: Request) {
  const g = await guard("ADMIN");
  if (!g.ok) return g.response;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Check the company details.", fields: parsed.error.flatten().fieldErrors }, { status: 400 });

  const slug = await uniqueCompanySlug(g.user.workspaceId, parsed.data.name);
  const company = await prisma.company.create({
    data: {
      workspaceId: g.user.workspaceId,
      name: parsed.data.name,
      slug,
      relationshipType: parsed.data.relationshipType,
      industry: parsed.data.industry || null,
      website: parsed.data.website || null,
      description: parsed.data.description || null,
      brandProfile: { create: {} },
      brain: { create: {} },
    },
    select: { id: true, name: true },
  });
  await logActivity(g.user, { action: "company.created", targetType: "company", targetId: company.id, targetLabel: company.name });
  return Response.json(company, { status: 201 });
}
