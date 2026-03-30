import { z } from "zod";
import { prisma } from "~/server/utils/db";
import { requireUser } from "~/server/utils/auth";

const schema = z.object({
  title: z.string().min(1).max(255),
  type: z.enum(["document", "url"]),
  content: z.string().optional(),
  url: z.string().max(500).optional(),
  topic: z.string().max(255).optional()
});

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const payload = schema.parse(await readBody(event));

  const item = await prisma.blogReference.create({
    data: {
      userId: user.id,
      title: payload.title,
      type: payload.type,
      content: payload.content || null,
      url: payload.url || null,
      topic: payload.topic || null
    }
  });

  return { item };
});
