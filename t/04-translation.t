use strict;
use warnings;
use Test::More;
use File::Spec;
use Cwd 'abs_path';
use File::Basename;
use JSON;
#
#   Ce test vérifie la cohérence et la complétude des fichiers de traduction du plugin Koha::Plugin::Celebrations.
#   Il s’assure que chaque fichier de langue (.inc) compile correctement et contient toutes les clés définies dans le fichier
#   de référence default.inc. En cas de clé manquante, le test signale les traductions absentes pour la langue concernée.
#   Il vérifie aussi que les clés de "setting" dans theme-config.json sont présentes dans tous les fichiers de langue.
#
my $plugin_pm_path = abs_path(dirname(__FILE__) . '/../Koha/Plugin/Celebrations.pm');
my $plugin_dir = dirname($plugin_pm_path);
my $lang_dir = File::Spec->catdir($plugin_dir, 'Celebrations', 'lang');
BAIL_OUT("Language directory not found") unless -d $lang_dir;
my @lang_files = glob(File::Spec->catfile($lang_dir, '*.inc'));
my ($default_lang_file) = grep { /default\.inc$/ } @lang_files;
my @other_lang_files = grep { !/default\.inc$/ } @lang_files;
BAIL_OUT("Could not find default.inc") unless $default_lang_file;
my $default_strings;
eval { $default_strings = do $default_lang_file; };
BAIL_OUT("Default language file ($default_lang_file) failed to compile: $@") if $@;
my %default_keys = map { $_ => 1 } keys %$default_strings;
plan tests => scalar(@other_lang_files) + 1;
foreach my $lang_file (@other_lang_files) {
    my ($volume, $directories, $filename) = File::Spec->splitpath($lang_file);
    my $lang_code = $filename;
    $lang_code =~ s/\.inc$//;
    subtest "Testing language: $lang_code" => sub {
        my $lang_strings;
        eval { $lang_strings = do $lang_file; };
        ok(!$@, "Language file '$filename' compiles correctly") or return;
        my @missing_keys;
        foreach my $key (keys %default_keys) {
            unless (exists $lang_strings->{$key}) {
                push @missing_keys, $key;
            }
        }
        is(scalar(@missing_keys), 0, "All strings from default.inc are translated in '$filename'")
            or diag "Missing translations in '$filename' for keys: " . join(', ', @missing_keys);
    };
}
# Vérifie que les settings du theme-config.json sont bien dans les fichiers de langue
subtest "Check theme-config settings are defined in all language files" => sub {
    my $config_file = File::Spec->catfile($plugin_dir, 'Celebrations', 'config', 'theme-config.json');
    BAIL_OUT("Theme config file not found at $config_file") unless -f $config_file;
    my $json_text = do {
        local $/;
        open my $fh, '<:utf8', $config_file or die "Can't open $config_file: $!";
        <$fh>;
    };
    my $config = eval { decode_json($json_text) };
    BAIL_OUT("Failed to decode theme-config.json: $@") if $@;
    plan tests => scalar(@lang_files); # We test every lang file
    foreach my $lang_file (@lang_files) {
        my (undef, undef, $filename) = File::Spec->splitpath($lang_file);
        subtest "Testing settings for language: $filename" => sub {
            my $lang_data;
            eval { $lang_data = do $lang_file; };
            if($@) {
                fail("Language file '$filename' failed to compile: $@");
                return;
            }
            my $T = $lang_data->{T};
            BAIL_OUT("No 'T' hashref found in $filename") unless ($T && ref $T eq 'HASH');
            my @missing_keys;
            foreach my $theme_name (keys %$config) {
                my $elements = $config->{$theme_name}{elements};
                next unless ($elements && ref $elements eq 'HASH');

                foreach my $element_name (keys %$elements) {
                    my $setting_key = $elements->{$element_name}{setting};
                    next unless $setting_key;

                    # The key should exist in the hash for that theme, e.g., $T->{noel}->{couleur_noel}
                    unless (exists $T->{$theme_name} && ref $T->{$theme_name} eq 'HASH' && exists $T->{$theme_name}{$setting_key}) {
                        push @missing_keys, "$theme_name.$setting_key";
                    }
                }
            }
            is(scalar(@missing_keys), 0, "All settings from theme-config.json are defined in '$filename'")
                or diag "Missing translations in '$filename' for keys: " . join(', ', @missing_keys);
        };
    }
};
done_testing();