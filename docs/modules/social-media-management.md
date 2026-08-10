# Module: Social Media Management

**Status:** In progress  
**Owner:** AZMIN Digital  
**Roadmap phase:** SMM Phase 1  
**Last updated:** 2026-08-10

## Problem

AZMIN needs to operate social media for multiple companies without separating
commercial client records, brand knowledge, publishing state, or automation
evidence into disconnected tools. Won SMM leads must move into delivery with
minimal data entry, while existing clients must also be onboardable directly.

## Users and permissions

| User/role | Allowed actions |
| --- | --- |
| Owner/Admin | Onboard clients, configure brands, integrations, approvals and agent policy |
| Editor | Onboard clients, prepare campaigns/content and request approval |
| Viewer | View SMM accounts, readiness, schedules and results |

## Phase 1 scope

- Multi-company SMM Command Center at `/azmin/smm`.
- Idempotent onboarding from a won lead or an existing CRM client.
- A linked Client (commercial record), Company (isolated brand context), and
  optional originating Lead.
- Automatic Company, Brand Profile, Company Brain and starter-pillar creation
  when missing.
- Account-level approval and agent operating controls.
- Campaign and content-pillar data foundations.
- Portfolio readiness and operational counts.
- Activity evidence for onboarding.

Excluded from Phase 1:

- Live platform OAuth and additional provider adapters.
- Autonomous external publishing.
- Automated strategy/content generation and performance optimization.
- Paid-ad campaign management.

## Primary workflows

### Won SMM lead

1. User selects an SMM service on a lead.
2. User marks the lead `WON`.
3. Existing lead conversion creates the Client and Work records once.
4. If the service name identifies SMM, AZMIN automatically creates/reuses the
   Company and creates the SMM account.
5. For any won lead, the user can select **Onboard SMM** to run the same
   idempotent operation explicitly.
6. User completes Brand Brain, connects channels, and activates a campaign.

### Existing client

1. User opens the SMM Command Center.
2. User selects **Onboard SMM client** and chooses a CRM client.
3. AZMIN creates or reuses the matching Company and initializes the SMM account.
4. The client disappears from the available-onboarding list.

## Screens

| Screen | Purpose | Primary action |
| --- | --- | --- |
| SMM Command Center | Portfolio overview and readiness | Onboard SMM client |
| Leads pipeline | Commercial acquisition | Onboard won lead into SMM |
| Company workspace | Brand Profile and Company Brain | Complete brand setup |
| Publishing | Existing post scheduling/publishing | Prepare/publish approved post |

## Data model

- `SmmWorkspace`: tenant-owned join between one Client, one Company, and an
  optional won Lead. Unique links prevent duplicate onboarding.
- `SmmCampaign`: company-account campaign foundation, workspace-scoped.
- `SmmContentPillar`: reusable content mix with a per-account unique name.
- Existing `SocialPost`, `ChannelConnection`, `AutomationRun`, `Conversation`
  and `MediaAsset` remain the operational sources of truth.

See [ADR 0002](../decisions/0002-link-smm-client-and-company.md).

## Automations and approvals

| Action | Policy |
| --- | --- |
| Detect an SMM service on a won lead | Automatic |
| Create/reuse SMM account and starter pillars | Automatic and idempotent |
| Prepare Company/Brand Brain shell | Automatic; content requires review |
| Generate draft strategy/content | Planned automatic internal action |
| Publish externally | Approval required by default |
| Delete client/company/account data | Manual only with recovery plan |

## Failure and empty states

- A lead must be `WON` and have its converted Client before lead onboarding.
- Repeating onboarding returns the existing account and creates no duplicates.
- If no clients are available, the direct-onboarding action is disabled.
- Missing brand, channel and campaign setup appears as readiness work—not as a
  silent failure.
- Provider failures do not block viewing or internal planning.

## Acceptance criteria

- [x] SMM account data is workspace-scoped.
- [x] Won SMM leads automatically enter onboarding after commercial conversion.
- [x] Any won lead can be onboarded explicitly.
- [x] Existing clients can be onboarded from the SMM Command Center.
- [x] Repeated onboarding creates no duplicate account/company/pillars.
- [x] A new account receives four starter content pillars.
- [x] Command Center shows brand, channel, campaign and publishing readiness.
- [x] Publishing remains approval-controlled.
- [ ] Account setup editor for goals, platforms, cadence and agent schedule.
- [ ] Campaign and calendar management UI.
- [ ] End-to-end database test against an isolated PostgreSQL test database.

## Test plan

- Unit: SMM-service classification and catalog/format helpers.
- Integration: onboarding idempotency, tenant isolation and won-lead validation.
- End-to-end: win lead → onboard → command-center card → brand setup.
- Security: reject cross-workspace client, company and lead identifiers.
- Manual UX: empty portfolio, direct onboarding, repeated onboarding, readiness.

## Documentation and operations

- Migration: `20260810120000_smm_phase1_foundation`.
- Run `prisma migrate deploy` before the application build in production.
- Required provider credentials are not part of Phase 1.
- Update this specification, the core workflow and acceptance status with every
  SMM behavior change.
