# Koha Extension: Celebrations ![Confetti](Koha/Plugin/Celebrations/images/Confetti.gif)

[![Build Status](https://github.com/inlibro/koha-plugin-celebrations/actions/workflows/generate_kpz.yml/badge.svg)](https://github.com/inlibro/koha-plugin-celebrations/releases/latest)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/inlibro/koha-plugin-celebrations)](https://github.com/inlibro/koha-plugin-celebrations/releases/latest)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Documentation Française](https://img.shields.io/badge/Docs-Français-blue?style=flat-square&logo=read-the-docs)](README.md)

Add a festive touch to your library’s OPAC for every special occasion! This plugin allows you to apply seasonal themes and animations for celebrations such as Christmas, Halloween, Valentine’s Day, and many more.

For an easier start, it is recommended to check out the instructions:

[![Instructions](https://img.shields.io/badge/Instructions-📖-blue)](https://inlibro.com/extension-koha-celebrations/)

<br><br>

## Table of Contents

- [Koha Extension: Celebrations ](#koha-extension-celebrations-)
  - [Table of Contents](#table-of-contents)
  - [Architecture](#architecture)
  - [Developer Installation](#developer-installation)
    - [Steps](#steps)
      - [First installation or working with a cloned plugin](#first-installation-or-working-with-a-cloned-plugin)
  - [Automated Test Suite](#automated-test-suite)
  - [Data-Driven Architecture](#data-driven-architecture)
    - [1.0 Static Routes Declaration (API)](#10-static-routes-declaration-api)
    - [1. Theme Files](#1-theme-files)
    - [1.1 Using `extra_options` and `font_url` in JS/CSS](#11-using-extra_options-and-font_url-in-jscss)
      - [`extra_options`](#extra_options)
      - [`font_url`](#font_url)
      - [`api_namespace`](#api_namespace)
      - [Preview inside an iframe](#preview-inside-an-iframe)
    - [2. Configuration in `theme-config.json`](#2-configuration-in-theme-configjson)
    - [3. Translations](#3-translations)
      - [3.1 Theme option translations](#31-theme-option-translations)
      - [3.2 `select` options](#32-select-options)
      - [3.3 Visual element translations](#33-visual-element-translations)
      - [3.4 Theme emoji](#34-theme-emoji)
    - [4. Final Validation](#4-final-validation)
  - [Deployment in Production](#deployment-in-production)
  - [Koha Compatibility](#koha-compatibility)
  - [Known Limitations](#known-limitations)
  - [License](#license)

<br><br>

## Architecture

This plugin is designed to be **stable, maintainable, and easy to extend**.

```graphql
Koha/Plugin/
 └── Celebrations.pm                    # Implements Koha hooks and delegates business logic to Lib/* modules

Koha/Plugin/Celebrations/
 ├── api/
 │    ├── api_routes.json               # Theme configuration API routes
 │    ├── css.json                      # Static CSS file routes
 │    ├── images.json                   # Image routes
 │    └── js.json                       # Static JavaScript file routes
 ├── config/
 │    ├── theme-config.json             # Theme configuration file ("Data-driven")
 │    └── theme-config.schema.json      # Configuration schema
 ├── css/
 |    ├── <ThemeName>/
 |    │    └── <VisualElementName>.css  # CSS files for each visual element of the theme
 │    └── template/
 |         ├── disabled-css.tt          # Admin interface CSS when plugin is disabled
 |         └── homeTheme.css            # Admin interface CSS when plugin is enabled
 ├── i18n/
 |    ├── disabled-css.tt               # Default English translation
 |    └── homeTheme.css                 # French translation
 ├── images/                            # Images used by the plugin
 ├── js/
 │    ├── dist/
 │    |    └── celebration-bundle.js    # Compiled configuration page bundle
 |    ├── <ThemeName>/
 |    │    └── <VisualElementName>.js   # JavaScript files for each visual element of the theme
 │    └── template/
 │         ├── config.js                # Global configuration
 │         ├── devicePreview.js         # Multi-device preview system
 │         ├── formHandler.js           # Theme form handling
 │         ├── maing.js                 # Main theme management module script
 │         ├── themeGrid.js             # Theme grid management
 │         ├── themeOptions.js          # Theme options configuration menu
 |         └── utils.js                 # General utilities for the Celebrations plugin
 ├── Lib/
 │    ├── AssetHanfler.pm               # CSS/JS and theme asset manager
 │    ├── Config.pm                     # Theme configuration manager
 │    ├── I18n.pm                       # Translation manager
 │    ├── TemplateBuilder.pm            # Template builder
 │    ├── ThemeController.pm            # Theme REST controller
 │    └── ThemeManager.pm               # Theme manager
 └─── template/
      ├── disabled.tt                   # Template when the plugin is disabled
      ├── homeTheme.tt                  # Template when the plugin is enabled

 scripts/
 ├── bundle-plugin-js.js                # JavaScript bundling script for the configuration page
 └── test-env.sh                        # Script to automate test execution

 t/
 ├── 01-load.t                          # Load test
 ├── 02-critic.t                        # Perl code quality test
 ├── 03-lifecycle.t                     # Plugin lifecycle test (install/uninstall)
 ├── 04-translation.t                   # I18N translation file validation test
 └── 05-config.t                        # theme-config.json validation test
```

<br><br>

## Developer Installation

This section explains how to install the plugin in **development mode** to allow live editing and testing on a local Koha instance.

If you do not already have a local Koha installation:

```bash
git clone --branch main --single-branch --depth 1 https://git.koha-community.org/Koha-community/Koha.git koha
```

If you want to know more here is the Koha official documentation:

[![Koha Documentation](https://img.shields.io/badge/Koha-Documentation-4a9b32?logo=readthedocs\&logoColor=white)](https://koha-community.org/manual/latest/en/html/index.html)

<br>

### Steps

1. **Fork and clone the project**
2. **Create a symbolic link inside your Koha instance**

In your Koha instance (usually /var/lib/koha/`<instance`>/plugins), create a symbolic link to the plugin directory:

```bash
ln -s /path/to/koha-plugin-celebrations \
/var/lib/koha/<instance>/plugins/Koha/Plugin/Celebrations
```

1. **Install the plugin**

Run the Koha script to install the plugin from your Koha directory:

```bash
./misc/devel/install_plugins.pl
```

1. **Install front-end dependencies**

In the plugin directory

```bash
npm install
```

1. **Build the admin JavaScript**


The plugin uses an automatic bundling system: all files located in
`Koha/Plugin/Celebrations/js/template/` are merged into a single JavaScript file loaded in the administration interface.

To ensure your changes are applied:

Development mode (with automatic file watching), use:

```bash
npm run dev
```

This command watches `js/template/` and automatically rebuilds
`js/dist/celebrations-bundle.js` on every change.

#### First installation or working with a cloned plugin

When you install or clone the plugin for the first time:

This process generates the celebrations-bundle.js file and updates the template to load this bundle.

If you are using the plugin in development mode via a symbolic link (inside /var/lib/koha/<instance>/plugins), this bundling step must be completed before opening the administration page, otherwise no JavaScript will be loaded.

<br><br>

## Automated Test Suite

To ensure quality and prevent regressions, the plugin includes a complete test suite:

```bash
npm run test
```

- `t/01-load.t`: Ensures that the main plugin module loads correctly.
- `t/02-critic.t`: Performs static code analysis using `Perl::Critic` to enforce Perl best practices.
- `t/03-lifecycle.t`: Tests the plugin lifecycle (installation, upgrade, and uninstallation).
- `t/04-translation.t`: Validates translation consistency. It checks that all keys from `default.inc` exist in other language files and that all options defined in `theme-config.json` are translatable.
- `t/05-config.t`: Validates the structural correctness of the theme configuration file (`theme-config.json`) against its JSON schema and ensures that all referenced CSS and JavaScript files physically exist for each declared theme and option.


<br><br>

## Data-Driven Architecture

The plugin relies on a fully data-driven architecture: all themes and their options are defined in JSON, and the administrative interface is generated automatically from these definitions. Adding, modifying, or removing a theme does **not** require any Perl code changes — everything adapts dynamically to ensure consistency and simplicity.

To add or modify a theme, you only need to:

1. Add your `.css` and `.js` files to the `Koha/Plugin/Celebrations/css/` and `Koha/Plugin/Celebrations/js/` directories.
2. Declare the new theme, its visual elements, and options in `Koha/Plugin/Celebrations/config/theme-config.json`.
3. Add translations for the new options in the files located in `Koha/Plugin/Celebrations/i18n/`.
   The translation keys must always match the `"setting"` values defined in `theme-config.json`.
4. Run the test suite to ensure everything is correctly configured.
5. All elements for the new theme will automatically appear in the plugin’s administrative interface and work as expected.


<br>

### 1.0 Static Routes Declaration (API)

CSS, JavaScript, and image files used by the plugin are **not directly accessible**
from the filesystem.
They must be **explicitly exposed through the plugin API**.

To achieve this, the plugin relies on the following files:

```bash
Koha/Plugin/Celebrations/api/
 ├── api_routes.json   # API routes (business actions)
 ├── css.json          # Static CSS file routes
 ├── js.json           # Static JavaScript file routes
 └── images.json       # Image routes
````

Each JSON file declares the public routes for the plugin’s static resources.
These routes are automatically registered through the plugin’s
`static_routes()` method.

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

> This example exposes the file `images/inLibro_fr.svg` through the plugin REST API.
> The full response definitions (200, 404, 500) are omitted here for readability.

Once declared, the resource becomes accessible through the Koha API:

```
/api/v1/contrib/<api_namespace>/static/images/gold-easter-egg.png
```

**Important**

If a CSS, JS, or image file is **not declared** in these JSON files,
it will **not be accessible in the OPAC**, even if it exists on disk.

<br>

### 1. Theme Files

Inside `Koha/Plugin/Celebrations/js` and/or `Koha/Plugin/Celebrations/css`,
create a subdirectory using the **exact theme name** (e.g. `halloween`).

For each visual element of the theme, you must provide either:

* a **CSS file** (`.css`)
* a **JavaScript file** (`.js`)
* or **both**

Files must follow this structure:

* `css/<theme-name>/<theme-name>-<element>.css`
* `js/<theme-name>/<theme-name>-<element>.js`

Example:

```
js/halloween/halloween-ghost.js
```

<br>

### 1.1 Using `extra_options` and `font_url` in JS/CSS

---

#### `extra_options`

Options defined in `extra_options` are automatically injected into your
JavaScript files as a global object named:

```js
window["<themeName>ThemeOptions"]
```

Example for the `noel` theme:

```js
const options = window["noelThemeOptions"] || {};
const speed = options.vitesse_flocons;
const amount = options.quantite_flocons;
```

This allows you to dynamically adapt visual effects based on the
administrator’s configuration.

---

#### `font_url`

If a theme defines a `font_url`, the font is automatically loaded in the OPAC.
You can directly use it in your theme CSS files:

```css
h1 {
  font-family: 'Mountains of Christmas', cursive;
}
```

---

#### `api_namespace`

The `api_namespace` value is automatically exposed in the theme options.
It can be used to build URLs pointing to static plugin resources via the REST API:

```js
const apiNamespace = options.api_namespace;

const eggImages = [
  `/api/v1/contrib/${apiNamespace}/static/images/gold-easter-egg.png`,
  `/api/v1/contrib/${apiNamespace}/static/images/purple-easter-egg.png`
];
```

This guarantees paths that work across all Koha environments
(local, staging, production).

---

#### Preview inside an iframe

Theme previews are rendered inside a scaled iframe.
Very thin visual elements (lines, webs, particles, etc.) may become hard to see.

You can detect iframe rendering and slightly adjust the visuals
**only for preview mode**:

```js
if (window.self !== window.top) {
  document.querySelectorAll('.spider')
    .forEach(el => el.classList.add('bigthickline'));
}
```

This improves preview readability without affecting the final OPAC rendering.

<br>

### 2. Configuration in `theme-config.json`

Declare your theme and its visual elements in
`Koha/Plugin/Celebrations/config/theme-config.json` following these rules:

- The **theme name** used in the configuration file **must match exactly**
  the folder names used in `js/` and `css/`.

- **Base structure**
  A theme must define:
  - an optional `font_url` (leave it empty if not needed)
  - an `elements` hash

- **Elements**
  Each entry inside `elements` must define:
  - `setting`: Translation and configuration key (must be unique)
  - `file`: Base filename **without extension**
    (e.g. if files are `halloween-spider.css` and `halloween-spider.js`,
    the value must be `halloween-spider`)
  - `type`: Type of asset used by the visual element:
    - `"css"`
    - `"js"`
    - `"both"`

- **Additional options (`extra_options`)**
  Each element may define an `extra_options` hash for fine-grained settings.

  These options are:
  - automatically displayed in the admin form when the element checkbox is enabled
  - automatically passed to the corresponding JavaScript file

  Supported option types:
  - `"select"`: Dropdown list
    → must reference a list defined in translation files
  - `"range"`: Slider
    → must define `min`, `max`, and `default`
  - `"ignore"`: Internal option
    → not displayed in the admin UI (e.g. `api_namespace`)

Once defined, the theme is automatically added to the `<select>` list and its
configuration form is generated dynamically.

When a theme is active during its configured date range, the plugin
automatically injects the corresponding CSS and JS files into the OPAC,
based on the options enabled by the administrator.

<br>

### 3. Translations

Do not forget to add translations for your new theme in:

**`Koha/Plugin/Celebrations/i18n/`**

Translations are used for:
- **checkboxes and option labels** in the admin interface
- **visual element names**
- the **theme emoji**

All changes must be made **only inside the `T` section**.

---

#### 3.1 Theme option translations

Inside the `T` section, create a hash using the **exact theme name**
(e.g. `halloween`, `noel`, `paque`).

Then add a key/value pair for each option defined in `theme-config.json`:

- for `select` and `range` options → use the option name
- for `ignore` options → **do not add anything** (they are not displayed)

Example:

```perl
"halloween": {
  "couleur_halloween": "Enable Halloween colors 🟠 ⚫",
  "footer_halloween": "Enable footer decorations 🎃",
  "activation_spiders": "Enable spider effect 🕷️",
  "quantite_spiders": "Number of spiders:",
  "activation_ghost": "Enable ghost cursor 👻 (desktop only)"
},
````

---

#### 3.2 `select` options

For `select` options, you must also define the available choices in the
translation files.

The key must match the `option_type` defined in the theme configuration.

Example:

```perl
"option_vitesse": [
  { "key": "vitesse_lent", "label": "Slow" },
  { "key": "vitesse_normale", "label": "Normal" },
  { "key": "vitesse_rapide", "label": "Fast" }
],
```

---

#### 3.3 Visual element translations

Each visual element defined in `elements` must also be translated
to be displayed correctly in the admin interface.

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

#### 3.4 Theme emoji

Each theme can be associated with an emoji used in the interface.

Add it in the `emoji` section:

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

### 4. Final Validation

Before considering a theme ready to be used or shared, ensure that the following points are met:

- The theme configuration adheres to the schema in **`config/theme-config.schema.json`**
- All **CSS / JS** files declared in `theme-config.json` exist
- Translations are complete in the **`i18n/`** folder
- The theme's emoji and visual elements are correctly declared

Finally, run the automated test suite to validate everything:

```bash
npm run test
````

No warnings or errors should remain before deployment.

<br><br>

## Deployment in Production

In production:

* The plugin should be installed as a `.kpz` file
* No JavaScript bundling is necessary
* The files in `js/dist/` are already included

Do not use symbolic links in production.

<br><br>

## Koha Compatibility

This plugin is compatible with:

* Koha ≥ 24.05
* Both classic and responsive OPAC
* Modern browsers (Chrome, Firefox, Edge)

Older versions of Koha are not guaranteed.

<br><br>

## Known Limitations

* Heavy effects may impact performance on mobile
* Iframe preview may slightly alter the rendering
* Animated sliders are disabled on mobile

<br><br>

## License

This project is licensed under the GNU General Public License v3.0. See the [LICENSE](LICENSE) file for details.
