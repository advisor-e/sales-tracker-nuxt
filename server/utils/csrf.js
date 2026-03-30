import { randomBytes } from "crypto";
import { getCookie, setCookie, getHeader, createError, getMethod } from "h3";

const CSRF_COOKIE = "csrf_token";
const CSRF_HEADER = "x-csrf-token";
const TOKEN_LENGTH = 32;

/**
 * Generate a new CSRF token
 */
export function generateCSRFToken() {
  return randomBytes(TOKEN_LENGTH).toString("hex");
}

/**
 * Ensure CSRF cookie is set and return the token
 */
export function ensureCSRFToken(event) {
  let token = getCookie(event, CSRF_COOKIE);

  if (!token) {
    token = generateCSRFToken();
    setCookie(event, CSRF_COOKIE, token, {
      httpOnly: false,  // Must be readable by client JS
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24  // 24 hours
    });
  }

  return token;
}

/**
 * Validate CSRF token for state-changing requests
 * Skips validation for:
 * - GET/HEAD/OPTIONS requests
 * - Login endpoint (no cookie yet)
 * - Requests with valid API key header (future API use)
 */
export function validateCSRF(event) {
  const method = getMethod(event);

  // Only check state-changing methods
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return;
  }

  const path = event.path || "";

  // Skip CSRF for login (user doesn't have token yet)
  if (path === "/api/auth/login") {
    return;
  }

  // Skip for non-API routes
  if (!path.startsWith("/api/")) {
    return;
  }

  const cookieToken = getCookie(event, CSRF_COOKIE);
  const headerToken = getHeader(event, CSRF_HEADER);

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    throw createError({
      statusCode: 403,
      statusMessage: "Invalid or missing CSRF token"
    });
  }
}
