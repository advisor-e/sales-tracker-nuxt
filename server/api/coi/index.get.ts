import { prisma } from "~/server/utils/db";
import { requireUser } from "~/server/utils/auth";

export default defineEventHandler(async (event) => {
  // Any authenticated user can view COIs (shared across the firm)
  await requireUser(event);
  const query = getQuery(event);
  const search = String(query.search || "").trim();

  const items = await prisma.coiEntry.findMany({
    where: {
      // COIs are shared across the firm - no userId filter
      OR: search
        ? [
            { coiName: { contains: search } },
            { entity: { contains: search } },
            { industry: { contains: search } },
            { leadRelationshipPartner: { contains: search } }
          ]
        : undefined
    },
    orderBy: [{ updatedAt: "desc" }],
    take: 500
  });

  return {
    items: items.map((item) => ({
      ...item,
      feeValue: Number(item.feeValue || 0)
    }))
  };
});
