-- Phase 1 SMM foundation: multi-company onboarding, campaigns, content pillars,
-- and safe agent operating controls.
CREATE TABLE "SmmWorkspace" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "leadId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ONBOARDING',
    "onboardingStep" INTEGER NOT NULL DEFAULT 1,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Dubai',
    "goals" TEXT NOT NULL DEFAULT '[]',
    "platforms" TEXT NOT NULL DEFAULT '[]',
    "postingCadence" TEXT NOT NULL DEFAULT '{}',
    "approvalMode" TEXT NOT NULL DEFAULT 'REQUIRED',
    "agentEnabled" BOOLEAN NOT NULL DEFAULT true,
    "agentMode" TEXT NOT NULL DEFAULT 'DRAFT_ONLY',
    "nextAgentRunAt" TIMESTAMP(3),
    "lastAgentRunAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SmmWorkspace_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SmmCampaign" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "smmWorkspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "objective" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "budgetCents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'AED',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SmmCampaign_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SmmContentPillar" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "smmWorkspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targetPercent" INTEGER NOT NULL DEFAULT 25,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SmmContentPillar_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SmmWorkspace_companyId_key" ON "SmmWorkspace"("companyId");
CREATE UNIQUE INDEX "SmmWorkspace_clientId_key" ON "SmmWorkspace"("clientId");
CREATE UNIQUE INDEX "SmmWorkspace_leadId_key" ON "SmmWorkspace"("leadId");
CREATE INDEX "SmmWorkspace_workspaceId_status_idx" ON "SmmWorkspace"("workspaceId", "status");
CREATE INDEX "SmmWorkspace_workspaceId_nextAgentRunAt_idx" ON "SmmWorkspace"("workspaceId", "nextAgentRunAt");
CREATE INDEX "SmmCampaign_workspaceId_status_idx" ON "SmmCampaign"("workspaceId", "status");
CREATE INDEX "SmmCampaign_smmWorkspaceId_startDate_idx" ON "SmmCampaign"("smmWorkspaceId", "startDate");
CREATE UNIQUE INDEX "SmmContentPillar_smmWorkspaceId_name_key" ON "SmmContentPillar"("smmWorkspaceId", "name");
CREATE INDEX "SmmContentPillar_workspaceId_active_idx" ON "SmmContentPillar"("workspaceId", "active");

ALTER TABLE "SmmWorkspace" ADD CONSTRAINT "SmmWorkspace_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SmmWorkspace" ADD CONSTRAINT "SmmWorkspace_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SmmWorkspace" ADD CONSTRAINT "SmmWorkspace_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SmmWorkspace" ADD CONSTRAINT "SmmWorkspace_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SmmCampaign" ADD CONSTRAINT "SmmCampaign_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SmmCampaign" ADD CONSTRAINT "SmmCampaign_smmWorkspaceId_fkey" FOREIGN KEY ("smmWorkspaceId") REFERENCES "SmmWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SmmContentPillar" ADD CONSTRAINT "SmmContentPillar_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SmmContentPillar" ADD CONSTRAINT "SmmContentPillar_smmWorkspaceId_fkey" FOREIGN KEY ("smmWorkspaceId") REFERENCES "SmmWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
