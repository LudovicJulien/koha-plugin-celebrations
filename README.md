# Extension Koha : Celebrations

[![Build Status](https://github.com/inlibro/koha-plugin-celebrations/actions/workflows/generate_kpz.yml/badge.svg)](https://github.com/inlibro/koha-plugin-celebrations/releases/latest)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/inlibro/koha-plugin-celebrations)](https://github.com/inlibro/koha-plugin-celebrations/releases/latest)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

Ajoutez une touche festive à l'OPAC de votre bibliothèque pour chaque occasion spéciale ! Ce plugin permet d'appliquer des thèmes saisonniers et des animations pour des célébrations comme Noël, Halloween, la Saint-Valentin et bien d'autres.

Pour une prise en main plus facile il est recommendé d'aller jeter un coup d'oeil aux instructions

[![Instructions](https://img.shields.io/badge/Instructions-📖-blue)](https://inlibro.com/extension-koha-celebrations/)

---

## Fonctionnalités Principales

- **Sélection de thème saisonnier** <br>
Les administrateurs peuvent choisir parmi plusieurs thèmes prédéfinis (Noël, Halloween, Saint-Valentin, Paque, etc.) via un panneau de configuration.

- **Modification des couleurs du catalogue** <br>
Chaque thème applique une palette de couleurs unique qui modifie l’apparence globale du catalogue, incluant les boutons, fonds, textes, et autres éléments graphiques.

- **Ajout d’éléments visuels modernes** <br>
Des animations, icônes, décorations saisonnières (ex. : flocons de neige, citrouilles, cœurs) sont intégrées dans l’interface pour renforcer l’ambiance du thème.

- **Ativation/Désactivation des éléments visuels** <br>
Certains éléments visuels peuvent être activés ou désactivé indépendamment, permettant une personnalisation fine selon les préférences de l’administrateur.

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
5.  **Choisir les dates** où ce thème célébration seras automatiquement actif sur l'OPAC.
6.  **Cliquez sur `Sauvegarder`** pour sauvegarder et activer les modifications sur l'OPAC public.


## Pour les Développeurs

Ce plugin est conçu pour être stable, maintenable et facile à étendre.

### Suite de Tests Automatisés

Pour garantir la qualité et la non-régression, le plugin inclut une suite de tests complète. Vous pouvez les lancer avec la commande `npm run test`.

-   `t/01-load.t` : Vérifie que le module principal du plugin se charge correctement.
-   `t/02-critic.t` : Analyse statique du code avec `Perl::Critic` pour assurer le respect des bonnes pratiques de codage Perl.
-   `t/03-lifecycle.t` : Teste le cycle de vie du plugin (installation, mise à jour, désinstallation).
-   `t/04-translation.t` : Assure la cohérence des fichiers de traduction. Il vérifie que toutes les clés de `default.inc` sont présentes dans les autres langues, et que toutes les options de `theme-config.json` sont bien traduisibles.
-   `t/05-config.t` : vérifie la validité structurelle du fichier de configuration des thèmes (theme-config.json) en le comparant à son schéma JSON, et garantit l'existence physique de tous les fichiers CSS et JavaScript associés à chaque thème et option définis dans cette configuration.

### Architecture "Data-Driven"

Pour ajouter ou modifier un thème, il n'est pas nécessaire de modifier le code Perl. Il suffit de :
1.  Ajouter vos fichiers `.css` et `.js` dans les dossiers `Koha/Plugin/Celebrations/css/` et `js/`.
2.  Déclarer le nouveau thème, ses éléments et ses options dans le fichier `Koha/Plugin/Celebrations/config/theme-config.json`.
3.  Ajouter les traductions pour les nouvelles options dans les fichiers du dossier `Koha/Plugin/Celebrations/i18n/`, la clé doit toujours correspondre à la valeur du champs `"setting"` du fichier `""theme-config.json`.


#### 1. Fichiers du Thème
Dans le dossier `Koha/Plugin/Celebrations/`, créez un sous-dossier portant le **nom exact du thème** (ex: `halloween`). Pour chaque élément visuel ou fonctionnel du thème, vous devez fournir soit un fichier **CSS** (`.css`), soit un fichier **JavaScript** (`.js`), ou les **deux**, dans les dossiers `css/<nom-du-thème>/` et `js/<nom-du-thème>/`.

#### 2. Configuration dans `theme-config.json`
Déclarez votre thème et ses éléments dans le fichier `Koha/Plugin/Celebrations/config/theme-config.json` en respectant la structure suivante :
* **Structure de base :** Le thème doit contenir une clé `font_url` (facultatif donc laisser la valeur vide si ce n'est pas nécessaire) et le hash `elements`.
* **Éléments :** Chaque élément dans `elements` doit définir :
    * `setting`: La clé de traduction et de configuration (doit être unique).
    * `file`: Le nom de base du fichier sans l'extension (ex: si vos fichiers sont `effet.css` et `effet.js`, `file` doit être `effet`).
    * `type`: Indique le type de fichiers utilisés (`"css"`, `"js"`, ou `"both"`).
    * `toggle_id`: L'ID de l'élément de bascule (checkbox) dans l'interface.
* **Options Supplémentaires (`extra_options`) :** Chaque élément peut contenir un hash `extra_options` pour les réglages fins. Ces options seront automatiquement envoyées au fichier JavaScript (`.js`) correspondant à l'élément. Le type de l'option doit être spécifié :
    * `"select"` : Pour les listes déroulantes (doit contenir le nom d'une liste de sélection qui doit se trouver dans les fichiers de traduction).
    * `"range"` : Pour les curseurs (doit contenir : min,max,default).
    * `"ignore"` : Pour les options gérées sans affichage dans l'interface comme par exemple le `api_namespace`.

Ceci ajoute automatiquement votre thème dans la liste de sélection (`<select>`) et génère un groupe de formulaires (`form-group`) contenant les éléments spécifiés dans la configuration. Lorsque votre thème est actif durant une période définie, le plugin enverra automatiquement les fichiers CSS et JS correspondants vers l'OPAC en fonction des options activées par l'utilisateur.

#### 3. Validation et Tests
Pour garantir que votre configuration est valide, vous devez :
* Consulter le fichier **`Koha/Plugin/Celebrations/config/theme-config.schema.json`** qui est là pour vous aider à respecter la structure et les types de données attendus.
* **Lancer les tests** (`npm run test`) et s'assurer qu'ils passent tous. Le test **`t/05-config.t`** vérifie spécifiquement l'intégrité de votre configuration de thème.

#### 4. Traduction
N'oubliez pas d'ajouter les traductions pour votre nouveau thème dans les fichiers du dossier **`Koha/Plugin/Celebrations/i18n/`**. Dans la section `T`, vous devez :

   - Créer un hash (dictionnaire) portant le nom exact du thème (ex: paque).

   - Dans ce hash, ajouter une paire clé/valeur pour chaque option ayant une clé setting dans le theme-config.json. Exemple :
```perl
paque => {
    couleur_paque      => "Activer les couleurs de Pâques 🟡 🟢 🟣",
    footer_paque       => "Activer les éléments du pied de page 🧺🥚",
    activation_eggs    => "Activer le curseur d’œufs 🥚 (visible uniquement sur ordinateur)",
}
```



Cette approche rend le plugin extrêmement modulaire.

## Licence

Ce projet est sous licence GNU General Public License v3.0. Voir le fichier [LICENSE](LICENSE) for details.