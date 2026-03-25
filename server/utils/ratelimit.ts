/**
 * Simple in-memory rate limiter for login attempts
 * Tracks attempts by IP address with sliding window
 */

interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
  blockedUntil: number;
}

const loginAttempts = new Map<string, RateLimitEntry>();

// Configuration
const MAX_ATTEMPTS = 5;           // Max attempts before blocking
const WINDOW_MS = 15 * 60 * 1000; // 15 minute window
const BLOCK_MS = 30 * 60 * 1000;  // 30 minute block after exceeding

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of loginAttempts.entries()) {
    if (now > entry.blockedUntil && now - entry.firstAttempt > WINDOW_MS) {
      loginAttempts.delete(ip);
    }
  }
}, 5 * 60 * 1000);

/**
 * Check if an IP is rate limited
 * Returns { allowed: true } or { allowed: false, retryAfter: seconds }
 */
export function checkLoginRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (!entry) {
    return { allowed: true };
  }

  // Check if currently blocked
  if (entry.blockedUntil > now) {
    return {
      allowed: false,
      retryAfter: Math.ceil((entry.blockedUntil - now) / 1000)
    };
  }

  // Check if window has expired (reset attempts)
  if (now - entry.firstAttempt > WINDOW_MS) {
    loginAttempts.delete(ip);
    return { allowed: true };
  }

  // Check if under limit
  if (entry.attempts < MAX_ATTEMPTS) {
    return { allowed: true };
  }

  // Over limit - block them
  entry.blockedUntil = now + BLOCK_MS;
  return {
    allowed: false,
    retryAfter: Math.ceil(BLOCK_MS / 1000)
  };
}

/**
 * Record a login attempt for an IP
 */
export function recordLoginAttempt(ip: string): void {
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (!entry) {
    loginAttempts.set(ip, {
      attempts: 1,
      firstAttempt: now,
      blockedUntil: 0
    });
    return;
  }

  // Reset if window expired
  if (now - entry.firstAttempt > WINDOW_MS) {
    entry.attempts = 1;
    entry.firstAttempt = now;
    entry.blockedUntil = 0;
  } else {
    entry.attempts++;
  }
}

/**
 * Clear rate limit for an IP (call on successful login)
 */
export function clearLoginRateLimit(ip: string): void {
  loginAttempts.delete(ip);
}

/**
 * Get client IP from request event
 */
export function getClientIP(event: any): string {
  // Check common proxy headers
  const forwarded = getHeader(event, "x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIP = getHeader(event, "x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Fallback to remote address
  return event.node?.req?.socket?.remoteAddress || "unknown";
}

// Import h3 helper
import { getHeader } from "h3";
