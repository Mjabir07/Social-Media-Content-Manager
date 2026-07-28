import { cookies } from "next/headers";
import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { prisma } from "@/lib/db";
import {
  ACTIVE_COMPANY_COOKIE,
  activeCompanyCookieOptions,
} from "@/lib/company-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  companyId: z.string().trim().min(1),
});

export async function PATCH(request: Request) {
  const g = await guard("VIEWER");
  if (!g.ok) return g.response;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: "Select a valid company." }, { status: 400 });
  }

  const company = await prisma.company.findFirst({
    where: {
      id: parsed.data.companyId,
      workspaceId: g.user.workspaceId,
      status: { not: "ARCHIVED" },
    },
    select: { id: true, name: true },
  });
  if (!company) return new Response("Not found", { status: 404 });

  const store = await cookies();
  store.set(
    ACTIVE_COMPANY_COOKIE,
    company.id,
    activeCompanyCookieOptions(),
  );
  return Response.json(company);
}