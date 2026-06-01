let adminAccidentsData = [];
let isEditing = false;
let currentPage = 1;
const itemsPerPage = 50;

document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const loginError = document.getElementById('login-error');

    const savedToken = localStorage.getItem('avis_token');
    if (savedToken) {
        loginSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        fetchAdminData();
    }

    document.getElementById('btn-login').addEventListener('click', () => {
        const user = document.getElementById('admin-user').value;
        const pass = document.getElementById('admin-pass').value;

        fetch('../api/LoginController.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
        })
            .then(response => {
                if (!response.ok && response.status !== 401) throw new Error('Error in server response');
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    localStorage.setItem('avis_token', data.token);
                    loginSection.style.display = 'none';
                    dashboardSection.style.display = 'block';
                    loginError.style.display = 'none';
                    fetchAdminData();
                } else {
                    loginError.innerText = data.message || "Incorrect username or password.";
                    loginError.style.display = 'block';
                }
            })
            .catch(error => {
                loginError.innerText = "Conexion error.";
                loginError.style.display = 'block';
            });
    });

    document.getElementById('btn-logout').addEventListener('click', () => {
        localStorage.removeItem('avis_token');
        dashboardSection.style.display = 'none';
        loginSection.style.display = 'flex';
    });

    const addModal = document.getElementById('add-modal');
    const modalTitle = document.querySelector('#add-modal h3');
    const idInput = document.getElementById('add-id');

    document.getElementById('btn-add-new').addEventListener('click', () => {
        isEditing = false;
        modalTitle.innerText = '➕ Add New Accident';
        idInput.disabled = false;
        document.querySelectorAll('#add-modal input, #add-modal select').forEach(el => el.value = '');
        addModal.style.display = 'flex';
    });

    document.getElementById('btn-cancel-add').addEventListener('click', () => {
        addModal.style.display = 'none';
    });

    document.getElementById('btn-save-add').addEventListener('click', () => {
        let rawTime = document.getElementById('add-time').value;
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
        const httpMethod = isEditing ? 'PUT' : 'POST';

        fetch('../api/AccidentsController.php', {
            method: httpMethod,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        })
            .then(response => {
                if (response.status === 201 || response.status === 200) {
                    alert(`✅ Accident ${isEditing ? 'updated' : 'created'} successfully.`);
                    addModal.style.display = 'none';
                    fetchAdminData();
                } else {
                    alert("⚠️ Review the fields and try again.");
                }
            })
            .catch(error => {
                alert("❌ Connection error with the server.");
                console.error("Error saving:", error);
            });
    });

    const btnNext = document.getElementById('btn-next-page');
    if (btnNext) {
        btnNext.addEventListener('click', () => {
            currentPage++;
            fetchAdminData();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    const btnPrev = document.getElementById('btn-prev-page');
    if (btnPrev) {
        btnPrev.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                fetchAdminData();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }
    // --- LÓGICA DEL INPUT DE PAGINACIÓN ---
    const pageInput = document.getElementById('page-input');
    if (pageInput) pageInput.value = currentPage;
    const btnGoPage = document.getElementById('btn-go-page');

    if (pageInput && btnGoPage) {
        const goToPage = () => {
            let newPage = parseInt(pageInput.value);
            if (newPage >= 1) {
                currentPage = newPage;
                fetchAdminData();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                alert("⚠️ Please enter a valid page number greater than 0.");
                pageInput.value = currentPage; // Restauramos el valor si escribe una tontería
            }
        };

        // Escuchar el clic en el botón "Ir"
        btnGoPage.addEventListener('click', goToPage);

        // Escuchar la tecla "Enter" dentro del input
        pageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') goToPage();
        });
    }
});

function fetchAdminData() {
    // 1. Añadimos la recogida del token
    const token = localStorage.getItem('avis_token');

    // 2. Metemos el token en las cabeceras del fetch
    fetch(`../api/AccidentsController.php?page=${currentPage}&limit=${itemsPerPage}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
        .then(response => {
            // 3. Añadimos la validación de seguridad (el aviso "MEDIO" de Javiki)
            if (response.status === 401) {
                localStorage.removeItem('avis_token');
                document.getElementById('dashboard-section').style.display = 'none';
                document.getElementById('login-section').style.display = 'flex';
                throw new Error("Token expirado o inválido");
            }
            return response.json();
        })
        .then(accidents => {
            // A PARTIR DE AQUÍ ES EXACTAMENTE TU CÓDIGO INTACTO
            adminAccidentsData = accidents;
            const tableBody = document.getElementById('admin-table-body');
            tableBody.innerHTML = '';

            if (!Array.isArray(accidents) || accidents.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No hay más accidentes.</td></tr>`;
                if (currentPage > 1) {
                    document.getElementById('btn-next-page').disabled = true;
                    document.getElementById('btn-next-page').style.opacity = '0.5';
                }
                return;
            }

            document.getElementById('btn-next-page').disabled = false;
            document.getElementById('btn-next-page').style.opacity = '1';

            accidents.forEach(accident => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td style="padding: 10px;">${accident.ID || accident.id || 'N/A'}</td>
                    <td style="padding: 10px;">${accident.Start_Time || 'N/A'}</td>
                    <td style="padding: 10px;">${accident.State || 'N/A'}</td>
                    <td style="padding: 10px;"><span style="font-weight:bold;">Level ${accident.Severity || 'N/A'}</span></td>
                    <td style="padding: 10px; text-align: center;">
                        <button class="btn-edit" onclick="editAccident('${accident.ID || accident.id}')" style="background-color: #3498db; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin-right: 5px;">✏️ Edit</button>
                        <button class="btn-delete" onclick="deleteAccident('${accident.ID || accident.id}')" style="background-color: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">🗑️ Delete</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });

            const pageInput = document.getElementById('page-input');
            if (pageInput) pageInput.value = currentPage;

            const btnPrev = document.getElementById('btn-prev-page');
            if (btnPrev) {
                if (currentPage === 1) {
                    btnPrev.disabled = true;
                    btnPrev.style.opacity = '0.5';
                } else {
                    btnPrev.disabled = false;
                    btnPrev.style.opacity = '1';
                }
            }
        })
        .catch(error => {
            // 4. Añadimos el manejo de errores de red al final de todo
            console.error("Error de conexión al cargar datos:", error);
        });
}

window.editAccident = function (id) {
    const accident = adminAccidentsData.find(a => (a.ID || a.id) === id);
    if (!accident) return alert("❌ Error interno.");

    isEditing = true;
    document.querySelector('#add-modal h3').innerText = '✏️ Edit Accident';

    const idInput = document.getElementById('add-id');
    idInput.value = id;
    idInput.disabled = true;

    let time = accident.Start_Time || '';
    if (time) time = time.replace(' ', 'T').substring(0, 16);
    document.getElementById('add-time').value = time;

    document.getElementById('add-lat').value = accident.Start_Lat || accident.lat || '';
    document.getElementById('add-lng').value = accident.Start_Lng || accident.lng || '';
    document.getElementById('add-severity').value = accident.Severity || '';
    document.getElementById('add-city').value = accident.City || '';
    document.getElementById('add-state').value = accident.State || '';
    document.getElementById('add-weather').value = accident.Weather_Condition || '';

    document.getElementById('add-modal').style.display = 'flex';
};

window.deleteAccident = function (id) {
    if (!confirm(`⚠️ ¿Eliminar ID: ${id}?`)) return;
    const token = localStorage.getItem('avis_token');

    fetch('../api/AccidentsController.php', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id: id })
    })
        .then(res => {
            if (res.ok) {
                alert(`✅ Deleted successfully.`);
                fetchAdminData();
            } else {
                alert(`⚠️ Error deleting accident.`);
            }
        })
        .catch(err => alert("❌ Critical network error."));
};
