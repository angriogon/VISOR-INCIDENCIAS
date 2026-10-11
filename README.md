# Visor de Incidencias · Panel de Despacho

PWA para Windows para el trabajo diario de Dispatcher. Lee ATGO, avisa y ayuda con el seguimiento, los correos y la organización del día; solo escribe en ATGO desde las acciones confirmadas de la ficha (comentar, cambiar estado, planificar).

- **Mi día:** la pantalla de inicio con lo que pide acción: novedades, tickets a tu nombre, sin asignar, rutas, caducidades y material.
- **Sin asignar:** visitas pendientes de técnico de tus zonas, con técnico recomendado, fecha y aviso 📍 si alguien ya va a esa sede.
- **Incidencias:** un técnico por fila, agrupados por zona, con una **barra del progreso de su ruta de hoy** (terminadas, en curso, pendientes) y el resumen del equipo arriba. Clic en un técnico para desplegar sus visitas de hoy y el resto de sus incidencias; botón para plegar o desplegar todos. Se cargan **en tiempo real desde ATGO** (o importando un Excel/CSV). Solo se cargan los operarios y estados configurados.
- **Zonas:** los técnicos se agrupan y ordenan por zona (Sevilla/Huelva, Córdoba/Jaén, Granada, Almería, Málaga, Cádiz, Ceuta, Melilla, Extremadura), con chips para filtrar por zona.
- **Planificación:** la semana por técnico (arrastrar y soltar) y, al pulsar un día, su detalle: carga por técnico, técnicos libres, mapa, correos y **WhatsApp** con la ruta de cada técnico.
- **Perfiles:** DSP1–DSP5 y COORD, cada uno con sus técnicos.
- **Ficha del ticket:** clic en cualquier ticket: Resumen, Actuar (comentar, estado, planificar, WhatsApp) e Historial.
- **Buscador (`Ctrl+K`):** encuentra cualquier ticket por Nº, sede, técnico, referencia o nota, y lanza acciones.

No hace falta compilar nada: son archivos estáticos (HTML + JS) y GitHub Pages los publica tal cual.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `index.html` | Estructura de la página (cabecera, pestañas y vistas) |
| `styles.css` | Estilos (tema claro/oscuro y modo denso) |
| `app.js` | Configuración (zonas, perfiles, estados), Incidencias, filtros, día de Planificación, WhatsApp y recepción de ATGO |
| `ajustes.js` | ⚙ Ajustes, perfiles, novedades de versión, atajos de teclado, menú contextual, asistente, diagnóstico, resumen matinal y exportar a Excel |
| `tests/arranque.mjs` | Prueba de arranque: abre la app en un navegador sin pantalla con datos ficticios, recorre pestañas, ficha y ajustes, y falla ante cualquier error (GitHub Actions) |
| `tests/pruebas.js` | Pruebas automáticas: duración, caducidad, guardado en ATGO, recomendación, misma sede, apoyo, conflictos y coherencia de listas (`node tests/pruebas.js`; GitHub las ejecuta en cada cambio) |
| `manifest.webmanifest` | Nombre, iconos y ajustes para instalarla como app de Windows |
| `sw.js` | Service worker: funcionamiento sin conexión y actualizaciones |
| `herramientas.js` | Cerradas (15 días), material, caducidad (SLA), copia en OneDrive, ruta en Google Maps, técnico sugerido, correos del día e informe semanal |
| `panel.js` | Sin asignar y buzón, Planificación (semana) (arrastrar y soltar, en bloque), replanificar, respuestas rápidas, carga en horas, línea de tiempo, conflictos, reincidencias, mapa, avisos de comentarios, vigilancia de la sincronización y secciones plegables |
| `extension/`, `despacho-extension.zip` | Extensión de Edge/Chrome que arranca la sincronización sola al abrir ATGO |
| `docs/` | Estudios y planteamientos: supervisor y varios dispatchers, mejoras para Windows, versión para iPhone |
| `edicion.js` | Edición en ATGO desde la ficha: comentario en el hilo y cambio de estado |
| `dia.js` | Mi día, novedades, avisos, ficha del ticket, notas, buscador, rutina, resumen y copia de seguridad |
| `atgo-sync.js` | Sincronización con ATGO (se ejecuta dentro de la pestaña de ATGO mediante el marcador) |
| `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `favicon.svg` | Iconos |
| `.nojekyll` | Hace que GitHub Pages publique los archivos sin procesarlos |

Los archivos de la app van **en la raíz** del repositorio (salvo `extension/`, `docs/` y `tests/`).

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

## Incidencias en tiempo real desde ATGO

ATGO (`https://atgo.tier1.es`) no permite que otra web lea sus datos directamente. Por eso la lectura se hace **dentro de la propia pestaña de ATGO**, con tu sesión, mediante un marcador:

1. **Solo la primera vez:** en Despacho, con la lista vacía, arrastra el botón **⟳ Despacho ATGO** a la barra de favoritos (si no la ves: `Ctrl+Mayús+B`).
2. En Despacho pulsa **ATGO** (cabecera). Se abre ATGO: inicia sesión si te lo pide.
3. En esa pestaña de ATGO pulsa el favorito **⟳ Despacho ATGO**. Abajo a la derecha aparece un recuadro con el progreso.
4. Deja la pestaña de ATGO abierta (puede estar en segundo plano): se actualiza sola **cada 2 minutos**. El botón ⟳ del recuadro fuerza una actualización y ✕ la detiene.

Detalles:
- Solo se piden a ATGO los estados **PRESENCIAL, PUESTO OPERATIVO, FUERA DE MANTENIMIENTO, MATERIAL PTE. FABRICANTE, PTE. MOVER MATERIAL, EN FABRICANTE y ESCALADO TIER1**, y solo se quedan los operarios configurados.
- Una carga completa tarda **unos 20 segundos**: se pide a ATGO una consulta por técnico (6 a la vez), que trae solo nuestros tickets. ATGO tarda ~0,5 s por ticket devuelto, así que pedir todos los tickets de esos estados (~600) y filtrar después tardaba ~3 minutos.
- El token de ATGO **nunca sale de su pestaña**: a Despacho solo le llegan los datos de las incidencias.
- El Nº de cada incidencia es un enlace que la abre en ATGO.
- Despacho guarda la última carga, así que al abrirla ves los últimos datos (marcados con la hora) hasta que llegue la siguiente.
- Si la sesión de ATGO caduca, el recuadro lo indica: vuelve a iniciar sesión y pulsa ⟳.

## Planificación: el día, rutas y WhatsApp

La antigua pestaña Mañana va ahora **dentro de Planificación**: pulsa el nombre de un día de la semana (o `Ctrl+K` › *Ver el próximo laborable*) y «← Semana» para volver.

- Por defecto muestra el **próximo día laborable** (el viernes y el sábado muestran el lunes). Con ◀ ▶ cambias de día.
- **Enviar todas las rutas**: abre WhatsApp técnico a técnico (solo los que aún no la tienen); en la barra de abajo eliges *Abrir WhatsApp* o *Saltar*.
- Cuenta como visita toda incidencia en estado **PRESENCIAL** con fecha de visita ese día. Se ordenan por hora.
- La barra de carga se pone naranja desde `CARGA_ALTA` (5) visitas y roja desde `CARGA_MUY` (7); se cambia en `index.html`.
- **WhatsApp:** el botón abre WhatsApp con el mensaje ya escrito (y lo deja también en el portapapeles).
  - Sin teléfono configurado, WhatsApp te pide elegir el contacto: búscalo por sus siglas.
  - En **Teléfonos y mensaje** puedes guardar el móvil de cada técnico (así abre directamente su chat), elegir WhatsApp de escritorio o WhatsApp Web, y cambiar el saludo y la despedida.
- **Copiar resumen** copia la carga de todos los técnicos de la zona visible.

## Progreso del día (pestaña Incidencias)

- Cuenta las visitas **enrutadas para hoy**: tickets PRESENCIAL con fecha de visita de hoy, más los que hoy pasaron de PRESENCIAL a otro estado o salieron de la lista. Se recalcula en cada actualización de ATGO: si se asigna un ticket nuevo para hoy, entra en la barra de su técnico.
- **Terminada:** solo si el ticket está en **CERRADO, CERRADO PTE. PRESUPUESTO, PUESTO OPERATIVO, PTO. OPERATIVO PTE. ENVÍO PRESUPUESTO o PTO. OPERATIVO PTE. ACEPTACIÓN PRESUPUESTO**. Como varios de esos estados no se siguen, cuando un ticket sale de la lista Despacho consulta su estado final en ATGO.
- **En trámite:** salió de PRESENCIAL hacia cualquier otro estado (EN FABRICANTE, MATERIAL PTE., PENDIENTE CITAR…), o el técnico la finalizó en ATGO pero sigue en PRESENCIAL. Se indica el motivo.
- **En curso:** el técnico la inició hoy ("ha iniciado el ticket") y no la ha finalizado. **Pendiente:** el resto; se marca **con retraso** si ya pasó su hora.
- La barra solo es tan fiable como el uso de iniciar/finalizar en ATGO: si un técnico no lo usa, sus visitas siguen pendientes hasta que el ticket cambia de estado.

## Herramientas

- **Cerradas (15 días):** las incidencias que pasan a CERRADO, CERRADO PTE. PRESUPUESTO, PUESTO OPERATIVO, PTO. OPERATIVO PTE. ENVÍO PRESUPUESTO o PTO. OPERATIVO PTE. ACEPTACIÓN PRESUPUESTO se guardan 15 días. Se ven al desplegar cada técnico (*Cerradas · últimos 15 días*), se abren en la ficha y se encuentran con el buscador.
- **Material:** aviso cuando un ticket pasa a **PTE. MOVER MATERIAL** y cuando vuelve de ahí a **PRESENCIAL**. Panel *Material* en Mi día con los que están pendientes y los listos para visita (7 días).
- **Caducidad (SLA):** se lee de los comentarios del hilo que hablan de caducidad, vencimiento, fecha límite o SLA. Manda el comentario **más reciente**; si dice "de X a Y", vale la **última** fecha. Acepta 15/10/2026, 15/10, 15-10-26 y "15 de octubre", con o sin hora. Se ve en cada ticket (⏱, rojo si quedan menos de 24 h o está vencida, ámbar si menos de 72 h), en *Caducidades* de Mi día y con aviso de Windows a menos de 4 h. En la ficha se puede **corregir a mano**. Los hilos se refrescan cada 10 minutos para ver los cambios.
- **Copia en OneDrive:** ⚙ → *Elegir carpeta de OneDrive*. Guarda `Despacho-copia.json` cada 10 minutos y una copia por día de los últimos 7. Si Windows vuelve a pedir permiso (al reiniciar), aparece *Reanudar*.
- **Ruta en Google Maps:** botón *Ruta* en el día de Planificación y *Ruta de hoy en Maps* en Incidencias. Orden: citas con hora en su hora, **recogida en GLS de 9:00 a 10:00**, visitas sin hora a mediodía. El GLS de cada técnico se puede cambiar en *Técnicos y mensaje* (por defecto, "GLS + ciudad de su zona"). El enlace se añade al WhatsApp de la ruta.
- **Técnico sugerido:** en la ficha de cualquier visita presencial, los 3 técnicos de la zona del ticket (por su provincia) con menos visitas ese día; ir ya a esa población cuenta a favor. Solo sugiere: la asignación se hace en el ERP.
- **Correos del día:** en el día de Planificación → *Correos del día*. Un correo por visita al contacto del ticket en ATGO, abierto en Outlook uno tras otro (*Abrir siguiente*), y un *Correo resumen* con todas las visitas. La plantilla es editable.
- **Informe semanal:** en Mi día. Por técnico: visitas enrutadas, terminadas, en trámite, % de cumplimiento y cerradas; además tickets nuevos, escalados, material y caducidades vencidas. *Copiar para el correo* (tabla con formato) o *Abrir en Outlook*. Se construye con la foto de cada día que Despacho guarda mientras sincroniza.

## Carga en horas

La duración de cada visita sale, por este orden, de:
1. **El hilo del ticket**: «duración estimada 2 h», «horario de despliegue de 7 a 15 horas», «jornada completa», «media hora»… (manda el comentario más reciente; no confunde horas del día como «a las 10:00 horas» ni «llamar en 15 minutos»).
2. **Lo que duraron de verdad** visitas a la misma sede (2 o más) o del mismo tipo (3 o más): *El usuario X ha iniciado el ticket* → *ha finalizado* del mismo técnico y día.
3. Si no se sabe, **no se estima**: solo cuenta la hora de inicio (en la línea de tiempo sale una marca fina y en la carga «sin estimar»).

Se ve en la ficha (*Duración*), en el día de Planificación («≈ 4 h 30 + 2 s/e de 8 h»), en las casillas de la semana, en conflictos y en la línea de tiempo.

## Avisos y vigilancia

- **Comentarios de técnicos:** cuando un técnico escribe en el hilo de un ticket, aparece en Novedades y llega un aviso de Windows.
- **Sincronización:** si ATGO lleva más de 10 minutos sin actualizar (pestaña cerrada o sesión caducada), aparece un aviso rojo en la cabecera y uno de Windows.

## Extensión (en lugar del favorito)

`despacho-extension.zip` (o la carpeta `extension/`) arranca la sincronización sola al abrir ATGO con sesión iniciada:
1. Descarga y descomprime `https://angriogon.github.io/VISOR-INCIDENCIAS/despacho-extension.zip`.
2. En Edge: `edge://extensions` → activa *Modo de desarrollador* → *Cargar desempaquetada* → elige la carpeta. (En Chrome: `chrome://extensions`.)
3. Abre ATGO desde el botón **ATGO** de Despacho. Si ATGO se abre por su cuenta, el recuadro de Despacho en ATGO pedirá pulsar ↗ para abrir la app.
La versión **1.1.0** corrige el bloqueo de Chrome/Edge (error «violates the following Content Security Policy» en la página de errores de la extensión): ahora el script se carga desde la página de ATGO, como el favorito. Si tenías la 1.0.0, descarga el zip nuevo, sustituye los archivos de la carpeta y pulsa ⟳ *Recargar* en la tarjeta de la extensión.
Algunos equipos de empresa no permiten extensiones: el favorito sigue funcionando igual.

## Actuar en ATGO (fase 1)

En la ficha de cada ticket, sección **Actuar en ATGO**:

- **Publicar en el hilo:** escribe un comentario (por ejemplo, instrucciones para el técnico) y confírmalo. Se publica con tu usuario.
- **Cambiar estado:** elige el nuevo estado y confírmalo. Los estados que **cierran** el ticket piden una confirmación en rojo.

Lo hace la pestaña de ATGO con tu sesión, igual que desde la web de ATGO, y después **vuelve a leer el ticket para comprobar** que se aplicó. Si ATGO no responde en 25 s, Despacho no lo reintenta (para no duplicar): avisa para que lo compruebes en ATGO. Cada cambio queda en la ficha (✓ aplicado / ✕ fallido). Necesita la pestaña de ATGO abierta con la versión actual del favorito.

## Planificar en ATGO (fase 2: técnico y visita)

En la ficha, dentro de *Actuar en ATGO*, **Planificar en ATGO**: técnico, fecha de visita y horas. Desde *Técnico sugerido*, el botón **Asignar** lo rellena. Nada se guarda hasta confirmarlo.

- ATGO guarda siempre la **ficha completa**. Despacho la lee justo antes, reenvía todos los campos tal cual (como el formulario de ATGO, pero codificando bien caracteres como #, & o +) cambiando solo técnico, fecha y horas, y **después la vuelve a leer y compara campo a campo**.
- Si cambiara cualquier otro campo, **restaura automáticamente** la ficha original y lo indica. El resultado de la comprobación queda en la ficha.
- Validado: activo en todos los tickets (se puede limitar de nuevo al ticket de prueba en ⚙). Basta con el técnico: la fecha y las horas son opcionales.
- **Respuestas rápidas:** frases habituales para el hilo encima del comentario (✎ para editarlas; admiten {tecnico}, {fecha}, {num} y {sede}).
- No permite borrar la fecha de visita (ATGO no lo admite en ese guardado). Reasignar puede enviar un aviso al técnico desde ATGO.

## Sin asignar y buzón

Pestaña **Sin asignar**: visitas en **PRESENCIAL** que siguen en un operario comodín «PENDIENTE ASIGNAR …» (`XXX-SVQ`, `XXX-MA`, `XXX-M`…), de todas las zonas, con la **última actualizada arriba**.

- **Mi zona** (las zonas con técnicos en tu perfil): cada una lleva el **técnico recomendado** (★: el que ya tiene otra incidencia abierta en esa sede, o el de su zona con menos visitas ese día; ir ya a esa población cuenta a favor), un selector con la carga de cada técnico y la **fecha de visita** (opcional). **Asignar** se guarda en ATGO con la comprobación campo a campo.
- **📍 Misma sede**: si un técnico ya tiene abierta otra incidencia de esa sede, sale un bocadillo junto al técnico y la confirmación lo recuerda (en ámbar si eliges a otro). Igual en la ficha › Actuar.
- **Ceuta** admite también a los técnicos de Cádiz (DSJ, AAR, EACL, JRHG) y **Melilla** a los de Málaga (JVR, ILG, FMNT, MMHG), marcados como «apoyo». Se cambia en `ZONAS_BASE` (`apoyo`) de `app.js`.
- **Asignar en masivo**: elige el técnico (y la fecha, si quieres) en cada una y se marcan solas, o usa *Marcar todas* (cogen el técnico recomendado ★). **Asignar marcadas** las guarda una a una en ATGO con su comprobación; si alguna falla, las demás siguen y se muestra el motivo. Lo que elijas se conserva aunque ATGO refresque la lista.
- **Otras zonas**: botón **Archivar** para pasarlas al **Buzón** y controlar si siguen pendientes.
- Cuando un ticket recibe técnico (lo asignes tú o otro dispatcher) **desaparece solo** del panel y del buzón.
- Aviso de Windows cuando aparece uno nuevo sin asignar en tu zona.

## Planificación: la semana arrastrando

Pestaña **Planificación**: técnicos (por zona) × días de lunes a viernes (el sábado y el domingo, la semana siguiente), con nº de visitas, **carga en horas** y ⚠ si hay conflicto. Pulsa un día para ver su detalle (rutas, WhatsApp y correos).

- A la izquierda, **Por planificar**, en tres grupos plegables: *Sin asignar* (tu zona), *Vencidas* y *Sin fecha*. **Arrastra** un ticket a la casilla de un técnico y un día: se planifica en ATGO (con confirmación). Arrastrando una visita desde el detalle de una casilla a otra, se mueve de técnico o de día.
- Las casillas muestran solo el nº de visitas y las horas estimadas; el **color** indica la carga (verde holgado, ámbar > 75 % de la jornada, rojo > 8 h) y ⚠ un conflicto. **Clic en una casilla** abre debajo su detalle (visitas por hora, conflictos, botón *Ruta*).
- **Replanificar vencidas** (arriba): propone para cada visita vencida el técnico con menos carga de su zona y el próximo laborable, y las guarda en bloque.
- **En bloque**: marca varios, elige técnico y día y pulsa *Asignar*. Se guardan uno a uno, cada uno comprobado; si alguno falla, los demás siguen y se muestra el motivo.
- Botón **Mapa**: primero una **burbuja por técnico** con sus visitas del día; al pulsar una (o el técnico en la leyenda, que muestra «visitas del día / incidencias asignadas»), salen **todas sus incidencias**: las del día numeradas en orden de ruta y unidas por una línea, las de otros días con su fecha y las de otros estados en gris, con los **km y minutos de coche** entre visitas (OSRM). Varias en el mismo sitio van en un solo marcador («2·3»). Si la dirección no se encuentra, se sitúa en su población (borde discontinuo); las que no se pueden situar se listan debajo. Al pulsar en el mapa vuelven las burbujas. Las direcciones se buscan con Nominatim (OpenStreetMap), 1 por segundo la primera vez, y se guardan en el equipo.

## Mi día

Al abrir la app ves el día de un vistazo. Cada casilla de arriba lleva a su sección:

- **Novedades:** Despacho compara cada actualización de ATGO con la anterior y apunta lo que cambia: tickets nuevos, cambios de estado, reasignaciones, cambios de fecha u hora de visita y tickets que salen de la lista. Lo importante (a tu nombre, escalados, rutas cambiadas) va marcado en naranja. La pestaña *Mi día* muestra cuántas hay sin ver.
  - Un ticket "sale de la lista" cuando deja de estar en los estados u operarios que se siguen; no siempre significa cerrado. Solo se apunta si falta en dos actualizaciones seguidas, para evitar falsos avisos.
- **A tu nombre:** tickets asignados a AMRG, pendientes de asignar.
- **Rutas:** cuántas rutas de mañana has enviado por WhatsApp y si alguna **cambió en ATGO después de enviarla**.
- **Hoy en directo:** línea de tiempo de 8:00 a 20:00 por técnico con sus visitas de hoy (color según estado), la hora real de inicio y una línea de "ahora".
- **Conflictos (mañana):** solapes entre citas, más horas estimadas que la jornada (8 h) y citas en la franja de recogida en GLS (9:00-10:00).
- **Secciones plegables:** clic en el título de cada sección para plegarla o desplegarla (se recuerda). Botones *Plegar* / *Desplegar* para todas; las casillas de arriba abren su sección.
- **Copiar resumen del día:** texto listo para pegar a tu responsable (abiertas por estado y zona, novedades de hoy, visitas de mañana, sin planificar, parados).

## Ficha del ticket, notas y seguimientos

Haz clic en cualquier ticket para abrir su ficha, flotante y ancha (a dos columnas en pantallas grandes), con tres pestañas:

- **Resumen:** datos, duración estimada, caducidad, **motivo de apertura y último comentario** (sacados del hilo de ATGO, sin los mensajes automáticos) y tu nota.
- **Actuar:** comentar en el hilo, cambiar el estado, planificar (técnico, fecha, horas; botón «Asignar a ★» con el recomendado), técnico sugerido y **WhatsApp al técnico** con plantillas (cambio de visita, recordar finalizar, sobre este ticket; se editan en ⚙ › WhatsApp).
- **Historial:** el hilo completo de ATGO y los cambios que Despacho ha visto.
- Arriba: **ATGO ↗**, ⧉ **copiar ficha** (para tu plantilla de Outlook) y **#** copiar Nº.
- Tras asignar, durante 30 s sale **Deshacer** abajo (vuelve a guardar el técnico, fecha y horas anteriores, con confirmación).
- **Nota y seguimiento:** una nota privada y una fecha para revisarlo (Hoy, Mañana, Lunes, +1 semana o la que elijas). Aparece en *Seguimientos* ese día; márcalo como hecho al terminar. En las listas, los tickets con nota llevan ✎ y los que tienen cambios sin ver, un punto naranja.
- **Historial:** los cambios que Despacho ha visto en ese ticket.

## Avisos de Windows

En ⚙ → **Activar avisos**. Despacho te avisa con una notificación de Windows, aunque estés en otra ventana, de:
tickets nuevos o reasignados a tu nombre, escalados a TIER1, cambios en las rutas de mañana (incluidas las ya enviadas) y, si lo activas, cualquier ticket nuevo. Necesita Despacho abierto y la pestaña de ATGO sincronizando.

## Atajos

- `1`–`4`: Mi día · Sin asignar · Incidencias · Planificación.
- `J` / `K`: bajar y subir por los tickets; `Enter` abre la ficha; `A` asignar; `C` comentar.
- `Ctrl+K` o `/`: buscador de tickets y acciones; con un ticket elegido, `→` muestra sus acciones.
- **Clic derecho** sobre un ticket: abrir ficha, asignar, comentar, abrir en ATGO, copiar Nº o ficha, WhatsApp.
- `?`: chuleta de atajos. `Esc`: cierra.

## Cabecera, perfiles y ajustes

- El **punto de color** junto a las pestañas es el estado de ATGO (verde al día, ámbar cargando o sin conexión, rojo con error); al pasar el ratón, el detalle. *Abrir ATGO* e *Importar Excel* están en ⚙ › General.
- **Perfiles** (botón DSP1… junto a la lupa, o ⚙ › Perfiles): DSP1–DSP5 y COORD. Cada perfil ve solo sus técnicos; un técnico puede estar en varios. DSP1 empieza con todos y el resto se rellenan marcando casillas. Cambiar de perfil recarga la app.
- **ⓘ Novedades**: versión actual y lo más importante de cada versión (un punto avisa de que hay novedades sin ver).
- ⚙ **General**: tema (Windows, claro u oscuro), tamaño (cómodo o denso), **resumen matinal** (aviso de Windows a la hora que elijas con visitas, sin asignar y caducidades) y aviso si un técnico **no ha iniciado ninguna visita** a la hora indicada.
- ⚙ **Datos**: copia en OneDrive y manual, **exportar a Excel** (incidencias filtradas o la planificación de la semana), informe semanal con **histórico de 8 semanas** y **diagnóstico** (copia la versión y los últimos errores para enviarlos si algo falla).
- **Incidencias** tiene filtros por estado, «caducan en 24 h o vencidas» y texto; ☆ **Guardar** los deja como acceso rápido. Cada incidencia muestra al final su **estado en color** y su **fecha de visita**.
- La sincronización con ATGO se hace cada 2 minutos; tras guardar algo en ATGO se actualiza enseguida. Si la pestaña de ATGO tiene una versión antigua de la sincronización, sale un aviso para recargarla (F5). Si estás escribiendo o eligiendo algo (buscador, filtro, técnico, fecha), la pantalla no se repinta hasta que sueltas el campo, y no se mueve de sitio.
- Lo guardado en el equipo se limpia solo al acercarse al límite del navegador (hilos de tickets que ya no están, direcciones del mapa antiguas…; nunca notas, perfiles ni ajustes). ⚙ › Datos muestra el espacio usado y tiene *Quitar datos cargados*. Si ATGO devuelve de golpe casi nada, Despacho no lo aplica hasta confirmarlo en la siguiente carga, y si cambia el formato de su web, avisa.

## Tus datos

- **El Excel no sale de tu equipo:** se lee en el navegador y no se guarda en ningún sitio. Hay que importarlo cada vez que abres la app.
- **Notas, seguimientos, rutina, teléfonos e historial** se guardan solo en este equipo y navegador. Para no perderlos o llevarlos a otro equipo: ⚙ → **Copia de seguridad → Exportar** (un `.json`) y luego **Restaurar** (o arrastra el `.json` sobre la ventana). La copia incluye también las plantillas que importaste en su día.

## Publicar cambios

1. Edita y sube los archivos que cambien.
2. En `sw.js`, cambia `VERSION` (por ejemplo, de `despacho-v1.0.0` a `despacho-v1.0.1`). Si no lo cambias, la app instalada puede seguir usando la versión antigua.
3. La próxima vez que abras la app aparecerá el aviso **"Hay una versión nueva" → Actualizar**.

## Configuración rápida

- `ZONAS_BASE` (en `app.js`): zonas, sus técnicos y los de **apoyo**. La zona `DISPATCHER` (AMRG) es quien controla: sale la primera en Incidencias y no cuenta como técnico ni recibe WhatsApp. Despacho manda esta lista a la pestaña de ATGO al conectar; `OPERARIOS` en `atgo-sync.js` es solo un respaldo, pero mantenlo igual (las pruebas automáticas lo comprueban). Un técnico nuevo entra solo en el perfil DSP1.
- `ESTADOS`: estados que se cargan. En `app.js` por nombre; en `atgo-sync.js` por código de ATGO (10 PRESENCIAL, 20 PUESTO OPERATIVO, 30 FUERA DE MANTENIMIENTO, 40 MATERIAL PTE. FABRICANTE, 80 PTE. MOVER MATERIAL, 100 EN FABRICANTE, 110 ESCALADO TIER1).
- `REFRESCO_MIN` (en `atgo-sync.js`): minutos entre actualizaciones (2).
- `COLS` (en `app.js`): qué columna del Excel corresponde a cada dato (0 = A, 1 = B, …).
- Al publicar una versión, sube a la vez `VERSION` en `sw.js` y `APP_VERSION` en `ajustes.js`, y añade sus novedades en `NOVEDADES` (`ajustes.js`).
