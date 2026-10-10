# Estudio: mejoras para Despacho en Windows

Batería de mejoras para hacer la PWA más **minimalista, fácil de usar, intuitiva, ágil y rápida**, más algunas funciones nuevas. No están implementadas: cada una lleva su valor, su esfuerzo aproximado y por qué se propone. Al final, un orden recomendado.

Esfuerzo: **S** (horas), **M** (1–2 días), **L** (3 días o más).

---

## 1. Más minimalista e intuitiva

| # | Mejora | Qué cambia | Valor | Esfuerzo |
|---|---|---|---|---|
| 1.1 | **Fusionar Mañana dentro de Semana** | Semana ya muestra todos los días; al pulsar un día se abriría su vista detallada (lo que hoy es Mañana: tarjetas por técnico, WhatsApp, correos). Pasarías de 5 a **4 pestañas**: Mi día · Sin asignar · Incidencias · Planificación | Alto | M |
| 1.2 | **Cabecera más limpia** | "Importar" y "ATGO" pasan a ⚙ (se usan poco una vez conectado); el estado de ATGO se resume en un punto de color (verde al día, ámbar cargando, rojo sin actualizar) con el detalle al pasar el ratón | Medio | S |
| 1.3 | **Ficha del ticket con pestañas** | Hoy es una columna larga. Tres pestañas: **Resumen** (motivo, último comentario, caducidad, datos), **Actuar** (comentar, estado, planificar, técnico sugerido) y **Historial** (hilo completo, cambios, mis notas) | Alto | M |
| 1.4 | **Menú contextual** | Clic derecho en cualquier ticket: Abrir en ATGO · Copiar ficha · Asignar a… · Comentar · Copiar Nº. Ahorra abrir la ficha para lo habitual | Medio | S |
| 1.5 | **Asistente de primera vez** | Tres pasos al abrir por primera vez: conectar ATGO (extensión o favorito), activar avisos y elegir carpeta de OneDrive. Evita tener que leer el README | Medio | S |
| 1.6 | **Modo denso / cómodo** | Un interruptor en ⚙ que reduce márgenes y tamaños de letra para ver más filas en el portátil | Medio | S |
| 1.7 | **Tema claro / oscuro manual** | Hoy sigue al de Windows; añadir la opción de fijarlo | Bajo | S |
| 1.8 | **Coherencia visual** | Revisar botones y etiquetas: un único botón principal por pantalla, mismos iconos para las mismas acciones (copiar, abrir, asignar), mismos colores de estado en todas las vistas | Medio | M |
| 1.9 | **Vacíos que enseñan** | Cada lista vacía explica qué aparecerá y cómo provocarlo (ya hecho en Sin asignar), en todas las vistas | Bajo | S |

## 2. Más ágil (menos clics, más teclado)

| # | Mejora | Qué cambia | Valor | Esfuerzo |
|---|---|---|---|---|
| 2.1 | **Atajos de teclado** | `1`–`4` cambian de pestaña · `J`/`K` bajan y suben por los técnicos o tickets · `Enter` abre la ficha · `A` asigna · `C` comenta · `?` muestra la chuleta | Alto | S |
| 2.2 | **Asignar con un clic desde la recomendación** | En Sin asignar y en la ficha, botón "Asignar a ★ LGV" que guarda directamente con la confirmación mínima (o sin ella, si se activa en ⚙) | Alto | S |
| 2.3 | **Buscador con acciones sobre el ticket** | En `Ctrl+K`, tras encontrar un ticket: `→` para elegir acción (asignar, comentar, abrir en ATGO) sin abrir la ficha | Medio | M |
| 2.4 | **Filtros guardados** | Guardar combinaciones (p. ej. "Málaga + caducan hoy") como chips reutilizables | Medio | M |
| 2.5 | **Deshacer la última asignación** | Durante 30 s, un aviso con "Deshacer" que vuelve a guardar el técnico y la fecha anteriores (con la misma comprobación) | Alto | M |

## 3. Más rápida

| # | Mejora | Qué cambia | Valor | Esfuerzo |
|---|---|---|---|---|
| 3.1 | **Pintar solo lo que cambia** | Hoy cada actualización de ATGO repinta la vista entera. Actualizar solo las filas modificadas evita parpadeos y pierde menos el foco | Alto | L |
| 3.2 | **Cálculos una vez por actualización** | Conflictos, reincidencias y cargas se recalculan varias veces por pantalla. Calcularlos una vez tras cada carga y reutilizarlos | Medio | M |
| 3.3 | **Refresco adaptativo** | Cada 2 min en horario laboral, cada 10 min fuera de él y en pausa si el equipo está bloqueado: menos carga para ATGO | Medio | S |
| 3.4 | **Dividir el código** | `index.html` concentra mucha lógica. Separarla en módulos y cargar Semana y el mapa solo cuando se abren | Medio | M |
| 3.5 | **Cálculos pesados en segundo plano** | Pasar la detección de cambios y caducidades a un *worker* para que la interfaz no se note ocupada con muchos tickets | Bajo (hoy) / Alto (con muchos dispatchers) | M |

## 4. Fiabilidad

| # | Mejora | Qué cambia | Valor | Esfuerzo |
|---|---|---|---|---|
| 4.1 | **Pruebas automáticas** | Pruebas del lector de caducidad, del guardado de ATGO y de los cálculos de ruta, ejecutadas solas en GitHub en cada cambio. Evitan errores como los de las barras invertidas | Alto | M |
| 4.2 | **Diagnóstico** | Registro local de errores y un botón "Copiar diagnóstico" para enviarlo cuando algo falla | Medio | S |
| 4.3 | **Detección de cambios en ATGO** | Si Tier1 cambia su web y una consulta deja de responder como se espera, aviso claro en lugar de datos vacíos | Alto | S |
| 4.4 | **Versionado de los datos guardados** | Migraciones ordenadas de notas, plantillas, etc. al actualizar la app | Bajo | S |

## 5. Nuevas funciones (batería)

| # | Mejora | Qué aporta | Valor | Esfuerzo |
|---|---|---|---|---|
| 5.1 | **Resumen matinal** | A la hora que elijas, aviso de Windows con: sin asignar de tu zona, caducidades del día, visitas de hoy por técnico | Alto | S |
| 5.2 | **Envío de rutas a todos de una vez** | En Planificación, "Enviar rutas de mañana" abre los WhatsApp uno tras otro (como los correos) y marca cada técnico | Alto | S |
| 5.3 | **Plantillas de WhatsApp por tipo** | Mensajes distintos para ruta, cambio de última hora, recordatorio de finalizar en ATGO | Medio | S |
| 5.4 | **Exportar a Excel** | Lista de incidencias, planificación de la semana e informe semanal en `.xlsx` | Medio | S |
| 5.5 | **Histórico de indicadores** | Gráficas de 4–8 semanas: cumplimiento por técnico, caducidades vencidas, tiempos medios, reincidencias | Medio | M |
| 5.6 | **Avisos de "técnico sin actividad"** | Si a media mañana un técnico con visitas no ha iniciado ninguna, aviso discreto | Medio | S |
| 5.7 | **Distancias reales en la ruta** | Con un servicio de rutas (p. ej. OSRM, gratuito) estimar kilómetros y tiempo de desplazamiento y sumarlos a la carga | Medio | M |
| 5.8 | **Perfiles de dispatcher** | Ver `planteamiento-supervisor-y-perfiles.md` | Alto | L |

---

## Orden recomendado

1. **Rápidas y de mucho uso (1–2 días):** 2.1 atajos · 2.2 asignar con un clic · 1.2 cabecera limpia · 3.3 refresco adaptativo · 5.1 resumen matinal · 4.3 aviso si ATGO cambia.
2. **Simplificar (3–4 días):** 1.1 fusionar Mañana en Semana · 1.3 ficha con pestañas · 1.4 menú contextual · 2.5 deshacer.
3. **Solidez (2–3 días):** 4.1 pruebas automáticas · 3.2 cálculos una vez · 4.2 diagnóstico.
4. **Funciones según uso:** 5.2, 5.4, 5.5, 5.7.
