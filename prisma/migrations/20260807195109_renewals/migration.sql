-- CreateTable
CREATE TABLE "Renewal" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT,
    "amountCents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'AED',
    "renewalDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Renewal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Renewal_workspaceId_status_deletedAt_idx" ON "Renewal"("workspaceId", "status", "deletedAt");

-- AddForeignKey
ALTER TABLE "Renewal" ADD CONSTRAINT "Renewal_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
