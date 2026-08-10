# Implementation Roadmap

## Delivery rule

Each increment must be useful, tested with a real agency workflow, documented and approved before external or high-risk automation is activated.

`Specify -> Design -> Build -> Test -> Use internally -> Correct -> Approve -> Document`

## Phase 0 - Stabilize and document

- Reproducible install, tests and production build
- Canonical agency operating model and workflow registry
- Documentation generation and change checks in the build
- Current implementation and technical-debt inventory

## Phase 1 - Workspace, clients and service foundation

- Workspace/Tenant isolation
- AZMIN headquarters and optional operating contexts
- Clients, contacts and Client Brain
- Universal service catalogue and Service Engagement ownership
- Migrate the mistaken Company-per-client assumptions without data loss
- Owner command center, permissions and audit events

Exit gate: one Workspace can manage multiple clients and multiple services without cross-client leakage or duplicate customer identities.

## Phase 2 - CRM, sales and automated onboarding

- Leads, qualification, proposals, follow-ups and pipeline
- Won-lead conversion into Client + Service Engagement
- Service-specific onboarding checklists and agent plans
- Partnerships, attribution and commissions

## Phase 3 - Projects, tasks and agent operations

- Projects, milestones, recurring tasks and dependencies
- Universal agent loop, approvals, evidence and resumable runs
- Client approvals, files, notes and activity history
- Daily agency briefing and exception queue

## Phase 4 - Digital Marketing & Branding

- Brand foundation, research and strategy
- Campaigns, content, creative and asset workflows
- SMM page setup, optimization, publishing, engagement and analytics
- SEO, paid media, email/messaging and reputation workflows
- Approval portal, calendar, reporting and optimization cycles

## Phase 5 - Websites, applications and automation

- Requirements, specifications and delivery templates
- Git, coding agents, QA, previews and controlled deployments
- AI/workflow discovery, integration, testing and monitoring
- Handover, maintenance and support records

## Phase 6 - Infrastructure, cloud and managed services

- Domains, DNS, hosting, SSL, servers and backups
- Google Workspace, Microsoft 365, Zoho and hosted email
- Managed IT assets, tickets, incidents, SLAs and maintenance
- Health monitoring, alerts and operational runbooks

## Phase 7 - Finance, reporting and renewals

- Quotes, invoices, payments, expenses and profitability
- Recurring billing, renewals and escalation workflows
- Client, engagement, service and agency reporting
- Executive dashboards and automated client reports

## Phase 8 - SaaS commercialization

- Tenant onboarding, plans, entitlements and metering
- Billing, support controls, export, suspension and deletion
- Security and operational-readiness review

## Definition of done

- [ ] Scope, ownership, workflow and exclusions documented
- [ ] Permissions and approval policy enforced server-side
- [ ] Tests and relevant end-to-end scenarios pass
- [ ] Security, tenant/client isolation and audit behavior verified
- [ ] Error, empty, loading and recovery states implemented
- [ ] Workflow registry, module docs, ADRs and operating instructions updated
- [ ] Real AZMIN workflow completed successfully
