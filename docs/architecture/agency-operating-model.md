# Agency Operating Model

**Status:** Approved  
**Owner:** AZMIN Digital  
**Last updated:** 2026-08-11

## Product identity

AZMIN Digital OS is an AI-assisted agency operating CRM for selling and delivering
complete IT, digital, branding, development, infrastructure and automation
solutions. Social Media Management (SMM) is one delivery workflow inside Digital
Marketing & Branding; it is not the product's primary organizing model.

## Canonical hierarchy

```text
Platform
└── Workspace / Tenant (the agency using the CRM)
    ├── Agency Profile and optional operating contexts
    ├── Team, permissions, integrations and agent policies
    ├── Leads and sales pipeline
    ├── Clients (the agency's customers)
    │   ├── Contacts, commercial history and client knowledge
    │   └── Service engagements
    │       ├── Digital Marketing & Branding
    │       ├── Websites & Applications
    │       ├── AI & Workflow Automation
    │       ├── Infrastructure, Hosting & Domains
    │       ├── Email & Cloud Services
    │       ├── Managed IT & Support
    │       └── Monitoring, Reporting & Renewals
    └── Projects, tasks, finance, communications and audit evidence
```

## Entity meanings

| Entity | Meaning | Must not mean |
| --- | --- | --- |
| Workspace/Tenant | One agency/business operating its own isolated CRM | A client of that agency |
| Agency Profile | Identity and operating rules of the CRM owner | A separate client record |
| Operating Context/Company | Optional own brand, employer context, partner or joint venture | Every ordinary customer |
| Lead | A prospective customer/opportunity | A delivery workspace |
| Client | A customer buying one or more services | A tenant or operating company |
| Service Engagement | The contracted instance of a service for a client | Only a catalogue item |
| Project/Work | Delivery container, scope, tasks, cost and evidence | The client identity itself |
| Specialist Module | Reusable operating capability for a service category | A separate CRM product |
| Agent Run | Audited execution of assess/research/plan/act/verify work | Unrestricted production access |

## SaaS model

When AZMIN Digital OS is sold to another agency or business, that customer gets a
new isolated Workspace/Tenant. It manages its own team, leads, clients, service
engagements, credentials and agent runs. One tenant's clients never become
Companies or records inside another tenant.

## Universal service-delivery pattern

```text
Lead → Qualify → Quote → Won → Client → Service Engagement
     → Assess → Research → Plan → Approve → Execute
     → Verify → Document → Report → Invoice → Monitor/Renew
```

Every specialist module implements this pattern with category-specific steps,
integrations, approvals, evidence and reports.

## Data ownership rules

- Commercial data belongs to the Client and Service Engagement.
- Client-specific brand and delivery knowledge belongs to the Client/Engagement.
- Agency-wide identity and operating rules belong to the Workspace/Agency Profile.
- Optional Company contexts are used only for genuinely separate operating
  brands, employers, partners or joint ventures.
- Credentials are secret references, never copied into plans, tasks or evidence.
- Every external, financial, production or client-facing action is approval-scoped.

## Current correction required

The first SMM implementation links every SMM client to a Company. That behavior is
now classified as transitional technical debt. The target relationship is:

`Client → Service Engagement → Digital Marketing & Branding Workspace → SMM workflow`

Future implementation must stop creating a Company per client and migrate client
brand knowledge into client/service-scoped records. See superseded ADR 0002 and
the Digital Marketing & Branding module specification.
