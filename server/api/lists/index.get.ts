import { prisma } from "~/server/utils/db";
import { requireUser } from "~/server/utils/auth";

// Default list configurations
const defaultLists: Record<string, { name: string; description: string; items: string[]; colors?: Record<string, string> }> = {
  partner: {
    name: "Partner",
    description: "Partners responsible for client relationships",
    items: []
  },
  leadStaff: {
    name: "Lead Staff (Client Manager)",
    description: "Staff members who manage client accounts",
    items: []
  },
  prospectStatus: {
    name: "Prospect Status",
    description: "Status options for tracking prospect lifecycle",
    items: ["Active", "Await Research", "Completed", "Dead", "On Hold"],
    colors: {
      "Active": "#dcfce7",
      "Await Research": "#dbeafe",
      "Completed": "#f0fdf4",
      "Dead": "#fee2e2",
      "On Hold": "#fef3c7"
    }
  },
  relationshipType: {
    name: "Relationship Type",
    description: "Type of business relationship with prospect",
    items: ["Existing Client", "New Prospect"]
  },
  prospectSource: {
    name: "Prospect Source",
    description: "How the prospect was acquired",
    items: ["Social Media", "Web Enquiry", "Walk-In", "Phone-In", "Referral", "Cold Target", "Networking", "Pers' Relations"]
  },
  approachStyle: {
    name: "Approach Style",
    description: "Method used to approach the prospect",
    items: ["Direct Contact", "Pre Approach - Single", "Pre Approach - Sequence", "Pre Approach Gift", "Group Positioning", "Quiz Link Sent"]
  },
  salesStyle: {
    name: "Sales Style",
    description: "Sales methodology being applied",
    items: ["Campaign", "Total Needs"]
  },
  totalNeedsStage: {
    name: "Total Needs Stage",
    description: "Stage in the Total Needs sales process",
    items: ["Stage 1", "Stage 2", "Stage 3", "Stage 4", "Stage 5"]
  },
  meetingTheme: {
    name: "Meeting Theme",
    description: "Theme or focus of sales meetings",
    items: ["Discovery", "Presentation", "Proposal Review", "Follow Up", "Closing"]
  },
  industry: {
    name: "Industry",
    description: "Common industries for prospects and COIs",
    items: ["Accounting", "Legal", "Finance", "Real Estate", "Insurance", "Healthcare", "Technology", "Manufacturing", "Retail", "Construction", "Education", "Hospitality", "Earthmoving", "Other"]
  }
};

export default defineEventHandler(async (event) => {
  // Any authenticated user can read lists (they're shared across the firm)
  await requireUser(event);

  // Fetch all list configs (shared across all users - take most recent per key)
  const allConfigs = await prisma.appConfig.findMany({
    where: {
      configKey: { startsWith: "list:" }
    },
    orderBy: { updatedAt: "desc" }
  });

  // Deduplicate by configKey (keep the most recent)
  const configs = Array.from(
    new Map(allConfigs.map(c => [c.configKey, c])).values()
  );

  // Build lists object, merging defaults with saved data
  const lists: Record<string, { name: string; description: string; items: string[]; colors?: Record<string, string> }> = {};

  for (const [key, defaultList] of Object.entries(defaultLists)) {
    const configKey = `list:${key}`;
    const saved = configs.find((c) => c.configKey === configKey);

    if (saved) {
      try {
        const parsed = JSON.parse(saved.configVal);
        lists[key] = {
          ...defaultList,
          items: Array.isArray(parsed.items) ? parsed.items : defaultList.items,
          colors: parsed.colors || defaultList.colors
        };
      } catch {
        lists[key] = { ...defaultList };
      }
    } else {
      lists[key] = { ...defaultList };
    }
  }

  return { lists };
});
