import { z } from "zod";
import { prisma } from "~/server/utils/db";
import { requireUser } from "~/server/utils/auth";
import { logCreate } from "~/server/utils/audit";

const schema = z.object({
  prospectName: z.string().min(1).max(255),
  businessName: z.string().max(255).optional().nullable(),
  partner: z.string().max(255).optional().nullable(),
  leadStaff: z.string().max(255).optional().nullable(),
  prospectStatus: z.string().min(1).max(80),
  dateLastContact: z.string().optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  contactPhone: z.string().max(80).optional().nullable(),
  email: z.string().max(255).optional().nullable(),
  industry: z.string().max(120).optional().nullable(),
  existingFeeValue: z.string().max(120).optional().nullable(),
  supportStaff: z.string().max(255).optional().nullable(),
  relationshipType: z.string().max(80).optional().nullable(),
  prospectSource: z.string().max(120).optional().nullable(),
  coiInvolved: z.string().max(255).optional().nullable(),
  approachDate: z.string().optional().nullable(),
  approachStyle: z.string().max(120).optional().nullable(),
  secureMeeting: z.boolean().optional(),
  quizCompleted: z.boolean().optional(),
  salesStyle: z.string().max(80).optional().nullable(),
  meetingTheme: z.string().max(120).optional().nullable(),
  meetingDate: z.string().optional().nullable(),
  followUpMeeting: z.boolean().optional(),
  followUpMeetingDate: z.string().optional().nullable(),
  totalNeedsStage: z.string().max(80).optional().nullable(),
  proposalSent: z.boolean().optional(),
  proposalValue: z.number().optional(),
  jobSecured: z.boolean().optional(),
  dateSecured: z.string().optional().nullable(),
  jobSecuredValue: z.number().optional(),
  additionalWorkSecured: z.number().optional(),
  comments: z.string().optional().nullable()
});

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const payload = schema.parse(await readBody(event));

  const item = await prisma.pipelineEntry.create({
    data: {
      userId: user.id,
      prospectName: payload.prospectName,
      businessName: payload.businessName || null,
      partner: payload.partner || null,
      leadStaff: payload.leadStaff || null,
      prospectStatus: payload.prospectStatus,
      dateLastContact: payload.dateLastContact ? new Date(payload.dateLastContact) : null,
      address: payload.address || null,
      contactPhone: payload.contactPhone || null,
      email: payload.email || null,
      industry: payload.industry || null,
      existingFeeValue: payload.existingFeeValue || null,
      supportStaff: payload.supportStaff || null,
      relationshipType: payload.relationshipType || null,
      prospectSource: payload.prospectSource || null,
      coiInvolved: payload.coiInvolved || null,
      approachDate: payload.approachDate ? new Date(payload.approachDate) : null,
      approachStyle: payload.approachStyle || null,
      secureMeeting: payload.secureMeeting ?? false,
      quizCompleted: payload.quizCompleted ?? false,
      salesStyle: payload.salesStyle || null,
      meetingTheme: payload.meetingTheme || null,
      meetingDate: payload.meetingDate ? new Date(payload.meetingDate) : null,
      followUpMeeting: payload.followUpMeeting ?? false,
      followUpMeetingDate: payload.followUpMeetingDate ? new Date(payload.followUpMeetingDate) : null,
      totalNeedsStage: payload.totalNeedsStage || null,
      proposalSent: payload.proposalSent ?? false,
      proposalValue: payload.proposalValue ?? 0,
      jobSecured: payload.jobSecured ?? false,
      dateSecured: payload.dateSecured ? new Date(payload.dateSecured) : null,
      jobSecuredValue: payload.jobSecuredValue ?? 0,
      additionalWorkSecured: payload.additionalWorkSecured ?? 0,
      comments: payload.comments || null
    }
  });

  // Audit log
  logCreate(event, user.id, "PipelineEntry", item.id, { prospectName: payload.prospectName });

  return {
    item: {
      ...item,
      proposalValue: Number(item.proposalValue || 0),
      jobSecuredValue: Number(item.jobSecuredValue || 0),
      additionalWorkSecured: Number(item.additionalWorkSecured || 0)
    }
  };
});
