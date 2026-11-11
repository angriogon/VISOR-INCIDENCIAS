#!/bin/sh
# Genera despacho-movil.apk dentro de un contenedor (eclipse-temurin). Sin Gradle ni Android Studio: javac, d8, aapt2 y apksigner.
# Lo lanza tools/construir-app.sh. Montajes: /src (esta carpeta, solo lectura), /sdk (kit de Android, se reutiliza),
# /clave (despacho-app.p12 y su contraseña, fuera del repositorio) y /salida.
set -eu
SDK=/sdk; BT=$SDK/build-tools/34.0.0; AJ=$SDK/platforms/android-34/android.jar
if [ ! -x "$SDK/cmdline-tools/latest/bin/sdkmanager" ]; then
  echo "Descargando las herramientas de Android (solo la primera vez)..."
  cd /tmp
  NOMBRE=$(curl -fsSL https://dl.google.com/android/repository/repository2-3.xml | grep -o 'commandlinetools-linux-[0-9]*_latest.zip' | head -1)
  curl -fsSL -o ct.zip "https://dl.google.com/android/repository/$NOMBRE"
  mkdir -p "$SDK/cmdline-tools" && cd "$SDK/cmdline-tools" && jar xf /tmp/ct.zip && rm -rf latest && mv cmdline-tools latest && chmod -R +x latest/bin
fi
if [ ! -x "$BT/apksigner" ] || [ ! -f "$AJ" ]; then
  yes | "$SDK/cmdline-tools/latest/bin/sdkmanager" --sdk_root="$SDK" --licenses > /dev/null
  "$SDK/cmdline-tools/latest/bin/sdkmanager" --sdk_root="$SDK" "platforms;android-34" "build-tools;34.0.0" > /dev/null
fi
V=$(grep -o 'versionName="[^"]*"' /src/AndroidManifest.xml | cut -d'"' -f2)
T=/tmp/app; rm -rf $T; mkdir -p $T/clases $T/dex
"$BT/aapt2" compile --dir /src/res -o $T/res.zip
"$BT/aapt2" link -o $T/base.apk -I "$AJ" --manifest /src/AndroidManifest.xml -A /src/assets --min-sdk-version 29 --target-sdk-version 34 $T/res.zip
javac --release 11 -encoding UTF-8 -cp "$AJ" -d $T/clases $(find /src/java -name '*.java')
"$BT/d8" --min-api 29 --release --lib "$AJ" --output $T/dex $(find $T/clases -name '*.class')
cd $T/dex && jar uf ../base.apk classes.dex && cd $T
"$BT/zipalign" -f -p 4 base.apk alineado.apk
"$BT/apksigner" sign --ks /clave/despacho-app.p12 --ks-type PKCS12 --ks-pass file:/clave/despacho-app.pass --out /salida/despacho-movil.apk alineado.apk
"$BT/apksigner" verify --print-certs /salida/despacho-movil.apk | grep -i 'SHA-256' | head -1
echo "Generado despacho-movil.apk $V"
