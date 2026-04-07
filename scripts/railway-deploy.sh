#!/usr/bin/env bash
# Deploy Solsara to Railway from your machine (bypasses flaky GitHub UI summaries).
# Requires one-time: railway login  OR  export RAILWAY_TOKEN=...  (https://railway.app/account/tokens)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

usage() {
  cat <<'EOF'
Usage:
  ./scripts/railway-deploy.sh login
  ./scripts/railway-deploy.sh list
  ./scripts/railway-deploy.sh link <project-id> <service-name> [env]
  ./scripts/railway-deploy.sh up
  ./scripts/railway-deploy.sh redeploy
  ./scripts/railway-deploy.sh logs-build
  ./scripts/railway-deploy.sh logs-deploy

zsh: if pasting blocks that start with "#", run first:  setopt interactivecomments
     (otherwise lines like "# 1) ..." are not comments and you get "parse error near ')'".)

Examples:
  railway list
  ./scripts/railway-deploy.sh link abc123 solsara production
  ./scripts/railway-deploy.sh up
EOF
}

need_auth() {
  if railway whoami &>/dev/null; then
    return 0
  fi
  echo "Not logged in. Run in macOS Terminal (interactive):"
  echo "  cd \"$ROOT\" && railway login"
  echo "Or set RAILWAY_TOKEN from https://railway.app/account/tokens"
  exit 1
}

cmd="${1:-}"
case "$cmd" in
  login)
    exec railway login
    ;;
  list)
    need_auth
    exec railway list
    ;;
  link)
    need_auth
    project="${2:?project id}"
    service="${3:?service name or id}"
    env="${4:-production}"
    railway link -p "$project" -s "$service" -e "$env"
    echo "Linked. Try: ./scripts/railway-deploy.sh up"
    ;;
  up)
    need_auth
    if [[ ! -f .railway/config.json ]]; then
      echo "Not linked. Run: ./scripts/railway-deploy.sh link <project-id> <service-name>"
      exit 1
    fi
    echo "Uploading $ROOT and building on Railway..."
    railway up -c --detach
    echo "Build kicked off. Logs: ./scripts/railway-deploy.sh logs-build"
    ;;
  redeploy)
    need_auth
    railway redeploy -y
    ;;
  logs-build)
    need_auth
    railway logs --latest --build -n 300
    ;;
  logs-deploy)
    need_auth
    railway logs --latest --deployment -n 300
    ;;
  ""|-h|--help|help)
    usage
    ;;
  *)
    echo "Unknown command: $cmd"
    usage
    exit 1
    ;;
esac
