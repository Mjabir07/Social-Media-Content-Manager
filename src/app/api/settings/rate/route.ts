import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { getRateSettings, updateRateSettings } from "@/lib/workspace-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  currency: z.string().trim().length(3).optional(),
  monthlyOverheadCents: z.number().int().nonnegative().optional().nullable(),
  monthlyPayTargetCents: z.number().int().nonnegative().optional().nullable(),
  workingHoursPerMonth: z.number().int().positive().max(1000).optional().nullable(),
  billablePercent: z.number().int().min(1).max(100).optional().nullable(),
});

export async function GET() {
  const g = await guard();
  if (!g.ok) return g.response;
  return Response.json(await getRateSettings(g.user.workspaceId));
}

export async function PATCH(req: Request) {
  const g = await guard("ADMIN");
  if (!g.ok) return g.response;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Check the fields." }, { status: 400 });
  const settings = await updateRateSettings(g.user.workspaceId, parsed.data);
  return Response.json(settings);
}
