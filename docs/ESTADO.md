# Estado del proyecto

Archivo de traspaso entre sesiones. Al empezar una sesión: «lee docs/ESTADO.md y continúa». Al terminar: «actualiza docs/ESTADO.md».
Máximo ~40 líneas: lo antiguo se resume o se borra (el detalle está en git y en `NOVEDADES` de `ajustes.js`).

## Versión actual
- `sw.js` despacho-v1.36.0 = `APP_VERSION` (ajustes.js). `SYNC_VERSION` 1.36.0 (atgo-sync.js = app.js). Extensión 2.2.0 (lleva copia de atgo-sync.js).
- 1.35.0 (auditoría, lotes 1–5 y mejoras sin API; publicada el 2026-11-08): ver NOVEDADES. Nuevo `prioridades.js`.
  Control: `ctlPorDsp`, `CTL_EDADES`, vistas pron/esta, `revisarInformeAuto`. Nómina: `hab` y `vac[].p` ('m'/'t'). Incidencias: `tecCfg.vistaInc`.
  CSS: limpieza comprobada sin diferencias en 83.224 elementos; después, contraste AA y letra mínima de 11 px.
- Publicación: `.github/workflows/pruebas.yml` publica solo si pasan las pruebas. Pages ya usa «GitHub Actions» como fuente.

## Pendiente (espera al usuario)
- Instalar la extensión 2.2 y validar «Nueva incidencia» (1.36.0) con un ticket real: lo crea el usuario, Claude no escribe en ATGO. Sin Actuación: si ATGO la exige, responderá con error.
- Contraseña de ATGO en la extensión (S2) y dominio propio (S4): decisiones de empresa.
- Repositorio público: siguen los códigos de técnico en el código (sin servidor no se pueden sacar).
- Recogida GLS de las zonas DSP2–5 y si Canarias pertenece a algún DSP.
- Propuestas con API (docs/propuestas-dsp-coord-api.md) e implantación (docs/implantacion-empresa.md).
- Deuda técnica: pasar a módulos ES (462 funciones globales, 200+ onclick) y partir las líneas largas de las plantillas: mejor en la 2.0.

## Validado con ATGO real
- El usuario confirmó el 2026-11-08 la prueba de la 1.35 y la extensión 2.1. Claude no escribe en ATGO.

## Descartado por ahora (el usuario lo deja para el futuro)
- Avisos de Windows por DSP en COORD, plantillas de comentario por cliente.
- Mi día sin Parados/Sin planificar/Seguimientos/Rutina/Reincidencias (el usuario lo pidió: no volver a añadirlas).

## Problemas conocidos
- Barras invertidas: `node -e` y heredocs desde bash las pierden. Usar Write + un script de parche o Edit.
- Probar en local: el service worker sirve caché; desregistrarlo y vaciar `caches` antes de recargar.
- Chrome de marca no admite `--load-extension`: para probar la extensión, Chromium de Playwright.
- Nominatim no encuentra muchas direcciones de polígono/carretera: el mapa las sitúa en su población.
- Un 400 «Parameterized Exception» de ATGO al guardar puede ser un ticket corrupto en ATGO (pasó con el 2026/00/98183).

## Decisiones tomadas
- Sin build ni framework: archivos estáticos.
- Sincronización por operario (6 en paralelo) cada 2 min siempre. `codOpe.in` no funciona en ATGO.
- Escrituras en ATGO solo con confirmación y comprobación campo a campo; sin reintentos automáticos.
- Perfiles y nómina locales en cada equipo (`dispatcher_perfiles_v1`); se pasan con Exportar/Importar perfiles.
