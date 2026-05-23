// ==========================================
// VARIABLES GLOBALES
// ==========================================
let map;
let markerGroup;
let barChartInstance = null;
let pieChartInstance = null;
let currentAccidentsData = [];
let currentStatsData = null;

Chart.register(ChartDataLabels);

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("¡Iniciando AVis Frontend!");
    initMap();
    fetchAccidentsData();
    fetchStatsData();

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
        fetchStatsData(queryString);
    });

    document.getElementById('btn-export-csv').addEventListener('click', exportToCSV);
    document.getElementById('btn-export-webp').addEventListener('click', exportToWebP);
    document.getElementById('btn-export-svg').addEventListener('click', exportToSVG);
});

// ==========================================
// MAPA Y DATOS
// ==========================================
function initMap() {
    map = L.map('map').setView([37.8, -96], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    markerGroup = L.layerGroup().addTo(map);
}

function fetchAccidentsData(queryParams = '') {
    fetch('api/AccidentsController.php' + queryParams)
        .then(response => {
            if (response.status === 404) return [];
            if (!response.ok) throw new Error('Error red');
            return response.json();
        })
        .then(data => {
            currentAccidentsData = data;
            if (data.length === 0) alert("No se encontraron accidentes con esos filtros.");
            plotDataOnMap(data);
        })
        .catch(err => console.error("❌ Error API Mapa:", err));
}

function plotDataOnMap(accidents) {
    if (!Array.isArray(accidents)) return;
    markerGroup.clearLayers();
    accidents.forEach(accident => {
        const lat = accident.Start_Lat || accident.lat;
        const lng = accident.Start_Lng || accident.lng;
        if (lat && lng) {
            const marker = L.marker([lat, lng]).addTo(markerGroup);
            marker.bindPopup(`<strong>Estado:</strong> ${accident.State || 'N/A'}<br><strong>Severidad:</strong> Nivel ${accident.Severity || 'N/A'}`);
        }
    });
}

function fetchStatsData(queryParams = '') {
    fetch('api/StatsController.php' + queryParams)
        .then(response => response.status === 404 ? null : response.json())
        .then(statsData => {
            currentStatsData = statsData;
            if (statsData) initCharts(statsData);
        })
        .catch(err => console.error("❌ Error API Stats:", err));
}

// ==========================================
// GRÁFICOS
// ==========================================
function initCharts(statsData) {
    if (!statsData || !statsData.states || !statsData.severity) return;
    const ctxBar = document.getElementById('barChart').getContext('2d');
    if (barChartInstance) barChartInstance.destroy();
    barChartInstance = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: statsData.states.map(item => item.state),
            datasets: [{ label: 'Accidentes', data: statsData.states.map(item => item.total), backgroundColor: '#3498db' }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: 'Accidentes por Estado' },
                datalabels: { anchor: 'end', align: 'top', font: { weight: 'bold', size: 11 }, color: '#333' }
            }
        }
    });

    const ctxPie = document.getElementById('pieChart').getContext('2d');
    if (pieChartInstance) pieChartInstance.destroy();
    pieChartInstance = new Chart(ctxPie, {
        type: 'doughnut',
        data: {
            labels: statsData.severity.map(item => 'Nivel ' + item.level),
            datasets: [{ data: statsData.severity.map(item => item.total), backgroundColor: ['#f1c40f', '#e67e22', '#e74c3c', '#8b0000'] }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: 'Distribución de Severidad' } } }
    });
}

// EXPORTACIONES FINALES (JAVIKI BONUS TRACK)
function exportToCSV() {
    const stateValue = document.getElementById('filter-state').value;
    const severityValue = document.getElementById('filter-severity').value;
    const weatherValue = document.getElementById('filter-weather').value;
    const dateFromValue = document.getElementById('filter-date-from').value;
    const dateToValue = document.getElementById('filter-date-to').value;
    const params = new URLSearchParams();
    if (stateValue) params.append('state', stateValue);
    if (severityValue) params.append('severity', severityValue);
    if (weatherValue) params.append('weather', weatherValue);
    if (dateFromValue) params.append('date_from', dateFromValue);
    if (dateToValue) params.append('date_to', dateToValue);

    let url = 'api/ExportController.php';
    if (params.toString()) url += '?' + params.toString();
    window.location.href = url;
}

function exportToWebP() {
    const canvas = document.getElementById('barChart');
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL('image/webp', 1.0);
    link.download = "grafico_barras.webp";
    link.click();
}

function exportToSVG() {
    if (!currentStatsData || !currentStatsData.states) return;
    const states = currentStatsData.states.map(item => item.state);
    const values = currentStatsData.states.map(item => item.total);
    const maxValue = Math.max(...values, 1);
    let svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="${states.length * 40 + 80}"><rect width="100%" height="100%" fill="#f4f4f9"/><text x="20" y="40" font-family="Arial" font-size="22" font-weight="bold" fill="#2c3e50">Accidentes por Estado</text>`;
    states.forEach((state, i) => {
        const w = (values[i] / maxValue) * 400, y = 80 + (i * 40);
        svgString += `<text x="20" y="${y + 15}" font-family="Arial" font-size="14" fill="#333">${state}</text><rect x="60" y="${y}" width="${w}" height="20" fill="#3498db" rx="4"/><text x="${60 + w + 10}" y="${y + 15}" font-family="Arial" font-size="14" font-weight="bold" fill="#e74c3c">${values[i]}</text>`;
    });
    svgString += `</svg>`;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([svgString], { type: 'image/svg+xml;charset=utf-8;' }));
    link.download = "grafico.svg";
    link.click();
}
