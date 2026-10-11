# Estado del proyecto

Archivo de traspaso entre sesiones. Al empezar una sesión: "lee docs/ESTADO.md y continúa".
Al terminar: "actualiza docs/ESTADO.md". Máximo ~40 líneas: lo antiguo se resume o se borra.

## Versión actual
- `sw.js`: despacho-v1.12.0 (publicada en GitHub Pages).
- Último cambio: mapa por técnico (burbujas → visitas del técnico → clic en el mapa vuelve), Semana y Sin asignar más compactos, Mi día sin Parados/Sin planificar/Seguimientos/Rutina/Reincidencias (el usuario pidió quitarlas: no volver a añadirlas).

## En curso
- (vacío)

## Pendiente
- Mejoras propuestas sin implementar: `docs/estudio-mejoras-windows.md`.
- Supervisor y varios dispatchers: `docs/planteamiento-supervisor-y-perfiles.md`.
- Versión iPhone: `docs/propuesta-ios.md` (necesita decidir relevo cifrado o API oficial de Tier1).

## Por validar con datos reales (el usuario prueba; Claude no puede escribir en ATGO)
- Planificación en bloque y arrastrar en Semana contra ATGO real (usan el mismo guardado de la fase 2, ya validado en el ticket de prueba 2026/00/97784).
- Lector de caducidad del hilo: basado en formatos supuestos; si falla, pedir el texto del comentario.
- Asignar solo con técnico: el usuario vio un fallo sin mensaje; ahora los errores muestran el texto de ATGO. Si se repite, pedirle ese texto.
- Extensión (`extension/`): explicada al usuario, sin confirmar que la haya instalado.

## Problemas conocidos
- El permiso de esta sesión impide que Claude escriba en ATGO (comentarios, estados, asignaciones): las pruebas reales las hace el usuario.
- Barras invertidas: al parchear con `node -e "…"` desde bash se pierden (`\s` → `s`). Usar Write/Edit o `String.fromCharCode(92)`.

## Decisiones tomadas
- Sin build ni framework: archivos estáticos en la raíz, publicados con GitHub Pages.
- Sincronización ATGO por consulta por operario (6 en paralelo): de ~3 min a ~20 s. `codOpe.in` no funciona en ATGO.
- Sin asignar = PRESENCIAL de los 42 operarios comodín `XXX-…` ("PENDIENTE ASIGNAR <zona>"). Los del usuario: XXX-SVQ, -CA, -MA, -G, -AL, -J, -0EXTREM, -0CEUTA, -0MELILL.
- Escrituras en ATGO solo con confirmación y comprobación campo a campo; sin reintentos automáticos.
