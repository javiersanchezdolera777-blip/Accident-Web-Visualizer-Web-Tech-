// ==========================================
// VARIABLES GLOBALES
// ==========================================
let map;
let markerGroup; 
let barChartInstance = null; 
let pieChartInstance = null; 
let currentAccidentsData = []; 

// ==========================================
// INICIALIZACIÓN (Al cargar la página)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("¡Iniciando AVis Frontend!");
    initMap();
    fetchAccidentsData(); // Carga inicial sin filtros

    // Escuchar el botón de Aplicar Filtros
    document.getElementById('btn-apply-filters').addEventListener('click', () => {
        const stateValue = document.getElementById('filter-state').value;
        const severityValue = document.getElementById('filter-severity').value;
        const weatherValue = document.getElementById('filter-weather').value;
        const dateFromValue = document.getElementById('filter-date-from').value;
        const dateToValue = document.getElementById('filter-date-to').value;
        
        const params = new URLSearchParams();
        
        if (stateValue !== "") params.append('state', stateValue);
        if (severityValue !== "") params.append('severity', severityValue);
        if (weatherValue !== "") params.append('weather', weatherValue);
        if (dateFromValue !== "") params.append('date_from', dateFromValue);
        if (dateToValue !== "") params.append('date_to', dateToValue);
        
        const queryString = params.toString() ? '?' + params.toString() : '';
        
        fetchAccidentsData(queryString);
    });

    // Escuchar los botones de exportar
    document.getElementById('btn-export-csv').addEventListener('click', exportToCSV);
    document.getElementById('btn-export-webp').addEventListener('click', exportToWebP);
    document.getElementById('btn-export-svg').addEventListener('click', exportToSVG);
});

// ==========================================
// FUNCIONES DEL MAPA Y DATOS
// ==========================================
function initMap() {
    map = L.map('map').setView([37.8, -96], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(map);

    markerGroup = L.layerGroup().addTo(map); 
}

function fetchAccidentsData(queryParams = '') {
    const apiUrl = 'api/AccidentsController.php' + queryParams;

    fetch(apiUrl)
        .then(response => {
            // Si el backend no encuentra nada, evitamos el error devolviendo una lista vacía
            if (response.status === 404) {
                return []; 
            }
            if (!response.ok) throw new Error('Error en red: ' + response.statusText);
            
            return response.json();
        })
        .then(data => {
            console.log("✅ Datos recibidos:", data);
            currentAccidentsData = data;
            
            // Si la búsqueda no dio resultados, avisamos al usuario
            if (data.length === 0) {
                alert("No se encontraron accidentes con esos filtros.");
            }
            
            plotDataOnMap(data);
            initCharts(data);
        })
        .catch(error => console.error("❌ Error API:", error));
}

function plotDataOnMap(accidents) {
    if (!Array.isArray(accidents)) return;
    
    // Borramos los pines antiguos
    markerGroup.clearLayers(); 

    accidents.forEach(accident => {
        const lat = accident.Start_Lat || accident.lat; 
        const lng = accident.Start_Lng || accident.lng;
        
        if (lat && lng) {
            const marker = L.marker([lat, lng]).addTo(markerGroup); 
            marker.bindPopup(`
                <strong>Estado:</strong> ${accident.State || 'N/A'}<br>
                <strong>Severidad:</strong> Nivel ${accident.Severity || 'N/A'}<br>
                <strong>Clima:</strong> ${accident.Weather_Condition || 'N/A'}<br>
                <strong>Fecha:</strong> ${accident.Start_Time || 'N/A'}
            `);
        }
    });
}

// ==========================================
// FUNCIONES DE GRÁFICOS
// ==========================================
function initCharts(accidents) {
    if (!Array.isArray(accidents)) return;
    
    const stateCounts = {};
    const severityCounts = {};

    accidents.forEach(acc => {
        const state = acc.State || 'Unknown';
        const severity = acc.Severity || 'Unknown';
        stateCounts[state] = (stateCounts[state] || 0) + 1;
        severityCounts[severity] = (severityCounts[severity] || 0) + 1;
    });

    // Gráfico de Barras
    const ctxBar = document.getElementById('barChart').getContext('2d');
    if (barChartInstance) barChartInstance.destroy();
    
    barChartInstance = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: Object.keys(stateCounts),
            datasets: [{
                label: 'Número de Accidentes',
                data: Object.values(stateCounts),
                backgroundColor: '#3498db',
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { title: { display: true, text: 'Accidentes por Estado' } }
        }
    });

    // Gráfico de Tarta
    const ctxPie = document.getElementById('pieChart').getContext('2d');
    if (pieChartInstance) pieChartInstance.destroy();
    
    pieChartInstance = new Chart(ctxPie, {
        type: 'doughnut',
        data: {
            labels: Object.keys(severityCounts).map(s => 'Nivel ' + s),
            datasets: [{
                data: Object.values(severityCounts),
                backgroundColor: ['#f1c40f', '#e67e22', '#e74c3c', '#8b0000'] 
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { title: { display: true, text: 'Distribución de Severidad' } }
        }
    });
}

// ==========================================
// MÓDULO DE EXPORTACIÓN
// ==========================================
function exportToCSV() {
    if (currentAccidentsData.length === 0) return alert("No hay datos.");
    const headers = Object.keys(currentAccidentsData[0]);
    const rows = currentAccidentsData.map(acc => headers.map(header => {
        let cell = acc[header] === null || acc[header] === undefined ? '' : String(acc[header]);
        return `"${cell.replace(/"/g, '""')}"`; 
    }).join(","));
    
    const blob = new Blob([headers.join(",") + "\n" + rows.join("\n")], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "accidentes_avis.csv";
    link.click();
}

function exportToWebP() {
    const canvas = document.getElementById('barChart');
    if (!canvas) return alert("Gráfico no disponible.");
    const link = document.createElement("a");
    link.href = canvas.toDataURL('image/webp', 1.0);
    link.download = "grafico_barras.webp";
    link.click();
}

function exportToSVG() {
    if (currentAccidentsData.length === 0) return;
    const stateCounts = {};
    currentAccidentsData.forEach(acc => stateCounts[acc.State || 'Unknown'] = (stateCounts[acc.State || 'Unknown'] || 0) + 1);
    
    const states = Object.keys(stateCounts), values = Object.values(stateCounts), maxValue = Math.max(...values, 1);
    
    let svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="${states.length * 40 + 80}">
        <rect width="100%" height="100%" fill="#f4f4f9"/>
        <text x="20" y="40" font-family="Arial" font-size="22" font-weight="bold" fill="#2c3e50">Accidentes por Estado</text>`;
    
    states.forEach((state, i) => {
        const w = (values[i] / maxValue) * 400, y = 80 + (i * 40);
        svgString += `<text x="20" y="${y + 15}" font-family="Arial" font-size="14" fill="#333">${state}</text>
                      <rect x="60" y="${y}" width="${w}" height="20" fill="#3498db" rx="4"/>
                      <text x="${60 + w + 10}" y="${y + 15}" font-family="Arial" font-size="14" font-weight="bold" fill="#e74c3c">${values[i]}</text>`;
    });
    svgString += `</svg>`;
    
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([svgString], { type: 'image/svg+xml;charset=utf-8;' }));
    link.download = "grafico.svg";
    link.click();
}