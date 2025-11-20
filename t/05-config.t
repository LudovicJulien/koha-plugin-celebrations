use strict;
use warnings;
use Test::More;
use Cwd 'abs_path';
use File::Spec;
use File::Basename 'dirname';
use JSON::MaybeXS;
use JSON::Validator;
# --- Chemins ---
my $plugin_dir   = abs_path(dirname(__FILE__) . '/../Koha/Plugin/Celebrations');
my $config_file  = File::Spec->catfile($plugin_dir, 'config', 'theme-config.json');
my $schema_file  = File::Spec->catfile($plugin_dir, 'config', 'theme-config.schema.json');
BAIL_OUT("Config file not found: $config_file") unless -f $config_file;
BAIL_OUT("Schema file not found: $schema_file") unless -f $schema_file;
#
#  Ce test vérifie l'intégrité et la validité du fichier theme-config.json
#  du plugin Koha::Plugin::Celebrations, ainsi que la présence des fichiers CSS/JS associés.
#
#  Vérifications effectuées :
#  1. Vérifie que le fichier theme-config.json et le schéma theme-config.schema.json existent.
#  2. Charge et parse le fichier JSON de configuration et s'assure qu'il est bien un HASH Perl.
#  3. Valide la configuration contre le schéma JSON :
#     - Vérifie que toutes les clés obligatoires sont présentes.
#     - Vérifie que les types des valeurs correspondent aux types définis dans le schéma (string, integer, etc.).
#     - Vérifie que les valeurs correspondant à des enum respectent exactement les valeurs autorisées.
#  4. Pour chaque thème et chaque élément :
#     - Vérifie que l'élément a un type valide : 'css', 'js' ou 'both'.
#     - Vérifie la présence des fichiers associés selon le type :
#       * 'css' : le fichier CSS doit exister, le fichier JS ne doit pas exister.
#       * 'js'  : le fichier JS doit exister, le fichier CSS ne doit pas exister.
#       * 'both': les fichiers CSS et JS doivent exister.
#  5. Pour chaque extra_option de l'élément :
#     - Vérifie que la clé 'type' est présente.
#     - Pour type 'ignore' : aucune vérification supplémentaire.
#     - Pour type 'range' : vérifie la présence des clés min, max, default et que leurs valeurs sont des entiers.
#     - Pour type 'select': vérifie la présence de 'option_type' et que sa valeur est une chaîne valide.
#
#  Objectif :
#    - Assurer que la configuration JSON est complète et valide selon le schéma.
#    - Garantir que tous les fichiers CSS et JS nécessaires pour chaque thème et élément existent.
#    - Éviter les erreurs à l'exécution liées à des fichiers manquants ou à une configuration incorrecte.
#
#
# --- Charger theme-config.json ---
my $config_data;
{
    open my $fh, '<', $config_file or BAIL_OUT("Can't open $config_file: $!");
    local $/;
    my $text = <$fh>;
    close $fh;
    $config_data = decode_json($text);
    ok(ref $config_data eq 'HASH', "Config JSON loaded");
}
# --- Charger le schema ---
my $validator = JSON::Validator->new;
$validator->schema($schema_file);
# --- Valider la config contre le schema ---
my $errors = $validator->validate($config_data, { return => 'errors' });
if ($errors && ref $errors eq 'ARRAY' && @$errors) {
    for my $e (@$errors) {
        fail("Schema validation error: " . $e->{message});
    }
} else {
    pass("Config JSON conforms to schema");
}
# --- Vérification supplémentaire pour enum et types exacts + fichiers ---
for my $theme (keys %$config_data) {
    my $elements = $config_data->{$theme}->{elements};
    ok(ref $elements eq 'HASH', "Theme '$theme' has elements hash");
    for my $elem_name (keys %$elements) {
        my $elem = $elements->{$elem_name};
        # Vérifier le type de l'élément
        if (exists $elem->{type}) {
            ok($elem->{type} =~ /^(both|js|css)$/, "Element '$elem_name' in theme '$theme' has valid type '$elem->{type}'");
        }
        # --- Vérification des fichiers ---
        my $file_base = $elem->{file};
        my $css_file = File::Spec->catfile($plugin_dir, 'css', $theme, "$file_base.css");
        my $js_file  = File::Spec->catfile($plugin_dir, 'js', $theme, "$file_base.js");
        if ($elem->{type} eq 'css') {
            ok(-f $css_file, "CSS file exists for '$elem_name' in theme '$theme'");
            ok(!-f $js_file, "JS file should NOT exist for '$elem_name' with type 'css'");
        }
        elsif ($elem->{type} eq 'js') {
            ok(-f $js_file, "JS file exists for '$elem_name' in theme '$theme'");
            ok(!-f $css_file, "CSS file should NOT exist for '$elem_name' with type 'js'");
        }
        elsif ($elem->{type} eq 'both') {
            ok(-f $css_file, "CSS file exists for '$elem_name' in theme '$theme'");
            ok(-f $js_file,  "JS file exists for '$elem_name' in theme '$theme'");
        }
        # Vérifier les extra_options
        if (exists $elem->{extra_options}) {
            for my $opt_name (keys %{ $elem->{extra_options} }) {
                my $opt = $elem->{extra_options}->{$opt_name};
                ok(exists $opt->{type}, "Extra option '$opt_name' in element '$elem_name' has 'type'");

                if ($opt->{type} eq 'ignore') {
                    pass("Extra option '$opt_name' is type 'ignore', skipping further checks");
                    next;
                }
                elsif ($opt->{type} eq 'range') {
                    for my $r (qw(min max default)) {
                        ok(exists $opt->{$r}, "Extra option '$opt_name' range has '$r'");
                        ok($opt->{$r} =~ /^\d+$/, "Extra option '$opt_name' range '$r' is integer");
                    }
                }
                elsif ($opt->{type} eq 'select') {
                    ok(exists $opt->{option_type}, "Extra option '$opt_name' select has 'option_type'");
                    ok($opt->{option_type} =~ /^\w+$/, "Extra option '$opt_name' option_type is string");
                }
                else {
                    fail("Extra option '$opt_name' has invalid type '$opt->{type}'");
                }
            }
        }
    }
}
done_testing();
