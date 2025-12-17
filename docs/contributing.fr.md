# Contribuer à l'extension Koha Celebrations

[![⬅ Retour au README](https://img.shields.io/badge/⬅%20Retour-README-blue?style=flat-square)](README.fr.md)

Merci de votre intérêt pour l'extension **Koha Celebrations**
Ce document explique **comment contribuer proprement** au projet.

<br>

## Table des matière

- [Table des matière](#table-des-matière)
- [Philosophie : Architecture Data-Driven](#philosophie--architecture-data-driven)
  - [1.0 Déclaration des routes statiques (API)](#10-déclaration-des-routes-statiques-api)
  - [1. Fichiers du Thème](#1-fichiers-du-thème)
  - [2. Configuration dans `theme-config.json`](#2-configuration-dans-theme-configjson)
  - [3. Traduction](#3-traduction)
  - [4. Validation finale](#4-validation-finale)
- [Build \& packaging](#build--packaging)
- [Bonnes pratiques](#bonnes-pratiques)

<br>

#### Table des matière

      - [3.4 Emoji du thème](#34-emoji-du-thème)
    - [4. Validation finale](#4-validation-finale)
      - [Suite de Tests Automatisés](#suite-de-tests-automatisés)
  - [Build \& packaging](#build--packaging)
  - [Bonnes pratiques](#bonnes-pratiques)

<br>

## Philosophie : Architecture Data-Driven

L'extension est conçu selon une approche **100 % data-driven** :

- Aucun thème n’est codé en dur
- Les thèmes sont décrits en **JSON**
- L’interface admin se génère automatiquement
- Aucun code Perl n’est requis pour ajouter un thème

 Objectif : **simplicité, robustesse, extensibilité**

<br>

### 1.0 Déclaration des routes statiques (API)

Les fichiers CSS, JavaScript et images de l'extension ne sont **pas accessibles directement**
par le système de fichiers.
Ils doivent être **explicitement exposés via l’API de l'extension**.

Pour cela, l'extension utilise les fichiers suivants :

```bash
Koha/Plugin/Celebrations/api/
 ├── api_routes.json   # Routes API REST(actions métier)
 ├── css.json          # Routes des fichiers CSS statiques
 ├── js.json           # Routes des fichiers JS statiques
 └── images.json       # Routes des images statiques
```

Chaque fichier JSON déclare les routes publiques vers les ressources statiques de l'extension.
Ces routes sont automatiquement enregistrées via la méthode static_routes() de l'extension.

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
> Cet exemple expose le fichier `images/inLibro_fr.svg` via l’API REST de l'extension.
> La structure complète inclut la gestion des réponses HTTP (200, 404, 500),
> mais n’est pas détaillée ici pour rester lisible.


Une fois déclarée, la ressource est accessible via l’API Koha :

/api/v1/contrib/<api_namespace>/static/images/gold-easter-egg.png

**Important**

Si un fichier CSS, JS ou une image n’est pas déclaré dans ces fichiers JSON,
il ne sera pas accessible dans l’OPAC, même s’il existe physiquement.

<br>

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
Il peut être utilisé pour construire des URLs vers les ressources statiques de l'extension via l’API REST :
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

Ceci ajoute automatiquement votre thème dans la liste de sélection (`<select>`) et génère un groupe de formulaires (`form-group`) contenant les éléments spécifiés dans la configuration. Lorsque votre thème est actif durant une période définie, l'extension enverra automatiquement les fichiers CSS et JS correspondants vers l'OPAC en fonction des options activées par l'utilisateur.

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

Enfin, lancez la suite de tests automatisés pour valider l’ensemble

#### Suite de Tests Automatisés

Pour garantir la qualité et la non-régression, l'extension inclut une suite de tests complète. Vous pouvez les lancer avec la commande
```bash
npm run test
```

-   `t/01-load.t` : Vérifie que le module principal de l'extension se charge correctement.
-   `t/02-critic.t` : Analyse statique du code avec `Perl::Critic` pour assurer le respect des bonnes pratiques de codage Perl.
-   `t/03-lifecycle.t` : Teste le cycle de vie de l'extension (installation, mise à jour, désinstallation).
-   `t/04-translation.t` : Assure la cohérence des fichiers de traduction. Il vérifie que toutes les clés de `default.inc` sont présentes dans les autres langues, et que toutes les options de `theme-config.json` sont bien traduisibles.
-   `t/05-config.t` : vérifie la validité structurelle du fichier de configuration des thèmes (theme-config.json) en le comparant à son schéma JSON, et garantit l'existence physique de tous les fichiers CSS et JavaScript associés à chaque thème et option définis dans cette configuration.

Aucun avertissement ou erreur ne doit subsister avant le déploiement

<br><br>

## Build & packaging

Le packaging `.kpz` est généré automatiquement via GitHub Actions.

<br>

## Bonnes pratiques

* Pas de logique métier dans le frontend
* Pas de thème codé en dur
* JSON toujours validé
* Traductions complètes

<br>

Merci pour votre contribution 💙

<br>

---

[![⬅ Retour au README](https://img.shields.io/badge/⬅%20Retour-README-blue?style=flat-square)](README.fr.md)