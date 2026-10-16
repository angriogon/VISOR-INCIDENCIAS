# Implantación en la empresa

Qué hace falta para que Despacho lo usen varios dispatchers y el coordinador, y qué decidir antes. Estado a 16/10/2026 (versión 1.25.0).

## Cómo funciona hoy

- **Aplicación web estática** (HTML, CSS y JS, sin servidor ni base de datos) publicada en GitHub Pages. Se instala como aplicación de Windows desde Edge o Chrome y se actualiza sola.
- **Datos de ATGO**: los lee la pestaña de ATGO del propio usuario (con la extensión o el favorito), con su sesión.
  - El token de ATGO nunca sale de esa pestaña.
  - Sin sesión en ATGO, Despacho no ve nada.
- **Escrituras en ATGO** (comentario, estado, técnico y visita): siempre con confirmación y comprobadas campo a campo. Dependen de los permisos de ATGO de cada usuario.
- **Datos propios** (notas, preferencias, nómina y perfiles, cerradas, informes): se guardan en el navegador de cada equipo.
  - Hay copia de seguridad manual y automática en OneDrive.
  - No se comparten entre equipos: los perfiles y la nómina se pasan con «Exportar/Importar perfiles».
- **Perfiles**: DSP1–DSP5 (cada dispatcher ve sus técnicos) y COORD (panel de control de todos los DSP, con informes en Excel). Se elige en cada equipo.

## Decisiones antes de extenderlo

1. **Autorización de uso de la API interna de ATGO** por varios usuarios. Lo ideal es pedir a Tier1 una API oficial: evitaría depender de la pestaña de ATGO y permitiría la versión móvil (ver `propuesta-ios.md`).
2. **Alojamiento y privacidad.** El repositorio y la web son públicos. No contienen tickets ni clientes, pero sí siglas de técnicos y zonas. Hay tres opciones:
   - GitHub Pages desde un repositorio privado (plan de pago de GitHub).
   - Servidor interno de la empresa.
   - Azure Static Web Apps con acceso por cuenta corporativa (requiere a IT).

   Basta con copiar los archivos de la raíz: no hay compilación.
3. **Permisos en ATGO** de cada dispatcher y del coordinador. Reasignar y cambiar estados dependen de ellos.
4. **Carga sobre ATGO.** Cada equipo consulta ATGO cada 2 minutos, 6 técnicos a la vez. Medido: DSP1 ≈ 20 s y COORD (70 técnicos y 42 comodines) ≈ 65 s por ciclo. Con muchos equipos a la vez conviene medirlo en un piloto y, si hace falta, subir el intervalo (`REFRESCO_MIN` en `atgo-sync.js`).
5. **Configuración compartida.** Hoy las zonas y la lista matriz están en el código (`ZONAS_BASE` en `app.js`) y cada equipo ajusta lo suyo en ⚙ › Técnicos y Perfiles. Si se quiere una sola fuente para todos, el siguiente paso sería un archivo de configuración publicado junto a la app (p. ej. `config/perfiles.json`) que la app lea al arrancar.
6. **Elegir el perfil automáticamente** según el usuario conectado en ATGO, que se lee de su sesión sin pedir contraseña. Hoy se elige a mano en cada equipo.

   Una contraseña en una web estática no protegería nada: la protección real es la sesión de ATGO.

## Despliegue propuesto

1. **Piloto** con un segundo dispatcher y el coordinador, 1–2 semanas. Medir tiempos de carga, permisos y asignación en bloque.
2. **Guía corta** para cada usuario:
   - Instalar la app.
   - Cargar la extensión (`despacho-extension.zip`, sección «Extensión» del README).
   - Elegir su perfil.
   - Activar avisos.
3. **Resto de dispatchers**, con la nómina y los perfiles exportados desde un equipo de referencia.

## Mantenimiento

- **Publicar cambios:** subir a la rama `main`. GitHub Pages publica solo, y GitHub Actions ejecuta las pruebas (`tests/pruebas.js` y `tests/arranque.mjs`).
- **Reglas para cambiar el código:** en `CLAUDE.md` (versiones, orden de carga, escrituras en ATGO). Estado y pendientes: `ESTADO.md`.
