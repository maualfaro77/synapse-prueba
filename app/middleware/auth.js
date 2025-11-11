const jwt = require('jsonwebtoken')
const CONFIG = require('../config/configuracion')

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ message: 'No autorizado' })
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ message: 'Formato de token inválido' })

  const token = parts[1]
  try {
    const payload = jwt.verify(token, CONFIG.JWT_SECRET)
    req.user = payload
    next()
  } catch (e) {
    return res.status(401).json({ message: 'Token inválido' })
  }
}
