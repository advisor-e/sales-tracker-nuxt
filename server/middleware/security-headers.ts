import { defineEventHandler, setHeader } from "h3";

/**
 * Security headers middleware
 * Sets various security headers including CSP, HSTS, etc.
 */
export default defineEventHandler((event) => {
  const isDev = process.env.NODE_ENV !== "production";

  // Content Security Policy - more permissive in dev for Vite HMR
  const csp = isDev
    ? [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "img-src 'self' data: https: blob:",
        "font-src 'self' data: https://fonts.gstatic.com",
        "connect-src 'self' ws: wss: https://api.openai.com",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
      ].join("; ")
    : [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "img-src 'self' data: https:",
        "font-src 'self' data: https://fonts.gstatic.com",
        "connect-src 'self' https://api.openai.com",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
      ].join("; ");

  setHeader(event, "Content-Security-Policy", csp);

  // Prevent clickjacking
  setHeader(event, "X-Frame-Options", "DENY");

  // Prevent MIME type sniffing
  setHeader(event, "X-Content-Type-Options", "nosniff");

  // XSS protection (legacy browsers)
  setHeader(event, "X-XSS-Protection", "1; mode=block");

  // Referrer policy
  setHeader(event, "Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions policy (disable unnecessary features)
  setHeader(event, "Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  // HSTS (only in production with HTTPS)
  if (process.env.NODE_ENV === "production") {
    setHeader(event, "Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
});
