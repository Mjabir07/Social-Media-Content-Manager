# ADR 0001: Rebuild the MVP as AZMIN Digital OS

**Status:** Approved  
**Date:** 2026-07-27  
**Decision owner:** AZMIN Digital

## Context

The current Social Media Content Manager is a functional reference model. It proves
useful concepts such as authentication, roles, workspaces, content workflows,
uploads, approvals, dashboards and AI integration. It does not define the final
AZMIN brand, information architecture, visual design or product boundaries.

The target is a complete AI-integrated automation platform for operating digital
services, companies, partnerships, sales, projects, finance, marketing,
development, infrastructure, communications and AZMIN Pulse.

## Decision

Rebuild the product experience as **AZMIN Digital OS** under a new AZMIN design
system and modular business architecture.

Reuse existing code only when it is secure, tested and compatible with the target
architecture. Existing UI, naming and navigation may be replaced completely.

Use a modular monolith initially:

- One coherent Next.js application
- One primary PostgreSQL database with strict tenant/company ownership
- Clearly separated business modules
- Background workers for long-running automation
- Provider adapters for external systems
- A dedicated secrets manager for credentials
- Event/audit records connecting modules

Do not begin with distributed microservices. Extract a service only when scale,
security or operational isolation provides a demonstrated reason.

## Product boundary

AZMIN OS is the control plane and source of truth for business operations. GitHub,
Vercel, managed databases, object storage, secrets managers, social publishers,
email providers and monitoring systems continue to own their specialist data.

## Reuse policy

Classify existing functionality before reuse:

| Classification | Action |
| --- | --- |
| Proven and aligned | Reuse with tests |
| Useful but structurally limited | Refactor behind a new module boundary |
| Brand/UI specific | Redesign |
| Insecure, incomplete or misleading | Replace |
| No longer relevant | Remove after migration approval |

## Consequences

- The final interface can be fully AZMIN-branded and solution-focused.
- Existing implementation work remains valuable as tested reference material.
- Data migrations and compatibility must be planned before replacing current models.
- Modules will be delivered phase by phase, not as one large rewrite.
- Future SaaS tenancy remains an architectural requirement from Phase 1.

## Validation

This decision remains correct while the modular approach lets each phase deliver a
usable internal result without blocking the complete platform vision.

