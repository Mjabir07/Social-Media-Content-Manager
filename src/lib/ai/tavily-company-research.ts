import "server-only";
import { normalizeWebsiteUrl, type WebsiteSource } from "@/lib/ai/company-enrichment";

type TavilyResponse = {
  results?: Array<{
    url?: string;
    title?: string;
    content?: string;
  }>;
};

export async function researchCompanyWithTavily(input: {
  companyName: string;
  website: string;
  apiKey: string;
}): Promise<WebsiteSource[]> {
  const website = normalizeWebsiteUrl(input.website);
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `site:${website.hostname} "${input.companyName}" company services about`,
      search_depth: "basic",
      max_results: 6,
      include_answer: false,
      include_raw_content: false,
      include_domains: [website.hostname],
    }),
    signal: AbortSignal.timeout(20_000),
    cache: "no-store",
  });
  if (!response.ok) {
    if (response.status === 429) throw new Error("Tavily quota is exhausted.");
    if (response.status === 401 || response.status === 403) {
      throw new Error("Tavily rejected its saved credential.");
    }
    throw new Error(`Tavily research returned HTTP ${response.status}.`);
  }

  const payload = (await response.json()) as TavilyResponse;
  const sources = new Map<string, WebsiteSource>();
  for (const result of payload.results ?? []) {
    if (!result.url || !result.content) continue;
    try {
      const url = new URL(result.url);
      if (!["http:", "https:"].includes(url.protocol)) continue;
      sources.set(url.toString(), {
        url: url.toString(),
        title: result.title?.trim() || url.hostname,
        text: result.content.trim().slice(0, 12_000),
      });
    } catch {
      // Ignore malformed provider result URLs.
    }
  }
  return [...sources.values()].filter((source) => source.text.length > 40);
}
