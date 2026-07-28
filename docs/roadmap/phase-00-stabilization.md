# Phase 00: Stabilization and Documentation

**Status:** In progress  
**Owner:** AZMIN Digital  
**Started:** 2026-07-27

## Outcome

Produce a stable, reproducible baseline for the current Social Media Content
Manager before changing its data model into AZMIN Digital OS.

## Included

- Documentation foundation
- Current-state technical audit
- Reproducible dependency installation
- Typecheck, lint, unit test and production-build recovery
- Environment-variable review
- Production configuration checklist
- Current feature and technical-debt inventory
- Phase 1 specification

## Not included

- New multi-company database models
- UI rebranding
- New CRM, finance or agent functionality
- Production credential changes
- External provider installation

## Known baseline observations

- The live application is reachable and redirects unauthenticated users to login.
- The repository contains Prisma migrations, unit tests and Playwright tests.
- The local Windows `node_modules/.bin` command shims are damaged/zero-byte, so
  quality commands cannot currently execute reliably.
- `package-lock.json` already had local platform-related changes before the
  documentation work and must not be overwritten without review.
- Production email sending is currently a placeholder rather than a completed
  provider integration.

## Deliverables

- [x] Master documentation index
- [x] Vision, architecture, modules and roadmap
- [x] Workflow, security, integration, dashboard and SaaS references
- [x] Reusable documentation templates
- [ ] Repair clean dependency installation
- [ ] Run and record typecheck results
- [ ] Run and record lint results
- [ ] Run and record unit test results
- [ ] Run and record production build results
- [ ] Run authenticated staging smoke tests
- [ ] Document current feature inventory and technical debt
- [ ] Create and approve Phase 1 module specifications

## Verification

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] Relevant Playwright tests
- [ ] Documentation links checked
- [ ] No secrets added to tracked files
- [ ] Existing user changes preserved

## Exit decision

Phase 1 begins only when the baseline builds reliably and the multi-company
foundation specification is approved.

