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

## Eliminación automática de fondo
Puedes eliminar el fondo blanco o de color de tus imágenes con el nuevo script `remove_background.py`.

Ejemplo de uso:
```bash
py remove_background.py --dirs images "1/images" --output images_transparent --tolerance 32
```

- `--dirs`: carpetas donde buscar PNG y TIFF.
- `--output`: carpeta donde se guardarán los PNG procesados.
- `--tolerance`: sensibilidad al color del fondo; ajusta el valor si el fondo no se elimina correctamente.
- `--overwrite`: opcional; sobrescribe archivos PNG en su lugar.
- `--dry-run`: muestra los archivos que serían procesados sin guardarlos.

En `script.js`, el mapa busca primero las imágenes en `images_transparent` y, si no están disponibles, carga las originales desde `images` o `1/images`.
