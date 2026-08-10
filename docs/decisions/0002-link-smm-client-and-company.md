# ADR 0002: Link SMM Client and Company Context

**Status:** Superseded by ADR 0004
**Date:** 2026-08-10

## Context

> This decision documents the initial implementation. Its mandatory Client-to-Company mapping is no longer the target architecture.

`Client` is the commercial hub for work, finance and renewals. `Company` is the
isolated brand and AI context used by content, connections and publishing. SMM
requires both concepts, and a won lead may already reference either or both.

## Decision

Introduce `SmmWorkspace` as an explicit, tenant-owned one-to-one link between a
Client and Company, with an optional unique originating Lead. Keep Client and
Company responsibilities separate. Enforce unique database constraints and use
idempotent onboarding rather than copying fields between modules repeatedly.

Onboarding reuses the lead's Company first, then an unclaimed same-name Company,
then creates a Company with empty Brand Profile and Company Brain records.

## Consequences

- Finance/client operations and brand/content operations retain clear ownership.
- Repeated clicks and retried automations cannot duplicate an SMM account.
- A client can have one SMM operating context in Phase 1.
- Future multi-brand clients would require a deliberate superseding ADR and a
  one-to-many model rather than weakening current constraints silently.
