import { prisma } from "~/server/utils/db";
import { requireUser } from "~/server/utils/auth";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const query = getQuery(event);
  const topic = query.topic as string | undefined;

  const where: { userId: number; topic?: string } = { userId: user.id };
  if (topic) {
    where.topic = topic;
  }

  const items = await prisma.blogReference.findMany({
    where,
    orderBy: { updatedAt: "desc" }
  });

  return { items };
});
