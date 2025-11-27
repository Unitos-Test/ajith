// Initialize map
var map = L.map('map').setView([0, 0], 2);

// Layer control
var overlayLayers = {};
var layerControl = L.control.layers(null, overlayLayers).addTo(map);

// Base map (optional)
var baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Draw tools
var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

var drawControl = new L.Control.Draw({
    draw: { polygon: true, polyline: true, rectangle: false, circle: false, marker: false, circlemarker: false },
    edit: { featureGroup: drawnItems }
});
map.addControl(drawControl);

// Measurement on draw
map.on(L.Draw.Event.CREATED, function(e){
    var layer = e.layer;
    drawnItems.addLayer(layer);

    if(layer instanceof L.Polyline){
        let latlngs = layer.getLatLngs();
        let distance = 0;
        for(let i=1; i<latlngs.length; i++){
            distance += latlngs[i-1].distanceTo(latlngs[i]);
        }
        alert("Length: " + distance.toFixed(2) + " meters");
    }

    if(layer instanceof L.Polygon){
        const coords = layer.getLatLngs()[0].map(ll => [ll.lng, ll.lat]);
        coords.push(coords[0]);
        const polygon = turf.polygon([coords]);
        const area = turf.area(polygon);
        alert("Area: " + area.toFixed(2) + " m²");
    }
});

// Load XYZ tiles (your orthomosaic)
var orthoLayer = L.tileLayer('tiles/{z}/{x}/{y}.png', {
    attribution: 'Ortho Mosaic',
    tms: false
}).addTo(map);

overlayLayers["Ortho"] = orthoLayer;
layerControl.addOverlay(orthoLayer, "Ortho");

// Upload shapefile ZIP or GeoJSON
document.getElementById('shpFile').addEventListener('change', function(e){
    Array.from(e.target.files).forEach(async (file) => {
        if(file.name.endsWith(".geojson")){
            const text = await file.text();
            const geojson = JSON.parse(text);
            const shpLayer = L.geoJSON(geojson).addTo(map);
            overlayLayers[file.name] = shpLayer;
            layerControl.addOverlay(shpLayer, file.name);
            map.fitBounds(shpLayer.getBounds());
        } else if(file.name.endsWith(".zip")){
            const arrayBuffer = await file.arrayBuffer();
            shp(arrayBuffer).then(function(geojson){
                const shpLayer = L.geoJSON(geojson).addTo(map);
                overlayLayers[file.name] = shpLayer;
                layerControl.addOverlay(shpLayer, file.name);
                map.fitBounds(shpLayer.getBounds());
            }).catch(err => alert("Error reading shapefile: "+err));
        } else {
            alert("Unsupported file type: "+file.name);
        }
    });
});
