# Estudio: crear tickets desde Despacho

Fecha: 12/10/2026 · Versión de ATGO analizada: la publicada hoy (`app.cdf06f69.js`, pantalla `17.a48a7721.js`).
Solo se ha leído el código público de la web de ATGO. No se ha creado ningún ticket.

## Conclusión

**Sí se puede.** ATGO tiene la pantalla «Añadir ticket» (`#/mistickets/nuevoTicket`) y, al pulsar Guardar,
envía un formulario a `POST /incidencias/alta`. Despacho puede hacer lo mismo desde la pestaña de ATGO
(`atgo-sync.js`), como ya hace con los comentarios y las asignaciones:

- el token sigue sin salir de la pestaña de ATGO;
- se pide confirmación y, después, se comprueba que el ticket existe y se muestra su número;
- nunca se reintenta solo, porque un reintento podría crear el ticket dos veces.

Hace falta que tu usuario de ATGO tenga permiso para añadir tickets. Por lo que me dices, lo tiene.

## Campos del formulario de ATGO

| Campo en pantalla | Dato que se envía | ¿Obligatorio en ATGO? |
|---|---|---|
| Cliente | `codCli` (lista de clientes) | Sí |
| Sede | `codSede` / `idSede` (sedes del cliente) | Sí |
| Elemento | `codElemento` (elementos de la sede: balanza, TPV…) | Sí |
| Referencia cliente | `suReferencia` | Sí |
| Severidad | `severidad` (lista de severidades activas) | Sí |
| Actuaciones | `codAct` (tipo de actuación) | Sí |
| Localización | `localizacion` (sale del elemento) | No |
| Descripción | `descripcion` / `datosRecepcion` | No |

ATGO rellena solo el resto:

- **Estado inicial:** el primero marcado como inicial.
- **Datos de la sede:** dirección, población, provincia, CP, teléfono, correo y CIF.
- **División del cliente.**
- **Opcionales que también admite:** operario (`codOpe`), fecha de visita y fecha de garantía.

Tras crear el ticket, ATGO puede abrir una pequeña encuesta según el tipo de elemento. Es aparte y Despacho podría saltársela.

## Cómo se haría (por fases, como la fase 2 de asignar)

1. **Solo lectura.** Despacho carga las listas de ATGO (clientes, sedes, elementos, severidades y actuaciones)
   y te las enseña para comprobar que son las correctas. No escribe nada.
2. **Formulario en Despacho** con solo los campos que elijas. El resto lleva valores por defecto: por ejemplo,
   cliente fijo y la severidad o actuación habitual. Antes de enviar, verás un resumen y tendrás que confirmarlo.
3. **Primer ticket real lo creas tú**, con una sede de prueba si existe, y comprobamos juntos el resultado.
   Hasta validarlo, quedaría limitado como estuvo la asignación al principio.
   Claude no puede crear tickets en ATGO: esa prueba la haces tú.

Opcional: asignar técnico y fecha de visita al crearlo, reutilizando lo que ya existe para asignar.

## Lo que necesito de ti

- Los **campos que quieres poder rellenar** desde Despacho y cuáles quieres con un valor fijo (y cuál).
- Si siempre es el mismo **cliente** (p. ej. Carrefour) o varios.
- Si hay una **sede o cliente de prueba** para el primer ticket y cómo se anula un ticket creado por error.
- Si quieres **asignar técnico y fecha** en el mismo paso.
