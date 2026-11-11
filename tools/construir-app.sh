#!/bin/sh
# Genera la app Android «Despacho» con Docker (Docker Desktop en marcha). Uso: sh tools/construir-app.sh [carpeta de salida]
# La clave que firma la app se crea la primera vez en %USERPROFILE%\.despacho y nunca va al repositorio:
# guárdala, porque sin ella una versión nueva no se podrá instalar encima de la anterior.
set -eu
RAIZ=$(cd "$(dirname "$0")/.." && pwd)
CLAVES="$HOME/.despacho"; SALIDA="${1:-$RAIZ/../app-despacho}"
mkdir -p "$CLAVES" "$SALIDA"
if [ ! -f "$CLAVES/despacho-app.p12" ]; then
  openssl rand -hex 24 > "$CLAVES/despacho-app.pass"
  # Rutas de Windows y sin conversión: Git Bash convertiría «/CN=…» en una ruta
  W=$(cygpath -w "$CLAVES" 2> /dev/null || echo "$CLAVES")
  MSYS_NO_PATHCONV=1 openssl req -x509 -newkey rsa:3072 -sha256 -days 10950 -nodes -subj "/CN=Despacho/O=Despacho" -keyout "$W/despacho-app.key" -out "$W/despacho-app.crt" 2> /dev/null
  MSYS_NO_PATHCONV=1 openssl pkcs12 -export -inkey "$W/despacho-app.key" -in "$W/despacho-app.crt" -name despacho -passout "file:$W/despacho-app.pass" -out "$W/despacho-app.p12"
  rm -f "$CLAVES/despacho-app.key"
  echo "Clave de la app creada en $CLAVES"
fi
win() { cygpath -w "$1" 2> /dev/null || echo "$1"; }
MSYS_NO_PATHCONV=1 docker run --rm \
  -v "$(win "$RAIZ/android"):/src:ro" -v despacho-android-sdk:/sdk -v "$(win "$CLAVES"):/clave:ro" -v "$(win "$SALIDA"):/salida" \
  eclipse-temurin:17-jdk sh /src/construir.sh
