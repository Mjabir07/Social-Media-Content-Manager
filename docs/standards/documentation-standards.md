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

Files use lowercase kebab-case. ADRs use `NNNN-short-decision-name.md`.

