# Phase 01: AZMIN Multi-Company Foundation

**Status:** In progress - Company website enrichment increment 04 implemented
**Owner:** AZMIN Digital

## Outcome

Deliver the first AZMIN-branded foundation where the owner can manage AZMIN and
separate client/partner companies without cross-company data leakage.

## Included

- AZMIN design system and application shell
- Tenant and company ownership model
- AZMIN headquarters workspace
- Company creation and relationship types
- Active-company switcher
- Brand Profile and Company Brain foundation
- Skill and agent-profile foundation
- Owner and company dashboard foundations
- Server-side access control and audit events
- Migration plan for current workspace/content data

## Not included

- Full CRM or commission calculation
- Invoicing and payments
- Development-agent execution
- Social publishing
- WhatsApp/email automation
- SaaS billing

## Required screens

| Screen | Purpose |
| --- | --- |
| AZMIN Home | Priorities, approvals and business summary |
| Companies | Add and manage own brands, clients and partners |
| Company Overview | Understand one company's services and activity |
| Brand Profile | Voice, identity, audiences, products and rules |
| Company Brain | Approved knowledge sources and retrieval status |
| Skills | Reusable AI skills and company-specific configuration |
| Settings | Tenant, user, security and company preferences |

## Simplicity requirements

- New company setup starts with five or fewer essential fields.
- Advanced fields appear after creation.
- Active company is visible on every company-scoped screen.
- One global quick-create action is available.
- Empty states explain the next useful action.
- Desktop and mobile layouts use the same workflow language.

## Acceptance criteria

- [ ] AZMIN branding replaces MediaChat branding in the new shell.
- [ ] AZMIN HQ and at least two companies can be created.
- [ ] Switching companies changes all scoped data and AI context.
- [ ] Direct API requests cannot cross company or tenant boundaries.
- [ ] Every Company Brain retrieval includes tenant/company filters.
- [ ] Owner dashboard can consolidate data without exposing it to company users.
- [ ] Existing content data has a documented migration path.
- [ ] Unit, integration and end-to-end isolation tests pass.

## Exit scenario

Create AZMIN Digital, a commission partner and a normal agency client. Configure a
different brand voice for each, switch between them and prove that dashboard data,
knowledge and AI instructions remain isolated.

