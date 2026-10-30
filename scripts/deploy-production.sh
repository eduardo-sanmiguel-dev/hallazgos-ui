#!/usr/bin/env bash
# Deploy de hallazgos-ui
#
# Todo vive dentro de funciones y main se llama en la última línea:
# bash termina de leer el archivo antes de ejecutar, así que si `git`
# actualiza este mismo script a mitad del deploy no se rompe la ejecución.

APP_DIR="$HOME/hallazgos-ui"
PM2_NAME="ui-comp"
UI_URL="${UI_URL:-http://localhost:${PORT:-3000}/}"
LOG_DIR="$HOME/deploy-logs"
LOG_FILE="$LOG_DIR/hallazgos-ui-$(date +%Y%m%d-%H%M%S).log"
LOCK_FILE="/tmp/hallazgos-ui-deploy.lock"

declare -a NOMBRES=()
declare -a TIEMPOS=()
PASO="inicio"
COMMIT_ANTES=""
COMMIT_DESPUES=""
# anterior | detenida | nueva | revertida
ESTADO="anterior"

medir() {
  local nombre="$1"; shift
  PASO="$nombre"
  echo
  echo "▶ $nombre"
  local inicio=$SECONDS
  "$@"
  NOMBRES+=("$nombre")
  TIEMPOS+=("$((SECONDS - inicio))")
}

al_fallar() {
  local rc=$?
  # Si falla un comando dentro de $(...), el subshell también hereda el
  # trap; solo el shell principal imprime el mensaje (evita duplicados).
  if [ "$BASHPID" != "$$" ]; then
    return 0
  fi
  echo
  echo "✗ Falló el paso \"$PASO\" (código $rc). Log completo: $LOG_FILE"
  case "$ESTADO" in
    anterior)  echo "hallazgos-ui sigue corriendo con la versión anterior." ;;
    revertida) echo "Se restauró y reinició el build anterior. Corrige el error y vuelve a ejecutar." ;;
    nueva)     echo "hallazgos-ui corre la versión nueva pero no pasó la verificación. Revisa: pm2 logs $PM2_NAME" ;;
    detenida)  echo "!! hallazgos-ui quedó DETENIDA. Revisa el error y vuelve a ejecutar el script." ;;
  esac
} >&2

# Clave estable para Server Actions (solo legible por el usuario).
preparar_clave() {
  if [ ! -f .server_actions_key ]; then
    (umask 077; openssl rand -base64 32 > .server_actions_key)
  fi
  export NEXT_SERVER_ACTIONS_ENCRYPTION_KEY
  NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=$(cat .server_actions_key)
}

# fetch + reset en vez de pull: nunca se queda en un merge a medias
# y el servidor queda exactamente igual al remoto.
actualizar_codigo() {
  git fetch --prune origin
  COMMIT_ANTES=$(git rev-parse HEAD)
  git reset --hard '@{u}'
  COMMIT_DESPUES=$(git rev-parse HEAD)
  echo "Commit: ${COMMIT_ANTES:0:7} → ${COMMIT_DESPUES:0:7}"
  git log --oneline "$COMMIT_ANTES..$COMMIT_DESPUES" | head -20 || true
}

# Avisa si se commiteó package.json sin pnpm-lock.yaml.
revisar_lockfile() {
  local cambios
  cambios=$(git diff --name-only "$COMMIT_ANTES" "$COMMIT_DESPUES")
  if grep -qx 'package.json' <<<"$cambios" && ! grep -qx 'pnpm-lock.yaml' <<<"$cambios"; then
    echo "⚠ package.json cambió pero pnpm-lock.yaml no. ¿Se quedó sin commitear el lockfile?" >&2
  else
    echo "Lockfile OK"
  fi
}

# El pnpm que corre aquí debe ser el mismo de "packageManager" en
# package.json. Si no, puede no saber leer el lockfile que generó
# desarrollo (ERR_PNPM_BROKEN_LOCKFILE).
verificar_versiones() {
  local esperado actual
  esperado=$(node -p '((require("./package.json").packageManager || "").split("@")[1] || "").split("+")[0]')
  if ! actual=$(pnpm --version 2>&1); then
    echo "pnpm no pudo ejecutarse:" >&2
    echo "$actual" | tail -15 >&2
    echo "Ejecutable usado: $(command -v pnpm || echo 'no encontrado')" >&2
    return 1
  fi
  echo "node $(node --version) | pnpm $actual ($(command -v pnpm))"
  if [ -z "$esperado" ]; then
    echo "⚠ package.json no define packageManager; no se puede comparar la versión de pnpm." >&2
    return 0
  fi
  if [ "$actual" != "$esperado" ]; then
    echo "pnpm $actual no coincide con packageManager ($esperado)." >&2
    echo "Alinea el servidor: sudo npm install -g pnpm@$esperado" >&2
    echo "Instalaciones de pnpm encontradas:" >&2
    which -a pnpm >&2 || true
    return 1
  fi
}

instalar() {
  # CI=true: pnpm no se queda esperando confirmación (sin TTY aborta)
  # cuando decide que tiene que reconstruir node_modules.
  # Solo se reintenta en fallas transitorias (red); un lockfile roto o
  # desactualizado falla igual cada vez, así que se corta de inmediato.
  local salida n
  salida=$(mktemp)
  for n in 1 2 3; do
    if env CI=true pnpm install --frozen-lockfile 2>&1 | tee "$salida"; then
      rm -f "$salida"
      return 0
    fi
    if grep -qE 'ERR_PNPM_(BROKEN|OUTDATED)_LOCKFILE|ERR_PNPM_LOCKFILE' "$salida"; then
      echo "Error del lockfile: no tiene caso reintentar." >&2
      rm -f "$salida"
      return 1
    fi
    echo "Intento $n/3 falló." >&2
    if [ "$n" -lt 3 ]; then
      sleep 5
    fi
  done
  rm -f "$salida"
  return 1
}

detener() {
  pm2 stop "$PM2_NAME"
  ESTADO="detenida"
}

# Aparta el build actual en .next.prev para poder regresar a él.
# La caché se queda en .next para que el build nuevo siga siendo rápido.
respaldar_build() {
  rm -rf .next.prev
  if [ -d .next ]; then
    mv .next .next.prev
    mkdir -p .next
    if [ -d .next.prev/cache ]; then
      mv .next.prev/cache .next/cache
    fi
  fi
}

# Vuelve al build anterior y lo arranca.
restaurar_build() {
  if [ ! -d .next.prev ]; then
    echo "No hay build anterior para restaurar." >&2
    return 0
  fi
  echo "Restaurando el build anterior..." >&2
  if [ -d .next/cache ]; then
    rm -rf .next.prev/cache
    mv .next/cache .next.prev/cache
  fi
  rm -rf .next
  mv .next.prev .next
  if pm2 restart "$PM2_NAME" --update-env; then
    ESTADO="revertida"
  else
    ESTADO="detenida"
  fi
}

# next build reescribe .next, por eso la app está detenida en este paso.
construir() {
  respaldar_build
  if ! pnpm build; then
    restaurar_build
    return 1
  fi
}

arrancar() {
  pm2 restart "$PM2_NAME" --update-env
  ESTADO="nueva"
}

esperar_app() {
  local _
  for _ in $(seq 1 30); do
    if curl -fsS -m 5 -o /dev/null "$UI_URL"; then
      echo "hallazgos-ui responde en $UI_URL"
      return 0
    fi
    sleep 2
  done
  echo "hallazgos-ui no respondió en $UI_URL tras 60 s. Últimos logs:" >&2
  pm2 logs "$PM2_NAME" --lines 40 --nostream >&2 || true
  return 1
}

# Si la versión nueva no responde, regresa al build anterior.
verificar_app() {
  if esperar_app; then
    rm -rf .next.prev
    return 0
  fi
  restaurar_build
  return 1
}

resumen() {
  echo
  echo "-----------------------------------"
  echo "Resumen de tiempos:"
  local i total=0
  for i in "${!NOMBRES[@]}"; do
    echo "${NOMBRES[$i]}: ${TIEMPOS[$i]} s"
    total=$((total + TIEMPOS[i]))
  done
  echo "-----------------------------------"
  echo "Tiempo total: $total s"
  echo "Desplegado: $(git log -1 --format='%h %s')"
  echo "Log: $LOG_FILE"
}

main() {
  set -Eeuo pipefail

  mkdir -p "$LOG_DIR"
  exec > >(tee -a "$LOG_FILE") 2>&1

  # Evita dos deploys simultáneos.
  exec 9> "$LOCK_FILE"
  if ! flock -n 9; then
    echo "Ya hay un deploy en curso." >&2
    exit 1
  fi

  # Sin preguntas interactivas de corepack si llegara a usarse.
  export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

  trap al_fallar ERR

  cd "$APP_DIR"
  preparar_clave

  medir "actualizar código"       actualizar_codigo
  medir "verificar versiones"     verificar_versiones
  medir "revisar lockfile"        revisar_lockfile
  medir "pnpm install"            instalar
  # Antes de detener la app: si falta algo, producción sigue arriba.
  medir "verificar dependencias"  pnpm check-deps
  medir "pm2 stop"                detener
  medir "pnpm build"              construir
  medir "pm2 restart"             arrancar
  medir "verificar app"           verificar_app
  # Compatible con la versión previa mientras se despliega esta funcionalidad.
  if [ -f scripts/publish-ui-version.mjs ]; then
    medir "publicar versión UI"    node scripts/publish-ui-version.mjs
  fi

  resumen
}

main "$@"; exit
