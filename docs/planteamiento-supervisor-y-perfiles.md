# Planteamiento: menú Supervisor y varios dispatchers

Documento de estudio para dos ampliaciones de Despacho. No está implementado: describe cómo se haría, por fases, con sus decisiones, riesgos y esfuerzo. Todo parte de la misma aplicación alojada en GitHub Pages (`https://angriogon.github.io/VISOR-INCIDENCIAS/`).

## Lo que ya sabemos de ATGO (base técnica)

- **Lectura:** Despacho lee ATGO con la sesión del usuario desde la pestaña de ATGO (favorito o extensión). ATGO tarda ~0,5 s por ticket devuelto, así que se pide **por operario** (`codOpe.equals`), 6 consultas a la vez.
- **Volumen nacional:** en los 7 estados seguidos hay ~600 tickets en toda España. Cargarlos todos por operario costaría ~1 minuto por ciclo (6 en paralelo): viable cada 5 minutos, no cada 2.
- **Operarios:** ATGO tiene un buscador de operarios (`/api/v1/atgo/operario`). Los "sin asignar" son **42 operarios comodín** `XXX-…` ("PENDIENTE ASIGNAR <zona>": Sevilla, Cádiz, Madrid, Galicia, Valencia_1…).
- **Usuario conectado:** ATGO guarda en el navegador quién ha iniciado sesión (`codOpe`, `desOperario`, `roles`, `permissions`). Despacho puede saber qué dispatcher es sin pedir contraseña.
- **Escritura:** ya validadas comentario en el hilo, cambio de estado y reasignar técnico/fecha (con comprobación campo a campo). Lo que un dispatcher puede hacer depende de **sus permisos en ATGO**.

---

## 1. Varios dispatchers con perfiles

### Objetivo
Que cada dispatcher de España use la misma aplicación viendo **solo sus técnicos, sus zonas y sus comodines "pendiente asignar"**, y que añadir técnicos o dispatchers no requiera tocar el código.

### Idea clave: la configuración sale del código
Hoy los técnicos y zonas están escritos en `index.html` y `atgo-sync.js`. Se moverían a un archivo de configuración, por ejemplo `config/perfiles.json`:

```json
{
  "dispatchers": [
    {
      "id": "AMRG", "nombre": "Ángel Ríos", "codigosAtgo": ["AMRG"],
      "zonas": [
        { "nombre": "SEVILLA/HUELVA", "tecnicos": ["DSG","ACAB","CLH","JGAM"], "pendiente": ["XXX-SVQ"], "gls": "GLS Sevilla", "provincias": ["Sevilla","Huelva"] },
        { "nombre": "MÁLAGA", "tecnicos": ["JVR","ILG","MMHG","FMNT"], "pendiente": ["XXX-MA"], "gls": "GLS Málaga", "provincias": ["Málaga"] }
      ]
    },
    { "id": "XXXX", "nombre": "Dispatcher Madrid", "codigosAtgo": ["XXXX"], "zonas": [ { "nombre": "MADRID", "tecnicos": ["..."], "pendiente": ["XXX-M"] } ] }
  ]
}
```

La aplicación lo lee al arrancar y el sincronizador de ATGO recibe de Despacho la lista de técnicos y comodines del perfil (en lugar de tenerla fija).

### ¿Cómo se elige el perfil? Tres opciones

| Opción | Cómo funciona | Seguridad real | Comodidad |
|---|---|---|---|
| **A. Automático por el usuario de ATGO (recomendada)** | Al sincronizar, Despacho lee qué usuario ha iniciado sesión en ATGO (p. ej. AMRG) y carga su perfil | La de ATGO: sin sesión en ATGO no hay datos | Máxima: no hay que elegir nada |
| B. Selector de perfil | Pantalla inicial con los dispatchers; se recuerda en ese equipo | Ninguna (cualquiera puede elegir otro perfil) | Alta |
| C. Selector con contraseña | Como B, con contraseña por perfil | **Aparente**: en una web estática las contraseñas y la configuración se pueden leer en el código | Media |

**Recomendación:** A, con B como respaldo (por si alguien cubre la zona de un compañero). Una contraseña en una web alojada en GitHub Pages **no protege nada**: el código y la configuración son públicos. La protección real de los datos es el inicio de sesión de ATGO, que ya existe y que Despacho respeta (sin sesión en ATGO, Despacho no ve tickets). Si se quiere evitar errores al elegir perfil, basta un PIN sencillo "para no equivocarse", sin presentarlo como seguridad.

### Privacidad del repositorio
El repositorio es público: cualquiera puede ver la configuración (siglas de técnicos, zonas). No contiene datos de tickets ni clientes. Si se prefiere que no sea visible:
- **GitHub Pages desde repositorio privado** requiere plan de pago de GitHub (Pro/Team).
- Alternativa: alojarlo en un servidor interno de la empresa o en Azure Static Web Apps con acceso por cuenta corporativa (requiere a IT).

### Qué cambia para cada dispatcher
- **Pestañas:** iguales. Incidencias, Semana, Mañana e Informe muestran solo sus técnicos.
- **Sin asignar:** cada uno ve los comodines de sus zonas. El **buzón** sigue sirviendo para lo que no es de nadie de su equipo (p. ej. el genérico `XXX (ROLL)`).
- **Datos propios** (notas, rutina, teléfonos, copia en OneDrive): siguen siendo de cada equipo; no se mezclan.
- **Técnicos que cambian de zona o de dispatcher:** se edita el archivo de configuración y todos lo reciben al abrir la app.

### Fases
1. **Configuración externa** (2–3 días de trabajo): `config/perfiles.json`, carga al arrancar, el sincronizador usa la lista del perfil, la zona de los comodines sale de la configuración. Con un solo perfil (el actual), la app funciona igual que hoy.
2. **Perfiles** (1–2 días): detección por usuario de ATGO, selector de respaldo, nombre del dispatcher en la cabecera, "Cambiar de perfil".
3. **Editor de configuración** (2 días): pantalla para añadir técnicos, zonas, GLS y comodines; exporta el JSON listo para subir a GitHub (o lo guarda directamente si se usa la API de GitHub con un token del administrador).
4. **Piloto con un segundo dispatcher** (1–2 semanas de uso real): validar rendimiento (más técnicos por perfil), permisos de ATGO de ese usuario y la reasignación desde Despacho.
5. **Despliegue al resto** con una guía corta (favorito o extensión, instalar la app, elegir perfil).

### Riesgos y decisiones pendientes
- **Permisos en ATGO** de cada dispatcher: la reasignación y los cambios de estado dependerán de ellos.
- **Carga en ATGO:** cada dispatcher genera sus propias consultas; con 6–8 dispatchers el total equivale a varios ciclos completos por minuto. Conviene medirlo en el piloto y, si hace falta, ampliar el intervalo a 3–5 minutos.
- **Autorización de la empresa** para usar la API interna de ATGO por varios usuarios (idealmente, pedir a Tier1 una API oficial).

---

## 2. Menú Supervisor (coordinador de dispatchers)

### Objetivo
Un ámbito de trabajo para quien coordina a los dispatchers: ver de un vistazo **cómo va cada zona y cada técnico de España**, detectar dónde hay que intervenir y redistribuir carga, sin entrar en el detalle de cada ticket salvo cuando lo necesite.

### Requisitos previos
- Los **perfiles** del apartado anterior (para saber qué zona y técnicos son de cada dispatcher).
- Un perfil "Supervisor" que agrupe **todos** los dispatchers.
- Carga nacional cada ~5 minutos (≈600 tickets en los estados seguidos, ~1 min de ATGO por ciclo).

### Pantallas propuestas

**1. Panel nacional (inicio del supervisor)**
- Casillas por dispatcher/zona: visitas de hoy y % terminadas, en trámite, pendientes con retraso, **sin asignar** (comodines) y su antigüedad, caducidades vencidas o < 24 h, escalados a TIER1, parados.
- Semáforo por zona (verde / ámbar / rojo) según umbrales configurables.
- Mapa de España con el número de visitas y sin asignar por provincia.

**2. Técnicos**
- Tabla de todos los técnicos: dispatcher, zona, visitas hoy y mañana, **carga en horas** (duración real aprendida), última actividad en ATGO (inicio/fin de visita), % de cumplimiento semanal, reincidencias.
- Filtros por dispatcher, zona, sobrecargados, libres, "sin actividad desde las X".
- Detección de **huecos y sobrecargas** entre zonas vecinas (p. ej. un técnico libre en Cádiz mientras Sevilla está sobrecargada).

**3. Tickets**
- Bandeja nacional de **sin asignar** por zona, ordenada por antigüedad y caducidad.
- **SLA en riesgo**: tickets que caducan en las próximas horas sin visita planificada.
- Escalados, parados y reincidencias de todo el país.
- Acciones (si sus permisos de ATGO lo permiten): reasignar a otra zona, comentar en el hilo, cambiar estado, con la misma confirmación y comprobación campo a campo.

**4. Equipo de dispatchers**
- Carga de cada dispatcher: tickets abiertos, sin asignar pendientes, rutas de mañana enviadas o no.
- Cobertura: quién cubre la zona de quién en vacaciones o bajas (cambio temporal de perfil).

**5. Informes**
- Informe diario y semanal **comparativo** por zona y dispatcher (cumplimiento, caducidades vencidas, tiempos medios, reincidencias), exportable a Excel/correo.
- Tendencias de 4–8 semanas.

### Fases
1. **Perfil Supervisor y carga nacional** (3–4 días): requiere la configuración de perfiles; sincronización de todos los técnicos y comodines cada 5 min.
2. **Panel nacional y Técnicos** (4–5 días): reutiliza la lógica actual (ruta de hoy, carga en horas, conflictos) aplicada a todas las zonas.
3. **Tickets y acciones** (3 días): bandeja nacional, SLA en riesgo, acciones con permisos.
4. **Informes comparativos** (2–3 días).
5. **Datos compartidos (opcional)**: notas y avisos entre supervisor y dispatchers. Hoy cada navegador guarda lo suyo; compartirlo necesita un almacén común:
   - **Microsoft 365 (SharePoint/Lista o archivo en OneDrive compartido)** vía Microsoft Graph: encaja con la empresa, pero requiere registrar una aplicación en Azure (IT).
   - **Servicio externo** (Supabase, Firebase): rápido de montar, pero los datos salen a un tercero; requiere visto bueno de la empresa.

### Riesgos y decisiones pendientes
- **Rendimiento de ATGO** con la carga nacional: medir en el piloto; si es alta, el supervisor podría cargar por bloques (zona activa primero).
- **Permisos de ATGO** del supervisor (ver y modificar todas las zonas).
- **Qué umbrales** definen el semáforo (p. ej. > 5 sin asignar o > 2 h de antigüedad = ámbar).
- **Datos compartidos:** decidir si basta con que cada uno vea lo suyo o si se necesita coordinación escrita entre roles.

## Orden recomendado
1. Perfiles con configuración externa (fases 1–2 del apartado 1) y piloto con un segundo dispatcher.
2. Supervisor fases 1–2 (panel nacional y técnicos).
3. Resto según uso real.
