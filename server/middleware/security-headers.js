// Nuxt 2 serverMiddleware - Express style
module.exports = function securityHeaders(req, res, next) {
  const isDev = process.env.NODE_ENV !== 'production'

  const csp = isDev
    ? [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "img-src 'self' data: https: blob:",
        "font-src 'self' data: https://fonts.gstatic.com",
        "connect-src 'self' ws: wss: https://api.openai.com",
        "worker-src 'self' blob:",
        "frame-ancestors 'self'",
        "base-uri 'self'",
        "form-action 'self'"
      ].join('; ')
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
      ].join('; ')

  res.setHeader('Content-Security-Policy', csp)
  res.setHeader('X-Frame-Options', isDev ? 'SAMEORIGIN' : 'DENY')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  if (!isDev) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }

  next()
}
