# Plugin Célébration OPAC

Le plugin Célébration OPAC permet aux administrateurs de personnaliser l’interface publique de Koha OPAC en appliquant des thèmes saisonniers.
Il facilite la mise en place d’une ambiance visuelle adaptée à différentes périodes de l’année — Noël, Halloween, Saint-Valentin, Pâques, etc.

Chaque thème ajuste automatiquement les couleurs principales, les animations et les éléments décoratifs de l’OPAC afin d’améliorer l’expérience utilisateur et de rendre la plateforme plus vivante et engageante.

Toutes les personnalisations — couleurs, animations, effets et éléments visuels — sont entièrement optionnelles et peuvent être activées ou désactivées individuellement selon les préférences de l’administrateur.

## Utilisation

1. Accéder au panneau d’administration du plugin.

2. Sélectionner le thème souhaité dans la liste déroulante.

3. Activer ou désactiver les éléments visuels selon les besoins.

4. Modifier les paramètres de configuration pour ajuster l’apparence et le comportement des éléments.

5. Enregistrer les modifications pour appliquer le thème a l'OPAC.


## Fonctionnalités principales

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

## Avantages

- Améliore l’attractivité visuelle de l’OPAC pendant les périodes clés de l’année.

- Offre une expérience utilisateur immersive et festive.

- Permet une personnalisation facile et rapide sans modifier le code source.

- Fonctionne de manière modulaire, avec la possibilité de personnaliser et d'activer ou non chaque élément.


##  Architecture Data-Driven

L'architecture du plugin est **Data-Driven (pilotée par les données)**. Cela signifie que la structure des thèmes et de leurs options est définie entièrement par le fichier de configuration **`theme-config.json`** et par le fichier de langue **`inc`**.

Le plugin lit ce fichier JSON et génère automatiquement :
1.  Les options de configuration dans l'interface d'administration (toggles, sliders, selects).
2.  L'envoi des fichiers **CSS** et **JS** pertinents à l'OPAC **uniquement si** le thème et l'élément visuel correspondant sont activés par l'administrateur.
3.  L'envoi des **valeurs des options additionnelles** directement aux fichiers JavaScript pour une personnalisation dynamique et avancée.

Cette approche garantit une grande **modularité**, une **maintenance simplifiée** et permet d'ajouter de nouveaux thèmes **sans modifier le code du plugin**.

---

## 🛠️ Ajout ou Modification d'un Thème

Pour ajouter ou modifier un thème, suivez les étapes ci-dessous :

### 1. Création des Fichiers Thématiques

Pour chaque thème, créez un dossier portant le nom du thème (par exemple, `mon-nouveau-theme`) dans le dossier `css` et `js`.

Pour chaque élément visuel personnalisable (ex. : `couleurs`, `flocons`, `fantomes`), créez un fichier **CSS** et un fichier **JS** dans les dossiers appropriés. Les deux fichiers doivent porter le **même nom**.

> Exemple pour un thème "Hiver" :
> * `css/mon-nouveau-theme/noel_couleur.css`
> * `js/mon-nouveau-theme/noel_couleur.js`
> * `css/mon-nouveau-theme/noel_flocon.css`
> * `js/mon-nouveau-theme/noel_flocon.js`

### 2. Configuration dans `theme-config.json`

Ajoutez une nouvelle entrée (ou modifiez une existante) dans le fichier JSON en suivant cette structure :

| Clé JSON | Description |
| :--- | :--- |
| **`"nom-du-theme"`** | La clé principale pour le thème (doit être le nom du dossier qu'on à créer dans `css` et `js`). |
| **`"font_url"`** | URL d'une police Google Fonts (ou `[]` si aucune police n'est requise). |
| **`"elements"`** | Contient la liste de tous les éléments visuels personnalisables du thème. |
| **`"elements" : { "nom-element" : { ... } }`** | Clé unique pour chaque élément (ex. : `"couleurs"`, `"snow"`). |
| **`"setting"`** | Nom de l'option de configuration pour cet élément (ID unique pour la base de données). |
| **`"file"`** | Nom du fichier CSS/JS (sans l'extension, doit être le même pour les deux). Idéalement on met nomThème_nomélément exemple : `halloween_color` |
| **`"toggle_id"`** | ID unique du toggle qui active/désactive cet élément dans l'interface admin. |
| **`"extra_options"`** | (Optionnel) Contient des options avancées qui seront envoyées au fichier JS. Peuvent donc être récupérer avec `window{nomDuTheme}ThemeOptions` |

#### Structure des `extra_options`

Les options additionnelles peuvent être de trois types :

| Type | Description | Paramètres Requis |
| :--- | :--- | :--- |
| **`ignore`** | Utilisé uniquement pour l'envoi de données brutes vers le JS (ex. : `api_namespace`). | Aucun |
| **`range`** | Crée un curseur (slider) dans l'interface admin pour retourner une valeur entière. | **`min`**, **`max`**, **`default`** (valeurs entières) |
| **`select`** | Crée une liste déroulante (select) dont les options sont définies dans le fichier de langue. | **`option_type`** (clé du fichier de langue) |

```json
// Exemple d'un élément dans theme-config.json
"mon-nouveau-theme": {
    "font_url": "URL_DE_VOTRE_POLICE",
    "elements": {
        "nom_element": {
            "setting": "id_unique_setting",
            "file": "nom_du_fichier_css_js",
            "toggle_id": "id_du_toggle",
            "extra_options": {
                "quantite_objets": {
                    "type": "range",
                    "min": 10,
                    "max": 150,
                    "default": 50
                },
                "ma_select_option": {
                    "type": "select",
                    "option_type": "option_vitesse"
                }
            }
        }
    }
}