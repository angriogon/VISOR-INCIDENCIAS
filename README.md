# Visor de Incidencias · Panel de Despacho

PWA para Windows para el trabajo diario de Dispatcher. Es un **visor**: no modifica ATGO ni el ERP; lee, avisa y ayuda con el seguimiento, los correos y la organización del día.

- **Mi día:** la pantalla de inicio con lo que pide acción: novedades, tickets a tu nombre, visitas sin planificar, seguimientos, rutas de mañana, tickets parados y tu rutina diaria.
- **Incidencias:** un técnico por fila, agrupados por zona, con una **barra del progreso de su ruta de hoy** (terminadas, en curso, pendientes) y el resumen del equipo arriba. Clic en un técnico para desplegar sus visitas de hoy y el resto de sus incidencias; botón para plegar o desplegar todos. Se cargan **en tiempo real desde ATGO** (o importando un Excel/CSV). Solo se cargan los operarios y estados configurados.
- **Zonas:** los técnicos se agrupan y ordenan por zona (Sevilla/Huelva, Córdoba/Jaén, Granada, Almería, Málaga, Cádiz, Ceuta, Melilla, Extremadura), con chips para filtrar por zona.
- **Mañana:** visitas presenciales del próximo día laborable (se puede cambiar de día) por técnico y zona, con barra de carga, técnicos libres y botón **WhatsApp** que envía a cada técnico su planificación.
- **Ficha del ticket:** clic en cualquier ticket para ver sus datos, copiarlos para tu correo, dejar una nota con fecha de seguimiento y ver su historial de cambios.
- **Buscador (`Ctrl+K`):** encuentra cualquier ticket por Nº, sede, técnico, referencia o nota, y lanza acciones.

No hace falta compilar nada: son archivos estáticos (HTML + JS) y GitHub Pages los publica tal cual.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `index.html` | La aplicación completa |
| `manifest.webmanifest` | Nombre, iconos y ajustes para instalarla como app de Windows |
| `sw.js` | Service worker: funcionamiento sin conexión y actualizaciones |
| `dia.js` | Mi día, novedades, avisos, ficha del ticket, notas, buscador, rutina, resumen y copia de seguridad |
| `atgo-sync.js` | Sincronización con ATGO (se ejecuta dentro de la pestaña de ATGO mediante el marcador) |
| `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `favicon.svg` | Iconos |
| `.nojekyll` | Hace que GitHub Pages publique los archivos sin procesarlos |

Todos los archivos van **en la raíz** del repositorio, sin carpetas.

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

## Mañana y WhatsApp

- Por defecto muestra el **próximo día laborable** (el viernes y el sábado muestran el lunes). Con ◀ ▶ cambias de día.
- Cuenta como visita toda incidencia en estado **PRESENCIAL** con fecha de visita ese día. Se ordenan por hora.
- La barra de carga se pone naranja desde `CARGA_ALTA` (5) visitas y roja desde `CARGA_MUY` (7); se cambia en `index.html`.
- **WhatsApp:** el botón abre WhatsApp con el mensaje ya escrito (y lo deja también en el portapapeles).
  - Sin teléfono configurado, WhatsApp te pide elegir el contacto: búscalo por sus siglas.
  - En **Teléfonos y mensaje** puedes guardar el móvil de cada técnico (así abre directamente su chat), elegir WhatsApp de escritorio o WhatsApp Web, y cambiar el saludo y la despedida.
- **Copiar resumen** copia la carga de todos los técnicos de la zona visible.

## Progreso del día (pestaña Incidencias)

- Cuenta las visitas **enrutadas para hoy**: tickets PRESENCIAL con fecha de visita de hoy, más los que hoy pasaron de PRESENCIAL a otro estado o salieron de la lista. Se recalcula en cada actualización de ATGO: si se asigna un ticket nuevo para hoy, entra en la barra de su técnico.
- **Terminada:** el técnico la finalizó en ATGO ("ha finalizado el ticket" en el hilo de hoy) o el ticket dejó PRESENCIAL hoy. **En curso:** la inició hoy y aún no la ha finalizado. **Pendiente:** el resto; se marca **con retraso** si ya pasó su hora.
- La barra solo es tan fiable como el uso de iniciar/finalizar en ATGO: si un técnico no lo usa, sus visitas siguen pendientes hasta que el ticket cambia de estado.

## Mi día

Al abrir la app ves el día de un vistazo. Cada casilla de arriba lleva a su sección:

- **Novedades:** Despacho compara cada actualización de ATGO con la anterior y apunta lo que cambia: tickets nuevos, cambios de estado, reasignaciones, cambios de fecha u hora de visita y tickets que salen de la lista. Lo importante (a tu nombre, escalados, rutas cambiadas) va marcado en naranja. La pestaña *Mi día* muestra cuántas hay sin ver.
  - Un ticket "sale de la lista" cuando deja de estar en los estados u operarios que se siguen; no siempre significa cerrado. Solo se apunta si falta en dos actualizaciones seguidas, para evitar falsos avisos.
- **A tu nombre:** tickets asignados a AMRG, pendientes de asignar.
- **Sin planificar:** visitas presenciales sin fecha o con la fecha ya pasada (y cuántas tienen fecha pero no hora).
- **Seguimientos:** las notas con fecha de revisión de hoy o vencidas (y las de los próximos 7 días).
- **Rutas:** cuántas rutas de mañana has enviado por WhatsApp y si alguna **cambió en ATGO después de enviarla**.
- **Parados:** tickets en espera (EN FABRICANTE, MATERIAL PTE. FABRICANTE, PTE. MOVER MATERIAL, ESCALADO TIER1, FUERA DE MANTENIMIENTO) con más de 15 días abiertos o 3 días sin cambios. Los días "sin cambios" se cuentan desde que Despacho empezó a vigilar, así que este dato se completa con los días.
- **Rutina:** tus tareas fijas del día. Se vacían solas cada mañana; *Editar* para cambiarlas.
- **Copiar resumen del día:** texto listo para pegar a tu responsable (abiertas por estado y zona, novedades de hoy, visitas de mañana, sin planificar, parados).

## Ficha del ticket, notas y seguimientos

Haz clic en cualquier ticket (en Mi día, Incidencias o Mañana) para abrir su ficha a la derecha:

- **Motivo de apertura y último comentario:** el texto con el que se abrió la incidencia y lo último que escribió alguien (normalmente el técnico tras la visita), sacados del hilo del ticket en ATGO. Debajo, el **hilo completo** plegado, sin los mensajes automáticos ("ha iniciado el ticket", "incidencia asignada a…"). Se guarda en el equipo y se refresca al abrir la ficha. Pedir el hilo de los ~90 tickets tarda menos de 1 segundo; después solo se piden los de tickets nuevos o que cambian. El buscador `Ctrl+K` también busca en el motivo.
- **Abrir en ATGO**, **Copiar ficha** (Nº, cliente, sede, dirección, estado, visita, técnico, tipo y referencia, con formato para pegar en tu plantilla de Outlook) y **Copiar Nº**.
- **Nota y seguimiento:** una nota privada y una fecha para revisarlo (Hoy, Mañana, Lunes, +1 semana o la que elijas). Aparece en *Seguimientos* ese día; márcalo como hecho al terminar. En las listas, los tickets con nota llevan ✎ y los que tienen cambios sin ver, un punto naranja.
- **Historial:** los cambios que Despacho ha visto en ese ticket.

## Avisos de Windows

En ⚙ → **Activar avisos**. Despacho te avisa con una notificación de Windows, aunque estés en otra ventana, de:
tickets nuevos o reasignados a tu nombre, escalados a TIER1, cambios en las rutas de mañana (incluidas las ya enviadas) y, si lo activas, cualquier ticket nuevo. Necesita Despacho abierto y la pestaña de ATGO sincronizando.

## Atajos

- `Ctrl+K` o `/`: buscador de tickets y acciones.
- `Esc`: cierra la ficha o el buscador.

## Tus datos

- **El Excel no sale de tu equipo:** se lee en el navegador y no se guarda en ningún sitio. Hay que importarlo cada vez que abres la app.
- **Notas, seguimientos, rutina, teléfonos e historial** se guardan solo en este equipo y navegador. Para no perderlos o llevarlos a otro equipo: ⚙ → **Copia de seguridad → Exportar** (un `.json`) y luego **Restaurar** (o arrastra el `.json` sobre la ventana). La copia incluye también las plantillas que importaste en su día.

## Publicar cambios

1. Edita y sube los archivos que cambien.
2. En `sw.js`, cambia `VERSION` (por ejemplo, de `despacho-v1.0.0` a `despacho-v1.0.1`). Si no lo cambias, la app instalada puede seguir usando la versión antigua.
3. La próxima vez que abras la app aparecerá el aviso **"Hay una versión nueva" → Actualizar**.

## Configuración rápida

- `ZONAS` (en `index.html`): zonas y sus técnicos. La zona `DISPATCHER` (AMRG) es quien controla: sale la primera en Incidencias y no cuenta como técnico en Mañana ni recibe WhatsApp. Los técnicos que se cargan son los de todas las zonas; en `atgo-sync.js` está la misma lista en `OPERARIOS`: si añades o quitas un técnico, cámbialo en los dos.
- `ESTADOS`: estados que se cargan. En `index.html` por nombre; en `atgo-sync.js` por código de ATGO (10 PRESENCIAL, 20 PUESTO OPERATIVO, 30 FUERA DE MANTENIMIENTO, 40 MATERIAL PTE. FABRICANTE, 80 PTE. MOVER MATERIAL, 100 EN FABRICANTE, 110 ESCALADO TIER1).
- `REFRESCO_MIN` (en `atgo-sync.js`): minutos entre actualizaciones.
- `COLS` (en `index.html`): qué columna del Excel corresponde a cada dato (0 = A, 1 = B, …).
