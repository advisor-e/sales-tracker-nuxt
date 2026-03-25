import { defineEventHandler, setHeader } from "h3";

/**
 * Security headers middleware
 * Sets various security headers including CSP, HSTS, etc.
 */
export default defineEventHandler((event) => {
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",  // Nuxt requires unsafe-inline/eval for dev
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
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
