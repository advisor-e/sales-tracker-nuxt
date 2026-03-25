import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { getCookie, setCookie, deleteCookie, createError, getRequestProtocol, type H3Event } from "h3";
import { prisma } from "./db";

const SESSION_COOKIE = "st_session";
const SESSION_DAYS = 30;
const SESSION_CACHE_MS = 60 * 1000; // 1 minute cache

// User roles
export type UserRole = "firm_manager" | "advisor";

// Simple in-memory session cache
interface CachedSession {
  user: { id: number; email: string; displayName: string | null; role: UserRole };
  expiresAt: Date;
  cachedAt: number;
}

const sessionCache = new Map<string, CachedSession>();

// Clean expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of sessionCache.entries()) {
    if (now - value.cachedAt > SESSION_CACHE_MS || value.expiresAt < new Date()) {
      sessionCache.delete(key);
    }
  }
}, 30000);

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, expected] = String(storedHash || "").split(":");
  if (!salt || !expected) {
    return false;
  }
  const actual = scryptSync(password, salt, 64).toString("hex");
  const actualBuf = Buffer.from(actual, "hex");
  const expectedBuf = Buffer.from(expected, "hex");
  if (actualBuf.length !== expectedBuf.length) {
    return false;
  }
  return timingSafeEqual(actualBuf, expectedBuf);
}

export async function createSession(event: H3Event, userId: number): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const isHttps = getRequestProtocol(event, { xForwardedProto: true }) === "https";

  await prisma.session.create({
    data: { userId, tokenHash, expiresAt }
  });

  setCookie(event, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps,
    expires: expiresAt,
    path: "/"
  });
}

export async function clearUserSession(event: H3Event): Promise<void> {
  const token = getCookie(event, SESSION_COOKIE);
  if (token) {
    const tokenHash = hashToken(token);
    sessionCache.delete(tokenHash);
    await prisma.session.deleteMany({ where: { tokenHash } });
  }
  deleteCookie(event, SESSION_COOKIE, { path: "/" });
}

export async function requireUser(event: H3Event): Promise<{ id: number; email: string; displayName: string | null; role: UserRole }> {
  const token = getCookie(event, SESSION_COOKIE);
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const tokenHash = hashToken(token);

  // Check cache first
  const cached = sessionCache.get(tokenHash);
  if (cached && Date.now() - cached.cachedAt < SESSION_CACHE_MS && cached.expiresAt > new Date()) {
    return cached.user;
  }

  // Cache miss - query database
  const session = await prisma.session.findFirst({
    where: {
      tokenHash,
      expiresAt: { gt: new Date() }
    },
    include: { user: true }
  });

  if (!session?.user) {
    sessionCache.delete(tokenHash);
    deleteCookie(event, SESSION_COOKIE, { path: "/" });
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const user = {
    id: session.user.id,
    email: session.user.email,
    displayName: session.user.displayName,
    role: (session.user.role || "advisor") as UserRole
  };

  // Cache the result
  sessionCache.set(tokenHash, {
    user,
    expiresAt: session.expiresAt,
    cachedAt: Date.now()
  });

  return user;
}

/**
 * Require user to have firm_manager role
 */
export async function requireFirmManager(event: H3Event): Promise<{ id: number; email: string; displayName: string | null; role: UserRole }> {
  const user = await requireUser(event);
  if (user.role !== "firm_manager") {
    throw createError({ statusCode: 403, statusMessage: "Access denied. Firm Manager role required." });
  }
  return user;
}

export async function getOptionalUser(event: H3Event): Promise<{ id: number; email: string; displayName: string | null; role: UserRole } | null> {
  try {
    return await requireUser(event);
  } catch {
    return null;
  }
}
