use strict;
use warnings;
use Test::More;
use Test::MockModule;
use Test::MockObject;
use Koha::Plugin::Celebrations;
#
#  Ce test vérifie le bon fonctionnement de la méthode uninstall du plugin Koha::Plugin::Celebrations.
#  Il s’assure que la requête SQL de suppression des données du plugin est correctement préparée et exécutée
#  (DELETE FROM plugin_data WHERE plugin_class = ?) et que la méthode retourne bien un indicateur de succès (1)
#  lorsque la désinstallation se déroule sans erreur.
#
plan tests => 5;
my $plugin = Koha::Plugin::Celebrations->new();
# Mock du statement handle
my $mock_sth = Test::MockObject->new();
$mock_sth->mock('execute', sub {
    my ($self, $class_name) = @_;
    is($class_name, 'Koha::Plugin::Celebrations', 'uninstall: execute() called with correct class');
    return 1;
});
$mock_sth->mock('finish', sub { return 1 });
# Mock du DBH
my $mock_dbh = Test::MockObject->new();
$mock_dbh->mock('prepare', sub {
    my ($self, $sql) = @_;
    like($sql, qr/DELETE FROM plugin_data WHERE plugin_class = \?/, 'uninstall: correct SQL');
    return $mock_sth;
});
# Mock de C4::Context
my $context_mock = Test::MockModule->new('C4::Context');
$context_mock->redefine('dbh', sub { return $mock_dbh });
# Test principal
my $result = $plugin->uninstall();
is($result, 1, 'uninstall: returns success');
# Vérifier que finish() a bien été appelé
ok($mock_sth->called('finish'), 'uninstall: finish() was called');
# Vérifier le nom de classe
is(
    ref($plugin),
    'Koha::Plugin::Celebrations',
    'Plugin class name is correct'
);
done_testing();