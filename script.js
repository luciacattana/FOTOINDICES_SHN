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
                    fillOpacity: 0,
                    weight: 2
                };
            },
            onEachFeature: function(feature, layer) {
                // Crear popup con información del polígono
                var infoTitle = feature.properties.OBSERVACIO || 'N/A';
                var imageName = feature.properties.IMAGEN || feature.properties.FOTOINDEX || feature.properties.FOTOINDICE || feature.properties.Path_Photo;
                
                var imagePath = '';
                if (imageName) {
                    imageName = imageName.trim();
                    imageName = imageName.replace(/^.*[\\/]/, '');
                    imagePath = 'images/' + imageName;
                }

                var popupContent = '<div style="max-width: 300px;">' +
                                   '<strong>SECTOR:</strong> ' + (feature.properties.SECTOR || 'N/A') + '<br>' +
                                   '<strong>VUELO:</strong> ' + (feature.properties.VUELO || 'N/A') + '<br>' +
                                   '<strong>FECHA DE VUELO:</strong> ' + (feature.properties['FECHA DE V'] || 'N/A') + '<br>' +
                                   '<strong>PROVINCIA:</strong> ' + (feature.properties.PROVINCIA || 'N/A') + '<br>' +
                                   '<strong>LOCALIDAD:</strong> ' + (feature.properties.LOCALIDAD || 'N/A') + '<br>' +
                                   '<strong>ESCALA:</strong> ' + (feature.properties.ESCALA || 'N/A') + '<br>' +
                                   '<strong>FOTOINDICE:</strong> ' + infoTitle + '<br>' +
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
    var cleanedName = rawName.replace(/^.*[\\/]/, '').trim();

    function addCandidate(list, name) {
        if (!name || name.length === 0) return;
        if (list.indexOf(name) === -1) list.push(name);
    }

    var candidateNames = [];
    addCandidate(candidateNames, cleanedName);
    addCandidate(candidateNames, cleanedName.replace(/ /g, '_'));
    addCandidate(candidateNames, cleanedName.replace(/_/g, ' '));
    addCandidate(candidateNames, cleanedName.toUpperCase());
    addCandidate(candidateNames, cleanedName.toLowerCase());
    addCandidate(candidateNames, cleanedName.replace(/ /g, '_').toUpperCase());
    addCandidate(candidateNames, cleanedName.replace(/ /g, '_').toLowerCase());
    addCandidate(candidateNames, cleanedName.replace(/_/g, ' ').toUpperCase());
    addCandidate(candidateNames, cleanedName.replace(/_/g, ' ').toLowerCase());

    candidateNames.forEach(function(name) {
        if (!/\.(png|tif)$/i.test(name)) {
            addCandidate(candidateNames, name + '.png');
            addCandidate(candidateNames, name + '.tif');
        } else {
            addCandidate(candidateNames, name.replace(/\.(png|tif)$/i, '.png'));
            addCandidate(candidateNames, name.replace(/\.(png|tif)$/i, '.tif'));
        }
    });

    var foldersToSearch = ['images', '1/images'];
    var pathsToTry = [];
    foldersToSearch.forEach(function(folder) {
        candidateNames.forEach(function(name) {
            var path = folder + '/' + encodeURI(name);
            if (pathsToTry.indexOf(path) === -1) {
                pathsToTry.push(path);
            }
        });
    });

    console.log('Intentando cargar imagenes:', pathsToTry);

    function tryLoadImage(pathIndex) {
        if (pathIndex >= pathsToTry.length) {
            console.warn('No se pudo cargar la imagen. Rutas intentadas:');
            pathsToTry.forEach(function(p) { console.warn(' -', p); });

            var placeholderSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800">' +
                '<rect width="100%" height="100%" fill="#222" />' +
                '<text x="50%" y="45%" fill="#fff" font-size="48" font-family="Arial,Helvetica,sans-serif" text-anchor="middle">Imagen no disponible</text>' +
                '<text x="50%" y="55%" fill="#ccc" font-size="28" font-family="Arial,Helvetica,sans-serif" text-anchor="middle">La imagen original no está en GitHub</text>' +
                '</svg>';
            var placeholderUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(placeholderSVG);

            currentImageOverlay = L.imageOverlay(placeholderUrl, bounds, {
                opacity: 0.95,
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

            alert('No se encontró la imagen original para este polígono en GitHub. Se muestra un marcador de posición.');
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
