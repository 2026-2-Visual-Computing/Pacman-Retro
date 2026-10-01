#!/bin/bash
# Equivalente macOS de script.bat: instala las dependencias en un entorno
# virtual, levanta el backend (Flask, puerto 5000) y el frontend
# (http.server, puerto 8000) en dos ventanas de Terminal con título y abre el
# navegador.
#
# Uso:  bash script.sh
#
# Notas de macOS:
#  - Si prefieres lanzarlo con "./script.sh", ejecuta una sola vez
#    "chmod +x script.sh".
#  - Si el archivo llega marcado por Gatekeeper:
#    "xattr -d com.apple.quarantine script.sh".
#  - El intérprete habitual es "python3"; "python" puede no existir.
#  - El puerto 5000 lo ocupa el "Receptor de AirPlay" en macOS reciente: si el
#    backend no arranca por "Address already in use", desactívalo en Ajustes del
#    Sistema > General > AirDrop y Compartir > Receptor de AirPlay.
#  - Si las imágenes .webp no cargan, el servidor de http de Python puede no
#    reconocer ese tipo MIME; sirve el frontend con otro servidor estático.

set -euo pipefail

# El script puede invocarse desde cualquier directorio.
cd "$(dirname "$0")"
ROOT="$PWD"

# --- Intérprete de Python ---------------------------------------------------
PY=""
if command -v python3 >/dev/null 2>&1; then
  PY="python3"
elif command -v python >/dev/null 2>&1; then
  PY="python"
fi

if [ -z "$PY" ]; then
  echo "No se encontró Python 3. Instálalo con: brew install python"
  exit 1
fi

# --- Dependencias en un entorno virtual -------------------------------------
# El Python de Homebrew o de Apple no admite "pip install" global (PEP 668),
# por eso todo se instala en .venv (ya ignorado por git).
if [ ! -d ".venv" ]; then
  echo "Creando el entorno virtual .venv ..."
  "$PY" -m venv .venv
fi
VENV_PY="$ROOT/.venv/bin/python"
"$VENV_PY" -m pip install -r backend/requirements.txt

# --- Aviso: puerto 5000 -----------------------------------------------------
# En macOS lo ocupa el Receptor de AirPlay y Flask no podría arrancar.
if lsof -nP -iTCP:5000 -sTCP:LISTEN >/dev/null 2>&1; then
  echo ""
  echo "AVISO: el puerto 5000 ya está ocupado."
  echo "En macOS suele ser el Receptor de AirPlay:"
  echo "  Ajustes del Sistema > General > AirDrop y Compartir > Receptor de AirPlay"
  echo "Desactívalo y vuelve a ejecutar este script."
  echo ""
fi

# --- Backend y frontend en ventanas de Terminal separadas -------------------
# Equivale a "start "Backend" cmd /k ..." del script de Windows. El "read"
# final mantiene la ventana abierta cuando el servidor se detiene, como "/k".
HOLD='; echo; echo --- Servidor detenido. Enter para cerrar ---; read -r _'

# Las rutas viajan dentro de cadenas de AppleScript: sin comillas dobles ni
# comillas simples en la ruta del proyecto.
case "$ROOT" in
  *\"* | *\'*)
    echo "ERROR: la ruta del proyecto contiene comillas y Terminal no puede usarla:"
    echo "  $ROOT"
    exit 1
    ;;
esac

osascript <<EOF
tell application "Terminal"
  activate
  do script "cd '$ROOT' && '$VENV_PY' -m backend.app$HOLD"
  set custom title of front window to "Pacman :: Backend"
  do script "cd '$ROOT' && '$VENV_PY' -m http.server 8000 --directory frontend$HOLD"
  set custom title of front window to "Pacman :: Frontend"
end tell
EOF

# --- Abrir el frontend ------------------------------------------------------
sleep 2
open "http://127.0.0.1:8000"
