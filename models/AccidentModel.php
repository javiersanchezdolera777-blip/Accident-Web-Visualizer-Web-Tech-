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
        // $query .= " LIMIT 500"; Quitamos el limite de 500 para que se muestren todos los accidentes

        // LÓGICA DE PAGINACIÓN
        // Si nos pasan una página, la usamos. Si no, por defecto es la página 1.
        $page = (isset($filtros['page']) && $filtros['page'] > 0) ? $filtros['page'] : 1;

        // Si nos pasan un límite, lo usamos. Si no, por defecto damos 1100 para que el mapa de Diego cargue bien.
        $limit = (isset($filtros['limit']) && $filtros['limit'] > 0) ? $filtros['limit'] : 1100;

        // Calculamos cuántos registros nos saltamos
        $offset = ($page - 1) * $limit;

        // Añadimos el LIMIT y OFFSET a la consulta SQL
        $query .= " LIMIT " . $limit . " OFFSET " . $offset;

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

    // Función para añadir un nuevo accidente
    public function createAccident($datos)
    {
        // Preparamos la consulta SQL de inserción
        $query = "INSERT INTO " . $this->table_name . " 
                  (ID, Start_Time, Start_Lat, Start_Lng, Severity, City, State, Weather_Condition) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

        $stmt = $this->conn->prepare($query);

        // Limpiamos los datos (seguridad básica)
        $id = htmlspecialchars(strip_tags($datos->id));
        $time = htmlspecialchars(strip_tags($datos->start_time));
        $lat = htmlspecialchars(strip_tags($datos->start_lat));
        $lng = htmlspecialchars(strip_tags($datos->start_lng));
        $sev = htmlspecialchars(strip_tags($datos->severity));
        $city = htmlspecialchars(strip_tags($datos->city));
        $state = htmlspecialchars(strip_tags($datos->state));
        $weather = htmlspecialchars(strip_tags($datos->weather));

        // Vinculamos los parámetros: 
        // "s" = string (texto/fecha), "d" = double (decimal), "i" = integer (entero)
        $stmt->bind_param("ssddisss", $id, $time, $lat, $lng, $sev, $city, $state, $weather);

        // Ejecutamos
        if ($stmt->execute()) {
            return true;
        }

        return false;
    }

    // Función para actualizar un accidente existente (con esto complemtamos CRUD)
    public function updateAccident($datos)
    {
        // Preparamos la consulta SQL de actualización
        $query = "UPDATE " . $this->table_name . " 
                  SET Start_Time = ?, Start_Lat = ?, Start_Lng = ?, Severity = ?, City = ?, State = ?, Weather_Condition = ?
                  WHERE ID = ?";

        $stmt = $this->conn->prepare($query);

        // Limpiamos los datos por seguridad
        $time = htmlspecialchars(strip_tags($datos->start_time));
        $lat = htmlspecialchars(strip_tags($datos->start_lat));
        $lng = htmlspecialchars(strip_tags($datos->start_lng));
        $sev = htmlspecialchars(strip_tags($datos->severity));
        $city = htmlspecialchars(strip_tags($datos->city));
        $state = htmlspecialchars(strip_tags($datos->state));
        $weather = htmlspecialchars(strip_tags($datos->weather));
        $id = htmlspecialchars(strip_tags($datos->id)); // El ID va al final para el WHERE

        // Vinculamos los parámetros en el orden exacto de los interrogantes:
        // string, double, double, integer, string, string, string, string -> "sddissss"
        $stmt->bind_param("sddissss", $time, $lat, $lng, $sev, $city, $state, $weather, $id);

        // Ejecutamos
        if ($stmt->execute()) {
            return true;
        }

        return false;
    }

    // Estas 3 funciones son para que Diego las use para las estadísticas en el Front

    // Función para obtener estadísticas agrupadas por Estado
    // de esta forma, la BBDD hace el trabajo de agrupar y el backend 
    // solo envía el resultado final al frontend
    public function getStatsByState()
    {
        // Le pedimos a SQL que agrupe por estado y cuente cuántos hay en cada uno
        $query = "SELECT State, COUNT(*) as Total 
                  FROM " . $this->table_name . " 
                  GROUP BY State 
                  ORDER BY Total DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt->get_result();
    }

    // Función para obtener estadísticas agrupadas por Gravedad (Severidad)
    public function getStatsBySeverity()
    {
        $query = "SELECT Severity, COUNT(*) as Total 
                  FROM " . $this->table_name . " 
                  GROUP BY Severity 
                  ORDER BY Severity ASC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt->get_result();
    }

    // Función para obtener estadísticas agrupadas por Clima (Top 10 para no saturar)
    public function getStatsByWeather()
    {
        $query = "SELECT Weather_Condition, COUNT(*) as Total 
                  FROM " . $this->table_name . " 
                  WHERE Weather_Condition IS NOT NULL AND Weather_Condition != ''
                  GROUP BY Weather_Condition 
                  ORDER BY Total DESC 
                  LIMIT 10";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt->get_result();
    }
}
?>