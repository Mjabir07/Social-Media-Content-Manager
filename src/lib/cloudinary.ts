import "server-only";
import { createHash } from "node:crypto";
import type { CloudinaryConfig } from "@/lib/cloudinary-url";

/**
 * Cloudinary media resize engine (server side: signing + upload). The pure URL
 * helpers live in "@/lib/cloudinary-url" and are re-exported. One upload; every
 * platform size is produced on-the-fly by a URL transform — no server
 * transcoding, works for image and video, never a blurry upscale.
 */
export * from "@/lib/cloudinary-url";

// Cloudinary signature: sha1 of the sorted signable params + api_secret.
function sign(params: Record<string, string>, apiSecret: string): string {
  const toSign = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("&");
  return createHash("sha1").update(toSign + apiSecret).digest("hex");
}

// Signed server-side upload. `file` is a data URI or a remote URL.
export async function uploadToCloudinary(config: CloudinaryConfig, file: string, resourceType: "image" | "video"): Promise<{ publicId: string; url: string; resourceType: "image" | "video" }> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = "azmin";
  const signature = sign({ folder, timestamp }, config.apiSecret);
  const form = new URLSearchParams({ file, api_key: config.apiKey, timestamp, folder, signature });

  const res = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/${resourceType}/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
    signal: AbortSignal.timeout(60_000),
  });
  const data = (await res.json().catch(() => ({}))) as { public_id?: string; secure_url?: string; error?: { message?: string } };
  if (!res.ok || !data.public_id || !data.secure_url) {
    throw new Error(data.error?.message ?? `Cloudinary upload failed (HTTP ${res.status}).`);
  }
  return { publicId: data.public_id, url: data.secure_url, resourceType };
}
