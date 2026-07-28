import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { prisma } from "@/lib/db";
import { generateCaption } from "@/lib/ai/post-caption";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  topic: z.string().trim().min(2).max(500),
  companyId: z.string().trim().max(40).nullish(),
});

export async function POST(req: Request) {
  const g = await guard("EDITOR");
  if (!g.ok) return g.response;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Enter a short topic first." }, { status: 400 });

  let brandVoice: string | null = null;
  let company: string | null = null;
  if (parsed.data.companyId) {
    const found = await prisma.company.findFirst({
      where: { id: parsed.data.companyId, workspaceId: g.user.workspaceId },
      select: { name: true, brandProfile: { select: { brandVoice: true } } },
    });
    brandVoice = found?.brandProfile?.brandVoice ?? null;
    company = found?.name ?? null;
  }
  const result = await generateCaption({ topic: parsed.data.topic, brandVoice, company });
  return Response.json(result);
}
