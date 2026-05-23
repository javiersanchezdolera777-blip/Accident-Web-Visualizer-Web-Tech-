# AVis (Accident Web Visualizer)

## 1. Introduction
AVis (Accident Web Visualizer) is an interactive web application developed for visualizing, analyzing, and managing traffic accident data in the United States. It provides a rich visual interface that allows filtering data in real-time, observing key statistics through charts, and managing records via a dedicated administration panel.

## 2. System Requirements
* **Backend:** Vanilla PHP, MySQL database (ready for environments like XAMPP).
* **Frontend:** HTML5, CSS3, Vanilla JavaScript.
* **External Libraries:** 
  * [Chart.js](https://www.chartjs.org/): Used for generating analytical charts.
  * [Leaflet](https://leafletjs.com/): Used for interactive mapping and accident geolocation.

## 3. Main Features
1. **Interactive Map Visualization:** Representation of accidents on a US map, with combined filters by State, Severity, Weather, and Date Range.
2. **Chart Generation:** Dynamic generation of three types of charts based on applied filters:
   * *Bar Chart:* Number of accidents by State.
   * *Pie Chart:* Accident distribution according to their Severity Level.
   * *Line Chart:* Temporal evolution chart to analyze accident trends by dates.
3. **Data Export:** 
   * Export of filtered accident data to CSV format.
   * Export of charts into image formats (WebP for the state chart and SVG for the severity chart).
4. **Administration Module:** Secure administration panel (credentials required) offering:
   * Data visualization in a table with an advanced pagination system.
   * CRUD operations (Create, Read, Update, Delete) on accident records.
   * Dedicated export of records to CSV.

## 4. Authors
* Javier Sánchez Dólera
* Diego Sánchez Cano