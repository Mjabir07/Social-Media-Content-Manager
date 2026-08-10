# Module: Social Media Management

**Status:** In progress; ownership refactor required
**Parent module:** Digital Marketing & Branding
**Last updated:** 2026-08-11

## Purpose

SMM manages social-channel setup, optimization, strategy, content, creative production, approvals, publishing, engagement and performance improvement. It is not the product boundary and must not own the client relationship.

## Correct ownership

- Workspace/Tenant isolates the CRM owner.
- Client is the customer receiving the service.
- Service Engagement records the purchased Digital Marketing & Branding/SMM scope.
- The SMM workspace contains channel, campaign, content and performance state.
- Client Brain supplies approved brand facts and instructions.
- Company/Operating Context is optional and is not created for every client.

Target relationship:

`Workspace -> Client -> Service Engagement -> Digital Marketing & Branding -> SMM`

## End-to-end workflow

1. Convert a won lead into a Client and SMM Service Engagement, or onboard an existing Client.
2. Assess current brand, pages, access, competitors and performance.
3. Research audience, channels, competitors, trends and platform requirements.
4. Build the brand/page setup, optimization and content strategy plan.
5. Obtain approval for strategy, channels, cadence, creative direction and publishing policy.
6. Create or optimize pages, content pillars, campaigns, calendar, copy and creative assets.
7. Run QA for brand, platform, accessibility, links and compliance.
8. Approve, schedule and publish through official integrations.
9. Monitor comments, messages, failures and performance.
10. Report results and recommend the next optimization cycle.

## Automation policy

Research, audits, draft plans, briefs, captions, creative variants, calendar suggestions, QA and reporting can be automated. Page ownership changes, external publishing, ad spend and sensitive replies require policy-based approval. Every agent run keeps sources, plan, approvals, evidence and results.

## Current implementation and migration debt

The current Phase 1 implementation creates or reuses a `Company` and links it through `SmmWorkspace`. That behavior reflects the superseded design in ADR 0002 and must be migrated without data loss. Until migration is complete, it is transitional compatibility behavior—not the target domain model.

The delivery-agent run, readiness, task, approval and evidence concepts remain valid. Their ownership must move from mandatory Company linkage to Client + Service Engagement.

## Acceptance direction

- [x] Won leads and existing clients can enter SMM onboarding.
- [x] Delivery Agent runs retain plans, tasks, approvals and evidence.
- [x] Publishing remains approval-controlled.
- [ ] Stop automatically creating a Company for a client.
- [ ] Add Service Engagement ownership to SMM delivery.
- [ ] Move brand context to Client Brain or engagement-scoped brand profiles.
- [ ] Support page setup, optimization, creative production and full campaign operations.
- [ ] Add official channel connections, publishing, monitoring and analytics.

See [Digital Marketing & Branding](digital-marketing-and-branding.md), [Agency Service Delivery](../workflows/agency-service-delivery.md), and [ADR 0004](../decisions/0004-client-service-engagement-ownership.md).
