# Despacho · Visor de Incidencias (PWA)

PWA para Windows del Dispatcher de Tier 1 (zona Andalucía/Extremadura). Lee incidencias de ATGO
(`https://atgo.tier1.es`), avisa y ayuda a planificar técnicos. Solo escribe en ATGO desde las
acciones confirmadas de la ficha (comentario, cambio de estado, asignar técnico/visita).
Publicada en GitHub Pages: https://angriogon.github.io/VISOR-INCIDENCIAS/

## Cómo trabajar en este repo (ahorra contexto)

- **No leas archivos enteros.** Busca con Grep el nombre de la función o la clave y lee solo ese rango.
  El índice de abajo dice en qué archivo está cada cosa.
- `index.html` es el archivo más pesado (CSS líneas ~17-483, HTML ~484-547, script ~548-1187):
  léelo siempre por rangos.
- No leas `README.md` ni `docs/` salvo que la tarea los necesite. Son para el usuario, no para programar.
- Para tareas largas, lee y actualiza `docs/ESTADO.md` (hecho, pendiente, problemas conocidos).
- Salidas de comandos: muestra solo errores o el final (`| tail`), nunca logs completos.

## Arquitectura

- **Sin build, sin npm, sin framework.** HTML + JS estático. GitHub Pages publica la raíz tal cual.
- **Scripts clásicos que comparten el ámbito global** (no son módulos ES). Orden de carga en `index.html`:
  `xlsx` (CDN) → `dia.js` → `herramientas.js` → `edicion.js` → `panel.js` → script inline.
  Las funciones se llaman entre archivos solo *en tiempo de llamada*: en el nivel superior de un archivo
  no uses nada definido en un archivo que se carga después.
- **Datos:** `rows` (incidencias cargadas) y `source` ('atgo' | 'excel'), en el script inline.
  Cada ticket se identifica con `tkey(r)`.
- **Persistencia:** `localStorage` con claves `dispatcher_<nombre>_v1`, siempre vía `lsGet`/`lsSet` (dia.js).
  Si añades datos nuevos, inclúyelos en `exportBackup`/`restoreBackup` (dia.js).
  El handle de OneDrive va en IndexedDB (`IDB`, herramientas.js).
- **Sincronización ATGO:** `atgo-sync.js` se ejecuta *dentro* de la pestaña de ATGO (marcador o
  `extension/`) y habla con la PWA por `postMessage`:
  - ATGO → PWA: `atgo-data`, `atgo-hilo`, `atgo-estado`, `atgo-editado`, `atgo-status`, `atgo-hello`
    (se reciben en el script inline, ~línea 750).
  - PWA → ATGO: `despacho-ready`, `despacho-refresh`, `despacho-hilo`, `despacho-editar`, `despacho-estado`.
  - El token de ATGO nunca sale de su pestaña. No cambies eso.

## Índice de archivos

| Archivo | Contiene |
|---|---|
| `index.html` | CSS, vistas (`viewDia`, `viewInc`, `viewMan`, `viewSin`, `viewSem`), configuración (`ZONAS`, `ESTADOS`, `COLS`, `TEC_DEF`/`tecCfg`), carga Excel, `render()` (Incidencias), `renderManana()`, `showTab()`, recepción de mensajes de ATGO |
| `dia.js` | Mi día (`renderDia`), novedades (`trackChanges`), avisos de Windows, ficha (`openTicket`/`renderFicha`), notas y seguimientos, hilos ATGO, progreso de ruta (`rutaHoy`), buscador Ctrl+K, rutina, ⚙ (`renderCfg`), copia de seguridad |
| `herramientas.js` | Cerradas 15 días, material, caducidad/SLA, ruta Google Maps y GLS, técnico sugerido, correos del día, informe semanal, copia en OneDrive |
| `edicion.js` | Actuar en ATGO: comentario, cambio de estado, asignar (fase 2) con comprobación campo a campo |
| `panel.js` | Sin asignar y buzón, aviso de sincronización, respuestas rápidas, carga en horas, conflictos, reincidencias, asignación en bloque, Semana, línea de tiempo, pliegues, mapa (Leaflet + Nominatim) |
| `atgo-sync.js` | Sincronización dentro de ATGO (lista `OPERARIOS`, códigos de `ESTADOS`, `REFRESCO_MIN`, edición) |
| `sw.js` | Service worker: `VERSION` y lista `SHELL` de archivos cacheados |
| `extension/` + `despacho-extension.zip` | Extensión Edge/Chrome que lanza `atgo-sync.js` al abrir ATGO |

## Reglas al cambiar código

1. **Sube `VERSION` en `sw.js`** en cada cambio publicado; si no, la app instalada no se actualiza.
2. Si creas un archivo nuevo que carga la app, añádelo a `SHELL` en `sw.js` y a `index.html`.
3. **Técnicos duplicados:** `ZONAS` (index.html) y `OPERARIOS` (atgo-sync.js) deben coincidir.
   Lo mismo con estados: por nombre en `ESTADOS` (index.html) y por código en `atgo-sync.js`.
4. Si cambias `extension/`, regenera `despacho-extension.zip`.
5. No elimines funcionalidades existentes al añadir otras.
6. Cualquier escritura en ATGO debe pedir confirmación, verificarse después y no reintentarse sola.
7. Textos de la interfaz en español de España, cortos y claros.
8. Si cambia el comportamiento visible, actualiza solo la sección afectada del README.
9. Antes de dar algo por terminado: `for f in *.js extension/*.js; do node --check "$f"; done`
   (el script inline de `index.html` no se comprueba así: revisa el cambio con cuidado).
