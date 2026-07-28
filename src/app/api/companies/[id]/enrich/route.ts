import { z } from "zod";
import { getProviderSecret } from "@/lib/integrations/credentials";
import { guard } from "@/lib/api-guard";
import { prisma } from "@/lib/db";
import {
  generateCompanyEnrichment,
  generateCompanyEnrichmentFromWebSearch,
  researchCompanyWebsite,
  type CompanyEnrichmentDraft,
  type WebsiteSource,
} from "@/lib/ai/company-enrichment";
import {
  generateCompanyEnrichmentWithGemini,
  generateCompanyEnrichmentWithGeminiSearch,
} from "@/lib/ai/gemini-company-enrichment";
import {
  generateCompanyEnrichmentWithCloudflare,
  generateCompanyEnrichmentWithGroq,
  generateCompanyEnrichmentWithOpenRouter,
} from "@/lib/ai/openai-compatible-company-enrichment";
import { researchCompanyWithTavily } from "@/lib/ai/tavily-company-research";
import { runProviderChain } from "@/lib/ai/provider-router";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const requestSchema = z.object({
  website: z.string().trim().min(3).max(240),
});

const FRIENDLY_UNAVAILABLE =
  "AI services are temporarily busy. AZMIN kept your company data unchanged. Please retry shortly or check API Vault connection status.";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const g = await guard("ADMIN");
  if (!g.ok) return g.response;
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: "Enter a valid public company website." }, { status: 400 });
  }
  const { id } = await params;
  const company = await prisma.company.findFirst({
    where: { id, workspaceId: g.user.workspaceId, status: { not: "ARCHIVED" } },
    select: { id: true, name: true, industry: true },
  });
  if (!company) return new Response("Not found", { status: 404 });

  const [geminiStored, groq, cloudflare, openrouter, anthropicStored, tavily] =
    await Promise.all([
      getProviderSecret(g.user.workspaceId, "GEMINI"),
      getProviderSecret(g.user.workspaceId, "GROQ"),
      getProviderSecret(g.user.workspaceId, "CLOUDFLARE"),
      getProviderSecret(g.user.workspaceId, "OPENROUTER"),
      getProviderSecret(g.user.workspaceId, "ANTHROPIC"),
      getProviderSecret(g.user.workspaceId, "TAVILY"),
    ]);
  const gemini = geminiStored ?? process.env.GEMINI_API_KEY ?? null;
  const anthropic = anthropicStored ?? process.env.ANTHROPIC_API_KEY ?? null;
  if (!gemini && !groq && !cloudflare && !openrouter && !anthropic) {
    return Response.json(
      { error: "AI research is not configured. Add and enable at least one AI provider in API Vault." },
      { status: 503 },
    );
  }

  try {
    let sources: WebsiteSource[] = [];
    let researchMethod = "company_website";
    try {
      sources = await researchCompanyWebsite(parsed.data.website);
    } catch (error) {
      console.warn("Direct company website research unavailable", {
        message: error instanceof Error ? error.message : "Unknown website error",
      });
    }

    if (!sources.length && tavily) {
      try {
        sources = await researchCompanyWithTavily({
          companyName: company.name,
          website: parsed.data.website,
          apiKey: tavily,
        });
        if (sources.length) researchMethod = "tavily_search";
      } catch (error) {
        console.warn("Tavily company research unavailable", {
          message: error instanceof Error ? error.message : "Unknown Tavily error",
        });
      }
    }

    if (sources.length) {
      const common = {
        companyName: company.name,
        industry: company.industry,
        sources,
      };
      const attempts: Array<{ provider: string; run: () => Promise<CompanyEnrichmentDraft> }> = [];
      if (gemini) attempts.push({
        provider: "gemini",
        run: () => generateCompanyEnrichmentWithGemini({ ...common, apiKey: gemini }),
      });
      if (groq) attempts.push({
        provider: "groq",
        run: () => generateCompanyEnrichmentWithGroq({ ...common, apiKey: groq }),
      });
      if (cloudflare) attempts.push({
        provider: "cloudflare",
        run: () => generateCompanyEnrichmentWithCloudflare({ ...common, apiKey: cloudflare }),
      });
      if (openrouter) attempts.push({
        provider: "openrouter",
        run: () => generateCompanyEnrichmentWithOpenRouter({ ...common, apiKey: openrouter }),
      });
      if (anthropic) attempts.push({
        provider: "anthropic",
        run: () => generateCompanyEnrichment({ ...common, apiKey: anthropic }),
      });
      const result = await runProviderChain(attempts);
      return Response.json({
        draft: result.value,
        sources: sources.map(({ url, title }) => ({ url, title })),
        generatedAt: new Date().toISOString(),
        researchMethod,
        provider: result.provider,
        notice: result.failed.length
          ? `AI-generated draft. AZMIN automatically recovered using ${result.provider}. Review every field before saving.`
          : "AI-generated draft. Review every field before saving.",
      });
    }

    const searchAttempts: Array<{
      provider: string;
      run: () => Promise<{ draft: CompanyEnrichmentDraft; sources: Array<{ url: string; title: string }> }>;
    }> = [];
    if (gemini) searchAttempts.push({
      provider: "gemini",
      run: () => generateCompanyEnrichmentWithGeminiSearch({
        companyName: company.name,
        website: parsed.data.website,
        industry: company.industry,
        apiKey: gemini,
      }),
    });
    if (anthropic) searchAttempts.push({
      provider: "anthropic",
      run: () => generateCompanyEnrichmentFromWebSearch({
        companyName: company.name,
        website: parsed.data.website,
        industry: company.industry,
        apiKey: anthropic,
      }),
    });
    const fallback = await runProviderChain(searchAttempts);
    return Response.json({
      draft: fallback.value.draft,
      sources: fallback.value.sources,
      generatedAt: new Date().toISOString(),
      researchMethod: `${fallback.provider}_web_search`,
      provider: fallback.provider,
      notice: fallback.failed.length
        ? `AI-generated draft. AZMIN automatically recovered using ${fallback.provider}. Review every field before saving.`
        : "AI-generated draft. Review every field before saving.",
    });
  } catch (error) {
    console.error("Company website enrichment exhausted enabled providers", {
      message: error instanceof Error ? error.message : "Unknown enrichment error",
    });
    return Response.json({ error: FRIENDLY_UNAVAILABLE }, { status: 503 });
  }
}