const sheetmapperOptions = {
    googleSheetDownloadUrl: 'https://docs.google.com/spreadsheets/d/1lA_cylBfmYk4OHfwpCUemGJPyvpOh-jfHIaB8Z4j8jw/export?format=csv&gid=0',
    mapboxAccessToken: 'pk.eyJ1IjoianRhZWNrZXJ3eXNzIiwiYSI6ImNtOWJoZm10NTBnZWEyam92azlnZXRzaXgifQ.u74wiCeZdSxg6ajQ0-cR0A',
    markerOptions: {
        color: '#F4E2B0',
        scale: 0.8
    },
};

async function convertCsvToGeojson(csvData) {
    return new Promise((resolve, reject) => {
        csv2geojson.csv2geojson(csvData, {
            latfield: 'Latitude',
            lonfield: 'Longitude',
            delimiter: ','
        }, (error, data) => {
            if (error) {
                reject(error);
            } else {
                resolve(data);
            }
        });
    });
}

const { markerOptions, title, description, googleSheetDownloadUrl, mapboxAccessToken } = sheetmapperOptions;

mapboxgl.accessToken = mapboxAccessToken;

document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch(`${googleSheetDownloadUrl}`);
        if (!response.ok) {
            throw new Error(`Error loading google sheet data. Make sure googleSheetId is configured properly and that the google sheet has been published to the web.`);
        }

        const csvData = await response.text();
        console.log(csvData);

        // Fallback check:
        if (!csvData || csvData.trim().length === 0) {
            console.warn("CSV data is empty. Check the sheet sharing settings or publishing status.");
            return; // Stop execution if there's nothing to process
        }

        const geojsonData = await convertCsvToGeojson(csvData);

        const map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v11', // Bushwick Taqueria Mapbox Style
            center: [-73.9313, 40.7014],  // Center Bushwick
            zoom: 14,  // Default zoom level
        });

        map.on('load', function () {
            geojsonData.features.forEach((d) => {
                const name = d.properties.Name;

                // Styled popup content
                const popupContent = `
                    <div class="popup-content">
                        <div class="popup-title">${name}</div>
                        <div class="popup-line"><strong>Address:</strong> ${d.properties.Address}</div>
                        <div class="popup-line"><strong>Description:</strong> ${d.properties.Description}</div>
                        <div class="popup-line"><strong>What I order:</strong> ${d.properties.Order || ""}</div>
                    </div>
                `;

                // Create the marker and attach the popup
                const marker = new mapboxgl.Marker(markerOptions)
                    .setLngLat(d.geometry.coordinates)
                    .setPopup(new mapboxgl.Popup().setHTML(popupContent))
                    .addTo(map);
            });
        });