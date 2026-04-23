// Inicializar el mapa
var map = L.map('map').setView([-27.2, -58.0], 10); // Centro aproximado basado en las coordenadas del shapefile

// Añadir capa de mapa base (OpenStreetMap)
// L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
// }).addTo(map);
var OSM =L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

var ESRIImage = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

var baseMaps = {
    "OpenStreetMap": OSM,
    "ESRI World Imagery": ESRIImage
};
L.control.layers(baseMaps).addTo(map);

var info= L.control();
info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info');
    this._div.innerHTML = '<h4>FOTOINDICES SIHN </h4>'
    return this._div;
};
info.addTo(map);

// Cargar datos GeoJSON del shapefile convertido
fetch('polygons.geojson')
    .then(response => response.json())
    .then(data => {
        // Crear capa de GeoJSON
        var geojsonLayer = L.geoJSON(data, {
            style: function(feature) {
                return {
                    color: 'blue',
                    fillColor: 'lightblue',
                    fillOpacity: 0.5,
                    weight: 2
                };
            },
            onEachFeature: function(feature, layer) {
                // Crear popup con información del polígono
                var infoTitle = feature.properties.OBSERVACIO || 'N/A';
                var imageName = feature.properties.IMAGEN || feature.properties.FOTOINDICE || feature.properties.FOTOINDEX;
                
                var imagePath = '';
                if (imageName) {
                    imageName = imageName.trim();
                    imagePath = 'images/' + imageName;
                }

                var popupContent = '<div style="max-width: 300px;">' +
                                   '<strong>SECTOR:</strong> ' + (feature.properties.SECTOR || 'N/A') + '<br>' +
                                   '<strong>VUELO:</strong> ' + (feature.properties.VUELO || 'N/A') + '<br>' +
                                   '<strong>FECHA DE VUELO:</strong> ' + (feature.properties['FECHA DE V'] || 'N/A') + '<br>' +
                                   '<strong>PROVINCIA:</strong> ' + (feature.properties.PROVINCIA || 'N/A') + '<br>' +
                                   '<strong>LOCALIDAD:</strong> ' + (feature.properties.LOCALIDAD || 'N/A') + '<br>' +
                                   '<strong>ESCALA:</strong> ' + (feature.properties.ESCALA || 'N/A') + '<br>' +
                                   '<strong>FOTOINDEX:</strong> ' + infoTitle + '<br>' +
                                   '<em style="color: #666; font-size: 12px;">Haz clic en el polígono para ver la imagen</em>' +
                                   '</div>';

                layer.bindPopup(popupContent);

                // Al hacer clic en el polígono, mostrar la imagen como overlay georreferenciado
                layer.on('click', function() {
                    if (imagePath) {
                        var bounds = layer.getBounds();
                        showImageOverlay(imagePath, bounds, feature.properties, imageName);
                    }
                });
            }
        }).addTo(map);

        // Ajustar el mapa para mostrar todos los polígonos
        map.fitBounds(geojsonLayer.getBounds());
    })
    .catch(error => {
        console.error('Error cargando el GeoJSON:', error);
        alert('Error al cargar los datos del mapa');
    });

var currentImageOverlay = null; // Variable para guardar el overlay actual

// Función para mostrar la imagen como overlay georreferenciado
function showImageOverlay(imagePath, bounds, properties, originalName) {
    // Remover overlay anterior si existe
    if (currentImageOverlay) {
        map.removeLayer(currentImageOverlay);
    }

    var rawName = originalName ? originalName.trim() : '';
    var upperPrefixName = rawName.replace(/^([a-z])/i, function(match) {
        return match.toUpperCase();
    });

    var candidates = [
        rawName,
        rawName.replace(/\.png$/i, '.tif'),
        rawName.replace(/_/g, ' '),
        rawName.replace(/\.png$/i, '.tif').replace(/_/g, ' '),
        upperPrefixName,
        upperPrefixName.replace(/\.png$/i, '.tif'),
        upperPrefixName.replace(/_/g, ' '),
        upperPrefixName.replace(/\.png$/i, '.tif').replace(/_/g, ' ')
    ].filter(function(name) {
        return name && name.length > 0;
    });

    var pathsToTry = candidates.map(function(name) {
        return 'images/' + encodeURI(name);
    });

    function tryLoadImage(pathIndex) {
        if (pathIndex >= pathsToTry.length) {
            console.warn('No se pudo cargar la imagen. Rutas intentadas:');
            pathsToTry.forEach(function(p) { console.warn(' -', p); });
            alert('No se pudo encontrar la imagen para este polígono.');
            return;
        }

        var testPath = pathsToTry[pathIndex];
        var img = new Image();
        img.onload = function() {
            currentImageOverlay = L.imageOverlay(testPath, bounds, {
                opacity: 1.0,
                interactive: true,
                zIndex: 500
            }).addTo(map);

            if (currentImageOverlay._image) {
                currentImageOverlay._image.style.zIndex = '500';
            }

            var closeButton = L.control({ position: 'topright' });
            closeButton.onAdd = function(map) {
                var div = L.DomUtil.create('div', 'close-overlay-btn');
                div.innerHTML = '<button style="padding: 10px 15px; background-color: #ff4444; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">✕ Cerrar imagen</button>';
                div.onclick = function() {
                    if (currentImageOverlay) {
                        map.removeLayer(currentImageOverlay);
                        currentImageOverlay = null;
                    }
                    map.removeControl(closeButton);
                };
                return div;
            };
            closeButton.addTo(map);

            console.log('Imagen cargada:', testPath);
        };
        img.onerror = function() {
            tryLoadImage(pathIndex + 1);
        };
        img.src = testPath;
    }

    tryLoadImage(0);
}

// Cerrar overlay al hacer clic en la X del overlay fullscreen (si existe)
document.addEventListener('DOMContentLoaded', function() {
    var closeBtn = document.querySelector('.overlay-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            document.getElementById('image-overlay').classList.remove('active');
        });
    }

    var overlay = document.getElementById('image-overlay');
    if (overlay) {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    }
});