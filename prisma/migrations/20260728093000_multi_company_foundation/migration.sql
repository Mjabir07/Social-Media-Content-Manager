-- Phase 01: tenant-scoped companies, brand profiles and Company Brain.
CREATE TABLE "Company" (
    "id" TEXT NOT NULL, "workspaceId" TEXT NOT NULL, "name" TEXT NOT NULL, "slug" TEXT NOT NULL,
    "relationshipType" TEXT NOT NULL, "industry" TEXT, "website" TEXT, "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE', "isHeadquarters" BOOLEAN NOT NULL DEFAULT false,
    "primaryColor" TEXT NOT NULL DEFAULT '#087CFA', "accentColor" TEXT NOT NULL DEFAULT '#22D3EE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "BrandProfile" (
    "id" TEXT NOT NULL, "companyId" TEXT NOT NULL, "tagline" TEXT, "brandVoice" TEXT,
    "targetAudiences" TEXT NOT NULL DEFAULT '[]', "offerings" TEXT NOT NULL DEFAULT '[]',
    "differentiators" TEXT NOT NULL DEFAULT '[]', "contentRules" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BrandProfile_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "CompanyBrain" (
    "id" TEXT NOT NULL, "companyId" TEXT NOT NULL, "companyFacts" TEXT, "salesGuidance" TEXT,
    "contentGuidance" TEXT, "aiInstructions" TEXT, "knowledgeStatus" TEXT NOT NULL DEFAULT 'EMPTY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CompanyBrain_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Company_workspaceId_slug_key" ON "Company"("workspaceId", "slug");
CREATE INDEX "Company_workspaceId_status_idx" ON "Company"("workspaceId", "status");
CREATE UNIQUE INDEX "BrandProfile_companyId_key" ON "BrandProfile"("companyId");
CREATE UNIQUE INDEX "CompanyBrain_companyId_key" ON "CompanyBrain"("companyId");
ALTER TABLE "Company" ADD CONSTRAINT "Company_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BrandProfile" ADD CONSTRAINT "BrandProfile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompanyBrain" ADD CONSTRAINT "CompanyBrain_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
