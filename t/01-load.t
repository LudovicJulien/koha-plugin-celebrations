use strict;
use warnings;
use Test::More;
#
#   Test pour vérifier que le module principal du plugin Koha se charge correctement
#
plan tests => 1;
use_ok('Koha::Plugin::Celebrations');
diag("Successfully loaded Koha::Plugin::Celebrations");
