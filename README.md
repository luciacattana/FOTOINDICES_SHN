# FOTOINDICES SHN

Proyecto de visualización de índices fotográficos con Leaflet, GeoJSON y capas de imágenes georreferenciadas.

## Contenido principal
- `index.html` — interfaz del mapa
- `script.js` — carga de GeoJSON, gestión de popups y overlays de imágenes
- `polygons.geojson` — datos poligonales con referencias a imágenes
- `convert_tifs_to_png.py` — script de conversión de TIFF a PNG para navegadores

## Cómo publicar en GitHub
1. Asegúrate de tener el remoto configurado: `git remote -v`
2. Agrega y confirma los cambios:
   ```bash
git add .gitignore README.md index.html script.js polygons.geojson convert_tifs_to_png.py
git commit -m "Preparar repositorio para publicación en GitHub"
```
3. Envía los cambios al remoto:
   ```bash
git push origin master
```

## Nota importante
Los archivos TIFF grandes se ignoran en `.gitignore` para evitar subir datos pesados a GitHub. Si necesitas usar imágenes en el navegador, convierte los TIFF referenciados a PNG con `convert_tifs_to_png.py`.
