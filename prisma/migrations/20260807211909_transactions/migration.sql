-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "clientId" TEXT,
    "renewalId" TEXT,
    "type" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AED',
    "category" TEXT NOT NULL DEFAULT 'OTHER',
    "vendor" TEXT,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PAID',
    "method" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Transaction_workspaceId_type_date_deletedAt_idx" ON "Transaction"("workspaceId", "type", "date", "deletedAt");

-- CreateIndex
CREATE INDEX "Transaction_clientId_idx" ON "Transaction"("clientId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
