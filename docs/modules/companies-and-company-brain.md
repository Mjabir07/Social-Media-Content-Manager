# Companies and Company Brain  Increment 01

**Status:** Implemented and locally verified  
**Phase:** 01  Multi-company foundation  
**Date:** 2026-07-28

## Delivered

- Tenant-scoped `Company`, `BrandProfile`, and `CompanyBrain` database models
- Additive PostgreSQL migration
- AZMIN Digital registered as the headquarters and first own-brand company
- Companies dashboard with counts and company cards
- Five-field company onboarding
- Relationship types: own brand, agency client, sales/commission partner, joint venture
- Company Overview, Brand Profile, and Company Brain editor
- Server-side OWNER/ADMIN mutation permissions
- Workspace-scoped reads and writes that return 404 for cross-tenant record IDs
- Audit events for company creation, updates, and Company Brain updates
- Automated tenant-isolation tests

## Routes

| Route | Purpose |
| --- | --- |
| `/azmin/companies` | Company directory and onboarding |
| `/azmin/companies/[id]` | Isolated company workspace |
| `/api/companies` | Scoped company list and creation |
| `/api/companies/[id]` | Scoped company, brand, and brain updates |

## Isolation rule

A company is never retrieved only by its ID. Every server query also requires the
authenticated user's `workspaceId`. Brand Profile and Company Brain are reachable
only through that already-scoped company.

## Verification

- Prisma migration deployed successfully
- Prisma schema validation passed
- TypeScript passed
- ESLint passed
- 55 unit tests passed
- Production build passed
- Local preview restored on port 3001

## Remaining Phase 01 work

- Persistent active-company selector shared by every company-scoped module
- Company-scoped content migration and filtering
- Knowledge source upload/retrieval records
- Reusable skills and company-specific skill configuration
- Company membership/access assignments
- End-to-end browser isolation scenario using AZMIN plus two test companies
