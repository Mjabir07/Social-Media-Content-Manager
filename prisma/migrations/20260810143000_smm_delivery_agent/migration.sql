CREATE TABLE "SmmWorkflowRun" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "smmWorkspaceId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'ONBOARDING',
    "status" TEXT NOT NULL DEFAULT 'PLANNING',
    "objective" TEXT NOT NULL,
    "contextJson" TEXT NOT NULL DEFAULT '{}',
    "researchJson" TEXT NOT NULL DEFAULT '{}',
    "planJson" TEXT NOT NULL DEFAULT '{}',
    "summary" TEXT,
    "nextAction" TEXT,
    "lastError" TEXT,
    "planVersion" INTEGER NOT NULL DEFAULT 1,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SmmWorkflowRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SmmWorkflowStep" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "executionMode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "order" INTEGER NOT NULL DEFAULT 0,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "taskId" TEXT,
    "outputJson" TEXT NOT NULL DEFAULT '{}',
    "evidenceJson" TEXT NOT NULL DEFAULT '{}',
    "blockingReason" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SmmWorkflowStep_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SmmWorkflowRun_workspaceId_status_createdAt_idx" ON "SmmWorkflowRun"("workspaceId", "status", "createdAt");
CREATE INDEX "SmmWorkflowRun_smmWorkspaceId_type_createdAt_idx" ON "SmmWorkflowRun"("smmWorkspaceId", "type", "createdAt");
CREATE UNIQUE INDEX "SmmWorkflowStep_taskId_key" ON "SmmWorkflowStep"("taskId");
CREATE UNIQUE INDEX "SmmWorkflowStep_runId_key_key" ON "SmmWorkflowStep"("runId", "key");
CREATE INDEX "SmmWorkflowStep_workspaceId_status_idx" ON "SmmWorkflowStep"("workspaceId", "status");
CREATE INDEX "SmmWorkflowStep_runId_order_idx" ON "SmmWorkflowStep"("runId", "order");

ALTER TABLE "SmmWorkflowRun" ADD CONSTRAINT "SmmWorkflowRun_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SmmWorkflowRun" ADD CONSTRAINT "SmmWorkflowRun_smmWorkspaceId_fkey" FOREIGN KEY ("smmWorkspaceId") REFERENCES "SmmWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SmmWorkflowStep" ADD CONSTRAINT "SmmWorkflowStep_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SmmWorkflowStep" ADD CONSTRAINT "SmmWorkflowStep_runId_fkey" FOREIGN KEY ("runId") REFERENCES "SmmWorkflowRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SmmWorkflowStep" ADD CONSTRAINT "SmmWorkflowStep_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
