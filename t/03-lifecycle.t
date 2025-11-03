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
plan tests => 3;
my $plugin = Koha::Plugin::Celebrations->new();
my $mock_sth = Test::MockObject->new();
$mock_sth->mock('execute', sub {
    my ( $self, $class_name ) = @_;
    is($class_name, 'Koha::Plugin::Celebrations', 'uninstall: execute called with the correct plugin class name');
    return 1;
});
$mock_sth->mock('finish', sub { return 1; });
my $mock_dbh = Test::MockObject->new();
$mock_dbh->mock('prepare', sub {
    my ( $self, $sql ) = @_;
    like($sql, qr/DELETE FROM plugin_data WHERE plugin_class = \?/, 'uninstall: prepare called with the correct SQL query');
    return $mock_sth;
});
my $context_mock = Test::MockModule->new('C4::Context');
$context_mock->redefine('dbh', sub { return $mock_dbh; });
my $result = $plugin->uninstall();
is($result, 1, 'uninstall: method returns success on completion');
done_testing();
