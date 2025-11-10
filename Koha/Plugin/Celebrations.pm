package Koha::Plugin::Celebrations;
use Modern::Perl;
use base qw(Koha::Plugins::Base);
use C4::Context;
use URI::Escape;
use JSON;
use Koha::Plugins;
use C4::Languages;
use File::Slurp;
use File::Basename;
use Cwd 'abs_path';
use JSON;
use DateTime::Format::Strptime;
#
#
#
#   Informations de base sur le plugin (métadonnées utilisées par Koha)
#
our $metadata = {
    name   => 'Celebrations',
    author => 'Ludovic Julien',
    description => 'Un OPAC pour chaque saison.',
    date_authored => '2025-09-09',
    date_updated    => '2025-11-07',
    version => '0.9.4',
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
    my $plugin_pm_path = abs_path(__FILE__);
    my $plugin_dir     = dirname($plugin_pm_path);
    my $config_path    = "$plugin_dir/Celebrations/config/theme-config.json";
    if (-e $config_path) {
        my $json_text = read_file($config_path, binmode => ':utf8');
        my $theme_config = decode_json($json_text);
        $self->{json_config} = $json_text;
        $self->{themes_config} = $theme_config;
        $self->{plugin_dir} = $plugin_dir;
    } else {
        warn "[Celebrations] Config file not found: $config_path";
        $self->{themes_config} = {};
        $self->{plugin_dir} = $plugin_dir;
    }
    return $self;
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
    my $themes = decode_json($themes_data);
    my $now = DateTime->now();
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
    my $themes = decode_json($themes_data);
    return $themes->{$theme_name} // undef;
}
#
#
#
#   envoie le CSS à l'OPAC (en inline pour éviter le temps de chargement long)
#
sub opac_head {
    my ($self) = @_;
    my $theme = $self->retrieve_data("selected_theme");
    return '' unless exists $self->{themes_config}{$theme} && exists $self->{plugin_dir};
    my $plugin_dir     = $self->{plugin_dir};
    my $conf       = $self->{themes_config}{$theme};
    my $extra_css = '';
    my $font_link = $conf->{font_url} // '';
    if (exists $conf->{elements}) {
        foreach my $element (keys %{ $conf->{elements} }) {
            my $setting = $conf->{elements}{$element}{setting};
            my $css_file = $self->_get_asset_path('css', $theme, $conf->{elements}{$element}{file});
            my $status = $self->retrieve_data($setting) // 'off';
            if ($status eq 'on' && -e $css_file) {
                $extra_css .= read_file($css_file, binmode => ':utf8');
            }
        }
    }
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
#   envoie le js a l'OPAC
#
sub opac_js {
    my ($self) = @_;
    my $theme = $self->retrieve_data("selected_theme") // 'null';
    return '' unless exists $self->{themes_config}{$theme} && exists $self->{plugin_dir};
    my $plugin_dir     = $self->{plugin_dir};
    my $conf       = $self->{themes_config}{$theme};
    my $script_options = '';
    my @js_tags;
    if (exists $conf->{elements}) {
        my %js_options;
        foreach my $element (keys %{ $conf->{elements} }) {
            my $setting = $conf->{elements}{$element}{setting};
            my $status  = $self->retrieve_data($setting) // 'off';
            next unless $status eq 'on';
            if (exists $conf->{elements}{$element}{extra_options}) {
                foreach my $opt_key (keys %{ $conf->{elements}{$element}{extra_options} }) {
                    $js_options{$opt_key} = $self->retrieve_data($opt_key);
                }
            }
            my $element_file = $conf->{elements}{$element}{file};
            my $element_js_file = $self->_get_asset_path('js', $theme, $element_file);
            if (-e $element_js_file) {
                my $api_ns = $self->api_namespace;
                push @js_tags, qq{
                    <script src="/api/v1/contrib/$api_ns/static/js/$theme/$element_file.js"></script>
                };
            } else {
                warn "[Celebrations] Fichier JS manquant pour l’element '$element' : $element_js_file";
            }
        }
        if (%js_options) {
            my $json_opts = encode_json(\%js_options);
            $script_options = qq{
                <script>
                     window["${theme}ThemeOptions"] = $json_opts;
                </script>
            };
        }
    }
    return "$script_options\n" . join("\n", @js_tags);
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
    unless ($start_date && $start_date ne 'null' && $end_date && $end_date ne 'null') {
       print to_json({
            success => JSON::false,
            message   => 'Les dates de début et de fin sont obligatoires'
        });
        return;
    }
    my $strp = DateTime::Format::Strptime->new(
        pattern   => '%Y-%m-%d',
        time_zone => 'local',
    );
    my $start_dt = $strp->parse_datetime($start_date);
    my $end_dt   = $strp->parse_datetime($end_date);
    unless ($start_dt && $end_dt) {
        print to_json({
            success => JSON::false,
            message => 'Format de date invalide'
        });
        return;
    }
    if ($start_dt >= $end_dt) {
        print to_json({
            success => JSON::false,
            message => 'La date de début doit être avant la date de fin'
        });
        return;
    }
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
                print to_json({
                    success => JSON::false,
                    message => "Conflit de dates avec le thème '$existing_theme_name'"
                });
                return;
            }
        }
    }
    my %theme_data = (
        theme_name => $theme_name,
        active => 1,
        start_date => $start_dt->epoch,
        end_date => $end_dt->epoch,
        created_at => time(),
        elements => {}
    );
    if (exists $self->{themes_config}{$theme_name} &&
        exists $self->{themes_config}{$theme_name}{elements}) {
        my $base_elements = $self->{themes_config}{$theme_name}{elements};
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
    }
    $themes->{$theme_name} = \%theme_data;
    $self->store_data({ themes_data => encode_json($themes) });
    print to_json({
        success => JSON::true,
        theme => $theme_name,
        message => "Thème '$theme_name' activé du " . $start_date . " au " . $end_date
    });
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
        my $themes = decode_json($themes_data);
        if (exists $themes->{$theme_name}) {
            delete $themes->{$theme_name};
            $self->store_data({ themes_data => encode_json($themes) });
            print encode_json({
                success => JSON::true,
                theme   => $theme_name,
                message => "Thème supprimé avec succès"
            });
        } else {
            print encode_json({
                success => JSON::false,
                error   => "Thème '$theme_name' non trouvé"
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
    my $themes = $themes_data ? decode_json($themes_data) : {};
    my $now = DateTime->now();
    my @theme_list;
    foreach my $theme_name (keys %$themes) {
        my $theme = $themes->{$theme_name};
        my $is_current = 0;
        if ($theme->{active} && $theme->{start_date} && $theme->{end_date}) {
            my $start = DateTime->from_epoch(epoch => $theme->{start_date});
            my $end = DateTime->from_epoch(epoch => $theme->{end_date});
            $is_current = ($now >= $start && $now <= $end) ? 1 : 0;
        }
        push @theme_list, {
            name => $theme_name,
            active => $theme->{active},
            is_current => $is_current,
            start_date => $theme->{start_date},
            end_date => $theme->{end_date},
            created_at => $theme->{created_at}
        };
    }
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
#   Gère l'interface de l'intranet
#
sub tool {
    my ($self, $args) = @_;
    my $cgi = $self->{cgi};
    my $template;
    my $plugin_class = ref $self;
    my $plugin_name  = $metadata->{name} // $plugin_class;
    my $plugin_dir       = $self->{plugin_dir};
    my $theme_config     = $self->{themes_config};
    my $theme_config_json = encode_json($theme_config);
    my $preferredLanguage = C4::Languages::getlanguage();
    if ($self->is_enabled) {
        my $koha_session = $cgi->cookie('KohaSession') // $cgi->param('koha_session');
        $template = $self->get_template({ file =>  'templates/homeTheme.tt' });
        # Récupère le thème actuellement actif
        my $active_theme = $self->_get_active_theme();
        # Récupère tous les thèmes programmés
        my $themes_data = $self->retrieve_data('themes_data');
        my $all_themes = $themes_data ? decode_json($themes_data) : {};
        # Prépare les données des thèmes pour l'affichage
        my @themes_list;
        my $now = DateTime->now();
        foreach my $theme_name (keys %$all_themes) {
            my $theme = $all_themes->{$theme_name};
            my $is_current = 0;
            if ($theme->{active} && $theme->{start_date} && $theme->{end_date}) {
                my $start = DateTime->from_epoch(epoch => $theme->{start_date});
                my $end = DateTime->from_epoch(epoch => $theme->{end_date});
                $is_current = ($now >= $start && $now <= $end) ? 1 : 0;
            }
            # Formater les dates pour l'affichage
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
            push @themes_list, {
                theme_name => $theme_name,
                active => $theme->{active},
                is_current => $is_current,
                start_date => $theme->{start_date},
                end_date => $theme->{end_date},
                start_date_formatted => $start_formatted,
                end_date_formatted => $end_formatted,
                created_at => $theme->{created_at},
                elements_count => scalar keys %{$theme->{elements} // {}}
            };
        }
        use Data::Dumper;
        warn Dumper(@themes_list);
        # Trier les thèmes : actif en premier, puis par date
        @themes_list = sort {
            return -1 if $a->{is_current} && !$b->{is_current};
            return 1 if !$a->{is_current} && $b->{is_current};
            return $b->{start_date} <=> $a->{start_date};
        } @themes_list;
        my $themes_list_json = encode_json(\@themes_list);
        # Prépare les paramètres du template
        $template->param(
            enabled         => 1,
            CLASS           => $plugin_class,
            METHOD          => 'tool',
            plugin_name     => $plugin_name,
            plugin_class    => $plugin_class,
            api_namespace   => $self->api_namespace,
            koha_session    => $koha_session,
            active_theme    => $active_theme,
            all_themes      => \@themes_list,
            themes_list_json => $themes_list_json,
            theme_config_json => $theme_config_json,
            theme_config => $theme_config,
            PLUGIN_DIR => $plugin_dir,
            LANG       => $preferredLanguage,
        );
    }
    else {
        $template = $self->get_template({ file =>  'templates/disabled.tt' });
        my $css_template = $self->get_template({ file => 'css/template/disabled-css.tt' });
        my $css_content  = $css_template->output();
        $template->param(
            enabled       => 0,
            CLASS         => $plugin_class,
            METHOD        => 'tool',
            api_namespace => $self->api_namespace,
            disabled_css  => $css_content,
            PLUGIN_DIR => $plugin_dir,
            LANG       => $preferredLanguage
        );
    }
    print $cgi->header(-type => 'text/html', -charset => 'utf-8');
    print $template->output();
}
#
#
#
# permet de charger un aperçu de la page main de l'opac
#
sub opac_preview {
    my ($self, $args) = @_;
    my $cgi = $self->{cgi};
    use C4::Auth qw(get_template_and_user);
    use C4::Output qw(output_html_with_http_headers);
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
        message     => "Aperçu OPAC généré depuis le plugin Celebrations ✨",
        is_preview  => 1,
    );
    my $html = $template->output;
    # Supprime les <script> pointant vers Celebrations-api
    $html =~ s{<script[^>]+Celebrations-api[^>]*></script>}{}gis;
    # Supprime les <link> CSS du plugin Celebrations
    $html =~ s{<link[^>]+Celebrations-api[^>]*>}{}gis;
    # Supprime la balise <style id="theme-inline-css"> ... </style>
    $html =~ s{<style[^>]+id=["']theme-inline-css["'][^>]*>.*?</style>}{}gis;
    # Optionnel : nettoyage des commentaires HTML générés par le plugin
    $html =~ s{<!--.*?Celebrations.*?-->}{}gis;
    # Retourne le HTML nettoyé
    output_html_with_http_headers($cgi, $cookie, $html);
}
sub serve_asset {
    my ($self) = @_;
    my $cgi = CGI->new;
    my $type = $cgi->param('type'); # css ou js
    my $theme = $cgi->param('theme');
    my $file = $cgi->param('file');
    # Validation basique (évite l'injection)
    return $self->output_html("Invalid params")
      unless $type =~ /^(css|js)$/ && $theme =~ /^[A-Za-z0-9_-]+$/ && $file =~ /^[A-Za-z0-9_-]+$/;
    my $path = $self->{plugin_dir} . "/Celebrations/$type/$theme/$file.$type";
    if (-e $path) {
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
    } else {
        print $cgi->header(-status => 404, -type => 'text/plain');
        print "File not found";
        exit;
    }
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