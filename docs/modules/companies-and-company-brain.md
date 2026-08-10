# Operating Context and Legacy Company Brain

**Status:** Implemented foundation; semantic migration required
**Last reviewed:** 2026-08-11

The existing `Company`, `BrandProfile` and `CompanyBrain` implementation provides tenant-scoped context, permissions and auditability. The original interpretation—creating a Company for every agency client—is superseded.

## Target use

Company will be renamed or presented as optional Operating Context for the CRM operator's own brand, employer, partner or joint venture. Ordinary customers are Clients. Client knowledge and brand instructions belong in Client Brain or an engagement-scoped brand profile.

## Existing routes

| Route | Current purpose | Migration direction |
| --- | --- | --- |
| `/azmin/companies` | Company directory | Operating-context directory |
| `/azmin/companies/[id]` | Company profile and brain | Operating-context workspace |
| `/api/companies` | Tenant-scoped CRUD | Preserve isolation; revise terminology and eligibility |

## Invariants to preserve

- Every query remains Workspace/Tenant scoped.
- Cross-tenant identifiers return no data.
- Mutations require server-side permissions and create audit events.
- Existing records are mapped and reconciled before old relationships are removed.

See [Agency Operating Model](../architecture/agency-operating-model.md) and [ADR 0004](../decisions/0004-client-service-engagement-ownership.md).
