import { z } from "zod";
import { guard } from "@/lib/api-guard";
import { getProviderSecret } from "@/lib/integrations/credentials";
import { parseCloudinaryConfig, uploadToCloudinary } from "@/lib/cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Base64 data-URI upload keeps this dependency-free (no multipart parsing).
const schema = z.object({
  file: z.string().min(16).max(30_000_000), // data URI or remote URL
  resourceType: z.enum(["image", "video"]).default("image"),
});

export async function POST(req: Request) {
  const g = await guard("EDITOR");
  if (!g.ok) return g.response;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "No file provided." }, { status: 400 });

  const secret = await getProviderSecret(g.user.workspaceId, "CLOUDINARY");
  if (!secret) return Response.json({ error: "Connect Cloudinary in the API Vault first (adds auto-resize)." }, { status: 400 });
  const config = parseCloudinaryConfig(secret);
  if (!config) return Response.json({ error: "Cloudinary credential must be cloudName:apiKey:apiSecret." }, { status: 400 });

  try {
    const result = await uploadToCloudinary(config, parsed.data.file, parsed.data.resourceType);
    return Response.json({ publicId: result.publicId, url: result.url, resourceType: result.resourceType, cloudName: config.cloudName });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Upload failed." }, { status: 502 });
  }
}
