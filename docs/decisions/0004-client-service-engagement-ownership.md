# ADR 0004: Client and Service Engagement Own Agency Delivery

**Status:** Approved  
**Date:** 2026-08-11

## Context

The first SMM implementation treated `Company` as both customer and isolated brand context. In the agency CRM, however, customers already belong in `Client`. Creating a Company for every client confuses agency operations, makes cross-service delivery harder, and prevents Company from representing genuine operating contexts such as AZMIN, an employer, partner or joint venture.

## Decision

All agency delivery is owned commercially by a `Client` and operationally by a `Service Engagement`. Service modules attach their domain records to that engagement. A Workspace/Tenant isolates each CRM buyer and their data.

`Company` is renamed or redefined as an optional `Operating Context`. It must never be auto-created merely because a client buys a service. Brand knowledge belongs to a Client Brain or engagement-scoped brand profile.

The SMM implementation will migrate from mandatory `Client + Company` ownership to `Client + Service Engagement`. Existing records will be preserved and mapped during migration.

## Consequences

- One client can buy and manage many services without duplicate identities.
- Every service uses a consistent sales-to-delivery-to-finance lifecycle.
- SaaS buyers receive isolated Workspaces and manage their own clients.
- Existing SMM Company links are transitional technical debt.
- Schema, UI labels, onboarding actions and tests must be migrated in a controlled phase.
