import {
  generateCompanyEnrichmentFromWebSearch,
  researchCompanyWebsite,
} from "../src/lib/ai/company-enrichment";

const website = process.argv[2];
const companyName = process.argv.slice(3).join(" ") || website;
if (!website) {
  throw new Error("Usage: npx tsx scripts/verify-company-enrichment.ts <website> [company name]");
}

async function main() {
  try {
    const sources = await researchCompanyWebsite(website);
    console.log(JSON.stringify({
      method: "company_website",
      sources: sources.map((source) => ({
        url: source.url,
        title: source.title,
        characters: source.text.length,
      })),
    }, null, 2));
    return;
  } catch (error) {
    console.warn("Direct crawl unavailable; testing cited web-search fallback.");
    if (error instanceof Error) console.warn(error.message);
  }

  const result = await generateCompanyEnrichmentFromWebSearch({
    companyName,
    website,
  });
  console.log(JSON.stringify({
    method: "anthropic_web_search",
    confidence: result.draft.confidence,
    sources: result.sources,
    populatedFields: Object.entries(result.draft)
      .filter(([key, value]) => key !== "confidence" && (Array.isArray(value) ? value.length : Boolean(value)))
      .map(([key]) => key),
  }, null, 2));
}

void main();