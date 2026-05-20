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
            if (!response.ok && response.status !== 401) throw new Error('Error en servidor');
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
                loginError.innerText = data.message || "Credenciales incorrectas";
                loginError.style.display = 'block';
            }
        })
        .catch(error => {
            loginError.innerText = "Error de conexión.";
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
        modalTitle.innerText = '➕ Añadir Nuevo Accidente';
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
                alert(`✅ Accidente ${isEditing ? 'actualizado' : 'creado'} con éxito.`);
                addModal.style.display = 'none'; 
                fetchAdminData(); 
            } else {
                alert("⚠️ Revisa los campos obligatorios.");
            }
        });
    });

    const btnNext = document.getElementById('btn-next-page');
    if(btnNext) {
        btnNext.addEventListener('click', () => {
            currentPage++;
            fetchAdminData();
            window.scrollTo({ top: 0, behavior: 'smooth' }); 
        });
    }

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

function fetchAdminData() {
    fetch(`../api/AccidentsController.php?page=${currentPage}&limit=${itemsPerPage}`)
        .then(response => response.json())
        .then(accidents => {
            adminAccidentsData = accidents; 
            const tableBody = document.getElementById('admin-table-body');
            tableBody.innerHTML = '';

            if (!Array.isArray(accidents) || accidents.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No hay más accidentes.</td></tr>`;
                if(currentPage > 1) {
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
                    <td style="padding: 10px;"><span style="font-weight:bold;">Nivel ${accident.Severity || 'N/A'}</span></td>
                    <td style="padding: 10px; text-align: center;">
                        <button class="btn-edit" onclick="editAccident('${accident.ID || accident.id}')" style="background-color: #3498db; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin-right: 5px;">✏️ Edit</button>
                        <button class="btn-delete" onclick="deleteAccident('${accident.ID || accident.id}')" style="background-color: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">🗑️ Delete</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
            
            const pageText = document.getElementById('current-page-text');
            if (pageText) pageText.innerText = currentPage;
            
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
        });
}

window.editAccident = function(id) {
    const accident = adminAccidentsData.find(a => (a.ID || a.id) === id);
    if (!accident) return alert("❌ Error interno.");

    isEditing = true;
    document.querySelector('#add-modal h3').innerText = '✏️ Editar Accidente';

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

window.deleteAccident = function(id) {
    const isConfirmed = confirm(`⚠️ ¿Estás seguro de eliminar el accidente con ID: ${id}?`);
    if (!isConfirmed) return; 

    const token = localStorage.getItem('avis_token');
    fetch('../api/AccidentsController.php', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id: id }) 
    })
    .then(response => {
        if (response.ok || response.status === 200) {
            alert(`✅ Accidente eliminado.`);
            fetchAdminData(); 
        }
    });
};