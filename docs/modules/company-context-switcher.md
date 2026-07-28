# Active Company Context

**Status:** Implemented  
**Roadmap:** Phase 1 - Multi-company foundation  
**Increment:** 03

## Purpose

Give every AZMIN screen a persisted and server-validated company context. The
selected company controls what the command center identifies as active and which
Company Brain future agents must use.

## Security model

- The browser stores only an opaque company ID in an HTTP-only, SameSite cookie.
- The company-context API accepts authenticated workspace members only.
- Before saving context, the server verifies both company ID and workspace ID.
- Archived companies cannot become active.
- Company detail reads and updates independently verify company ID and workspace ID.

## Included

- A persisted active-company cookie lasting up to one year.
- A real sidebar company switcher with loading and error states.
- Headquarters fallback when no valid selection exists.
- A real "Use this company" action in each company workspace.
- New companies automatically become active after creation.
- Company-specific command-center naming and Company Brain briefing.
- Non-HQ companies receive an isolated empty content dashboard.
- AZMIN HQ keeps the existing legacy workspace content during migration.
- Owner/Admin company, Brand Profile, and Company Brain editing.
- Clear update and activation success feedback.

## Legacy content boundary

Existing MediaAsset records belong to the original workspace model and do not yet
have a company ID. To prevent leakage, they are shown only while AZMIN HQ is active.
Client and partner contexts show zero content until the content ownership migration
adds company IDs and assigns every record explicitly.

## Workflow

1. Authentication resolves the current workspace.
2. The server loads non-archived companies in that workspace.
3. The active ID is resolved from the protected cookie, then headquarters, then
   the first available company.
4. Switching calls the protected company-context endpoint.
5. The server validates tenant ownership and writes the cookie.
6. The command center refreshes using the selected company.
7. Company workspace edits continue through the tenant-scoped company API.

## Manual test

1. Open `/azmin/companies`.
2. Open AZMIN Digital or create a test client.
3. Change Company name, Industry, Website, and Business description.
4. Select Brand profile and update Tagline and Brand voice.
5. Select Company Brain and add approved facts and AI instructions.
6. Select Save company and confirm the success message.
7. Select Use this company if it is not already active.
8. Return to `/azmin` and confirm the sidebar, heading, AI briefing, and footer use
   the selected company.
9. For a non-HQ company, confirm AZMIN legacy content is not displayed.

## Not included yet

- Adding company ownership to legacy and future content records.
- Company-scoped projects, leads, services, invoices, and commissions.
- Agent execution or retrieval using the Company Brain.
- End-to-end browser isolation tests with three companies.

## Related documentation

- [Phase 1 roadmap](../roadmap/phase-01-multi-company-foundation.md)
- [Companies and Company Brain](companies-and-company-brain.md)
- [Core workflows](../architecture/core-workflows.md)