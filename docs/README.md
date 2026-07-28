# AZMIN Digital OS Documentation

This directory is the source of truth for planning and building **AZMIN Digital OS**.
The product begins as AZMIN Digital's internal operating system and is designed so it
can later be offered as a multi-tenant SaaS product.

The current application is a Social Media Content Manager MVP. The documents here
describe its planned evolution into a broader agency operating system.

## Start here

1. [Product vision and principles](product/vision.md)
2. [System architecture](architecture/system-architecture.md)
3. [Module catalogue](modules/module-catalogue.md)
4. [Implementation roadmap](roadmap/implementation-roadmap.md)
5. [Core workflows](workflows/core-workflows.md)
6. [Security and credentials](security/security-and-credentials.md)
7. [Integration catalogue](integrations/integration-catalogue.md)
8. [Dashboards and reporting](dashboards/dashboard-specification.md)
9. [SaaS readiness](saas/saas-readiness.md)
10. [Documentation standards](standards/documentation-standards.md)
11. [Glossary](glossary.md)

## Documentation structure

| Area | Purpose |
| --- | --- |
| `product/` | Product vision, users, principles and boundaries |
| `architecture/` | System boundaries, ownership and technical structure |
| `modules/` | One clear catalogue of business modules |
| `roadmap/` | Phases, sequence, acceptance gates and dependencies |
| `workflows/` | End-to-end business and automation flows |
| `security/` | Credentials, permissions, tenant isolation and approvals |
| `integrations/` | External providers and connection strategy |
| `dashboards/` | Owner, company and platform-admin reporting |
| `saas/` | Requirements for a future commercial SaaS product |
| `standards/` | Rules for maintaining useful documentation |
| `templates/` | Templates for new modules, phases and integrations |
| `decisions/` | Architecture Decision Records (ADRs) |

## How to use these documents

- Read the vision before proposing a major feature.
- Build only the current roadmap phase.
- Create a module specification from the module template before implementation.
- Create an integration specification before connecting an external provider.
- Record important technical decisions as ADRs.
- Update documentation in the same pull request as the related code.
- Do not place passwords, tokens, private keys or client secrets in documentation.

## Current status

| Item | Status |
| --- | --- |
| Current MVP | Social-media content management |
| Target product | AZMIN Digital OS |
| Current roadmap phase | Phase 1: multi-company foundation |
| SaaS availability | Future option; not yet offered |

