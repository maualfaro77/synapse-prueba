# Horario Inteligente - API y Frontend

API REST con Node.js + Express + MongoDB para gestionar horarios inteligentes con detección automática del bloque/módulo actual. Incluye frontend responsive compatible con Cordova para Android.

---

## 📋 Requisitos previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (v16 o superior) - [Descargar aquí](https://nodejs.org/)
- **MongoDB** (v5 o superior) - [Descargar aquí](https://www.mongodb.com/try/download/community)
- **Git** (opcional, para clonar) - [Descargar aquí](https://git-scm.com/)

---

## 🚀 Instalación y configuración

### 1. Clonar o descargar el proyecto

```bash
# Si usas Git:
git clone https://github.com/maualfaro77/rest-prueba9c.git
cd rest-prueba9c

# O simplemente descarga el ZIP y extrae la carpeta
```

### 2. Instalar dependencias

Abre una terminal (cmd, PowerShell o Git Bash) en la carpeta del proyecto y ejecuta:

```bash
npm install
```

Esto instalará todas las dependencias necesarias:
- `express` - Framework web
- `mongoose` - ODM para MongoDB
- `nodemon` - Reinicio automático en desarrollo
- `jest`, `supertest`, `mongodb-memory-server` - Testing

### 3. Configurar MongoDB

**Opción A: MongoDB local (recomendado para desarrollo)**

1. Inicia MongoDB en tu equipo:
   - **Windows**: abre Services y busca "MongoDB Server" o ejecuta `mongod` en terminal
   - **Mac/Linux**: ejecuta `brew services start mongodb-community` o `sudo systemctl start mongod`

2. Verifica que MongoDB esté corriendo en `mongodb://localhost:27017`

**Opción B: MongoDB Atlas (cloud)**

1. Crea una cuenta gratuita en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crea un cluster y obtén la cadena de conexión
3. Edita `app/config/configuracion.js` y reemplaza la URI:

```javascript
const URI = 'tu-cadena-de-conexion-de-atlas-aquí';
```

### 4. Verificar configuración

Abre `app/config/configuracion.js` y asegúrate de que los valores sean correctos:

```javascript
const PORT = 3000; // Puerto del servidor
const URI = 'mongodb://localhost:27017/horario-inteligente'; // URI de MongoDB
```

---

## ▶️ Ejecutar el proyecto

### Modo desarrollo (con auto-reload)

```bash
npm run dev
```

El servidor se iniciará en `http://localhost:3000`

### Modo producción

```bash
npm start
```

---

## 🧪 Ejecutar tests

El proyecto incluye tests unitarios y de integración:

```bash
# Ejecutar todos los tests con reporte de cobertura
npm test
```

Los tests usan una base de datos en memoria (`mongodb-memory-server`) por lo que no afectarán tu BD de desarrollo.

---

## 📡 Endpoints de la API

### Horarios

- `GET /api/schedules` - Listar todos los horarios
- `POST /api/schedules` - Crear un horario nuevo
  ```json
  {
    "name": "Horario de Clases",
    "user": "Juan Pérez"
  }
  ```
- `GET /api/schedules/:id` - Obtener un horario específico
- `DELETE /api/schedules/:id` - Eliminar un horario

### Bloques (módulos de tiempo)

- `POST /api/schedules/:id/blocks` - Agregar bloque a un horario
  ```json
  {
    "day": 1,
    "start": "08:00",
    "end": "10:00",
    "title": "Matemáticas",
    "tag": "id-del-tag"
  }
  ```
- `PUT /api/schedules/:scheduleId/blocks/:blockId` - Actualizar un bloque
- `DELETE /api/schedules/:scheduleId/blocks/:blockId` - Eliminar un bloque

### Detección de módulo actual

- `GET /api/schedules/:id/current` - Obtener módulo anterior/actual/siguiente según la hora actual
  ```json
  {
    "previous": { "start": "06:00", "end": "08:00", "title": "Desayuno" },
    "current": { "start": "08:00", "end": "10:00", "title": "Matemáticas" },
    "next": { "start": "10:00", "end": "12:00", "title": "Historia" }
  }
  ```

### Etiquetas (Tags)

- `GET /api/tags` - Listar todas las etiquetas
- `POST /api/tags` - Crear una etiqueta
  ```json
  {
    "name": "Materia",
    "color": "#9F598E"
  }
  ```

---

## 🎨 Frontend

El frontend está en la carpeta `public/` y se sirve automáticamente cuando ejecutas el servidor.

### Acceder al frontend

Abre tu navegador y ve a:

```
http://localhost:3000
```

### Características del frontend

- ✅ Vista rápida: muestra módulo anterior/actual/siguiente
- ✅ Gestión de horarios: crear, listar, seleccionar
- ✅ Gestión de bloques: agregar, editar, eliminar con validaciones
- ✅ Gestión de etiquetas: crear y asignar a bloques
- ✅ Responsive: diseño móvil con sidebar colapsable
- ✅ Animaciones suaves y focus-trap para accesibilidad
- ✅ Compatible con Cordova para empaquetar como app Android

---

## 📱 Compilar como app móvil (Cordova)

### Requisitos adicionales

- Apache Cordova CLI: `npm install -g cordova`
- Android Studio (para Android)

### Pasos para Android

1. Inicializa Cordova en una carpeta separada:

```bash
cordova create mobile com.tuempresa.horario HorarioInteligente
cd mobile
```

2. Agrega la plataforma Android:

```bash
cordova platform add android
```

3. Copia el contenido de `public/` a `www/`:

```bash
# En Windows:
xcopy ..\public\* www\ /E /Y

# En Mac/Linux:
cp -r ../public/* www/
```

4. Compila y ejecuta:

```bash
cordova build android
cordova run android
```

**Nota**: En producción, la app necesitará apuntar a un servidor remoto (no `localhost:3000`). Modifica la variable `API_URL` en `public/app.js`.

---

## 📂 Estructura del proyecto

```
api-syn-prb/
├── app/
│   ├── app.js                    # Configuración Express, middleware CORS
│   ├── config/
│   │   ├── configuracion.js      # Variables PORT y URI MongoDB
│   │   └── conexion.js           # Singleton conexión Mongoose
│   ├── controllers/
│   │   └── scheduleController.js # Lógica CRUD schedules/blocks/tags
│   ├── models/
│   │   ├── scheduleModel.js      # Modelo Schedule con bloques embebidos
│   │   └── tagModel.js           # Modelo Tag
│   ├── routes/
│   │   └── scheduleRoute.js      # Definición endpoints API
│   ├── utils/
│   │   ├── timeUtils.js          # Parsing HH:mm, detección overlaps
│   │   └── scheduleUtils.js      # Cálculo módulo actual/anterior/siguiente
│   └── tests/                    # Tests unitarios e integración
│       ├── timeUtils.test.js
│       ├── scheduleUtils.test.js
│       ├── timeUtils.findOverlaps.test.js
│       └── integration/
│           ├── blocks.int.test.js
│           └── blocks.modify.int.test.js
├── public/                       # Frontend (HTML/CSS/JS)
│   ├── index.html                # Estructura UI con sidebar
│   ├── styles.css                # Estilos con paleta Figma
│   └── app.js                    # Lógica cliente (fetch API, animaciones)
├── config.xml                    # Configuración Cordova
├── package.json                  # Dependencias y scripts npm
├── server.js                     # Entry point del servidor
└── README.md                     # Este archivo
```

---

## 🔧 Troubleshooting

### MongoDB no se conecta

- **Verifica que MongoDB esté corriendo**: abre Services (Windows) o ejecuta `sudo systemctl status mongod` (Linux)
- **Revisa la URI en `app/config/configuracion.js`**: debe coincidir con tu configuración local o Atlas
- **Error de autenticación en Atlas**: verifica que la IP esté en la whitelist y las credenciales sean correctas

### El puerto 3000 ya está en uso

```bash
# Cambia el puerto en app/config/configuracion.js
const PORT = 3001; // Usa otro puerto disponible

# O mata el proceso que usa el puerto 3000:
# Windows PowerShell:
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process

# Mac/Linux:
lsof -ti:3000 | xargs kill
```

### Los tests fallan

```bash
# Limpia la caché de Jest y reinstala:
npm run test -- --clearCache
rm -rf node_modules
npm install
npm test
```

### El frontend no carga o muestra errores

- **Verifica que el servidor esté corriendo** en `http://localhost:3000`
- **Abre la consola del navegador** (F12) para ver errores de JavaScript
- **Limpia la caché del navegador** (Ctrl+Shift+Del)
- **Verifica que `public/` contenga los archivos**: `index.html`, `styles.css`, `app.js`

---

## 👥 Colaboración en equipo

### Buenas prácticas

1. **No subas `node_modules/`** - Ya está en `.gitignore`
2. **Usa `.env` para configuración sensible** (opcional):
   - Crea un archivo `.env.example` con variables de ejemplo
   - Cada desarrollador copia `.env.example` a `.env` y ajusta sus valores
   - Instala `dotenv`: `npm install dotenv`
   - Carga en `app/config/configuracion.js`: `require('dotenv').config();`

3. **Ejecuta tests antes de hacer commit**:
   ```bash
   npm test
   ```

4. **Usa branches para nuevas features**:
   ```bash
   git checkout -b feature/nueva-funcionalidad
   # Haz tus cambios
   git add .
   git commit -m "Añade nueva funcionalidad"
   git push origin feature/nueva-funcionalidad
   ```

### Compartir el proyecto

**Opción 1: Repositorio Git**
- Sube el proyecto a GitHub/GitLab/Bitbucket
- Comparte el enlace del repositorio
- Los compañeros clonan y siguen las instrucciones de este README

**Opción 2: Carpeta comprimida**
- Comprime la carpeta del proyecto (sin `node_modules/`)
- Comparte el ZIP
- Los compañeros descomprimen y ejecutan `npm install`

---

## 📄 Licencia

Este proyecto es de uso interno. Consulta con tu equipo antes de distribuir.

---

## 🆘 Soporte

Si tienes problemas al configurar el proyecto:

1. Revisa que todos los requisitos previos estén instalados
2. Verifica que MongoDB esté corriendo
3. Consulta la sección de Troubleshooting
4. Revisa los logs en la terminal para ver errores específicos

**Desarrollado con ❤️ para gestión inteligente de horarios**

2. Copia los ficheros de `public/` dentro de `www/` del proyecto Cordova o apunta el `<content src="index.html" />` en `config.xml` al archivo correcto.
3. En la app Cordova, asegúrate de configurar `config.xml` con los orígenes permitidos o usa `cordova-plugin-whitelist`.
4. Si quieres evitar depender de la API remota en pruebas, puedes implementar sincronización local con `localStorage` o SQLite y una lógica de sincronización.

Endpoints relevantes (ejemplos)
- POST /api/tags  — crear tag
- GET  /api/tags  — listar tags
- POST /api/schedules — crear horario
- GET  /api/schedules — listar horarios
- POST /api/schedules/:id/blocks — agregar bloque
- PUT  /api/schedules/:id/blocks/:blockId — actualizar bloque
- DELETE /api/schedules/:id/blocks/:blockId — eliminar bloque
- GET  /api/schedules/:id/current — obtener previous/current/next (usa query `?now=` para simular otra hora)

Código de conflicto
- Si un bloque se solapa, la API devuelve HTTP 409 con JSON:

```json
{
  "message": "El bloque se solapa con otro existente",
  "conflictingBlocks": [ { "id": "...", "day": 1, "start": "08:00", "end": "10:00", "title": "Matemáticas" } ]
}
```

Próximos pasos sugeridos
- Mejorar la UI para editar/crear bloques desde la app móvil.
- Implementar sincronización offline (local DB) para uso sin conexión (Cordova + SQLite).
- Añadir autenticación si habrá múltiples usuarios.

Si quieres, puedo:
- Generar un `www/` listo para copiar a un proyecto Cordova.
- Convertir la UI a una SPA con manejo offline (localStorage/SQLite) y sincronización.
- Mejorar la UI (edición de bloques, tags, UX). 

Dime cuál prefieres y lo implemento.
