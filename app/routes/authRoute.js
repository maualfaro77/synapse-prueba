const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/authController')
const { body } = require('express-validator')

router.post('/register', [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
], ctrl.register)

router.post('/login', [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').exists().withMessage('La contraseña es requerida')
], ctrl.login)

module.exports = router
