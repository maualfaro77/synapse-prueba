
const express = require('express');
const app = express();
const scheduleRouter = require('./routes/scheduleRoute')

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

app.use('/api', scheduleRouter)

module.exports = app
