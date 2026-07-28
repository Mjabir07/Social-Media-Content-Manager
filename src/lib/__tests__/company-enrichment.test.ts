import { describe, expect, it } from "vitest";
import {
  extractRelevantLinks,
  extractWebsiteText,
  isPrivateAddress,
  normalizeWebsiteUrl,
  parseCompanyEnrichmentJson,
} from "@/lib/ai/company-enrichment";

describe("company website enrichment", () => {
  it("normalizes public website domains and rejects unsupported URLs", () => {
    expect(normalizeWebsiteUrl("example.com/about").toString()).toBe(
      "https://example.com/about",
    );
    expect(() => normalizeWebsiteUrl("ftp://example.com")).toThrow(
      "Only public HTTP or HTTPS",
    );
    expect(() => normalizeWebsiteUrl("https://user:pass@example.com")).toThrow(
      "credentials",
    );
  });

  it("recognizes private and reserved network addresses", () => {
    expect(isPrivateAddress("127.0.0.1")).toBe(true);
    expect(isPrivateAddress("10.2.3.4")).toBe(true);
    expect(isPrivateAddress("192.168.1.2")).toBe(true);
    expect(isPrivateAddress("169.254.169.254")).toBe(true);
    expect(isPrivateAddress("::1")).toBe(true);
    expect(isPrivateAddress("8.8.8.8")).toBe(false);
  });

  it("extracts readable text without executable or hidden page content", () => {
    const html =
      "<html><title>ACME &amp; Co</title><script>ignore me</script><style>.x{}</style><body><h1>IT Services</h1><p>Cloud &amp; support</p></body></html>";
    expect(extractWebsiteText(html)).toBe("ACME & Co IT Services Cloud & support");
  });

  it("keeps only relevant same-origin company pages", () => {
    const links = extractRelevantLinks(
      '<a href="/about">About</a><a href="/services">Services</a><a href="/blog">Blog</a><a href="https://other.example/contact">External</a>',
      new URL("https://example.com"),
    );
    expect(links).toEqual([
      "https://example.com/about",
      "https://example.com/services",
    ]);
  });

  it("validates the AI response before it reaches editable company fields", () => {
    const draft = {
      tagline: "Reliable technology, clearly delivered.",
      brandVoice: "Professional and practical.",
      targetAudiences: ["Small businesses"],
      offerings: ["Managed IT support"],
      differentiators: ["Local support"],
      contentRules: "Avoid unsupported claims.",
      companyFacts: "The public site describes managed IT support.",
      salesGuidance: "Recommendation: qualify by team size.",
      contentGuidance: "Recommendation: explain service outcomes.",
      aiInstructions: "Use only approved facts.",
      confidence: "medium",
    };
    expect(parseCompanyEnrichmentJson("```json\n" + JSON.stringify(draft) + "\n```"))
      .toEqual(draft);
    expect(() => parseCompanyEnrichmentJson('{"tagline":"Incomplete"}')).toThrow();
  });
});
