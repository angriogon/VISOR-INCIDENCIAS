# Estado del proyecto

Archivo de traspaso entre sesiones. Al empezar una sesión: "lee docs/ESTADO.md y continúa".
Al terminar: "actualiza docs/ESTADO.md". Máximo ~40 líneas: lo antiguo se resume o se borra.

## Versión actual
- `sw.js`: despacho-v1.18.0 = `APP_VERSION` en `ajustes.js` (publicada en GitHub Pages).
- 1.13.0: perfiles DSP1–5/COORD, mapa con todas las incidencias del técnico, duración leída del hilo (sin estimación si no se sabe),
  fecha en Sin asignar, apoyo Cádiz→Ceuta y Málaga→Melilla, ficha flotante con pestañas, globo de estado + fecha en Incidencias,
  ⓘ novedades, aviso 📍 misma sede al asignar y toda la batería de `docs/estudio-mejoras-windows.md`.
- Código partido: `index.html` (estructura) + `styles.css` + `app.js` + `ajustes.js` (nuevo). Pruebas en `tests/pruebas.js` + GitHub Actions.
- Mi día sin Parados/Sin planificar/Seguimientos/Rutina/Reincidencias (el usuario lo pidió: no volver a añadirlas).

- 1.13.1: asignación masiva en Sin asignar; sincronización siempre cada 2 min (el usuario lo pidió).
- 1.14.0 (pulido, sin funciones nuevas): no repintar con un campo en uso, límites y limpieza del almacenamiento, errores de ATGO claros
  y respuestas tardías, asignar siempre por asignarLote, lista de técnicos enviada a ATGO, código muerto quitado (rutina…), 38 pruebas.
- 1.15.0 (revisión de código): progreso del día solo con el técnico asignado, cola de refresco y versión de la sincronización
  (SYNC_VERSION en atgo-sync.js y app.js), Excel/Leaflet bajo demanda, preferencias en su propia clave,
  prueba de arranque en navegador (tests/arranque.mjs) en GitHub Actions: pasa.
- 1.15.1: extensión 1.1.0 con "world": "MAIN" (en el mundo aislado Chrome bloqueaba atgo-sync.js por CSP de MV3);
  validada por el usuario en Chrome. Sin sesión, atgo-sync reintenta cada 30 s.
- 1.16.0: asignar a cualquier técnico de cualquier perfil (también Todas las zonas y buzón); DSP2–DSP5 con sus técnicos
  (PERFIL_INICIAL, solo una vez: flag inicial1); ventana de Perfiles; atgo-sync sincroniza solo el perfil activo. SYNC_VERSION 1.16.0.
- 1.16.1: zonas de DSP2–DSP5 en ZONAS_BASE (propiedad dsp) y provincias en PROV_ZONA (palabra completa). 48 pruebas.
- 1.16.2: lista matriz por defecto (perfilesPorDefecto: DSP por zonas, COORD = todos); migración única matriz1 que deja
  todos los perfiles en la matriz; «Restablecer» por perfil o todos en la ventana de Perfiles. Probada por el usuario: funciona.
- 1.17.0: resumen por DSP para COORD, comodines por nombre (zonaComodin), «Cargando DSPx…» (payload.ops), exportar/importar
  perfiles, informe/Excel por perfil (jornadas fusionan perfiles, vencOp), 8 consultas en paralelo si >40 técnicos, «conocidos»
  evita re-añadir técnicos quitados. SYNC_VERSION 1.17.0. 57 pruebas.
- 1.17.1: probado con ATGO real. Comodines: 37 de 42 con zona (sin zona: Canarias LP/T/F/LAN y XXX genérico).
  Carga COORD (70 téc. + 42 comodines, 416 tickets): 65 s con 6 en paralelo, 78 s con 8 → se queda en 6.
  1.17.0/1.17.1 probadas por el usuario: funcionan.
- 1.17.2: sw.js precachea con cache:'reload' (antes podía guardar JS viejo de la caché HTTP de GitHub Pages, 10 min,
  y avisar de recargar ATGO sin motivo); aviso de versión con dirección (syncVieja 'atgo'/'app') y «Actualizar Despacho».
  COORD se queda con los 70 técnicos (confirmado por el usuario).
- 1.18.0: filtro por DSP compartido (filtroInc.dsp: zonasVisibles/enDsp/zonaEnDsp/dspChipsHtml) en Incidencias, Planificación,
  día y Sin asignar; Sin asignar por urgencia (sinListas(conDsp)); actualización silenciosa (offerUpdateSolo + aviso).

## En curso
- (vacío)

## Pendiente / no hecho de la batería
- 3.1 repintar solo lo que cambia y 3.5 cálculos en un worker: no hechos (poco valor hoy, mucho riesgo). 1.8 coherencia visual: solo en lo tocado.
- Supervisor con varios equipos reales: `docs/planteamiento-supervisor-y-perfiles.md` (los perfiles locales ya existen).
- Versión iPhone: `docs/propuesta-ios.md` (decidir relevo cifrado o API oficial de Tier1).

## Por validar con datos reales (el usuario prueba; Claude no escribe en ATGO)
- 2026-10-11: el usuario probó la 1.13.0 y la 1.14.0 (incluida asignación suelta y masiva en Sin asignar) y confirma que funcionan.
- «Deshacer» tras asignar; arrastrar y en bloque en Planificación.
- Duraciones: lector probado con textos reales (`tests/pruebas.js`); faltan más ejemplos de cómo escriben la duración.
- Resumen matinal (8:00) y aviso de técnico sin actividad (11:00): solo días laborables y con avisos activados.
- Caducidad: el formato real «CAMBIO CADUCIDAD: ANTES … AHORA …» ya está validado en pruebas.

## Problemas conocidos
- Claude no escribe en ATGO (permiso de la sesión): las pruebas de escritura las hace el usuario.
- Barras invertidas: `node -e` desde bash las pierde. Usar Edit/Write o archivo de parche.
- Probar en local: el service worker sirve caché; desregistrarlo y vaciar `caches` antes de recargar.
- Nominatim no encuentra muchas direcciones de polígono/carretera: el mapa las sitúa en su población (borde discontinuo).

## Decisiones tomadas
- Sin build ni framework: archivos estáticos en la raíz, publicados con GitHub Pages.
- Sincronización por operario (6 en paralelo); cada 2 min siempre (el usuario no quiere refresco más lento fuera de horario). `codOpe.in` no funciona en ATGO.
- Sin asignar = PRESENCIAL de los operarios comodín `XXX-…`; "Mi zona" = zonas con técnicos en el perfil activo.
- Perfiles: locales en cada equipo (`dispatcher_perfiles_v1`); cambiar de perfil reinicia la foto de novedades.
- Escrituras en ATGO solo con confirmación y comprobación campo a campo; sin reintentos automáticos (también «Deshacer»).
