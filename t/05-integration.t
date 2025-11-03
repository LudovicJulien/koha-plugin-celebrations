# use strict;
# use warnings;
# use Test::More;
# use Test::MockModule;
# use Test::Output;
# use JSON;
# use File::Slurp;
# use Cwd 'abs_path';
# use File::Basename;
# use Koha::Plugin::Celebrations;
# use CGI;

# # --- SETUP ---
# my $plugin_pm_path = abs_path(dirname(__FILE__) . '/../Koha/Plugin/Celebrations.pm');
# my $plugin_dir = dirname($plugin_pm_path);
# my $config_path = "$plugin_dir/Celebrations/config/theme-config.json";
# ok(-e $config_path, "Theme configuration file found at $config_path");

# my $json_text = read_file($config_path, binmode => ':utf8');
# my $themes_config = decode_json($json_text);
# my @themes = keys %$themes_config;
# ok(@themes > 0, "Found " . scalar(@themes) . " themes in config file");

# my $plugin = Koha::Plugin::Celebrations->new();

# # --- TESTS ---

# subtest 'Admin interface renders all themes' => sub {
#     plan tests => 1 + scalar(@themes);

#     # --- Mock Koha internals ---
#     my $plugin_mock = Test::MockModule->new('Koha::Plugin::Celebrations');
#     $plugin_mock->redefine('retrieve_data', sub { return });

#     my $cgi = CGI->new();
#     my $cgi_mock = Test::MockModule->new('CGI');
#     $cgi_mock->redefine('new', sub { return $cgi });

#     my $auth_mock = Test::MockModule->new('C4::Auth');
#     $auth_mock->redefine('get_template_and_user', sub {
#         my ($template_path, $type, @rest) = @_;
#         my $template = bless { _params => {} }, 'Template';
#         return ($template, undef, $cgi);
#     });

#     $plugin->{cgi} = $cgi;
#     my ($stdout) = stdout_from(sub { $plugin->tool() });

#     like($stdout, qr/<select id="theme_select" name="theme">/, "HTML contains the theme selector dropdown");

#     foreach my $theme (@themes) {
#         like($stdout, qr/<option value="$theme"/, "Theme '$theme' is present in the admin dropdown");
#     }
# };

# # --- Vérifie l'injection des fichiers CSS et JS pour chaque thème et chaque élément ---
# foreach my $theme_name (@themes) {
#     my $theme_conf = $themes_config->{$theme_name};
#     my %stored_data;

#     subtest "Integration for theme: $theme_name" => sub {
#         plan tests => 2 + (2 * scalar(keys %{ $theme_conf->{elements} }));

#         # Mock store_data pour capturer les sauvegardes
#         my $plugin_mock = Test::MockModule->new('Koha::Plugin::Celebrations');
#         $plugin_mock->redefine('store_data', sub {
#             my ($self, $data_ref) = @_;
#             %stored_data = %$data_ref;
#             return 1;
#         });

#         # Active tous les éléments de ce thème
#         my %params = ( theme => [$theme_name] );
#         foreach my $element (keys %{ $theme_conf->{elements} }) {
#             my $setting = $theme_conf->{elements}{$element}{setting};
#             $params{$setting} = ['on'];
#         }

#         my $q = CGI->new(sub { return \%params; });
#         $plugin->{cgi} = $q;
#         stdout_from(sub { $plugin->apply_theme() });

#         is($stored_data{selected_theme}, $theme_name, "[$theme_name] apply_theme: Correctly saves selected theme");

#         # Mock retrieve_data pour simuler un thème actif
#         my $opac_mock = Test::MockModule->new('Koha::Plugin::Celebrations');
#         $opac_mock->redefine('retrieve_data', sub {
#             my ($self, $key) = @_;
#             return $theme_name if $key eq 'selected_theme';
#             return 'on'; # Tous activés
#         });

#         my $head_output = $plugin->opac_head();
#         my $js_output   = $plugin->opac_js();

#         # Vérifie que tous les fichiers CSS/JS du thème sont bien présents
#         foreach my $element (keys %{ $theme_conf->{elements} }) {
#             my $file = $theme_conf->{elements}{$element}{file};
#             like($head_output, qr/$file\.css/, "[$theme_name] opac_head: includes CSS '$file.css'");
#             like($js_output,   qr{$theme_name/$file\.js}, "[$theme_name] opac_js: includes JS '$file.js'");
#         }
#     };
# }

# done_testing();
