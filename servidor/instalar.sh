#!/usr/bin/env bash
# Instala el motor de Despacho en el servidor: dependencias, servicio que arranca solo y dirección pública HTTPS
# (Tailscale Funnel en el puerto 8443; lo que ya sirve Tailscale en el 443 sigue siendo privado).
# Uso (en el servidor, con tu usuario):  bash ~/VISOR/repo/servidor/instalar.sh
# Para pararlo:  systemctl --user stop despacho-motor   ·   Quitar la dirección pública:  tailscale funnel --https=8443 off
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
PUERTO="${PUERTO:-8791}"

echo "== Dependencias"
cd "$DIR" && npm install --no-fund --no-audit --omit=dev | tail -1
ls "$HOME"/.cache/ms-playwright/chromium-*/chrome-linux64/chrome > /dev/null 2>&1 || (cd "$DIR" && npx playwright-core install chromium)

echo "== Servicio despacho-motor"
mkdir -p "$HOME/.config/systemd/user"
cat > "$HOME/.config/systemd/user/despacho-motor.service" <<EOF
[Unit]
Description=Despacho · motor del servidor (ATGO sin pantalla)
After=network-online.target

[Service]
WorkingDirectory=$DIR
Environment=PUERTO=$PUERTO
ExecStart=$(command -v node) --no-warnings $DIR/motor.mjs
Restart=always
RestartSec=20
MemoryMax=1200M

[Install]
WantedBy=default.target
EOF
systemctl --user daemon-reload
systemctl --user enable --now despacho-motor
systemctl --user restart despacho-motor
loginctl enable-linger "$USER" 2> /dev/null || true

echo "== Dirección pública (Tailscale Funnel, puerto 8443)"
# Con sudo: si Tailscale ya sirve carpetas (como en «automation»), cambiar su configuración exige root
sudo tailscale funnel --bg --https=8443 "http://127.0.0.1:$PUERTO"

sleep 3
echo
echo "Listo. En Despacho › ⚙ › Servidor pon:"
echo "  Dirección:  https://$(tailscale status --json | node -e "let t='';process.stdin.on('data',d=>t+=d).on('end',()=>console.log(JSON.parse(t).Self.DNSName.replace(/\.$/,'')))"):8443"
echo "  Clave:      $(node -e "console.log(require('$HOME/.despacho/servidor.json').clave)")"
