package Koha::Plugin::Celebrations::Lib::ThemeController;

use Modern::Perl;
use Mojo::Base 'Mojolicious::Controller';
use Koha::Plugin::Celebrations;

=head1 NAME

Koha::Plugin::Celebrations::Controller::Theme - Contrôleur REST des thèmes pour le plugin Celebrations

=head1 DESCRIPTION

Ce contrôleur expose l’API REST du plugin Celebrations via le système OpenAPI de Koha.
Il agit comme une couche d’orchestration entre :

- les routes définies dans C<api_routes.json>
- la validation OpenAPI (paramètres, body, path)
- le gestionnaire métier L<Koha::Plugin::Celebrations::Lib::ThemeManager>

Le contrôleur ne contient aucune logique métier :
toutes les opérations sont déléguées au ThemeManager.

Toutes les réponses sont renvoyées au format OpenAPI standard de Koha :
    {
      errors: [],
      results: {
        result: { ... }
      }
    }

=head1 ROUTES EXPOSED

Ce contrôleur implémente les routes suivantes :

- POST   /themes/apply        → appliquer ou créer un thème
- GET    /themes              → lister les thèmes existants
- DELETE /themes/{theme_name} → supprimer un thème
- PUT    /themes/{theme_name} → mettre à jour un thème

=head1 METHODS

=head2 apply

    POST /api/v1/contrib/Celebrations-api/themes/apply

Applique un thème saisonnier ou en crée un nouveau.
Cette méthode :
- valide le body JSON via OpenAPI
- instancie le plugin Celebrations
- délègue la logique métier à C<ThemeManager::apply_theme>
- retourne le résultat au format OpenAPI

=cut

sub apply {
    my $c = shift->openapi->valid_input or return;
    my $params = $c->validation->param('body');
    my $plugin = Koha::Plugin::Celebrations->new;
    my $result = $plugin->{theme_manager}->apply_theme($params);
    return $c->render(
        openapi => {
            errors  => [],
            results => { result => $result }
        }
    );
}

=head2 list

    GET /api/v1/contrib/Celebrations-api/themes

Retourne la liste complète des thèmes enregistrés dans le plugin.
Cette méthode :
- ne prend aucun paramètre
- récupère les données via C<ThemeManager::list_themes>
- inclut le thème actuellement actif

=cut

sub list {
    my $c = shift->openapi->valid_input or return;
    my $plugin = Koha::Plugin::Celebrations->new;
    my $result = $plugin->{theme_manager}->list_themes;
    return $c->render(
        openapi => {
            errors  => [],
            results => { result => $result }
        }
    );
}

=head2 delete

    DELETE /api/v1/contrib/Celebrations-api/themes/{theme_name}

Supprime définitivement un thème existant.
Cette méthode :
- récupère le nom du thème depuis le paramètre de chemin
- supprime le thème via C<ThemeManager::delete_theme>
- retourne un résultat explicite indiquant le succès ou l’échec

=head3 Paramètres

=over 4

=item theme_name

Nom du thème à supprimer (string, requis)

=cut

sub delete {
    my $c = shift->openapi->valid_input or return;
    my $theme_name = $c->validation->param('theme_name');
    my $plugin = Koha::Plugin::Celebrations->new;
    my $result = $plugin->{theme_manager}->delete_theme($theme_name);
    return $c->render(
        openapi => {
            errors  => [],
            results => { result => $result }
        }
    );
}

=head2 update

    PUT /api/v1/contrib/Celebrations-api/themes/{theme_name}

Met à jour un thème existant.

Cette méthode permet de modifier :
- les dates de validité du thème ;
- les éléments actifs/inactifs ;
- les options associées aux éléments.

Elle effectue les opérations suivantes :
- validation OpenAPI du paramètre de chemin C<theme_name> ;
- validation du body JSON via OpenAPI ;
- instanciation du plugin Celebrations ;
- délégation de la logique métier à C<ThemeManager::update_theme> ;
- retour du résultat au format OpenAPI standard de Koha.

=head3 Paramètres

=over 4

=item theme_name

Nom du thème à mettre à jour (string, requis, paramètre de chemin).

=item body

Objet JSON contenant les nouvelles valeurs du thème.

=cut

sub update {
    my $c = shift->openapi->valid_input or return;
    my $theme_name = $c->validation->param('theme_name');
    my $params     = $c->validation->param('body');
    my $plugin = Koha::Plugin::Celebrations->new;
    my $result = $plugin->{theme_manager}
        ->update_theme( $theme_name, $params );
    return $c->render(
        openapi => {
            errors  => [],
            results => { result => $result }
        }
    );
}

1;
