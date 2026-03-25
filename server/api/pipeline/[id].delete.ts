import { prisma } from "~/server/utils/db";
import { requireUser } from "~/server/utils/auth";
import { logDelete } from "~/server/utils/audit";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const id = Number(getRouterParam(event, "id"));
  if (!Number.isFinite(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: "Invalid id" });
  }

  // Pipeline is shared across the firm - any authenticated user can delete
  const result = await prisma.pipelineEntry.deleteMany({ where: { id } });

  if (result.count === 0) {
    throw createError({ statusCode: 404, statusMessage: "Not found" });
  }

  // Audit log
  logDelete(event, user.id, "PipelineEntry", id);

  return { ok: true };
});
