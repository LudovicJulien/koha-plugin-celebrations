package Koha::Plugin::Celebrations::Lib::Config;

use Modern::Perl;
use File::Slurp;
use File::Basename;
use Cwd 'abs_path';
use JSON;

=head1 NAME

Koha::Plugin::Celebrations::Config - Gestionnaire de configuration des thèmes du plugin Celebrations.

=head1 DESCRIPTION

Cette classe charge et gère l'ensemble de la configuration des thèmes depuis
le fichier JSON situé dans :

    Celebrations/config/theme-config.json

Elle fournit des méthodes permettant :

- de localiser le répertoire réel du plugin
- de charger et décoder la configuration JSON
- d’accéder à la configuration complète ou par thème
- de vérifier l’existence d’un thème
- d’obtenir le JSON brut pour debug ou inspection

=cut

=head1 METHODS

=head2 new

Constructeur du gestionnaire de configuration.
Charge automatiquement le fichier theme-config.json lors de l'initialisation.
Retourne une instance prête à être utilisée.

=cut

sub new {
    my ($class, $plugin) = @_;
    my $self = {
        plugin => $plugin,
        plugin_dir => undef,
        themes_config => {},
        json_config => '',
    };
    bless $self, $class;
    $self->_load_theme_config();
    return $self;
}

=head2 _load_theme_config

Méthode interne.
Localise le répertoire du plugin, lit le fichier theme-config.json, le décode,
et initialise :
- plugin_dir
- themes_config
- json_config
En cas d’absence du fichier, un avertissement est émis et la configuration reste vide.

=cut

sub _load_theme_config {
    my ($self) = @_;
    my $plugin_pm_path = abs_path($INC{'Koha/Plugin/Celebrations.pm'});
    my $plugin_dir = dirname($plugin_pm_path);
    my $config_path = "$plugin_dir/Celebrations/config/theme-config.json";
    $self->{plugin_dir} = $plugin_dir;
    if (-e $config_path) {
        my $json_text = read_file($config_path, binmode => ':utf8');
        my $theme_config = decode_json($json_text);
        $self->{json_config} = $json_text;
        $self->{themes_config} = $theme_config;
    } else {
        warn "[Celebrations] Config file not found: $config_path";
        $self->{themes_config} = {};
    }
}

=head2 get_plugin_dir

Retourne le chemin absolu du répertoire du plugin.

=cut

sub get_plugin_dir {
    my ($self) = @_;
    return $self->{plugin_dir};
}

=head2 get_themes_config

Retourne la configuration complète de tous les thèmes sous forme de hashref.

=cut

sub get_themes_config {
    my ($self) = @_;
    return $self->{themes_config};
}

=head2 get_theme_config

    my $conf = $config->get_theme_config('noel');

Retourne la configuration complète d’un thème donné.
Retourne undef si le thème n’existe pas.

=cut

sub get_theme_config {
    my ($self, $theme_name) = @_;
    return unless $theme_name;
    return $self->{themes_config}{$theme_name};
}

=head2 get_json_config

Retourne le contenu JSON brut du fichier de configuration.
Utile pour du debug, de la prévisualisation ou un export.

=cut

sub get_json_config {
    my ($self) = @_;
    return $self->{json_config};
}
=head2 theme_exists

Retourne vrai si un thème existe dans le fichier de configuration.

=cut

sub theme_exists {
    my ($self, $theme_name) = @_;
    return exists $self->{themes_config}{$theme_name};
}

1;