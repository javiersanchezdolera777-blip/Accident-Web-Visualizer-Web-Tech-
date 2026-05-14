<?php
// 1. Encabezados HTTP (muy importante para una API)
header("Access-Control-Allow-Origin: *"); // permite que el frontend pueda pedir estos datos
header("Content-Type: application/json; charset=UTF-8"); // le chiva al navegador que esto es un JSON, no una web normal

// 2. Traemos las herramientas de trabajo
require_once '../config/db.php'; // conectamos a la BBDD
require_once '../models/AccidentModel.php'; // conectamos al modelo

class AccidentsController
{

    public function getLatest()
    {
        // Conectamos a la base de datos
        $database = new Database();
        $db = $database->getConnection();

        // Le pasamos la conexión al Modelo
        $model = new AccidentModel($db);

        // Pedimos la lista de accidentes (de momento, los 100 primeros pq es una prueba, ya lo cambiaremos)
        $result = $model->getAccidents();

        // Preparamos un array vacío donde iremos guardando la información
        $accidents_array = array();

        // Si la base de datos nos devuelve 1 o más filas...
        if ($result->num_rows > 0) {

            // Extraemos los datos fila por fila
            while ($row = $result->fetch_assoc()) {
                // array_push mete cada fila de MySQL directamente al final de nuestro array
                array_push($accidents_array, $row);
            }

            // Devolvemos un código de éxito (200 OK) y transformamos el array de PHP a formato JSON
            http_response_code(200);
            echo json_encode($accidents_array);

        } else {
            // Si la base de datos está vacía, devolvemos un código 404 (Not Found)
            http_response_code(404);
            echo json_encode(array("message" => "No accidents were found."));
        }
    }
}

// Al entrar a esta URL, instanciamos la clase y ejecutamos la función automáticamente
$api = new AccidentsController();
$api->getLatest();
?>