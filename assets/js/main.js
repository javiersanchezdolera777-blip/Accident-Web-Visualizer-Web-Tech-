// Variable global para guardar nuestro mapa
let map;

document.addEventListener('DOMContentLoaded', () => {
    console.log("¡Iniciando AVis Frontend!");
    
    // 1. Inicializamos el mapa vacío centrado en EE.UU.
    initMap();
    
    // 2. Pedimos los datos
    fetchAccidentsData();
});

function initMap() {
    // Coordenadas centrales de USA y nivel de zoom (4)
    map = L.map('map').setView([37.8, -96], 4);

    // Cargamos los "azulejos" (tiles) del mapa desde OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(map);
}

function fetchAccidentsData() {
    const apiUrl = 'api/AccidentsController.php';

    fetch(apiUrl)
        .then(response => {
            if (!response.ok) throw new Error('Error en la red: ' + response.statusText);
            return response.json();
        })
        .then(data => {
            console.log("✅ Datos recibidos:", data);
            
            // 3. Cuando lleguen los datos, los dibujamos en el mapa
            plotDataOnMap(data);
            
            // 4. Dibujamos los graficos
            initCharts(data);
        })
        .catch(error => console.error("❌ Error conectando con la API:", error));
}

function plotDataOnMap(accidents) {
    // Recorremos los 100 accidentes que nos devolvió Javiki
    accidents.forEach(accident => {
        const lat = accident.Start_Lat || accident.lat; 
        const lng = accident.Start_Lng || accident.lng;
        
        if (lat && lng) {
            // Creamos un marcador (el puntito rojo/azul)
            const marker = L.marker([lat, lng]).addTo(map);
            
            // Le añadimos un pequeño globo de texto al hacer clic
            marker.bindPopup(`
                <strong>Estado:</strong> ${accident.State || 'N/A'}<br>
                <strong>Severidad:</strong> Nivel ${accident.Severity || 'N/A'}<br>
                <strong>Clima:</strong> ${accident.Weather_Condition || 'N/A'}
            `);
        }
    });
} // <--- ¡AQUÍ CERRAMOS plotDataOnMap!

// Y AHORA SÍ, EMPEZAMOS initCharts COMO UNA FUNCIÓN INDEPENDIENTE
function initCharts(accidents) {
    // 1. Preparamos unas "cajas" vacías para contar
    const stateCounts = {};
    const severityCounts = {};

    // 2. Recorremos los 100 accidentes para contar
    accidents.forEach(acc => {
        const state = acc.State || 'Unknown';
        const severity = acc.Severity || 'Unknown';

        // Si el estado ya existe en la caja, le sumamos 1. Si no, empieza en 1.
        stateCounts[state] = (stateCounts[state] || 0) + 1;
        severityCounts[severity] = (severityCounts[severity] || 0) + 1;
    });

    // 3. Dibujamos el Gráfico de Barras (Accidentes por Estado)
    const ctxBar = document.getElementById('barChart').getContext('2d');
    new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: Object.keys(stateCounts), // Los nombres de los estados (CA, TX...)
            datasets: [{
                label: 'Número de Accidentes',
                data: Object.values(stateCounts), // Las cantidades
                backgroundColor: '#3498db',
                borderRadius: 5 // Bordes redondeados para que quede profesional
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // <--- ¡AÑADE ESTA LÍNEA A LOS DOS GRÁFICOS!
            plugins: {
                title: { display: true, text: 'Accidentes por Estado' }
            }
        }
    });

    // 4. Dibujamos el Gráfico de Tarta (Niveles de Severidad)
    const ctxPie = document.getElementById('pieChart').getContext('2d');
    new Chart(ctxPie, {
        type: 'doughnut', // 'doughnut' queda más moderno que 'pie' (tarta clásica)
        data: {
            // Añadimos la palabra "Nivel" delante del número
            labels: Object.keys(severityCounts).map(s => 'Nivel ' + s),
            datasets: [{
                data: Object.values(severityCounts),
                // Colores semafóricos para la severidad (amarillo, naranja, rojo oscuro)
                backgroundColor: ['#f1c40f', '#e67e22', '#e74c3c', '#8b0000'] 
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // <--- ¡AÑADE ESTA LÍNEA A LOS DOS GRÁFICOS!
            plugins: {
                title: { display: true, text: 'Distribución de Severidad' }
            }
        }
    });
}