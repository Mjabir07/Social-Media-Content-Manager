import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { COMPANY_RELATIONSHIPS, archiveCompany } from "@/lib/companies";
import { serializeJson } from "@/lib/json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  relationshipType: z.enum(COMPANY_RELATIONSHIPS).optional(),
  industry: z.string().trim().max(100).nullish(),
  website: z.string().trim().url().max(240).nullish().or(z.literal("")),
  description: z.string().trim().max(4000).nullish(),
  status: z.enum(["ACTIVE", "PAUSED", "ARCHIVED"]).optional(),
  tagline: z.string().trim().max(180).nullish(),
  brandVoice: z.string().trim().max(1200).nullish(),
  targetAudiences: z.array(z.string().trim().min(1).max(160)).max(20).optional(),
  offerings: z.array(z.string().trim().min(1).max(160)).max(30).optional(),
  differentiators: z.array(z.string().trim().min(1).max(200)).max(20).optional(),
  contentRules: z.string().trim().max(2000).nullish(),
  companyFacts: z.string().trim().max(4000).nullish(),
  salesGuidance: z.string().trim().max(3000).nullish(),
  contentGuidance: z.string().trim().max(3000).nullish(),
  aiInstructions: z.string().trim().max(4000).nullish(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("ADMIN");
  if (!g.ok) return g.response;
  const { id } = await params;
  const existing = await prisma.company.findFirst({ where: { id, workspaceId: g.user.workspaceId }, select: { id: true, name: true } });
  if (!existing) return new Response("Not found", { status: 404 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Check the entered information.", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  const d = parsed.data;
  const companyFields = ["name", "relationshipType", "industry", "website", "description", "status"] as const;
  const companyData: Record<string, unknown> = {};
  for (const key of companyFields) if (d[key] !== undefined) companyData[key] = d[key] || null;

  const brandTouched = ["tagline", "brandVoice", "targetAudiences", "offerings", "differentiators", "contentRules"].some((key) => key in d);
  const brainTouched = ["companyFacts", "salesGuidance", "contentGuidance", "aiInstructions"].some((key) => key in d);
  const brandData = {
    ...(d.tagline !== undefined ? { tagline: d.tagline || null } : {}),
    ...(d.brandVoice !== undefined ? { brandVoice: d.brandVoice || null } : {}),
    ...(d.targetAudiences !== undefined ? { targetAudiences: serializeJson(d.targetAudiences) } : {}),
    ...(d.offerings !== undefined ? { offerings: serializeJson(d.offerings) } : {}),
    ...(d.differentiators !== undefined ? { differentiators: serializeJson(d.differentiators) } : {}),
    ...(d.contentRules !== undefined ? { contentRules: d.contentRules || null } : {}),
  };
  const brainData = {
    ...(d.companyFacts !== undefined ? { companyFacts: d.companyFacts || null } : {}),
    ...(d.salesGuidance !== undefined ? { salesGuidance: d.salesGuidance || null } : {}),
    ...(d.contentGuidance !== undefined ? { contentGuidance: d.contentGuidance || null } : {}),
    ...(d.aiInstructions !== undefined ? { aiInstructions: d.aiInstructions || null } : {}),
    ...(brainTouched ? { knowledgeStatus: "CONFIGURED" } : {}),
  };

  const updated = await prisma.company.update({
    where: { id },
    data: {
      ...companyData,
      ...(brandTouched ? { brandProfile: { upsert: { create: brandData, update: brandData } } } : {}),
      ...(brainTouched ? { brain: { upsert: { create: brainData, update: brainData } } } : {}),
    },
    select: { id: true, name: true },
  });
  await logActivity(g.user, { action: brainTouched ? "company.brain_updated" : "company.updated", targetType: "company", targetId: id, targetLabel: updated.name });
  return Response.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard("ADMIN");
  if (!g.ok) return g.response;
  const { id } = await params;
  const res = await archiveCompany(g.user.workspaceId, id);
  if (!res.ok) return Response.json({ error: res.error }, { status: res.error === "Not found" ? 404 : 400 });
  await logActivity(g.user, { action: "company.updated", targetType: "company", targetId: id });
  return Response.json({ ok: true });
}
