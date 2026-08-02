-- CreateTable
CREATE TABLE "DomainRecord" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "companyId" TEXT,
    "domainName" TEXT NOT NULL,
    "registrar" TEXT,
    "expiryDate" TIMESTAMP(3),
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DomainRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostingRecord" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "companyId" TEXT,
    "provider" TEXT NOT NULL,
    "planDetails" TEXT,
    "serverUuid" TEXT,
    "renewalDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailServiceRecord" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "companyId" TEXT,
    "provider" TEXT NOT NULL,
    "seats" INTEGER NOT NULL DEFAULT 1,
    "renewalDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailServiceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PulseSubscription" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "companyId" TEXT,
    "planName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "nextBillingDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PulseSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DomainRecord_workspaceId_companyId_idx" ON "DomainRecord"("workspaceId", "companyId");

-- CreateIndex
CREATE INDEX "HostingRecord_workspaceId_companyId_idx" ON "HostingRecord"("workspaceId", "companyId");

-- CreateIndex
CREATE INDEX "EmailServiceRecord_workspaceId_companyId_idx" ON "EmailServiceRecord"("workspaceId", "companyId");

-- CreateIndex
CREATE INDEX "PulseSubscription_workspaceId_companyId_idx" ON "PulseSubscription"("workspaceId", "companyId");

-- AddForeignKey
ALTER TABLE "DomainRecord" ADD CONSTRAINT "DomainRecord_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DomainRecord" ADD CONSTRAINT "DomainRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostingRecord" ADD CONSTRAINT "HostingRecord_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostingRecord" ADD CONSTRAINT "HostingRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailServiceRecord" ADD CONSTRAINT "EmailServiceRecord_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailServiceRecord" ADD CONSTRAINT "EmailServiceRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PulseSubscription" ADD CONSTRAINT "PulseSubscription_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PulseSubscription" ADD CONSTRAINT "PulseSubscription_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
