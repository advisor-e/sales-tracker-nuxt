import { H3Event, getHeader } from "h3";
import { prisma } from "./db";
import { getClientIP } from "./ratelimit";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT";

export interface AuditLogData {
  userId?: number | null;
  action: AuditAction;
  entityType: string;
  entityId?: number | null;
  changes?: Record<string, any> | null;
}

/**
 * Log an audit event
 * Non-blocking - errors are caught and logged but don't affect the request
 */
export async function logAudit(event: H3Event, data: AuditLogData): Promise<void> {
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
export function logCreate(event: H3Event, userId: number, entityType: string, entityId: number, data?: Record<string, any>): void {
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
export function logUpdate(event: H3Event, userId: number, entityType: string, entityId: number, changes?: Record<string, any>): void {
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
export function logDelete(event: H3Event, userId: number, entityType: string, entityId: number): void {
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
export function logLogin(event: H3Event, userId: number, email: string): void {
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
export function logLogout(event: H3Event, userId: number): void {
  logAudit(event, {
    userId,
    action: "LOGOUT",
    entityType: "User",
    entityId: userId
  });
}
