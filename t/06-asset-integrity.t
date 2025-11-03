# use strict;
# use warnings;
# use Test::More;
# use JSON;
# use File::Slurp;
# use Cwd 'abs_path';
# use File::Basename;
# use File::Spec;
# #
# #
# #
# my $plugin_pm_path = abs_path(dirname(__FILE__) . '/../Koha/Plugin/Celebrations.pm');
# my $plugin_dir = dirname($plugin_pm_path);
# my $base_asset_path = File::Spec->catdir($plugin_dir, 'Celebrations');
# my $theme_config = decode_json(read_file(File::Spec->catfile($base_asset_path, 'config', 'theme-config.json')));
# my $css_api = decode_json(read_file(File::Spec->catfile($base_asset_path, 'api', 'css.json')));
# my $js_api = decode_json(read_file(File::Spec->catfile($base_asset_path, 'api', 'js.json')));
# my $images_api = decode_json(read_file(File::Spec->catfile($base_asset_path, 'api', 'images.json')));
# subtest 'Assets in API configuration must exist on disk' => sub {
#     my @api_assets = (keys %$css_api, keys %$js_api, keys %$images_api);
#     plan tests => scalar @api_assets;
#     foreach my $asset_path (@api_assets) {
#         my $full_path = File::Spec->catfile($base_asset_path, $asset_path);
#         ok(-e $full_path, "Asset from API config exists on disk: $asset_path");
#     }
# };
# subtest 'Assets in theme-config must be declared in API config and exist' => sub {
#     my @elements_to_test;
#     foreach my $theme (keys %$theme_config) {
#         foreach my $element (keys %{ $theme_config->{$theme}{elements} }) {
#             my $file_base = $theme_config->{$theme}{elements}{$element}{file};
#             # An element can have a CSS file, a JS file, or both.
#             # We check for both possibilities.
#             push @elements_to_test, { theme => $theme, file_base => $file_base, type => 'css' };
#             push @elements_to_test, { theme => $theme, file_base => $file_base, type => 'js' };
#         }
#     }
#     plan tests => scalar @elements_to_test;
#     foreach my $elem (@elements_to_test) {
#         my $path = sprintf("%s/%s/%s.%s", $elem->{type}, $elem->{theme}, $elem->{file_base}, $elem->{type});
#         my $full_disk_path = File::Spec->catfile($base_asset_path, $path);
#         if (-e $full_disk_path) {
#             my $api_ref = ($elem->{type} eq 'css') ? $css_api : $js_api;
#             ok(exists $api_ref->{$path}, "[$elem->{theme}] Asset '$path' exists and is declared in API config");
#         } else {
#             pass("[$elem->{theme}] Asset '$path' does not exist, skipping API check (as expected)");
#         }
#     }
# };
# done_testing();
