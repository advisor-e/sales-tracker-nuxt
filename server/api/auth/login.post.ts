import { z } from "zod";
import { defineEventHandler, readBody, createError, setResponseHeader } from "h3";
import { prisma } from "../../utils/db";
import { createSession, hashPassword, verifyPassword } from "../../utils/auth";
import { checkLoginRateLimit, recordLoginAttempt, clearLoginRateLimit, getClientIP } from "../../utils/ratelimit";
import { logLogin } from "../../utils/audit";

const schema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(128)  // Allow any length for login (validation is on registration)
});

export default defineEventHandler(async (event) => {
  // Rate limiting check
  const clientIP = getClientIP(event);
  const rateCheck = checkLoginRateLimit(clientIP);
  if (!rateCheck.allowed) {
    setResponseHeader(event, "Retry-After", String(rateCheck.retryAfter));
    throw createError({
      statusCode: 429,
      statusMessage: `Too many login attempts. Try again in ${Math.ceil((rateCheck.retryAfter || 0) / 60)} minutes.`
    });
  }

  const payload = schema.parse(await readBody(event));
  const email = payload.email.trim().toLowerCase();

  const adminEmail = String(process.env.ADMIN_EMAIL || "admin@example.com").trim().toLowerCase();
  const adminPassword = String(process.env.ADMIN_PASSWORD || "").trim();

  const userCount = await prisma.user.count();
  if (userCount === 0 && adminPassword && email === adminEmail && payload.password === adminPassword) {
    // First user is automatically a Firm Manager
    await prisma.user.create({
      data: {
        email,
        displayName: "Administrator",
        passwordHash: hashPassword(payload.password),
        role: "firm_manager"
      }
    });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !verifyPassword(payload.password, user.passwordHash)) {
    recordLoginAttempt(clientIP);
    throw createError({ statusCode: 401, statusMessage: "Invalid credentials" });
  }

  // Successful login - clear rate limit
  clearLoginRateLimit(clientIP);
  await createSession(event, user.id);

  // Audit log
  logLogin(event, user.id, user.email);

  return {
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName
    }
  };
});
