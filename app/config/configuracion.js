require('dotenv').config()

module.exports = {
    PORT: process.env.PORT || 3000,
    DB: process.env.MONGODB_URI || process.env.DB || 'mongodb://localhost:27017/prueba-rest9c',
    JWT_SECRET: process.env.JWT_SECRET || 'cambia_esto_por_una_clave_segura',
    FORCE_HTTPS: process.env.FORCE_HTTPS === 'true'
}