const User = require('../models/userModel')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { validationResult } = require('express-validator')
const CONFIG = require('../config/configuracion')

exports.register = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

  const { email, password } = req.body
  try {
    const exists = await User.findOne({ email })
    if (exists) return res.status(409).json({ message: 'Usuario ya existe' })

    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)
    const user = new User({ email, password: hash })
    await user.save()
    return res.status(201).json({ message: 'Usuario creado' })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ message: 'Error interno' })
  }
}

exports.login = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

  const { email, password } = req.body
  try {
    const user = await User.findOne({ email })
    if (!user) return res.status(401).json({ message: 'Credenciales inválidas' })

    const match = await bcrypt.compare(password, user.password)
    if (!match) return res.status(401).json({ message: 'Credenciales inválidas' })

    const token = jwt.sign({ sub: user._id, email: user.email }, CONFIG.JWT_SECRET, { expiresIn: '8h' })
    return res.json({ token })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ message: 'Error interno' })
  }
}
