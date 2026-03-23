import { PrismaClient } from "@prisma/client";
import xlsx from "xlsx";

const prisma = new PrismaClient();

const STATUS_OPTIONS = new Set(["Active", "Await Research", "Completed", "Dead", "On Hold"]);

function asString(value, fallback = "") {
  if (value === null || value === undefined) {
    return fallback;
  }
  return String(value).trim();
}

function toBool(value) {
  const text = asString(value).toLowerCase();
  return text === "yes" || text === "true" || text === "1";
}

function toNumber(value) {
  const text = asString(value).replace(/[$,\s]/g, "");
  const num = Number(text);
  return Number.isFinite(num) ? num : 0;
}

function toInt(value) {
  return Math.trunc(toNumber(value));
}

function parseDate(value) {
  if (!value) {
    return null;
  }
  // Handle Excel serial date numbers
  if (typeof value === "number") {
    // Excel serial date: days since 1899-12-30
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function bestHeaderRow(rows, markers) {
  let bestIndex = 0;
  let bestScore = -1;
  for (let i = 0; i < Math.min(rows.length, 20); i += 1) {
    const rowSet = new Set((rows[i] || []).map((value) => asString(value)).filter(Boolean));
    let score = 0;
    for (const marker of markers) {
      if (rowSet.has(marker)) {
        score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }
  return bestIndex;
}

function sheetRows(workbook, name, markers) {
  const ws = workbook.Sheets[name];
  if (!ws) {
    return [];
  }
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1, defval: "" });
  if (!rows.length) {
    return [];
  }
  const headerIndex = bestHeaderRow(rows, markers);
  const headers = rows[headerIndex].map((value) => asString(value));
  const out = [];

  for (let i = headerIndex + 1; i < rows.length; i += 1) {
    const source = rows[i] || [];
    const item = {};
    let nonEmpty = 0;
    for (let col = 0; col < headers.length; col += 1) {
      const key = headers[col];
      if (!key) {
        continue;
      }
      item[key] = source[col];
      if (asString(source[col])) {
        nonEmpty += 1;
      }
    }
    if (nonEmpty > 0) {
      out.push(item);
    }
  }

  return out;
}

async function main() {
  const workbookPath = process.argv[2] || "Data/Sales Tracker VsCode.xlsx";
  const userEmail = asString(process.env.IMPORT_USER_EMAIL || process.env.ADMIN_EMAIL || "admin@example.com").toLowerCase();

  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) {
    throw new Error(`User not found for email ${userEmail}. Create user first.`);
  }

  console.log(`Importing from: ${workbookPath}`);
  console.log(`Target user: ${userEmail}`);

  const wb = xlsx.readFile(workbookPath);

  // Sales Activity sheet markers
  const salesRows = sheetRows(wb, "Sales Activity", [
    "Prospect Name",
    "Business Name",
    "Lead Staff (Client Manager)",
    "Prospect Status",
    "Approach Date"
  ]);

  // COI Development sheet markers
  const coiRows = sheetRows(wb, "COI Development", [
    "COI Name",
    "Email",
    "Entity",
    "Lead Relationship Partner",
    "Total Referrals"
  ]);

  // Read summary stats from Stats to Date sheet
  const statsSheet = wb.Sheets["Stats to Date"];
  const campaignAvgDays = statsSheet?.["AA5"]?.v ?? 0;
  const totalNeedsAvgDays = statsSheet?.["AA6"]?.v ?? 0;
  console.log(`Stats to Date - Campaign Avg Days: ${campaignAvgDays}, Total Needs Avg Days: ${totalNeedsAvgDays}`);

  // Clear existing data for this user
  await prisma.pipelineEntry.deleteMany({ where: { userId: user.id } });
  await prisma.coiEntry.deleteMany({ where: { userId: user.id } });
  await prisma.appConfig.deleteMany({ where: { userId: user.id } });

  // Import Sales Activity → PipelineEntry
  let salesImported = 0;
  for (const row of salesRows) {
    const prospectName = asString(row["Prospect Name"]);
    if (!prospectName) {
      continue;
    }

    const status = asString(row["Prospect Status"], "Active");
    await prisma.pipelineEntry.create({
      data: {
        userId: user.id,
        prospectName,
        businessName: asString(row["Business Name"]) || null,
        partner: asString(row["Partner"]) || null,
        leadStaff: asString(row["Lead Staff (Client Manager)"]) || null,
        prospectStatus: STATUS_OPTIONS.has(status) ? status : "Active",
        dateLastContact: parseDate(row["Date Last Contact"]),
        address: asString(row["Address"]) || null,
        contactPhone: asString(row["Contact Phone #"]) || null,
        email: asString(row["Email"]) || null,
        industry: asString(row["Industry"]) || null,
        existingFeeValue: asString(row["Existing Fee/$ Value"]) || null,
        supportStaff: asString(row["Support Staff (Buddy)"]) || null,
        relationshipType: asString(row["Relationship Type"]) || null,
        prospectSource: asString(row["Prospect Source"]) || null,
        coiInvolved: asString(row["COI Involved"]) || null,
        approachDate: parseDate(row["Approach Date"]),
        approachStyle: asString(row["Approach Style"]) || null,
        secureMeeting: toBool(row["Secure Meeting"]),
        quizCompleted: toBool(row["Quiz Completed"]),
        salesStyle: asString(row["Sales Style"]) || null,
        meetingTheme: asString(row["Meeting Theme"]) || null,
        meetingDate: parseDate(row["Meeting Date"]),
        followUpMeeting: toBool(row["Follow up Meeting"]),
        followUpMeetingDate: parseDate(row["F/Up Meeting Date"]),
        totalNeedsStage: asString(row["Ttl Needs Stage"]) || null,
        proposalSent: toBool(row["Proposal Sent"]),
        proposalValue: toNumber(row["Proposal Value"]),
        jobSecured: toBool(row["Job Secured"]),
        dateSecured: parseDate(row["Date Secured"]),
        jobSecuredValue: toNumber(row["Job Secured Value"]),
        additionalWorkSecured: toNumber(row["Additional Work Secured"]),
        comments: asString(row["Comments / Next Move"]) || null
      }
    });
    salesImported++;
  }

  // Import COI Development → CoiEntry
  let coiImported = 0;
  for (const row of coiRows) {
    const name = asString(row["COI Name"]);
    if (!name) {
      continue;
    }

    await prisma.coiEntry.create({
      data: {
        userId: user.id,
        coiName: name,
        email: asString(row["Email"]) || null,
        cell: asString(row["Cell #"]) || null,
        entity: asString(row["Entity"]) || null,
        position: asString(row["Position"]) || null,
        industry: asString(row["Industry"]) || null,
        other: asString(row["Other"]) || null,
        leadRelationshipPartner: asString(row["Lead Relationship Partner"]) || null,
        relationshipSupport: asString(row["Relationship Support"]) || null,
        couldWe: toInt(row["Could We"]),
        howWouldWe: toInt(row["How Would We"]),
        willWe: toInt(row["Will We"]),
        testReview: toInt(row["Test/ Review"]),
        totalReferrals: toInt(row["Total Referrals"]),
        totalConverted: toInt(row["Total Converted"]),
        feeValue: toNumber(row["Fee Value"])
      }
    });
    coiImported++;
  }

  // Store summary stats in AppConfig
  await prisma.appConfig.createMany({
    data: [
      { userId: user.id, configKey: "campaignAvgDays", configVal: String(campaignAvgDays) },
      { userId: user.id, configKey: "totalNeedsAvgDays", configVal: String(totalNeedsAvgDays) }
    ]
  });

  console.log(`Imported ${salesImported} pipeline entries and ${coiImported} COI entries for ${userEmail}`);
  console.log(`Stored summary stats: Campaign Avg Days = ${campaignAvgDays}, Total Needs Avg Days = ${totalNeedsAvgDays}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
