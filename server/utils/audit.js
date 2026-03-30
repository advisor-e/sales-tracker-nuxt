import { getHeader } from "h3";
import { prisma } from "./db";
import { getClientIP } from "./ratelimit";

/**
 * Log an audit event
 * Non-blocking - errors are caught and logged but don't affect the request
 */
export async function logAudit(event, data) {
  try {
    const ipAddress = getClientIP(event);
    const userAgent = getHeader(event, "user-agent")?.slice(0, 500) || null;

    await prisma.auditLog.create({
      data: {
        userId: data.userId ?? null,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId ?? null,
        changes: data.changes ? JSON.stringify(data.changes) : null,
        ipAddress,
        userAgent
      }
    });
  } catch (error) {
    // Log to console but don't fail the request
    console.error("[audit] Failed to log audit event:", error);
  }
}

/**
 * Helper to log a CREATE action
 */
export function logCreate(event, userId, entityType, entityId, data) {
  logAudit(event, {
    userId,
    action: "CREATE",
    entityType,
    entityId,
    changes: data
  });
}

/**
 * Helper to log an UPDATE action
 */
export function logUpdate(event, userId, entityType, entityId, changes) {
  logAudit(event, {
    userId,
    action: "UPDATE",
    entityType,
    entityId,
    changes
  });
}

/**
 * Helper to log a DELETE action
 */
export function logDelete(event, userId, entityType, entityId) {
  logAudit(event, {
    userId,
    action: "DELETE",
    entityType,
    entityId
  });
}

/**
 * Helper to log a LOGIN action
 */
export function logLogin(event, userId, email) {
  logAudit(event, {
    userId,
    action: "LOGIN",
    entityType: "User",
    entityId: userId,
    changes: { email }
  });
}

/**
 * Helper to log a LOGOUT action
 */
export function logLogout(event, userId) {
  logAudit(event, {
    userId,
    action: "LOGOUT",
    entityType: "User",
    entityId: userId
  });
}
