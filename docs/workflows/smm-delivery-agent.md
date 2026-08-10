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
