<?php
class Database
{
    private $host = "localhost";
    private $db_name = "avis_db"; // nombre de nuestra BBDD
    private $username = "root";   // Usuario por defecto de XAMPP
    private $password = "";       // Sin contraseña por defecto
    public $conn;

    public function getConnection()
    {
        $this->conn = null;

        try {
            $this->conn = new mysqli($this->host, $this->username, $this->password, $this->db_name);

            // Comprobar si hay error en la conexión
            if ($this->conn->connect_error) {
                throw new Exception("Error de conexión: " . $this->conn->connect_error);
            }

            // forzamos codificación UTF-8 para evitar caracteres raros
            $this->conn->set_charset("utf8mb4");

        } catch (Exception $e) {
            echo "Error de Base de Datos: " . $e->getMessage();
        }

        return $this->conn;
    }
}
?>