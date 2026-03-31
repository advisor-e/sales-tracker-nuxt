const express = require('express')
const cookieParser = require('cookie-parser')

const app = express()
const router = express.Router()

app.use(express.json())
app.use(cookieParser())

function handle(fn) {
  return async (req, res, next) => {
    try {
      await fn(req, res)
    } catch (err) {
      if (err.message === 'RESPONSE_SENT') return
      next(err)
    }
  }
}

// Auth
router.post('/auth/login', handle(require('./auth/login.post')))
router.post('/auth/logout', handle(require('./auth/logout.post')))
router.get('/auth/me', handle(require('./auth/me.get')))

// Pipeline
router.get('/pipeline', handle(require('./pipeline/index.get')))
router.post('/pipeline', handle(require('./pipeline/index.post')))
router.patch('/pipeline/:id', handle(require('./pipeline/[id].patch')))
router.delete('/pipeline/:id', handle(require('./pipeline/[id].delete')))

// COI
router.get('/coi/summary', handle(require('./coi/summary.get')))
router.get('/coi', handle(require('./coi/index.get')))
router.post('/coi', handle(require('./coi/index.post')))
router.patch('/coi/:id', handle(require('./coi/[id].patch')))
router.delete('/coi/:id', handle(require('./coi/[id].delete')))

// Dashboard
router.get('/dashboard/metrics', handle(require('./dashboard/metrics.get')))

// Team
router.get('/team/summary', handle(require('./team/summary.get')))

// Lists
router.get('/lists', handle(require('./lists/index.get')))
router.post('/lists', handle(require('./lists/index.post')))

// Blog inputs
router.get('/blog/inputs', handle(require('./blog/inputs/index.get')))
router.post('/blog/inputs', handle(require('./blog/inputs/index.post')))
router.delete('/blog/inputs/:id', handle(require('./blog/inputs/[id].delete')))

// Blog posts
router.get('/blog/posts', handle(require('./blog/posts/index.get')))
router.post('/blog/posts', handle(require('./blog/posts/index.post')))
router.patch('/blog/posts/:id', handle(require('./blog/posts/[id].patch')))
router.delete('/blog/posts/:id', handle(require('./blog/posts/[id].delete')))

// Blog references
router.get('/blog/references', handle(require('./blog/references/index.get')))
router.post('/blog/references', handle(require('./blog/references/index.post')))
router.delete('/blog/references/:id', handle(require('./blog/references/[id].delete')))

// Blog generate
router.post('/blog/generate/draft', handle(require('./blog/generate/draft.post')))
router.post('/blog/generate/final', handle(require('./blog/generate/final.post')))

// Languages
router.get('/languages/translations', handle(require('./languages/translations.get')))
router.post('/languages/translate', handle(require('./languages/translate.post')))
router.get('/languages', handle(require('./languages/index.get')))
router.post('/languages', handle(require('./languages/index.post')))
router.get('/languages/:code', handle(require('./languages/[code].get')))
router.patch('/languages/:code', handle(require('./languages/[code].patch')))
router.delete('/languages/:code', handle(require('./languages/[code].delete')))

// Error handler
router.use((err, req, res, next) => {
  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({ error: 'Validation error', details: err.errors })
  }
  console.error('[api]', err)
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.use(router)

module.exports = app
