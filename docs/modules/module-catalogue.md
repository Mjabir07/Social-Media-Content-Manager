# Module Catalogue

This catalogue defines the product modules. Detailed specifications are created
from [the module template](../templates/module-spec-template.md) only when a module
enters an active implementation phase.

| Module | Purpose | Initial priority |
| --- | --- | --- |
| Headquarters | Consolidated AZMIN command center | Foundation |
| Companies | Separate brands, clients and partners | Foundation |
| Company Brain | Isolated knowledge, brand voice and instructions | Foundation |
| Company Website Enrichment | Source-backed Brand Profile and Brain drafts | Foundation |
| Integrations & API Vault | Encrypted owner-managed provider credentials | Foundation |
| Skills and Agents | Reusable skills, agent profiles, runs and approvals | Foundation |
| Services | Universal catalogue of services sold or managed | High |
| CRM and Sales | Leads, pipeline, proposals and follow-ups | High |
| Partnerships | Agreements, lead attribution and commissions | High |
| Projects and Tasks | Delivery, milestones, recurring work and approvals | High |
| Finance | Quotes, invoices, payments, expenses and profitability | High |
| Renewals | Domains, hosting, email, licences and subscriptions | High |
| Content Studio | Planning, generation, assets and approvals | Existing MVP |
| Social Media Management | Multi-company onboarding, strategy, content, publishing and optimization | In progress |
| Development Studio | Git, coding agents, tests, previews and deployments | High |
| Infrastructure | Domains, DNS, hosting, servers, SSL and backups | Medium |
| Email Services | Google, Microsoft, Zoho and hosted email operations | Medium |
| Communications | Email and WhatsApp automation | Medium |
| AZMIN Pulse | SaaS subscriptions, monitors, alerts and customer health | Medium |
| Reports | Business, sales, project, finance and service reporting | Cross-cutting |
| Platform Admin | Tenants, plans, usage, health and support | Future SaaS |

## Universal service model

Every sold or managed service is represented by a `ClientService` with company,
category, package, billing method, internal cost, sale price, profit, dates,
status, project/provider links, credential references, documents, terms, recurring
tasks and automation rules.

Service categories include digital marketing, websites, applications, AI
automation, AZMIN Pulse, email, domains, hosting, servers and support.

## Development Studio scope

- Requirements and specifications
- Repository and branch tracking
- Local/cloud agent workspaces and dispatch
- Test, quality gate, pull request and review results
- Vercel preview and production deployments
- Database, migration, domain, monitoring and handover metadata

## AZMIN Pulse scope

- Customers, plans, trials, subscriptions and licences
- Monitored resources, usage limits, uptime, alerts and incidents
- Notification channels, support, versions and feature requests
- Renewals, revenue, customer health and churn risk

