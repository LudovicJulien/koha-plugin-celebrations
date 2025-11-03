use strict;
use warnings;
use Test::More;
use File::Spec;
use Cwd 'abs_path';
use File::Basename;
#
#   Ce test vérifie la cohérence et la complétude des fichiers de traduction du plugin Koha::Plugin::Celebrations.
#   Il s’assure que chaque fichier de langue (.inc) compile correctement et contient toutes les clés définies dans le fichier
#   de référence default.inc. En cas de clé manquante, le test signale les traductions absentes pour la langue concernée.
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
plan tests => scalar(@other_lang_files);
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
done_testing();
