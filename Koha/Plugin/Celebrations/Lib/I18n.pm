package Koha::Plugin::Celebrations::Lib::I18n;

use Modern::Perl;
use JSON;
use File::Spec;

=head1 NAME

Koha::Plugin::Celebrations::I18n - Gestionnaire de traductions pour le plugin Celebrations.

=head1 DESCRIPTION

Cette classe gère le chargement et la préparation des traductions
internationalisées utilisées dans :

- les templates (Perl / Template Toolkit)
- le JavaScript (injection directe du JSON)

Elle permet également de déterminer la liste des langues supportées par le plugin.

=cut

=head1 METHODS

=head2 new

Constructeur du gestionnaire i18n.
Reçoit une instance du plugin et initialise la structure interne.
Retourne une nouvelle instance prête à l’emploi.

=cut

sub new {
    my ($class, $plugin) = @_;
    my $self = {
        plugin => $plugin,
    };
    bless $self, $class;
    return $self;
}

=head2 load_translations

    my $translations = $i18n->load_translations('fr');

Charge le fichier JSON correspondant à la langue demandée.
Retourne un hashref contenant :

- C<text> — le JSON sous forme de texte UTF-8 (pour injection JavaScript)
- C<hash> — le JSON décodé en structure Perl (pour Template Toolkit)

Si la langue demandée n’existe pas, un avertissement est émis et le fichier
C<default.json> est utilisé.

=cut

sub load_translations {
    my ($self, $language) = @_;
    my $json_file = $self->get_language_file($language);
    my $plugin_dir = $self->{plugin}->{config}->get_plugin_dir();
    my $path = File::Spec->catfile($plugin_dir, 'Celebrations', 'i18n', $json_file);
    unless (-e $path) {
        warn "Translation file not found: $path";
        return { text => "{}", hash => {} };
    }
    my ($json_text, $json_raw);
    # Pour JavaScript (UTF-8 encodé)
    {
        local $/;
        open my $fh, '<:encoding(UTF-8)', $path
            or die "Cannot open $path: $!";
        $json_text = <$fh>;
        close $fh;
    }
    # Pour Perl (données brutes)
    {
        local $/;
        open my $fh, '<:raw', $path
            or die "Cannot open $path: $!";
        $json_raw = <$fh>;
        close $fh;
    }
    my $data = decode_json($json_raw);
    return {
        text => $json_text,  # Pour injection JavaScript
        hash => $data        # Pour Template Toolkit
    };
}

=head2 get_language_file

    my $file = $i18n->get_language_file('en');

Retourne le nom du fichier JSON correspondant à la langue passée en argument
(par exemple C<fr.json>, C<en.json>, etc.).
Si aucun fichier ne correspond, retourne C<default.json>.

=cut

sub get_language_file {
    my ($self, $language) = @_;
    my $plugin_dir = $self->{plugin}->{config}->get_plugin_dir();
    my $i18n_dir = File::Spec->catdir($plugin_dir, 'Celebrations', 'i18n');
    my $lang_file = "$language.json";
    my $lang_path = File::Spec->catfile($i18n_dir, $lang_file);
    if (-e $lang_path) {
        return $lang_file;
    }
    return 'default.json';
}

=head2 get_supported_languages

Retourne la liste des langues supportées par le plugin, détectées automatiquement
dans le dossier :

    Celebrations/i18n/

Chaque fichier C<*.json> est interprété comme une langue.

Exemple : [ 'fr-CA', 'default' ]

=cut

sub get_supported_languages {
    my ($self) = @_;
    my $plugin_dir = $self->{plugin}->{config}->get_plugin_dir();
    my $i18n_dir = File::Spec->catdir($plugin_dir, 'Celebrations', 'i18n');
    opendir(my $dh, $i18n_dir) or return [];
    my @files = grep { /\.json$/ && -f File::Spec->catfile($i18n_dir, $_) } readdir($dh);
    closedir($dh);
    my @languages = map { s/\.json$//r } @files;
    return \@languages;
}

1;