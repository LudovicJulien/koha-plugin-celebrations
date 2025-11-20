# Extension Koha : Celebrations ![Confetti](Koha/Plugin/Celebrations/images/Confetti.gif)

[![Build Status](https://github.com/inlibro/koha-plugin-celebrations/actions/workflows/generate_kpz.yml/badge.svg)](https://github.com/inlibro/koha-plugin-celebrations/releases/latest)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/inlibro/koha-plugin-celebrations)](https://github.com/inlibro/koha-plugin-celebrations/releases/latest)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![English Documentation](https://img.shields.io/badge/Docs-English-blue?style=flat-square&logo=read-the-docs)](README.en.md)


Ajoutez une touche festive à l'OPAC de votre bibliothèque pour chaque occasion spéciale ! Ce plugin permet d'appliquer des thèmes saisonniers et des animations pour des célébrations comme Noël, Halloween, la Saint-Valentin et bien d'autres.

Pour une prise en main plus facile, il est recommandé d'aller jeter un coup d'oeil aux instructions

[![Instructions](https://img.shields.io/badge/Instructions-📖-blue)](https://inlibro.com/extension-koha-celebrations/)

---

## Table des matières

- [Extension Koha : Celebrations ](#extension-koha--celebrations-)
  - [Table des matières](#table-des-matières)
  - [Fonctionnalités Principales](#fonctionnalités-principales)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Pour les Développeurs](#pour-les-développeurs)
    - [Architecture](#architecture)
    - [Installation (Développeur)](#installation-développeur)
        - [Première installation ou reprise d’un plugin cloné](#première-installation-ou-reprise-dun-plugin-cloné)
    - [Suite de Tests Automatisés](#suite-de-tests-automatisés)
    - [Architecture "Data-Driven"](#architecture-data-driven)
      - [1. Fichiers du Thème](#1-fichiers-du-thème)
        - [1.1 Utilisation des extra\_options et du font\_url dans vos fichiers JS/CSS](#11-utilisation-des-extra_options-et-du-font_url-dans-vos-fichiers-jscss)
      - [2. Configuration dans `theme-config.json`](#2-configuration-dans-theme-configjson)
      - [3. Traduction](#3-traduction)
      - [4. Validation et Tests](#4-validation-et-tests)
  - [Licence](#licence)


## Fonctionnalités Principales

- **Sélection de thème saisonnier** <br>
Les administrateurs peuvent choisir parmi plusieurs thèmes prédéfinis (Noël, Halloween, Saint-Valentin, Pâque, etc.) via un panneau de configuration.

- **Modification des couleurs du catalogue** <br>
Chaque thème applique une palette de couleurs unique qui modifie l’apparence globale du catalogue, incluant les boutons, fonds, textes, et autres éléments graphiques.

- **Ajout d’éléments visuels modernes** <br>
Des animations, icônes, décorations saisonnières (ex. : flocons de neige, citrouilles, cœurs) sont intégrées dans l’interface pour renforcer l’ambiance du thème.

- **Activation/Désactivation des éléments visuels** <br>
Certains éléments visuels peuvent être activés ou désactivés indépendamment, permettant une personnalisation fine selon les préférences de l’administrateur.

- **Configuration avancée** <br>
Les options de configuration permettent de modifier certains paramètres des éléments visuels (taille, position, vitesse d’animation, nombre d’éléments, etc.).

## Installation

1.  Rendez-vous sur la [page des "Releases"](https://github.com/inlibro/koha-plugin-celebrations/releases/latest) de ce projet.
2.  Téléchargez le dernier fichier `.kpz`.
3.  Accédez à votre interface professionnelle Koha, puis allez dans `Administration > Gérer les plugins`.
4.  Cliquez sur `Télécharger un plugin` et sélectionnez le fichier `.kpz` que vous venez de télécharger.
5.  Une fois le plugin installé, assurez-vous de l'activer en cliquant sur `Actions > Activer`.

## Configuration

Après l'installation, cliquez sur `Actions > Exécuter l'outil`. La page de configuration vous permet de :

1.  **Sélectionner un thème** dans le menu déroulant.
2.  **Activer ou désactiver** les différents effets visuels (couleurs, animations, etc.) grâce aux interrupteurs.
3.  **Ajuster les paramètres** de chaque effet (vitesse, quantité, taille...) avec les curseurs et les listes déroulantes.
4.  **Observer vos changements en direct** dans la fenêtre de prévisualisation qui simule l'apparence de l'OPAC en cliquant sur `Prévisualiser`.
5.  **Choisir les dates** où ce thème de célébration sera automatiquement actif sur l'OPAC.
6.  **Cliquez sur `Sauvegarder`** pour sauvegarder et activer les modifications sur l'OPAC public.


## Pour les Développeurs

Ce plugin est conçu pour être stable, maintenable et facile à étendre.

### Architecture

```graphql
Koha/Plugin/
 └── Celebrations.pm                     # Plugin principal Koha::Plugin::Celebrations

Koha/Plugin/Celebrations/
 ├── api/                               # Définition des routes exposées par le plugin.
 ├── config/
 │    ├── theme-config.json             # Fichier de configuration des thème ("Data-driven")
 │    ├── theme-config.schema.json      # Schéma de la configuration
 ├── css/
 |    ├── <NomTheme>/                   # Fichiers CSS de chaque éléments du theme
 │    ├── template/                     # Code CSS de l’interface admin (bundlé)
 ├── i18n/                              # Fichiers de traduction
 ├── images/                            # contient les images de l'intranet et des thèmes
 ├── js/
 |    ├── <NomTheme>/                   # Fichiers JS de chaque éléments du theme
 │    ├── template/                     # Code JS de l’interface admin (bundlé)
 │    ├── dist/                         # Bundle compilé
 ├── Lib/                               # Module perl utiliser par le plugin
 └─── template/                         # tTmplates du menu administrateur

 scripts/                               # Scripts utilitaires
 ├── bundle-plugin-js.js
 └── test-env.sh

 t/                                     # Tests
 ├── 01-load.t
 ├── 05-config.t
 └── ...
```

### Installation (Développeur)

Cette section explique comment installer le plugin en mode développement afin de pouvoir modifier le code et tester directement sur une instance Koha locale.

1. Forker le projet et le télécharger sur votre poste de travail
2. Créer un lien symbolique vers Koha

  Dans votre instance Koha (généralement /var/lib/koha/`<instance>`/plugins), créez un lien symbolique vers le dossier du plugin :

```bash
ln -s /chemin/vers/koha-plugin-celebrations /var/lib/koha/<instance>/plugins/Koha/Plugin/Celebrations
```

3. Installer le plugin dans Koha

Exécuter le script Koha pour déclarer le plugin :

```bash
./misc/devel/install_plugins.pl
```

4. Installer les dépendances front-end

Dans le dossier du plugin :

```bash
npm install
```

5. Compiler les fichiers JavaScript de l’interface administrateur

Le plugin utilise un système de bundling automatique : tous les fichiers situés dans
`Koha/Plugin/Celebrations/js/template/` sont fusionnés en un seul fichier JavaScript chargé dans l’interface d’administration.

Pour que vos modifications soient prises en compte :

Développement (avec surveillance automatique) utilisez :

````linux
npm run dev
````
Cette commande surveille en continu le dossier `js/template/` et reconstruit automatiquement le bundle `js/dist/celebrations-bundle.js` à chaque changement.

##### Première installation ou reprise d’un plugin cloné

Lorsque vous installez ou clonez le plugin pour la première fois :

Cela crée le fichier celebrations-bundle.js et met à jour le template pour charger ce bundle.

Si vous utilisez un plugin en mode développement via lien symbolique (dans `/var/lib/plugins/`), ce bundling doit être fait avant d’ouvrir la page d’administration, sinon aucun script ne sera chargé.

### Suite de Tests Automatisés

Pour garantir la qualité et la non-régression, le plugin inclut une suite de tests complète. Vous pouvez les lancer avec la commande `npm run test`.

-   `t/01-load.t` : Vérifie que le module principal du plugin se charge correctement.
-   `t/02-critic.t` : Analyse statique du code avec `Perl::Critic` pour assurer le respect des bonnes pratiques de codage Perl.
-   `t/03-lifecycle.t` : Teste le cycle de vie du plugin (installation, mise à jour, désinstallation).
-   `t/04-translation.t` : Assure la cohérence des fichiers de traduction. Il vérifie que toutes les clés de `default.inc` sont présentes dans les autres langues, et que toutes les options de `theme-config.json` sont bien traduisibles.
-   `t/05-config.t` : vérifie la validité structurelle du fichier de configuration des thèmes (theme-config.json) en le comparant à son schéma JSON, et garantit l'existence physique de tous les fichiers CSS et JavaScript associés à chaque thème et option définis dans cette configuration.

### Architecture "Data-Driven"

Le plugin utilise une architecture entièrement orientée données : tous les thèmes et leurs options sont décrits en JSON, et l’interface se génère automatiquement à partir de ces données. Ajouter, modifier ou supprimer un thème ne nécessite aucun changement de code — tout s’adapte automatiquement pour garantir cohérence et simplicité.Pour ajouter ou modifier un thème, il n'est pas nécessaire de modifier le code Perl. Il suffit de :
1.  Ajouter vos fichiers `.css` et `.js` dans les dossiers `Koha/Plugin/Celebrations/css/` et `js/`.
2.  Déclarer le nouveau thème, ses éléments et ses options dans le fichier `Koha/Plugin/Celebrations/config/theme-config.json`.
3.  Ajouter les traductions pour les nouvelles options dans les fichiers du dossier `Koha/Plugin/Celebrations/i18n/`, la clé doit toujours correspondre à la valeur du champs `"setting"` du fichier `""theme-config.json`.
4.  Lancer les tests pour être sûr que tout est bien configuré
5.  Tous les éléments dans le menu administrateur du plugin pour votre nouveau thème seront ajoutés automatiquement.


#### 1. Fichiers du Thème
Dans le dossier `Koha/Plugin/Celebrations/js` et/ou `Koha/Plugin/Celebrations/css`, créez un sous-dossier portant le **nom exact du thème** (ex: `halloween`). Pour chaque élément visuel du thème, vous devez fournir soit un fichier **CSS** (`.css`), soit un fichier **JavaScript** (`.js`), ou les **deux**, dans les dossiers `css/<nom-du-thème>/<nom-du-thème>-<élément>` et `js/<nom-du-thème>/<nom-du-thème>-<élément>` (ex : `js/halloween/halloween-ghost.js`).

##### 1.1 Utilisation des extra_options et du font_url dans vos fichiers JS/CSS

Les options configurées dans extra_options sont automatiquement transmises à vos fichiers JavaScript sous la forme d’un objet global nommé :
````js
window["<nom_du_thème>ThemeOptions"]
````

Exemple pour le thème noel :

````js
var options = window["noelThemeOptions"] || {};
var vitesse = options.vitesse_flocons;
var quantite = options.quantite_flocons;
````

Cela vous permet d’adapter dynamiquement l’effet visuel en fonction des réglages choisis dans l’interface administrateur.

Utilisation de font_url

Si un thème définit un font_url, celui-ci est automatiquement chargé dans l’OPAC.
Vous pouvez directement utiliser cette police dans vos fichiers CSS du thème :

````css
h1 {
  font-family: 'Mountains of Christmas', cursive;
}
````
Cette approche garantit une séparation propre entre configuration (JSON) et comportement (JS/CSS).

#### 2. Configuration dans `theme-config.json`
Déclarez votre thème et ses éléments dans le fichier `Koha/Plugin/Celebrations/config/theme-config.json` en respectant la structure suivante :
* Le nom du theme dans le fichier config doit être le même que celui utiliser pour les dossiers dans `js` et `css`
* **Structure de base :** Le thème doit contenir une clé `font_url` (facultatif donc laisser la valeur vide si ce n'est pas nécessaire) et le hash `elements`.
* **Éléments :** Chaque élément dans `elements` doit définir :
    * `setting`: La clé de traduction et de configuration (doit être unique).
    * `file`: Le nom de base du fichier sans l'extension (ex: si vos fichiers sont `halloween-spider.css` et `halloween-spider.js`, `file` doit être `halloween-spider`).
    * `type`: Indique le type de fichiers utilisés par l'élément visuelle(`"css"`, `"js"`, ou `"both"`).
    * `toggle_id`: L'ID de l'élément de bascule (checkbox) dans l'interface.
* **Options Supplémentaires (`extra_options`) :** Chaque élément peut contenir un hash `extra_options` pour les réglages fins. Ces options seront automatiquement ajouter dans le formulaire quand le "checkbox" de l'élément en question sera activé et aussi automatiquement envoyées au fichier JavaScript (`.js`) correspondant à l'élément. Le type de l'option doit être spécifié :
    * `"select"` : Pour les listes déroulantes (doit contenir le nom d'une liste de sélection qui doit se trouver dans les fichiers de traduction).
    * `"range"` : Pour les curseurs (doit contenir : min,max,default).
    * `"ignore"` : Pour les options gérées sans affichage dans l'interface comme par exemple le `api_namespace`.

Ceci ajoute automatiquement votre thème dans la liste de sélection (`<select>`) et génère un groupe de formulaires (`form-group`) contenant les éléments spécifiés dans la configuration. Lorsque votre thème est actif durant une période définie, le plugin enverra automatiquement les fichiers CSS et JS correspondants vers l'OPAC en fonction des options activées par l'utilisateur.

#### 3. Traduction
N'oubliez pas d'ajouter les traductions pour votre nouveau thème dans les fichiers du dossier **`Koha/Plugin/Celebrations/i18n/`** cela permet au "checkbox" d'avoir un label qui explique ce qu'il permet d'activer. Dans la section `T`, vous devez :

   - Créer un hash (dictionnaire) portant le nom exact du thème (ex: paque).

   - Dans ce hash, ajouter une paire clé/valeur pour chaque option ayant une clé setting dans le theme-config. Pour les extra option de type `select` et `range` mettre comme clé le nom de l'extra option, pour les types `ignore` ne rien mettre puisqu'il ne doit pas s'afficher dans l'interface administrateur. Exemple :
```perl
"halloween": {
      "couleur_halloween": "Activer les couleurs d’Halloween 🟠 ⚫",
      "footer_halloween": "Activer les éléments du pied de page 🎃",
      "activation_spiders": "Activer l’effet d’araignées 🕷️",
      "quantite_spiders": "Nombre d’araignées :",
      "activation_ghost": "Activer le curseur fantôme 👻 (visible uniquement sur ordinateur)"
    },
```
   - Pour les extra option de type `select` il ne faut pas oublier de rajouter les options disponible dans les fichiers de traduction avec comme clé le `option_type` défini dans le fichier config des thèmes. Exemple :
```perl
"option_vitesse": [
      { "key": "vitesse_lent", "label": "Lent" },
      { "key": "vitesse_normale", "label": "Normal" },
      { "key": "vitesse_rapide", "label": "Rapide" }
    ],
```

#### 4. Validation et Tests
Pour garantir que votre configuration est valide, vous devez :
* Consulter le fichier **`Koha/Plugin/Celebrations/config/theme-config.schema.json`** qui est là pour vous aider à respecter la structure et les types de données attendus.
* **Lancer les tests** (`npm run test`) et s'assurer qu'ils passent tous.
  - Cette commande exécute `scripts/test-env.sh`, qui :

    - détecte automatiquement l’instance Koha où se trouve le plugin ;

    - configure correctement PERL5LIB pour utiliser le Core Koha et les modules du plugin ;

    - lance les tests Perl avec prove -lv t/.


Cette approche rend le plugin extrêmement modulaire.

## Licence

Ce projet est sous licence GNU General Public License v3.0. Voir le fichier [LICENSE](LICENSE) for details.