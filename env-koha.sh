#!/bin/bash
export KOHA_CONF=/inlibro/koha/mariocart-dev-ludovic/etc/koha-conf.xml

# Koha local source (celui où se trouve C4/Context.pm)
export KOHA_CORE=/inlibro/git/koha-mariocart-dev-ludovic

# Ajoute le core + instance + plugins
export PERL5LIB=$KOHA_CORE:$KOHA_CORE/lib:/inlibro/koha/mariocart-dev-ludovic/lib:/inlibro/koha/mariocart-dev-ludovic/var/lib/plugins:/inlibro/git/koha-plugin-celebrations/lib

# Mode verbeux pour debug
prove -lv t/
