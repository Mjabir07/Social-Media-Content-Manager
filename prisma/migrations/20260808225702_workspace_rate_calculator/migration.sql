-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'AED';
ALTER TABLE "Workspace" ADD COLUMN "monthlyOverheadCents" INTEGER;
ALTER TABLE "Workspace" ADD COLUMN "monthlyPayTargetCents" INTEGER;
ALTER TABLE "Workspace" ADD COLUMN "workingHoursPerMonth" INTEGER;
ALTER TABLE "Workspace" ADD COLUMN "billablePercent" INTEGER;
ALTER TABLE "Workspace" ADD COLUMN "hourlyRateCents" INTEGER;
