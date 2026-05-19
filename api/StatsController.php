<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/db.php';
require_once '../models/AccidentModel.php';

class StatsController
{

    public function getAllStats()
    {
        $database = new Database();
        $db = $database->getConnection();
        $model = new AccidentModel($db);

        // Capturamos los filtros de la URL (los mismos que usa AccidentsController)
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


        // Contenedor principal de la respuesta
        $response = array(
            "states" => array(),
            "severity" => array(),
            "weather" => array()
        );

        // Ejecutamos las 3 consultas de estadísticas pasándoles los filtros
// Si no hay filtros, $filtros estará vacío y las funciones devolverán datos globales
// Si Diego aplica un filtro en el front (ej: state=CA), los gráficos se actualizarán acorde

        $resStates = $model->getStatsByState($filtros);
        $resSeverity = $model->getStatsBySeverity($filtros);
        $resWeather = $model->getStatsByWeather($filtros);

        // 1. Recopilar estadísticas por Estado
        while ($row = $resStates->fetch_assoc()) {
            array_push($response["states"], array(
                "state" => $row['State'],
                "total" => (int) $row['Total']
            ));
        }

        // 2. Recopilar estadísticas por Gravedad
        while ($row = $resSeverity->fetch_assoc()) {
            array_push($response["severity"], array(
                "level" => (int) $row['Severity'],
                "total" => (int) $row['Total']
            ));
        }

        // 3. Recopilar estadísticas por Clima
        while ($row = $resWeather->fetch_assoc()) {
            array_push($response["weather"], array(
                "condition" => $row['Weather_Condition'],
                "total" => (int) $row['Total']
            ));
        }

        // Comprobamos si, después de todo, los arrays siguen vacíos
        if (empty($response["states"]) && empty($response["severity"]) && empty($response["weather"])) {
            // Si están vacíos, mandamos un código 404 (Not Found)
            http_response_code(404);
            echo json_encode(array("message" => "No data was found to generate the statistics."));
        } else {
            // Si al menos uno tiene datos, enviamos el 200 OK
            http_response_code(200);
            echo json_encode($response);
        }
    }
}

$api = new StatsController();
$api->getAllStats();
?>