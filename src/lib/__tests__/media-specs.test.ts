import { describe, expect, it } from "vitest";
import { aspectRatio, centerCrop, outputSize, specsForPlatforms, PLATFORM_MEDIA_SPECS } from "@/lib/media-specs";

describe("platform specs", () => {
  it("returns specs for the chosen platforms and can filter by format", () => {
    const all = specsForPlatforms(["INSTAGRAM", "LINKEDIN"]);
    expect(all.some((s) => s.platform === "INSTAGRAM")).toBe(true);
    expect(all.some((s) => s.platform === "LINKEDIN")).toBe(true);
    expect(all.some((s) => s.platform === "YOUTUBE")).toBe(false);

    const reels = specsForPlatforms(["INSTAGRAM", "YOUTUBE"], "REEL");
    expect(reels.every((s) => s.format === "REEL")).toBe(true);
  });

  it("covers the requested platforms", () => {
    const platforms = new Set(PLATFORM_MEDIA_SPECS.map((s) => s.platform));
    for (const p of ["INSTAGRAM", "FACEBOOK", "LINKEDIN", "YOUTUBE"]) expect(platforms.has(p)).toBe(true);
  });
});

describe("quality-preserving geometry", () => {
  it("center-crops a wide source to a vertical 9:16 without scaling", () => {
    const crop = centerCrop(1920, 1080, aspectRatio("9:16"));
    expect(crop).toEqual({ left: 656, top: 0, width: 608, height: 1080 });
  });

  it("center-crops a tall source to 16:9 by trimming top/bottom", () => {
    const crop = centerCrop(1080, 1920, aspectRatio("16:9"));
    expect(crop.width).toBe(1080);
    expect(crop.height).toBe(608);
  });

  it("never upscales — small crop keeps its size", () => {
    const spec = PLATFORM_MEDIA_SPECS.find((s) => s.platform === "INSTAGRAM" && s.format === "REEL")!;
    expect(outputSize(608, 1080, spec)).toEqual({ width: 608, height: 1080 });
  });

  it("downscales a large crop to fit the target", () => {
    const spec = PLATFORM_MEDIA_SPECS.find((s) => s.platform === "INSTAGRAM" && s.format === "REEL")!; // 1080x1920
    expect(outputSize(2160, 3840, spec)).toEqual({ width: 1080, height: 1920 });
  });
});
