import { z } from "zod";
import { generateDraft } from "~/server/utils/openai";
import { requireUser } from "~/server/utils/auth";

const schema = z.object({
  topic: z.string().min(1),
  audience: z.string().min(1),
  objective: z.string().min(1),
  tone: z.enum(["Professional", "Friendly", "Confident", "Educational"]),
  length: z.enum(["Short", "Medium", "Long"]),
  wordCount: z.string().optional(),
  cta: z.string().min(1),
  author: z.string().optional(),
  principles: z.array(z.object({ title: z.string(), details: z.array(z.string()) })).min(1),
  references: z.string().optional()
});

export default defineEventHandler(async (event) => {
  await requireUser(event);
  const payload = schema.parse(await readBody(event));
  return await generateDraft(payload);
});
