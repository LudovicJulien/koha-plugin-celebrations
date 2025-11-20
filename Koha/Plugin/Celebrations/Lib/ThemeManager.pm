package Koha::Plugin::Celebrations::Lib::ThemeManager;;

use Modern::Perl;
use JSON;
use DateTime;
use DateTime::Format::Strptime;
use Encode qw(encode);
use CGI;

=head1 NAME

Koha::Plugin::Celebrations::ThemeManager - Gestionnaire de thèmes pour le plugin Celebrations

=head1 DESCRIPTION

Cette classe gère toutes les opérations liées aux thèmes actifs dans le plugin Celebrations.
Elle utilise la configuration de base chargée par L<Koha::Plugin::Celebrations::Lib::Config>
et la complète avec les données dynamiques (dates, états, options, activation).

Elle fournit les fonctionnalités suivantes :

- récupérer le thème actif selon la date
- obtenir les données d’un thème spécifique
- appliquer un thème (création ou activation)
- mettre à jour les paramètres d’un thème existant
- supprimer un thème
- valider les dates de début/fin
- détecter les conflits entre thèmes actifs
- construire la configuration finale d’un thème
- produire une liste formatée de tous les thèmes
- utilitaires internes (formatage, calculs, tests de période)

=cut

=head1 METHODS

=head2 new

    my $tm = Koha::Plugin::Celebrations::ThemeManager->new($plugin);

Constructeur : Reçoit une instance du plugin Koha parent et initialise le gestionnaire des thèmes.

=cut

sub new {
    my ($class, $plugin) = @_;
    my $self = {
        plugin => $plugin,
    };
    bless $self, $class;
    return $self;
}

=head2 get_active_theme

Retourne le nom du thème actuellement actif en fonction de la date du jour.
Un thème est considéré actif s'il est marqué "active" et que la date
actuelle est comprise entre start_date et end_date.

=cut

sub get_active_theme {
    my ($self) = @_;
    my $themes_data = $self->{plugin}->retrieve_data('themes_data');
    return unless $themes_data;
    my $themes = decode_json(encode('UTF-8', $themes_data));
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
    return;
}

=head2 get_theme_data

    my $data = $tm->get_theme_data('noel');

Retourne toutes les données enregistrées pour un thème.
Retourne undef si le thème n’existe pas ou si aucune donnée n’est enregistrée.

=cut

sub get_theme_data {
    my ($self, $theme_name) = @_;
    return unless $theme_name;
    my $themes_data = $self->{plugin}->retrieve_data('themes_data');
    return unless $themes_data;
    my $themes = decode_json(encode('UTF-8', $themes_data));
    return $themes->{$theme_name};
}

=head2 apply_theme

Méthode appelée via les actions CGI.
Effectue :
- lecture des paramètres
- validation des dates
- vérification des conflits
- construction des données du thème
- sauvegarde
- impression d’une réponse JSON

=cut

sub apply_theme {
    my ($self) = @_;
    my $cgi = $self->{plugin}->{cgi};
    print $cgi->header(-type => 'application/json', -charset => 'UTF-8');
    my $theme_name = $cgi->param('theme');
    my $start_date = $cgi->param('start_date');
    my $end_date = $cgi->param('end_date');
    my $validation_result = $self->validate_theme_dates($start_date, $end_date);
    unless ($validation_result->{valid}) {
        print to_json({
            success => JSON::false,
            message => $validation_result->{message}
        });
        return;
    }
    my ($start_dt, $end_dt) = @{$validation_result}{qw(start_dt end_dt)};
    my $conflict = $self->check_theme_conflicts($theme_name, $start_dt, $end_dt);
    if ($conflict) {
        print to_json({
            success => JSON::false,
            message => $conflict
        });
        return;
    }
    my $theme_data = $self->build_theme_data($theme_name, $start_dt, $end_dt);
    $self->save_theme($theme_name, $theme_data);
    print to_json({
        success => JSON::true,
        theme => $theme_name,
        message => "theme_applied"
    });
}

=head2 update_theme

Met à jour un thème existant avec de nouvelles dates et de nouvelles options.
Vérifie :
- l’existence du thème
- la validité des dates
- les conflits éventuels
- la cohérence avec la configuration de base

Retourne une réponse JSON.

=cut

sub update_theme {
    my ($self) = @_;
    my $cgi = $self->{plugin}->{cgi};
    my $theme_name = $cgi->param('theme_name');
    my $start_date = $cgi->param('start_date');
    my $end_date = $cgi->param('end_date');
    print $cgi->header(-type => 'application/json', -charset => 'UTF-8');
    unless ($theme_name) {
        print encode_json({ success => JSON::false, error => "Nom du thème manquant" });
        return;
    }
    my $themes_data = $self->{plugin}->retrieve_data('themes_data');
    my $themes = $themes_data ? decode_json($themes_data) : {};
    unless (exists $themes->{$theme_name}) {
        print encode_json({ success => JSON::false, error => "Thème '$theme_name' introuvable" });
        return;
    }
    my $validation = $self->validate_theme_dates($start_date, $end_date);
    unless ($validation->{valid}) {
        print encode_json({ success => JSON::false, error => $validation->{message} });
        return;
    }
    my ($start_dt, $end_dt) = @{$validation}{qw(start_dt end_dt)};
    my $conflict = $self->check_theme_conflicts($theme_name, $start_dt, $end_dt);
    if ($conflict) {
        print encode_json({ success => JSON::false, error => $conflict });
        return;
    }
    my $base_config = $self->{plugin}->{config}->get_theme_config($theme_name);
    unless ($base_config) {
        print encode_json({ success => JSON::false, error => "Configuration du thème introuvable" });
        return;
    }
    my $elements = $self->build_elements_from_cgi($base_config, $themes->{$theme_name});
    $themes->{$theme_name} = {
        %{$themes->{$theme_name}},
        start_date => $start_dt->epoch,
        end_date   => $end_dt->epoch,
        updated_at => time(),
        elements   => $elements,
    };
    $self->{plugin}->store_data({ themes_data => encode_json($themes) });
    print encode_json({
        success => JSON::true,
        theme   => $theme_name,
        message => "theme_updated"
    });
}

=head2 delete_theme

Supprime entièrement un thème de la base de données du plugin.
Retourne un JSON indiquant le résultat.

=cut

sub delete_theme {
    my ($self) = @_;
    my $cgi = CGI->new;
    my $theme_name = $cgi->param('theme_name');
    binmode STDOUT, ':encoding(UTF-8)';
    print $cgi->header(-type => 'application/json', -charset => 'UTF-8');
    eval {
        my $themes_data = $self->{plugin}->retrieve_data('themes_data');
        if (!$themes_data) {
            print encode_json({ success => JSON::false, error => 'Aucune donnée de thème trouvée' });
            return;
        }
        my $themes = decode_json(encode('UTF-8', $themes_data));
        if (exists $themes->{$theme_name}) {
            delete $themes->{$theme_name};
            $self->{plugin}->store_data({ themes_data => encode_json($themes) });

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

=head2 list_themes

Retourne en JSON la liste complète de tous les thèmes enregistrés, incluant :

- leur statut (actif ou non)
- leur période
- s’ils sont actuellement en cours
- leurs dates formatées
- le thème actif actuel

=cut


sub list_themes {
    my ($self) = @_;
    my $cgi = $self->{plugin}->{cgi};
    my $themes_data = $self->{plugin}->retrieve_data('themes_data');
    my $themes = $themes_data ? decode_json(encode('UTF-8', $themes_data)) : {};
    my $now = DateTime->now();
    my @theme_list = $self->build_theme_list($themes, $now);
    print $cgi->header('application/json');
    print to_json({
        success => JSON::true,
        themes => \@theme_list,
        current_theme => $self->get_active_theme()
    });
}

=head2 validate_theme_dates

Valide les dates reçues depuis les paramètres CGI.
Elle vérifie :
- présence des deux dates
- validité du format (YYYY-MM-DD)
- cohérence chronologique (début < fin)

Retourne un hashref indiquant :
- valid => 1/0
- message => code d’erreur
- start_dt => objet DateTime
- end_dt   => objet DateTime

=cut

sub validate_theme_dates {
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
    $end_dt->set(hour => 23, minute => 59, second => 59) if $end_dt;
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

=head2 check_theme_conflicts

Détecte si un autre thème actif chevauche la période fournie.
Retourne un message d’erreur s'il existe un conflit, sinon undef.

=cut

sub check_theme_conflicts {
    my ($self, $theme_name, $start_dt, $end_dt) = @_;
    my $themes_data = $self->{plugin}->retrieve_data('themes_data');
    my $themes = $themes_data ? decode_json($themes_data) : {};
    foreach my $existing_theme_name (keys %$themes) {
        next if $existing_theme_name eq $theme_name;
        my $existing_theme = $themes->{$existing_theme_name};
        next unless $existing_theme->{active};
        if ($existing_theme->{start_date} && $existing_theme->{end_date}) {
            my $exist_start = DateTime->from_epoch(epoch => $existing_theme->{start_date});
            my $exist_end = DateTime->from_epoch(epoch => $existing_theme->{end_date});
            if (($start_dt <= $exist_end) && ($end_dt >= $exist_start)) {
                return 'theme_conflict';
            }
        }
    }
    return;
}

=head2 build_theme_data

Construit toutes les données d’un thème lors de son application :
- active => 1
- dates (epoch)
- horodatage de création
- éléments configurés selon la configuration de base

=cut

sub build_theme_data {
    my ($self, $theme_name, $start_dt, $end_dt) = @_;
    my %theme_data = (
        theme_name => $theme_name,
        active => 1,
        start_date => $start_dt->epoch,
        end_date => $end_dt->epoch,
        created_at => time(),
        elements => {}
    );
    my $base_config = $self->{plugin}->{config}->get_theme_config($theme_name);
    return \%theme_data unless $base_config && exists $base_config->{elements};
    $theme_data{elements} = $self->build_elements_from_cgi($base_config, {});
    return \%theme_data;
}

=head2 build_elements_from_cgi

Construit la configuration des éléments d’un thème en fonction :
- de la configuration de base du thème
- des paramètres CGI
- des valeurs existantes (mise à jour)

Gère automatiquement les extra_options.

=cut

sub build_elements_from_cgi {
    my ($self, $base_config, $existing_theme) = @_;
    my $cgi = $self->{plugin}->{cgi};
    my %elements;
    return %elements unless exists $base_config->{elements};
    foreach my $element (keys %{ $base_config->{elements} }) {
        my $setting = $base_config->{elements}{$element}{setting};
        my $enabled = $cgi->param($setting)
                      // $existing_theme->{elements}{$element}{enabled}
                      // 'off';
        $elements{$element} = {
            enabled => $enabled,
            options => {}
        };
        if (exists $base_config->{elements}{$element}{extra_options}) {
            foreach my $opt_key (keys %{ $base_config->{elements}{$element}{extra_options} }) {
                my $new_val = $cgi->param($opt_key);
                if ($opt_key eq 'api_namespace') {
                    $new_val = $self->{plugin}->api_namespace;
                }
                $new_val //= $existing_theme->{elements}{$element}{options}{$opt_key}
                         // $base_config->{elements}{$element}{extra_options}{$opt_key}{default}
                         // 'off';
                $elements{$element}{options}{$opt_key} = $new_val;
            }
        }
    }
    return \%elements;
}

=head2 save_theme

Enregistre définitivement les données d’un thème dans la base de données du plugin.

=cut

sub save_theme {
    my ($self, $theme_name, $theme_data) = @_;
    my $themes_data = $self->{plugin}->retrieve_data('themes_data');
    my $themes = $themes_data ? decode_json($themes_data) : {};
    $themes->{$theme_name} = $theme_data;
    $self->{plugin}->store_data({ themes_data => encode('UTF-8', encode_json($themes)) });
}

=head2 build_theme_list

Construit et retourne un tableau contenant toutes les informations utiles
pour afficher la liste des thèmes dans l’interface administrateur.
Chaque entrée inclut :
- nom du thème
- état (actif)
- état courant (is_current)
- dates en epoch
- dates formatées
- date de création

=cut

sub build_theme_list {
    my ($self, $themes, $now) = @_;
    my @theme_list;
    foreach my $theme_name (keys %$themes) {
        my $theme = $themes->{$theme_name};
        my $is_current = $self->is_theme_current($theme, $now);
        push @theme_list, {
            name => $theme_name,
            active => $theme->{active},
            is_current => $is_current,
            start_date => $theme->{start_date},
            end_date => $theme->{end_date},
            created_at => $theme->{created_at}
        };
    }
    return @theme_list;
}

=head2 is_theme_current

Retourne vrai si le thème est actif et si la date courante est comprise dans sa période.

=cut

sub is_theme_current {
    my ($self, $theme, $now) = @_;
    return 0 unless $theme->{active} && $theme->{start_date} && $theme->{end_date};
    my $start = DateTime->from_epoch(epoch => $theme->{start_date});
    my $end = DateTime->from_epoch(epoch => $theme->{end_date});
    return ($now >= $start && $now <= $end) ? 1 : 0;
}

1;
