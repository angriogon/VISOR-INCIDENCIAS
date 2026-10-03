# Visor de Incidencias · Panel de Despacho

PWA para Windows para el trabajo diario de Dispatcher:

- **Incidencias:** importas el Excel/CSV del día y las incidencias se agrupan por operario (columna K). Hay filtro **Andalucía**, vista **En ruta total** (visitas presenciales de hoy, una tarjeta por técnico) y filtros *En ruta / Fuera de ruta* en cada técnico.
- **Plantillas:** correos por cliente con campos variables (`{tecnico}`, `{num}`, `{sede}`, `{fecha}`, `{hora}`, `{direccion}`, `{tiempo}`, `{cliente}`) que se pueden rellenar desde una incidencia, y recordatorios para técnicos.

No hace falta compilar nada: son archivos estáticos (HTML + JS) y GitHub Pages los publica tal cual.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `index.html` | La aplicación completa |
| `manifest.webmanifest` | Nombre, iconos y ajustes para instalarla como app de Windows |
| `sw.js` | Service worker: funcionamiento sin conexión y actualizaciones |
| `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `favicon.svg` | Iconos |
| `.nojekyll` | Hace que GitHub Pages publique los archivos sin procesarlos |

Todos los archivos van **en la raíz** del repositorio, sin carpetas.

## Publicar en GitHub Pages

1. En el repositorio, **Add file → Upload files** y arrastra todos los archivos de esta carpeta (también `.nojekyll`; si el Explorador no lo muestra, activa *Vista → Mostrar → Elementos ocultos*). Haz *Commit changes*.
2. **Settings → Pages → Build and deployment**:
   - *Source:* **Deploy from a branch**
   - *Branch:* **main**, carpeta **/ (root)**, y pulsa *Save*.
3. Espera 1–2 minutos. La app quedará en:
   **https://angriogon.github.io/VISOR-INCIDENCIAS/**

## Instalarla en Windows

1. Abre la dirección anterior en **Edge** o **Chrome**.
2. Pulsa el botón **Instalar app** de la cabecera (o el icono de instalar de la barra de direcciones; en Edge también está en *⋯ → Aplicaciones → Instalar este sitio como aplicación*).
3. La app aparece en el menú Inicio como **Despacho** y la puedes anclar a la barra de tareas.

Una vez instalada:
- Funciona **sin conexión** después de abrirla una vez con internet.
- Puedes **arrastrar el Excel** sobre la ventana, o en el Explorador usar *clic derecho → Abrir con → Despacho*.

## Tus datos

- **El Excel no sale de tu equipo:** se lee en el navegador y no se guarda en ningún sitio. Hay que importarlo cada vez que abres la app.
- **Las plantillas y los recordatorios** se guardan en el almacenamiento local de la app, en ese equipo y navegador. Para no perderlos o para llevarlos a otro equipo, usa **Plantillas → Exportar copia** (descarga un `.json`) y luego **Restaurar copia** (también puedes arrastrar el `.json` sobre la ventana).
- Las plantillas que creaste en la versión de prueba (el artefacto de Claude) **no se pasan solas**: esa versión vive en otra dirección web. Tendrás que volver a crearlas aquí una vez.

## Publicar cambios

1. Edita y sube los archivos que cambien.
2. En `sw.js`, cambia `VERSION` (por ejemplo, de `despacho-v1.0.0` a `despacho-v1.0.1`). Si no lo cambias, la app instalada puede seguir usando la versión antigua.
3. La próxima vez que abras la app aparecerá el aviso **"Hay una versión nueva" → Actualizar**.

## Configuración rápida (en `index.html`)

- `ANDALUCIA_TECHS`: iniciales de los técnicos del filtro Andalucía.
- `COLS`: qué columna del Excel corresponde a cada dato (0 = A, 1 = B, …).
