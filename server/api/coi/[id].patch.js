import { z } from "zod";
import { prisma } from "~/server/utils/db";
import { requireUser } from "~/server/utils/auth";

const schema = z.object({
  coiName: z.string().min(1).max(255).optional(),
  email: z.string().max(255).optional().nullable(),
  cell: z.string().max(80).optional().nullable(),
  entity: z.string().max(255).optional().nullable(),
  position: z.string().max(255).optional().nullable(),
  industry: z.string().max(120).optional().nullable(),
  leadRelationshipPartner: z.string().max(255).optional().nullable(),
  relationshipSupport: z.string().max(255).optional().nullable(),
  couldWe: z.boolean().optional(),
  howWouldWe: z.boolean().optional(),
  willWe: z.boolean().optional(),
  testReview: z.boolean().optional(),
  totalReferrals: z.number().int().optional(),
  totalConverted: z.number().int().optional(),
  feeValue: z.number().optional()
});

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const id = Number(getRouterParam(event, "id"));
  if (!Number.isFinite(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: "Invalid id" });
  }

  const payload = schema.parse(await readBody(event));

  // Convert boolean progress fields to integers for database
  const data = { ...payload };
  if (typeof payload.couldWe === "boolean") data.couldWe = payload.couldWe ? 1 : 0;
  if (typeof payload.howWouldWe === "boolean") data.howWouldWe = payload.howWouldWe ? 1 : 0;
  if (typeof payload.willWe === "boolean") data.willWe = payload.willWe ? 1 : 0;
  if (typeof payload.testReview === "boolean") data.testReview = payload.testReview ? 1 : 0;

  // COIs are shared across the firm - any authenticated user can update
  const result = await prisma.coiEntry.updateMany({ where: { id }, data });

  if (result.count === 0) {
    throw createError({ statusCode: 404, statusMessage: "Not found" });
  }

  const item = await prisma.coiEntry.findUnique({ where: { id } });
  return { item: { ...item, feeValue: Number(item?.feeValue || 0) } };
});
