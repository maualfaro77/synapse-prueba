# 📅 Horario Inteligente

Sistema de gestión de horarios inteligente con autenticación JWT, backend Node.js y frontend HTML/CSS/JavaScript en puertos separados.

## 🏗️ Arquitectura

- **Backend**: Node.js + Express + MongoDB + JWT (Puerto 3000)
- **Frontend**: HTML + CSS + JavaScript + Live Server (Puerto 8080)
- **Base de Datos**: MongoDB local
- **Autenticación**: JWT (JSON Web Tokens)
- **Seguridad**: Bcrypt para hash de contraseñas

## ✨ Características

### 🔐 Sistema de Autenticación
- Registro de usuarios con validación
- Login seguro con JWT
- Protección de rutas por usuario
- Sesiones persistentes
- Logout seguro

### 📋 Gestión de Horarios
- Crear horarios personalizados
- Agregar bloques de tiempo por día
- Sistema de etiquetas
- Vista rápida de calendario
- Operaciones CRUD completas
- Datos asociados por usuario

### 🎨 Interfaz de Usuario
- Diseño moderno y responsive
- Páginas separadas para login/registro
- Validación en tiempo real
- Notificaciones de éxito/error
- Estados de carga

## 🚀 Instalación y Ejecución

### Prerrequisitos
- Node.js (v14 o superior)
- MongoDB (local o remoto)
- npm o yarn

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd horario-inteligente
```

### 2. Backend (Puerto 3000)
```bash
cd backend
npm install

# Configurar variables de entorno (opcional)
cp .env.example .env

# Iniciar servidor
npm start
```

### 3. Frontend (Puerto 8080)
```bash
cd frontend
npm install
npm start
```

### 4. MongoDB
Asegúrate de que MongoDB esté corriendo:
```bash
mongod
```

## 🌐 Acceso a la Aplicación

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3000/api
- **Documentación API**: http://localhost:3000/api/test

## 📡 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión
- `GET /api/auth/profile` - Perfil del usuario (protegido)
- `POST /api/auth/logout` - Cerrar sesión (protegido)

### Horarios (Rutas Protegidas)
- `GET /api/horarios` - Obtener horarios del usuario
- `POST /api/horarios` - Crear nuevo horario
- `GET /api/horarios/:id` - Obtener horario específico
- `PUT /api/horarios/:id` - Actualizar horario
- `DELETE /api/horarios/:id` - Eliminar horario

## 🔧 Configuración

### Variables de Entorno (.env)
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/horario_inteligente
NODE_ENV=development
JWT_SECRET=horario_inteligente_jwt_secret_key_2024
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
```

## 🛡️ Seguridad Implementada

### Principios de Codificación Segura
- ✅ **Validación de entradas**: Email, contraseñas, formularios
- ✅ **Comunicación segura**: Headers CORS configurados
- ✅ **Tokens JWT**: Autenticación sin estado
- ✅ **Hash de contraseñas**: Bcrypt con salt rounds
- ✅ **Protección de rutas**: Middleware de autenticación
- ✅ **Manejo de errores**: Respuestas controladas
- ✅ **Variables de entorno**: Datos sensibles protegidos

## 📱 Flujo de Usuario

1. **Acceso inicial**: Redirección automática a login
2. **Registro/Login**: Autenticación segura
3. **Dashboard**: Vista principal con horarios
4. **Gestión**: CRUD completo de horarios
5. **Logout**: Cierre seguro de sesión

## 🏗️ Estructura del Proyecto

```
horario-inteligente/
├── backend/
│   ├── node_modules/
│   ├── .env
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── node_modules/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── styles.css
│   ├── auth-styles.css
│   ├── script.js
│   ├── auth.js
│   └── package.json
└── README.md
```

## 🧪 Testing

### Probar la API
```bash
# Registro
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test User","email":"test@example.com","password":"123456"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'
```

## 🚀 Despliegue

### Producción
1. Configurar variables de entorno de producción
2. Usar MongoDB Atlas o base de datos remota
3. Configurar HTTPS
4. Desplegar backend en Heroku/Railway/DigitalOcean
5. Desplegar frontend en Netlify/Vercel

## 🛠️ Tecnologías Utilizadas

### Backend
- Node.js
- Express.js
- MongoDB + Mongoose
- JWT (jsonwebtoken)
- Bcrypt
- CORS
- Dotenv

### Frontend
- HTML5
- CSS3 (Grid, Flexbox, Animations)
- JavaScript (ES6+)
- Fetch API
- Live Server

## 👥 Contribución

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request



---

**Desarrollado como parte del proyecto de Integración de Servicios en la Nube** 🎓