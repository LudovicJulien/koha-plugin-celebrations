package Koha::Plugin::Celebrations;

use Modern::Perl;
use base qw(Koha::Plugins::Base);
use CGI;
use JSON;
use C4::Context;
# Importation des modules du plugin
use FindBin;
use lib "$FindBin::Bin";
use Koha::Plugin::Celebrations::Lib::Config;
use Koha::Plugin::Celebrations::Lib::ThemeManager;
use Koha::Plugin::Celebrations::Lib::AssetHandler;
use Koha::Plugin::Celebrations::Lib::TemplateBuilder;
use Koha::Plugin::Celebrations::Lib::I18n;

=head1 NAME

Koha::Plugin::Celebrations - Plugin Koha permettant d'appliquer des thèmes saisonniers à l'OPAC.

=head1 DESCRIPTION

Ce plugin applique automatiquement des thèmes saisonniers dans l'OPAC selon
les dates que vous configurez. Il permet :


- Gestion de plusieurs thèmes (dates de début/fin)
- Prévisualisation en direct avant activation
- Gestion des fichiers CSS/JS/images propres à chaque thème
- Interface d'administration simple

=cut

=head1 METADATA

Métadonnées officielles du plugin Koha (nécessaires pour l'administration Koha).

=cut

our $metadata = {
    name            => 'Celebrations',
    author          => 'Ludovic Julien',
    description     => 'Un OPAC pour chaque saison.',
    date_authored   => '2025-09-09',
    date_updated    => '2025-11-18',
    version         => '0.9.4',
    minimum_version => '24.05',
};

=head1 METHODS

=head2 new

Constructeur principal.
Initialise les gestionnaires internes (config, thèmes, assets, templates, i18n).

=cut

sub new {
    my ($class, $args) = @_;
    $args->{metadata} = $metadata;
    my $self = $class->SUPER::new($args);
    $self->{config} = Koha::Plugin::Celebrations::Lib::Config->new($self);
    $self->{theme_manager} = Koha::Plugin::Celebrations::Lib::ThemeManager->new($self);
    $self->{asset_handler} = Koha::Plugin::Celebrations::Lib::AssetHandler->new($self);
    $self->{template_builder} = Koha::Plugin::Celebrations::Lib::TemplateBuilder->new($self);
    $self->{i18n} = Koha::Plugin::Celebrations::Lib::I18n->new($self);
    return $self;
}

=head2 api_namespace

Retourne le namespace des routes API du plugin.

=cut

sub api_namespace {
    my ($self) = @_;
    return 'Celebrations-api';
}

=head2 static_routes

Déclare les ressources statiques du plugin (CSS/JS/images).

=cut

sub static_routes {
    my $self = shift;
    return $self->{asset_handler}->get_static_routes();
}

=head2 opac_head

Injecte les ressources CSS dans l'en-tête OPAC.

=cut

sub opac_head {
    my ($self) = @_;
    return $self->{asset_handler}->get_opac_head();
}

=head2 API ROUTES

Méthodes exposées via l'API du plugin.

=cut

sub opac_js {
    my ($self) = @_;
    return $self->{asset_handler}->get_opac_js();
}

=head2 apply_theme

Applique un thème saisonnier actif à l'OPAC.

=cut

sub apply_theme {
    my ($self) = @_;
    return $self->{theme_manager}->apply_theme();
}

=head2 update_theme

Met à jour un thème existant.

=cut

sub update_theme {
    my ($self) = @_;
    return $self->{theme_manager}->update_theme();
}

=head2 delete_theme

Supprime un thème.

=cut

sub delete_theme {
    my ($self) = @_;
    return $self->{theme_manager}->delete_theme();
}

=head2 list_themes

Liste tous les thèmes configurés.

=cut

sub list_themes {
    my ($self) = @_;
    return $self->{theme_manager}->list_themes();
}

=head2 tool

Affiche l'interface Intranet du plugin.

=cut

sub tool {
    my ($self, $args) = @_;
    return $self->{template_builder}->build_tool_interface();
}

=head2 opac_preview

Génère une prévisualisation OPAC directement depuis le plugin.

=cut

sub opac_preview {
    my ($self, $args) = @_;
    my $cgi = $self->{cgi};
    return $self->{template_builder}->build_opac_preview($cgi);
}

=head2 preview_theme_asset

Permet de prévisualiser les ressources (images, CSS...) d’un thème avant application.

=cut

sub preview_theme_asset {
    my ($self) = @_;
    return $self->{asset_handler}->serve_preview_asset();
}

=head2 uninstall

Supprime les données du plugin dans la base de données.

=cut
sub uninstall {
    my ($self, $args) = @_;
    my $dbh = C4::Context->dbh;
    my $plugin_class = ref($self) || 'Koha::Plugin::Celebrations';
    die "Plugin class is undef" unless defined $plugin_class;
    eval {
        my $sth_delete = $dbh->prepare("DELETE FROM plugin_data WHERE plugin_class = ?");
        $sth_delete->execute($plugin_class);
        $sth_delete->finish;
    };
    if ($@) {
        warn "Erreur lors de la désinstallation du plugin: $@";
        return 0;
    }
    return 1;
}

1;