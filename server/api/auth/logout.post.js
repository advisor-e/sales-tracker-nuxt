const { clearUserSession } = require('../../utils/auth')

module.exports = async function(req, res) {
  await clearUserSession(req, res)
  return res.json({ ok: true })
}
