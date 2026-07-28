# Integration Catalogue

All providers use adapters with a common lifecycle: connect, verify, limit scope,
monitor, rotate/revoke and disconnect.

| Category | Initial provider/approach | Purpose | Write risk |
| --- | --- | --- | --- |
| Source control | GitHub App | Repositories, branches, PRs, checks | High |
| Deployment | Vercel API/Git | Previews, logs, production | High |
| Application API Vault | AES-256-GCM + environment master key | Owner-managed provider credentials | Critical |
| Infrastructure secrets | Infisical (future) | Environment sync and automated rotation | Critical |
| Database | Neon/PostgreSQL | Application data and migrations | Critical |
| Object storage | Cloudflare R2/S3 | Documents and media | High |
| Automation | Activepieces | Business workflows | High |
| Social publishing | Postiz/official APIs | Scheduling and publishing | High |
| WhatsApp | Meta Cloud API | Approved business messaging | High |
| Email delivery | Resend initially | Transactional messages | High |
| Business email | Google, Microsoft, Zoho | Tenant/service management | Critical |
| Monitoring | AZMIN Pulse | Uptime, alerts and incidents | Medium |
| AI coding | Codex first | Development tasks and review | High |
| AI coding | Claude Code later | Alternative agent | High |
| AI coding | Antigravity later | Optional agent platform | High |
| Local AI | Approved local runtime | Low-cost internal tasks | Medium |

## Integration requirements

Every integration specification documents:

- Business purpose and company/project scope
- Authentication and requested permissions
- Read/write operations and webhooks
- Rate limits and provider costs
- Error, retry and reconciliation policy
- Audit fields
- Disconnect and cleanup behavior
- Test/sandbox environment
- Owner and rotation/renewal dates

Use [the integration template](../templates/integration-spec-template.md).

AZMIN records provider-neutral concepts. Provider IDs and necessary metadata stay
behind adapters so core workflows remain stable when a provider changes.


## Implemented foundation

- [Integrations & API Vault](../modules/integrations-api-vault.md): owner-only encrypted credentials for Gemini, Groq, Cloudflare Workers AI, OpenRouter, Anthropic, Tavily, Firecrawl, and Apify.
- [AI Provider Router](../modules/ai-provider-router.md): schema-validated, privacy-scoped automatic failover for public company enrichment.
