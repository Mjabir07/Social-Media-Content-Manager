-- CreateTable
CREATE TABLE "DevProject" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "companyId" TEXT,
    "createdById" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "productionUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DevProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Repository" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "devProjectId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'github',
    "fullName" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "defaultBranch" TEXT NOT NULL DEFAULT 'main',
    "branches" TEXT NOT NULL DEFAULT '[]',
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Repository_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DevProject_workspaceId_companyId_idx" ON "DevProject"("workspaceId", "companyId");

-- CreateIndex
CREATE INDEX "DevProject_workspaceId_status_idx" ON "DevProject"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "Repository_workspaceId_devProjectId_idx" ON "Repository"("workspaceId", "devProjectId");

-- AddForeignKey
ALTER TABLE "DevProject" ADD CONSTRAINT "DevProject_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevProject" ADD CONSTRAINT "DevProject_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Repository" ADD CONSTRAINT "Repository_devProjectId_fkey" FOREIGN KEY ("devProjectId") REFERENCES "DevProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
