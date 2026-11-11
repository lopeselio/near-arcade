#!/usr/bin/env bash
# Builds the arcade and hosts dist/ as an Azure Storage static website. Idempotent.
# Hashed files in assets/ are cached forever; index.html (and the thumbnails) are revalidated.
# The 404 document is index.html, so /<slug> deep links load the app (with a 404 status).
set -euo pipefail
RG=${RG:-near-arcade}
LOC=${LOC:-northeurope}
cd "$(dirname "$0")"
pnpm install --frozen-lockfile
pnpm build
az group create -n "$RG" -l "$LOC" -o none
SA=${SA:-$(az storage account list -g "$RG" --query '[0].name' -o tsv)}
if [ -z "$SA" ]; then
  SA="neararcade$(openssl rand -hex 3)"
  az storage account create -g "$RG" -n "$SA" -l "$LOC" --sku Standard_LRS --kind StorageV2 --min-tls-version TLS1_2 -o none
fi
KEY=$(az storage account keys list -g "$RG" -n "$SA" --query '[0].value' -o tsv)
up() { az storage blob upload-batch --account-name "$SA" --account-key "$KEY" -d '$web' --overwrite -o none "$@"; }
az storage blob service-properties update --account-name "$SA" --account-key "$KEY" --static-website --index-document index.html --404-document index.html -o none
# assets first, so the new index.html never points at files that aren't there yet
up -s dist/assets --destination-path assets --pattern '*.js' --content-type 'text/javascript; charset=utf-8' --content-cache-control 'public, max-age=31536000, immutable'
up -s dist/assets --destination-path assets --pattern '*.css' --content-type 'text/css; charset=utf-8' --content-cache-control 'public, max-age=31536000, immutable'
# anything else Vite puts in assets/ (images, fonts): content type guessed from the extension
for f in dist/assets/*; do
  case "$f" in *.js|*.css) continue ;; esac
  az storage blob upload --account-name "$SA" --account-key "$KEY" -c '$web' -f "$f" -n "assets/$(basename "$f")" --content-cache-control 'public, max-age=31536000, immutable' --overwrite -o none
done
up -s dist/thumbs --destination-path thumbs --pattern '*.webp' --content-type image/webp --content-cache-control 'public, max-age=86400'
az storage blob upload --account-name "$SA" --account-key "$KEY" -c '$web' -f dist/index.html -n index.html --content-type 'text/html; charset=utf-8' --content-cache-control 'no-cache' --overwrite -o none
az storage account show -g "$RG" -n "$SA" --query primaryEndpoints.web -o tsv
