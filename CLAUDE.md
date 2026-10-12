# Despacho · Visor de Incidencias (PWA)

PWA para Windows del Dispatcher de Tier 1 (zona Andalucía/Extremadura). Lee incidencias de ATGO
(`https://atgo.tier1.es`), avisa y ayuda a planificar técnicos. Solo escribe en ATGO desde las
acciones confirmadas de la ficha (comentario, cambio de estado, asignar técnico/visita).
Publicada en GitHub Pages: https://angriogon.github.io/VISOR-INCIDENCIAS/

## Cómo trabajar en este repo (ahorra contexto)

- **No leas archivos enteros.** Busca con Grep el nombre de la función o la clave y lee solo ese rango.
  El índice de abajo dice en qué archivo está cada cosa.
- `index.html` solo tiene la estructura (~85 líneas). El CSS está en `styles.css` y el script principal en `app.js`:
  léelos siempre por rangos.
- No leas `README.md` ni `docs/` salvo que la tarea los necesite. Son para el usuario, no para programar.
- Para tareas largas, lee y actualiza `docs/ESTADO.md` (hecho, pendiente, problemas conocidos).
- Salidas de comandos: muestra solo errores o el final (`| tail`), nunca logs completos.

## Arquitectura

- **Sin build, sin npm, sin framework.** HTML + JS estático. GitHub Pages publica la raíz tal cual.
- **Scripts clásicos que comparten el ámbito global** (no son módulos ES). Orden de carga en `index.html`:
  `dia.js` → `herramientas.js` → `edicion.js` → `panel.js` → `app.js` → `ajustes.js`. Excel (XLSX) y Leaflet se cargan
  al usarlos con `cargarLibreria` (app.js).
  El arranque de `ajustes.js` va en `DOMContentLoaded` (cuando ya existe todo).
  Las funciones se llaman entre archivos solo *en tiempo de llamada*: en el nivel superior de un archivo
  no uses nada definido en un archivo que se carga después.
- **Datos:** `rows` (incidencias cargadas) y `source` ('atgo' | 'excel'), en `app.js`.
  Cada ticket se identifica con `tkey(r)`.
- **Perfiles:** `ZONAS_BASE` (todas las zonas, con `apoyo`) → `ZONAS` = solo los técnicos del perfil activo
  (`PERFIL`, `perfilCfg` en `dispatcher_perfiles_v1`). `OPERARIOS`/`TECNICOS` salen de `ZONAS`; para la lista
  completa usa `TODOS_OPS` (todos los perfiles) o `BASE_OPS`/`ZONAS_BASE` (todas las zonas; `dsp` = perfil de la zona, sin `dsp` = DSP1), y `zonaOps(zona)` para los técnicos
  que pueden atender una zona. Los técnicos fuera de ZONAS_BASE se agrupan en una zona con el nombre de su perfil (`perfilDeOp`).
  Selector de técnico único: `opcionesTecnico` (panel.js). Ventana de perfiles: `abrirPerfiles` (ajustes.js).
  Nómina (⚙ › Técnicos, `abrirNomina` en ajustes.js): altas, zona/DSP y bajas en `perfilCfg.nomina`; se aplica sobre `ZONAS_BASE`
  al arrancar (`NOMINA`/`moverEnZonas` en app.js). Los de baja (`enBaja(op)`) no se proponen al asignar (recomendar, opcionesTecnico, zonasVisibles).
  A atgo-sync se manda `operarios` (perfil activo, lo que se sincroniza) y `permitidos` (todos, a quién se puede asignar).
- **Persistencia:** `localStorage` con claves `dispatcher_<nombre>_v1`, siempre vía `lsGet`/`lsSet` (dia.js).
  Si añades datos nuevos, inclúyelos en `exportBackup`/`restoreBackup` (dia.js).
  El handle de OneDrive va en IndexedDB (`IDB`, herramientas.js).
- **Sincronización ATGO:** `atgo-sync.js` se ejecuta *dentro* de la pestaña de ATGO (marcador o
  `extension/`) y habla con la PWA por `postMessage`:
  - ATGO → PWA: `atgo-data`, `atgo-hilo`, `atgo-estado`, `atgo-editado`, `atgo-status`, `atgo-hello`
    (se reciben en `app.js`, `window.addEventListener('message', …)`).
  - PWA → ATGO: `despacho-ready`, `despacho-config` (lista de técnicos = `TODOS_OPS`), `despacho-refresh`, `despacho-hilo`, `despacho-editar`, `despacho-estado`.
  - Con un campo en uso (`ocupado()` en app.js) no se repinta: `atgo-data` queda en `atgoEnCola` y `refreshVisible` marca `refrescoPendiente`.
  - El token de ATGO nunca sale de su pestaña. No cambies eso.

## Índice de archivos

| Archivo | Contiene |
|---|---|
| `index.html` | Estructura: cabecera, pestañas y contenedores de las vistas (`viewDia`, `viewSin`, `viewInc`, `viewSem`, `viewMan` = día de Planificación) |
| `styles.css` | Estilos; bloque `v1.13` (tema oscuro manual, ficha flotante…) y `v1.21` (colores: `--acento`/`--amber` = acento, `--warn` = avisos en naranja; compacto/amplio; `acc-*` accesibilidad; nómina) |
| `app.js` | Configuración (`ZONAS_BASE`, perfiles, `ESTADOS`, `COLS`, `TEC_DEF`/`tecCfg`), carga Excel, `render()` (Incidencias), filtros (`filtroInc`, filtros guardados), `estadoPill`, `renderManana()` (día), WhatsApp (`abrirWa`, plantillas, `enviarTodasRutas`), `showTab()`, `applyAtgo` (con `cargaSospechosa`), recepción de mensajes de ATGO |
| `ajustes.js` | `APP_VERSION`, `NOVEDADES` (se ven las 5 últimas + `ANTERIORES`), ⚙ (`renderCfg` por secciones), perfiles, nómina, apariencia (color `ACENTOS`, densidad, accesibilidad `ACC_OPS`, foco en ventanas `vigilarVentana`), atajos de teclado, menú contextual, acciones del buscador (→), asistente, diagnóstico (`diagLog`), migraciones, resumen matinal y técnico sin actividad, exportar a Excel |
| `dia.js` | Mi día (`renderDia`), novedades (`trackChanges`), avisos de Windows, ficha (`openTicket(key, tab)`/`renderFicha` con pestañas Resumen·Actuar·Historial), notas y seguimientos, hilos ATGO (`HILO_SISTEMA`), progreso de ruta (`rutaHoy`), buscador Ctrl+K, copia de seguridad |
| `herramientas.js` | Cerradas 15 días, material, caducidad/SLA, ruta Google Maps y GLS, técnico sugerido, correos del día, informe semanal, copia en OneDrive |
| `edicion.js` | Actuar en ATGO: comentario, cambio de estado, asignar (fase 2) con comprobación campo a campo |
| `panel.js` | Sin asignar y buzón (`recomendar`, misma sede: `mismaSede`/`sedeAvisoHtml`/`sedeConfirmHtml`), aviso de sincronización, respuestas rápidas, duración (`minutosTexto`, `duracionInfo`, `estimarMin` puede ser null) y carga en horas, conflictos, reincidencias, asignación en bloque, Semana, línea de tiempo, pliegues, mapa (Leaflet + Nominatim + OSRM) |
| `tests/pruebas.js` | Pruebas sin dependencias (duración, caducidad, coherencia de listas y versiones). GitHub Actions las ejecuta |
| `atgo-sync.js` | Sincronización dentro de ATGO (lista `OPERARIOS`, códigos de `ESTADOS`, `REFRESCO_MIN`, edición) |
| `sw.js` | Service worker: `VERSION` y lista `SHELL` de archivos cacheados |
| `extension/` + `despacho-extension.zip` | Extensión Edge/Chrome que lanza `atgo-sync.js` al abrir ATGO |

## Reglas al cambiar código

1. **Sube `VERSION` en `sw.js`** en cada cambio publicado; si no, la app instalada no se actualiza.
   Súbela igual en `APP_VERSION` (`ajustes.js`) y añade la versión a `NOVEDADES`. Si cambias `atgo-sync.js`, sube `SYNC_VERSION`
   en él y en `app.js` (Despacho avisará de recargar la pestaña de ATGO).
2. Si creas un archivo nuevo que carga la app, añádelo a `SHELL` en `sw.js` y a `index.html`.
3. **Técnicos duplicados:** `ZONAS_BASE` (app.js) manda; `OPERARIOS` (atgo-sync.js) es el respaldo y debe coincidir.
   Asignar: siempre por `asignarLote` (también una sola) y técnico recomendado por `recomendar` (sugerirTecnico lo usa).
   Lo mismo con estados: por nombre en `ESTADOS` (app.js) y por código en `atgo-sync.js`.
4. Si cambias `extension/`, regenera `despacho-extension.zip`.
5. No elimines funcionalidades existentes al añadir otras.
6. Cualquier escritura en ATGO debe pedir confirmación, verificarse después y no reintentarse sola.
7. Textos de la interfaz en español de España, cortos y claros.
8. Si cambia el comportamiento visible, actualiza solo la sección afectada del README.
9. Antes de dar algo por terminado: `for f in *.js extension/*.js; do node --check "$f"; done`, `node tests/pruebas.js` y,
   si puedes, `tests/arranque.mjs` (necesita `playwright-core`; en GitHub Actions se ejecuta solo).
   Preferencias en `tecCfg` se guardan en `dispatcher_preferencias_v1`; teléfonos y GLS en `dispatcher_tecnicos_v1` (`saveTec`).
10. Para parchear con barras invertidas (regex), usa Edit/Write o un archivo de parche: `node -e` desde bash las pierde.
11. Probar en local: `.claude/launch.json` (servidor en el puerto 8765). El service worker sirve caché: antes de recargar,
    `navigator.serviceWorker.getRegistrations()` → `unregister()` y vacía `caches`.
