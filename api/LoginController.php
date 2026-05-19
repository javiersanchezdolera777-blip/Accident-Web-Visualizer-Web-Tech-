<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

// Capturamos los datos enviados por el frontend
$data = json_decode(file_get_contents("php://input"));

// Definimos las credenciales válidas en el servidor (ocultas al público)
// Nota: En un proyecto real de empresa esto se leería de la base de datos o un archivo .env
$valid_username = "admin";    // usuario
$valid_password = "password_seguro_123";   // contraseña
$api_key = "super-secreto-avis-2026"; // La llave maestra que he creado

if (!empty($data->username) && !empty($data->password)) {

    // Comprobamos si coinciden
    if ($data->username === $valid_username && $data->password === $valid_password) {

        // Login exitoso! le entregamos la llave de la API
        http_response_code(200);
        echo json_encode(array(
            "success" => true,
            "message" => "Successful login",
            "token" => $api_key
        ));

    } else {
        // Contraseña incorrecta
        http_response_code(401);
        echo json_encode(array("success" => false, "message" => "Incorrect credentials"));
    }
} else {
    // Faltan datos
    http_response_code(400);
    echo json_encode(array("success" => false, "message" => "Missing credentials"));
}
?>