#!/bin/bash
# ============================================
#   COULEURS ANSI
# ============================================
RED="\e[31m"
GREEN="\e[32m"
YELLOW="\e[33m"
BLUE="\e[34m"
CYAN="\e[36m"
BOLD="\e[1m"
RESET="\e[0m"
# ============================================
#   1. Localiser le répertoire du dépôt du plugin (votre dépôt Git)
# ============================================
SCRIPT_DIR=$(readlink -f "$(dirname "$0")")
PLUGIN_REPO_DIR=$(readlink -f "$SCRIPT_DIR/..")
echo -e "${CYAN}${BOLD}🔎 Détection du dépôt du plugin...${RESET}"
echo -e "✔ Plugin repo: ${GREEN}$PLUGIN_REPO_DIR${RESET}"
# ============================================
#   2. Rechercher le lien symbolique du plugin dans les installations Koha
# ============================================
echo -e "${CYAN}${BOLD}🔎 Recherche du lien symbolique du plugin dans les installations Koha...${RESET}"
SEARCH_DIRS=(
    /inlibro/koha
    /inlibro/Koha
    /var/lib/koha
    /usr/share/koha
    /srv/koha
)
PLUGIN_INSTANCE_PATH=""
for base in "${SEARCH_DIRS[@]}"; do
    if [[ -d "$base" ]]; then
        # Recherche exacte dans les dossiers de plugins Koha
        RESULT=$(find "$base" -type l -path "*/var/lib/plugins/Koha/Plugin/*" \
                 -lname "$PLUGIN_REPO_DIR/*" 2>/dev/null | head -n 1)
        if [[ -n "$RESULT" ]]; then
            PLUGIN_INSTANCE_PATH="$RESULT"
            break
        fi
    fi
done
if [[ -z "$PLUGIN_INSTANCE_PATH" ]]; then
    echo -e "${RED}${BOLD}❌ Impossible de déterminer quelle instance Koha contient ce plugin.${RESET}"
    exit 1
fi
echo -e "✔ Lien symbolique du plugin trouvé : ${GREEN}$PLUGIN_INSTANCE_PATH${RESET}"
# ============================================
#   3. Déduire le répertoire de l'instance Koha
# ============================================
INSTANCE_DIR=$(echo "$PLUGIN_INSTANCE_PATH" \
  | sed -E 's#/var/lib/plugins/Koha/Plugin/.*##')
echo -e "${CYAN}${BOLD}🔎 Détermination du répertoire de l'instance Koh...${RESET}"
echo -e "✔ Répertoire de l'instance: ${GREEN}$INSTANCE_DIR${RESET}"
# ============================================
#   4. Localiser koha-conf.xml
# ============================================
KOHA_CONF="$INSTANCE_DIR/etc/koha-conf.xml"
echo -e "${CYAN}${BOLD}🔎 Recherche de koha-conf.xml...${RESET}"
if [[ ! -f "$KOHA_CONF" ]]; then
    echo -e "${RED}${BOLD}❌ koha-conf.xml non trouvé à l'emplacement :${RESET} $KOHA_CONF"
    exit 1
fi
export KOHA_CONF
echo -e "✔ KOHA_CONF: ${GREEN}$KOHA_CONF${RESET}"
# ============================================
#   5. Localiser le Core de Koha (C4/Context.pm)
# ============================================
echo -e "${CYAN}${BOLD}🔎 Détection du répertoire du Core de Koha...${RESET}"
# Extraire le nom de l'instance (dernier nom de dossier)
INSTANCE_NAME=$(basename "$INSTANCE_DIR")
# Construire le chemin du Core de Koha
KOHA_CORE="/inlibro/git/koha-${INSTANCE_NAME}"
# Validation
if [[ ! -d "$KOHA_CORE" ]]; then
    echo -e "${RED}${BOLD}❌ Répertoire du Core de Koha non trouvé à l'emplacement :${RESET} $KOHA_CORE"
    exit 1
fi
export KOHA_CORE
echo -e "✔ KOHA_CORE: ${GREEN}$KOHA_CORE${RESET}"
# ============================================
#   6. Construire PERL5LIB automatiquement
# ============================================
echo -e "${CYAN}${BOLD}🔧 Configuration de PERL5LIB...${RESET}"
export PERL5LIB="$KOHA_CORE:$KOHA_CORE/lib:$INSTANCE_DIR/lib:$INSTANCE_DIR/var/lib/plugins:$PLUGIN_REPO_DIR/lib"
echo -e "✔ PERL5LIB configuré  ${YELLOW}$PERL5LIB${RESET}"
# ============================================
#   7. Lancer les tests
# ============================================
echo -e "${CYAN}${BOLD}🧪 Lancement des tests Koha...${RESET}"
prove -lv t/
STATUS=$?
if [[ $STATUS -eq 0 ]]; then
    echo -e "${GREEN}${BOLD}✔ Tous les tests ont réussi !${RESET}"
else
    echo -e "${RED}${BOLD}❌ Certains tests ont échoué. Vérifiez la sortie ci-dessus.${RESET}"
fi
exit $STATUS
