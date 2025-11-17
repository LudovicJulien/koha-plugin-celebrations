#!/bin/bash

# ============================================
#   ANSI COLORS
# ============================================
RED="\e[31m"
GREEN="\e[32m"
YELLOW="\e[33m"
BLUE="\e[34m"
CYAN="\e[36m"
BOLD="\e[1m"
RESET="\e[0m"

# ============================================
#   1. Locate plugin repo directory (your Git repo)
# ============================================
SCRIPT_DIR=$(readlink -f "$(dirname "$0")")
PLUGIN_REPO_DIR=$(readlink -f "$SCRIPT_DIR/..")

echo -e "${CYAN}${BOLD}🔎 Detecting plugin repository...${RESET}"
echo -e "✔ Plugin repo: ${GREEN}$PLUGIN_REPO_DIR${RESET}"

# ============================================
#   2. Search for plugin symlink inside Koha installations
# ============================================
echo -e "${CYAN}${BOLD}🔎 Searching for plugin symlink inside Koha installations...${RESET}"

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
        # Search exactly in Koha plugin folders
        RESULT=$(find "$base" -type l -path "*/var/lib/plugins/Koha/Plugin/*" \
                 -lname "$PLUGIN_REPO_DIR/*" 2>/dev/null | head -n 1)

        if [[ -n "$RESULT" ]]; then
            PLUGIN_INSTANCE_PATH="$RESULT"
            break
        fi
    fi
done

if [[ -z "$PLUGIN_INSTANCE_PATH" ]]; then
    echo -e "${RED}${BOLD}❌ Unable to determine which Koha instance contains this plugin.${RESET}"
    exit 1
fi

echo -e "✔ Plugin symlink found: ${GREEN}$PLUGIN_INSTANCE_PATH${RESET}"

# ============================================
#   3. Deduce Koha instance directory
# ============================================
INSTANCE_DIR=$(echo "$PLUGIN_INSTANCE_PATH" \
  | sed -E 's#/var/lib/plugins/Koha/Plugin/.*##')

echo -e "${CYAN}${BOLD}🔎 Determining Koha instance directory...${RESET}"
echo -e "✔ Instance directory: ${GREEN}$INSTANCE_DIR${RESET}"

# ============================================
#   4. Locate koha-conf.xml
# ============================================
KOHA_CONF="$INSTANCE_DIR/etc/koha-conf.xml"

echo -e "${CYAN}${BOLD}🔎 Searching for koha-conf.xml...${RESET}"

if [[ ! -f "$KOHA_CONF" ]]; then
    echo -e "${RED}${BOLD}❌ koha-conf.xml not found at:${RESET} $KOHA_CONF"
    exit 1
fi

export KOHA_CONF
echo -e "✔ KOHA_CONF: ${GREEN}$KOHA_CONF${RESET}"

# ============================================
#   5. Locate Koha Core (C4/Context.pm)
# ============================================
echo -e "${CYAN}${BOLD}🔎 Detecting Koha Core directory...${RESET}"

# Extract instance name (last folder name)
INSTANCE_NAME=$(basename "$INSTANCE_DIR")

# Build Koha Core path
KOHA_CORE="/inlibro/git/koha-${INSTANCE_NAME}"

# Validate
if [[ ! -d "$KOHA_CORE" ]]; then
    echo -e "${RED}${BOLD}❌ Koha Core directory not found at:${RESET} $KOHA_CORE"
    exit 1
fi

export KOHA_CORE
echo -e "✔ KOHA_CORE: ${GREEN}$KOHA_CORE${RESET}"

# ============================================
#   6. Build PERL5LIB automatically
# ============================================
echo -e "${CYAN}${BOLD}🔧 Configuring PERL5LIB...${RESET}"

export PERL5LIB="$KOHA_CORE:$KOHA_CORE/lib:$INSTANCE_DIR/lib:$INSTANCE_DIR/var/lib/plugins:$PLUGIN_REPO_DIR/lib"

echo -e "✔ PERL5LIB configured: ${YELLOW}$PERL5LIB${RESET}"

# ============================================
#   7. Run tests
# ============================================
echo -e "${CYAN}${BOLD}🧪 Running Koha tests...${RESET}"

prove -lv t/

STATUS=$?

if [[ $STATUS -eq 0 ]]; then
    echo -e "${GREEN}${BOLD}✔ All tests passed successfully!${RESET}"
else
    echo -e "${RED}${BOLD}❌ Some tests failed. Check the output above.${RESET}"
fi

exit $STATUS
