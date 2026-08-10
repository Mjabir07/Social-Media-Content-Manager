# Services and Engagements

**Status:** Service catalogue implemented; Service Engagement migration planned
**Last updated:** 2026-08-11

## Purpose

The Services catalogue is the commercial and automation entry point for agency work. A lead selects a sellable service; the service category and workflow route guide qualification, proposal creation, onboarding and the responsible delivery agent.

## Professional catalogue

The standard catalogue contains 62 offerings in six clear categories:

| Category | Scope |
| --- | --- |
| Digital Marketing & Branding | Brand strategy/identity, digital strategy, SMM setup and management, content, creative, video, SEO/local SEO, paid ads, email/WhatsApp marketing, reputation and analytics |
| Web & Application Development | Corporate/e-commerce websites, landing funnels, portals, web/mobile apps, SaaS, APIs, maintenance and optimization |
| AI & Business Automation | Discovery, workflows, AI agents, chat/voice assistants, CRM/document automation, n8n/Make/Zapier, RPA and managed automation support |
| Cloud, Hosting & Infrastructure | Web/email hosting, webmail, Google Workspace, Microsoft 365, VPS/cloud servers, migrations, domains, DNS/SSL/CDN, backups and DevOps |
| Managed IT & Cybersecurity | Managed support, helpdesk, networks, security assessment, endpoints, identity/access, monitoring and consulting |
| Business Software & CRM | CRM setup/migration, ERP integrations, BI dashboards, booking systems and training/handover |

Email hosting, webmail, VPS, cloud servers and web hosting are infrastructure services—not Digital Marketing services. They can still be bundled with website or marketing engagements.

## Catalogue installation

Owners/Admins select **Install agency catalogue** in `/azmin/services`. Installation is idempotent: existing names are retained and only missing services are created. Pricing is initially **Custom quote** so commercial rates can be approved before use.

## Lead and automation routing

1. Create a lead and select a categorized service.
2. The API validates that the service is active and belongs to the Workspace.
3. `LEAD_CREATED` receives `service`, `serviceCategory` and `serviceWorkflow` variables.
4. Automation recipes can use those variables for acknowledgement, qualification, assignment and checklist routing.
5. Qualification drafts the proposal; a won lead enters Client + Service Engagement onboarding.

The stable catalogue definitions and workflow keys are maintained in `src/lib/services-catalog.ts`. Custom services remain supported.

## Next implementation

- Persist a stable service code/workflow key rather than resolving canonical services by name.
- Support multi-service opportunities and proposal bundles.
- Create Service Engagement records on win and instantiate module-specific onboarding templates.
- Add service-specific SLAs, deliverables, dependencies, pricing packages and responsible agent profiles.

## Verification

- Catalogue install creates only missing services.
- Repeated install creates no duplicates.
- Lead service choices are grouped by category.
- Unknown or cross-Workspace service IDs are rejected.
- Automation receives service routing variables.
