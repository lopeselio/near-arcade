#!/usr/bin/env bash
# Hosts the arcade page as an Azure Storage static website. Idempotent.
set -euo pipefail
RG=${RG:-near-arcade}
LOC=${LOC:-northeurope}
cd "$(dirname "$0")"
az group create -n "$RG" -l "$LOC" -o none
SA=${SA:-$(az storage account list -g "$RG" --query '[0].name' -o tsv)}
if [ -z "$SA" ]; then
  SA="neararcade$(openssl rand -hex 3)"
  az storage account create -g "$RG" -n "$SA" -l "$LOC" --sku Standard_LRS --kind StorageV2 --min-tls-version TLS1_2 -o none
fi
KEY=$(az storage account keys list -g "$RG" -n "$SA" --query '[0].value' -o tsv)
az storage blob service-properties update --account-name "$SA" --account-key "$KEY" --static-website --index-document index.html --404-document index.html -o none
az storage blob upload --account-name "$SA" --account-key "$KEY" -c '$web' -f index.html -n index.html --content-type 'text/html; charset=utf-8' --content-cache-control 'no-cache' --overwrite -o none
az storage account show -g "$RG" -n "$SA" --query primaryEndpoints.web -o tsv
