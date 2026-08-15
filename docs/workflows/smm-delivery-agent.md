# SMM Delivery Agent Workflow

**Status:** In progress  
**Owner:** AZMIN Digital  
**Last updated:** 2026-08-10

## Purpose

Operate every Social Media Management (SMM) service stage through a consistent,
auditable agent lifecycle rather than disconnected forms and checklists.

## Lifecycle

`Assess → Research → Plan → Approve → Execute → Verify → Document → Continue`

Every run is resumable. A step must finish, wait for approval, become a guided
manual task, or expose a blocker. It must never disappear silently.

## Run states

| State | Meaning |
| --- | --- |
| PLANNING | Agent is assessing context and producing the plan |
| AWAITING_APPROVAL | Plan is ready but no external/setup work may begin |
| IN_PROGRESS | Approved automatic and guided tasks are active |
| BLOCKED | One or more required inputs/access items prevent progress |
| COMPLETED | Every required step is verified or explicitly waived |
| FAILED | The engine failed and retained a recoverable error |

## Step execution modes

| Mode | Behaviour |
| --- | --- |
| AUTOMATIC | Internal, reversible work can execute without approval |
| APPROVAL | Agent prepares the action and pauses for approval |
| MANUAL | Agent creates a guided task with verification evidence required |
| API | Agent executes only through a connected official API after approval |

## Initial onboarding plan

1. Validate client, company, service origin and ownership.
2. Assess Brand Profile and Company Brain completeness.
3. Research the approved public website and retain source links.
4. Confirm goals, target audiences, platforms and monthly deliverables.
5. Collect social access through the encrypted credential workflow.
6. Audit or create each social profile using official capabilities.
7. Prepare profile optimization copy and brand assets.
8. Build content pillars, strategy, key performance indicators and campaign.
9. Obtain plan approval.
10. Create execution tasks and track evidence to readiness.

## Approval rules

- Assessment, stored-context research, gap analysis and draft plans are automatic.
- External profile changes, communications and publishing require approval.
- Credentials are never placed in run/step/task evidence.
- Unsupported platform actions remain guided manual tasks.
- Completing a step requires verification evidence or an explicit approved waiver.

## Evidence contract

Each run stores objective, context snapshot, sources, findings, plan version,
approval actor/time, result summary, blockers and next action. Each step stores
execution mode, status, output, evidence, task link and blocking reason.

## Acceptance criteria

- [x] Every run and step is workspace- and SMM-account-scoped.
- [x] Re-running onboarding returns the active run unless restart is explicit.
- [x] Planning produces deterministic fallback output without an AI provider.
- [x] The plan identifies missing brand, website, platform and channel inputs.
- [x] Approval creates traceable execution tasks exactly once.
- [x] Manual/API-dependent work is never reported as automatically completed.
- [x] Run progress derives from step state and remains visible after reload.
- [x] The account workspace exposes research, plan, approval, blockers and evidence.
- [ ] External provider research enrichment is connected to the run evidence.
- [ ] Platform-specific setup executors are added one provider at a time.

## Service package presets (step "Confirm service package and deliverables")

The service-package step no longer expects a hand-typed scope. Selecting a
preset package from a dropdown (Essential / Growth / Professional / Elite,
defined in `src/lib/smm-packages-catalog.ts`) auto-fills a professional,
structured scope of work — monthly output, deliverables, responsibilities,
turnaround, reporting, primary CTA and exclusions — rendered by
`renderPackageScope`. The composed scope stays fully editable before the owner
confirms it, then becomes the step's verification evidence and the confirmed
package record the strategy step reads from. Prices are indicative and editable
per client. Evidence length caps were widened so a full scope is never
truncated.

## Editing completed steps

Completed (DONE) workflow steps now expose an **Edit** button that reopens the
evidence modal with the existing note prefilled, so an owner can revise a step
already marked done — including re-selecting a preset service package on the
scope step. Skipped steps stay locked; approval-gated runs still hide step
editing until the plan is approved.

## Package price tiers

Indicative monthly package prices: Essential AED 700, Growth AED 1,000,
Professional AED 1,200, Elite AED 1,500+. Prices are starting points and stay
editable per client in the confirmed scope.

## Package deliverables rebalanced to price tiers

Preset deliverables/counts were rebalanced to match the entry price tiers:
Essential 8/2/4 (IG, FB), Growth 12/4/8 (IG, FB, Google), Professional
16/6/10 (IG, FB, Google), Elite 20/8/12 (IG, FB, LinkedIn, Google). Counts stay
editable per client in the confirmed scope.

## Content automation (agent executor + daily cron)

Each SMM account has an automation panel (right column of the delivery agent
workspace) to configure the agent:

- **Automation enabled** — arms the account for the daily cycle.
- **Agent mode** — `DRAFT_ONLY` / `ASSISTED` create DRAFT posts for review;
  `AUTONOMOUS` creates SCHEDULED posts spread every two days.
- **Approval** — `REQUIRED` (approve before publish) or `TRUSTED_AUTO`. Enabling
  `AUTONOMOUS` or `TRUSTED_AUTO` requires an owner or admin.
- **Run now** — triggers one generation cycle immediately for testing.

The executor (`src/lib/smm-executor.ts`) runs from the existing daily cron
(`/api/cron/run`). For every enabled, due account (`nextAgentRunAt <= now`) it
tops up a rolling buffer (up to 6 upcoming posts, max 3 per run) by drafting
captions from the account's active content pillars via `generateCaption`, using
the company brand voice. It never publishes directly: DRAFT posts wait for the
owner; AUTONOMOUS SCHEDULED posts are published later by `runDuePosts` — and
only when a channel is actually connected, otherwise they remain a safe record.
Settings are updated via `PATCH /api/smm/[id]`; the account read now also
returns `agentEnabled`, `nextAgentRunAt`, `lastAgentRunAt` and post counts.

## Content pillars editing

The account workspace now has a Content pillars panel (right column) to manage
the themes the agent drafts from. Editors can add a pillar (name + optional
description), pause/activate it, or delete it. Only active pillars feed the
executor's content generation. Backed by `src/lib/smm-pillars.ts` and
`POST /api/smm/[id]/pillars` + `PATCH|DELETE /api/smm/[id]/pillars/[pillarId]`,
all account- and workspace-scoped.
