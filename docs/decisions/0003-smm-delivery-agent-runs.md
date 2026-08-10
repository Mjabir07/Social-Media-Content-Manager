# ADR 0003: Persist SMM Agent Runs and Steps

**Status:** Implemented  
**Date:** 2026-08-10

## Context

SMM onboarding spans automatic analysis, approvals, official APIs and manual
platform work. Generic tasks alone cannot retain research, plan versions,
approval state, execution mode or verification evidence.

## Decision

Persist one `SmmWorkflowRun` with ordered `SmmWorkflowStep` records. Link guided
execution steps to existing `Task` records rather than creating a second task
system. Keep plans, research and evidence as versioned JSON strings validated at
application boundaries. Scope every read and mutation by workspace and SMM
account.

Only one active onboarding run is reused at a time. Approval materializes tasks
idempotently and changes the run to `IN_PROGRESS`.

## Consequences

- Work survives restarts and can be audited.
- The same lifecycle can later serve audit, strategy, content and reporting runs.
- Platform executors can be added without redesigning the orchestration model.
- JSON contracts require validation and future migrations when their version
  changes materially.
