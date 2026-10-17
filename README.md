# Despacho · Visor de incidencias de ATGO

Aplicación de Windows (PWA) para dispatchers y coordinación de Tier1. Lee las incidencias de ATGO en tiempo real, avisa de lo importante y ayuda a planificar técnicos. Solo escribe en ATGO desde acciones que el usuario confirma (comentar, cambiar estado, asignar técnico y visita), y comprueba cada cambio después.

Web: **https://angriogon.github.io/VISOR-INCIDENCIAS/**. Son archivos estáticos: no hay que compilar nada ni instalar dependencias.

## Puesta en marcha

1. **Instalar:** abre la web en Edge o Chrome y pulsa **Instalar app** (o *⋯ › Aplicaciones › Instalar este sitio como aplicación*). Queda en el menú Inicio como **Despacho**, funciona sin conexión con los últimos datos y se actualiza sola cuando no estás haciendo nada.
2. **Conectar con ATGO:** la lectura se hace dentro de tu pestaña de ATGO, con tu sesión. El token nunca sale de ella.
   - **Extensión (recomendado):**
     1. Descarga y descomprime `despacho-extension.zip`.
     2. Abre `edge://extensions` (o `chrome://extensions`), activa *Modo de desarrollador* y pulsa *Cargar desempaquetada* sobre esa carpeta.
     3. Abre ATGO con ⚙ › General › *Abrir ATGO*.
   - **Favorito** (si la empresa no permite extensiones): arrastra **⟳ Despacho ATGO** desde la pantalla inicial a la barra de favoritos y púlsalo en la pestaña de ATGO.
3. Deja la pestaña de ATGO abierta, aunque sea en segundo plano. Se actualiza cada **2 minutos**.
4. **Elegir perfil:** usa el botón del perfil en la cabecera. El primer día te guía un asistente.

**Si se queda pillado:** ⚙ › General › **Forzar reconexión**, o pulsa el punto de estado de la cabecera. Recarga ATGO desde cero y, si no conecta, explica qué revisar. Si una pestaña de ATGO antigua da error, Despacho avisa para cerrarla.

## Perfiles

- **DSP1–DSP5:** cada dispatcher ve y sincroniza solo sus técnicos y zonas.
  - DSP1: Andalucía y Extremadura.
  - DSP2: Cataluña y Levante.
  - DSP3: Madrid-Centro.
  - DSP4: Norte.
  - DSP5: Baleares y Portugal.

  Se puede asignar a cualquier técnico de cualquier perfil.
- **COORD (control):** pestañas **CONTROL · INCIDENCIAS · PLANIFICACIÓN**, con todos los DSP. Ver [Control](#control-perfil-coord).
- **Ventana de Perfiles** (botón del perfil o ⚙ › Perfiles):
  - Añade técnicos por código, por zonas o copiándolos de otro perfil, y quítalos con ×.
  - **Restablecer** vuelve a la lista matriz.
  - **Exportar e importar** los pasa a otro equipo.
- **Técnicos (nómina)** (⚙ › Técnicos):
  - Da de alta técnicos y cambia su zona o DSP; entran en ese perfil y en COORD.
  - Marca a un técnico **de baja** o pon sus **vacaciones** (fechas de inicio y fin). Mientras dure, no sale en Incidencias ni en Planificación y no se propone al asignar; vuelve solo al acabar las vacaciones.
  - Si le quedan incidencias, un aviso en Incidencias las cuenta y permite verlas para reasignarlas. Al asignar a alguien de vacaciones ese día, la confirmación lo avisa.
  - Las altas y los cambios de zona se aplican al recargar.

## Pestañas

### Mi día
Lo que pide acción hoy:
- Novedades desde la última carga.
- Tickets a tu nombre.
- Sin asignar de tu zona.
- Rutas enviadas.
- **Hoy en directo:** línea de tiempo por técnico.
- Conflictos del próximo laborable (dos citas a la misma hora en la misma sede no cuentan como solape).
- Caducidades y material.

Botones:
- **Mis cambios:** todo lo hecho en ATGO desde Despacho, con su resultado.
- **Sin cerrar hoy:** visitas de hoy sin finalizar, con «Recordar» por WhatsApp.
- **Copiar resumen del día** e **Informe semanal**, con histórico de 8 semanas.

### Sin asignar
Visitas en PRESENCIAL que siguen en un operario comodín «PENDIENTE ASIGNAR». Van ordenadas por urgencia: primero las que caducan antes y después las más antiguas.
- **Técnico recomendado ★:** el que ya tiene otra incidencia en esa sede (📍) o el de su zona con menos carga; cuenta a favor ir ya a esa población.
- Los técnicos de Cádiz hacen **apoyo** en Ceuta y los de Málaga en Melilla.
- **Asignar en masivo:** marca varias, cada una con su técnico y fecha.
- Las de otras zonas se pueden **archivar en el buzón**.
- ⏰ marca las de tu zona que llevan más de 4 h sin técnico (se cambia en ⚙ › General).

### Incidencias
Un bloque por técnico, agrupados por zona:
- **Barra de progreso de su ruta de hoy:** terminada, en trámite, en curso o pendiente, con retrasos.
- Dentro, las incidencias van **agrupadas por estado**, cada línea con el color de su estado. Justo detrás del Nº salen **VISITA** y **CADUCA**: naranja si quedan menos de 3 días; rojo si quedan menos de 24 h o ya caducó.
- **Filtros:** por zona, DSP, estado, «caducan en 24 h o vencidas» y texto. Los filtros se pueden guardar.
- **🔁 Reincidencia:** el mismo equipo vuelve a fallar en 10 días, abierto o ya cerrado. El equipo se reconoce por el IT de la balanza, el elemento de ATGO o «caja N» con su aparato.
- **Cerradas · últimos 15 días** en cada técnico.

### Planificación
La semana por técnico y día (cada zona se pliega pulsando su nombre; los iconos de arriba pliegan o despliegan todas, y plegada muestra el total por día), con número de visitas, **carga en horas** (verde, ámbar o rojo) y ⚠ cuando hay conflicto. Respeta los festivos.
- **Arrastrar y soltar** desde *Por planificar* (sin asignar, vencidas y sin fecha) o entre casillas.
- **Asignar en bloque** y **Replanificar vencidas**: se envían de una vez y ATGO las guarda de 4 en 4.
- **Clic en una casilla:** sus visitas, la ruta en Google Maps (recogida en GLS de 9:00 a 10:00) y **Rellenar el día**, que propone hasta 6 visitas.
- **Clic en un día:** su detalle, con **WhatsApp** de la ruta a cada técnico («Enviar todas las rutas»), **Correos del día** y **Mapa** con las rutas, los km y los minutos entre visitas. El mapa abre al momento: las direcciones de la semana se sitúan antes, en segundo plano, y las que falten aparecen solas.

### Control (perfil COORD)
- **Cinco cifras** que se pueden pulsar: **Presencial** (con el total de abiertas debajo), **Sin asignar**, **Caducadas**, **Caducan hoy** (sin las de FUERA DE MANTENIMIENTO, que no tienen SLA) y **En ruta hoy** (hechas/total y retrasos).
- **Filtros:** DSP, cliente, **proyecto** (los del cliente elegido, con cuántas incidencias tiene cada uno) y búsqueda.
- **Dos listas:** *Pendientes de asignar* (caducidad, zona y tiempo esperando) y *Presencial · Caducadas · Caducan hoy · En ruta hoy · Todas*. Pulsar una cifra abre su lista ahí mismo, y elegir un cliente muestra todas sus incidencias abiertas, también las asignadas.
- **Excel de cada lista** e **Informe completo**: un Excel con un resumen por DSP, el desglose por estado y una hoja por lista, respetando los filtros puestos.
- Al pulsar una incidencia se abre su ficha, desde donde se puede reasignar.

## Ficha del ticket
Se abre con clic en cualquier ticket y tiene tres pestañas:
- **Resumen:** datos y contacto (llamar o escribir), duración estimada, caducidad (corregible a mano), motivo de apertura y último comentario, material con su seguimiento de GLS, **Esta sede** (sus otras incidencias) y tu **nota con fecha de seguimiento**.
- **Actuar:**
  - Comentar en el hilo, con respuestas rápidas.
  - Cambiar estado.
  - **Planificar en ATGO:** técnico, fecha y horas, con el técnico sugerido.
  - WhatsApp al técnico con plantillas.
  - El resultado de cada cambio sale arriba (✓ o ✕).
  - Tras asignar, **Deshacer** durante 30 s.
- **Historial:** el hilo completo de ATGO y los cambios vistos.

**Cómo se guarda en ATGO:** ATGO guarda la ficha completa, así que Despacho la lee justo antes, cambia solo lo pedido y después la vuelve a leer y la compara campo a campo. Si cambiara cualquier otro campo, restaura la ficha original. Nunca reintenta solo.

## Duración, caducidad y progreso

- **Duración:** sale del hilo («duración estimada 2 h», «de 7 a 15 horas», «jornada completa»…). Si no, de lo que duraron visitas reales a la misma sede o del mismo tipo. Si no se sabe, no se estima y solo cuenta la hora de inicio.
- **Caducidad:** el comentario más reciente del hilo que habla de caducidad, vencimiento, fecha límite o SLA, o la fecha de ATGO.
- **Progreso de la ruta:**
  - *Terminada:* el ticket está en un estado de cierre (CERRADO, PUESTO OPERATIVO y sus variantes de presupuesto).
  - *En trámite:* salió de PRESENCIAL hacia otro estado.
  - *En curso:* el técnico asignado la inició en ATGO.
  - *Pendiente:* el resto.

## Avisos de Windows
⚙ › Avisos:
- Tickets nuevos o reasignados a tu nombre.
- Escalados a TIER1.
- Cambios en rutas ya enviadas.
- Material.
- Caducidad en menos de 4 h.
- Sin asignar nuevos en tu zona.
- Comentarios de técnicos.
- ATGO sin actualizar más de 10 minutos.

⚙ › General:
- **Resumen matinal**, por defecto a las 8:00.
- **Técnico sin actividad**, por defecto a las 11:00.
- **Visitas sin cerrar**, por defecto a las 19:00.

No se avisa en fines de semana ni en festivos.

## Ajustes (⚙)

- **General:** **ACTUALIZAR** (trae al momento los datos de ATGO sin recargar la página y busca versión nueva), conexión con ATGO (*Abrir ATGO*, *Forzar reconexión*, *Importar Excel*) y horas de los avisos del día.
- **Apariencia:**
  - **Tema:** como Windows, claro u oscuro.
  - **Color:** naranja, azul ATGO, verde, morado o grafito.
  - **Tamaño:** compacto, normal o amplio.
  - **Zoom:** del 100 al 150 %.
- **Accesibilidad**, en Apariencia:
  - **Modo accesible**, que activa de una vez el alto contraste, el foco visible, los botones grandes, los enlaces subrayados y quita las animaciones.
  - Cada opción se puede activar por separado. Hay además una letra de lectura fácil.
  - Siempre activo: «Saltar al contenido», foco dentro de las ventanas y nombres para lectores de pantalla.
- **Técnicos · Perfiles · Festivos** (nacionales incluidos; se añaden los autonómicos y locales) · **WhatsApp** (plantillas).
- **Datos:**
  - Copia de seguridad manual y automática en **OneDrive**: cada 10 minutos y una copia por día de los últimos 7.
  - **Exportar a Excel:** incidencias o planificación de la semana.
  - Espacio usado y **Diagnóstico** para enviar si algo falla.
- **Atajos:**
  - `1`–`4`: pestañas.
  - `J` / `K`: moverse por la lista; `Enter`: abrir la ficha.
  - `A`: asignar; `C`: comentar.
  - `Ctrl+K` o `/`: buscador de tickets y acciones.
  - Clic derecho sobre un ticket: menú rápido.
  - `?`: chuleta de atajos.

## Tus datos
Las incidencias vienen de ATGO y no se guardan fuera del navegador. Las notas, la nómina y los perfiles, las preferencias, las cerradas y los informes se guardan **solo en este equipo**. Para no perderlos o pasarlos a otro equipo: ⚙ › Datos › Copia de seguridad (o la copia automática en OneDrive). Lo antiguo se limpia solo para no llenar el navegador; nunca notas, perfiles ni ajustes.

## Para desarrollo

| Archivo | Contiene |
|---|---|
| `index.html`, `styles.css` | Estructura y estilos |
| `dia.js` | Mi día, novedades, avisos, ficha, notas, hilos, buscador y copia de seguridad |
| `herramientas.js` | Cerradas, material, caducidad, ruta y GLS, técnico sugerido, correos, informe semanal y OneDrive |
| `edicion.js` | Escrituras en ATGO (comentario, estado, asignar, lote) con su comprobación |
| `panel.js` | Sin asignar, recomendación, duración, reincidencias, Planificación, rellenar el día y mapa |
| `coord.js` | Panel de Control de COORD e informes en Excel |
| `app.js` | Configuración (`ZONAS_BASE`, perfiles, estados), Incidencias, día de Planificación, WhatsApp y recepción de ATGO |
| `ajustes.js` | Ajustes, perfiles y nómina, apariencia y accesibilidad, novedades, atajos, avisos del día y Excel |
| `atgo-sync.js` | Sincronización que corre dentro de la pestaña de ATGO (la cargan la extensión o el favorito) |
| `sw.js`, `manifest.webmanifest`, iconos | Instalación y funcionamiento sin conexión |
| `extension/`, `despacho-extension.zip` | Extensión de Edge/Chrome |
| `tests/` | `pruebas.js` (sin dependencias) y `arranque.mjs` (navegador sin pantalla). GitHub Actions las ejecuta en cada cambio |
| `docs/` | Estado del proyecto, implantación en empresa y propuestas pendientes |

- **Publicar:** sube los cambios a `main` (GitHub Pages los publica solo). Antes, sube a la vez `VERSION` en `sw.js` y `APP_VERSION` en `ajustes.js` y añade la versión a `NOVEDADES`. Si cambia `atgo-sync.js`, sube también `SYNC_VERSION` (en ese archivo y en `app.js`).
- **Configuración:**
  - `ZONAS_BASE` (`app.js`): zonas, técnicos, `dsp` y `apoyo`. `OPERARIOS` de `atgo-sync.js` es solo un respaldo y debe coincidir.
  - `ESTADOS`: por nombre en `app.js` y por código en `atgo-sync.js`.
  - `REFRESCO_MIN`: minutos entre cargas.
  - `CARGA_ALTA` y `CARGA_MUY` (`app.js`): número de visitas a partir del cual la carga sale en naranja o en rojo.
- **Reglas para cambiar el código:** en `CLAUDE.md`.
