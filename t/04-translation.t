use strict;
use warnings;
use Test::More;
use Cwd 'abs_path';
use File::Spec;
use File::Basename 'dirname';
use JSON::MaybeXS;
# --- Chemins ---
my $plugin_dir = abs_path(dirname(__FILE__) . '/../Koha/Plugin/Celebrations');
my $lang_dir   = File::Spec->catdir($plugin_dir, 'i18n');
my $config_file = File::Spec->catfile($plugin_dir, 'config', 'theme-config.json');
BAIL_OUT("Language directory not found: $lang_dir") unless -d $lang_dir;
BAIL_OUT("Config file not found: $config_file") unless -f $config_file;
my ($default_file) = glob(File::Spec->catfile($lang_dir, 'default.inc'));
BAIL_OUT("default.inc not found") unless $default_file;
my @other_files = grep { $_ ne $default_file } glob(File::Spec->catfile($lang_dir, '*.inc'));
#
#  Ce test vérifie l'intégrité et la cohérence des fichiers de configuration et de langue
#  pour le plugin Koha::Plugin::Celebrations.
#
#  Il effectue plusieurs vérifications :
#  1. Vérifie que le répertoire de langues et le fichier theme-config.json existent.
#  2. Charge et parse le fichier default.inc, qui sert de référence pour toutes les traductions.
#  3. Pour chaque fichier de langue supplémentaire (*.inc), il vérifie :
#     - Que le fichier est correctement évalué en HASH Perl.
#     - Que toutes les sections T, D et B existent.
#     - Que toutes les clés présentes dans default.inc sont aussi présentes dans le fichier testé.
#  4. Vérifie que pour chaque thème et chaque élément défini dans theme-config.json :
#     - Le "setting" de l'élément existe dans la section T correspondante du fichier de langue.
#     - Pour chaque extra_option de l'élément (sauf type "ignore") :
#       * L'option est présente dans la section T du fichier de langue.
#       * Si l'option a un "option_type", la section correspondante existe aussi dans T.
#
#  Objectif :
#    - Assurer que toutes les traductions nécessaires sont présentes pour chaque thème et élément.
#    - Éviter les erreurs liées à des clés manquantes ou des sections absentes dans les fichiers de langue.
#    - Garantir la compatibilité entre la configuration JSON et les fichiers de langue utilisés par le plugin.
#
#
# --- Charger default.inc ---
my $default_data;
{
    local $/;
    open my $fh, '<', $default_file or BAIL_OUT("Can't open $default_file: $!");
    my $text = <$fh>;
    close $fh;
    $text =~ s/^\[%\s*|\s*%\]$//g;
    $text = "my \$data = { $text };";
    $default_data = eval $text;
    BAIL_OUT("default.inc failed to eval: $@") if $@;
}
ok(ref $default_data eq 'HASH', "default.inc loaded");
# --- Fonction récursive pour vérifier clés et options ---
sub check_keys {
    my ($default, $actual, $path) = @_;
    for my $key (keys %$default) {
        my $full_path = $path ? "$path.$key" : $key;
        if (!exists $actual->{$key}) {
            fail("Missing key: $full_path");
        } elsif (ref $default->{$key} eq 'HASH') {
            check_keys($default->{$key}, $actual->{$key}, $full_path);
        } elsif (ref $default->{$key} eq 'ARRAY') {
            my %default_keys = map { $_->{key} => 1 } @{ $default->{$key} };
            my %actual_keys  = map { $_->{key} => 1 } @{ $actual->{$key} };
            for my $k (keys %default_keys) {
                fail("Missing key in array $full_path: $k") unless exists $actual_keys{$k};
            }
        }
    }
}
# --- Charger le theme-config.json ---
open my $cfg_fh, '<', $config_file or BAIL_OUT("Can't open $config_file: $!");
my $json_text = do { local $/; <$cfg_fh> };
close $cfg_fh;
my $config_data = decode_json($json_text);
# --- Tester les fichiers de langue ---
foreach my $file (@other_files) {
    subtest "Testing $file" => sub {
        local $/;
        my $data;
        open my $fh, '<', $file or do { fail("Can't open $file: $!"); return };
        my $text = <$fh>;
        close $fh;
        $text =~ s/^\[%\s*|\s*%\]$//g;
        $text = "my \$data = { $text };";
        $data = eval $text;
        if ($@) {
            fail("Eval failed: $@");
            return;
        }
        ok(ref $data eq 'HASH', "File loaded as HASH: $file");
        for my $section (qw(T D B)) {
            ok(exists $data->{$section}, "$section exists in $file");
            check_keys($default_data->{$section}, $data->{$section}, $section);
        }
        # --- Vérifier les settings dans le JSON ---
        for my $theme (keys %$config_data) {
            my $theme_section = $config_data->{$theme}->{elements};
            for my $elem (keys %$theme_section) {
                my $setting = $theme_section->{$elem}->{setting};
                ok(exists $data->{T}->{$theme}->{$setting}, "Setting '$setting' exists in T->{$theme}");
                if (exists $theme_section->{$elem}->{extra_options}) {
                    for my $opt (keys %{ $theme_section->{$elem}->{extra_options} }) {
                        my $opt_data = $theme_section->{$elem}->{extra_options}->{$opt};
                        # --- IGNORER les options de type "ignore" ---
                        next if $opt_data->{type} && $opt_data->{type} eq 'ignore';
                        my $opt_setting = $opt_data->{type} eq 'select'
                                          ? $opt_data->{option_type}
                                          : $opt;
                        ok(exists $data->{T}->{$theme}->{$opt}, "Extra option '$opt' exists in T->{$theme}");
                        # Vérifie que la sous-section option_type existe
                        if ($opt_data->{option_type}) {
                            my $otype = $opt_data->{option_type};
                            ok(exists $data->{T}->{$otype}, "Option type section '$otype' exists in T");
                        }
                    }
                }
            }
        }
    };
}
done_testing();
