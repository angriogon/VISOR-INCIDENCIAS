#!/usr/bin/env bash
# Deja Claude Code siempre abierto en el servidor para el proyecto Despacho, visible en la app de Claude (Remote Control).
# Arranca solo al encender el servidor y, si Claude se cierra, vuelve a abrirse continuando la última conversación.
# Uso (en el servidor, con tu usuario):  bash ~/VISOR/repo/tools/sesion-permanente.sh  [nombre]   (por defecto «Despacho»)
# Para quitarlo:  systemctl --user disable --now claude-despacho
set -euo pipefail
NOMBRE="${1:-Despacho}"
REPO="$(cd "$(dirname "$0")/.." && pwd)"
CLAUDE="$(command -v claude || echo "$HOME/.local/bin/claude")"
[ -x "$CLAUDE" ] || { echo "No encuentro claude. Instálalo antes (tools/preparar-servidor.sh)."; exit 1; }

mkdir -p "$HOME/.local/bin" "$HOME/.config/systemd/user"

# Bucle que mantiene Claude abierto dentro de tmux
cat > "$HOME/.local/bin/claude-despacho" <<EOF
#!/usr/bin/env bash
cd "$REPO"
while true; do
  "$CLAUDE" --continue --remote-control "$NOMBRE" || "$CLAUDE" --remote-control "$NOMBRE"
  sleep 5
done
EOF
chmod +x "$HOME/.local/bin/claude-despacho"

# Servicio de usuario: abre la sesión tmux «despacho» al arrancar
cat > "$HOME/.config/systemd/user/claude-despacho.service" <<EOF
[Unit]
Description=Claude Code siempre abierto: $NOMBRE
After=network-online.target

[Service]
Type=forking
Environment=PATH=$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin
ExecStart=/usr/bin/tmux new-session -d -s despacho $HOME/.local/bin/claude-despacho
ExecStop=/usr/bin/tmux kill-session -t despacho
RemainAfterExit=yes

[Install]
WantedBy=default.target
EOF

# La sesión abierta a mano se sustituye por la del servicio (la conversación continúa)
tmux kill-session -t despacho 2> /dev/null || true

# Que el servicio arranque al encender, aunque nadie haya entrado al servidor
sudo loginctl enable-linger "$USER"
systemctl --user daemon-reload
systemctl --user enable --now claude-despacho

sleep 3
if tmux has-session -t despacho 2> /dev/null; then
  echo "Hecho: «$NOMBRE» queda siempre abierta. Aparecerá en la app de Claude → Code en unos segundos."
  echo "Para verla en la terminal: tmux attach -t despacho   (salir sin cerrar: Ctrl+B y luego D)"
else
  echo "El servicio no ha arrancado. Revisa:  systemctl --user status claude-despacho"
fi
