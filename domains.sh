#!/usr/bin/env bash
# Puts the arcade and every game on lopeselio.online subdomains.
#
#   ./domains.sh records   # 1. prints the DNS records to add at Namecheap (Advanced DNS)
#   ./domains.sh check     # 2. shows which records resolve yet
#   ./domains.sh bind      # 3. after DNS resolves: attaches the domains with free managed certs,
#                          #    points wallet sign-in at the new URLs, and switches the arcade's links
#
#   arcade.lopeselio.online      -> this arcade (Vercel project near-arcade)
#   sushi.lopeselio.online       -> Sushi Sabotage   (Azure Container Apps, RG sushi-sabotage)
#   bazaar.lopeselio.online      -> Bazaar of Liars  (Azure Container Apps, RG bazaar-liars)
#   parkwright.lopeselio.online  -> Parkwright       (Azure Container Apps, RG parkwright)
#   fogwater.lopeselio.online    -> Fogwater         (Azure Container Apps, RG fogwater)
#   emberfall.lopeselio.online   -> Emberfall        (Azure Container Apps, RG emberfall)
#   inside-job.lopeselio.online  -> Inside Job       (Azure Container Apps, RG inside-job)
#   kraterra.lopeselio.online    -> Kraterra         (Azure Container Apps, RG kraterra)
#   realm.lopeselio.online       -> Realm Ledger     (Vercel project realm-ledger)
#
# The root domain and www stay on the personal site; email forwarding records are untouched.
# All games share one site (lopeselio.online), so wallet sessions keep working inside the arcade's frame.
set -euo pipefail
DOMAIN=${DOMAIN:-lopeselio.online}
SCOPE=${VERCEL_SCOPE:-lopeselios-projects}
cd "$(dirname "$0")"

# sub | resource group | container app
ACA=("sushi sushi-sabotage sushi-sabotage" "bazaar bazaar-liars bazaar-liars" "parkwright parkwright parkwright" "fogwater fogwater fogwater" "emberfall emberfall emberfall" "inside-job inside-job inside-job" "kraterra kraterra kraterra")
# sub | vercel project
VERCEL=("arcade near-arcade" "realm realm-ledger")

fqdn() { az containerapp show -g "$1" -n "$2" --query properties.configuration.ingress.fqdn -o tsv; }
verify_id() { az containerapp show -g "$1" -n "$2" --query properties.customDomainVerificationId -o tsv; }
env_of() { az containerapp show -g "$1" -n "$2" --query properties.managedEnvironmentId -o tsv; }

records() {
  echo "Add these at Namecheap -> Domain List -> $DOMAIN -> Advanced DNS (TTL automatic):"
  echo
  printf "%-8s %-22s %s\n" TYPE HOST VALUE
  for row in "${ACA[@]}"; do
    read -r sub rg app <<<"$row"
    printf "%-8s %-22s %s\n" CNAME "$sub" "$(fqdn "$rg" "$app")"
    printf "%-8s %-22s %s\n" TXT "asuid.$sub" "$(verify_id "$rg" "$app")"
  done
  for row in "${VERCEL[@]}"; do
    read -r sub _ <<<"$row"
    printf "%-8s %-22s %s\n" CNAME "$sub" "cname.vercel-dns.com"
  done
}

check() {
  for row in "${ACA[@]}" "${VERCEL[@]}"; do
    read -r sub _ <<<"$row"
    printf "%-28s %s\n" "$sub.$DOMAIN" "$(dig +short CNAME "$sub.$DOMAIN" | head -1)"
  done
}

bind() {
  az extension add -n containerapp --upgrade -y -o none 2>/dev/null || true
  for row in "${ACA[@]}"; do
    read -r sub rg app <<<"$row"
    host="$sub.$DOMAIN"
    echo "== $host -> $app"
    az containerapp hostname list -g "$rg" -n "$app" --query "[?name=='$host']" -o tsv | grep -q . ||
      az containerapp hostname add -g "$rg" -n "$app" --hostname "$host" -o none
    # a free managed certificate, validated through the CNAME
    az containerapp hostname bind -g "$rg" -n "$app" --hostname "$host" --environment "$(env_of "$rg" "$app")" --validation-method CNAME -o none
  done
  for row in "${VERCEL[@]}"; do
    read -r sub project <<<"$row"
    echo "== $sub.$DOMAIN -> Vercel $project"
    vercel domains add "$sub.$DOMAIN" "$project" --scope "$SCOPE" || true
  done

  # wallet sign-in is bound to the page's host (the wallet signs "Sign in to <host>")
  echo "== wallet sign-in URLs"
  az containerapp update -g bazaar-liars -n bazaar-liars --set-env-vars "BETTER_AUTH_URL=https://bazaar.$DOMAIN" -o none
  az containerapp update -g sushi-sabotage -n sushi-sabotage --set-env-vars "BETTER_AUTH_URL=https://sushi.$DOMAIN" -o none
  az containerapp update -g fogwater -n fogwater --set-env-vars "BETTER_AUTH_URL=https://fogwater.$DOMAIN" -o none
  az containerapp update -g emberfall -n emberfall --set-env-vars "BETTER_AUTH_URL=https://emberfall.$DOMAIN" -o none
  az containerapp update -g inside-job -n inside-job --set-env-vars "BETTER_AUTH_URL=https://inside-job.$DOMAIN" -o none
  az containerapp update -g kraterra -n kraterra --set-env-vars "BETTER_AUTH_URL=https://kraterra.$DOMAIN" -o none

  # the arcade links to the subdomains from now on
  echo "== arcade links"
  sed -i.bak \
    -e "s#https://sushi-sabotage\.[a-z0-9-]*\.northeurope\.azurecontainerapps\.io/#https://sushi.$DOMAIN/#" \
    -e "s#https://bazaar-liars\.[a-z0-9-]*\.northeurope\.azurecontainerapps\.io/#https://bazaar.$DOMAIN/#" \
    -e "s#https://parkwright\.[a-z0-9-]*\.northeurope\.azurecontainerapps\.io/#https://parkwright.$DOMAIN/#" \
    -e "s#https://realm-ledger\.vercel\.app/#https://realm.$DOMAIN/#" index.html
  rm -f index.html.bak
  vercel deploy --prod --yes --scope "$SCOPE" >/dev/null
  echo
  for sub in arcade sushi bazaar parkwright realm fogwater emberfall inside-job kraterra; do
    printf "%-28s %s\n" "https://$sub.$DOMAIN/" "$(curl -s -o /dev/null -w '%{http_code}' "https://$sub.$DOMAIN/" || true)"
  done
}

case "${1:-records}" in
  records) records ;;
  check) check ;;
  bind) bind ;;
  *) echo "usage: $0 records|check|bind" >&2; exit 2 ;;
esac
