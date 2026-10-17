# Estado del proyecto

Archivo de traspaso entre sesiones. Al empezar una sesión: «lee docs/ESTADO.md y continúa». Al terminar: «actualiza docs/ESTADO.md».
Máximo ~40 líneas: lo antiguo se resume o se borra (el detalle está en git y en `NOVEDADES` de `ajustes.js`).

## Versión actual
- `sw.js` despacho-v1.31.0 = `APP_VERSION` (ajustes.js). `SYNC_VERSION` 1.30.0 (atgo-sync.js = app.js). Publicada en GitHub Pages.
- Funciones principales: perfiles DSP1–5 y COORD (panel de CONTROL con Excel), nómina, Mi día, Sin asignar, Incidencias por estado,
  Planificación (arrastrar, en bloque de 4 en 4, rellenar el día, mapa), ficha con escrituras en ATGO comprobadas, reincidencias por equipo,
  festivos, apariencia y accesibilidad, avisos de Windows, copia en OneDrive.
- 1.25–1.31 (todas probadas por el usuario): limpieza para implantación; solapes en la misma sede no cuentan (mismoSitio);
  bajas y vacaciones fuera de los paneles (noDisponible, nomina[op].vac); Planificación con zonas plegables; mapa progresivo con
  precarga de direcciones (precargarGeo, cola única de Nominatim); Control (coord.js): FUERA DE MANTENIMIENTO sin SLA (ESTADOS_SIN_SLA),
  vistas Presencial/Todas, filtro por proyecto (atgo-sync completarProyectos + proyDe/PROY_KEY), orden por columna (CTL_COLS);
  ⚙ › General › ACTUALIZAR (actualizarAhora); proyecto en la ficha.

## Pendiente (espera al usuario)
- Crear tickets desde Despacho: lista de campos y valores por defecto (`docs/estudio-alta-tickets.md`; viable: POST /incidencias/alta).
- Recogida GLS de las zonas DSP2–5 y si Canarias pertenece a algún DSP.
- Propuestas DSP, COORD y API (docs/propuestas-dsp-coord-api.md): espera a que el usuario elija cuáles.
- Implantación en empresa: decisiones en `docs/implantacion-empresa.md`. Versión móvil: `docs/propuesta-ios.md`.

## Por validar con datos reales (lo prueba el usuario; Claude no escribe en ATGO)
- Tiempo de un lote de ~10 asignaciones (1.23.0) y «Forzar reconexión».
- 🔁 reincidencias: que `codElemento` llegue en la lista de ATGO (si no, solo IT/caja del texto).
- «Deshacer» tras asignar; arrastrar en Planificación.

## Descartado por ahora (el usuario lo deja para el futuro)
- Avisos de Windows por DSP en COORD, carga semanal por DSP, plantillas de comentario por cliente.
- Mi día sin Parados/Sin planificar/Seguimientos/Rutina/Reincidencias (el usuario lo pidió: no volver a añadirlas).

## Problemas conocidos
- Barras invertidas: `node -e` y heredocs desde bash las pierden. Usar Write + un script de parche (CRLF-aware) o Edit.
- Probar en local: el service worker sirve caché; desregistrarlo y vaciar `caches` antes de recargar.
- Nominatim no encuentra muchas direcciones de polígono/carretera: el mapa las sitúa en su población.
- Un 400 «Parameterized Exception» de ATGO al guardar puede ser un ticket corrupto en ATGO (pasó con el 2026/00/98183).

## Decisiones tomadas
- Sin build ni framework: archivos estáticos en la raíz, publicados con GitHub Pages.
- Sincronización por operario (6 en paralelo) cada 2 min siempre. `codOpe.in` no funciona en ATGO.
- Escrituras en ATGO solo con confirmación y comprobación campo a campo; sin reintentos automáticos. Los cambios van solo a la pestaña
  de ATGO que sincroniza (atgoSource cambia con atgo-data/atgo-hello).
- Perfiles y nómina locales en cada equipo (`dispatcher_perfiles_v1`); se pasan con Exportar/Importar perfiles.
