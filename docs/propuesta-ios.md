# Propuesta: Despacho en el móvil (iPhone)

Propuesta para estudiar antes de implementar. Resume qué se puede hacer, el obstáculo principal y tres caminos posibles con su esfuerzo.

## Qué se puede reutilizar
- La misma aplicación de GitHub Pages se abre en Safari y se puede **"Añadir a pantalla de inicio"**: queda como una app, a pantalla completa y con icono.
- Desde iOS 16.4, las web apps añadidas a la pantalla de inicio **pueden recibir notificaciones**, aunque necesitan un servidor de avisos (ver más abajo).
- La interfaz se adapta al ancho del móvil; habría que diseñar una vista específica, más sencilla.

## El obstáculo: de dónde salen los datos en el móvil
En Windows, Despacho lee ATGO a través de **una pestaña de ATGO abierta en el mismo navegador** (favorito o extensión), que le pasa los datos. En el iPhone esto **no funciona bien**:
- Safari **congela las pestañas en segundo plano**: la sincronización se para en cuanto cambias de app o bloqueas el móvil.
- No hay extensiones que arranquen la sincronización solas, y el favorito es incómodo de usar en el móvil.
- ATGO no permite que otra web lea sus datos directamente (CORS).

Por eso el móvil necesita **otra forma de recibir los datos**.

## Tres caminos

### A. El PC como fuente y un relevo cifrado (recomendado para empezar)
- Despacho en el PC, que ya está sincronizado, sube cada 2 minutos una **foto cifrada** de los datos (incidencias, sin asignar, ruta de hoy, caducidades) a un pequeño servidor de relevo (por ejemplo, Cloudflare Workers o una Azure Function).
- El móvil descarga esa foto y la **descifra con una contraseña que solo conocéis tú y tus equipos**. Se cifra en el propio navegador (WebCrypto, AES), así que el servidor **nunca ve los datos en claro**.
- Las **acciones del móvil** (asignar, comentar) se dejan en una cola cifrada; el PC las recoge y las ejecuta en ATGO con su sesión, con la misma confirmación y comprobación de siempre, y devuelve el resultado.
- El mismo servidor envía las **notificaciones push** al iPhone.
- **Limitación:** el PC tiene que estar encendido con Despacho y ATGO abiertos. Si no, el móvil muestra la última foto con su hora.
- **Requiere:** visto bueno de la empresa para usar un servicio externo (aunque solo vea datos cifrados). El coste del servicio es nulo o muy bajo con este volumen.

### B. API oficial de Tier1 (la solución ideal)
- Pedir a Tier1 una API documentada, con acceso autorizado y CORS permitido para la app. El móvil (y el PC) hablarían directamente con ATGO, sin pestañas ni relevos.
- **Ventajas:** funciona sin el PC, es estable ante cambios de la web de ATGO y es la vía "oficial" para la empresa.
- **Limitación:** depende de Tier1 y de los plazos de la empresa.

### C. Solo consulta, sin servidor
- El móvil abre ATGO en Safari, ejecuta el favorito y ve Despacho **solo mientras ambas pestañas estén abiertas en primer plano**.
- **Ventaja:** no requiere nada nuevo.
- **Limitación:** muy incómodo, sin notificaciones y se corta constantemente. Solo útil como prueba.

## Qué tendría la app del móvil
Pensada para **consultar y actuar rápido**, no para planificar la semana (arrastrar y soltar en pantalla táctil es incómodo):
1. **Hoy**: progreso del día por técnico, retrasos, novedades importantes.
2. **Sin asignar**: lista de tu zona con el técnico recomendado y "Asignar" de un toque.
3. **Buscar**: por Nº, sede o técnico → ficha con motivo, último comentario, caducidad, llamar al técnico, WhatsApp, comentar en el hilo.
4. **Avisos**: escalados, sin asignar nuevos, caducidades, comentarios de técnicos.
5. **Rutas**: la de cada técnico en Google Maps (abre la app de Mapas).

## Fases propuestas (camino A)
1. **Vista móvil de la app** (2 días): diseño adaptado de Hoy, Sin asignar, Buscar y Ficha, usando los datos guardados en el propio dispositivo (para probar la experiencia).
2. **Relevo cifrado de solo lectura** (2–3 días): el PC sube la foto cifrada; el móvil la lee. Contraseña de equipo y caducidad de la foto.
3. **Notificaciones push** (1–2 días): servidor de avisos y suscripción del iPhone.
4. **Acciones desde el móvil** (2–3 días): cola cifrada de asignar y comentar que ejecuta el PC, con confirmación del resultado en el móvil.
5. Si llega la **API oficial** (camino B), sustituir el relevo por llamadas directas y mantener la misma interfaz.

## Decisiones antes de empezar
- ¿Se permite un servicio externo para el relevo y las notificaciones? (Solo vería datos cifrados).
- ¿Se puede pedir a Tier1 una API oficial?
- ¿Basta con consultar desde el móvil, o hacen falta también acciones?
- ¿Quién más lo usaría? (Si entran varios dispatchers, conviene hacerlo a la vez que los perfiles).
