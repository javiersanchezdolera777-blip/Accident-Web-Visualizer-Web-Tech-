<?php
header("Access-Control-Allow-Origin: *");
// Indicamos al navegador que es un archivo CSV descargable
header("Content-Type: text/csv; charset=UTF-8");
// Le ponemos nombre al archivo adjunto incluyendo la fecha de hoy para que quede pro
header("Content-Disposition: attachment; filename=reporte_accidentes_" . date('Y-m-d') . ".csv");

require_once '../config/db.php';
require_once '../models/AccidentModel.php';

class ExportController
{
    public function exportToCSV()
    {
        $database = new Database();
        $db = $database->getConnection();
        $model = new AccidentModel($db);

        // Capturamos los filtros de la URL por si quiere exportar la vista filtrada actual
        $filtros = array();
        if (isset($_GET['state']))
            $filtros['state'] = $_GET['state'];
        if (isset($_GET['severity']))
            $filtros['severity'] = $_GET['severity'];
        if (isset($_GET['weather']))
            $filtros['weather'] = $_GET['weather'];
        if (isset($_GET['date_from']))
            $filtros['date_from'] = $_GET['date_from'];
        if (isset($_GET['date_to']))
            $filtros['date_to'] = $_GET['date_to'];

        // Obtenemos los datos de la consulta
        $result = $model->getAccidentsForExport($filtros);

        // Abrimos el puntero de salida directamente hacia el flujo del navegador
        $output = fopen("php://output", "w");

        // Inyectamos la fila de títulos/cabeceras del CSV
        fputcsv($output, array('ID', 'Start_Time', 'Start_Lat', 'Start_Lng', 'Severity', 'City', 'State', 'Weather_Condition'));

        // Vamos volcando los registros fila por fila al flujo de descarga
        if ($result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                fputcsv($output, $row);
            }
        }

        // Cerramos el flujo de datos
        fclose($output);
        exit();
    }
}

$api = new ExportController();
$api->exportToCSV();
?>