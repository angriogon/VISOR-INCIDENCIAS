# Estado del proyecto

Archivo de traspaso entre sesiones. Al empezar una sesión: «lee docs/ESTADO.md y continúa». Al terminar: «actualiza docs/ESTADO.md».
Máximo ~40 líneas: lo antiguo se resume o se borra (el detalle está en git y en `NOVEDADES` de `ajustes.js`).

## Versión actual
- `sw.js` despacho-v1.45.0 = `APP_VERSION` (ajustes.js). `SYNC_VERSION` 1.42.4 (atgo-sync.js = app.js). App Android 1.1.0 (logo nuevo). Extensión 2.3.0: descarga la sincronización firmada (`tools/firmar-sync.mjs`; clave en `%USERPROFILE%\.despacho`, si se pierde hay que generar otra y reinstalar).
- 1.35.0 (auditoría, lotes 1–5 y mejoras sin API; publicada el 2026-11-08): ver NOVEDADES. Nuevo `prioridades.js`.
  Control: `ctlPorDsp`, `CTL_EDADES`, vistas pron/esta, `revisarInformeAuto`. Nómina: `hab` y `vac[].p` ('m'/'t'). Incidencias: `tecCfg.vistaInc`.
  CSS: limpieza comprobada sin diferencias en 83.224 elementos; después, contraste AA y letra mínima de 11 px.
- Publicación: `.github/workflows/pruebas.yml` publica solo si pasan las pruebas. Pages ya usa «GitHub Actions» como fuente.

- Desarrollo en el servidor Ubuntu (`automation`, 2026-11-17): repo, claves en `~/.despacho` (comprobadas con las firmas publicadas), gh, Docker y Claude siempre abierto (`tools/sesion-permanente.sh`). Ya no hace falta el TL021A. Prueba de arranque: `NAVEGADOR=chromium` (docs/servidor-ubuntu.md).
- 1.45.0: ⚙ como ventana (`#cfgMenu` se mueve al body; `CFG_SEC`, `cfgIt`/`cfgSw`/`cfgCard`, `cfgIr`, `cerrarCfg`; interruptores `input.sw`). Secciones gen/srv/avi/apa/equ/fes/wa/dat (perf y tec pasan a «equ»). Servidor: `srvEditar` oculta el formulario si ya hay credenciales.
- 1.43.0 · piloto automático, fase 0 (solo lectura): `servidor/motor.mjs` (Chromium sin pantalla con ATGO, inicio de sesión con `~/.despacho/atgo.json`, atgo-sync firmado, historial SQLite en `~/.local/share/despacho-motor/historial.db`: tablas carga/ticket/evento, API en 127.0.0.1:8791 publicada con Tailscale Funnel en :8443). PWA: ⚙ › Servidor (`srvHtml`/`srvRevisar`, `tecCfg.srvUrl`/`srvClave`; 1.43.1 Instancia) y 1.44.0 píldora «Servidor» en el menú lateral (`srvPildora`, consulta cada minuto). Primera carga real del motor el 25/11 12:21 (94 + 25 sin asignar). Plan: fase 1 sombra (propone y mide acierto), fase 2 asigna sola L–V con margen de cortesía y «La llevo yo», fase 3 planificación. El usuario aceptó cambiar la regla de confirmación para el piloto y que no funcione en fin de semana.
- 1.42.7: retirada «Hoy en directo» de Mi día (`lineaTiempoHtml`, `#secTL`, CSS `.tl-*`).
- 1.42.6: Caducidades de Mi día y avisos SLA solo en `ESTADOS_CADUCIDAD` (herramientas.js): PRESENCIAL, PTE. MOVER MATERIAL, MATERIAL PTE. FABRICANTE.
- 1.42.5: logo nuevo (ruta → pin con ✓; PWA y app Android 1.1.0, APK en ../app-despacho). Ficha: comentario + estado en un solo envío (`actuarAtgo`) y «Mover también otras de…» en Planificar (`asExtra`, va por `asignarLote`).
- 1.42.1–1.42.4: quitar la fecha de visita NO es posible en ATGO (ni desde su web, comprobado por el usuario el 23/11): sin parámetro y con `fechaVisita=` vacío la conserva; con `null` da 400. En la 1.42.4 se deshizo el intento y `asignarAtgo` avisa si se borra la fecha.
- 1.42.0: «Diseño nuevo (prueba)» (`tecCfg.disenoNuevo`, ⚙ › Apariencia; `disenoNuevo`/`dnMenu` en ajustes.js): clase `html.dn`, mueve `.tabs` a un menú lateral `#dnSide` y lo devuelve al quitarlo; todo el CSS al final de styles.css. Mi día con columnas `.dia-ca`/`.dia-cb` (`display:contents` en el diseño de siempre). Maqueta aprobada: https://claude.ai/artifact/C9ZctgUJLWb5iYLz3HzcuW. Falta que el usuario lo pruebe con datos reales antes de hacerlo el diseño por defecto.
- 1.41.0: Mi día como lista de tareas (`tareaHtml`, ids `tCad`/`tSedes`/`tConf`/`tMat`, plegadas por defecto) y herramientas con icono (`herramientasDiaHtml`, dia.js). Sin tarjetas ni menú «Más». 1.41.1: las rutas ya no cuentan como pendiente (los técnicos las ven en ATGO); el envío por WhatsApp sigue en Planificación.
- 1.40.0: Incidencias con «Seleccionar» (`incSel`, `incSelAsignar` en app.js) para reasignar varias por `asignarLote`; con el modo activo, pulsar una línea la marca (dia.js).
- Despacho móvil 1.7.0 (`movil.js`): sin pestaña Buscar; Sin asignar con «Seleccionar» (`selSin`, `confirmarVarias`/`hacerVarias`: una confirmación, se guardan una a una con `asignar` y su comprobación); WhatsApp de la ficha con todos los datos (Técnico a Motivo). 1.6.0: Actividad con leídas una a una (`PA.leidas`) y deslizar configurable (`PA.desliza`, ⋮ › Deslizar en Actividad). Incidencias solo con PRESENCIAL, FUERA DE MANTENIMIENTO, PTE. MOVER MATERIAL, MATERIAL PTE. FABRICANTE, EN FABRICANTE y PUESTO OPERATIVO; el hilo solo se relee si cambia el estado o el técnico, es visita de hoy o tiene más de 6 h (carga rápida: todos). Las que pasan a otro estado quedan del día en `E.fuera` para Actividad.

## Pendiente (espera al usuario)
- Contraseña de ATGO en la extensión (S2) y dominio propio (S4): decisiones de empresa.
- Repositorio público: siguen los códigos de técnico en el código (sin servidor no se pueden sacar).
- Recogida GLS de las zonas DSP2–5 y si Canarias pertenece a algún DSP.
- Propuestas con API (docs/propuestas-dsp-coord-api.md) e implantación (docs/implantacion-empresa.md).
- Deuda técnica: pasar a módulos ES (462 funciones globales, 200+ onclick) y partir las líneas largas de las plantillas: mejor en la 2.0.

## Validado con ATGO real
- El usuario confirmó el 2026-11-08 la prueba de la 1.35 y la extensión 2.1. Claude no escribe en ATGO.
- Nueva incidencia: primer alta real correcta (2026-11-08, 2026/00/102390); Sede y Proyecto solo traen lo del cliente (comprobado el 2026-11-17).

## Descartado por ahora (el usuario lo deja para el futuro)
- Avisos de Windows por DSP en COORD, plantillas de comentario por cliente.
- Mi día sin Parados/Sin planificar/Seguimientos/Rutina/Reincidencias (el usuario lo pidió: no volver a añadirlas).

## Problemas conocidos
- Horas de ATGO: escribe la hora de España marcada como UTC («Z»/«+0000»); `isoTs` (atgo-sync.js) la lee como hora local desde la 1.39.2. Pendiente de confirmar con ATGO real.
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
