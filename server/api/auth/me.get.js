const { getOptionalUser } = require('../../utils/auth')

module.exports = async function(req, res) {
  const user = await getOptionalUser(req)
  return res.json({
    authenticated: Boolean(user),
    user
  })
}
