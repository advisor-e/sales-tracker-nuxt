import { defineEventHandler } from "h3";
import { ensureCSRFToken, validateCSRF } from "../utils/csrf";

export default defineEventHandler((event) => {
  // Ensure CSRF token cookie exists
  ensureCSRFToken(event);

  // Validate CSRF for state-changing requests
  validateCSRF(event);
});
