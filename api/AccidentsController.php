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
        // conectamos a la base de datos
        $database = new Database();
        $db = $database->getConnection();

        // le pasamos la conexión al modelo
        $model = new AccidentModel($db);

        // 1. Capturamos los filtros de la URL
        $filtros = array();
        if (isset($_GET['state'])) {
            $filtros['state'] = $_GET['state'];
        }
        if (isset($_GET['city'])) {
            $filtros['city'] = $_GET['city'];
        }
        if (isset($_GET['severity'])) {
            $filtros['severity'] = $_GET['severity'];
        }
        if (isset($_GET['weather'])) {
            $filtros['weather'] = $_GET['weather'];
        }
        if (isset($_GET['date_from'])) {
            $filtros['date_from'] = $_GET['date_from'];
        }
        if (isset($_GET['date_to'])) {
            $filtros['date_to'] = $_GET['date_to'];
        }

        // Añadimos estos nuevos parámetros de paginación
        // por si la muestra es demasiado grande y nos conviene limitarla
        if (isset($_GET['page'])) {
            $filtros['page'] = (int) $_GET['page'];
        }
        if (isset($_GET['limit'])) {
            $filtros['limit'] = (int) $_GET['limit'];
        }

        // pasamos los filtros al modelo
        $result = $model->getAccidents($filtros);

        // preparamos el array donde guardaremos la información
        $accidents_array = array();

        // si la base de datos nos devuelve 1 o más filas...
        if ($result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                // array_push mete cada fila de MySQL directamente al final de nuestro array
                array_push($accidents_array, $row);
            }
            // devolvemos un código de éxito (200 OK) y transformamos el array de PHP a formato JSON
            http_response_code(200);
            echo json_encode($accidents_array);
        } else {
            // si la base de datos está vacía, devolvemos un código 404 (Not Found)
            http_response_code(404);
            echo json_encode(array("message" => "No accidents were found with those filters."));
        }
    }

    // Nueva función para manejar el borrado
    public function delete()
    {
        $database = new Database();
        $db = $database->getConnection();
        $model = new AccidentModel($db);

        // Como las peticiones DELETE no mandan datos por $_GET ni $_POST convencionales,
        // tenemos que leer el "cuerpo" de la petición directamente:
        $data = json_decode(file_get_contents("php://input"));

        // Comprobamos que nos han enviado un ID
        if (!empty($data->id)) {
            if ($model->deleteAccident($data->id)) {
                http_response_code(200); // OK
                echo json_encode(array("message" => "Accident successfully deleted"));
            } else {
                http_response_code(503); // Servicio no disponible
                echo json_encode(array("message" => "The accident could not be deleted"));
            }
        } else {
            http_response_code(400); // Bad Request (Petición mal formada)
            echo json_encode(array("message" => "Incomplete data. Missing accident ID."));
        }
    }

    // Nueva función para manejar la creación
    public function create()
    {
        $database = new Database();
        $db = $database->getConnection();
        $model = new AccidentModel($db);

        // Capturamos el cuerpo de la petición (JSON)
        $data = json_decode(file_get_contents("php://input"));

        // Comprobamos que no nos envíen campos vacíos
        if (
            !empty($data->id) && !empty($data->start_time) &&
            !empty($data->start_lat) && !empty($data->start_lng) &&
            !empty($data->severity) && !empty($data->city) &&
            !empty($data->state) && !empty($data->weather)
        ) {
            // Intentamos crear el accidente
            if ($model->createAccident($data)) {
                http_response_code(201); // 201 significa "Creado"
                echo json_encode(array("message" => "Accident succesfully created."));
            } else {
                http_response_code(503); // Servicio no disponible
                echo json_encode(array("message" => "The accident could not be created."));
            }
        } else {
            http_response_code(400); // Bad Request
            echo json_encode(array("message" => "Incomplete data. Missing required fields."));
        }
    }

    // Nueva función para manejar la actualización (PUT)
    public function update()
    {
        $database = new Database();
        $db = $database->getConnection();
        $model = new AccidentModel($db);

        // Capturamos los datos que nos envían
        $data = json_decode(file_get_contents("php://input"));

        // Comprobamos que como mínimo nos envíen el ID para saber qué actualizar
        if (!empty($data->id)) {
            // Intentamos actualizar
            if ($model->updateAccident($data)) {
                http_response_code(200); // 200 OK
                echo json_encode(array("message" => "Accident succesfully updated."));
            } else {
                http_response_code(503); // Servicio no disponible
                echo json_encode(array("message" => "The accident could not be updated."));
            }
        } else {
            http_response_code(400); // Bad Request
            echo json_encode(array("message" => "Incomplete data. Missing ID of the accident to be modified."));
        }
    }

}

// Enrutador: con la URL (Accident-Web-Visualizer-Web-Tech-/api/AccidentsController.php)
$api = new AccidentsController(); // instanciamos la clase

// Detectamos qué método HTTP está usando el cliente
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Si piden datos, llamamos a la función de búsqueda con filtros
        $api->getLatest();
        break;
    case 'DELETE':
        // Si piden borrar, llamamos a la función de borrado
        $api->delete();
        break;
    case 'POST':
        // Si envían datos (crear), llamamos a la función de creación
        $api->create();
        break;
    case 'PUT':
        // Si envían datos (actualizar), llamamos a la función de actualización
        $api->update();
        break;
    default:
        // Si intentan usar POST, PUT, etc. (que aún no hemos programado)
        http_response_code(405); // Método no permitido
        echo json_encode(array("message" => "The HTTP method is not currently supported."));
        break;
}
?>