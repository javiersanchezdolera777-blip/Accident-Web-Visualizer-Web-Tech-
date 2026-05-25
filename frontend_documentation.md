# Frontend Documentation: AVis Dashboard

The frontend of the AVis (US Traffic Accidents Visualizer) application was developed using vanilla JavaScript, HTML5, and CSS3, prioritizing a lightweight, responsive, and highly interactive user experience. The architecture is designed to handle asynchronous data fetching seamlessly while providing dynamic visual feedback to the user.

## 1. Integration of External Libraries

To provide a rich data visualization experience, the frontend integrates two powerful open-source libraries:

* **Leaflet.js (Map Visualization):** Used to render the interactive map of the United States. The map is initialized via the `L.map` object. Spatial data (latitude and longitude) fetched from the backend is dynamically translated into map markers. To ensure optimal performance when users apply filters, the `L.layerGroup` feature is utilized to effectively clear (`clearLayers()`) and redraw markers without re-initializing the entire map instance.
* **Chart.js (Statistical Graphics):** Implemented to render three distinct types of interactive charts:
    * **Bar Chart:** Displays the total number of accidents per state.
    * **Doughnut Chart:** Illustrates the distribution of accident severity levels.
    * **Line Chart:** Shows the temporal evolution of accidents. A custom grouping algorithm was implemented in the frontend to aggregate data by **fortnights** (Q1/Q2 of each month), smoothing the curve for better trend analysis.
    * *Note on lifecycle:* Chart instances are meticulously managed (destroyed and recreated using `.destroy()`) every time new data is fetched to prevent overlapping visual glitches. The `chartjs-plugin-datalabels` was also integrated to enhance visual readability.

## 2. Interface Logic and API Communication

The core of the interface logic relies on the asynchronous `fetch` API to communicate with the PHP backend, updating the Document Object Model (DOM) dynamically without page reloads.

* **Dynamic Filtering System:** The public dashboard features a comprehensive filtering system (State, Severity, Weather, Date range). When the user clicks "Apply Filters", the application captures the DOM input values and constructs a dynamic query string using the `URLSearchParams` interface. This ensures that only active filters are sent to the `AccidentsController.php` and `StatsController.php` endpoints.
* **Admin Panel & CRUD Operations:** The administration panel is protected by a token-based authentication system (JWT). Upon successful login, the token is stored in the browser's `localStorage`. All subsequent requests (POST, PUT, DELETE) include this token in the `Authorization: Bearer` header. 
* **DOM Updates and UX:** Instead of a traditional pagination layout, a custom input-based pagination system was developed for the admin table. Users can directly type their desired page number and press "Enter" to trigger a state update, significantly improving the navigation experience through large datasets. Errors (e.g., 401 Unauthorized or network failures) are caught using `.catch()` blocks, providing immediate visual feedback via `alert()` or custom UI error messages.

## 3. Data Export Mechanisms

To maximize the utility of the dashboard, a robust, multi-format data export system was engineered. It combines both backend delegation and client-side rendering techniques:

* **CSV Export:** Handled securely by delegating the process to the backend. The frontend appends the currently active filters to the `ExportController.php` URL, prompting the browser to download the dynamically generated CSV file.
* **WebP Export (Client-Side):** Utilizes the HTML5 `<canvas>` API. The `toDataURL('image/webp')` method extracts the visual data from the Chart.js canvas and automatically triggers a file download by creating a temporary `<a>` element in the DOM.
* **SVG Export (Procedural Generation):** Instead of relying on heavy third-party libraries, the SVG export generates scalable vector graphics procedurally. The JavaScript code builds an XML string containing `<svg>`, `<rect>`, and `<text>` tags, dynamically calculating widths and positions based on the current severity data, and then creates a downloadable Blob object.
* **PDF Export:** Implemented via a native browser print interface. The line chart's canvas is converted to an image, injected into a temporary hidden window (`window.open`), and the `window.print()` method is invoked, allowing the user to seamlessly save the chart as a PDF document.
