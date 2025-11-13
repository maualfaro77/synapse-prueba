const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/horario_inteligente';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log(' Conectado a MongoDB'))
.catch(err => console.error(' Error conectando a MongoDB:', err));

// Schema para horarios
const horarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  propietario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  bloques: [{
    dia: {
      type: String,
      required: true,
      enum: ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']
    },
    horaInicio: {
      type: String,
      required: true
    },
    horaFin: {
      type: String,
      required: true
    },
    materia: {
      type: String,
      required: true,
      trim: true
    }
  }],
  etiquetas: [{
    type: String,
    trim: true
  }],
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  fechaActualizacion: {
    type: Date,
    default: Date.now
  }
});

// Middleware para actualizar fechaActualizacion
horarioSchema.pre('save', function(next) {
  this.fechaActualizacion = Date.now();
  next();
});

const Horario = mongoose.model('Horario', horarioSchema);

// Schema para usuarios
const usuarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    minlength: [2, 'El nombre debe tener al menos 2 caracteres']
  },
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Email inválido']
  },
  password: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
usuarioSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
usuarioSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
usuarioSchema.methods.generateAuthToken = function() {
  const payload = {
    id: this._id,
    email: this.email,
    nombre: this.nombre
  };
  
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'horario_inteligente_jwt_secret_key_2024',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const Usuario = mongoose.model('Usuario', usuarioSchema);

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'horario_inteligente_jwt_secret_key_2024');
    const user = await Usuario.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido',
      error: error.message
    });
  }
};

// Authentication Routes

// POST - Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await Usuario.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'El usuario ya existe con este email'
      });
    }
    
    // Create new user
    const newUser = new Usuario({ nombre, email, password });
    await newUser.save();
    
    // Generate token
    const token = newUser.generateAuthToken();
    
    // Return user data (without password)
    const userData = {
      id: newUser._id,
      nombre: newUser.nombre,
      email: newUser.email,
      fechaCreacion: newUser.fechaCreacion
    };
    
    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user: userData,
        token: token
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al registrar usuario',
      error: error.message
    });
  }
});

// POST - Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await Usuario.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }
    
    // Generate token
    const token = user.generateAuthToken();
    
    // Return user data (without password)
    const userData = {
      id: user._id,
      nombre: user.nombre,
      email: user.email,
      fechaCreacion: user.fechaCreacion
    };
    
    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: userData,
        token: token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error en el login',
      error: error.message
    });
  }
});

// GET - Get user profile
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil',
      error: error.message
    });
  }
});

// POST - Logout (client-side mainly)
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Logout exitoso'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error en logout',
      error: error.message
    });
  }
});

// Rutas CRUD (Protected)

// GET - Obtener todos los horarios del usuario autenticado
app.get('/api/horarios', authenticateToken, async (req, res) => {
  try {
    const horarios = await Horario.find({ propietario: req.user._id })
      .populate('propietario', 'nombre email')
      .sort({ fechaCreacion: -1 });
    res.json({
      success: true,
      data: horarios,
      count: horarios.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener horarios',
      error: error.message
    });
  }
});

// GET - Obtener un horario por ID (solo del usuario autenticado)
app.get('/api/horarios/:id', authenticateToken, async (req, res) => {
  try {
    const horario = await Horario.findOne({ 
      _id: req.params.id, 
      propietario: req.user._id 
    }).populate('propietario', 'nombre email');
    
    if (!horario) {
      return res.status(404).json({
        success: false,
        message: 'Horario no encontrado'
      });
    }
    res.json({
      success: true,
      data: horario
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener horario',
      error: error.message
    });
  }
});

// POST - Crear nuevo horario
app.post('/api/horarios', authenticateToken, async (req, res) => {
  try {
    const horarioData = {
      ...req.body,
      propietario: req.user._id
    };
    
    const nuevoHorario = new Horario(horarioData);
    const horarioGuardado = await nuevoHorario.save();
    
    // Populate para devolver datos del propietario
    await horarioGuardado.populate('propietario', 'nombre email');
    
    res.status(201).json({
      success: true,
      message: 'Horario creado exitosamente',
      data: horarioGuardado
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al crear horario',
      error: error.message
    });
  }
});

// PUT - Actualizar horario (solo del usuario autenticado)
app.put('/api/horarios/:id', authenticateToken, async (req, res) => {
  try {
    const horarioActualizado = await Horario.findOneAndUpdate(
      { _id: req.params.id, propietario: req.user._id },
      req.body,
      { new: true, runValidators: true }
    ).populate('propietario', 'nombre email');
    
    if (!horarioActualizado) {
      return res.status(404).json({
        success: false,
        message: 'Horario no encontrado'
      });
    }
    res.json({
      success: true,
      message: 'Horario actualizado exitosamente',
      data: horarioActualizado
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al actualizar horario',
      error: error.message
    });
  }
});

// DELETE - Eliminar horario (solo del usuario autenticado)
app.delete('/api/horarios/:id', authenticateToken, async (req, res) => {
  try {
    const horarioEliminado = await Horario.findOneAndDelete({
      _id: req.params.id,
      propietario: req.user._id
    });
    
    if (!horarioEliminado) {
      return res.status(404).json({
        success: false,
        message: 'Horario no encontrado'
      });
    }
    res.json({
      success: true,
      message: 'Horario eliminado exitosamente',
      data: horarioEliminado
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar horario',
      error: error.message
    });
  }
});

// Ruta de prueba
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 API disponible en http://localhost:${PORT}/api`);
});