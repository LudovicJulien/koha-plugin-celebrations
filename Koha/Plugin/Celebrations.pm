package Koha::Plugin::Celebrations;
use Modern::Perl;
use base qw(Koha::Plugins::Base);
use URI::Escape;
use JSON;
use Koha::Plugins;
use File::Slurp;
use File::Basename;
use Cwd 'abs_path';
use C4::Languages;
use C4::Context;
use C4::Auth qw(get_template_and_user);
use C4::Output qw(output_html_with_http_headers);
use DateTime::Format::Strptime;
use Encode qw(encode);
use Data::Dumper;
#
#
#
#   Informations de base sur le plugin (métadonnées utilisées par Koha)
#
our $metadata = {
    name            => 'Celebrations',
    author          => 'Ludovic Julien',
    description     => 'Un OPAC pour chaque saison.',
    date_authored   => '2025-09-09',
    date_updated    => '2025-11-17',
    version         => '0.9.4',
    minimum_version => '24.05',
};
#
#
#
#   Constructeur du plugin (initialise avec les métadonnées) et lechement du fichier de configuration
#
sub new {
    my ($class, $args) = @_;
    $args->{metadata} = $metadata;
    my $self = $class->SUPER::new($args);
    $self->_load_theme_config();
    return $self;
}
#
#
#
#   Charge la configuration des thèmes depuis le fichier JSON
#
sub _load_theme_config {
    my ($self) = @_;
    my $plugin_pm_path = abs_path(__FILE__);
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
#
#
#
#   Namespace API utilisé pour exposer les routes de ce plugin
#
sub api_namespace {
    my ( $self ) = @_;
    return 'Celebrations-api';
}
#
#
#
#   Définit les routes statiques de l’API en lisant le fichier JSON
#
sub static_routes {
    my $self = shift;
    my @files = qw(css.json js.json images.json);
    my %all_routes;
    for my $file (@files) {
        my $path = $self->mbf_read("api/$file");
        my $spec = decode_json($path);
        %all_routes = (%all_routes, %$spec);
    }
    return \%all_routes;
}
#
#
#
# Méthode interne pour générer un chemin vers un fichier CSS ou JS, Nettoie le nom du thème et du fichier pour éviter toute injection de chemin
#
sub _get_asset_path {
    my ($self, $type, $theme, $file) = @_;
    return '' unless $theme && $file && $self->{plugin_dir};
    $theme =~ s/[^A-Za-z0-9_-]//g;
    $file  =~ s/[^A-Za-z0-9_-]//g;
    return "$self->{plugin_dir}/Celebrations/$type/$theme/$file.$type";
}
#
#
#
# Récupère le thème actif en fonction de la date actuelle
#
sub _get_active_theme {
    my ($self) = @_;
    my $themes_data = $self->retrieve_data('themes_data');
    return undef unless $themes_data;
    my $themes = decode_json(encode('UTF-8', $themes_data));
    my $now = DateTime->now();
    # permet de simuler une date pour tester !
    #  my $now = DateTime->new(
    #     year  => 2026,
    #     month => 1,
    #     day   => 4,
    #     hour  => 8,   # optionnel
    #     time_zone => 'local' # ou 'UTC'
    # );
    foreach my $theme_name (keys %$themes) {
        my $theme = $themes->{$theme_name};
        next unless $theme->{active};
        if ($theme->{start_date} && $theme->{end_date}) {
            my $start = DateTime->from_epoch(epoch => $theme->{start_date});
            my $end = DateTime->from_epoch(epoch => $theme->{end_date});
            if ($now >= $start && $now <= $end) {
                return $theme_name;
            }
        }
    }
    return undef;
}
#
#
#
# Récupère la configuration complète d'un thème
#
sub _get_theme_config {
    my ($self, $theme_name) = @_;
    return undef unless $theme_name;
    my $themes_data = $self->retrieve_data('themes_data');
    return undef unless $themes_data;
    my $themes = decode_json(encode('UTF-8', $themes_data));
    return $themes->{$theme_name} // undef;
}
#
#
#
#   envoie le CSS à l'OPAC (en inline pour éviter le temps de chargement long)
#
sub opac_head {
    my ($self) = @_;
    my $active_theme = $self->_get_active_theme();
    return '' unless $active_theme;
    my $theme_conf = $self->_get_theme_config($active_theme);
    return '' unless $theme_conf && $theme_conf->{elements};
    my $conf       = $self->{themes_config}{$active_theme};
    my $extra_css = $self->_collect_theme_css($active_theme, $conf, $theme_conf);
    my $font_link = $conf->{font_url} // '';
    return qq{
        <link href="$font_link" rel="stylesheet">
        <style id="theme-inline-css">
        $extra_css
        </style>
    };
}
#
#
#
#   Collecte tous les fichiers CSS d'un thème
#
sub _collect_theme_css {
    my ($self, $theme_name, $conf, $theme_conf) = @_;
    my $extra_css = '';
    return $extra_css unless exists $conf->{elements};
    foreach my $element (keys %{ $conf->{elements} }) {
        my $enabled = $theme_conf->{elements}{$element}{enabled} // '';
        next unless $enabled eq 'on';
        my $type = $conf->{elements}{$element}{type} // 'both';
        next if $type eq 'js';
        my $css_file = $self->_get_asset_path('css', $theme_name, $conf->{elements}{$element}{file});
        if (-e $css_file) {
            $extra_css .= read_file($css_file, binmode => ':utf8');
        } else {
            warn "[Celebrations] CSS manquant pour $element : $css_file";
        }
    }
    return $extra_css;
}
#
#
#
#   envoie le js a l'OPAC
#
 sub opac_js {
    my ($self) = @_;
    my $active_theme = $self->_get_active_theme();
    return '' unless $active_theme;
    my $theme_conf = $self->_get_theme_config($active_theme);
    return '' unless $theme_conf && $theme_conf->{elements};
    my $conf = $self->{themes_config}{$active_theme};
    my ($js_tags_ref, $js_options_ref) = $self->_collect_theme_js($active_theme, $conf, $theme_conf);
    my $script_options = $self->_generate_js_options($active_theme, $js_options_ref);
    return "$script_options\n" . join("\n", @$js_tags_ref);

}
#
#
#
#   Collecte tous les fichiers JS d'un thème et leurs options
#
sub _collect_theme_js {
    my ($self, $theme_name, $conf, $theme_conf) = @_;
    my @js_tags;
    my %js_options;
    return (\@js_tags, \%js_options) unless exists $conf->{elements};
    my $api_ns = $self->api_namespace;
    foreach my $element (keys %{ $conf->{elements} }) {
        my $enabled = $theme_conf->{elements}{$element}{enabled} // '';
        warn "[Celebrations] Element $element disabled" unless $enabled eq 'on';
        next unless $enabled eq 'on';
        my $type = $conf->{elements}{$element}{type} // 'both';
        next if $type eq 'css';
        my $file_name = $conf->{elements}{$element}{file};
        my $js_file = $self->_get_asset_path('js', $theme_name, $file_name);
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
#
#
#
#   Génère le script contenant les options JS du thème
#
sub _generate_js_options {
    my ($self, $theme_name, $js_options) = @_;
    return '' unless %$js_options;
    my $json_opts = encode_json($js_options);
    return qq{
            <script>
                window["${theme_name}ThemeOptions"] = $json_opts;
            </script>
        };
}
#
#
#   Enregistre les sélections de theme dans la BD
#
sub apply_theme {
    my ($self) = @_;
    my $cgi = $self->{cgi};
    print $cgi->header(-type => 'application/json', -charset => 'UTF-8');
    my $theme_name = $cgi->param('theme');
    my $start_date = $cgi->param('start_date');
    my $end_date = $cgi->param('end_date');
    my $validation_result = $self->_validate_theme_dates($start_date, $end_date);
    unless ($validation_result->{valid}) {
        print to_json({
            success => JSON::false,
            message => $validation_result->{message}
        });
        return;
    }
    my ($start_dt, $end_dt) = @{$validation_result}{qw(start_dt end_dt)};
    my $conflict = $self->_check_theme_conflicts($theme_name, $start_dt, $end_dt);
    if ($conflict) {
        print to_json({
            success => JSON::false,
            message => $conflict
        });
        return;
    }
    my $theme_data = $self->_build_theme_data($theme_name, $start_dt, $end_dt);
    $self->_save_theme($theme_name, $theme_data);
    print to_json({
        success => JSON::true,
        theme => $theme_name,
        message => "Thème '$theme_name' activé du " . $start_date . " au " . $end_date
    });
}
#
#   Valide les dates de début et fin du thème
#
sub _validate_theme_dates {
    my ($self, $start_date, $end_date) = @_;
    unless ($start_date && $start_date ne 'null' && $end_date && $end_date ne 'null') {
        return {
            valid => 0,
            message => 'date_error_required'
        };
    }
    my $strp = DateTime::Format::Strptime->new(
        pattern => '%Y-%m-%d',
        time_zone => 'local',
    );
    my $start_dt = $strp->parse_datetime($start_date);
    my $end_dt = $strp->parse_datetime($end_date);
    $end_dt->set(hour => 23, minute => 59, second => 59);
    unless ($start_dt && $end_dt) {
        return {
            valid => 0,
            message => 'date_error_invalid'
        };
    }
    if ($start_dt >= $end_dt) {
        return {
            valid => 0,
            message => 'date_error_order'
        };
    }
    return {
        valid => 1,
        start_dt => $start_dt,
        end_dt => $end_dt
    };
}
#
#
#
#   Vérifie les conflits de dates avec les autres thèmes actifs
#
sub _check_theme_conflicts {
    my ($self, $theme_name, $start_dt, $end_dt) = @_;
    my $themes_data = $self->retrieve_data('themes_data');
    my $themes = $themes_data ? decode_json($themes_data) : {};
    foreach my $existing_theme_name (keys %$themes) {
        next if $existing_theme_name eq $theme_name;
        my $existing_theme = $themes->{$existing_theme_name};
        next unless $existing_theme->{active};
        if ($existing_theme->{start_date} && $existing_theme->{end_date}) {
            my $exist_start = DateTime->from_epoch(epoch => $existing_theme->{start_date});
            my $exist_end = DateTime->from_epoch(epoch => $existing_theme->{end_date});
            if (($start_dt <= $exist_end) && ($end_dt >= $exist_start)) {
                return "Conflit de dates avec le thème '$existing_theme_name'";
            }
        }
    }
    return undef;
}
#
#
#
#   Construit les données du thème à partir de la configuration et des paramètres CGI
#
sub _build_theme_data {
    my ($self, $theme_name, $start_dt, $end_dt) = @_;
    my %theme_data = (
        theme_name => $theme_name,
        active => 1,
        start_date => $start_dt->epoch,
        end_date => $end_dt->epoch,
        created_at => time(),
        elements => {}
    );
    return \%theme_data unless exists $self->{themes_config}{$theme_name};
    return \%theme_data unless exists $self->{themes_config}{$theme_name}{elements};
    my $base_elements = $self->{themes_config}{$theme_name}{elements};
    my $cgi = $self->{cgi};
    foreach my $element (keys %$base_elements) {
        my $setting = $base_elements->{$element}{setting};
        my $enabled = $cgi->param($setting) // 'off';
        $theme_data{elements}{$element} = {
            enabled => $enabled,
            options => {}
        };
        if (exists $base_elements->{$element}{extra_options}) {
            foreach my $opt_key (keys %{ $base_elements->{$element}{extra_options} }) {
                my $opt_val = $cgi->param($opt_key);
                $opt_val = $self->api_namespace if $opt_key eq 'api_namespace';
                $opt_val //= $base_elements->{$element}{extra_options}{$opt_key}{default} // 'off';
                $theme_data{elements}{$element}{options}{$opt_key} = $opt_val;
            }
        }
    }
    return \%theme_data;
}
#
#
#
#   Sauvegarde le thème dans la base de données
#
sub _save_theme {
    my ($self, $theme_name, $theme_data) = @_;
    my $themes_data = $self->retrieve_data('themes_data');
    my $themes = $themes_data ? decode_json($themes_data) : {};
    $themes->{$theme_name} = $theme_data;
    $self->store_data({ themes_data => encode('UTF-8', encode_json($themes)) });
}
#
#
#
# Supprime un thème de la base de données
#
sub delete_theme {
    my ($self) = @_;
    my $cgi = CGI->new;
    my $theme_name = $cgi->param('theme_name');
    binmode STDOUT, ':encoding(UTF-8)';
    print $cgi->header(-type => 'application/json', -charset => 'UTF-8');
    eval {
        my $themes_data = $self->retrieve_data('themes_data');
        if (!$themes_data) {
            print encode_json({ success => JSON::false, error => 'Aucune donnée de thème trouvée' });
            return;
        }
        my $themes = decode_json(encode('UTF-8',$themes_data));
        if (exists $themes->{$theme_name}) {
            delete $themes->{$theme_name};
            $self->store_data({ themes_data => encode_json($themes) });
            print encode_json({
                success => JSON::true,
                theme   => $theme_name,
                message => "theme_deleted"
            });
        } else {
            print encode_json({
                success => JSON::false,
                error   => "theme_not_found"
            });
        }
    };
    if ($@) {
        print encode_json({
            success => JSON::false,
            error   => "Erreur serveur: $@"
        });
    }
}
#
#
#
# Liste tous les thèmes avec leur statut
#
sub list_themes {
    my ($self) = @_;
    my $cgi = $self->{cgi};
    my $themes_data = $self->retrieve_data('themes_data');
    my $themes = $themes_data ? decode_json(encode('UTF-8',$themes_data)) : {};
    my $now = DateTime->now();
    my @theme_list = $self->_build_theme_list($themes, $now);
    print $cgi->header('application/json');
    print to_json({
        success => JSON::true,
        themes => \@theme_list,
        current_theme => $self->_get_active_theme()
    });
}
#
#
#
#   Construit la liste des thèmes avec leur statut
#
sub _build_theme_list {
    my ($self, $themes, $now) = @_;
    my @theme_list;
    foreach my $theme_name (keys %$themes) {
        my $theme = $themes->{$theme_name};
        my $is_current = $self->_is_theme_current($theme, $now);
        my ($start_formatted, $end_formatted) = $self->_format_theme_dates($theme);
        push @theme_list, {
            name => $theme_name,
            active => $theme->{active},
            is_current => $is_current,
            start_date => $theme->{start_date},
            end_date => $theme->{end_date},
            start_date_formatted => $start_formatted,
            end_date_formatted => $end_formatted,
            created_at => $theme->{created_at}
        };
    }
    return @theme_list;
}
#
#
#
#   Vérifie si un thème est actuellement actif
#
sub _is_theme_current {
    my ($self, $theme, $now) = @_;
    return 0 unless $theme->{active} && $theme->{start_date} && $theme->{end_date};
    my $start = DateTime->from_epoch(epoch => $theme->{start_date});
    my $end = DateTime->from_epoch(epoch => $theme->{end_date});
    return ($now >= $start && $now <= $end) ? 1 : 0;
}
#
#
#
#   Gère l'interface de l'intranet
#
sub tool {
    my ($self, $args) = @_;
    my $cgi = $self->{cgi};
    my $template;
    my $plugin_class = ref $self;
    my $plugin_name  = $metadata->{name} // $plugin_class;
    my $preferredLanguage = C4::Languages::getlanguage();
    if ($self->is_enabled) {
        $template = $self->_build_enabled_template($cgi, $plugin_class, $plugin_name, $preferredLanguage);
    } else {
        $template = $self->_build_disabled_template($plugin_class, $preferredLanguage);
    }
    print $cgi->header(-type => 'text/html', -charset => 'utf-8');
    print $template->output();
}
#
#
#
#   Construit le template pour le plugin activé
#
sub _build_enabled_template {
    my ($self, $cgi, $plugin_class, $plugin_name, $preferredLanguage) = @_;
    my $koha_session = $cgi->cookie('KohaSession') // $cgi->param('koha_session');
    my $template = $self->get_template({ file => 'templates/homeTheme.tt' });
    my $active_theme = $self->_get_active_theme();
    my $themes_data = $self->retrieve_data('themes_data');
    my $all_themes = $themes_data ? decode_json($themes_data) : {};
    my @themes_list = $self->_prepare_themes_for_display($all_themes);
    @themes_list = $self->_sort_themes_list(@themes_list);
    my $themes_list_json = encode_json(\@themes_list);
    my $theme_config_json = encode_json($self->{themes_config});
    $template->param(
        enabled => 1,
        CLASS => $plugin_class,
        METHOD => 'tool',
        plugin_name => $plugin_name,
        plugin_class => $plugin_class,
        api_namespace => $self->api_namespace,
        koha_session => $koha_session,
        active_theme => $active_theme,
        all_themes => $all_themes,
        themes_list_json => $themes_list_json,
        theme_config_json => $theme_config_json,
        theme_config => $self->{themes_config},
        PLUGIN_DIR => $self->{plugin_dir},
        LANG => $preferredLanguage,
    );
    return $template;
}
#
#
#
#   Construit le template pour le plugin désactivé
#
sub _build_disabled_template {
    my ($self, $plugin_class, $preferredLanguage) = @_;
    my $template = $self->get_template({ file => 'templates/disabled.tt' });
    my $css_template = $self->get_template({ file => 'css/template/disabled-css.tt' });
    my $css_content = $css_template->output();
    $template->param(
        enabled => 0,
        CLASS => $plugin_class,
        METHOD => 'tool',
        api_namespace => $self->api_namespace,
        disabled_css => $css_content,
        PLUGIN_DIR => $self->{plugin_dir},
        LANG => $preferredLanguage
    );
    return $template;
}
#
#
#
#   Prépare les données des thèmes pour l'affichage
#
sub _prepare_themes_for_display {
    my ($self, $all_themes) = @_;
    my @themes_list;
    my $now = DateTime->now();
    foreach my $theme_name (keys %$all_themes) {
        my $theme = $all_themes->{$theme_name};
        my $is_current = $self->_is_theme_current($theme, $now);
        my ($start_formatted, $end_formatted) = $self->_format_theme_dates($theme);
        my %elements_display;
        if (exists $theme->{elements}) {
            foreach my $element_name (keys %{ $theme->{elements} }) {
                my $element = $theme->{elements}{$element_name};
                $elements_display{$element_name} = {
                    enabled => $element->{enabled} // 'off',
                    options => $element->{options} // {}
                };
            }
        }
        push @themes_list, {
            theme_name => $theme_name,
            active => $theme->{active},
            is_current => $is_current,
            start_date => $theme->{start_date},
            end_date => $theme->{end_date},
            start_date_formatted => $start_formatted,
            end_date_formatted => $end_formatted,
            created_at => $theme->{created_at},
            elements => \%elements_display,
            elements_count => scalar keys %{$theme->{elements} // {}}
        };
    }
    return @themes_list;
}
#
#
#
#   Formate les dates d'un thème pour l'affichage
#
sub _format_theme_dates {
    my ($self, $theme) = @_;
    my $start_formatted = '';
    my $end_formatted = '';
    if ($theme->{start_date}) {
        my $start_dt = DateTime->from_epoch(epoch => $theme->{start_date});
        $start_formatted = $start_dt->strftime('%Y-%m-%dT%H:%M');
    }
    if ($theme->{end_date}) {
        my $end_dt = DateTime->from_epoch(epoch => $theme->{end_date});
        $end_formatted = $end_dt->strftime('%Y-%m-%dT%H:%M');
    }
    return ($start_formatted, $end_formatted);
}
#
#
#
#   Trie la liste des thèmes : actif en premier, puis par date
#
sub _sort_themes_list {
    my ($self, @themes_list) = @_;
    return sort {
        return -1 if $a->{is_current} && !$b->{is_current};
        return 1 if !$a->{is_current} && $b->{is_current};
        return $b->{start_date} <=> $a->{start_date};
    } @themes_list;
}
#
#
#
# permet de charger un aperçu de la page main de l'opac
#
sub opac_preview {
    my ($self, $args) = @_;
    my $cgi = $self->{cgi};
    my ( $template, $borrowernumber, $cookie ) = get_template_and_user(
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
    $html = $self->_clean_preview_html($html);
    output_html_with_http_headers($cgi, $cookie, $html);
}
#
#
#
#   Nettoie le HTML de l'aperçu en supprimant les éléments du plugin
#
sub _clean_preview_html {
    my ($self, $html) = @_;
    $html =~ s{<script[^>]+Celebrations-api[^>]*></script>}{}gis;
    $html =~ s{<link[^>]+Celebrations-api[^>]*>}{}gis;
    $html =~ s{<style[^>]+id=["']theme-inline-css["'][^>]*>.*?</style>}{}gis;
    $html =~ s{<!--.*?Celebrations.*?-->}{}gis;
    return $html;
}
#
#
#
#   Sert les fichiers CSS et JS du thème actif au sein de l'aperçu OPAC (iframe).
#
sub preview_theme_asset {
    my ($self) = @_;
    my $cgi = CGI->new;
    my $type = $cgi->param('type');
    my $theme = $cgi->param('theme');
    my $file = $cgi->param('file');
    return $self->output_html("Invalid params")
      unless $type =~ /^(css|js)$/ && $theme =~ /^[A-Za-z0-9_-]+$/ && $file =~ /^[A-Za-z0-9_-]+$/;
    my $path = $self->{plugin_dir} . "/Celebrations/$type/$theme/$file.$type";
    if (-e $path) {
        $self->_serve_asset_file($cgi, $path, $type);
    } else {
        print $cgi->header(-status => 404, -type => 'text/plain');
        print "File not found";
        exit;
    }
}
#
#
#
#   Sert un fichier asset (CSS ou JS)
#
sub _serve_asset_file {
    my ($self, $cgi, $path, $type) = @_;
    open my $fh, '<:raw', $path or return $self->output_html("Can't open file");
    local $/;
    my $content = <$fh>;
    close $fh;
    print $cgi->header(
        -type => $type eq 'css' ? 'text/css' : 'application/javascript',
        -charset => 'utf-8'
    );
    print $content;
    exit;
}
#
#
#
#   Gère la désinstallation du plugin
#
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