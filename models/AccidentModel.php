<?php
class AccidentModel
{
    private $conn;
    private $table_name = "accidents"; // el nombre de la tabla de 'avis_db' en phpmyadmin
    public function __construct($db)
    {
        $this->conn = $db;
    }

    // Función inicial para leer un lote de accidentes de prueba
    public function getAccidents($filtros = array())
    {
        // Empezamos con una consulta base (1=1 es un truco para poder concatenar los AND fácilmente)
        $query = "SELECT ID, Start_Time, Start_Lat, Start_Lng, Severity, City, State, Weather_Condition 
                  FROM " . $this->table_name . " WHERE 1=1";

        // Vamos añadiendo filtros dinámicamente si el controlador los ha recibido
        if (isset($filtros['state'])) {
            $state_limpio = $this->conn->real_escape_string($filtros['state']);
            $query .= " AND State = '" . $state_limpio . "'";
        }

        if (isset($filtros['city'])) {
            $city_limpia = $this->conn->real_escape_string($filtros['city']);
            $query .= " AND City = '" . $city_limpia . "'";
        }

        if (isset($filtros['severity'])) {
            $sev_limpia = $this->conn->real_escape_string($filtros['severity']);
            $query .= " AND Severity = " . $sev_limpia;
        }

        if (isset($filtros['weather'])) {
            $weather_limpio = $this->conn->real_escape_string($filtros['weather']);
            $query .= " AND Weather_Condition = '" . $weather_limpio . "'";
        }

        // añadimos el filtro de fecha para la consulta SQL
        if (isset($filtros["date_from"]) && isset($filtros["date_to"])) {
            $from = $this->conn->real_escape_string($filtros["date_from"]);
            $to = $this->conn->real_escape_string($filtros["date_to"]);

            // para que pille todo el día, le ponemos "00:00:00" al inicio y "23:59:59" al final
            $query .= " AND Start_Time BETWEEN '" . $from . " 00:00:00' AND '" . $to . " 23:59:59'";

        }

        // el 'this->conn->real_escape_string' es para escanear y limpiar la información que viene de internet
        // antes de meterla en la base de datos para que no nos hackeen (es una medida de seguridad)

        // Le volvemos a poner un límite para que no colapse si piden un estado entero
        $query .= " LIMIT 500";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt->get_result();
    }

    // Función para borrar un accidente por su ID
    public function deleteAccident($id)
    {
        // Preparamos la consulta SQL
        $query = "DELETE FROM " . $this->table_name . " WHERE ID = ?";

        $stmt = $this->conn->prepare($query);

        // Limpiamos el ID por seguridad antes de ejecutar
        $id_limpio = htmlspecialchars(strip_tags($id));

        // Vinculamos el parámetro ("s" significa que esperamos un string, ya que el ID es tipo "A-1")
        $stmt->bind_param("s", $id_limpio);

        // Ejecutamos y comprobamos si ha ido bien
        if ($stmt->execute()) {
            return true;
        }

        return false;
    }
}
?>