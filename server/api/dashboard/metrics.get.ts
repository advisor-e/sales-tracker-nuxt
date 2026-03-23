import { prisma } from "~/server/utils/db";
import { requireUser } from "~/server/utils/auth";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const [
    totalProspects,
    activeProspects,
    securedJobs,
    proposalAgg,
    securedAgg,
    totalCoi,
    coiAgg,
    statusRows,
    sourceRows,
    approachCount,
    meetingCount,
    proposalCount,
    staffRows,
    monthlyRows,
    coiIndustryRows,
    // Campaign funnel metrics
    campaignApproaches,
    campaignMeetings,
    campaignProposals,
    campaignSecured,
    // Total Needs funnel metrics
    totalNeedsApproaches,
    totalNeedsMeetings,
    totalNeedsProposals,
    totalNeedsSecured,
    // Secured entries for avg calculations
    campaignSecuredEntries,
    totalNeedsSecuredEntries,
    // Stored config values
    appConfigRows
  ] = await Promise.all([
    prisma.pipelineEntry.count({ where: { userId: user.id } }),
    prisma.pipelineEntry.count({ where: { userId: user.id, prospectStatus: "Active" } }),
    prisma.pipelineEntry.count({ where: { userId: user.id, jobSecured: true } }),
    prisma.pipelineEntry.aggregate({ where: { userId: user.id }, _sum: { proposalValue: true } }),
    prisma.pipelineEntry.aggregate({ where: { userId: user.id }, _sum: { jobSecuredValue: true } }),
    prisma.coiEntry.count({ where: { userId: user.id } }),
    prisma.coiEntry.aggregate({ where: { userId: user.id }, _sum: { totalReferrals: true, totalConverted: true } }),
    prisma.pipelineEntry.groupBy({ by: ["prospectStatus"], where: { userId: user.id }, _count: { _all: true }, orderBy: { prospectStatus: "asc" } }),
    prisma.pipelineEntry.groupBy({ by: ["prospectSource"], where: { userId: user.id }, _count: { _all: true } }),
    prisma.pipelineEntry.count({ where: { userId: user.id, NOT: { approachStyle: null } } }),
    prisma.pipelineEntry.count({ where: { userId: user.id, secureMeeting: true } }),
    prisma.pipelineEntry.count({ where: { userId: user.id, proposalSent: true } }),
    prisma.pipelineEntry.findMany({ where: { userId: user.id }, select: { leadStaff: true, jobSecuredValue: true } }),
    prisma.pipelineEntry.findMany({ where: { userId: user.id, approachDate: { not: null } }, select: { approachDate: true, jobSecuredValue: true }, orderBy: { approachDate: "asc" } }),
    prisma.coiEntry.findMany({ where: { userId: user.id }, select: { industry: true } }),
    // Campaign funnel
    prisma.pipelineEntry.count({ where: { userId: user.id, salesStyle: "Campaign", NOT: { approachStyle: null } } }),
    prisma.pipelineEntry.count({ where: { userId: user.id, salesStyle: "Campaign", secureMeeting: true } }),
    prisma.pipelineEntry.count({ where: { userId: user.id, salesStyle: "Campaign", proposalSent: true } }),
    prisma.pipelineEntry.count({ where: { userId: user.id, salesStyle: "Campaign", jobSecured: true } }),
    // Total Needs funnel
    prisma.pipelineEntry.count({ where: { userId: user.id, salesStyle: "Total Needs", NOT: { approachStyle: null } } }),
    prisma.pipelineEntry.count({ where: { userId: user.id, salesStyle: "Total Needs", secureMeeting: true } }),
    prisma.pipelineEntry.count({ where: { userId: user.id, salesStyle: "Total Needs", proposalSent: true } }),
    prisma.pipelineEntry.count({ where: { userId: user.id, salesStyle: "Total Needs", jobSecured: true } }),
    // Campaign secured entries for avg calculations
    prisma.pipelineEntry.findMany({
      where: { userId: user.id, salesStyle: "Campaign", jobSecured: true },
      select: { jobSecuredValue: true, approachDate: true, dateSecured: true }
    }),
    // Total Needs secured entries for avg calculations
    prisma.pipelineEntry.findMany({
      where: { userId: user.id, salesStyle: "Total Needs", jobSecured: true },
      select: { jobSecuredValue: true, approachDate: true, dateSecured: true }
    }),
    // Get stored avg days from AppConfig
    prisma.appConfig.findMany({
      where: { userId: user.id, configKey: { in: ["campaignAvgDays", "totalNeedsAvgDays"] } }
    })
  ]);

  const sourceBreakdown = sourceRows
    .map((row) => {
      const raw = String(row.prospectSource || "").trim();
      return {
        source: raw || "Unknown",
        count: row._count._all
      };
    })
    .sort((a, b) => b.count - a.count);

  const staffTotals = new Map<string, number>();
  for (const row of staffRows) {
    const key = String(row.leadStaff || "").trim() || "Unassigned";
    staffTotals.set(key, (staffTotals.get(key) || 0) + Number(row.jobSecuredValue || 0));
  }
  const staffSecuredBreakdown = Array.from(staffTotals.entries())
    .map(([leadStaff, value]) => ({ leadStaff, value }))
    .sort((a, b) => b.value - a.value);

  const monthlyMap = new Map<string, number>();
  for (const row of monthlyRows) {
    if (!row.approachDate) {
      continue;
    }
    const d = new Date(row.approachDate);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(month, (monthlyMap.get(month) || 0) + Number(row.jobSecuredValue || 0));
  }
  const monthlySecuredTrend = Array.from(monthlyMap.entries())
    .map(([month, value]) => ({ month, value }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const industryMap = new Map<string, number>();
  for (const row of coiIndustryRows) {
    const key = String(row.industry || "").trim();
    if (!key) {
      continue;
    }
    industryMap.set(key, (industryMap.get(key) || 0) + 1);
  }
  const coiIndustryBreakdown = Array.from(industryMap.entries())
    .map(([industry, relationships]) => ({ industry, relationships }))
    .sort((a, b) => b.relationships - a.relationships);

  // Calculate average fee and days elapsed for Campaign
  function calculateFunnelStats(entries: Array<{ jobSecuredValue: any; approachDate: Date | null; dateSecured: Date | null }>) {
    if (!entries.length) {
      return { avgFee: 0, avgDaysElapsed: 0 };
    }

    const totalFee = entries.reduce((sum, e) => sum + Number(e.jobSecuredValue || 0), 0);
    const avgFee = Math.round(totalFee / entries.length);

    const daysElapsedList = entries
      .filter(e => e.approachDate && e.dateSecured)
      .map(e => {
        const start = new Date(e.approachDate!).getTime();
        const end = new Date(e.dateSecured!).getTime();
        return Math.round((end - start) / (1000 * 60 * 60 * 24));
      })
      .filter(d => d >= 0);

    const avgDaysElapsed = daysElapsedList.length
      ? Math.round(daysElapsedList.reduce((a, b) => a + b, 0) / daysElapsedList.length)
      : 0;

    return { avgFee, avgDaysElapsed };
  }

  const campaignStats = calculateFunnelStats(campaignSecuredEntries);
  const totalNeedsStats = calculateFunnelStats(totalNeedsSecuredEntries);

  // Get stored avg days from AppConfig (imported from Excel Stats to Date sheet)
  const configMap = new Map(appConfigRows.map((r: { configKey: string; configVal: string }) => [r.configKey, r.configVal]));
  const storedCampaignAvgDays = parseFloat(configMap.get("campaignAvgDays") || "0");
  const storedTotalNeedsAvgDays = parseFloat(configMap.get("totalNeedsAvgDays") || "0");

  return {
    approaches: approachCount,
    meetingsSecured: meetingCount,
    proposalsSent: proposalCount,
    workSecured: Number(securedAgg._sum.jobSecuredValue || 0),
    totalProspects,
    activeProspects,
    securedJobs,
    totalProposalValue: Number(proposalAgg._sum.proposalValue || 0),
    totalSecuredValue: Number(securedAgg._sum.jobSecuredValue || 0),
    totalCoi,
    totalReferrals: coiAgg._sum.totalReferrals || 0,
    totalConverted: coiAgg._sum.totalConverted || 0,
    statusBreakdown: statusRows.map((row) => ({ status: row.prospectStatus, count: row._count._all })),
    sourceBreakdown,
    staffSecuredBreakdown,
    monthlySecuredTrend,
    coiIndustryBreakdown,
    // Campaign funnel data
    campaignFunnel: {
      approaches: campaignApproaches,
      meetings: campaignMeetings,
      proposals: campaignProposals,
      secured: campaignSecured,
      avgFee: campaignStats.avgFee,
      avgDaysElapsed: storedCampaignAvgDays || campaignStats.avgDaysElapsed
    },
    // Total Needs funnel data
    totalNeedsFunnel: {
      approaches: totalNeedsApproaches,
      meetings: totalNeedsMeetings,
      proposals: totalNeedsProposals,
      secured: totalNeedsSecured,
      avgFee: totalNeedsStats.avgFee,
      avgDaysElapsed: storedTotalNeedsAvgDays || totalNeedsStats.avgDaysElapsed
    }
  };
});
