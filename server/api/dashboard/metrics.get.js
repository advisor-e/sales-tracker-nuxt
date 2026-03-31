const { prisma } = require('../../utils/db')
const { requireUser } = require('../../utils/auth')

// Simple in-memory cache for dashboard metrics (5 second TTL)
let metricsCache = null
const CACHE_TTL_MS = 5000

module.exports = async function(req, res) {
  // Any authenticated user can view dashboard metrics (firm-wide)
  await requireUser(req, res)

  // Check cache
  if (metricsCache && Date.now() - metricsCache.timestamp < CACHE_TTL_MS) {
    return res.json(metricsCache.data)
  }

  // Consolidated queries - reduced from 40+ to ~15 queries
  // All queries now show firm-wide data (no userId filter)
  const [
    // Pipeline aggregations - combined
    pipelineStats,
    pipelineGroupByStatus,
    pipelineGroupBySource,
    pipelineGroupBySalesStyle,
    pipelineEntries,
    // COI aggregations - combined
    coiStats,
    coiGroupByProgress,
    coiIndustryRows,
    // Config
    appConfigRows
  ] = await Promise.all([
    // Single aggregate query for pipeline totals
    prisma.pipelineEntry.aggregate({
      _count: { _all: true },
      _sum: { proposalValue: true, jobSecuredValue: true }
    }),
    // Status breakdown
    prisma.pipelineEntry.groupBy({
      by: ['prospectStatus'],
      _count: { _all: true },
      orderBy: { prospectStatus: 'asc' }
    }),
    // Source breakdown
    prisma.pipelineEntry.groupBy({
      by: ['prospectSource'],
      _count: { _all: true }
    }),
    // Sales style funnel metrics - one query instead of 8
    prisma.pipelineEntry.groupBy({
      by: ['salesStyle'],
      _count: { _all: true },
      _sum: { jobSecuredValue: true }
    }),
    // Get all pipeline entries with needed fields for calculations
    prisma.pipelineEntry.findMany({
      select: {
        prospectStatus: true,
        salesStyle: true,
        leadStaff: true,
        approachStyle: true,
        secureMeeting: true,
        proposalSent: true,
        jobSecured: true,
        jobSecuredValue: true,
        proposalValue: true,
        approachDate: true,
        dateSecured: true,
        coiInvolved: true
      }
    }),
    // COI aggregations
    prisma.coiEntry.aggregate({
      _count: { _all: true },
      _sum: { totalReferrals: true, totalConverted: true, feeValue: true }
    }),
    // COI progress counts - using raw query for efficiency (firm-wide)
    prisma.$queryRaw`
      SELECT
        SUM(CASE WHEN couldWe > 0 THEN 1 ELSE 0 END) as couldWe,
        SUM(CASE WHEN howWouldWe > 0 THEN 1 ELSE 0 END) as howWouldWe,
        SUM(CASE WHEN willWe > 0 THEN 1 ELSE 0 END) as willWe,
        SUM(CASE WHEN testReview > 0 THEN 1 ELSE 0 END) as testReview
      FROM CoiEntry
    `,
    // COI industries
    prisma.coiEntry.findMany({
      select: { industry: true, coiName: true }
    }),
    // App config (firm-wide settings)
    prisma.appConfig.findMany({
      where: { configKey: { in: ['campaignAvgDays', 'totalNeedsAvgDays'] } }
    })
  ])

  // Process pipeline entries in memory (much faster than multiple DB queries)
  let activeProspects = 0
  let securedJobs = 0
  let approachCount = 0
  let meetingCount = 0
  let proposalCount = 0
  let campaignApproaches = 0, campaignMeetings = 0, campaignProposals = 0, campaignSecured = 0
  let totalNeedsApproaches = 0, totalNeedsMeetings = 0, totalNeedsProposals = 0, totalNeedsSecured = 0
  const campaignSecuredEntries = []
  const totalNeedsSecuredEntries = []
  const staffTotals = new Map()
  const monthlyMap = new Map()
  const validCoiNames = new Set(coiIndustryRows.map(c => c.coiName?.toLowerCase()).filter(Boolean))
  let coiReferralsCount = 0, coiConvertedCount = 0, coiProposalFeeValue = 0, coiSecuredFeeValue = 0

  for (const entry of pipelineEntries) {
    // Status counts
    if (entry.prospectStatus === 'Active') activeProspects++
    if (entry.jobSecured) securedJobs++

    // Funnel counts
    if (entry.approachStyle) approachCount++
    if (entry.secureMeeting) meetingCount++
    if (entry.proposalSent) proposalCount++

    // Sales style funnel
    if (entry.salesStyle === 'Campaign') {
      if (entry.approachStyle) campaignApproaches++
      if (entry.secureMeeting) campaignMeetings++
      if (entry.proposalSent) campaignProposals++
      if (entry.jobSecured) {
        campaignSecured++
        campaignSecuredEntries.push(entry)
      }
    } else if (entry.salesStyle === 'Total Needs') {
      if (entry.approachStyle) totalNeedsApproaches++
      if (entry.secureMeeting) totalNeedsMeetings++
      if (entry.proposalSent) totalNeedsProposals++
      if (entry.jobSecured) {
        totalNeedsSecured++
        totalNeedsSecuredEntries.push(entry)
      }
    }

    // Staff breakdown
    const staffKey = String(entry.leadStaff || '').trim() || 'Unassigned'
    staffTotals.set(staffKey, (staffTotals.get(staffKey) || 0) + Number(entry.jobSecuredValue || 0))

    // Monthly trend
    if (entry.approachDate) {
      const d = new Date(entry.approachDate)
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthlyMap.set(month, (monthlyMap.get(month) || 0) + Number(entry.jobSecuredValue || 0))
    }

    // COI tracking
    const coiName = String(entry.coiInvolved || '').trim()
    if (coiName && validCoiNames.has(coiName.toLowerCase())) {
      coiReferralsCount++
      coiProposalFeeValue += Number(entry.proposalValue || 0)
      if (entry.jobSecured) {
        coiConvertedCount++
        coiSecuredFeeValue += Number(entry.jobSecuredValue || 0)
      }
    }
  }

  // Process source breakdown
  const sourceBreakdown = pipelineGroupBySource
    .map(row => ({
      source: String(row.prospectSource || '').trim() || 'Unknown',
      count: row._count._all
    }))
    .sort((a, b) => b.count - a.count)

  // Process staff breakdown
  const staffSecuredBreakdown = Array.from(staffTotals.entries())
    .map(([leadStaff, value]) => ({ leadStaff, value }))
    .sort((a, b) => b.value - a.value)

  // Process monthly trend
  const monthlySecuredTrend = Array.from(monthlyMap.entries())
    .map(([month, value]) => ({ month, value }))
    .sort((a, b) => a.month.localeCompare(b.month))

  // Process COI industry breakdown
  const industryMap = new Map()
  for (const row of coiIndustryRows) {
    const key = String(row.industry || '').trim()
    if (key) industryMap.set(key, (industryMap.get(key) || 0) + 1)
  }
  const coiIndustryBreakdown = Array.from(industryMap.entries())
    .map(([industry, relationships]) => ({ industry, relationships }))
    .sort((a, b) => b.relationships - a.relationships)

  // Calculate funnel stats
  function calculateFunnelStats(entries) {
    if (!entries.length) return { avgFee: 0, avgDaysElapsed: 0 }

    const totalFee = entries.reduce((sum, e) => sum + Number(e.jobSecuredValue || 0), 0)
    const avgFee = Math.round(totalFee / entries.length)

    const daysElapsedList = entries
      .filter(e => e.approachDate && e.dateSecured)
      .map(e => {
        const start = new Date(e.approachDate).getTime()
        const end = new Date(e.dateSecured).getTime()
        return Math.round((end - start) / (1000 * 60 * 60 * 24))
      })
      .filter(d => d >= 0)

    const avgDaysElapsed = daysElapsedList.length
      ? Math.round(daysElapsedList.reduce((a, b) => a + b, 0) / daysElapsedList.length)
      : 0

    return { avgFee, avgDaysElapsed }
  }

  const campaignStats = calculateFunnelStats(campaignSecuredEntries)
  const totalNeedsStats = calculateFunnelStats(totalNeedsSecuredEntries)

  // Get stored config values
  const configMap = new Map(appConfigRows.map((r) => [r.configKey, r.configVal]))
  const storedCampaignAvgDays = parseFloat(configMap.get('campaignAvgDays') || '0')
  const storedTotalNeedsAvgDays = parseFloat(configMap.get('totalNeedsAvgDays') || '0')

  // Process COI progress counts
  const coiProgress = coiGroupByProgress[0] || { couldWe: BigInt(0), howWouldWe: BigInt(0), willWe: BigInt(0), testReview: BigInt(0) }

  const result = {
    approaches: approachCount,
    meetingsSecured: meetingCount,
    proposalsSent: proposalCount,
    workSecured: Number(pipelineStats._sum.jobSecuredValue || 0),
    totalProspects: pipelineStats._count._all,
    activeProspects,
    securedJobs,
    totalProposalValue: Number(pipelineStats._sum.proposalValue || 0),
    totalSecuredValue: Number(pipelineStats._sum.jobSecuredValue || 0),
    totalCoi: coiStats._count._all,
    totalReferrals: coiStats._sum.totalReferrals || 0,
    totalConverted: coiStats._sum.totalConverted || 0,
    statusBreakdown: pipelineGroupByStatus.map(row => ({ status: row.prospectStatus, count: row._count._all })),
    sourceBreakdown,
    staffSecuredBreakdown,
    monthlySecuredTrend,
    coiIndustryBreakdown,
    campaignFunnel: {
      approaches: campaignApproaches,
      meetings: campaignMeetings,
      proposals: campaignProposals,
      secured: campaignSecured,
      avgFee: campaignStats.avgFee,
      avgDaysElapsed: storedCampaignAvgDays || campaignStats.avgDaysElapsed
    },
    totalNeedsFunnel: {
      approaches: totalNeedsApproaches,
      meetings: totalNeedsMeetings,
      proposals: totalNeedsProposals,
      secured: totalNeedsSecured,
      avgFee: totalNeedsStats.avgFee,
      avgDaysElapsed: storedTotalNeedsAvgDays || totalNeedsStats.avgDaysElapsed
    },
    coiPerformance: {
      total: coiStats._count._all,
      couldWe: Number(coiProgress.couldWe),
      howWouldWe: Number(coiProgress.howWouldWe),
      willWe: Number(coiProgress.willWe),
      testReview: Number(coiProgress.testReview),
      totalReferrals: coiReferralsCount,
      totalConverted: coiConvertedCount,
      totalProposalFeeValue: coiProposalFeeValue,
      totalSecuredFeeValue: coiSecuredFeeValue
    }
  }

  // Cache the result (shared across all users)
  metricsCache = { data: result, timestamp: Date.now() }

  return res.json(result)
}
