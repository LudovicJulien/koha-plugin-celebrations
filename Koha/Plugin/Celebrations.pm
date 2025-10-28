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
#
#
#
#   Informations de base sur le plugin (métadonnées utilisées par Koha)
#
our $VERSION = '0.9.3';
our $metadata = {
    name   => 'Celebrations',
    author => 'Ludovic Julien',
    description => 'Un OPAC pour chaque saison.',
    date_authored => '2025-09-09',
    date_updated    => '2025-09-15',
    version => $VERSION,
    minimum_version => '24.05',
};
#
#
#
#   Constructeur du plugin (initialise avec les métadonnées)
#
sub new {
    my ($class, $args) = @_;
    $args->{metadata} = $metadata;
    return $class->SUPER::new($args);
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
#   envoie le CSS à l'OPAC (en inline pour éviter le temps de chargement long)
#
sub opac_head {
    my ($self) = @_;
    my $theme = $self->retrieve_data("selected_theme");
    my $plugin_pm_path = abs_path(__FILE__);
    my $plugin_dir = dirname($plugin_pm_path);
    my $config_path = "$plugin_dir/Celebrations/config/theme_config.json";
    my $base_css = "$plugin_dir/Celebrations/css/$theme/$theme.css";
    return '' unless -e $base_css;
    my $json_text = read_file($config_path, binmode => ':utf8');
    my $theme_config = decode_json($json_text);
    return '' unless exists $theme_config->{$theme};
    my $conf = $theme_config->{$theme};
    my $css_content = read_file($base_css, binmode => ':utf8');
    my $extra_css = '';
    my $font_link = $conf->{font_url} // '';
    if (exists $conf->{elements}) {
        foreach my $element (keys %{ $conf->{elements} }) {
            my $setting = $conf->{elements}{$element}{setting};
            my $css_file = "$plugin_dir/Celebrations/css/$theme/$conf->{elements}{$element}{file}.css";
            my $status = $self->retrieve_data($setting) // 'off';
            if ($status eq 'on' && -e $css_file) {
                $extra_css .= read_file($css_file, binmode => ':utf8');
            }
        }
    }
    return qq{
        <link href="$font_link" rel="stylesheet">
        <style id="theme-inline-css">
        $css_content
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
    return '' if $theme eq 'null';
    my $plugin_pm_path = abs_path(__FILE__);
    my $plugin_dir     = dirname($plugin_pm_path);
    my $config_path    = "$plugin_dir/Celebrations/config/theme_config.json";
    my $json_text = read_file($config_path, binmode => ':utf8');
    my $theme_config = decode_json($json_text);
    return '' unless exists $theme_config->{$theme};
    my $conf = $theme_config->{$theme};
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
            my $element_js_file = "$plugin_dir/Celebrations/js/$theme/$element_file.js";
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
    my $js_file = "$plugin_dir/Celebrations/js/$theme/$theme.js";
    if (-e $js_file) {
        my $api_ns = $self->api_namespace;
        push @js_tags, qq{
            <script id="theme-js" src="/api/v1/contrib/$api_ns/static/js/$theme/$theme.js"></script>
        };
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
    my $theme = $cgi->param('theme');
    my %data = ( selected_theme => $theme );
    my $plugin_pm_path = abs_path(__FILE__);
    my $plugin_dir     = dirname($plugin_pm_path);
    my $config_path    = "$plugin_dir/Celebrations/config/theme_config.json";
    my $json_text = read_file($config_path, binmode => ':utf8');
    my $theme_config = decode_json($json_text);
    if (exists $theme_config->{$theme} && exists $theme_config->{$theme}{elements}) {
        my $conf = $theme_config->{$theme}{elements};
        foreach my $element (keys %$conf) {
            my $setting = $conf->{$element}{setting};
            $data{$setting} = $cgi->param($setting) // 'off';
            if (exists $conf->{$element}{extra_options}) {
                foreach my $opt_key (keys %{ $conf->{$element}{extra_options} }) {
                    my $opt_val = $cgi->param($opt_key);
                    $opt_val = $self->api_namespace if $opt_key eq 'api_namespace';
                    $opt_val //= 'off';
                    $data{$opt_key} = $opt_val;
                }
            }
        }
    }
    $self->store_data(\%data, { flatten => 0 });
    print $cgi->header('application/json');
    print to_json({ success => JSON::true, theme => $theme });
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
    my $plugin_pm_path = abs_path(__FILE__);
    my $plugin_dir     = dirname($plugin_pm_path);
    my $config_path    = "$plugin_dir/Celebrations/config/theme_config.json";
    my $json_text      = read_file($config_path, binmode => ':utf8');
    my $theme_config   = decode_json($json_text);
    my $theme_config_json = encode_json($theme_config);
    my $theme_config_hash = decode_json($json_text);
    my $selected_theme = $self->retrieve_data("selected_theme") // 'null';
    my $preferredLanguage = C4::Languages::getlanguage();
    if ($self->is_enabled) {
        my $koha_session = $cgi->cookie('KohaSession') // $cgi->param('koha_session');
        $template = $self->get_template({ file =>  'templates/homeTheme.tt' });
        my %theme_data;
        if ($selected_theme ne 'null' && exists $theme_config->{$selected_theme}{elements}) {
            foreach my $element (keys %{ $theme_config->{$selected_theme}{elements} }) {
                my $setting = $theme_config->{$selected_theme}{elements}{$element}{setting};
                $theme_data{$setting} = $self->retrieve_data($setting) // 'off';
            }
        }
        $template->param(
            enabled         => 1,
            CLASS           => $plugin_class,
            METHOD          => 'tool',
            plugin_name     => $plugin_name,
            plugin_class    => $plugin_class,
            api_namespace   => $self->api_namespace,
            koha_session    => $koha_session,
            selected_theme  => $selected_theme,
            theme_config_json => $theme_config_json,
            theme_config => $theme_config_hash,
            PLUGIN_DIR => $plugin_dir,
            LANG       => $preferredLanguage,
            %theme_data,
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