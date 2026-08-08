# Phase 05: AZMIN Development Studio

**Status:** In progress - Development projects and repository/branch tracking (increment 01) implemented
**Owner:** AZMIN Digital

## Outcome

Give the owner one home for software/build work: a record per development project
(internal or per client) with its repositories and tracked branches, ready for the
deployment, environment and coding-agent layers that follow.

## Included

- Development-project records (workspace-scoped, company-optional, soft-deleted)
- Repository and branch tracking per project
- Development studio screen wired into the AZMIN shell
- Server-side role enforcement on all writes

## Not included (later increments)

- GitHub App integration and live repository sync
- Vercel/Coolify projects, previews, logs and deployments
- Database and environment inventory
- Infisical secret references
- Coding-agent adapter and approval evidence

## Increments

| # | Scope | Status |
| --- | --- | --- |
| 01 | Dev projects + repositories + branch tracking | Implemented |
| 02 | Deployment targets and environment inventory | Planned |
| 03 | GitHub App sync (repositories, branches, commits) | Planned |
| 04 | First coding-agent adapter + approval evidence | Planned |

## Required screens

| Screen | Purpose |
| --- | --- |
| Development studio | List dev projects, their repositories and tracked branches; create and manage them |

## Data model

- `DevProject` — id, workspaceId, companyId?, createdById?, name, description?, status
  (`PLANNING` / `ACTIVE` / `MAINTENANCE` / `ARCHIVED`), productionUrl?, order, timestamps, deletedAt?
- `Repository` — id, workspaceId, devProjectId, provider (`github` / `gitlab` / `bitbucket` / `other`),
  fullName (`owner/repo`), url, defaultBranch, branches (JSON string[]), visibility, timestamps

Pure, unit-tested logic (statuses, providers, repo-URL derivation, branch
(de)serialization) lives in `src/lib/dev-studio-catalog.ts`; DB access in
`src/lib/dev-studio.ts`.

## Simplicity requirements

- New project setup starts with a name; client, status, URL and notes are optional.
- Repositories accept a plain `owner/repo` and derive the browse URL by provider.
- Branch tracking is a comma-separated list; the default branch always shows first.
- Empty states explain the next useful action.

## Acceptance criteria (increment 01)

- [x] A development project can be created, edited and soft-deleted.
- [x] Repositories can be added to and removed from a project.
- [x] Branch tracking persists and renders default-first.
- [x] All writes require EDITOR or above, enforced server-side.
- [x] Requests are scoped by workspace; no cross-workspace reads or writes.
- [x] Repository-URL derivation and branch (de)serialization are unit-tested.

## Exit scenario (increment 01)

Create an internal AZMIN dev project and a client dev project, link a GitHub
repository with a default and two tracked branches to each, confirm the studio
lists them per client, then remove one repository and soft-delete one project.
