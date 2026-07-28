#!/usr/bin/env bash
# Deploy Spelling Star Garden via Wrangler CLI only (no Cloudflare dashboard).
set -euo pipefail
cd "$(dirname "$0")/.."

if ! npx wrangler whoami 2>/dev/null | grep -qE 'Account|email|@'; then
  if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
    echo "Not authenticated."
    echo "  Option A (OAuth, once):  npx wrangler login"
    echo "  Option B (token, no browser after create): export CLOUDFLARE_API_TOKEN=..."
    exit 1
  fi
fi

echo "==> Dry-run (expect ~5 files under public/)"
npx wrangler deploy --dry-run --outdir /tmp/ssg-wrangler-dry-run

echo "==> Deploy"
npx wrangler deploy

echo "Done. Open the workers.dev URL Wrangler printed (iPad-safe; no laptop server)."
