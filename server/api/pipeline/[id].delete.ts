import { prisma } from "~/server/utils/db";
import { requireUser } from "~/server/utils/auth";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const id = Number(getRouterParam(event, "id"));
  if (!Number.isFinite(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: "Invalid id" });
  }

  // Atomic ownership check + delete to prevent TOCTOU race conditions
  const result = await prisma.pipelineEntry.deleteMany({ where: { id, userId: user.id } });

  if (result.count === 0) {
    throw createError({ statusCode: 404, statusMessage: "Not found" });
  }

  return { ok: true };
});
