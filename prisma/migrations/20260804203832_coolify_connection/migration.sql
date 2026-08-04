-- CreateTable
CREATE TABLE "CoolifyConnection" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "encryptedToken" TEXT,
    "iv" TEXT,
    "authTag" TEXT,
    "keyVersion" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'DISCONNECTED',
    "lastError" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoolifyConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoolifyConnection_workspaceId_idx" ON "CoolifyConnection"("workspaceId");

-- AddForeignKey
ALTER TABLE "CoolifyConnection" ADD CONSTRAINT "CoolifyConnection_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
