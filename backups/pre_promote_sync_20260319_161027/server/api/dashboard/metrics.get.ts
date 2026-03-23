import { prisma } from "~/server/utils/db";
import { requireUser } from "~/server/utils/auth";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const [totalProspects, activeProspects, securedJobs, proposalAgg, securedAgg, totalCoi, coiAgg, statusRows] = await Promise.all([
    prisma.pipelineEntry.count({ where: { userId: user.id } }),
    prisma.pipelineEntry.count({ where: { userId: user.id, prospectStatus: "Active" } }),
    prisma.pipelineEntry.count({ where: { userId: user.id, jobSecured: true } }),
    prisma.pipelineEntry.aggregate({ where: { userId: user.id }, _sum: { proposalValue: true } }),
    prisma.pipelineEntry.aggregate({ where: { userId: user.id }, _sum: { jobSecuredValue: true } }),
    prisma.coiEntry.count({ where: { userId: user.id } }),
    prisma.coiEntry.aggregate({ where: { userId: user.id }, _sum: { totalReferrals: true, totalConverted: true } }),
    prisma.pipelineEntry.groupBy({ by: ["prospectStatus"], where: { userId: user.id }, _count: { _all: true }, orderBy: { prospectStatus: "asc" } })
  ]);

  return {
    totalProspects,
    activeProspects,
    securedJobs,
    totalProposalValue: Number(proposalAgg._sum.proposalValue || 0),
    totalSecuredValue: Number(securedAgg._sum.jobSecuredValue || 0),
    totalCoi,
    totalReferrals: coiAgg._sum.totalReferrals || 0,
    totalConverted: coiAgg._sum.totalConverted || 0,
    statusBreakdown: statusRows.map((row) => ({ status: row.prospectStatus, count: row._count._all }))
  };
});
