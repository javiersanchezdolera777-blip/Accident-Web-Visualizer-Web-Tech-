// Variable global para guardar los accidentes temporalmente y poder leerlos al editar
let adminAccidentsData = [];
// Chivato para saber si estamos editando (true) o añadiendo (false)
let isEditing = false; 
let currentPage = 1;
const itemsPerPage = 50; // Lo que configuró Javiki

document.addEventListener('DOMContentLoaded', () => {
    console.log("¡Módulo de Administración Real Cargado!");

    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const loginError = document.getElementById('login-error');

    // COMPROBACIÓN RECOMENDADA
    const savedToken = localStorage.getItem('avis_token');
    if (savedToken) {
        loginSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        fetchAdminData(); 
    }

    // LOGIN REAL
    document.getElementById('btn-login').addEventListener('click', () => {
        const user = document.getElementById('admin-user').value;
        const pass = document.getElementById('admin-pass').value;

        fetch('../api/LoginController.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
        })
        .then(response => {
            if (!response.ok && response.status !== 401) throw new Error('Error en el servidor');
            return response.json();
        })
        .then(data => {
            if (data.success) {
                localStorage.setItem('avis_token', data.token);
                loginSection.style.display = 'none';
                dashboardSection.style.display = 'block';
                loginError.style.display = 'none';
                console.log("🔓 Login correcto. Token guardado.");
                fetchAdminData(); 
            } else {
                loginError.innerText = data.message || "Credenciales incorrectas";
                loginError.style.display = 'block';
            }
        })
        .catch(error => {
            console.error('❌ Error conectando al login:', error);
            loginError.innerText = "Error al conectar con el servidor.";
            loginError.style.display = 'block';
        });
    });

    // LOGOUT
    document.getElementById('btn-logout').addEventListener('click', () => {
        localStorage.removeItem('avis_token');
        document.getElementById('admin-user').value = '';
        document.getElementById('admin-pass').value = '';
        dashboardSection.style.display = 'none';
        loginSection.style.display = 'flex';
        console.log("🔒 Sesión cerrada. Token eliminado.");
    });

    // ==========================================
    // LÓGICA DEL MODAL DE AÑADIR/EDITAR (POST / PUT)
    // ==========================================
    const addModal = document.getElementById('add-modal');
    const modalTitle = document.querySelector('#add-modal h3');
    const idInput = document.getElementById('add-id');

    // 1. Abrir el modal para AÑADIR
    document.getElementById('btn-add-new').addEventListener('click', () => {
        isEditing = false; // Avisamos que es uno nuevo
        modalTitle.innerText = '➕ Añadir Nuevo Accidente';
        idInput.disabled = false; // Permitimos escribir el ID
        
        // Limpiamos los campos
        document.querySelectorAll('#add-modal input, #add-modal select').forEach(el => el.value = '');
        addModal.style.display = 'flex';
    });

    // 2. Cerrar el modal (botón Cancelar)
    document.getElementById('btn-cancel-add').addEventListener('click', () => {
        addModal.style.display = 'none';
    });

    // 3. Botón de GUARDAR MÁGICO (Sirve para POST y para PUT)
    document.getElementById('btn-save-add').addEventListener('click', () => {
        let rawTime = document.getElementById('add-time').value;
        // Ajustamos la fecha al formato que quiere la Base de Datos
        let formattedTime = rawTime ? rawTime.replace('T', ' ') + (rawTime.length <= 16 ? ':00' : '') : '';

        const payload = {
            id: document.getElementById('add-id').value,
            start_time: formattedTime,
            start_lat: parseFloat(document.getElementById('add-lat').value),
            start_lng: parseFloat(document.getElementById('add-lng').value),
            severity: parseInt(document.getElementById('add-severity').value),
            city: document.getElementById('add-city').value,
            state: document.getElementById('add-state').value,
            weather: document.getElementById('add-weather').value
        };

        const token = localStorage.getItem('avis_token');
        // Magia: Si estamos editando usamos PUT, si no, usamos POST
        const httpMethod = isEditing ? 'PUT' : 'POST';

        fetch('../api/AccidentsController.php', {
            method: httpMethod,
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(payload)
        })
        .then(response => {
            // Javiki devuelve 201 para POST y 200 para PUT
            if (response.status === 201 || response.status === 200) {
                alert(`✅ Accidente ${isEditing ? 'actualizado' : 'creado'} con éxito.`);
                addModal.style.display = 'none'; 
                fetchAdminData(); // Recargamos la tabla
            } else if (response.status === 400) {
                alert("⚠️ Faltan campos obligatorios o el formato es incorrecto.");
            } else {
                throw new Error("Error en el servidor");
            }
        })
        .catch(error => {
            console.error('❌ Error guardando el accidente:', error);
            alert("No se pudo guardar. Revisa la consola.");
        });
    });
});

// ==========================================
// LEER ACCIDENTES (READ)
// ==========================================
// ==========================================
// LEER ACCIDENTES (READ) CON PAGINACIÓN
// ==========================================
function fetchAdminData() {
    // Le decimos a la API de Javiki qué página queremos y de qué tamaño
    const apiUrl = `../api/AccidentsController.php?page=${currentPage}&limit=${itemsPerPage}`;

    fetch(apiUrl)
        .then(response => {
            if (!response.ok) throw new Error('Error al obtener datos');
            return response.json();
        })
        .then(accidents => {
            console.log(`📋 Datos de la página ${currentPage} recibidos:`, accidents);
            adminAccidentsData = accidents; 
            
            const tableBody = document.getElementById('admin-table-body');
            tableBody.innerHTML = '';

            // Si la API devuelve un array vacío, significa que hemos llegado al final
            if (!Array.isArray(accidents) || accidents.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No hay más accidentes registrados.</td></tr>`;
                // Si estamos en una página vacía que no es la 1, deshabilitamos el botón siguiente
                if(currentPage > 1) {
                     document.getElementById('btn-next-page').disabled = true;
                     document.getElementById('btn-next-page').style.opacity = '0.5';
                }
                return;
            }

            // Habilitamos el botón de siguiente por si estaba bloqueado
            document.getElementById('btn-next-page').disabled = false;
            document.getElementById('btn-next-page').style.opacity = '1';

            // Pintamos las filas
            accidents.forEach(accident => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td style="padding: 10px;">${accident.ID || accident.id || 'N/A'}</td>
                    <td style="padding: 10px;">${accident.Start_Time || 'N/A'}</td>
                    <td style="padding: 10px;">${accident.State || 'N/A'}</td>
                    <td style="padding: 10px;"><span style="font-weight:bold;">Nivel ${accident.Severity || 'N/A'}</span></td>
                    <td style="padding: 10px; text-align: center;">
                        <button class="btn-edit" onclick="editAccident('${accident.ID || accident.id}')" style="background-color: #3498db; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin-right: 5px;">✏️ Edit</button>
                        <button class="btn-delete" onclick="deleteAccident('${accident.ID || accident.id}')" style="background-color: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">🗑️ Delete</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
            
            // Actualizamos el número de la interfaz
            const pageText = document.getElementById('current-page-text');
            if (pageText) pageText.innerText = currentPage;
            
            // Si estamos en la página 1, bloqueamos el botón de Anterior
            const btnPrev = document.getElementById('btn-prev-page');
            if (btnPrev) {
                if (currentPage === 1) {
                    btnPrev.disabled = true;
                    btnPrev.style.opacity = '0.5';
                    btnPrev.style.cursor = 'not-allowed';
                } else {
                    btnPrev.disabled = false;
                    btnPrev.style.opacity = '1';
                    btnPrev.style.cursor = 'pointer';
                }
            }
        })
        .catch(error => console.error('❌ Error llenando la tabla:', error));
}

// ==========================================
// ESCUCHAS DE LOS BOTONES DE PAGINACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Escuchar botón Siguiente
    const btnNext = document.getElementById('btn-next-page');
    if(btnNext) {
        btnNext.addEventListener('click', () => {
            currentPage++;
            fetchAdminData();
            window.scrollTo({ top: 0, behavior: 'smooth' }); // Subimos la vista al principio de la tabla
        });
    }

    // Escuchar botón Anterior
    const btnPrev = document.getElementById('btn-prev-page');
    if(btnPrev) {
        btnPrev.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                fetchAdminData();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }
});

// ==========================================
// EDITAR ACCIDENTE (UPDATE - PUT)
// ==========================================
// Se lanza al pulsar el botón ✏️ de una fila
window.editAccident = function(id) {
    // 1. Buscamos los datos completos de ese accidente en la memoria
    const accident = adminAccidentsData.find(a => (a.ID || a.id) === id);
    if (!accident) return alert("❌ Error: No se encontraron los datos locales de este accidente.");

    // 2. Activamos el modo Edición y cambiamos el título
    isEditing = true;
    document.querySelector('#add-modal h3').innerText = '✏️ Editar Accidente';

    // 3. Rellenamos el formulario con sus datos actuales
    const idInput = document.getElementById('add-id');
    idInput.value = id;
    idInput.disabled = true; // IMPORTANTÍSIMO: Bloqueamos el ID para que no lo cambien

    // Adaptamos la fecha para que el calendario de HTML la entienda ('YYYY-MM-DDTHH:MM')
    let time = accident.Start_Time || '';
    if (time) time = time.replace(' ', 'T').substring(0, 16); 
    document.getElementById('add-time').value = time;

    document.getElementById('add-lat').value = accident.Start_Lat || accident.lat || '';
    document.getElementById('add-lng').value = accident.Start_Lng || accident.lng || '';
    document.getElementById('add-severity').value = accident.Severity || '';
    document.getElementById('add-city').value = accident.City || '';
    document.getElementById('add-state').value = accident.State || '';
    document.getElementById('add-weather').value = accident.Weather_Condition || '';

    // 4. Mostramos el modal
    document.getElementById('add-modal').style.display = 'flex';
};

// ==========================================
// ELIMINAR ACCIDENTE (DELETE)
// ==========================================
window.deleteAccident = function(id) {
    const isConfirmed = confirm(`⚠️ ¿Estás seguro de eliminar el accidente con ID: ${id}?`);
    if (!isConfirmed) return; 

    const token = localStorage.getItem('avis_token');

    fetch('../api/AccidentsController.php', {
        method: 'DELETE',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ id: id }) 
    })
    .then(response => {
        if (response.ok || response.status === 200) {
            alert(`✅ Accidente eliminado.`);
            fetchAdminData(); 
        } else {
            throw new Error('Status: ' + response.status);
        }
    })
    .catch(error => console.error('❌ Error al eliminar:', error));
};