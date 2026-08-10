# Module: Digital Marketing & Branding

**Status:** In progress  
**Owner:** AZMIN Digital  
**Last updated:** 2026-08-11

## Purpose

Deliver end-to-end marketing and brand services for a Client through one
service-scoped workspace. Social Media Management is one submodule alongside
brand, content, design, SEO/content marketing, paid media, lifecycle messaging,
reputation and analytics.

## Submodules

| Submodule | Scope |
| --- | --- |
| Brand Foundation | Brand intake, identity, voice, assets, audience and rules |
| Market Research & Strategy | Market, customer, competitor, positioning and KPIs |
| Campaign Management | Briefs, budgets, dates, channels, deliverables and approvals |
| Content & Creative Studio | Copy, posters, carousels, video, articles and variants |
| Social Media Management | Page setup/audit, calendar, publishing, engagement and analytics |
| SEO & Content Marketing | Keywords, briefs, on-page content, authority and measurement |
| Paid Media | Account readiness, campaigns, creative, budget, optimization and reporting |
| Email & Messaging Marketing | Lists, consent, sequences, templates, delivery and conversions |
| Reputation & Community | Reviews, mentions, responses, escalation and sentiment |
| Analytics & Reporting | Attribution, KPI reporting, insight and next-cycle optimization |

## Ownership model

- The Client is the commercial customer.
- A Digital Marketing & Branding Service Engagement owns the client-specific
  brief, brand context, platforms, deliverables, approvals and results.
- The agency Workspace owns reusable skills, templates, provider integrations and
  operating policies.
- An ordinary client is not automatically represented as a Company.

## End-to-end workflow

1. Convert a won lead into Client and Service Engagement.
2. Collect client brand, access, package, deliverables and approval contacts.
3. Assess current brand, channels, assets, analytics and competitors.
4. Research the market and retain approved sources.
5. Produce strategy, campaign plan, content mix, KPIs and delivery calendar.
6. Obtain approval before client-facing production or external changes.
7. Generate copy and creative assets with brand/platform quality checks.
8. Obtain content/design approval and publish through official integrations.
9. Manage engagement, leads and escalation under approved response rules.
10. Measure performance and feed verified learning into the next cycle.

## Automation rules

| Action | Default control |
| --- | --- |
| Research, audit, gap analysis and internal drafts | Automatic |
| Strategy, content and creative preparation | Automatic draft; approval before use |
| Profile changes, publishing, messaging and ad activation | Approval required |
| Unsupported platform setup | Guided manual with verification |
| Budget/payment/contract decisions | Manual only |

## Transitional implementation note

The current SMM code incorrectly requires a Company per Client. It remains usable
for testing but must be refactored before broader module expansion. The migration
must preserve Client, lead, work, finance, tasks and evidence while moving brand,
connections, posts and agent context to Client/Service Engagement ownership.

## Definition of done

- Every submodule follows the universal agent lifecycle.
- Every client-facing/external action has an explicit approval policy.
- Brand and delivery context cannot leak between clients or tenants.
- Every completed action has verification evidence and operating documentation.
- Workflow registry and generated catalogue are current.
