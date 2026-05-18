document.addEventListener('DOMContentLoaded', () => {
    console.log("¡Módulo de Administración Cargado!");

    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const loginError = document.getElementById('login-error');

    // Escuchar el botón de Iniciar Sesión
    document.getElementById('btn-login').addEventListener('click', () => {
        const user = document.getElementById('admin-user').value;
        const pass = document.getElementById('admin-pass').value;

        // SIMULACIÓN TEMPORAL (luego lo haremos con Fetch a Javiki)
        if (user === 'admin' && pass === '1234') {
            // Ocultar login, mostrar panel
            loginSection.style.display = 'none';
            dashboardSection.style.display = 'block';
            loginError.style.display = 'none';
            
            // Aquí en el futuro llamaremos a fetchAdminData() para llenar la tabla
        } else {
            loginError.style.display = 'block';
        }
    });

    // Escuchar el botón de Cerrar Sesión
    document.getElementById('btn-logout').addEventListener('click', () => {
        // Limpiar inputs
        document.getElementById('admin-user').value = '';
        document.getElementById('admin-pass').value = '';
        
        // Volver a mostrar el login
        dashboardSection.style.display = 'none';
        loginSection.style.display = 'flex';
    });
});