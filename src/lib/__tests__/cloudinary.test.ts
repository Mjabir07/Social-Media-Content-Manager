import { describe, expect, it } from "vitest";
import { buildVariantUrl, parseCloudinaryConfig, platformVariants } from "@/lib/cloudinary-url";
import { PLATFORM_MEDIA_SPECS } from "@/lib/media-specs";

describe("cloudinary config", () => {
  it("parses cloudName:apiKey:apiSecret (secret may contain colons)", () => {
    expect(parseCloudinaryConfig("mycloud:123:abc:def")).toEqual({ cloudName: "mycloud", apiKey: "123", apiSecret: "abc:def" });
    expect(parseCloudinaryConfig("bad")).toBeNull();
    expect(parseCloudinaryConfig("only:two")).toBeNull();
  });
});

describe("variant URLs", () => {
  it("builds a crop+scale transform URL for a spec", () => {
    const spec = PLATFORM_MEDIA_SPECS.find((s) => s.platform === "INSTAGRAM" && s.format === "REEL")!;
    expect(buildVariantUrl("mycloud", "azmin/pic", "image", spec)).toBe(
      "https://res.cloudinary.com/mycloud/image/upload/c_fill,g_auto,w_1080,h_1920,q_auto,f_auto/azmin/pic",
    );
  });

  it("maps every spec to a URL for video too", () => {
    const specs = PLATFORM_MEDIA_SPECS.filter((s) => s.platform === "YOUTUBE");
    const variants = platformVariants("c", "vid1", "video", specs);
    expect(variants).toHaveLength(specs.length);
    expect(variants[0].url).toContain("/video/upload/");
  });
});
