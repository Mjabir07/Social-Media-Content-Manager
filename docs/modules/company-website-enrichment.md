# Company Website Enrichment

**Status:** Implemented - AI provider configuration required  
**Roadmap:** Phase 1 - Multi-company foundation  
**Increment:** 04

## Purpose

Reduce manual company onboarding. The owner supplies a public website and AZMIN
prepares an editable Brand Profile and Company Brain draft.

## User workflow

1. Create or open a company.
2. Add its public website in Company Overview.
3. Select **Analyze website with AI**.
4. Review the research method, confidence, and source links.
5. Edit any generated Brand Profile or Company Brain field.
6. Select **Save company**. Research never saves automatically.

## Provider sequence

1. AZMIN attempts a low-cost direct crawl of the homepage and up to three relevant
   same-domain pages.
2. If direct extraction fails and Tavily is enabled, Tavily supplies public,
   source-backed website results.
3. The validated generation chain is Gemini, Groq, Cloudflare Workers AI,
   OpenRouter, then Anthropic.
4. If no extracted evidence exists, Gemini or Anthropic grounded web search is
   attempted when enabled.
5. Failed providers receive a short cooldown; users see a friendly retry message
   only after all enabled options are unavailable.

## Generated draft fields

- Tagline
- Brand voice
- Target audiences
- Services and offerings
- Differentiators
- Content rules
- Approved company facts
- Sales guidance
- Content guidance
- AI operating instructions
- Confidence level

## Privacy and approval

- External AI research receives only public company name, domain, industry, and
  public webpage text.
- AZMIN relationship type and private owner description are excluded.
- Website content is treated as untrusted evidence, never as instructions.
- AI output is schema-validated before reaching editable fields.
- The user must review and explicitly save the draft.
- Generated strategy is labelled as recommendation rather than company fact.

## Website-fetching safeguards

- HTTP and HTTPS only.
- Credentials in URLs are rejected.
- Local, private, reserved, and metadata-service IP ranges are blocked.
- Every redirect is resolved and checked again.
- Maximum three redirects.
- HTML responses only.
- Per-page size and timeout limits.
- Script, style, SVG, template, and hidden executable content is removed.
- Only relevant same-origin pages are followed.

## Configuration

Preferred setup is the owner-only API Vault at `/azmin/settings/integrations`.
Credentials stored there are encrypted and can be enabled or disabled separately.
Environment-level Gemini and Anthropic keys remain supported during migration.
Optional model overrides are `GEMINI_MODEL`, `GROQ_MODEL`, `CLOUDFLARE_MODEL`,
`OPENROUTER_MODEL`, and `ANTHROPIC_MODEL`.

A consumer subscription such as Gemini Advanced does not automatically include
Google AI API quota. Create a separate developer API key and confirm its quota.

## Known test result

`https://graceitcompany.com/` returns HTTP 409 to ordinary server requests.
The direct crawler rejects that response and selects the cited web-search fallback.
Tavily or grounded web search can recover when the direct site rejects server requests.

## Related files

- `src/lib/ai/company-enrichment.ts`
- `src/app/api/companies/[id]/enrich/route.ts`
- `src/components/azmin/company-workspace.tsx`
- `scripts/verify-company-enrichment.ts`
