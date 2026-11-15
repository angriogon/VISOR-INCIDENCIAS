# Despacho en el servidor Ubuntu

Para trabajar en Despacho con Claude Code desde el móvil sin dejar el PC encendido: el proyecto, las claves y Claude Code pasan al servidor y se usan desde fuera de casa a través de Tailscale.

Lo que **no** cambia: la PWA sigue en GitHub Pages, Despacho móvil sigue cargando desde ATGO en el propio móvil, y el servidor **nunca** entra en ATGO ni guarda tu acceso.

## 1. Tailscale (acceso desde fuera sin abrir puertos)

En el servidor:

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh
```

Abre el enlace que aparece e inicia sesión. Instala también la app de Tailscale en el móvil y en el PC con la **misma cuenta**. El servidor aparecerá con un nombre (por ejemplo `servidor`) al que se llega desde cualquiera de los dos.

## 2. Preparar el servidor

Copia `tools/preparar-servidor.sh` al servidor (o clona el repositorio) y ejecútalo con tu usuario:

```bash
bash preparar-servidor.sh
```

Después:

```bash
gh auth login
```

```bash
gh auth setup-git
```

Cierra la sesión del servidor, vuelve a entrar y comprueba Docker:

```bash
docker run --rm hello-world
```

## 3. Copiar las claves desde el PC

En PowerShell del PC (cambia `usuario@servidor` por los tuyos):

```powershell
scp C:\Users\tl020\.despacho\* usuario@servidor:~/.despacho/
```

En el servidor, que solo tu usuario pueda leerlas:

```bash
chmod 600 ~/.despacho/*
```

Son la clave que firma `movil.js` y `atgo-sync.js` y la que firma la app Android. **No van nunca al repositorio.** Guarda también una copia fuera del servidor (por ejemplo, en un USB).

## 4. Comprobar que todo funciona

```bash
cd ~/VISOR/repo && node tests/pruebas.js
```

```bash
cd ~/VISOR/repo/tools/simuladores && node asig.mjs 384 light
```

## 5. Usarlo desde el móvil

Claude Code tiene que seguir funcionando aunque cierres la conexión, por eso se abre dentro de `tmux`:

```bash
tmux new -s despacho
```

```bash
cd ~/VISOR/repo && claude
```

Dentro de Claude, activa Remote Control con `/remote-control`. La sesión aparece en la app de Claude del móvil y en claude.ai/code. Para salir de tmux sin cerrar nada: `Ctrl+B` y luego `D`. Para volver: `tmux attach -t despacho`.

## Dónde está cada cosa

| Qué | Dónde |
|---|---|
| Fuente de Despacho móvil | `tools/movil/plantilla.js` → `node tools/movil/generar.js` → `node tools/firmar-sync.mjs` |
| Favorito de Despacho móvil | `tools/movil/favorito.txt` |
| Simuladores (ATGO simulado) | `tools/simuladores/` (`asig.mjs`, `act.mjs`, `app.mjs`) |
| App Android | `bash tools/construir-app.sh` → `../app-despacho/despacho-movil.apk` |
| Claves | `~/.despacho/` |
