# Estado del proyecto

Archivo de traspaso entre sesiones. Al empezar una sesión: "lee docs/ESTADO.md y continúa".
Al terminar: "actualiza docs/ESTADO.md". Máximo ~40 líneas: lo antiguo se resume o se borra.

## Versión actual
- `sw.js`: despacho-v1.24.0 = `APP_VERSION` en `ajustes.js` (SYNC_VERSION 1.23.0 en atgo-sync.js y app.js).
- Historia resumida (detalle en NOVEDADES de ajustes.js y en git): 1.13 perfiles DSP1–5/COORD, ficha flotante, duración del hilo;
  1.14–1.15 pulido y revisión (asignarLote, SYNC_VERSION, pruebas de arranque); 1.15.1 extensión con "world": "MAIN";
  1.16.x asignar a cualquiera, zonas DSP2–5, lista matriz y «Restablecer»; 1.17.x resumen COORD, comodines por nombre, carga en 6 paralelos;
  1.18 filtro DSP, Sin asignar por urgencia, actualización silenciosa; 1.19 Mis cambios, sin cerrar hoy, olvidadas;
  1.20 festivos, «Rellenar el día», contacto/material/sede en la ficha. Todas probadas por el usuario.
- Mi día sin Parados/Sin planificar/Seguimientos/Rutina/Reincidencias (el usuario lo pidió: no volver a añadirlas).
- 1.21.0: nómina (⚙ › Técnicos: altas, zona/DSP, bajas en perfilCfg.nomina, aplicada sobre ZONAS_BASE al arrancar),
  color de acento (ACENTOS; --warn separa los avisos), Compacto/Normal/Amplio, accesibilidad (Modo accesible + ACC_OPS,
  saltar al contenido, foco en ventanas, aria-label automático), cabecera sin «Despacho» y pestañas en mayúsculas,
  novedades con las 5 últimas + «Anteriores». Estudio de crear tickets: docs/estudio-alta-tickets.md (viable: POST /incidencias/alta). 63 pruebas.

- 1.22.0: Incidencias agrupadas por estado (ordenEstado/porEstadoHtml) y retroiluminadas (.ln-color), fechasHtml (VISITA/CADUCA tras el Nº),
  avatar de color (colorTec), resultado de ATGO en la ficha (edResultado) y toast por encima (z 80), forzarAtgo (app.js).
- 1.22.1: reincidencias por equipo (panel.js equipoDe/reincidencias, REINC_DIAS 10): IT del texto o codElemento (nuevo `elemento` en
  mapTicket, SYNC 1.22.0), o «caja N» + aparato. Cerradas guardan elemento/ref/reg. Por validar con datos reales: que codElemento venga en la lista.

- 1.22.2: atgoSource solo cambia con atgo-data/atgo-hello (una pestaña antigua con sesión caducada se quedaba con los cambios);
  aviso si otra pestaña de ATGO da error; errorAtgo separa 401 (sesión) de 403 (sin permiso); editar no se fía de "expires".

- 1.22.3: un 400 de ATGO salía como «sesión caducada» (el texto de ATGO contenía «caducidad»). errorAtgo clasifica por código;
  atgo-sync errorDe lee el JSON de JHipster entero. El 400 del 2026/00/98183 («Parameterized Exception») era un ticket corrupto en ATGO (confirmado por el usuario el 16/10). Despacho se comportó bien.

- 1.23.0: asignación en bloque en un solo mensaje (despacho-editar-lote, cap "lote"): atgo-sync guarda 4 a la vez (LOTE_PARALELO)
  y recarga una vez al final (refrescarPronto para sueltos); cada respuesta trae "fila" y la PWA la aplica ya (aplicarFila).
  Por validar con ATGO real: tiempo de un lote de ~10.

- 1.24.0: COORD = control (coord.js, pestaña CONTROL; Mi día y Sin asignar ocultas en COORD): cifras, filtros DSP/cliente, pendientes
  y caducadas/caducan hoy/en ruta, Excel por lista e informe completo. Futuro (pedido): informes por cliente y proyecto (numProy en la ficha).

## En curso
- Crear tickets desde Despacho: espera la lista de campos y valores por defecto del usuario (ver docs/estudio-alta-tickets.md).

## Descartado por ahora (el usuario lo deja para el futuro)
- Avisos de Windows por DSP en COORD, informe semanal por DSP desde COORD, carga semanal por DSP en COORD,
  plantillas de comentario por cliente.

## Pendiente / no hecho de la batería
- Recogida GLS de las zonas nuevas y Canarias: esperan datos del usuario.
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
