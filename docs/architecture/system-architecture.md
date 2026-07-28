# System Architecture

## Architectural model

AZMIN OS is the business control plane. Specialist systems continue to own the
technical data they are designed to manage.

| Responsibility | Source of truth |
| --- | --- |
| Companies, projects, tasks, services and finance | AZMIN PostgreSQL database |
| Source code and history | GitHub |
| Local/agent execution | Temporary Git worktree or isolated cloud workspace |
| Production and preview deployments | Vercel or configured hosting provider |
| Application data | Project-specific managed database |
| Secrets and credentials | Infisical or another approved secrets manager |
| Client documents and media | S3-compatible object storage |
| Social publishing | Approved publishing provider/official APIs |
| Monitoring telemetry | AZMIN Pulse and connected monitoring providers |

AZMIN stores provider IDs, metadata and audit records. It does not copy complete
repositories or raw credentials into its relational database.

## Tenant and company hierarchy

```text
Platform
└── Tenant (AZMIN initially; SaaS customer later)
    ├── Headquarters workspace
    └── Companies
        ├── Own brand
        ├── Client
        ├── Partner
        └── Joint venture
```

All business records carry a `tenantId`. Company-owned records also carry a
`companyId`. Authorization must enforce these boundaries on the server, not only
hide information in the interface.

## Core entities

- Tenant, User and Membership
- Company, CompanyRelationship and BrandProfile
- KnowledgeSource, SkillDefinition and AgentProfile
- ClientService, Lead, Deal and PartnershipAgreement
- CommissionRecord, Project and Task
- DevelopmentProject, RepositoryConnection and DeploymentTarget
- DatabaseResource, InfrastructureResource, DomainResource and EmailService
- Subscription, Invoice, Payment, Expense and Renewal
- ContentAsset, AutomationRun, AgentRun and ApprovalRequest
- SecretReference and AuditEvent

## Company Brain

Every company has an isolated Company Brain containing company facts, services,
pricing, audiences, brand voice, brand assets, sales guidance, approved reference
documents, content examples and company-specific skills.

Company Brain retrieval must always be scoped by both tenant and company.

## Agent architecture

The Agent Orchestrator selects an agent adapter, provides the minimum required
context and records the result in a common format. Adapter targets may include
Codex, Claude Code, Antigravity and local models.

Each run records its objective, context, skill version, tools, permissions,
actions, verification evidence, cost, duration, status and required next action.

## Environment separation

Every development project supports Local, Development, Preview/Staging and
Production environments. Credentials, databases and deployments remain separate.
Production writes, migrations, merges and deployments require explicit approval.

