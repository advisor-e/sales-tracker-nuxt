import { prisma } from "~/server/utils/db";
import { requireUser } from "~/server/utils/auth";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const id = Number(getRouterParam(event, "id"));

  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid ID" });
  }

  // Atomic ownership check + delete to prevent TOCTOU race conditions
  const result = await prisma.blogReference.deleteMany({ where: { id, userId: user.id } });

  if (result.count === 0) {
    throw createError({ statusCode: 404, statusMessage: "Reference not found" });
  }

  return { success: true };
});
