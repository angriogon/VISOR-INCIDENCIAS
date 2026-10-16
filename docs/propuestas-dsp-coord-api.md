# Propuestas: perfiles DSP, perfil COORD y API oficial

16/10/2026 · sobre Despacho 1.25.0. Esfuerzo: **S** = horas, **M** = 1–2 días, **L** = varios días. Valor: ★ a ★★★.

## 1. Qué hacen las herramientas del mercado

En gestión de servicios de campo (Microsoft Dynamics 365 Field Service, Praxedo, Joblogic, ServiceNow FSM, Arrivy…) se repiten estas ideas:

| Idea del mercado | Ejemplo | ¿Despacho ya lo tiene? |
|---|---|---|
| **Tablero de planificación** con arrastrar y soltar | Schedule board de Dynamics | Sí (Planificación) |
| **Cuenta atrás del SLA** en cada trabajo, con color, para reasignar *antes* de incumplir | Tablero SLA de Joblogic | A medias: hay caducidad, pero no cruzada con la fecha de visita |
| **Ver las excepciones antes de que fallen**: una bandeja de «lo que se va a romper» | Recomendación general de las guías de 2026 | A medias: Mi día lo muestra repartido en secciones |
| **Propuesta automática del día**: el sistema propone y el dispatcher revisa y aplica | Optimización de recursos (RSO) de Dynamics | Solo para un técnico y día («Rellenar el día») |
| **Habilidades y disponibilidad** del técnico al asignar | Dynamics, Arrivy | No (solo zona, carga, sede y baja) |
| **Cuadro de mando con indicadores**: citas incumplidas, trabajos que se pasan de tiempo, cumplimiento del SLA, primera visita resuelta | Cockpit de Praxedo | A medias: panel CONTROL e informe semanal |
| **Alertas automáticas** de retrasos y trabajos pasados de tiempo | Praxedo | Parcial (técnico sin actividad, sin cerrar hoy) |
| **Datos centralizados y tiempo real** (servidor, aplicación del técnico, seguimiento de su posición) | Todas | No: cada equipo lee ATGO por su cuenta |

**Conclusión:** Despacho ya cubre lo básico de un tablero de despacho. Lo que más valor aportaría es pasar de **mostrar datos** a **anticiparse**: cruzar SLA, visita y carga para decir qué va a fallar y proponer la solución, que el dispatcher acepta en un clic.

---

## 2. Perfiles DSP: trabajar más fácil, con valor diario

Ordenadas por valor/esfuerzo. Ninguna necesita la API.

1. **Bandeja «Qué hacer ahora»** ★★★ · M
   Una sola lista priorizada al abrir Mi día, ordenada por riesgo y con la acción en un clic:
   - caduca en menos de 4 h sin visita;
   - visita de hoy no iniciada 30 min después de su hora;
   - sin asignar de tu zona con más de 4 h;
   - material listo para visita;
   - comentario nuevo de un técnico;
   - ruta de mañana cambiada después de enviarla.

   Sustituye a mirar cinco secciones. Al resolver cada punto, sale de la lista.
2. **Visita después de la caducidad** ★★★ · S
   Marca en rojo «⚠ visita después de caducar» las incidencias cuya fecha de visita es posterior a su caducidad: en Incidencias, en Planificación (en la casilla) y al asignar (aviso en la confirmación). Es el incumplimiento de SLA más evitable y hoy no se detecta.
3. **Proponer el día completo del equipo** ★★★ · L
   Como la optimización de Dynamics:
   - Despacho propone para el próximo laborable la asignación de todo lo pendiente (sin asignar, sin fecha y vencidas). Tiene en cuenta la caducidad, la misma sede o población, la carga en horas, la zona y el apoyo, y las bajas y ausencias.
   - El dispatcher ve la propuesta en la semana, la retoca arrastrando y la guarda en bloque (ya de 4 en 4).
4. **Ausencias de técnicos** ★★ · M
   Vacaciones, médico o formación por fechas, en la nómina. Ese día el técnico no se recomienda, su casilla en Planificación sale tachada y se avisa si tiene visitas planificadas. Hoy solo existe «de baja», que es permanente.
5. **Habilidades por técnico** ★★ · M
   Etiquetas como balanzas, TPV, cajones de efectivo o impresoras, en la nómina. La recomendación da prioridad a quien sabe del tipo de elemento del ticket (`desTipoEle`).
6. **«Mañana listo ✓»: cierre del día** ★★ · S
   Comprobación al final del día:
   - todas las visitas de mañana tienen técnico y hora;
   - no hay conflictos;
   - las rutas están enviadas;
   - el material está listo;
   - no queda nada caducando.

   Si todo está bien, el día queda marcado como cerrado; si no, lista lo que falta.
7. **Primera visita resuelta por técnico** ★★ · M
   Con las reincidencias por equipo y las cerradas: el porcentaje de tickets resueltos en la primera visita (el mercado considera bueno un 70–80 %). Va en el informe semanal, por técnico y por tipo de elemento, para detectar formación o material que falta.
8. **Llamar o escribir a la tienda desde la visita** ★ · S
   «Confirmar visita» por correo o teléfono al contacto del ticket, con plantilla (técnico, fecha y franja), desde la ficha y desde el día de Planificación.

---

## 3. Perfil COORD: una herramienta real de coordinación

Sobre el panel CONTROL actual (cifras, pendientes, caducadas, caducan hoy, en ruta, Excel).

1. **Semáforo por DSP** ★★★ · S
   Una fila por DSP con abiertas, sin asignar, caducadas, caducan hoy, porcentaje de ruta hecha y retrasos, en verde, ámbar o rojo. Pulsar una fila filtra todo el panel. Es lo primero que necesita ver un coordinador.
2. **«Caducarán» (riesgo antes de que pase)** ★★★ · S
   Nueva lista con las que caducan en menos de 48 h y no tienen visita antes de la caducidad (visita posterior o sin fecha). Es la lista de trabajo del coordinador para pedir al DSP que actúe. Además, una cifra arriba.
3. **Antigüedad del bloque y estancadas** ★★★ · M
   - Abiertas por tramos de antigüedad (0–2 días, 3–7, 8–15 y más de 15), por DSP y por estado.
   - Lista de **estancadas**: sin movimiento en el hilo ni cambio de estado en X días, con su DSP y técnico.

   Ahí está el «bloque» que hay que desatascar.
4. **Histórico y tendencias** ★★ · M
   Una foto diaria de las cifras (abiertas, caducadas, sin asignar, cumplimiento de ruta), con gráficos de 30 días y comparación con la semana anterior. Responde a «¿vamos mejor o peor?».
5. **Indicadores de técnicos** ★★ · M
   Por técnico: visitas al día, porcentaje de ruta cumplida, retrasos, primera visita resuelta, reincidencias y duración media frente a la estimada. Ordenables y filtrables por DSP. Sirven para apoyar y dar formación, no como ranking público.
6. **Equilibrio de carga entre DSP** ★★ · M
   Técnicos saturados (más de 8 h) junto a técnicos con huecos en zonas vecinas, con una propuesta de préstamo puntual (como el apoyo de Cádiz en Ceuta). El coordinador lo comunica al DSP.
7. **Informes por cliente y proyecto** ★★ · M (pendiente)
   Abiertas, caducadas y porcentaje resuelto antes de caducar, por cliente (Carrefour, Transgourmet…) y por proyecto (`numProy`, que hay que leer de la ficha). Excel mensual para el cliente o la dirección.
8. **Informe automático diario** ★★ · S
   A la hora elegida (p. ej. 8:00 y 18:00), Despacho guarda solo el «Informe completo» en la carpeta de OneDrive que ya existe. No hay que acordarse de exportarlo.
9. **Mapa nacional** ★ · M
   Visitas de hoy y sin asignar de toda España por DSP, para ver zonas sin cobertura.
10. **Alertas al coordinador** ★ · S
    Aviso de Windows cuando un DSP supera un umbral (p. ej. más de 5 caducadas o una caduca hoy sin visita). Ya se descartó «avisos por DSP» en su día; aquí sería solo un umbral configurable.

---

## 4. Qué cambiaría de verdad con una API oficial de Tier1

### Cómo funciona hoy (y sus límites)
- Cada equipo lee ATGO **desde la pestaña del usuario**, con su sesión, usando la API interna de la web de ATGO (no documentada).
- Se pide **técnico a técnico** (6 a la vez), cada 2 minutos. Tarda **20 s en DSP1 y 65 s en COORD**. Cada usuario repite la misma carga, así que con 6 equipos se multiplican las consultas.
- Es **frágil**: depende de que la pestaña siga abierta, de la sesión, de la extensión y de que ATGO no cambie su web (de ahí «Forzar reconexión» y los avisos de versión).
- **Guardar** exige leer la ficha completa, reenviarla entera y compararla campo a campo, porque ATGO no permite cambiar un solo campo.
- Hay datos que **no tenemos o deducimos**:
  - la caducidad se lee del texto del hilo;
  - el proyecto y el elemento hay que leerlos de la ficha;
  - de las cerradas solo hay 15 días, y solo en el equipo de cada uno;
  - no hay posición del técnico.
- **No hay datos compartidos:** notas, nómina, perfiles e histórico viven en cada PC. **No hay móvil**, porque sin la pestaña de ATGO no hay datos.

### Con una API oficial y un servidor pequeño propio

| Hoy | Con API |
|---|---|
| Carga de 20–65 s por usuario cada 2 min | **Una sola sincronización central**, que solo pide lo que ha cambiado desde la última. Cada usuario recibe los cambios **en segundos** (avisos del servidor o *webhooks* de ATGO) |
| Pestaña de ATGO, extensión y «Forzar reconexión» | **Nada que mantener abierto.** Funciona en cualquier PC y **en el móvil** |
| Caducidad leída del texto | Caducidad, proyecto, elemento y tiempos reales de inicio y fin como **campos fiables** |
| Guardar = reenviar la ficha entera y comparar | **Cambiar solo el campo pedido** (técnico, fecha) con respuesta clara de error. Asignación en bloque real en una sola llamada |
| Historial de 15 días en cada PC | **Historial central completo**: indicadores reales (primera visita resuelta, SLA por cliente, tendencias), informes mensuales y auditoría |
| Notas, nómina y perfiles por equipo | **Compartidos**: el coordinador y los DSP ven lo mismo; relevos entre DSP sin perder notas |
| Token personal de cada usuario dentro de una web | **Credencial de servicio** con permisos acotados, acceso con la cuenta corporativa (Microsoft Entra ID), registro de quién hizo qué, protección de datos (RGPD) más fácil de justificar |

**Mejoras que dependen de la API:**
- La propuesta automática del día, con datos completos.
- Histórico y tendencias de verdad.
- Los indicadores de técnicos y la primera visita resuelta, fiables.
- Los informes por cliente y proyecto, sin leer ficha a ficha.
- El mapa con la posición del técnico.
- La aplicación del técnico en el móvil.
- El relevo entre DSP.

### Arquitectura propuesta
1. **Servidor pequeño** en la nube de la empresa (p. ej. Azure Functions o App Service con una base de datos). Sincroniza con la API de ATGO y guarda el histórico.
2. **API propia de Despacho** con avisos en tiempo real a la aplicación.
3. **La PWA actual se mantiene** como pantalla: cambia de dónde lee, no cómo se ve. Durante la transición puede leer de las dos fuentes.

### Qué pedir a Tier1
- **Lectura:** listado de incidencias filtrable por operario, estado y fecha de modificación, y por páginas; ficha; hilo; catálogos (estados, operarios, clientes, sedes, elementos, severidades, actuaciones).
- **Escritura:** actualizar campos sueltos (técnico, fecha y horas de visita, estado), comentar en el hilo y dar de alta tickets.
- **Avisos** (*webhooks*) de ticket nuevo, cambiado o comentado.
- **Autenticación de servicio** y límites de uso, entorno de pruebas y documentación (OpenAPI).

### Plan por fases
1. **Solicitud a Tier1** con la lista anterior y este documento.
2. **Lectura central**: el servidor sincroniza y la PWA lee de él, manteniendo la vía actual como respaldo.
3. **Escrituras** por la API (con confirmación, como hoy).
4. **Histórico, indicadores e informes** automáticos.
5. **Móvil** (`docs/propuesta-ios.md`) y, si interesa, aplicación del técnico.

**Riesgos y costes:**
- Depende de que Tier1 acepte dar la API.
- El servidor y su base de datos tienen un coste mensual bajo.
- Hace falta mantenimiento y que IT valide la protección de datos.

---

## Recomendación de orden

1. **Ya, sin API (rápidas y de mucho valor):**
   - visita después de la caducidad (DSP 2);
   - «Caducarán» y semáforo por DSP (COORD 2 y 1);
   - informe automático diario (COORD 8).
2. **Después:**
   - bandeja «Qué hacer ahora» (DSP 1);
   - ausencias (DSP 4);
   - antigüedad y estancadas (COORD 3);
   - histórico y tendencias (COORD 4).
3. **En paralelo:** solicitar la API a Tier1. Con ella llegan la propuesta automática completa, los indicadores fiables, los datos compartidos y el móvil.

Fuentes del análisis de mercado:
- [Microsoft Learn: Resource Scheduling Optimization](https://learn.microsoft.com/dynamics365/field-service/rso-overview)
- [Praxedo: seguimiento del rendimiento](https://www.praxedo.com/product-tour/track-technician-performance/)
- [Praxedo: KPIs](https://praxedo.com/our-blog/choosing-right-key-performance-indicators-field-service-management)
- [Joblogic: gestión de SLA](https://www.joblogic.com/blog/sla-management-software)
- [Joblogic: KPIs](https://www.joblogic.com/blog/field-service-kpis/)
- [Fieldcode: funciones imprescindibles 2026](https://fieldcode.com/en/field-service-daily/must-have-field-service-management-software-features-2026)
- [Arrivy](https://www.arrivy.com/?p=12954)
