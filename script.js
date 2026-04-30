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
L.control.layers(baseMaps, null, { position: 'topleft' }).addTo(map);


var info= L.control();
info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info');
    // this._div.innerHTML = '<h4>FOTOINDICES SIHN </h4>'
    return this._div;
};
info.addTo(map);

var allGeoJsonData = null;
var geojsonLayer = null;
var currentFilters = {
    sector: 'all',
    provincia: 'all',
    year: 'all',
    vuelo: 'all'
};

function getUniqueValues(propName, normalizeFn) {
    if (!allGeoJsonData) return [];
    var values = {};
    allGeoJsonData.features.forEach(function(feature) {
        var raw = feature.properties[propName] || '';
        var value = normalizeFn ? normalizeFn(raw) : raw.toString().trim();
        if (!value) return;
        values[value] = true;
    });
    return Object.keys(values).sort();
}

function fillSelect(id, values, allLabel) {
    var select = document.getElementById(id);
    if (!select) return;
    select.innerHTML = '<option value="all">' + (allLabel || 'Todas') + '</option>';
    values.forEach(function(value) {
        select.add(new Option(value, value));
    });
}

function populateFilterOptions() {
    fillSelect('filterSector', getUniqueValues('SECTOR'), 'Todas');
    fillSelect('filterProvincia', getUniqueValues('PROVINCIA_1'), 'Todas');
    fillSelect('filterYear', getUniqueValues('AÑO DE VUELO', function(value) {
        return value ? value.toString().trim() : '';
    }), 'Todos');
    fillSelect('filterVuelo', getUniqueValues('VUELO'), 'Todos');
}

function getCurrentFilterValues() {
    return {
        sector: document.getElementById('filterSector') ? document.getElementById('filterSector').value : 'all',
        provincia: document.getElementById('filterProvincia') ? document.getElementById('filterProvincia').value : 'all',
        year: document.getElementById('filterYear') ? document.getElementById('filterYear').value : 'all',
        vuelo: document.getElementById('filterVuelo') ? document.getElementById('filterVuelo').value : 'all'
    };
}

function resetFilterControls() {
    ['filterSector', 'filterProvincia', 'filterYear', 'filterVuelo'].forEach(function(id) {
        var select = document.getElementById(id);
        if (select) select.value = 'all';
    });
}

function createGeoJsonLayer(data) {
    if (geojsonLayer) {
        map.removeLayer(geojsonLayer);
    }

    geojsonLayer = L.geoJSON(data, {
        style: function(feature) {
            return {
                color: 'BLUE',
                fillColor: 'LIGHTBLUE',
                fillOpacity: 0.051,
                weight: 1
            };
        },
        onEachFeature: function(feature, layer) {
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
            layer.on('click', function() {
                if (imagePath) {
                    var bounds = layer.getBounds();
                    showImageOverlay(imagePath, bounds, feature.properties, imageName);
                }
            });
        }
    }).addTo(map);
}


function applyGeoJsonFilter(filters) {
    if (!allGeoJsonData) return;

    var filteredFeatures = allGeoJsonData.features.filter(function(feature) {
        var sector = (feature.properties.SECTOR || '').toString().trim();
        var provincia = (feature.properties.PROVINCIA_1 || '').toString().trim();
        var vuelo = (feature.properties.VUELO || '').toString().trim();
        var year = (feature.properties['AÑO DE VUELO'] || '').toString().trim();

        if (filters.sector && filters.sector !== 'all' && sector !== filters.sector) {
            return false;
        }
        if (filters.provincia && filters.provincia !== 'all' && provincia !== filters.provincia) {
            return false;
        }
        if (filters.year && filters.year !== 'all' && year !== filters.year) {
            return false;
        }
        if (filters.vuelo && filters.vuelo !== 'all' && vuelo !== filters.vuelo) {
            return false;
        }

        return true;
    });

    var filteredData = {
        type: 'FeatureCollection',
        features: filteredFeatures
    };

    createGeoJsonLayer(filteredData);
    if (geojsonLayer && geojsonLayer.getBounds && filteredFeatures.length > 0) {
        map.fitBounds(geojsonLayer.getBounds());
    }
}

function toggleFooterPanel3() {
    var panel = document.getElementById('footerPanel3');
    if (!panel) return;
    panel.classList.toggle('open');
}

// Cargar datos GeoJSON del shapefile convertido
fetch('polygons.geojson')
    .then(response => response.json())
    .then(data => {
        allGeoJsonData = data;
        populateFilterOptions();
        createGeoJsonLayer(data);
        if (geojsonLayer && geojsonLayer.getBounds) {
            map.fitBounds(geojsonLayer.getBounds());
        }

        var applyButton = document.getElementById('applyFilters');
        var clearButton = document.getElementById('clearFilters');

        if (applyButton) {
            applyButton.addEventListener('click', function() {
                currentFilters = getCurrentFilterValues();
                applyGeoJsonFilter(currentFilters);
            });
        }

        if (clearButton) {
            clearButton.addEventListener('click', function() {
                resetFilterControls();
                currentFilters = getCurrentFilterValues();
                applyGeoJsonFilter(currentFilters);
            });
        }
    })
    .catch(error => {
        console.error('Error cargando el GeoJSON:', error);
        alert('Error al cargar los datos del mapa');
    });

var imageOverlays = []; // Mantener múltiples overlays abiertos

// Función para mostrar la imagen como overlay georreferenciado
function showImageOverlay(imagePath, bounds, properties, originalName) {

    var rawName = originalName ? originalName.trim() : '';
    var cleanedName = rawName.replace(/^.*[\\/]/, '').trim();
    cleanedName = cleanedName.replace(/\s+/g, ' ').trim();
    if (cleanedName.normalize) {
        cleanedName = cleanedName.normalize('NFC');
    }

    function addCandidate(list, name) {
        if (!name || name.length === 0) return;
        if (list.indexOf(name) === -1) list.push(name);
    }

    var candidateNames = [];
    var baseName = cleanedName.replace(/\.(png|tif)$/i, '');
    var variants = [
        baseName,
        baseName.replace(/ /g, '_'),
        baseName.replace(/_/g, ' '),
        baseName.toUpperCase(),
        baseName.toLowerCase()
    ];

    variants.forEach(function(variant) {
        addCandidate(candidateNames, variant + '.png');
        addCandidate(candidateNames, variant + '.tif');
    });

    var foldersToSearch = ['images', '1/images'];
    var pathsToTry = [];
    foldersToSearch.forEach(function(folder) {
        candidateNames.forEach(function(name) {
            var path = folder + '/' + encodeURIComponent(name).replace(/%2F/g, '/');
            if (pathsToTry.indexOf(path) === -1) {
                pathsToTry.push(path);
            }
        });
    });

    var tifDownloadUrl = pathsToTry.find(function(path) {
        return /\.tif$/i.test(path);
    }) || null;

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

            var imageOverlay = L.imageOverlay(placeholderUrl, bounds, {
                opacity: 0.95,
                interactive: true,
                zIndex: 500
            }).addTo(map);
            imageOverlays.push(imageOverlay);

            if (imageOverlay._image) {
                imageOverlay._image.style.zIndex = '500';
            }

            var closeButton = L.control({ position: 'topright' });
            closeButton.onAdd = function(map) {
                var div = L.DomUtil.create('div', 'close-overlay-btn');
                var closeBtn = L.DomUtil.create('button', 'close-btn', div);
                closeBtn.textContent = '✕ Cerrar imagen';
                closeBtn.onclick = function(e) {
                    e.stopPropagation();
                    map.removeLayer(imageOverlay);
                    map.removeControl(closeButton);
                };

                var downloadBtn = L.DomUtil.create('button', 'download-btn', div);
                downloadBtn.textContent = tifDownloadUrl ? 'Descargar TIF' : 'TIF no disponible';
                if (tifDownloadUrl) {
                    downloadBtn.onclick = function(e) {
                        e.stopPropagation();
                        window.open(tifDownloadUrl, '_blank');
                    };
                } else {
                    downloadBtn.disabled = true;
                }

                return div;
            };
            closeButton.addTo(map);

            alert('No se encontró la imagen original para este polígono en GitHub. Se muestra un marcador de posición.');
            return;
        }

        var testPath = pathsToTry[pathIndex];
        var img = new Image();
        img.onload = function() {
            var imageOverlay = L.imageOverlay(testPath, bounds, {
                opacity: 1.0,
                interactive: true,
                zIndex: 500
            }).addTo(map);
            imageOverlays.push(imageOverlay);

            if (imageOverlay._image) {
                imageOverlay._image.style.zIndex = '500';
            }

            var closeButton = L.control({ position: 'topright' });
            closeButton.onAdd = function(map) {
                var div = L.DomUtil.create('div', 'close-overlay-btn');
                var closeBtn = L.DomUtil.create('button', 'close-btn', div);
                closeBtn.textContent = '✕ Cerrar imagen';
                closeBtn.onclick = function(e) {
                    e.stopPropagation();
                    map.removeLayer(imageOverlay);
                    map.removeControl(closeButton);
                };

                var downloadBtn = L.DomUtil.create('button', 'download-btn', div);
                downloadBtn.textContent = tifDownloadUrl ? 'Descargar TIF' : 'TIF no disponible';
                if (tifDownloadUrl) {
                    downloadBtn.onclick = function(e) {
                        e.stopPropagation();
                        window.open(tifDownloadUrl, '_blank');
                    };
                } else {
                    downloadBtn.disabled = true;
                }

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

    document.addEventListener('click', function(e) {
        var dropdown = document.getElementById('filterDropdown');
        var button = document.getElementById('filterToggle');
        if (!dropdown || !button) return;
        if (dropdown.classList.contains('active') && e.target !== dropdown && e.target !== button && !dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });
});
