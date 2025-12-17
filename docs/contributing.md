# Contributing to the Koha Celebrations plugin

[![⬅ Back to README](https://img.shields.io/badge/⬅%20Back-README-blue?style=flat-square)](../README.md)

Thank you for your interest in the **Koha Celebrations** plugin.
This document explains **how to contribute properly** to the project.

<br>

## Table of contents

- [Table of contents](#table-of-contents)
- [Philosophy: Data-Driven Architecture](#philosophy-data-driven-architecture)
  - [1. Static routes declaration (API)](#1-static-routes-declaration-api)
  - [2. Theme files](#2-theme-files)
  - [3. Configuration in `theme-config.json`](#3-configuration-in-theme-configjson)
  - [4. Translation](#4-translation)
  - [5. Final validation](#5-final-validation)
- [Build \& packaging](#build--packaging)
- [Best practices](#best-practices)

<br>

## Philosophy: Data-Driven Architecture

The plugin is designed following a **100% data-driven** approach:

- No theme is hard-coded
- Themes are fully described in **JSON**
- The admin interface is generated automatically
- No Perl code is required to add a theme

Goal: **simplicity, robustness, extensibility**

<br>

### 1. Static routes declaration (API)

The plugin’s CSS, JavaScript, and image files are **not directly accessible**
from the filesystem.
They must be **explicitly exposed through the plugin API**.

To achieve this, the plugin uses the following files:

```bash
Koha/Plugin/Celebrations/api/
 ├── api_routes.json   # REST API routes (business actions)
 ├── css.json          # Static CSS file routes
 ├── js.json           # Static JavaScript file routes
 └── images.json       # Static image routes
````

Each JSON file declares public routes for the plugin’s static resources.
These routes are automatically registered via the plugin’s `static_routes()` method.

Example (`images.json`):

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

> This example exposes the `images/inLibro_fr.svg` file through the plugin REST API.
> The full structure includes HTTP response handling (200, 404, 500),
> but it is not detailed here for clarity.

Once declared, the resource is accessible via the Koha API:

```
/api/v1/contrib/<api_namespace>/static/images/gold-easter-egg.png
```

**Important**

If a CSS file, JavaScript file, or image is not declared in these JSON files,
it will not be accessible in the OPAC, even if it physically exists.

<br>
<br>

### 2. Theme files

Inside the `Koha/Plugin/Celebrations/js` and/or `Koha/Plugin/Celebrations/css` directories,
create a subdirectory with the **exact theme name** (e.g. `halloween`).

For each visual element of the theme, you must provide either a **CSS** file (`.css`),
a **JavaScript** file (`.js`), or **both**, located in:

* `css/<theme-name>/<theme-name>-<element>`
* `js/<theme-name>/<theme-name>-<element>`

Example: `js/halloween/halloween-ghost.js`

<br>

#### 2.1 Using `extra_options` and `font_url` and `api_namespace` in your JS/CSS files

---

##### Options defined in `extra_options` are automatically passed to your JavaScript files as a global object named:

```js
window["<theme_name>ThemeOptions"]
```

Example for the `noel` theme:

```js
var options = window["noelThemeOptions"] || {};
var speed = options.vitesse_flocons;
var quantity = options.quantite_flocons;
```

This allows you to dynamically adapt visual effects based on the settings chosen in the admin interface.

---

##### Using `font_url`

If a theme defines a `font_url`, it is automatically loaded into the OPAC.
You can directly use this font in your theme’s CSS files:

```css
h1 {
  font-family: 'Mountains of Christmas', cursive;
}
```

---

##### Using `api_namespace`

The `api_namespace` field is automatically exposed in the theme options.
It can be used to build URLs to the plugin’s static resources via the REST API:

```js
const apiNamespace = options.api_namespace;
const eggImages = [
  `/api/v1/contrib/${apiNamespace}/static/images/gold-easter-egg.png`,
  `/api/v1/contrib/${apiNamespace}/static/images/purple-easter-egg.png`
];
```

This approach guarantees paths compatible with all Koha environments
(local, test, and production).

---

##### Preview inside an iframe

Theme previews are rendered inside a resized iframe.
Some very thin visual elements (lines, webs, particles, etc.) may become hard to see.

You can detect iframe rendering and slightly adjust the display **only for preview purposes**:

```js
if (window.self !== window.top) {
  document.querySelectorAll('.spider')
    .forEach(el => el.classList.add('bigthickline'));
}
```

This technique improves preview readability without affecting the final OPAC rendering.

<br>

### 3. Configuration in `theme-config.json`

Declare your theme and its elements in
`Koha/Plugin/Celebrations/config/theme-config.json` following this structure:

* The theme name in the config file must match the directory names used in `js` and `css`
* **Base structure:** the theme must include a `font_url` key (optional — leave empty if unused) and an `elements` hash
* **Elements:** each element in `elements` must define:

  * `setting`: the translation and configuration key (must be unique)
  * `file`: the base filename without extension
    (e.g. if files are `halloween-spider.css` and `halloween-spider.js`, `file` must be `halloween-spider`)
  * `type`: the type of files used by the visual element (`"css"`, `"js"`, or `"both"`)
* **Additional options (`extra_options`):**
  Each element may contain an `extra_options` hash for fine-grained settings.
  These options are automatically:

  * added to the form when the element checkbox is enabled
  * passed to the corresponding JavaScript file

  Option types:

  * `"select"`: dropdown list (must reference a selection list defined in translation files)
  * `"range"`: slider (must define `min`, `max`, `default`)
  * `"ignore"`: options not displayed in the UI (e.g. `api_namespace`)

This automatically adds your theme to the `<select>` list and generates a group of form controls (`form-group`) containing the configured elements.

When your theme is active during a defined period, the plugin automatically injects the corresponding CSS and JS files into the OPAC based on the user’s selected options.

<br>

### 4. Translation

Do not forget to add translations for your new theme in the files located in
**`Koha/Plugin/Celebrations/i18n/`**.

These translations are used for:

* labels of **checkboxes / options** in the admin interface
* names of **visual elements**
* the theme emoji

All changes must be made **only in the `T` section**.

---

#### 4.1 Translating theme options

In the `T` section, create a hash with the **exact theme name**
(e.g. `halloween`, `easter`, `noel`).

Then add a key/value pair for each option defined in `theme-config`:

* for `select` and `range` options → use the option name
* for `ignore` options → **do not add anything** (they are not displayed)

Example:

```perl
"halloween": {
  "couleur_halloween": "Enable Halloween colors 🟠 ⚫",
  "footer_halloween": "Enable footer elements 🎃",
  "activation_spiders": "Enable spider effect 🕷️",
  "quantite_spiders": "Number of spiders:",
  "activation_ghost": "Enable ghost cursor 👻 (desktop only)"
},
```

---

#### 4.2 `select` options

For `select` options, also add the possible values in the translations.
The key must match the `option_type` defined in the theme configuration file.

Example:

```perl
"option_vitesse": [
  { "key": "vitesse_lent", "label": "Slow" },
  { "key": "vitesse_normale", "label": "Normal" },
  { "key": "vitesse_rapide", "label": "Fast" }
],
```

---

#### 4.3 Translating visual elements

Each visual element defined in `elements` must also be translated
so it is properly displayed in the interface.

Example:

```perl
"elements": {
  "couleurs": "Colors",
  "footer": "Footer",
  "snow": "Snowflakes",
  "countdown": "Countdown",
  "feux": "Fireworks",
  "ghost": "Ghosts",
  "spider": "Spiders",
  "egg": "Eggs",
  "coeur": "Hearts"
},
```

---

#### 4.4 Theme emoji

Each theme can be associated with an emoji used in the interface.
Add it in the `emoji` section:

```perl
"emoji": {
  "noel": "🎄",
  "halloween": "👻",
  "saint-valentin": "💝",
  "easter": "🐰",
  "fireworks": "🎆",
  "default": "🎨"
},
```

<br>

### 5. Final validation

Before considering a theme ready for use or sharing, make sure the following points are met:

* The theme configuration conforms to
  **`config/theme-config.schema.json`**
* All **CSS / JS** files declared in `theme-config.json` exist
* Translations are complete in the **`i18n/`** directory
* The theme emoji and visual elements are correctly declared

Finally, run the automated test suite to validate everything.

#### Automated test suite

To ensure quality and prevent regressions, the plugin includes a complete test suite.
You can run it with:

```bash
npm run test
```

* `t/01-load.t`: Verifies that the main plugin module loads correctly
* `t/02-critic.t`: Static code analysis using `Perl::Critic`
* `t/03-lifecycle.t`: Tests the plugin lifecycle (install, upgrade, uninstall)
* `t/04-translation.t`: Ensures translation consistency across languages and theme options
* `t/05-config.t`: Validates the structural integrity of `theme-config.json` and ensures all declared CSS and JS files exist

No warnings or errors should remain before deployment.

<br><br>

## Build & packaging

The `.kpz` package is automatically generated via GitHub Actions.

<br>

## Best practices

* No business logic in the frontend
* No hard-coded themes
* Always validate JSON
* Complete translations

<br>

Thank you for your contribution 💙

<br>

---

[![⬅ Back to README](https://img.shields.io/badge/⬅%20Back-README-blue?style=flat-square)](../README.md)
