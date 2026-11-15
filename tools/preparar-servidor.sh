#!/usr/bin/env bash
# Prepara un servidor Ubuntu para trabajar en Despacho con Claude Code sin depender del PC.
# Uso (en el servidor, con tu usuario normal, no como root):  bash preparar-servidor.sh
# Instala: git, Node.js, GitHub CLI, Docker, tmux, Claude Code y el navegador de los simuladores.
# No toca las claves: se copian aparte desde el PC (ver docs/servidor-ubuntu.md).
set -euo pipefail
DESTINO="${DESTINO:-$HOME/VISOR/repo}"

echo "== Paquetes del sistema"
sudo apt-get update
sudo apt-get install -y git nodejs npm gh docker.io tmux curl ca-certificates

echo "== Docker sin sudo para $USER (hace falta cerrar sesión y volver a entrar)"
sudo usermod -aG docker "$USER"
sudo systemctl enable --now docker

echo "== Claude Code"
command -v claude > /dev/null || curl -fsSL https://claude.ai/install.sh | bash

echo "== Repositorio"
if [ ! -d "$DESTINO/.git" ]; then
  mkdir -p "$(dirname "$DESTINO")"
  git clone https://github.com/angriogon/VISOR-INCIDENCIAS.git "$DESTINO"
fi

echo "== Simuladores (Chromium de Playwright)"
cd "$DESTINO/tools/simuladores"
npm install --no-fund --no-audit
npx playwright install --with-deps chromium

echo "== Carpeta de claves"
mkdir -p "$HOME/.despacho" && chmod 700 "$HOME/.despacho"

echo
echo "Hecho. Siguientes pasos (docs/servidor-ubuntu.md):"
echo "  1. gh auth login   y después   gh auth setup-git"
echo "  2. Copiar las claves desde el PC a ~/.despacho"
echo "  3. Cerrar sesión, volver a entrar y comprobar:  docker run --rm hello-world"
echo "  4. tmux new -s despacho   →   cd $DESTINO   →   claude"
