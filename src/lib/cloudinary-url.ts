import type { PlatformSpec } from "@/lib/media-specs";

/**
 * Pure Cloudinary helpers (no crypto/network) — safe for client components so
 * the composer can preview per-platform variants. Credentials are stored as
 * "cloudName:apiKey:apiSecret".
 */

export type CloudinaryConfig = { cloudName: string; apiKey: string; apiSecret: string };

export function parseCloudinaryConfig(secret: string): CloudinaryConfig | null {
  const parts = secret.split(":");
  if (parts.length < 3) return null;
  const [cloudName, apiKey, ...rest] = parts;
  const apiSecret = rest.join(":");
  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret };
}

// A delivery URL that crops+scales the asset to a platform spec: c_fill+g_auto
// smart-crops to the exact frame, q_auto/f_auto keep quality while shrinking.
export function buildVariantUrl(cloudName: string, publicId: string, resourceType: "image" | "video", spec: Pick<PlatformSpec, "width" | "height">): string {
  const t = `c_fill,g_auto,w_${spec.width},h_${spec.height},q_auto,f_auto`;
  return `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${t}/${publicId}`;
}

export function platformVariants(cloudName: string, publicId: string, resourceType: "image" | "video", specs: PlatformSpec[]) {
  return specs.map((spec) => ({ platform: spec.platform, format: spec.format, label: spec.label, width: spec.width, height: spec.height, url: buildVariantUrl(cloudName, publicId, resourceType, spec) }));
}
