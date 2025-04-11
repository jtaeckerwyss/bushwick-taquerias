document.addEventListener("DOMContentLoaded", async () => {
    if (typeof mapboxgl === "undefined") {
      console.error("Mapbox GL JS is not loaded.");
      return;
    }
  
    const config = {
      csvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS-tcG8aewG0If-3-iz0euHyBW90SGGZ3degMqgSi-OrqpXlg5QL240_Joa8iCqc0iiqiEX5ZIHlCVn/pub?output=csv',
      mapboxToken: 'pk.eyJ1IjoianRhZWNrZXJ3eXNzIiwiYSI6ImNtOWJoZm10NTBnZWEyam92azlnZXRzaXgifQ.u74wiCeZdSxg6ajQ0-cR0A',
      marker: {
        color: '#F4E2B0',
        scale: 0.8
      },
      center: [-73.9313, 40.7014],
      zoom: 14,
      mapStyle: 'mapbox://styles/jtaeckerwyss/cm9bhhygs006n01qk88qlewha',
    };
  
    mapboxgl.accessToken = config.mapboxToken;
  
    async function fetchCsv(url) {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to load CSV data.");
      const text = await response.text();
      if (!text || text.trim().length === 0) throw new Error("CSV is empty.");
      return text;
    }
  
    function csvToGeoJson(csv) {
      return new Promise((resolve, reject) => {
        csv2geojson.csv2geojson(csv, {
          latfield: 'Latitude',
          lonfield: 'Longitude',
          delimiter: ',',
        }, (error, data) => {
          if (error) reject(error);
          else resolve(data);
        });
      });
    }
  
    function createPopupHTML(props) {
      return `
        <div class="popup-content">
          <div class="popup-title">${props.Name}</div>
          <div class="popup-line"><strong>Address:</strong> ${props.Address}</div>
          <div class="popup-line"><strong>Description:</strong> ${props.Description}</div>
          <div class="popup-line"><strong>What I order:</strong> ${props.Order || ""}</div>
        </div>
      `;
    }
  
    try {
      const csvData = await fetchCsv(config.csvUrl);
      const geojson = await csvToGeoJson(csvData);
      console.log("✅ GeoJSON loaded:", geojson);
  
      const map = new mapboxgl.Map({
        container: 'map',
        style: config.mapStyle,
        center: config.center,
        zoom: config.zoom,
      });
  
      map.on('load', () => {
        geojson.features.forEach((feature, i) => {
          const coords = feature.geometry?.coordinates;
          if (!coords || coords.length !== 2) {
            console.warn(`⚠️ Skipping invalid coordinates at feature ${i}:`, coords);
            return;
          }
  
          const popup = new mapboxgl.Popup().setHTML(createPopupHTML(feature.properties));
  
          new mapboxgl.Marker(config.marker)
            .setLngLat(coords)
            .setPopup(popup)
            .addTo(map)
            .togglePopup();
  
          console.log(`📍 Added marker: ${feature.properties.Name}`, coords);
        });
      });
  
    } catch (err) {
      console.error("❌ Error initializing map:", err);
    }
  });
  