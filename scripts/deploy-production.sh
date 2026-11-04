#!/usr/bin/env bash
# Build an immutable release before changing the active UI process.
APP_DIR="$HOME/hallazgos-ui"
RELEASES_DIR="$HOME/hallazgos-ui-releases"
STATE_DIR="$HOME/.local/state/hallazgos"
UI_URL="${UI_URL:-http://127.0.0.1:3000}"
PUBLIC_UI_URL="${PUBLIC_UI_URL:-https://comportarte.com}"
PM2_NAME="ui-comp"
RELEASE=""
SWITCHED=0
PREVIOUS_VERSION=""

version_matches() {
  local base="$1" expected="$2" actual
  actual=$(curl -fsS -m 10 "$base/deployment-version.json" 2>/dev/null) || return 1
  node -e 'try { process.exit(JSON.parse(process.argv[1]).version === process.argv[2] ? 0 : 1) } catch { process.exit(1) }' "$actual" "$expected"
}

restore_previous() {
  echo "Restaurando únicamente la UI anterior..." >&2
  pm2 delete "$PM2_NAME" >/dev/null 2>&1 || true
  if node -e 'process.exit(require(process.argv[1]).apps.length ? 0 : 1)' "$RELEASE/previous-pm2.json"; then
    pm2 start "$RELEASE/previous-pm2.json" --only "$PM2_NAME" --update-env
    pm2 save
  fi
  if [ -f "$RELEASE/previous-ui-version.json" ]; then
    cp "$RELEASE/previous-ui-version.json" "$STATE_DIR/ui-version.json.tmp"
    mv "$STATE_DIR/ui-version.json.tmp" "$STATE_DIR/ui-version.json"
  fi
}

on_error() {
  local rc=$?
  trap - ERR
  echo "Falló el deploy (código $rc). Release: $RELEASE" >&2
  if [ "$SWITCHED" = 1 ]; then
    restore_previous || echo "ERROR: revisar inmediatamente pm2 logs $PM2_NAME" >&2
  else
    echo "El proceso de producción anterior sigue activo." >&2
  fi
  exit "$rc"
}

main() {
  set -Eeuo pipefail
  umask 077
  mkdir -p "$HOME/deploy-logs" "$RELEASES_DIR" "$STATE_DIR"
  local log="$HOME/deploy-logs/hallazgos-ui-$(date -u +%Y%m%d-%H%M%S).log"
  exec > >(tee -a "$log") 2>&1
  if [ "${UI_DEPLOY_LOCK_HELD:-}" != 1 ]; then
    exec 9> /tmp/hallazgos-ui-deploy.lock
    flock -w 900 9
  fi
  trap on_error ERR
  cd "$APP_DIR"
  git fetch --prune origin
  git reset --hard origin/main
  local commit expected_pnpm active version
  commit=$(git rev-parse HEAD)
  expected_pnpm=$(node -p 'require("./package.json").packageManager.split("@")[1]')
  [ "$(pnpm --version)" = "$expected_pnpm" ] || { echo "Se requiere pnpm $expected_pnpm" >&2; return 1; }

  # A push can trigger GitHub Actions while a manual deploy holds the lock.
  if [ -f "$STATE_DIR/ui-current-release" ]; then
    active=$(cat "$STATE_DIR/ui-current-release")
    if [[ "$active" == "$RELEASES_DIR/"* ]] && [ -f "$active/.release-commit" ] && [ "$(cat "$active/.release-commit")" = "$commit" ]; then
      version=$(node -p 'require(process.argv[1]).version' "$active/dist/deployment-version.json")
      if version_matches "$UI_URL" "$version" && version_matches "$PUBLIC_UI_URL" "$version"; then
        echo "El commit $commit ya está desplegado y verificado. Log: $log"
        return 0
      fi
    fi
  fi

  RELEASE="$RELEASES_DIR/$(date -u +%Y%m%d-%H%M%S)-${commit:0:12}"
  mkdir "$RELEASE"
  git archive HEAD | tar -x -C "$RELEASE"
  printf '%s\n' "$commit" > "$RELEASE/.release-commit"
  local file
  for file in .env .env.local .env.production .env.production.local; do
    if [ -f "$APP_DIR/$file" ]; then cp "$APP_DIR/$file" "$RELEASE/$file"; fi
  done
  pm2 jlist | node "$RELEASE/scripts/pm2-ui-snapshot.mjs" > "$RELEASE/previous-pm2.json"
  if grep -q '/node_modules/next/' "$RELEASE/previous-pm2.json"; then
    # This full backup must exist before the first migration is published.
    test -f "$STATE_DIR/ui-next-rollback.json"
    cp "$STATE_DIR/ui-next-rollback.json" "$RELEASE/previous-pm2.json"
  fi
  if [ -f "$STATE_DIR/ui-version.json" ]; then cp "$STATE_DIR/ui-version.json" "$RELEASE/previous-ui-version.json"; fi

  cd "$RELEASE"
  echo "Preparando $commit en $RELEASE; la UI anterior sigue activa."
  env CI=true pnpm install --frozen-lockfile
  pnpm check
  pnpm test
  pnpm build
  version=$(node -p 'require("./dist/deployment-version.json").version')

  # PM2 cannot reliably change a Next executable into a different script on reload.
  # Replace only this app after its new release has passed all build checks.
  SWITCHED=1
  if pm2 describe "$PM2_NAME" >/dev/null 2>&1; then pm2 delete "$PM2_NAME"; fi
  pm2 start "$RELEASE/ecosystem.config.js" --only "$PM2_NAME" --update-env
  local ready=0 i
  for i in $(seq 1 20); do
    if version_matches "$UI_URL" "$version" && version_matches "$PUBLIC_UI_URL" "$version"; then ready=1; break; fi
    sleep 1
  done
  [ "$ready" = 1 ] || { echo "La UI nueva no pasó la verificación local/HTTPS" >&2; return 1; }
  node scripts/publish-ui-version.mjs
  pm2 save
  printf '%s\n' "$RELEASE" > "$STATE_DIR/ui-current-release.tmp"
  mv "$STATE_DIR/ui-current-release.tmp" "$STATE_DIR/ui-current-release"
  SWITCHED=0
  echo "Deploy OK: $commit | versión $version | $PUBLIC_UI_URL | log $log"
}

main "$@"
