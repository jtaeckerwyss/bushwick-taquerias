document.addEventListener("DOMContentLoaded", async () => {
    if (typeof mapboxgl === "undefined") {
        console.error("Mapbox GL JS is not loaded.");
        return;
    }

    const sheetmapperOptions = {
        googleSheetDownloadUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS-tcG8aewG0If-3-iz0euHyBW90SGGZ3degMqgSi-OrqpXlg5QL240_Joa8iCqc0iiqiEX5ZIHlCVn/pub?output=csv',
        mapboxAccessToken: 'pk.eyJ1IjoianRhZWNrZXJ3eXNzIiwiYSI6ImNtOWJoZm10NTBnZWEyam92azlnZXRzaXgifQ.u74wiCeZdSxg6ajQ0-cR0A',
        markerOptions: {
            color: '#F4E2B0',
            scale: 0.8
        }
    };

    mapboxgl.accessToken = sheetmapperOptions.mapboxAccessToken;

    async function convertCsvToGeojson(csvData) {
        return new Promise((resolve, reject) => {
            csv2geojson.csv2geojson(csvData, {
                latfield: 'Latitude',
                lonfield: 'Longitude',
                delimiter: ','
            }, (error, data) => {
                if (error) reject(error);
                else resolve(data);
            });
        });
    }

    try {
        const response = await fetch(sheetmapperOptions.googleSheetDownloadUrl);
        if (!response.ok) {
            throw new Error("Failed to load Google Sheet.");
        }

        const csvData = await response.text();
        if (!csvData || csvData.trim().length === 0) {
            console.warn("CSV is empty.");
            return;
        }

        const geojsonData = await convertCsvToGeojson(csvData);

        const map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/jtaeckerwyss/cm9bhhygs006n01qk88qlewha',
            center: [-73.9313, 40.7014],
            zoom: 14
        });

        map.on('load', () => {
            geojsonData.features.forEach((d) => {
                const popupContent = `
                    <div class="popup-content">
                        <div class="popup-title">${d.properties.Name}</div>
                        <div class="popup-line"><strong>Address:</strong> ${d.properties.Address}</div>
                        <div class="popup-line"><strong>Description:</strong> ${d.properties.Description}</div>
                        <div class="popup-line"><strong>What I order:</strong> ${d.properties.Order || ""}</div>
                    </div>
                `;

                new mapboxgl.Marker(sheetmapperOptions.markerOptions)
                    .setLngLat(d.geometry.coordinates)
                    .setPopup(new mapboxgl.Popup().setHTML(popupContent))
                    .addTo(map);
            });
        });

    } catch (err) {
        console.error("Error loading map or data:", err);
    }
});
