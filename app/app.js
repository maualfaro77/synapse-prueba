
const express = require('express');
const app = express();
const scheduleRouter = require('./routes/scheduleRoute')
const authRouter = require('./routes/authRoute')

app.use(express.urlencoded({extended: false}))
app.use(express.json())

// servir frontend estático desde la carpeta public (archivo HTML + JS)
app.use(express.static(__dirname + '/../public'))


// API de horario inteligente bajo /api
// middleware CORS simple (permitir peticiones desde frontends locales)
app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*')
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
	if (req.method === 'OPTIONS') {
		res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE')
		return res.status(200).json({})
	}
	next()
})

// endpoints de autenticación
app.use('/api/auth', authRouter)

// API de horario inteligente bajo /api
app.use('/api', scheduleRouter)

// middleware básico para forzar HTTPS si se configura (útil en producción detrás de proxy)
const CONFIG = require('./config/configuracion')
app.use((req, res, next) => {
	if (CONFIG.FORCE_HTTPS && req.headers['x-forwarded-proto'] !== 'https') {
		// redirigir a https
		return res.redirect(`https://${req.headers.host}${req.url}`)
	}
	next()
})

module.exports = app
