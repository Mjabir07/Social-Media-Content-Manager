# Implementation Roadmap

## Delivery rule

Only one phase is active at a time. Each phase must be useful on its own, tested
with real AZMIN workflows and approved before the next phase begins.

**Specify → Design → Build → Test → Use internally → Correct → Approve → Document**

## Phase 0 — Stabilize and document

- Repair reproducible local dependency installation
- Pass typecheck, lint, unit tests and production build
- Verify production configuration
- Establish the documentation system
- Record current MVP capabilities and technical debt

Exit gate: a clean checkout can be installed, tested and built from documented steps.

## Phase 1 — Multi-company foundation

- AZMIN headquarters workspace
- Company management and relationship types
- Workspace/company switcher
- Strict tenant/company isolation
- Company Brand Profile and Brain
- Skills and agent profiles
- Owner overview dashboard

Exit gate: create AZMIN plus two companies and prove no cross-company data or AI
context leakage.

## Phase 2 — Services, CRM and partnerships

- Universal service catalogue
- Leads and sales pipeline
- Partnership agreements and lead attribution
- Deal values and commission rules
- Commission earned, paid and outstanding

Exit gate: capture a partner lead, close it, record payment and calculate a partial
commission settlement correctly.

## Phase 3 — Projects and recurring operations

- Projects, milestones and tasks
- Reusable project templates
- Recurring tasks, deliverables and approvals
- Files, notes and activity history
- Daily owner briefing

Exit gate: complete one AZMIN internal project through the full workflow.

## Phase 4 — Finance and renewals

- Quotes, invoices, payments and expenses
- Recurring billing records
- Profitability by company/service/project
- Domain, hosting, email and licence renewals
- Reminder and escalation workflows

Exit gate: reconcile one month of AZMIN service revenue, costs, commission income
and outstanding balances.

## Phase 5 — Development Studio

- Development-project records
- GitHub App integration
- Repository and branch tracking
- Vercel projects, previews, logs and deployments
- Database and environment inventory
- Infisical secret references
- First coding-agent adapter
- Tests, screenshots and approval evidence

Exit gate: an agent completes a small AZMIN feature on an isolated branch, produces
a passing preview and deploys only after approval.

## Phase 6 — Infrastructure, email and AZMIN Pulse

- Domains, DNS, hosting, SSL and backup tracking
- Google Workspace, Microsoft 365, Zoho and hosted-email service records
- AZMIN Pulse customer/subscription linkage
- Health, incident and renewal dashboards

Exit gate: track one real domain, host, email service and Pulse subscription from
activation through renewal.

## Phase 7 — Marketing and content automation

- Company campaigns, content pillars and monthly plans
- Copy, design, image and video workflows
- Approval portal, calendar and performance reporting

Exit gate: produce and approve a complete multi-platform campaign for AZMIN.

## Phase 8 — Publishing and communications

- Official social-platform/Postiz integration
- Multi-channel scheduling, publishing and retries
- Email automation and official WhatsApp Cloud API
- Delivery status and failure alerts

Exit gate: publish approved content and send an approved communication with a full
audit trail.

## Phase 9 — SaaS commercialization

- Tenant onboarding, plans and entitlements
- Usage metering and SaaS billing
- Platform Admin dashboard
- Support access controls
- Data export, suspension and deletion
- Operational/security readiness review

Exit gate: onboard a test tenant with isolated data, controlled entitlements and
accurate usage/billing records.

## Definition of done for every phase

- [ ] Scope and exclusions documented
- [ ] User flows approved
- [ ] Permissions enforced server-side
- [ ] Unit, integration and relevant end-to-end tests pass
- [ ] Mobile and desktop UX reviewed
- [ ] Dashboard/reporting needs addressed
- [ ] Security, isolation and audit behavior verified
- [ ] Error, empty and loading states implemented
- [ ] Documentation and decision records updated
- [ ] Real AZMIN workflow used successfully

