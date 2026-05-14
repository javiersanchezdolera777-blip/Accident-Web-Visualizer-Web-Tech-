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
    public function getAccidents()
    {
        // Seleccionamos solo las columnas que nos importan para optimizar
        $query = "SELECT ID, Start_Time, Start_Lat, Start_Lng, Severity, City, State, Weather_Condition 
                  FROM " . $this->table_name . " 
                  LIMIT 100"; // Límite por ahora para no saturar pruebas

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        $result = $stmt->get_result();
        return $result;
    }
}
?>