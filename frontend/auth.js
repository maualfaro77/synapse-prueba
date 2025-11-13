// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// Global variables
let currentUser = null;
let authToken = null;

// DOM Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const notificationsContainer = document.getElementById('notifications');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
}

// Check if user is already authenticated
function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('currentUser');
    
    if (token && user) {
        authToken = token;
        currentUser = JSON.parse(user);
        // Redirect to main app if already authenticated
        window.location.href = 'index.html';
    }
}

// Handle Login
async function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const loginData = {
        email: formData.get('email'),
        password: formData.get('password')
    };
    
    // Validate form
    if (!validateLoginForm(loginData)) {
        return;
    }
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    setButtonLoading(submitButton, true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Error en el login');
        }
        
        // Save auth data
        authToken = data.data.token;
        currentUser = data.data.user;
        
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        showNotification(`¡Bienvenido ${currentUser.nombre}!`, 'success');
        
        // Redirect to main app
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        
    } catch (error) {
        showNotification(error.message, 'error');
    } finally {
        setButtonLoading(submitButton, false);
    }
}

// Handle Register
async function handleRegister(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const registerData = {
        nombre: formData.get('nombre'),
        email: formData.get('email'),
        password: formData.get('password')
    };
    
    // Validate form
    if (!validateRegisterForm(registerData)) {
        return;
    }
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    setButtonLoading(submitButton, true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(registerData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Error en el registro');
        }
        
        // Save auth data
        authToken = data.data.token;
        currentUser = data.data.user;
        
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        showNotification(`¡Cuenta creada exitosamente! Bienvenido ${currentUser.nombre}`, 'success');
        
        // Redirect to main app
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        
    } catch (error) {
        showNotification(error.message, 'error');
    } finally {
        setButtonLoading(submitButton, false);
    }
}

// Form Validation
function validateLoginForm(data) {
    if (!data.email || !data.password) {
        showNotification('Por favor completa todos los campos', 'error');
        return false;
    }
    
    if (!isValidEmail(data.email)) {
        showNotification('Por favor ingresa un email válido', 'error');
        return false;
    }
    
    return true;
}

function validateRegisterForm(data) {
    if (!data.nombre || !data.email || !data.password) {
        showNotification('Por favor completa todos los campos', 'error');
        return false;
    }
    
    if (data.nombre.trim().length < 2) {
        showNotification('El nombre debe tener al menos 2 caracteres', 'error');
        return false;
    }
    
    if (!isValidEmail(data.email)) {
        showNotification('Por favor ingresa un email válido', 'error');
        return false;
    }
    
    if (data.password.length < 6) {
        showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
        return false;
    }
    
    return true;
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Button loading state
function setButtonLoading(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        button.dataset.originalText = button.textContent;
        button.textContent = 'Cargando...';
    } else {
        button.disabled = false;
        button.textContent = button.dataset.originalText || button.textContent;
    }
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    notificationsContainer.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Enhanced form interactions
document.addEventListener('DOMContentLoaded', () => {
    // Add real-time validation feedback
    const inputs = document.querySelectorAll('input');
    
    inputs.forEach(input => {
        input.addEventListener('blur', validateInput);
        input.addEventListener('input', clearValidationError);
    });
});

function validateInput(e) {
    const input = e.target;
    const value = input.value.trim();
    
    // Remove previous error styling
    input.classList.remove('error');
    
    // Validate based on input type
    switch (input.type) {
        case 'email':
            if (value && !isValidEmail(value)) {
                input.classList.add('error');
            }
            break;
        case 'password':
            if (value && value.length < 6) {
                input.classList.add('error');
            }
            break;
        case 'text':
            if (input.name === 'nombre' && value && value.length < 2) {
                input.classList.add('error');
            }
            break;
    }
}

function clearValidationError(e) {
    e.target.classList.remove('error');
}

// Add error styling to CSS
const style = document.createElement('style');
style.textContent = `
    .form-group input.error {
        border-color: #dc2626 !important;
        box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.2) !important;
    }
`;
document.head.appendChild(style);

// Console log for debugging
console.log('🔐 Auth system initialized');
console.log('🌐 API URL:', API_BASE_URL);