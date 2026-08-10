import { guard } from "@/lib/api-guard";
import { logActivity } from "@/lib/activity";
import { installAgencyServiceCatalogue } from "@/lib/services";

export const runtime = "nodejs";

export async function POST() {
  const g = await guard("ADMIN");
  if (!g.ok) return g.response;
  const result = await installAgencyServiceCatalogue(g.user.workspaceId, g.user.id);
  await logActivity(g.user, { action: "service.catalogue_installed", targetType: "service-catalogue", targetLabel: `${result.total} agency services` });
  return Response.json(result);
}
