# VISOR INCIDENCIAS

PWA para Dispatcher de técnicos IT presenciales. Importa una planificación Excel, filtra los 19 operarios autorizados, normaliza fechas/horas, calcula prioridades por caducidad y prepara un análisis de rutas con geocodificación y routing opcionales.

## Requisitos

- Node.js 18+ recomendado.
- npm 9+.
- Navegador moderno (Chrome/Edge recomendado para instalar la PWA).

## Instalación local

Desde la raíz del proyecto:

```bash
npm install
npm run dev
```

Vite mostrará la URL local. La información de planificación y configuración se guarda en IndexedDB del navegador.

## Build

```bash
npm run build
npm run preview
```

El build se genera en `dist/`.

## GitHub Pages

El proyecto utiliza `base: './'` y `HashRouter` no es necesario porque la navegación interna es gestionada por el propio estado de la SPA. Esto evita el problema habitual de rutas directas en GitHub Pages.

1. Crea un repositorio vacío en GitHub, por ejemplo `visor-incidencias`.
2. Descomprime este ZIP.
3. Sube **el contenido de la carpeta raíz** al repositorio, de forma que `package.json`, `src/`, `public/`, etc. queden directamente en la raíz de GitHub.
4. En la raíz ejecuta `npm install`.
5. Ejecuta `npm run build` para validar el proyecto.
6. En GitHub entra en **Settings → Pages**.
7. Para un despliegue manual, utiliza la rama configurada por GitHub Pages con la carpeta de publicación correspondiente a tu flujo. Para producción se recomienda una acción de GitHub que publique `dist/`.
8. La aplicación se abrirá en la URL que GitHub Pages asigne al repositorio.

### Despliegue recomendado con GitHub Actions

Puedes crear una acción de GitHub que ejecute `npm ci`, `npm run build` y publique `dist/`. El proyecto ya está preparado para un hosting estático; no necesita backend.

## Uso

### Importar Excel

Se admiten `.xlsx`, `.xls` y `.csv`. Las columnas se buscan por nombre, ignorando diferencias de mayúsculas/minúsculas y espacios. Solo se procesan:

1. NUM.
2. F. VISITA
3. DESDE HORA
4. FECHA CADUCIDAD
5. DESC. SEDE
6. REFERENCIA
7. OPERARIO
8. ESTADO
9. DES. CLIENTE
10. DOMICILIO

Los registros cuyo `OPERARIO` no pertenezca a la lista autorizada se descartan.

### Prioridades

- VENCIDA: fecha de caducidad anterior a hoy.
- CADUCA HOY: hoy.
- ≤ 48 H: 1-2 días.
- ≤ 5 DÍAS: 3-5 días.
- NORMAL: más de 5 días.
- SIN FECHA: sin fecha válida.

### Horarios y rutas

`DESDE HORA` se trata como una restricción horaria. La aplicación ordena las citas con hora por ese campo y comprueba la viabilidad del desplazamiento solo cuando dispone de punto de origen/destino y el proveedor de routing devuelve datos.

No se inventan duraciones de intervención, coordenadas ni tiempos de viaje. Si faltan datos, la interfaz muestra `Ruta no calculada`, `Inicio no configurado` o `No se ha podido localizar la dirección`.

## Configuración de técnicos

En **Configuración → Técnicos** están los 19 operarios:

`ACAB, JMOG, DSG, CLH, ADJC, LGV, JCGM, LEOC, IFF, JVR, FMNT, MMHG, ILG, JRHG, AAR, EACL, MLOR, PHEP, JIFC`.

Para cada uno puedes guardar punto de inicio, dirección, población, provincia y coordenadas. La configuración persiste en IndexedDB.

## Geocodificación

Servicio desacoplado en `src/services/geocodingService.ts`. Está preparado para OpenStreetMap/Nominatim u otro endpoint configurable. Los resultados se cachean localmente por dirección.

La activación está deshabilitada por defecto para evitar llamadas externas inesperadas. Debe revisarse y aceptarse la política de uso del proveedor elegido antes de activarla en un entorno real.

## Routing

Servicio desacoplado en `src/services/routingService.ts`. Soporta de base OSRM, OpenRouteService y endpoint personalizado. Las claves se introducen desde configuración y no están incluidas en el repositorio.

El routing está deshabilitado por defecto. Sin proveedor activo, la aplicación continúa operativa y no muestra distancias/tiempos inventados.

## PWA

`vite-plugin-pwa` genera el service worker, manifest y precaché del build. La aplicación utiliza `display: standalone`, iconos y fallback de navegación. En Chrome/Edge, una vez publicada por HTTPS, aparecerá la opción de instalarla como aplicación.

## Exportación

Desde la barra superior se pueden exportar el resumen de carga o las incidencias. En la tabla de incidencias existe una exportación respetando los filtros aplicados.

## Datos de ejemplo

`Cargar datos de ejemplo` crea una planificación aislada con datos ficticios para probar prioridades, horarios, técnicos con carga, incidencias sin hora y direcciones no localizadas. Estos datos sustituyen la planificación actual; la configuración de técnicos permanece.

## Arquitectura

- `src/components/`: UI reutilizable.
- `src/pages/`: vistas principales.
- `src/services/`: Excel, planificación, geocodificación, routing y exportación.
- `src/storage/`: persistencia IndexedDB.
- `src/workers/`: procesamiento de Excel fuera del hilo principal.
- `src/types/`: modelos TypeScript.
- `src/data/`: lista de técnicos y datos de demostración.
- `src/hooks/`: estado y operaciones de aplicación.

## Limitaciones actuales

La duración de cada intervención no existe en las 10 columnas solicitadas, por lo que el sistema no la fabrica. El cálculo de llegada y margen depende del routing real. La optimización no debe considerarse un motor de optimización logística completo mientras no exista un proveedor de rutas operativo y puntos de inicio configurados.

También conviene revisar las condiciones de uso del proveedor externo antes de activar geocodificación o routing desde un despliegue público.
