# Estado del proyecto

Archivo de traspaso entre sesiones. Al empezar una sesión: "lee docs/ESTADO.md y continúa".
Al terminar: "actualiza docs/ESTADO.md". Máximo ~40 líneas: lo antiguo se resume o se borra.

## Versión actual
- `sw.js`: despacho-v1.13.0 = `APP_VERSION` en `ajustes.js` (publicada en GitHub Pages).
- 1.13.0: perfiles DSP1–5/COORD, mapa con todas las incidencias del técnico, duración leída del hilo (sin estimación si no se sabe),
  fecha en Sin asignar, apoyo Cádiz→Ceuta y Málaga→Melilla, ficha flotante con pestañas, globo de estado + fecha en Incidencias,
  ⓘ novedades, aviso 📍 misma sede al asignar y toda la batería de `docs/estudio-mejoras-windows.md`.
- Código partido: `index.html` (estructura) + `styles.css` + `app.js` + `ajustes.js` (nuevo). Pruebas en `tests/pruebas.js` + GitHub Actions.
- Mi día sin Parados/Sin planificar/Seguimientos/Rutina/Reincidencias (el usuario lo pidió: no volver a añadirlas).

## En curso
- (vacío)

## Pendiente / no hecho de la batería
- 3.1 repintar solo lo que cambia y 3.5 cálculos en un worker: no hechos (poco valor hoy, mucho riesgo). 1.8 coherencia visual: solo en lo tocado.
- Supervisor con varios equipos reales: `docs/planteamiento-supervisor-y-perfiles.md` (los perfiles locales ya existen).
- Versión iPhone: `docs/propuesta-ios.md` (decidir relevo cifrado o API oficial de Tier1).

## Por validar con datos reales (el usuario prueba; Claude no escribe en ATGO)
- Asignar desde Sin asignar con fecha; «Deshacer» tras asignar; arrastrar y en bloque en Planificación.
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
- Sincronización por operario (6 en paralelo); cada 2 min L-V 7-20 h, cada 10 min fuera. `codOpe.in` no funciona en ATGO.
- Sin asignar = PRESENCIAL de los operarios comodín `XXX-…`; "Mi zona" = zonas con técnicos en el perfil activo.
- Perfiles: locales en cada equipo (`dispatcher_perfiles_v1`); cambiar de perfil reinicia la foto de novedades.
- Escrituras en ATGO solo con confirmación y comprobación campo a campo; sin reintentos automáticos (también «Deshacer»).
