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
- vérifier que au moin un élément est actif
- construction des données du thème
- sauvegarde
- impression d’une réponse JSON

=cut

sub apply_theme {
    my ( $self, $params ) = @_;
    my $theme_name = $params->{theme};
    my $start_date = $params->{start_date};
    my $end_date   = $params->{end_date};
    return { success => 0, message => 'theme_missing' }
      unless $theme_name;
    return { success => 0, message => 'theme_unknown' }
      unless $self->{plugin}->{config}->theme_exists($theme_name);
    my $validation = $self->validate_theme_dates($start_date, $end_date);
    return { success => 0, message => $validation->{message} }
      unless $validation->{valid};
    my ( $start_dt, $end_dt ) = @{$validation}{qw(start_dt end_dt)};
    if ( my $conflict = $self->check_theme_conflicts($theme_name, $start_dt, $end_dt) ) {
        return { success => 0, message => $conflict };
    }
    my $active_validation = $self->validate_at_least_one_active_element($params);
    return { success => 0, message => $active_validation->{message} }
        unless $active_validation->{valid};
    my $theme_data = $self->build_theme_data_from_params(
        $theme_name,
        $start_dt,
        $end_dt,
        $params
    );
    $self->save_theme( $theme_name, $theme_data );
    return {
        success => 1,
        theme   => $theme_name,
        theme_data => $theme_data,
        message => 'theme_applied'
    };
}

=head2 update_theme

Met à jour un thème existant avec de nouvelles dates et de nouvelles options.
Vérifie :
- l’existence du thème
- la validité des dates
- les conflits éventuels
- la présence d’au moins un élément actif
- la cohérence avec la configuration de base

Retourne une réponse JSON.

=cut

sub update_theme {
    my ( $self, $theme_name, $params ) = @_;
    return {
        success => 0,
        message => 'theme_missing'
    } unless $theme_name;
    my $themes_data = $self->{plugin}->retrieve_data('themes_data');
    my $themes = $themes_data
        ? decode_json( encode('UTF-8', $themes_data) )
        : {};
    return {
        success => 0,
        message => 'theme_not_found'
    } unless exists $themes->{$theme_name};
    my $start_date = $params->{start_date};
    my $end_date   = $params->{end_date};
    my $elements   = $params->{elements};
    my $validation = $self->validate_theme_dates($start_date, $end_date);
    return {
        success => 0,
        message => $validation->{message}
    } unless $validation->{valid};
    my ( $start_dt, $end_dt ) = @{$validation}{qw(start_dt end_dt)};
    if ( my $conflict = $self->check_theme_conflicts(
        $theme_name, $start_dt, $end_dt
    )) {
        return {
            success => 0,
            message => $conflict
        };
    }
    my $active_validation = $self->validate_at_least_one_active_element($params);
    return {
        success => 0,
        message => $active_validation->{message}
    } unless $active_validation->{valid};
    my $theme_data = {
        %{ $themes->{$theme_name} },
        start_date => $start_dt->epoch,
        end_date   => $end_dt->epoch,
        updated_at => time(),
        elements   => $self->build_theme_data_from_params(
            $theme_name,
            $start_dt,
            $end_dt,
            $params
        )->{elements},
    };
    $themes->{$theme_name} = $theme_data;
    $self->{plugin}->store_data({
        themes_data => encode('UTF-8', encode_json($themes))
    });
    return {
        success    => 1,
        theme      => $theme_name,
        message    => 'theme_updated',
        theme_data => $theme_data
    };
}

=head2 delete_theme

Supprime entièrement un thème de la base de données du plugin.
Retourne un JSON indiquant le résultat.

=cut

sub delete_theme {
    my ( $self, $theme_name ) = @_;
    return {
        success => JSON::false,
        message => 'theme_missing'
    } unless $theme_name;
    my $themes_data = $self->{plugin}->retrieve_data('themes_data');
    my $themes = $themes_data
        ? decode_json( encode('UTF-8', $themes_data) )
        : {};
    return {
        success => JSON::false,
        message => 'theme_not_found'
    } unless exists $themes->{$theme_name};
    delete $themes->{$theme_name};
    $self->{plugin}->store_data({
        themes_data => encode('UTF-8', encode_json($themes))
    });
    return {
        success => JSON::true,
        theme   => $theme_name,
        message => 'theme_deleted'
    };
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
    my $themes_data = $self->{plugin}->retrieve_data('themes_data');
    my $themes = $themes_data
        ? decode_json( encode('UTF-8', $themes_data) )
        : {};
    my $now = DateTime->now();
    my @theme_list = $self->build_theme_list($themes, $now);
    return {
        success       => JSON::true,
        themes        => \@theme_list,
        current_theme => $self->get_active_theme()
    };
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

=head2 validate_at_least_one_active_element

Vérifie qu'au moins un paramètre d'activation du thème est à "on".
Ignore les paramètres non liés aux éléments visuels.
Retourne :
- { valid => 1 } si au moins un élément est actif
- { valid => 0, message => 'no_active_elements' } sinon

=cut

sub validate_at_least_one_active_element {
     my ( $self, $params ) = @_;
    my $elements = $params->{elements};
    return {
        valid   => 0,
        message => 'no_active_elements'
    } unless $elements && ref $elements eq 'HASH';
    foreach my $element_key ( keys %$elements ) {
        my $element = $elements->{$element_key};
        next unless ref $element eq 'HASH';
        if ( $element->{enabled} ) {
            return { valid => 1 };
        }
    }
    return {
        valid   => 0,
        message => 'no_active_elements'
    };
}

sub build_theme_data_from_params {
    my ( $self, $theme_name, $start_dt, $end_dt, $params ) = @_;
    my $base_config = $self->{plugin}->{config}->get_theme_config($theme_name);
    my $elements_param = $params->{elements} || {};
    my %elements;
    foreach my $element_key ( keys %{ $base_config->{elements} } ) {
        my $element_conf = $base_config->{elements}{$element_key};
        my $setting      = $element_conf->{setting};
        my $param = $elements_param->{$setting} || {};
        $elements{$element_key} = {
            enabled => $param->{enabled} ? 1 : 0,
            options => {}
        };
        if ( exists $param->{options} && ref $param->{options} eq 'HASH' ) {
            $elements{$element_key}{options} = { %{ $param->{options} } };
        }
    }
    return {
        theme_name => $theme_name,
        active     => 1,
        start_date => $start_dt->epoch,
        end_date   => $end_dt->epoch,
        created_at => time(),
        elements   => \%elements,
    };
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
