const CONFIG = require('./app/config/configuracion')
const app = require('./app/app')
const conexion = require('./app/config/conexion')

// Seguridad en arranque: evitar arrancar en producción con JWT_SECRET por defecto
if (process.env.NODE_ENV === 'production') {
    if (!CONFIG.JWT_SECRET || CONFIG.JWT_SECRET === 'cambia_esto_por_una_clave_segura') {
        console.error('ERROR: JWT_SECRET no está configurado correctamente. Configure una clave segura en la variable de entorno JWT_SECRET antes de iniciar en producción.')
        process.exit(1)
    }
}

// Iniciar conexión y servidor
conexion.connect()

app.listen(CONFIG.PORT, () => {
    console.log('Aplicacion Corriendo en el puerto:', CONFIG.PORT)
})