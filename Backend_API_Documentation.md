# Technical Documentation: Backend & REST API

## 1. Database Structure

The application uses MySQL as its database engine. The system's main table is called `accidents` (hosted within the `avis_db` database) and stores all traffic accident records.

Below are the main fields and their corresponding data types:

- **ID (`VARCHAR/String`)**: Unique identifier for the accident (e.g., `A-1`, `A-2`). Stored as text to allow custom naming conventions.
- **Start_Time (`DATETIME/String`)**: Exact date and time the accident occurred or was registered. Standard format `YYYY-MM-DD HH:MM:SS`.
- **Start_Lat (`DOUBLE/Decimal`)**: Geographic latitude of the accident for map rendering.
- **Start_Lng (`DOUBLE/Decimal`)**: Geographic longitude of the accident.
- **Severity (`INT/Integer`)**: Traffic impact level, classified numerically (e.g., from 1 to 4, with 4 being the most severe).
- **City (`VARCHAR/String`)**: City where the incident took place.
- **State (`VARCHAR/String`)**: Abbreviated state code (e.g., `CA`, `TX`, `FL`).
- **Weather_Condition (`VARCHAR/String`)**: Meteorological conditions present at the time of the accident (e.g., `Clear`, `Overcast`, `Light Rain`).

---

## 2. Security Architecture

Given that the application features a remotely accessible administration module and receives dynamic data through filters, multiple security layers have been implemented:

### SQL Injection and XSS Prevention
To prevent malicious code injection, several native PHP functions are applied before interacting with the database:
- **`real_escape_string()`**: Used in all `GET` requests (search and filters) to escape any special characters introduced in URL parameters. This prevents the injection of unwanted SQL statements.
- **`htmlspecialchars()`** and **`strip_tags()`**: Systematically used in CRUD operations (`POST`, `PUT`, `DELETE`). They sanitize incoming text strings by removing HTML tags and hidden scripts, thereby blocking *Cross-Site Scripting (XSS)* attacks.

### Authentication and Access Control
To protect critical administration endpoints (creation, edition, and deletion), the system requires a security token:
- The system uses an **API Key** (`x-api-key`). 
- When an administrator logs in successfully, the server returns a token (`super-secreto-avis-2026`).
- The *Frontend* client (JavaScript) must store and mandatorily attach this token in the HTTP headers (`headers: { 'x-api-key': '...' }`) of all requests targeting protected endpoints.

---

## 3. REST API Documentation

The core of the application communicates under a RESTful architecture, utilizing `JSON` format for both input and output.

### A. Search and Filters
**`GET /api/AccidentsController.php`**
Returns a list of accidents matching the provided filters. If no filters are specified, it returns a generic batch limited by pagination.
- **URL Parameters (Optional):**
  - `state` (String): Filter by state code.
  - `city` (String): Filter by city.
  - `severity` (Integer): Filter by severity level.
  - `weather` (String): Filter by weather condition.
  - `date_from` (Date): Start date of the range (`YYYY-MM-DD`).
  - `date_to` (Date): End date of the range (`YYYY-MM-DD`).
  - `limit` (Integer): Maximum number of records per request (default `1100`).
  - `page` (Integer): Current page to return (default `1`).
- **Successful Response:** `200 OK` (JSON array of objects containing accident data).
- **Empty Response:** `404 Not Found` (Message: "No accidents were found...").

### B. Administration Module (Protected CRUD)
Endpoints intended for data management. The client must include a `JSON` body and it is recommended to send the `x-api-key` header for security.

- **Create Accident:** **`POST /api/AccidentsController.php`**
  - **Body (JSON):** Requires `id`, `start_time`, `start_lat`, `start_lng`, `severity`, `city`, `state`, `weather`.
  - **Response:** `201 Created` if successful, `400 Bad Request` if fields are missing.

- **Update Accident:** **`PUT /api/AccidentsController.php`**
  - **Body (JSON):** Requires the original `id` and all fields to be updated.
  - **Response:** `200 OK` if successful, `400 Bad Request` if the ID is missing.

- **Delete Accident:** **`DELETE /api/AccidentsController.php`**
  - **Body (JSON):** Only requires the identifier `{ "id": "A-1" }`.
  - **Response:** `200 OK` (Accident successfully deleted).

### C. Statistics and Grouping
**`GET /api/StatsController.php`**
Collects database data to generate the Dashboard charts. It accepts the same dynamic filters as the main controller.
- **URL Parameters:** Same as *AccidentsController* (`state`, `severity`, `weather`, `date_from`, `date_to`).
- **Successful Response:** Returns a unified JSON object (`200 OK`) containing three independent statistical blocks:
  1. `byState`: Totals grouped by state.
  2. `bySeverity`: Totals grouped by severity level.
  3. `byWeather`: Top 10 weather conditions with the most accidents.

### D. Export
**`GET /api/ExportController.php`**
Retrieves and formats the filtered records for download.
- **URL Parameters:** Same filters mentioned above.
- **Response:** Returns a plain text encoded file ready to be downloaded and processed as a `.csv` in the user's browser.

### E. Access Control
**`POST /api/LoginController.php`**
Endpoint responsible for verifying administrator credentials and granting access to the API.
- **Body (JSON):** `{ "username": "admin", "password": "..." }`
- **Successful Response:** `200 OK` (Returns the `x-api-key` token).
- **Error Response:** `401 Unauthorized` (Incorrect credentials) or `400 Bad Request` (Incomplete data).
