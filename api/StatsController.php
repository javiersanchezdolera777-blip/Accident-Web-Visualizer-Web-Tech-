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

        // Contenedor principal de la respuesta
        $response = array(
            "states" => array(),
            "severity" => array(),
            "weather" => array()
        );

        // 1. Recopilar estadísticas por Estado
        $resStates = $model->getStatsByState();
        while ($row = $resStates->fetch_assoc()) {
            array_push($response["states"], array(
                "state" => $row['State'],
                "total" => (int) $row['Total']
            ));
        }

        // 2. Recopilar estadísticas por Gravedad
        $resSeverity = $model->getStatsBySeverity();
        while ($row = $resSeverity->fetch_assoc()) {
            array_push($response["severity"], array(
                "level" => (int) $row['Severity'],
                "total" => (int) $row['Total']
            ));
        }

        // 3. Recopilar estadísticas por Clima
        $resWeather = $model->getStatsByWeather();
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