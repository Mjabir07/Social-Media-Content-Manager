-- AlterTable
ALTER TABLE "Client" ADD COLUMN "companyId" TEXT;

-- CreateIndex
CREATE INDEX "Client_workspaceId_companyId_idx" ON "Client"("workspaceId", "companyId");
