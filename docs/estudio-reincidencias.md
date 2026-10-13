# Estudio: replantear la marca de reincidencias (↻)

Fecha: 13/10/2026. **Implementado en la 1.22.1** con la propuesta A, un margen de 10 días (lo eligió el usuario) y sin la marca por sede (D).

## Qué falla hoy

La marca ↻ N sale cuando una misma sede (cliente + sede) tiene 2 o más tickets en 30 días (`reincidencias()` en panel.js).
En Carrefour, Transgourmet, Bricodepot y otros centros grandes, con muchas cajas, balanzas y equipos, se abren
avisos casi a diario. Por eso la marca sale en casi todas sus incidencias y deja de avisar de nada.

## Lo que de verdad interesa detectar

1. **El mismo equipo vuelve a fallar**: una reparación que no funcionó. Esta es la reincidencia real.
2. **Una sede con un pico raro**: más tickets de lo habitual *para esa sede*, no en número absoluto.
3. **Juntar visitas**: varias abiertas en la misma sede para que vaya un solo técnico. Esto ya lo cubren el aviso 📍
   «misma sede» al asignar y la sección «Esta sede» de la ficha.

## Propuestas

**A. Reincidencia por equipo (recomendada).** La marca sale solo cuando coinciden la misma sede y el mismo elemento:
- **↻ mismo equipo**: misma sede, mismo tipo de elemento y misma referencia o número de serie, con 2 o más tickets en 15 días.
- **🔁 Reabierta**: el mismo equipo tiene un ticket nuevo en los 7 días siguientes a cerrarse otro. Va en rojo, porque es lo más grave.

Hoy Despacho solo tiene el tipo de elemento («BALANZA PC») y la referencia del cliente. Para afinar del todo
habría que leer también el código o número de serie del elemento de ATGO, un campo más en `mapTicket`
(atgo-sync.js), lo que obliga a subir `SYNC_VERSION` y a recargar la pestaña de ATGO una vez.
Sin ese campo se puede empezar con sede + tipo de elemento + referencia, aunque es menos preciso.

**B. Pico de sede (complementaria).** Cada sede se compara con su media de las últimas 8 semanas. La marca ⚡ sale
solo si esta semana tiene, por ejemplo, el doble de lo normal y al menos 3 tickets más. Un hiper con 5 avisos
semanales no salta; una tienda pequeña que pasa de 0 a 3, sí.

**C. Lista de sedes de mucho tráfico (opcional).** En ⚙ se marcan clientes o sedes donde no se quiere la marca de
sede. Solo tendría sentido si no se hace B.

**D. Quitar la marca de sede de la lista.** El número de tickets de la sede seguiría en la ficha («Esta sede»),
donde ayuda sin molestar.

## Recomendación

- Sustituir ↻ por **A**, empezando con sede + tipo + referencia.
- Añadir el número de serie si confirmas que en ATGO cada equipo lo tiene.
- Hacer **D** a la vez.
- **B** solo si después echas en falta los avisos de sede.

## Lo que necesito de ti

- ¿En ATGO cada elemento (balanza, TPV…) tiene un código o número de serie único?
- ¿Cuántos días cuentan como «ha vuelto a fallar»: 7, 15 o 30?
