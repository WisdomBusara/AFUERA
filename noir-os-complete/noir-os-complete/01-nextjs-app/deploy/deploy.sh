#!/usr/bin/env bash
#
# Afuera redeploy — pull latest, install, build, restart. Safe to re-run.
#
#   ./deploy/deploy.sh            # pull + build + restart
#   ./deploy/deploy.sh --seed     # also push schema + seed the demo workspace after build
#
# Override defaults with env vars, e.g.  AFUERA_DIR=/srv/afuera PORT=3020 ./deploy/deploy.sh
set -euo pipefail

APP_DIR="${AFUERA_DIR:-/opt/afuera-app}"   # symlink to the nested Next app; see deploy/TUNNEL.md
BRANCH="${AFUERA_BRANCH:-main}"
SERVICE="${AFUERA_SERVICE:-afuera}"
PORT="${PORT:-3011}"
BUILD_MEM="${AFUERA_BUILD_MEM:-1536}"      # Next build memory cap (MB); this box has OOM history

cd "$APP_DIR"
echo "==> Afuera deploy in $APP_DIR (branch $BRANCH)"

if [ ! -f .env.production ]; then
  echo "!! .env.production missing — copy deploy/.env.production.example and fill it in." >&2
  exit 1
fi

echo "==> Fetching origin/$BRANCH"
git fetch --prune origin "$BRANCH"
# Match remote exactly. node_modules, .next and .env.production are untracked, so preserved.
git reset --hard "origin/$BRANCH"

echo "==> npm ci"
npm ci

echo "==> Building (NODE_OPTIONS=--max-old-space-size=$BUILD_MEM)"
NODE_OPTIONS="--max-old-space-size=$BUILD_MEM" npm run build

if [ "${1:-}" = "--seed" ]; then
  echo "==> Syncing schema + seeding"
  npm run db:push
  npm run db:seed
fi

echo "==> Restarting $SERVICE"
sudo systemctl restart "$SERVICE"

echo "==> Health check on 127.0.0.1:$PORT"
for _ in $(seq 1 20); do
  if curl -fsS "http://127.0.0.1:$PORT" >/dev/null 2>&1; then
    echo "==> Afuera is up."
    exit 0
  fi
  sleep 1
done

echo "!! No response on :$PORT. Check logs:  sudo journalctl -u $SERVICE -n 50 --no-pager" >&2
exit 1
