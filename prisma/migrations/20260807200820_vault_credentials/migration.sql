-- CreateTable
CREATE TABLE "VaultCredential" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "renewalId" TEXT,
    "clientName" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'OTHER',
    "label" TEXT NOT NULL,
    "username" TEXT,
    "url" TEXT,
    "encryptedValue" TEXT,
    "iv" TEXT,
    "authTag" TEXT,
    "keyVersion" INTEGER NOT NULL DEFAULT 1,
    "maskedHint" TEXT,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "VaultCredential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VaultCredential_workspaceId_clientName_deletedAt_idx" ON "VaultCredential"("workspaceId", "clientName", "deletedAt");

-- AddForeignKey
ALTER TABLE "VaultCredential" ADD CONSTRAINT "VaultCredential_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
