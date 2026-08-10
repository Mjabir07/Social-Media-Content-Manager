# System Architecture

## Architectural model

AZMIN Digital OS is the agency business control plane. Specialist systems retain
the technical data they are designed to manage.

| Responsibility | Source of truth |
| --- | --- |
| Agency, clients, engagements, projects, tasks, services and finance | AZMIN PostgreSQL database |
| Source code and history | GitHub |
| Local/agent execution | Temporary Git worktree or isolated cloud workspace |
| Production and preview deployments | Vercel or configured hosting provider |
| Application data | Project-specific managed database |
| Secrets and credentials | Encrypted API Vault/approved secrets manager |
| Client documents and media | S3-compatible object storage |
| Social publishing | Approved publishing provider/official APIs |
| Monitoring telemetry | AZMIN Pulse and connected monitoring providers |

AZMIN stores provider IDs, metadata and audit records. It does not copy complete
repositories or raw credentials into its relational database.

## Tenant, client and service hierarchy

```text
Platform
└── Workspace / Tenant (AZMIN initially; SaaS agency later)
    ├── Agency Profile and optional operating contexts
    ├── Leads and clients
    │   └── Service engagements
    │       └── Projects, tasks, evidence and renewals
    └── Team, integrations, agents, finance and audit
```

All business records carry a tenant/workspace boundary. Client delivery records
also carry a Client or Service Engagement boundary. Optional Company records are
reserved for own brands, employer contexts, partners and joint ventures. An
ordinary client must not automatically create a Company. Authorization enforces
these boundaries on the server.

## Core entities

- Workspace/Tenant, AgencyProfile, User and Membership
- Optional OperatingContext and BrandProfile
- Client, ClientKnowledge and ServiceEngagement
- Lead, Deal, Quote and PartnershipAgreement
- Project, Work, Task and ApprovalRequest
- AgentProfile, AgentRun, WorkflowRun and AuditEvent
- Campaign, ContentAsset, Conversation and PublishingTarget
- InfrastructureResource, DomainResource and EmailService
- Invoice, Payment, Expense, Subscription and Renewal
- SecretReference and ProviderConnection

## Agency and client knowledge

The agency has workspace-wide operating knowledge. Every client/service engagement
may have isolated client facts, requirements, brand voice, assets, audiences,
approved sources and delivery instructions. Retrieval is scoped by tenant plus
the applicable client/engagement. Optional operating-context knowledge remains
separately scoped.

## Agent architecture

The Agency Orchestrator selects a specialist agent, provides the minimum required
tenant/client/engagement context, assigns an approval policy and records the result.

Each run records objective, context, sources, workflow/skill version, tools,
permissions, actions, verification evidence, cost, duration, status and next action.

## Environment separation

Every development project supports Local, Development, Preview/Staging and
Production environments. Credentials, databases and deployments remain separate.
Production writes, migrations, merges and deployments require explicit approval.

See [Agency Operating Model](agency-operating-model.md).
