package Koha::Plugin::Celebrations::Lib::AssetHandler;

use Modern::Perl;
use JSON;
use File::Slurp;
use CGI;

=head1 NAME

Koha::Plugin::Celebrations::AssetHandler - Gestionnaire de ressources CSS/JS et ressources des thèmes.

=head1 DESCRIPTION

Cette classe gère toutes les opérations liées aux ressources frontend du plugin :
chargement des routes statiques, injection des CSS/JS dans l’OPAC, lecture des
fichiers d’un thème, et fourniture des fichiers pour la prévisualisation.

Elle est utilisée par le plugin principal pour :

- Combiner les fichiers déclarés dans css.json, js.json et images.json
- Injecter les CSS/JS actifs dans l’OPAC
- Lire les fichiers assets d’un thème (CSS/JS)
- Servir correctement les ressources lors d’une prévisualisation

=cut

=head1 METHODS

=head2 new

Constructeur du gestionnaire d’assets.
Retourne une instance associée au plugin parent.

=cut

sub new {
    my ($class, $plugin) = @_;
    my $self = {
        plugin => $plugin,
    };
    bless $self, $class;
    return $self;
}

=head2 get_static_routes

Charge les fichiers css.json, js.json et images.json du plugin et retourne
l’ensemble des routes statiques disponibles sous forme de hashref.

=cut

sub get_static_routes {
    my ($self) = @_;
    my @files = qw(css.json js.json images.json);
    my %routes;
    foreach my $file (@files) {
        my $json_str = eval { $self->{plugin}->mbf_read("api/$file") };
        if ( !$json_str ) {
            warn "[Celebrations] Impossible de lire api/$file : $@" if $@;
            next;
        }
        my $spec = eval { decode_json($json_str) };
        if ($@) {
            warn "[Celebrations] JSON invalide dans api/$file : $@";
            next;
        }
        %routes = (%routes, %$spec);
    }
    return \%routes;
}

=head2 get_api_routes

Charge et décode la définition OpenAPI des routes REST du plugin.

=cut

sub get_api_routes {
    my ($self) = @_;
    my $json_str = $self->{plugin}->mbf_read('api/api_routes.json');
    return {} unless $json_str;
    my $spec = eval { decode_json($json_str) };
    if ($@) {
        warn "[Celebrations] api_routes.json invalide: $@";
        return {};
    }
    return $spec;
}


=head2 get_opac_head

Génère les balises <link> et <style> nécessaires à l’injection du CSS du thème
actif dans l’OPAC.
Retourne une chaîne HTML prête à être insérée dans head.inc.

=cut

sub get_opac_head {
    my ($self) = @_;
    my $theme_manager = $self->{plugin}->{theme_manager};
    my $active_theme = $theme_manager->get_active_theme();
    return '' unless $active_theme;
    my $theme_conf = $theme_manager->get_theme_data($active_theme);
    return '' unless $theme_conf && $theme_conf->{elements};
    my $conf = $self->{plugin}->{config}->get_theme_config($active_theme);
    my $extra_css = $self->collect_theme_css($active_theme, $conf, $theme_conf);
    my $font_link = $conf->{font_url} // '';
    return qq{
        <link href="$font_link" rel="stylesheet">
        <style id="theme-inline-css">
        $extra_css
        </style>
    };
}

=head2 get_opac_js

Retourne les tags <script> correspondant au thème actif, ainsi que les options JS
associées (ex : configuration spécifique aux animations).

=cut

sub get_opac_js {
    my ($self) = @_;
    my $theme_manager = $self->{plugin}->{theme_manager};
    my $active_theme = $theme_manager->get_active_theme();
    return '' unless $active_theme;
    my $theme_conf = $theme_manager->get_theme_data($active_theme);
    return '' unless $theme_conf && $theme_conf->{elements};
    my $conf = $self->{plugin}->{config}->get_theme_config($active_theme);
    my ($js_tags_ref, $js_options_ref) = $self->collect_theme_js($active_theme, $conf, $theme_conf);
    my $script_options = $self->generate_js_options($active_theme, $js_options_ref);
    return "$script_options\n" . join("\n", @$js_tags_ref);
}

=head2 collect_theme_css

Lit et concatène tous les fichiers CSS d’un thème dont les éléments sont actifs.
Retourne une grosse chaîne CSS.

=cut

sub collect_theme_css {
    my ($self, $theme_name, $conf, $theme_conf) = @_;
    return ''
        unless ref $conf->{elements} eq 'HASH' && ref $theme_conf->{elements} eq 'HASH';
    my $extra_css = '';
    foreach my $element (keys %{ $conf->{elements} }) {
        my $element_state = $theme_conf->{elements}{$element};
        next unless ref $element_state eq 'HASH';
        next unless $element_state->{enabled};
        my $type = $conf->{elements}{$element}{type} // 'both';
        next if $type eq 'js';
        my $file = $conf->{elements}{$element}{file};
        next unless $file;
        my $css_file = $self->get_asset_path('css', $theme_name, $file);
        next unless -e $css_file;
        $extra_css .= read_file($css_file, binmode => ':utf8');
    }
    return $extra_css;
}


=head2 collect_theme_js

Construit les balises <script> pour les fichiers JS d’un thème actif et collecte
également les options associées.
Retourne :
- une référence à une liste de tags <script>
- une référence à un hash contenant les options JS

=cut

sub collect_theme_js {
    my ($self, $theme_name, $conf, $theme_conf) = @_;
    my @js_tags;
    my %js_options;
    return (\@js_tags, \%js_options) unless exists $conf->{elements};
    my $api_ns = $self->{plugin}->api_namespace;
    foreach my $element (keys %{ $conf->{elements} }) {
        my $enabled = $theme_conf->{elements}{$element}{enabled} // '';
        next unless $enabled;
        my $type = $conf->{elements}{$element}{type} // 'both';
        next if $type eq 'css';
        my $file_name = $conf->{elements}{$element}{file};
        my $js_file = $self->get_asset_path('js', $theme_name, $file_name);
        if (my $opts = $theme_conf->{elements}{$element}{options}) {
            $js_options{$_} = $opts->{$_} for keys %$opts;
        }
        if (-e $js_file) {
            push @js_tags, qq{
                <script src="/api/v1/contrib/$api_ns/static/js/$theme_name/$file_name.js" data-theme="$theme_name"></script>
            };
        } else {
            warn "[Celebrations] Fichier JS manquant pour l'élément '$element' : $js_file";
        }
    }
    return (\@js_tags, \%js_options);
}

=head2 generate_js_options

Génère un bloc <script> contenant les options JavaScript d’un thème, accessibles
sous window["<theme_name>ThemeOptions"].

=cut

sub generate_js_options {
    my ($self, $theme_name, $js_options) = @_;
    return '' unless %$js_options;
    my $json_opts = encode_json($js_options);
    return qq{
        <script>
            window["${theme_name}ThemeOptions"] = $json_opts;
        </script>
    };
}

=head2 get_asset_path

Construit et retourne le chemin absolu d’un fichier CSS ou JS d’un thème donné.
Effectue aussi une validation simple des noms de fichiers.

=cut

sub get_asset_path {
    my ($self, $type, $theme, $file) = @_;
    return '' unless $theme && $file;
    my $plugin_dir = $self->{plugin}->{config}->get_plugin_dir();
    return '' unless $plugin_dir;
    $theme =~ s/[^A-Za-z0-9_-]//g;
    $file  =~ s/[^A-Za-z0-9_-]//g;
    return "$plugin_dir/Celebrations/$type/$theme/$file.$type";
}

=head2 serve_preview_asset

Point d’entrée utilisé pour fournir les fichiers CSS/JS d’un thème lors de la
prévisualisation dans l’OPAC.
Valide les paramètres, localise le fichier et le sert.

=cut

sub serve_preview_asset {
    my ($self) = @_;
    my $cgi = CGI->new;
    my $type = $cgi->param('type');
    my $theme = $cgi->param('theme');
    my $file = $cgi->param('file');
    unless ($type =~ /^(css|js)$/ && $theme =~ /^[A-Za-z0-9_-]+$/ && $file =~ /^[A-Za-z0-9_-]+$/) {
        print $cgi->header(-status => 400, -type => 'text/plain');
        print "Invalid params";
        return;
    }
    my $plugin_dir = $self->{plugin}->{config}->get_plugin_dir();
    my $path = "$plugin_dir/Celebrations/$type/$theme/$file.$type";
    if (-e $path) {
        $self->serve_asset_file($cgi, $path, $type);
    } else {
        print $cgi->header(-status => 404, -type => 'text/plain');
        print "File not found";
    }
}

=head2 serve_asset_file

Sert un fichier CSS/JS avec le bon Content-Type, utilisé uniquement dans le
contexte de la prévisualisation via CGI.

=cut

sub serve_asset_file {
    my ($self, $cgi, $path, $type) = @_;
    open my $fh, '<:raw', $path or do {
        print $cgi->header(-status => 500, -type => 'text/plain');
        print "Can't open file";
        return;
    };
    local $/;
    my $content = <$fh>;
    close $fh;
    print $cgi->header(
        -type => $type eq 'css' ? 'text/css' : 'application/javascript',
        -charset => 'utf-8'
    );
    print $content;
}

1;
