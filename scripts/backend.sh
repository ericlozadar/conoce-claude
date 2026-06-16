#!/usr/bin/env bash
# Maneja el backend de "Conoce a Claude" — el proceso Node que ejecuta Claude
# (vía el CLI) para que las demos del sitio respondan en vivo.
#
#   ./scripts/backend.sh start    enciende el backend (y espera a que responda)
#   ./scripts/backend.sh stop     lo apaga
#   ./scripts/backend.sh status   dice si está encendido o apagado
#
# Atajos equivalentes: npm run server:start | server:stop | server:status
set -uo pipefail
cd "$(dirname "$0")/.."
PORT="${PORT:-8787}"
HEALTH="http://localhost:${PORT}/api/health"

is_up() { curl -s --max-time 3 "$HEALTH" >/dev/null 2>&1; }

case "${1:-status}" in
  start)
    if is_up; then
      echo "✓ El backend ya estaba ENCENDIDO (puerto ${PORT}). Nada que hacer."
      exit 0
    fi
    echo "Encendiendo el backend…"
    # setsid + disown: queda corriendo aunque cierres esta terminal/sesión.
    setsid bash -c "npm run server > server.log 2>&1" < /dev/null & disown
    for _ in $(seq 1 15); do
      if is_up; then
        echo "✓ Backend ENCENDIDO (puerto ${PORT}). Las demos ya responden."
        exit 0
      fi
      sleep 1
    done
    echo "✗ No respondió a tiempo. Revisa el log:  tail -n 30 server.log"
    exit 1
    ;;
  stop)
    # El patrón "tsx server/index.ts" identifica al proceso del backend; este
    # script NO contiene ese texto en su línea de comando, así que no se mata
    # a sí mismo.
    if pkill -f "tsx server/index.ts"; then
      echo "✓ Backend APAGADO."
    else
      echo "○ No había backend corriendo."
    fi
    ;;
  status)
    if is_up; then
      echo "✓ Backend ENCENDIDO (puerto ${PORT})."
    else
      echo "○ Backend apagado. Enciéndelo con:  npm run server:start"
    fi
    ;;
  *)
    echo "Uso: $0 {start|stop|status}"
    exit 1
    ;;
esac
