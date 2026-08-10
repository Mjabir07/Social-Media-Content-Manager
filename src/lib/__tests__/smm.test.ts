import { describe, expect, it } from "vitest";
import { looksLikeSmmService } from "@/lib/smm";

describe("SMM service detection", () => {
  it.each(["SMM", "Social Media Management", "Monthly social management", "Content Management"])('recognizes "%s"', (name) => {
    expect(looksLikeSmmService(name)).toBe(true);
  });

  it.each(["Website development", "SEO", "Google Workspace", null])('does not classify "%s" as SMM', (name) => {
    expect(looksLikeSmmService(name)).toBe(false);
  });
});
