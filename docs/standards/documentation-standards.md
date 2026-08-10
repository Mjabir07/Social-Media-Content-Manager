# Documentation Standards

Documentation must help a future developer or agent understand what exists, why it
exists, how to change it safely and how to verify it.

## Required before implementation

- Module specification
- Phase scope and exclusions
- User flow
- Permissions and approval rules
- Acceptance tests

Before an external provider is connected, add an integration specification,
permission review and revocation plan. Record important architectural choices as
Architecture Decision Records (ADRs).

## Writing rules

- Prefer short sections and tables.
- Define acronyms in the glossary.
- Separate current behavior from planned behavior.
- State exclusions explicitly.
- Link to sources of truth instead of duplicating them.
- Include concrete acceptance criteria.
- Use diagrams only when they clarify relationships or sequence.
- Never include secrets, private customer data or production credentials.

## Status labels

Use: `Proposed`, `Approved`, `In progress`, `Implemented`, `Deprecated`, or
`Superseded`.

## Change process

1. Update the specification.
2. Add/update an ADR if architecture changes.
3. Implement and test.
4. Update status and operating instructions.
5. Link code, migrations and tests in the pull request.

## Documentation-as-code definition of done

Every new module, screen, workflow, automation, integration, data model or
permission must update its documentation in the same change. The implementation
is incomplete until all applicable items below are true:

1. Create or update the module specification before implementation.
2. Record architectural/data-ownership changes in an ADR.
3. Update the relevant core workflow and permissions/approval table.
4. Document migrations, configuration, failure recovery and verification.
5. Update acceptance criteria from planned to implemented only after tests pass.
6. Never defer documentation to a separate undocumented future task.

Agents should apply this checklist automatically without waiting for an explicit
documentation request.

## Automated workflow documentation

- `docs/workflows/workflow-registry.json` is the structured workflow inventory.
- Run `npm run docs:generate` after changing the registry.
- `npm run docs:check` verifies the generated catalogue and checks mapped workflow code changes for corresponding documentation changes.
- The production build runs `docs:check`; stale or missing workflow documentation blocks deployment.
- Architectural ownership changes still require an ADR and cannot be satisfied only by editing the registry.

Files use lowercase kebab-case. ADRs use `NNNN-short-decision-name.md`.

