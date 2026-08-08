import { prisma } from "@/lib/db";
import { computeHourlyRateCents } from "@/lib/rate-catalog";

/**
 * Workspace-level settings — currently the freelancer cost-rate calculator.
 * hourlyRateCents is always recomputed from the inputs on save, so the cached
 * value used to prefill work orders stays correct.
 */
export * from "@/lib/rate-catalog";
import type { RateSettings } from "@/lib/rate-catalog";

export async function getRateSettings(workspaceId: string): Promise<RateSettings> {
  const w = await prisma.workspace.findUniqueOrThrow({
    where: { id: workspaceId },
    select: {
      currency: true, monthlyOverheadCents: true, monthlyPayTargetCents: true,
      workingHoursPerMonth: true, billablePercent: true, hourlyRateCents: true,
    },
  });
  return w;
}

export type RateSettingsInput = {
  currency?: string;
  monthlyOverheadCents?: number | null;
  monthlyPayTargetCents?: number | null;
  workingHoursPerMonth?: number | null;
  billablePercent?: number | null;
};

export async function updateRateSettings(workspaceId: string, input: RateSettingsInput): Promise<RateSettings> {
  const current = await getRateSettings(workspaceId);
  const merged = {
    monthlyOverheadCents: input.monthlyOverheadCents !== undefined ? input.monthlyOverheadCents : current.monthlyOverheadCents,
    monthlyPayTargetCents: input.monthlyPayTargetCents !== undefined ? input.monthlyPayTargetCents : current.monthlyPayTargetCents,
    workingHoursPerMonth: input.workingHoursPerMonth !== undefined ? input.workingHoursPerMonth : current.workingHoursPerMonth,
    billablePercent: input.billablePercent !== undefined ? input.billablePercent : current.billablePercent,
  };
  const hourlyRateCents = computeHourlyRateCents(merged);
  await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      ...(input.currency !== undefined ? { currency: input.currency } : {}),
      ...merged,
      hourlyRateCents,
    },
  });
  return getRateSettings(workspaceId);
}
