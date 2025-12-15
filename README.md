# Extension Koha : Celebrations ![Confetti](Koha/Plugin/Celebrations/images/Confetti.gif)

[![Build Status](https://github.com/inlibro/koha-plugin-celebrations/actions/workflows/generate_kpz.yml/badge.svg)](https://github.com/inlibro/koha-plugin-celebrations/releases/latest)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/inlibro/koha-plugin-celebrations)](https://github.com/inlibro/koha-plugin-celebrations/releases/latest)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![English Documentation](https://img.shields.io/badge/Docs-English-blue?style=flat-square&logo=read-the-docs)](README.en.md)


Ajoutez une touche festive à l'OPAC de votre bibliothèque pour chaque occasion spéciale ! Ce plugin permet d'appliquer des thèmes saisonniers et des animations pour des célébrations comme Noël, Halloween, la Saint-Valentin et bien d'autres.

Pour une prise en main plus facile, il est recommandé d'aller jeter un coup d'oeil aux instructions

[![Instructions](https://img.shields.io/badge/Instructions-📖-blue)](https://inlibro.com/extension-koha-celebrations/)

<br><br>

## Table des matières

- [Extension Koha : Celebrations ](#extension-koha--celebrations-)
  - [Table des matières](#table-des-matières)
  - [Architecture](#architecture)
  - [Installation Développeur](#installation-développeur)
    - [Étape](#étape)
      - [Première installation ou reprise d’un plugin cloné](#première-installation-ou-reprise-dun-plugin-cloné)
  - [Suite de Tests Automatisés](#suite-de-tests-automatisés)
  - [Architecture "Data-Driven"](#architecture-data-driven)
    - [1.0 Déclaration des routes statiques (API)](#10-déclaration-des-routes-statiques-api)
    - [1. Fichiers du Thème](#1-fichiers-du-thème)
      - [1.1 Utilisation des extra\_options et du font\_url dans vos fichiers JS/CSS](#11-utilisation-des-extra_options-et-du-font_url-dans-vos-fichiers-jscss)
        - [Les options configurées dans extra\_options sont automatiquement transmises à vos fichiers JavaScript sous la forme d’un objet global nommé :](#les-options-configurées-dans-extra_options-sont-automatiquement-transmises-à-vos-fichiers-javascript-sous-la-forme-dun-objet-global-nommé-)
        - [Utilisation de font\_url](#utilisation-de-font_url)
        - [Utilisation de api\_namespace](#utilisation-de-api_namespace)
        - [Prévisualisation dans un iframe](#prévisualisation-dans-un-iframe)
    - [2. Configuration dans `theme-config.json`](#2-configuration-dans-theme-configjson)
    - [3. Traduction](#3-traduction)
      - [3.1 Traduction des options du thème](#31-traduction-des-options-du-thème)
      - [3.2 Options `select`](#32-options-select)
      - [3.3 Traduction des éléments visuels](#33-traduction-des-éléments-visuels)
      - [3.4 Emoji du thème](#34-emoji-du-thème)
    - [4. Validation finale](#4-validation-finale)
  - [Déploiement en production](#déploiement-en-production)
  - [Compatibilité Koha](#compatibilité-koha)
  - [Limitations connues](#limitations-connues)
  - [Licence](#licence)

<br><br>

## Architecture

Ce plugin est conçu pour être **stable, maintenable et facile à étendre**.

```graphql
Koha/Plugin/
 └── Celebrations.pm                    # Implémente les hooks Koha et délège la logique métier aux modules Lib/*

Koha/Plugin/Celebrations/
 ├── api/
 │    ├── api_routes.json               # Routes de configuration des thèmes
 │    ├── css.json                      # Routes des fichiers static css
 │    ├── images.json                   # Routes des images
 │    └── js.json                       # Routes des fichiers static js
 ├── config/
 │    ├── theme-config.json             # Fichier de configuration des thème ("Data-driven")
 │    └── theme-config.schema.json      # Schéma de la configuration
 ├── css/
 |    ├── <NomTheme>/
 |    │    └── <NomÉlémentVisuel>.css   # Fichiers CSS de chaque éléments visuel du theme
 │    └── template/
 |         ├── disabled-css.tt          # CSS de l’interface admin désactivé
 |         └── homeTheme.css            # CSS de l’interface admin activé
 ├── i18n/
 |    ├── disabled-css.tt               # Traduction par défaut en anglais
 |    └── homeTheme.css                 # Traduction en francais
 ├── images/                            # contient les images utilisées par le plugin
 ├── js/
 │    ├── dist/
 │    |    └── celebration-bundle.js    # Bundle compilé de la page de configuration
 |    ├── <NomTheme>/
 |    │    └── <NomÉlémentVisuel>.js    # Fichiers JS de chaque éléments visuel du theme
 │    └── template/
 │         ├── config.js                # Configuration Générale
 │         ├── devicePreview.js         # Système de prévisualisation multi-device
 │         ├── formHandler.js           # Gestion du formulaire de thème
 │         ├── maing.js                 # Script principal du module de gestion des thèmes
 │         ├── themeGrid.js             # Gestion de la grille des thèmes
 │         ├── themeOptions.js          # Gestion du menu de configuration des options de thème
 |         └── utils.js                 # Utilitaires généraux du plugin Celebrations
 ├── Lib/
 │    ├── AssetHanfler.pm               # Gestionnaire de ressources CSS/JS et ressources des thèmes
 │    ├── Config.pm                     # Gestionnaire de configuration des thèmes du plugin Celebrations
 │    ├── I18n.pm                       # Gestionnaire de traductions pour le plugin Celebrations
 │    ├── TemplateBuilder.pm            # Constructeur de templates pour le plugin Celebrations
 │    ├── ThemeController.pm            # Contrôleur REST des thèmes pour le plugin Celebrations
 │    └── ThemeManager.pm               # Gestionnaire de thèmes pour le plugin Celebrations
 └─── template/
      ├── disabled.tt                   # Template quand le plugin est désactivé
      ├── homeTheme.tt                  # Template quand le plugin est activé

 scripts/
 ├── bundle-plugin-js.js                # Script de bundling pour le js de la page de configuration
 └── test-env.sh                        # Script qui permet l'automatisation du lancement des tests

 t/
 ├── 01-load.t                          # Test de chargement
 ├── 02-critic.t                        # Test du code Perl
 ├── 03-lifecycle.t                     # Test de désinstallation
 ├── 04-translation.t                   # Test de validiter des fichier de langue I18N
 └── 05-config.t                        # test de validiter du fichier theme-config.json
```

<br><br>

## Installation Développeur

Cette section explique comment installer le plugin en mode développement afin de pouvoir modifier le code et tester directement sur une instance Koha locale.

si vous n'avez pas de Koha installé localement vous pouvez l'installer facilement avec cette commande :

```bash
git clone --branch main --single-branch --depth 1 https://git.koha-community.org/Koha-community/Koha.git koha
```

si vous voulez en aprendre plus sur koha voici la documentation officiel :

[![Koha Documentation](https://img.shields.io/badge/Koha-Documentation-4a9b32?logo=readthedocs&logoColor=white)](https://koha-community.org/manual/latest/fr/html/index.html)

### Étape

1. **Forker le projet et le télécharger sur votre poste de travail**
2. **Créer un lien symbolique vers Koha**

  Dans votre instance Koha (généralement /var/lib/koha/`<instance>`/plugins), créez un lien symbolique vers le dossier du plugin :

```bash
ln -s /chemin/vers/koha-plugin-celebrations /var/lib/koha/<instance>/plugins/Koha/Plugin/Celebrations
```

3. **Installer le plugin dans Koha**

Exécuter le script Koha pour télécharger le plugin depuis le répertoire de votre koha :

```bash
./misc/devel/install_plugins.pl
```

4. **Installer les dépendances front-end**

Dans le dossier de l'extension :

```bash
npm install
```

1. **Compiler les fichiers JavaScript de l’interface administrateur**

Le plugin utilise un système de bundling automatique : tous les fichiers situés dans
`Koha/Plugin/Celebrations/js/template/` sont fusionnés en un seul fichier JavaScript chargé dans l’interface d’administration.

Pour que vos modifications soient prises en compte :

Développement (avec surveillance automatique) utilisez :

````bash
npm run dev
````
Cette commande surveille en continu le dossier `js/template/` et reconstruit automatiquement le bundle `js/dist/celebrations-bundle.js` à chaque changement.

#### Première installation ou reprise d’un plugin cloné

Lorsque vous installez ou clonez le plugin pour la première fois :

Cela crée le fichier celebrations-bundle.js et met à jour le template pour charger ce bundle.

Si vous utilisez un plugin en mode développement via lien symbolique (dans `/var/lib/plugins/`), ce bundling doit être fait avant d’ouvrir la page d’administration, sinon aucun script ne sera chargé.

<br><br>

## Suite de Tests Automatisés

Pour garantir la qualité et la non-régression, le plugin inclut une suite de tests complète. Vous pouvez les lancer avec la commande
```bash
npm run test
```

-   `t/01-load.t` : Vérifie que le module principal du plugin se charge correctement.
-   `t/02-critic.t` : Analyse statique du code avec `Perl::Critic` pour assurer le respect des bonnes pratiques de codage Perl.
-   `t/03-lifecycle.t` : Teste le cycle de vie du plugin (installation, mise à jour, désinstallation).
-   `t/04-translation.t` : Assure la cohérence des fichiers de traduction. Il vérifie que toutes les clés de `default.inc` sont présentes dans les autres langues, et que toutes les options de `theme-config.json` sont bien traduisibles.
-   `t/05-config.t` : vérifie la validité structurelle du fichier de configuration des thèmes (theme-config.json) en le comparant à son schéma JSON, et garantit l'existence physique de tous les fichiers CSS et JavaScript associés à chaque thème et option définis dans cette configuration.

<br><br>

## Architecture "Data-Driven"

Le plugin utilise une architecture entièrement orientée données : tous les thèmes et leurs options sont décrits en JSON, et l’interface se génère automatiquement à partir de ces données. Ajouter, modifier ou supprimer un thème ne nécessite aucun changement de code — tout s’adapte automatiquement pour garantir cohérence et simplicité. Pour ajouter ou modifier un thème, il n'est pas nécessaire de modifier le code Perl. Il suffit de :
1.  Ajouter vos fichiers `.css` et `.js` dans les dossiers `Koha/Plugin/Celebrations/css/` et `js/`.
2.  Déclarer le nouveau thème, ses éléments et ses options dans le fichier `Koha/Plugin/Celebrations/config/theme-config.json`.
3.  Ajouter les traductions pour les nouvelles options dans les fichiers du dossier `Koha/Plugin/Celebrations/i18n/`, la clé doit toujours correspondre à la valeur du champs `"setting"` du fichier `""theme-config.json`.
4.  Lancer les tests pour être sûr que tout est bien configuré
5.  Tous les éléments dans le menu administrateur du plugin pour votre nouveau thème seront ajoutés automatiquement et fonctionneras parfaitement.

<br>

### 1.0 Déclaration des routes statiques (API)

Les fichiers CSS, JavaScript et images du plugin ne sont **pas accessibles directement**
par le système de fichiers.
Ils doivent être **explicitement exposés via l’API du plugin**.

Pour cela, le plugin utilise les fichiers suivants :

```bash
Koha/Plugin/Celebrations/api/
 ├── api_routes.json   # Routes API (actions métier)
 ├── css.json          # Routes des fichiers CSS statiques
 ├── js.json           # Routes des fichiers JS statiques
 └── images.json       # Routes des images
```

Chaque fichier JSON déclare les routes publiques vers les ressources statiques du plugin.
Ces routes sont automatiquement enregistrées via la méthode static_routes() du plugin.

Exemple (images.json) :

```json
{
  "/static/images/inLibro_fr.svg": {
    "get": {
      "x-mojo-to": "Static#get",
      "operationId": "celebrations_static_image_inlibro_fr"
    }
  }
}
```
> Cet exemple expose le fichier `images/inLibro_fr.svg` via l’API REST du plugin.
> La structure complète inclut la gestion des réponses HTTP (200, 404, 500),
> mais n’est pas détaillée ici pour rester lisible.


Une fois déclarée, la ressource est accessible via l’API Koha :

/api/v1/contrib/<api_namespace>/static/images/gold-easter-egg.png

**Important**

Si un fichier CSS, JS ou une image n’est pas déclaré dans ces fichiers JSON,
il ne sera pas accessible dans l’OPAC, même s’il existe physiquement.


<br>

### 1. Fichiers du Thème
Dans le dossier `Koha/Plugin/Celebrations/js` et/ou `Koha/Plugin/Celebrations/css`, créez un sous-dossier portant le **nom exact du thème** (ex: `halloween`). Pour chaque élément visuel du thème, vous devez fournir soit un fichier **CSS** (`.css`), soit un fichier **JavaScript** (`.js`), ou les **deux**, dans les dossiers `css/<nom-du-thème>/<nom-du-thème>-<élément>` et `js/<nom-du-thème>/<nom-du-thème>-<élément>` (ex : `js/halloween/halloween-ghost.js`).

<br>


#### 1.1 Utilisation des extra_options et du font_url dans vos fichiers JS/CSS

---


##### Les options configurées dans extra_options sont automatiquement transmises à vos fichiers JavaScript sous la forme d’un objet global nommé :

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

---

##### Utilisation de font_url

Si un thème définit un font_url, celui-ci est automatiquement chargé dans l’OPAC.
Vous pouvez directement utiliser cette police dans vos fichiers CSS du thème :

````css
h1 {
  font-family: 'Mountains of Christmas', cursive;
}
````
---

##### Utilisation de api_namespace

Le champ api_namespace est automatiquement exposé dans les options du thème.
Il peut être utilisé pour construire des URLs vers les ressources statiques du plugin via l’API REST :
```bash
const apiNamespace = options.api_namespace;
const eggImages = [
  `/api/v1/contrib/${apiNamespace}/static/images/gold-easter-egg.png`,
  `/api/v1/contrib/${apiNamespace}/static/images/purple-easter-egg.png`
];
```
Cette approche garantit des chemins compatibles avec tous les environnements Koha (local, test, production).

---

##### Prévisualisation dans un iframe

La prévisualisation des thèmes s’effectue dans un iframe redimensionné.
Certains éléments visuels très fins (lignes, toiles, particules…) peuvent alors devenir difficilement visibles.

Il est possible de détecter le chargement dans un iframe et d’adapter légèrement le rendu uniquement pour la prévisualisation :

```js
if (window.self !== window.top) {
  document.querySelectorAll('.spider')
    .forEach(el => el.classList.add('bigthickline'));
}
```

Cette technique permet d’améliorer la lisibilité en prévisualisation sans impacter le rendu final dans l’OPAC.

<br>

### 2. Configuration dans `theme-config.json`
Déclarez votre thème et ses éléments dans le fichier `Koha/Plugin/Celebrations/config/theme-config.json` en respectant la structure suivante :
* Le nom du theme dans le fichier config doit être le même que celui utiliser pour vos dossier dans `js` et `css`
* **Structure de base :** Le thème doit contenir une clé `font_url` (facultatif donc laisser la valeur vide si ce n'est pas nécessaire) et le hash `elements`.
* **Éléments :** Chaque élément dans `elements` doit définir :
    * `setting`: La clé de traduction et de configuration (doit être unique).
    * `file`: Le nom de base du fichier sans l'extension (ex: si vos fichiers sont `halloween-spider.css` et `halloween-spider.js`, `file` doit être `halloween-spider`).
    * `type`: Indique le type de fichiers utilisés par l'élément visuelle(`"css"`, `"js"`, ou `"both"`).
* **Options Supplémentaires (`extra_options`) :** Chaque élément peut contenir un hash `extra_options` pour les réglages fins. Ces options seront automatiquement ajouter dans le formulaire quand le "checkbox" de l'élément en question sera activé et aussi automatiquement envoyées au fichier JavaScript (`.js`) correspondant à l'élément. Le type de l'option doit être spécifié :
    * `"select"` : Pour les listes déroulantes (doit contenir le nom d'une liste de sélection qui doit se trouver dans les fichiers de traduction).
    * `"range"` : Pour les curseurs (doit contenir : min,max,default).
    * `"ignore"` : Pour les options gérées sans affichage dans l'interface comme par exemple le `api_namespace`.

Ceci ajoute automatiquement votre thème dans la liste de sélection (`<select>`) et génère un groupe de formulaires (`form-group`) contenant les éléments spécifiés dans la configuration. Lorsque votre thème est actif durant une période définie, le plugin enverra automatiquement les fichiers CSS et JS correspondants vers l'OPAC en fonction des options activées par l'utilisateur.

<br>

### 3. Traduction

N’oubliez pas d’ajouter les traductions pour votre nouveau thème dans les fichiers du dossier
**`Koha/Plugin/Celebrations/i18n/`**.

Ces traductions sont utilisées pour :

* les labels des **checkbox / options** dans l’interface administrateur
* les noms des **éléments visuels**
* l’emoji associé au thème

Toutes les modifications se font **uniquement dans la section `T`**.

---

#### 3.1 Traduction des options du thème

Dans la section `T`, créez un hash portant **le nom exact du thème** (ex. `halloween`, `paque`, `noel`).

Ajoutez ensuite une paire clé / valeur pour chaque option définie dans le `theme-config` :

* pour les options de type `select` et `range` → utiliser le nom de l’option
* pour les options de type `ignore` → **ne rien ajouter** (elles ne sont pas affichées)

Exemple :

```perl
"halloween": {
  "couleur_halloween": "Activer les couleurs d’Halloween 🟠 ⚫",
  "footer_halloween": "Activer les éléments du pied de page 🎃",
  "activation_spiders": "Activer l’effet d’araignées 🕷️",
  "quantite_spiders": "Nombre d’araignées :",
  "activation_ghost": "Activer le curseur fantôme 👻 (visible uniquement sur ordinateur)"
},
```

---

#### 3.2 Options `select`

Pour les options de type `select`, ajoutez également les valeurs possibles dans les traductions.
La clé doit correspondre au `option_type` défini dans le fichier de configuration du thème.

Exemple :

```perl
"option_vitesse": [
  { "key": "vitesse_lent", "label": "Lent" },
  { "key": "vitesse_normale", "label": "Normal" },
  { "key": "vitesse_rapide", "label": "Rapide" }
],
```

---

#### 3.3 Traduction des éléments visuels

Chaque élément visuel défini dans `elements` doit également être traduit afin d’être affiché correctement dans l’interface.

Exemple :

```perl
"elements": {
  "couleurs": "Couleurs",
  "footer": "Pied de page",
  "snow": "Flocons",
  "countdown": "Compte à rebours",
  "feux": "Feux d’artifice",
  "ghost": "Fantômes",
  "spider": "Araignées",
  "egg": "Œufs",
  "coeur": "Cœurs"
},
```

---

#### 3.4 Emoji du thème

Chaque thème peut être associé à un emoji utilisé dans l’interface.
Ajoutez-le dans la section `emoji` :

```perl
"emoji": {
  "noel": "🎄",
  "halloween": "👻",
  "saint-valentin": "💝",
  "paque": "🐰",
  "feux-artifice": "🎆",
  "default": "🎨"
},
```

<br>

### 4. Validation finale

Avant de considérer un thème comme prêt à être utilisé ou partagé, assurez-vous que les points suivants sont respectés :

- La configuration du thème est conforme au schéma
  **`config/theme-config.schema.json`**
- Tous les fichiers **CSS / JS** déclarés dans `theme-config.json` existent bien
- Les traductions sont complètes dans les fichiers du dossier **`i18n/`**
- L’emoji et les éléments visuels du thème sont correctement déclarés

Enfin, lancez la suite de tests automatisés pour valider l’ensemble :

```bash
npm run test
```

Aucun avertissement ou erreur ne doit subsister avant le déploiement

<br><br>

## Déploiement en production

En production :

- le plugin doit être installé sous forme de fichier `.kpz`
- aucun bundling JavaScript n’est nécessaire
- les fichiers `js/dist/` sont déjà inclus

Ne pas utiliser de lien symbolique en production.

<br><br>

## Compatibilité Koha

Ce plugin est compatible avec :

- Koha ≥ 24.05
- OPAC classique et responsive
- Navigateurs modernes (Chrome, Firefox, Edge)

Les versions plus anciennes de Koha ne sont pas garanties.

<br><br>

## Limitations connues

- Les effets très lourds peuvent impacter les performances sur mobile
- La prévisualisation iframe peut modifier légèrement le rendu
- Les curseurs animés sont désactivés sur mobile

<br><br>

## Licence

Ce projet est sous licence GNU General Public License v3.0. Voir le fichier [LICENSE](LICENSE) for details.