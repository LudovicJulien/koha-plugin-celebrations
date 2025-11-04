# Extension Koha : Celebrations

[![Build Status](https://github.com/inlibro/koha-plugin-celebrations/actions/workflows/generate_kpz.yml/badge.svg)](https://github.com/inlibro/koha-plugin-celebrations/actions/workflows/generate_kpz.yml)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/inlibro/koha-plugin-celebrations)](https://github.com/inlibro/koha-plugin-celebrations/releases/latest)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

Ajoutez une touche festive à l'OPAC de votre bibliothèque pour chaque occasion spéciale ! Ce plugin permet d'appliquer des thèmes saisonniers et des animations pour des célébrations comme Noël, Halloween, la Saint-Valentin et bien d'autres.

Pour une prise en main plus facile il est recommender d'aller jetter un coup d'oeuil au instruction

[![Instructions](https://img.shields.io/badge/Instructions-📖-blue)](https://inlibro.com/extension-koha-celebrations/)

---

## Fonctionnalités Principales

- **Sélection de thème saisonnier** <br>
Les administrateurs peuvent choisir parmi plusieurs thèmes prédéfinis (Noël, Halloween, Saint-Valentin, Paque, etc.) via un panneau de configuration.

- **Modification des couleurs du catalogue** <br>
Chaque thème applique une palette de couleurs unique qui modifie l’apparence globale du catalogue, incluant les boutons, fonds, textes, et autres éléments graphiques.

- **Ajout d’éléments visuels modernes** <br>
Des animations, icônes, décorations saisonnières (ex. : flocons de neige, citrouilles, cœurs) sont intégrées dans l’interface pour renforcer l’ambiance du thème.

- **ativation/désactivation des éléments visuels** <br>
Certain élément visuel peut être activé ou désactivé indépendamment, permettant une personnalisation fine selon les préférences de l’administrateur.

- **Configuration avancée** <br>
Les options de configuration permettent de modifier certains paramètres des éléments visuels (taille, position, vitesse d’animation, nombre d’éléments, etc.).

## Installation

1.  Rendez-vous sur la [page des "Releases"](https://github.com/inlibro/koha-plugin-celebrations/releases/latest) de ce projet.
2.  Téléchargez le dernier fichier `.kpz`.
3.  Accédez à votre interface professionnelle Koha, puis allez dans `Administration > Gérer les plugins`.
4.  Cliquez sur `Télécharger un plugin` et sélectionnez le fichier `.kpz` que vous venez de télécharger.
5.  Une fois le plugin installé, assurez-vous de l'activer en cliquant sur `Actions > Activer`.

## Configuration

Après l'installation, cliquez sur `Actions > Configurer`. La page de configuration vous permet de :

1.  **Sélectionner un thème** dans le menu déroulant.
2.  **Activer ou désactiver** les différents effets visuels (couleurs, animations, etc.) grâce aux interrupteurs.
3.  **Ajuster les paramètres** de chaque effet (vitesse, quantité, taille...) avec les curseurs et les listes déroulantes.
4.  **Observer vos changements en direct** dans la fenêtre de prévisualisation qui simule l'apparence de l'OPAC.
5.  Cliquez sur `Appliquer le thème` pour sauvegarder et activer les modifications sur l'OPAC public.


## Pour les Développeurs

Ce plugin est conçu pour être stable, maintenable et facile à étendre.

### Suite de Tests Automatisés

Pour garantir la qualité et la non-régression, le plugin inclut une suite de tests complète. Vous pouvez les lancer avec la commande `.test-env-koha`.

-   `t/01-load.t` : Vérifie que le module principal du plugin se charge correctement.
-   `t/02-critic.t` : Analyse statique du code avec `Perl::Critic` pour assurer le respect des bonnes pratiques de codage Perl.
-   `t/03-lifecycle.t` : Teste le cycle de vie du plugin (installation, mise à jour, désinstallation).
-   `t/04-translation.t` : Assure la cohérence des fichiers de traduction. Il vérifie que toutes les clés de `default.inc` sont présentes dans les autres langues, et que toutes les options de `theme-config.json` sont bien traduisibles.

### Architecture "Data-Driven"

Pour ajouter ou modifier un thème, il n'est pas nécessaire de modifier le code Perl. Il suffit de :
1.  Ajouter vos fichiers `.css` et `.js` dans les dossiers `Koha/Plugin/Celebrations/css/` et `js/`.
2.  Déclarer le nouveau thème, ses éléments et ses options dans le fichier `Koha/Plugin/Celebrations/config/theme-config.json`.
3.  Ajouter les traductions pour les nouvelles options dans les fichiers du dossier `Koha/Plugin/Celebrations/lang/`, la clé doit toujours correspondre à la valeur du cham `"setting"` du fichier `""theme-config.json`.

Cette approche rend le plugin extrêmement modulaire.

## Licence

Ce projet est sous licence GNU General Public License v3.0. Voir le fichier [LICENSE](LICENSE) for details.