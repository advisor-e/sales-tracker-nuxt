import { prisma } from "~/server/utils/db";
import { requireUser } from "~/server/utils/auth";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const id = Number(getRouterParam(event, "id"));

  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid ID" });
  }

  const item = await prisma.blogReference.findUnique({ where: { id } });

  if (!item || item.userId !== user.id) {
    throw createError({ statusCode: 404, statusMessage: "Reference not found" });
  }

  await prisma.blogReference.delete({ where: { id } });

  return { success: true };
});
