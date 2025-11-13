// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// Frontend runs on port 8080, Backend on port 3000
console.log('🌐 Frontend running on: http://localhost:8080');
console.log('🔗 Backend API URL:', API_BASE_URL);

// Global state
let currentHorario = null;
let horarios = [];
let currentUser = null;
let authToken = null;

// DOM Elements
const horarioForm = document.getElementById('horarioForm');
const bloqueForm = document.getElementById('bloqueForm');
const etiquetaForm = document.getElementById('etiquetaForm');
const listaHorarios = document.getElementById('listaHorarios');
const manageSection = document.getElementById('manageSection');
const bloquesList = document.getElementById('bloquesList');
const etiquetasList = document.getElementById('etiquetasList');
const refreshBtn = document.getElementById('refreshBtn');

// Auth DOM Elements (may not exist on all pages)
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const authButtons = document.getElementById('authButtons');
const userInfo = document.getElementById('userInfo');
const userName = document.getElementById('userName');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    // Main app event listeners (only if elements exist)
    if (horarioForm) horarioForm.addEventListener('submit', handleCreateHorario);
    if (bloqueForm) bloqueForm.addEventListener('submit', handleAddBloque);
    if (etiquetaForm) etiquetaForm.addEventListener('submit', handleAddEtiqueta);
    if (refreshBtn) refreshBtn.addEventListener('click', loadHorarios);
    
    // Auth event listeners (only if elements exist)
    if (loginBtn) loginBtn.addEventListener('click', () => openModal('loginModal'));
    if (registerBtn) registerBtn.addEventListener('click', () => openModal('registerModal'));
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (registerForm) registerForm.addEventListener('submit', handleRegister);
    
    // Close modals on outside click
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });
}

// API Functions
async function apiRequest(endpoint, options = {}) {
    try {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        // Add auth token if available
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers,
            ...options
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Error en la petición');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        
        // Handle auth errors
        if (error.message.includes('Token') || error.message.includes('401')) {
            handleAuthError();
            return;
        }
        
        showError(error.message);
        throw error;
    }
}

// Load all horarios
async function loadHorarios() {
    if (!authToken) {
        listaHorarios.innerHTML = '<div class="error">🔒 Inicia sesión para ver tus horarios</div>';
        return;
    }
    
    try {
        showLoading(listaHorarios);
        const response = await apiRequest('/horarios');
        horarios = response.data;
        renderHorarios();
        
        // Update quick view if a horario is selected
        if (currentHorario) {
            const updatedHorario = horarios.find(h => h._id === currentHorario._id);
            if (updatedHorario) {
                currentHorario = updatedHorario;
                updateQuickView();
            }
        }
    } catch (error) {
        listaHorarios.innerHTML = '<div class="error">❌ Error al cargar horarios. Verifica que el backend esté corriendo.</div>';
    }
}

// Render horarios list
function renderHorarios() {
    if (horarios.length === 0) {
        listaHorarios.innerHTML = '<p style="color: rgba(255,255,255,0.7);">No hay horarios creados</p>';
        return;
    }
    
    listaHorarios.innerHTML = horarios.map(horario => `
        <div class="horario-item ${currentHorario && currentHorario._id === horario._id ? 'selected' : ''}" 
             onclick="selectHorario('${horario._id}')">
            <div class="horario-header">
                <div class="horario-name">${horario.nombre}</div>
                <button class="btn-delete" onclick="deleteHorario('${horario._id}', event)">🗑️</button>
            </div>
            <div class="horario-info">
                ${horario.propietario ? `Propietario: ${horario.propietario}` : 'Sin propietario'}
                <br>
                ${horario.bloques.length} bloques • ${horario.etiquetas.length} etiquetas
                <br>
                Creado: ${new Date(horario.fechaCreacion).toLocaleDateString()}
            </div>
        </div>
    `).join('');
}

// Create new horario
async function handleCreateHorario(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    // Validate form
    if (!validateHorarioForm(formData)) {
        return;
    }
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    setButtonLoading(submitButton, true);
    
    const horarioData = {
        nombre: formData.get('nombre').trim(),
        propietario: formData.get('propietario').trim() || '',
        bloques: [],
        etiquetas: []
    };
    
    try {
        const response = await apiRequest('/horarios', {
            method: 'POST',
            body: JSON.stringify(horarioData)
        });
        
        showSuccess(`✅ Horario "${horarioData.nombre}" creado exitosamente`);
        e.target.reset();
        loadHorarios();
        
        // Auto-select the new horario
        setTimeout(() => {
            selectHorario(response.data._id);
        }, 500);
        
    } catch (error) {
        // Error already handled in apiRequest
    } finally {
        setButtonLoading(submitButton, false);
    }
}

// Select horario for editing
async function selectHorario(id) {
    try {
        const response = await apiRequest(`/horarios/${id}`);
        currentHorario = response.data;
        
        // Show manage section
        if (manageSection) manageSection.style.display = 'block';
        
        // Update UI
        renderHorarios();
        renderBloques();
        renderEtiquetas();
        updateQuickView(); // Add quick view update
        
        // Scroll to manage section
        if (manageSection) manageSection.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        // Error already handled in apiRequest
    }
}

// Delete horario
async function deleteHorario(id, event) {
    event.stopPropagation();
    
    if (!confirm('¿Estás seguro de que quieres eliminar este horario?')) {
        return;
    }
    
    try {
        await apiRequest(`/horarios/${id}`, { method: 'DELETE' });
        showSuccess('Horario eliminado exitosamente');
        
        if (currentHorario && currentHorario._id === id) {
            currentHorario = null;
            if (manageSection) manageSection.style.display = 'none';
        }
        
        loadHorarios();
    } catch (error) {
        // Error already handled in apiRequest
    }
}

// Add bloque to current horario
async function handleAddBloque(e) {
    e.preventDefault();
    
    if (!currentHorario) {
        showError('⚠️ Selecciona un horario primero');
        return;
    }
    
    const formData = new FormData(e.target);
    
    // Validate form
    if (!validateBloqueForm(formData)) {
        return;
    }
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    setButtonLoading(submitButton, true);
    
    const nuevoBloque = {
        dia: formData.get('dia'),
        horaInicio: formData.get('horaInicio'),
        horaFin: formData.get('horaFin'),
        materia: formData.get('materia').trim()
    };
    
    // Add to current horario
    currentHorario.bloques.push(nuevoBloque);
    
    try {
        await apiRequest(`/horarios/${currentHorario._id}`, {
            method: 'PUT',
            body: JSON.stringify(currentHorario)
        });
        
        showSuccess(`✅ Bloque de ${nuevoBloque.materia} agregado para ${nuevoBloque.dia}`);
        e.target.reset();
        renderBloques();
        updateQuickView();
        loadHorarios(); // Refresh the list
    } catch (error) {
        // Remove the bloque if save failed
        currentHorario.bloques.pop();
    } finally {
        setButtonLoading(submitButton, false);
    }
}

// Render bloques
function renderBloques() {
    if (!currentHorario || currentHorario.bloques.length === 0) {
        if (bloquesList) bloquesList.innerHTML = '<p style="color: rgba(255,255,255,0.7);">No hay bloques agregados</p>';
        return;
    }
    
    if (bloquesList) bloquesList.innerHTML = currentHorario.bloques.map((bloque, index) => `
        <div class="bloque-item">
            <div class="bloque-info">
                <div class="bloque-dia">${bloque.dia}</div>
                <div class="bloque-tiempo">${bloque.horaInicio} - ${bloque.horaFin}</div>
                <div class="bloque-materia">${bloque.materia}</div>
            </div>
            <button class="btn-delete" onclick="removeBloque(${index})">🗑️</button>
        </div>
    `).join('');
}

// Remove bloque
async function removeBloque(index) {
    if (!currentHorario) return;
    
    currentHorario.bloques.splice(index, 1);
    
    try {
        await apiRequest(`/horarios/${currentHorario._id}`, {
            method: 'PUT',
            body: JSON.stringify(currentHorario)
        });
        
        showSuccess('Bloque eliminado exitosamente');
        renderBloques();
        updateQuickView();
        loadHorarios();
    } catch (error) {
        // Restore the bloque if save failed
        loadHorarios();
        selectHorario(currentHorario._id);
    }
}

// Add etiqueta to current horario
async function handleAddEtiqueta(e) {
    e.preventDefault();
    
    if (!currentHorario) {
        showError('⚠️ Selecciona un horario primero');
        return;
    }
    
    const formData = new FormData(e.target);
    const nuevaEtiqueta = formData.get('nuevaEtiqueta');
    
    if (currentHorario.etiquetas.includes(nuevaEtiqueta)) {
        showError('Esta etiqueta ya existe');
        return;
    }
    
    currentHorario.etiquetas.push(nuevaEtiqueta);
    
    try {
        await apiRequest(`/horarios/${currentHorario._id}`, {
            method: 'PUT',
            body: JSON.stringify(currentHorario)
        });
        
        showSuccess('Etiqueta agregada exitosamente');
        e.target.reset();
        renderEtiquetas();
        updateQuickView();
        loadHorarios();
    } catch (error) {
        currentHorario.etiquetas.pop();
    }
}

// Render etiquetas
function renderEtiquetas() {
    if (!currentHorario || currentHorario.etiquetas.length === 0) {
        if (etiquetasList) etiquetasList.innerHTML = '<p style="color: rgba(255,255,255,0.7);">No hay etiquetas agregadas</p>';
        return;
    }
    
    if (etiquetasList) etiquetasList.innerHTML = currentHorario.etiquetas.map((etiqueta, index) => `
        <div class="etiqueta-item" style="background: rgba(124, 58, 237, 0.3); border: 1px solid #7c3aed;">
            <div class="etiqueta-color" style="background: #7c3aed;"></div>
            <span>${etiqueta}</span>
            <button class="btn-delete" onclick="removeEtiqueta(${index})" style="margin-left: 8px;">×</button>
        </div>
    `).join('');
}

// Remove etiqueta
async function removeEtiqueta(index) {
    if (!currentHorario) return;
    
    currentHorario.etiquetas.splice(index, 1);
    
    try {
        await apiRequest(`/horarios/${currentHorario._id}`, {
            method: 'PUT',
            body: JSON.stringify(currentHorario)
        });
        
        showSuccess('Etiqueta eliminada exitosamente');
        renderEtiquetas();
        updateQuickView();
        loadHorarios();
    } catch (error) {
        loadHorarios();
        selectHorario(currentHorario._id);
    }
}

// Utility functions
function showLoading(element) {
    element.innerHTML = '<div class="loading">Cargando...</div>';
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success';
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

// Update Quick View with selected horario
function updateQuickView() {
    const quickViewContent = document.querySelector('.quick-view-content');
    
    if (!currentHorario) {
        if (quickViewContent) quickViewContent.innerHTML = '<p>Selecciona un horario para ver módulos</p>';
        return;
    }
    
    if (currentHorario.bloques.length === 0) {
        if (quickViewContent) quickViewContent.innerHTML = `
            <div class="quick-view-header">
                <h4>📅 ${currentHorario.nombre}</h4>
                <p>No hay bloques agregados aún</p>
            </div>
        `;
        return;
    }
    
    // Group bloques by day
    const diasSemana = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
    const bloquesPorDia = {};
    
    diasSemana.forEach(dia => {
        bloquesPorDia[dia] = currentHorario.bloques.filter(bloque => bloque.dia === dia)
            .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
    });
    
    if (quickViewContent) quickViewContent.innerHTML = `
        <div class="quick-view-header">
            <h4>📅 ${currentHorario.nombre}</h4>
            <p>${currentHorario.propietario ? `👤 ${currentHorario.propietario}` : ''}</p>
        </div>
        <div class="quick-schedule">
            ${diasSemana.map(dia => {
                const bloques = bloquesPorDia[dia];
                return `
                    <div class="day-column">
                        <div class="day-header">${dia}</div>
                        <div class="day-blocks">
                            ${bloques.length > 0 ? 
                                bloques.map(bloque => `
                                    <div class="schedule-block">
                                        <div class="block-time">${bloque.horaInicio} - ${bloque.horaFin}</div>
                                        <div class="block-subject">${bloque.materia}</div>
                                    </div>
                                `).join('') : 
                                '<div class="no-blocks">Sin clases</div>'
                            }
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
        ${currentHorario.etiquetas.length > 0 ? `
            <div class="quick-tags">
                <strong>🏷️ Etiquetas:</strong>
                ${currentHorario.etiquetas.map(tag => `<span class="quick-tag">${tag}</span>`).join('')}
            </div>
        ` : ''}
    `;
}

// Improve form validation and user feedback
function validateHorarioForm(formData) {
    const nombre = formData.get('nombre').trim();
    
    if (!nombre) {
        showError('El nombre del horario es requerido');
        return false;
    }
    
    if (nombre.length < 2) {
        showError('El nombre debe tener al menos 2 caracteres');
        return false;
    }
    
    return true;
}

// Improve bloque validation
function validateBloqueForm(formData) {
    const dia = formData.get('dia');
    const horaInicio = formData.get('horaInicio');
    const horaFin = formData.get('horaFin');
    const materia = formData.get('materia').trim();
    
    if (!dia || !horaInicio || !horaFin || !materia) {
        showError('Todos los campos son requeridos');
        return false;
    }
    
    if (horaInicio >= horaFin) {
        showError('La hora de inicio debe ser menor que la hora de fin');
        return false;
    }
    
    // Check for overlapping blocks
    const overlapping = currentHorario.bloques.find(bloque => 
        bloque.dia === dia && 
        ((horaInicio >= bloque.horaInicio && horaInicio < bloque.horaFin) ||
         (horaFin > bloque.horaInicio && horaFin <= bloque.horaFin) ||
         (horaInicio <= bloque.horaInicio && horaFin >= bloque.horaFin))
    );
    
    if (overlapping) {
        showError(`Ya existe un bloque en ${dia} que se superpone con este horario`);
        return false;
    }
    
    return true;
}

// Add loading states for better UX
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

// Authentication Functions

// Check if user is already logged in
function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('currentUser');
    
    if (token && user) {
        authToken = token;
        currentUser = JSON.parse(user);
        updateAuthUI(true);
        loadHorarios();
    } else {
        // Redirect to login page if not authenticated
        window.location.href = 'login.html';
    }
}

// Update authentication UI
function updateAuthUI(isLoggedIn) {
    const mainContent = document.querySelector('.main-content');
    
    if (isLoggedIn && currentUser) {
        // Show authenticated UI (only if elements exist)
        if (authButtons) authButtons.style.display = 'none';
        if (userInfo) userInfo.style.display = 'flex';
        if (userName) userName.textContent = currentUser.nombre;
        
        // Show main content
        if (mainContent) mainContent.style.display = 'grid';
        
        // Enable forms
        if (horarioForm) horarioForm.style.display = 'block';
        
    } else {
        // Show login/register UI (only if elements exist)
        if (authButtons) authButtons.style.display = 'flex';
        if (userInfo) userInfo.style.display = 'none';
        
        // Hide main content when not authenticated
        if (mainContent) mainContent.style.display = 'none';
        
        // Clear data
        currentUser = null;
        authToken = null;
        currentHorario = null;
        horarios = [];
        
        // Hide forms
        if (horarioForm) horarioForm.style.display = 'none';
        if (manageSection) manageSection.style.display = 'none';
        
        // Show login modal automatically if not authenticated (only if modal exists)
        if (!isLoggedIn && document.getElementById('loginModal')) {
            setTimeout(() => {
                openModal('loginModal');
            }, 500);
        }
    }
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const loginData = {
        email: formData.get('email'),
        password: formData.get('password')
    };
    
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
        
        // Update UI
        updateAuthUI(true);
        closeModal('loginModal');
        showSuccess(`¡Bienvenido ${currentUser.nombre}!`);
        
        // Load user data
        loadHorarios();
        
        // Reset form
        e.target.reset();
        
    } catch (error) {
        showError(error.message);
    } finally {
        setButtonLoading(submitButton, false);
    }
}

// Handle register
async function handleRegister(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const registerData = {
        nombre: formData.get('nombre'),
        email: formData.get('email'),
        password: formData.get('password')
    };
    
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
        
        // Update UI
        updateAuthUI(true);
        closeModal('registerModal');
        showSuccess(`¡Cuenta creada exitosamente! Bienvenido ${currentUser.nombre}`);
        
        // Load user data
        loadHorarios();
        
        // Reset form
        e.target.reset();
        
    } catch (error) {
        showError(error.message);
    } finally {
        setButtonLoading(submitButton, false);
    }
}

// Handle logout
async function handleLogout() {
    try {
        // Call logout endpoint
        await apiRequest('/auth/logout', { method: 'POST' });
    } catch (error) {
        // Continue with logout even if API call fails
        console.error('Logout API error:', error);
    }
    
    // Clear local storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    
    showSuccess('Sesión cerrada exitosamente');
    
    // Redirect to login page
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1000);
}

// Handle auth errors
function handleAuthError() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    showError('Sesión expirada. Por favor inicia sesión nuevamente.');
    
    // Redirect to login page
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 2000);
}

// Modal functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        // Focus first input
        const firstInput = modal.querySelector('input');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        // Reset form
        const form = modal.querySelector('form');
        if (form) form.reset();
    }
}

function switchModal(fromModalId, toModalId) {
    closeModal(fromModalId);
    setTimeout(() => openModal(toModalId), 100);
}

// Make functions global for onclick handlers
window.closeModal = closeModal;
window.switchModal = switchModal;