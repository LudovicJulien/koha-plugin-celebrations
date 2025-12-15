package Koha::Plugin::Celebrations::Lib::TemplateBuilder;

use Modern::Perl;
use JSON;
use DateTime;
use C4::Languages;
use C4::Auth qw(get_template_and_user);
use C4::Output qw(output_html_with_http_headers);
use Data::Dumper;

=head1 NAME

Koha::Plugin::Celebrations::TemplateBuilder - Constructeur de templates pour le plugin Celebrations.

=head1 DESCRIPTION

Cette classe centralise toute la logique liée à :
- l'affichage de l'interface outil dans l'intranet ;
- la construction du template lorsque le plugin est activé ou désactivé ;
- la génération de l’aperçu OPAC ;
- la préparation et la mise en forme des données de thèmes ;
- le nettoyage du HTML pour les prévisualisations.

Elle agit comme couche dédiée à la génération des interfaces utilisateur, en utilisant
les templates TT fournis avec le plugin.

=cut

=head1 METHODS

=head2 new

Crée une nouvelle instance de TemplateBuilder.

    my $tb = Koha::Plugin::Celebrations::TemplateBuilder->new($plugin);

Paramètres : C<$plugin> : instance du plugin principal.

Retour : Une instance bénie de TemplateBuilder.

=cut

sub new {
    my ($class, $plugin) = @_;
    my $self = {
        plugin => $plugin,
    };
    bless $self, $class;
    return $self;
}

=head1 build_tool_interface

Construit l’interface principale utilisée dans l’intranet Koha (outil du plugin).

- Détermine si le plugin est activé ou non.
- Charge les traductions selon la langue de l’utilisateur.
- Appelle build_enabled_template() ou build_disabled_template().
- Gère l’envoi du header HTTP et affiche le template produit.

=cut

sub build_tool_interface {
    my ($self) = @_;
    my $cgi = $self->{plugin}->{cgi};
    my $plugin_class = ref $self->{plugin};
    my $plugin_name = 'Celebrations';
    my $preferredLanguage = C4::Languages::getlanguage();
    my $translations = $self->{plugin}->{i18n}->load_translations($preferredLanguage);
    my $template;
    if ($self->{plugin}->is_enabled) {
        $template = $self->build_enabled_template(
            $cgi,
            $plugin_class,
            $plugin_name,
            $preferredLanguage,
            $translations
        );
    } else {
        $template = $self->build_disabled_template(
            $plugin_class,
            $preferredLanguage,
            $translations
        );
    }
    binmode STDOUT, ":encoding(UTF-8)";
    print $cgi->header(-type => 'text/html', -charset => 'utf-8');
    print $template->output();
}

=head1 build_enabled_template

Construit le template affiché lorsque le plugin est activé.

Fonctionnalités :
- Charge les données des thèmes ;
- Détermine le thème actif ;
- Prépare la liste des thèmes pour l'affichage ;
- Injecte :
  - les traductions,
  - la configuration,
  - les données JSON,
  - les chemins du plugin,
  - les paramètres du template TT.

Retour : Objet template TT prêt à être rendu.

=cut

sub build_enabled_template {
    my ($self, $cgi, $plugin_class, $plugin_name, $preferredLanguage, $translations) = @_;
    my $koha_session = $cgi->cookie('KohaSession') // $cgi->param('koha_session');
    my $template = $self->{plugin}->get_template({ file => 'templates/homeTheme.tt' });
    my $theme_manager = $self->{plugin}->{theme_manager};
    my $active_theme = $theme_manager->get_active_theme();
    my $themes_data = $self->{plugin}->retrieve_data('themes_data');
    my $all_themes = $themes_data ? decode_json($themes_data) : {};
    my @themes_list = $self->prepare_themes_for_display($all_themes);
    @themes_list = $self->sort_themes_list(@themes_list);
    my $themes_list_json = encode_json(\@themes_list);
    my $theme_config = $self->{plugin}->{config}->get_themes_config();
    my $theme_config_json = encode_json($theme_config);
    $template->param(
        enabled             => 1,
        CLASS               => $plugin_class,
        METHOD              => 'tool',
        plugin_name         => $plugin_name,
        plugin_class        => $plugin_class,
        api_namespace       => $self->{plugin}->api_namespace,
        koha_session        => $koha_session,
        active_theme        => $active_theme,
        all_themes          => $all_themes,
        themes_list_json    => $themes_list_json,
        theme_config_json   => $theme_config_json,
        theme_config        => $theme_config,
        PLUGIN_DIR          => $self->{plugin}->{config}->get_plugin_dir(),
        LANG                => $preferredLanguage,
        translation         => $translations->{hash},
        translations_json   => $translations->{text},
    );
    return $template;
}

=head1 build_disabled_template

Construit le template affiché lorsque le plugin est désactivé.

Fonctionnalités :
- Injecte un CSS spécifique de désactivation ;
- Prépare les paramètres requis par TT ;
- Retourne le template minimaliste pour indiquer que le plugin est inactif.

=cut

sub build_disabled_template {
    my ($self, $plugin_class, $preferredLanguage, $translations) = @_;
    my $template = $self->{plugin}->get_template({ file => 'templates/disabled.tt' });
    my $css_template = $self->{plugin}->get_template({ file => 'css/template/disabled-css.tt' });
    my $css_content = $css_template->output();
    $template->param(
        enabled         => 0,
        CLASS           => $plugin_class,
        METHOD          => 'tool',
        api_namespace   => $self->{plugin}->api_namespace,
        disabled_css    => $css_content,
        PLUGIN_DIR      => $self->{plugin}->{config}->get_plugin_dir(),
        LANG            => $preferredLanguage,
        translation     => $translations->{hash},
    );
    return $template;
}

=head1 prepare_themes_for_display

Transforme les données brutes des thèmes en une liste enrichie adaptée à l'affichage.

Ajoute notamment :
- si le thème est en cours d'utilisation ;
- la version formatée des dates ;
- les éléments du thème et leurs états ;
- le nombre total d’éléments.

Retour : Liste de hashrefs représentant chaque thème.

=cut

sub prepare_themes_for_display {
    my ($self, $all_themes) = @_;
    my @themes_list;
    my $now = DateTime->now();
    my $theme_manager = $self->{plugin}->{theme_manager};
    foreach my $theme_name (keys %$all_themes) {
        my $theme = $all_themes->{$theme_name};
        my $is_current = $theme_manager->is_theme_current($theme, $now);
        my %elements_display;
        if (exists $theme->{elements} && ref $theme->{elements} eq 'HASH') {
            foreach my $element_name (keys %{ $theme->{elements} }) {
                my $element = $theme->{elements}{$element_name};
                $elements_display{$element_name} = {
                    enabled => $element->{enabled} // 'off',
                    options => $element->{options} // {}
                };
            }
        }elsif (exists $theme->{elements}) {
            warn "Unexpected elements format for theme $theme_name: " . Dumper($theme->{elements});
        }
        push @themes_list, {
            theme_name => $theme_name,
            active => $theme->{active},
            is_current => $is_current,
            start_date => $theme->{start_date},
            end_date => $theme->{end_date},
            created_at => $theme->{created_at},
            elements => \%elements_display,
            elements_count => scalar keys %{$theme->{elements} // {}}
        };
    }
    return @themes_list;
}

=head1 sort_themes_list

Trie les thèmes selon les règles suivantes :
1. Les thèmes "actuellement actifs" passent en premier ;
2. Ensuite tri décroissant par date de début.

Retour : Liste triée de thèmes.

=cut

sub sort_themes_list {
    my ($self, @themes_list) = @_;
    my @sorted = sort {
        return -1 if $a->{is_current} && !$b->{is_current};
        return 1 if !$a->{is_current} && $b->{is_current};
        return $b->{start_date} <=> $a->{start_date};
    } @themes_list;
    return @sorted;
}

=head1 build_opac_preview

Génère une prévisualisation OPAC via :

- récupération du template “opac-main.tt” ;
- injection de paramètres supplémentaires (message, mode aperçu) ;
- nettoyage du HTML final ;
- rendu final via output_html_with_http_headers().

Utilisé pour simuler l’apparence du site public avec le thème actif.

=cut

sub build_opac_preview {
    my ($self, $cgi) = @_;
    #my $cgi = $self->{plugin}->{cgi};
    die "CGI undefined!" unless $cgi;
    my ($template, $borrowernumber, $cookie) = get_template_and_user(
        {
            template_name   => "opac-main.tt",
            type            => "opac",
            query           => $cgi,
            authnotrequired => 1,
        }
    );
    $template->param(
        plugin_name => 'Celebrations',
        message     => "Aperçu OPAC généré depuis le plugin Celebrations",
        is_preview  => 1,
    );
    my $html = $template->output;
    $html = $self->clean_preview_html($html);
    output_html_with_http_headers($cgi, $cookie, $html);
}

=head1 clean_preview_html

Nettoie le HTML de la prévisualisation afin de :

- supprimer les scripts du plugin ;
- retirer les liens ou styles intégrés ;
- effacer les commentaires spécifiques du plugin.

Retour : HTML nettoyé.

=cut

sub clean_preview_html {
    my ($self, $html) = @_;
    $html =~ s{<script[^>]+Celebrations-api[^>]*></script>}{}gis;
    $html =~ s{<link[^>]+Celebrations-api[^>]*>}{}gis;
    $html =~ s{<style[^>]+id=["']theme-inline-css["'][^>]*>.*?</style>}{}gis;
    $html =~ s{<!--.*?Celebrations.*?-->}{}gis;
    return $html;
}

1;