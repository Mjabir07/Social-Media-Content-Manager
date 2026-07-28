-- CreateTable
CREATE TABLE "ProviderCredential" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "encryptedValue" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "authTag" TEXT NOT NULL,
    "keyVersion" INTEGER NOT NULL DEFAULT 1,
    "maskedValue" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastTestedAt" TIMESTAMP(3),
    "lastTestStatus" TEXT,
    "lastTestMessage" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProviderCredential_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProviderCredential_workspaceId_provider_key"
ON "ProviderCredential"("workspaceId", "provider");

CREATE INDEX "ProviderCredential_workspaceId_status_idx"
ON "ProviderCredential"("workspaceId", "status");

ALTER TABLE "ProviderCredential"
ADD CONSTRAINT "ProviderCredential_workspaceId_fkey"
FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
