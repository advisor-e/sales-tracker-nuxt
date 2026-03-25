import { prisma } from "~/server/utils/db";
import { requireUser } from "~/server/utils/auth";

export default defineEventHandler(async (event) => {
  // Any authenticated user can view COI summary (firm-wide metrics)
  await requireUser(event);

  // Get valid COI names from the COI directory (shared across firm)
  const validCois = await prisma.coiEntry.findMany({
    select: { coiName: true }
  });
  const validCoiNames = new Set(validCois.map(c => c.coiName.toLowerCase()));

  // Get all pipeline entries that have a COI involved (firm-wide)
  const pipelineEntries = await prisma.pipelineEntry.findMany({
    where: {
      coiInvolved: { not: null }
    },
    select: {
      coiInvolved: true,
      jobSecured: true,
      jobSecuredValue: true,
      proposalValue: true,
      prospectStatus: true
    }
  });

  // Aggregate by COI name (only valid COIs from the directory)
  const coiStats = new Map<string, {
    coiName: string;
    totalReferrals: number;
    converted: number;
    proposedValue: number;
    securedValue: number;
    active: number;
  }>();

  for (const entry of pipelineEntries) {
    const coiName = String(entry.coiInvolved || "").trim();
    if (!coiName) continue;

    // Only include COIs that exist in the COI directory
    if (!validCoiNames.has(coiName.toLowerCase())) continue;

    const existing = coiStats.get(coiName) || {
      coiName,
      totalReferrals: 0,
      converted: 0,
      proposedValue: 0,
      securedValue: 0,
      active: 0
    };

    existing.totalReferrals += 1;
    existing.proposedValue += Number(entry.proposalValue || 0);

    if (entry.jobSecured) {
      existing.converted += 1;
      existing.securedValue += Number(entry.jobSecuredValue || 0);
    }

    if (entry.prospectStatus === "Active") {
      existing.active += 1;
    }

    coiStats.set(coiName, existing);
  }

  // Convert to array and sort by total referrals
  const items = Array.from(coiStats.values()).sort((a, b) => b.totalReferrals - a.totalReferrals);

  // Calculate totals
  const totalReferrals = items.reduce((sum, item) => sum + item.totalReferrals, 0);
  const totalConverted = items.reduce((sum, item) => sum + item.converted, 0);
  const totalProposedValue = items.reduce((sum, item) => sum + item.proposedValue, 0);
  const totalSecuredValue = items.reduce((sum, item) => sum + item.securedValue, 0);

  return {
    items,
    totals: {
      relationships: items.length,
      totalReferrals,
      totalConverted,
      totalProposedValue,
      totalSecuredValue,
      conversionRate: totalReferrals > 0 ? totalConverted / totalReferrals : 0
    }
  };
});
