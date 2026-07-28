# AI Provider Router

**Status:** Implemented for company website enrichment

## Purpose

AZMIN automatically continues with another owner-enabled provider when an AI
service is unavailable, rate-limited, or returns an invalid Company Brain draft.
The user sees one helpful result or one friendly retry message instead of raw
provider errors.

## Routing order

For a company profile built from public website/search evidence:

1. Google Gemini
2. GroqCloud
3. Cloudflare Workers AI
4. OpenRouter free-model router
5. Anthropic Claude

Direct website extraction is preferred. Tavily Search is used when the official
site blocks direct extraction. Gemini or Anthropic grounded web search is the
last research fallback when no usable source text is available.

Every generated draft must pass the shared Company Brain schema. Invalid output
is treated as a failed attempt and the router continues to the next enabled
provider. A failed provider receives a 15-minute in-process cooldown.

## Privacy boundary

Enabling a credential in the owner-only API Vault authorizes AZMIN to send the
current task and public company evidence to that provider. Company Brain private
instructions, relationship terms, credentials, and unrelated tenant data are
not included in company website enrichment prompts.

## Provider setup links

| Provider | Key/account page | AZMIN value |
| --- | --- | --- |
| Google Gemini | https://aistudio.google.com/apikey | API key |
| GroqCloud | https://console.groq.com/keys | API key |
| Cloudflare Workers AI | https://developers.cloudflare.com/workers-ai/get-started/rest-api/ | `ACCOUNT_ID:API_TOKEN` |
| OpenRouter | https://openrouter.ai/settings/keys | API key |
| Anthropic Claude | https://platform.claude.com/settings/keys | API key |
| Tavily Search | https://app.tavily.com/ | API key |
| Firecrawl | https://www.firecrawl.dev/app/api-keys | API key |
| Apify | https://console.apify.com/account/integrations | API token |

Keys must be pasted directly into `/azmin/settings/integrations`. Never send
provider keys through chat, email, source control, or client records.

## Cost behavior

- Direct website extraction does not consume a search-provider credit.
- Tavily connection testing reads account usage and does not run a search.
- Free-tier providers still enforce daily/monthly rate limits.
- OpenRouter's free router can select different free models over time; schema
  validation protects AZMIN from accepting malformed responses.
- Provider billing and usage remain controlled in each provider account.
