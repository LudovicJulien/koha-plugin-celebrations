use strict;
use warnings;
use Test::More;
use Test::Perl::Critic;
#
#   Test de qualité de code avec Perl::Critic pour s'assurer que le module respecte les bonnes pratiques
#
my $file = 'Koha/Plugin/Celebrations.pm';
unless ( -e $file ) {
    plan skip_all => "Cannot find $file to test.";
    exit;
}
plan tests => 1;
critic_ok( $file, "Perl::Critic test for $file" );
