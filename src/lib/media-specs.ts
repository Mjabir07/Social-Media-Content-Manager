/**
 * Platform media specs — the "right size for each platform" brain. Pure, so the
 * composer and the (future) resize engine share one source of truth. Cropping to
 * an aspect and downscaling preserve quality; we never upscale (that loses it).
 */

export type MediaFormat = "FEED" | "REEL" | "STORY" | "THUMBNAIL";

export type PlatformSpec = {
  platform: string; // INSTAGRAM | FACEBOOK | LINKEDIN | YOUTUBE
  format: MediaFormat;
  label: string;
  width: number;
  height: number;
  aspect: string; // "1:1" | "4:5" | "9:16" | "16:9" | "1.91:1"
  maxSeconds?: number; // for video formats
};

export const PLATFORM_MEDIA_SPECS: PlatformSpec[] = [
  { platform: "INSTAGRAM", format: "FEED", label: "Instagram feed", width: 1080, height: 1350, aspect: "4:5" },
  { platform: "INSTAGRAM", format: "REEL", label: "Instagram reel", width: 1080, height: 1920, aspect: "9:16", maxSeconds: 90 },
  { platform: "INSTAGRAM", format: "STORY", label: "Instagram story", width: 1080, height: 1920, aspect: "9:16", maxSeconds: 60 },
  { platform: "FACEBOOK", format: "FEED", label: "Facebook feed", width: 1080, height: 1350, aspect: "4:5" },
  { platform: "FACEBOOK", format: "REEL", label: "Facebook reel", width: 1080, height: 1920, aspect: "9:16", maxSeconds: 90 },
  { platform: "LINKEDIN", format: "FEED", label: "LinkedIn post", width: 1200, height: 1200, aspect: "1:1" },
  { platform: "YOUTUBE", format: "THUMBNAIL", label: "YouTube thumbnail", width: 1280, height: 720, aspect: "16:9" },
  { platform: "YOUTUBE", format: "REEL", label: "YouTube Short", width: 1080, height: 1920, aspect: "9:16", maxSeconds: 60 },
];

// Specs for the chosen platforms, optionally filtered to one format (e.g. REEL).
export function specsForPlatforms(platforms: string[], format?: MediaFormat): PlatformSpec[] {
  const set = new Set(platforms.map((p) => p.toUpperCase()));
  return PLATFORM_MEDIA_SPECS.filter((s) => set.has(s.platform) && (!format || s.format === format));
}

export function aspectRatio(aspect: string): number {
  const [w, h] = aspect.split(":").map(Number);
  return h ? w / h : 1;
}

export type CropRect = { left: number; top: number; width: number; height: number };

/**
 * Largest centered crop of a source image that matches the target aspect ratio.
 * Pure geometry — feed this to sharp.extract(). No pixels are scaled here, so
 * the crop itself is lossless; downscaling to the final size happens after.
 */
export function centerCrop(srcWidth: number, srcHeight: number, targetAspect: number): CropRect {
  const srcAspect = srcWidth / srcHeight;
  let width: number;
  let height: number;
  if (srcAspect > targetAspect) {
    // Source too wide — crop the sides.
    height = srcHeight;
    width = Math.round(srcHeight * targetAspect);
  } else {
    // Source too tall — crop top/bottom.
    width = srcWidth;
    height = Math.round(srcWidth / targetAspect);
  }
  return { left: Math.round((srcWidth - width) / 2), top: Math.round((srcHeight - height) / 2), width, height };
}

/** Final output size: the target, but never larger than the cropped source (no upscaling). */
export function outputSize(cropWidth: number, cropHeight: number, spec: PlatformSpec): { width: number; height: number } {
  const scale = Math.min(1, spec.width / cropWidth, spec.height / cropHeight);
  return { width: Math.round(cropWidth * scale), height: Math.round(cropHeight * scale) };
}
