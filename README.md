# Visor de Incidencias · Panel de Despacho

PWA para Windows para el trabajo diario de Dispatcher:

- **Incidencias:** se cargan **en tiempo real desde ATGO** (o importando un Excel/CSV) y se agrupan por operario. Hay vista **En ruta total** (visitas presenciales de hoy, una tarjeta por técnico) y filtros *En ruta / Fuera de ruta* en cada técnico. Solo se cargan los operarios y estados configurados.
- **Zonas:** los técnicos se agrupan y ordenan por zona (Sevilla/Huelva, Córdoba/Jaén, Granada, Almería, Málaga, Cádiz, Ceuta, Melilla, Extremadura), con chips para filtrar por zona.
- **Mañana:** visitas presenciales del próximo día laborable (se puede cambiar de día) por técnico y zona, con barra de carga, técnicos libres y botón **WhatsApp** que envía a cada técnico su planificación.
- **Plantillas:** correos por cliente con campos variables (`{tecnico}`, `{num}`, `{sede}`, `{fecha}`, `{hora}`, `{direccion}`, `{tiempo}`, `{cliente}`) que se pueden rellenar desde una incidencia, y recordatorios para técnicos.

No hace falta compilar nada: son archivos estáticos (HTML + JS) y GitHub Pages los publica tal cual.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `index.html` | La aplicación completa |
| `manifest.webmanifest` | Nombre, iconos y ajustes para instalarla como app de Windows |
| `sw.js` | Service worker: funcionamiento sin conexión y actualizaciones |
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
4. Deja la pestaña de ATGO abierta (puede estar en segundo plano): se actualiza sola **cada 5 minutos**. El botón ⟳ del recuadro fuerza una actualización y ✕ la detiene.

Detalles:
- Solo se piden a ATGO los estados **PRESENCIAL, PUESTO OPERATIVO, FUERA DE MANTENIMIENTO, MATERIAL PTE. FABRICANTE, PTE. MOVER MATERIAL, EN FABRICANTE y ESCALADO TIER1**, y solo se quedan los operarios configurados.
- La API de ATGO es lenta (unos 13 s por página de 20). Una carga completa tarda unos minutos; la primera vez las incidencias van apareciendo según llegan.
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

## Tus datos

- **El Excel no sale de tu equipo:** se lee en el navegador y no se guarda en ningún sitio. Hay que importarlo cada vez que abres la app.
- **Las plantillas y los recordatorios** se guardan en el almacenamiento local de la app, en ese equipo y navegador. Para no perderlos o para llevarlos a otro equipo, usa **Plantillas → Exportar copia** (descarga un `.json`) y luego **Restaurar copia** (también puedes arrastrar el `.json` sobre la ventana).
- Las plantillas que creaste en la versión de prueba (el artefacto de Claude) **no se pasan solas**: esa versión vive en otra dirección web. Tendrás que volver a crearlas aquí una vez.

## Publicar cambios

1. Edita y sube los archivos que cambien.
2. En `sw.js`, cambia `VERSION` (por ejemplo, de `despacho-v1.0.0` a `despacho-v1.0.1`). Si no lo cambias, la app instalada puede seguir usando la versión antigua.
3. La próxima vez que abras la app aparecerá el aviso **"Hay una versión nueva" → Actualizar**.

## Configuración rápida

- `ZONAS` (en `index.html`): zonas y sus técnicos. Los técnicos que se cargan son los de todas las zonas; en `atgo-sync.js` está la misma lista en `OPERARIOS`: si añades o quitas un técnico, cámbialo en los dos.
- `ESTADOS`: estados que se cargan. En `index.html` por nombre; en `atgo-sync.js` por código de ATGO (10 PRESENCIAL, 20 PUESTO OPERATIVO, 30 FUERA DE MANTENIMIENTO, 40 MATERIAL PTE. FABRICANTE, 80 PTE. MOVER MATERIAL, 100 EN FABRICANTE, 110 ESCALADO TIER1).
- `REFRESCO_MIN` (en `atgo-sync.js`): minutos entre actualizaciones.
- `COLS` (en `index.html`): qué columna del Excel corresponde a cada dato (0 = A, 1 = B, …).
