# Koha Extension: Celebrations ![Confetti](Koha/Plugin/Celebrations/images/Confetti.gif)

[![Build Status](https://github.com/inlibro/koha-plugin-celebrations/actions/workflows/generate_kpz.yml/badge.svg)](https://github.com/inlibro/koha-plugin-celebrations/releases/latest)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/inlibro/koha-plugin-celebrations)](https://github.com/inlibro/koha-plugin-celebrations/releases/latest)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

Add a festive touch to your library’s OPAC for every special occasion! This plugin allows you to apply seasonal themes and animations for celebrations such as Christmas, Halloween, Valentine’s Day, and many more.

For an easier start, it is recommended to check out the instructions:

[![Instructions](https://img.shields.io/badge/Instructions-📖-blue)](https://inlibro.com/extension-koha-celebrations/)

---

## Table of Contents

- [Koha Extension: Celebrations ](#koha-extension-celebrations-)
  - [Table of Contents](#table-of-contents)
  - [Main Features](#main-features)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [For Developers](#for-developers)
    - [Architecture](#architecture)
    - [Developer Installation](#developer-installation)
        - [First Installation or Cloned Plugin Setup](#first-installation-or-cloned-plugin-setup)
    - [Automated Test Suite](#automated-test-suite)
    - [Data-Driven Architecture](#data-driven-architecture)
      - [1. Theme Files](#1-theme-files)
        - [1.1 Using extra\_options and font\_url in your JS/CSS files](#11-using-extra_options-and-font_url-in-your-jscss-files)
      - [2. Configuration in `theme-config.json`](#2-configuration-in-theme-configjson)
      - [3. Translation](#3-translation)
      - [4. Validation and Testing](#4-validation-and-testing)
  - [License](#license)


## Main Features

- **Seasonal Theme Selection** <br>
Administrators can choose from several predefined themes (Christmas, Halloween, Valentine’s Day, Easter, etc.) via a configuration panel.

- **Catalog Color Customization** <br>
Each theme applies a unique color palette that changes the overall appearance of the catalog, including buttons, backgrounds, text, and other graphical elements.

- **Modern Visual Elements** <br>
Animations, icons, and seasonal decorations (e.g., snowflakes, pumpkins, hearts) are integrated into the interface to enhance the theme’s atmosphere.

- **Enable/Disable Visual Elements** <br>
Some visual elements can be independently enabled or disabled, allowing fine-grained customization according to the administrator's preferences.

- **Advanced Configuration** <br>
Configuration options allow you to modify various visual element parameters (size, position, animation speed, number of elements, etc.).

## Installation

1.  Go to the [Releases page](https://github.com/inlibro/koha-plugin-celebrations/releases/latest) of this project.
2.  Download the latest `.kpz` file.
3.  Access your Koha staff interface and navigate to `Administration > Manage Plugins`.
4.  Click on `Upload a plugin` and select the `.kpz` file you just downloaded.
5.  Once the plugin is installed, make sure to activate it by clicking `Actions > Enable`.

## Configuration

After installation, click `Actions > Run Tool`. The configuration page allows you to:

1.  **Select a theme** from the dropdown menu.
2.  **Enable or disable** different visual effects (colors, animations, etc.) using the switches.
3.  **Adjust settings** for each effect (speed, quantity, size...) with sliders and dropdown lists.
4.  **Preview your changes live** in the preview window simulating the OPAC appearance by clicking `Preview`.
5.  **Select the dates** when this celebration theme will automatically be active on the OPAC.
6.  **Click `Save`** to store and apply changes to the public OPAC.

## For Developers

This plugin is designed to be stable, maintainable, and easy to extend.

### Architecture

```graphql
Koha/Plugin/
 └── Celebrations.pm                     # Main Koha::Plugin::Celebrations plugin

Koha/Plugin/Celebrations/
 ├── api/                               # Plugin-exposed routes
 ├── config/
 │    ├── theme-config.json             # Theme configuration file ("Data-driven")
 │    ├── theme-config.schema.json      # Configuration schema
 ├── css/
 |    ├── <ThemeName>/                  # CSS files for each theme element
 │    ├── template/                     # Admin interface CSS (bundled)
 ├── i18n/                              # Translation files
 ├── images/                            # Contains intranet and theme images
 ├── js/
 |    ├── <ThemeName>/                  # JS files for each theme element
 │    ├── template/                     # Admin interface JS (bundled)
 │    ├── dist/                         # Compiled bundle
 ├── Lib/                               # Perl modules used by the plugin
 └─── template/                         # Admin menu templates

 scripts/                               # Utility scripts
 ├── bundle-plugin-js.js
 └── test-env.sh

 t/                                     # Tests
 ├── 01-load.t
 ├── 05-config.t
 └── ...
````

### Developer Installation

This section explains how to install the plugin in development mode so you can modify code and test directly on a local Koha instance.

1. Fork the project and download it to your workstation.
2. Create a symbolic link to Koha.

In your Koha instance (usually `/var/lib/koha/<instance>/plugins`), create a symbolic link to the plugin folder:

```bash
ln -s /path/to/koha-plugin-celebrations /var/lib/koha/<instance>/plugins/Koha/Plugin/Celebrations
```

3. Install the plugin in Koha

Run the Koha script to register the plugin:

```bash
./misc/devel/install_plugins.pl
```

4. Install front-end dependencies

In the plugin folder:

```bash
npm install
```

5. Compile JavaScript files for the admin interface

The plugin uses an automatic bundling system: all files in
`Koha/Plugin/Celebrations/js/template/` are merged into a single JavaScript file loaded in the admin interface.

For changes to take effect:

For development (with automatic watch), use:

```linux
npm run dev
```

This command continuously monitors the `js/template/` folder and rebuilds the `js/dist/celebrations-bundle.js` bundle automatically on each change.

##### First Installation or Cloned Plugin Setup

When you install or clone the plugin for the first time:

It creates the `celebrations-bundle.js` file and updates the template to load this bundle.

If you are using the plugin in development mode via symbolic link (in `/var/lib/plugins/`), bundling must be done before opening the admin page, otherwise no scripts will load.

### Automated Test Suite

To ensure quality and prevent regressions, the plugin includes a complete test suite. You can run it with `npm run test`.

* `t/01-load.t`: Verifies the main plugin module loads correctly.
* `t/02-critic.t`: Static code analysis using `Perl::Critic` to ensure Perl coding best practices.
* `t/03-lifecycle.t`: Tests the plugin lifecycle (installation, update, uninstallation).
* `t/04-translation.t`: Ensures translation files are consistent. Checks that all `default.inc` keys exist in other languages and that all `theme-config.json` options are translatable.
* `t/05-config.t`: Verifies structural validity of the theme configuration (`theme-config.json`) against its JSON schema, and ensures the physical existence of all CSS and JS files associated with each theme and option defined.

### Data-Driven Architecture

The plugin uses a fully data-driven architecture: all themes and their options are described in JSON, and the interface is generated automatically from this data. Adding, modifying, or removing a theme requires no code changes — everything adapts automatically for consistency and simplicity. To add or modify a theme, you just need to:

1. Add your `.css` and `.js` files to the `Koha/Plugin/Celebrations/css/` and `js/` folders.
2. Declare the new theme, its elements, and options in `Koha/Plugin/Celebrations/config/theme-config.json`.
3. Add translations for new options in the `Koha/Plugin/Celebrations/i18n/` folder. The key must always match the `"setting"` field in `theme-config.json`.
4. Run tests to ensure everything is properly configured.
5. All elements in the plugin admin menu for your new theme will be added automatically.

#### 1. Theme Files

In the `Koha/Plugin/Celebrations/js` and/or `Koha/Plugin/Celebrations/css` folder, create a subfolder with the **exact theme name** (e.g., `halloween`). For each visual element of the theme, provide either a **CSS** file (`.css`), a **JavaScript** file (`.js`), or both in the `css/<theme-name>/<theme-element>` and `js/<theme-name>/<theme-element>` folders (e.g., `js/halloween/halloween-ghost.js`).

##### 1.1 Using extra_options and font_url in your JS/CSS files

Options configured in `extra_options` are automatically passed to your JavaScript files as a global object named:

```js
window["<theme_name>ThemeOptions"]
```

Example for the `christmas` theme:

```js
var options = window["christmasThemeOptions"] || {};
var speed = options.snowflake_speed;
var quantity = options.snowflake_quantity;
```

This allows you to dynamically adapt the visual effect based on the settings chosen in the admin interface.

Using `font_url`

If a theme defines a `font_url`, it is automatically loaded in the OPAC. You can directly use this font in your theme CSS files:

```css
h1 {
  font-family: 'Mountains of Christmas', cursive;
}
```

This approach ensures a clean separation between configuration (JSON) and behavior (JS/CSS).

#### 2. Configuration in `theme-config.json`

Declare your theme and its elements in `Koha/Plugin/Celebrations/config/theme-config.json` following this structure:

* The theme name in the config file must match the folder names in `js` and `css`.
* **Basic structure:** The theme must contain a `font_url` key (optional, leave empty if not needed) and the `elements` hash.
* **Elements:** Each element in `elements` must define:

  * `setting`: Translation and configuration key (must be unique).
  * `file`: Base file name without extension (e.g., for `halloween-spider.css` and `halloween-spider.js`, `file` is `halloween-spider`).
  * `type`: Indicates the type of files used by the visual element (`"css"`, `"js"`, or `"both"`).
  * `toggle_id`: ID of the toggle (checkbox) in the interface.
* **Extra Options (`extra_options`)**: Each element may contain an `extra_options` hash for fine settings. These options are automatically added to the form when the element's checkbox is enabled and sent to the corresponding JS file. Option type must be specified:

  * `"select"`: For dropdown lists (must match a selection list in translation files).
  * `"range"`: For sliders (must specify min,max,default).
  * `"ignore"`: For options handled without displaying in the interface, e.g., `api_namespace`.

This automatically adds your theme to the selection list (`<select>`) and generates a form group (`form-group`) containing the specified elements. When your theme is active during a defined period, the plugin automatically sends the CSS and JS files to the OPAC based on the options enabled by the user.

#### 3. Translation

Don’t forget to add translations for your new theme in the **`Koha/Plugin/Celebrations/i18n/`** folder so that the checkbox labels explain what they enable. In the `T` section, you must:

* Create a hash (dictionary) with the exact theme name (e.g., `easter`).

* Inside this hash, add key/value pairs for each option with a `setting` key in the theme config. For `select` and `range` extra options, use the extra option name as the key; for `ignore` types, leave empty as they should not appear in the admin interface. Example:

```perl
"halloween": {
      "halloween_color": "Enable Halloween colors 🟠 ⚫",
      "footer_halloween": "Enable footer elements 🎃",
      "activation_spiders": "Enable spider effect 🕷️",
      "quantity_spiders": "Number of spiders:",
      "activation_ghost": "Enable ghost cursor 👻 (desktop only)"
    },
```

* For `select` extra options, remember to add available options in translation files with the key matching the `option_type` defined in the theme config. Example:

```perl
"option_speed": [
      { "key": "slow", "label": "Slow" },
      { "key": "normal", "label": "Normal" },
      { "key": "fast", "label": "Fast" }
    ],
```

#### 4. Validation and Testing

To ensure your configuration is valid, you must:

* Check the **`Koha/Plugin/Celebrations/config/theme-config.schema.json`** file, which helps ensure proper structure and data types.
* **Run tests** (`npm run test`) and verify they all pass.

  * This command executes `scripts/test-env.sh`, which:

    * Automatically detects the Koha instance containing the plugin;

    * Configures PERL5LIB correctly to use Koha core and plugin modules;

    * Runs Perl tests using `prove -lv t/`.

This approach makes the plugin highly modular.

## License

This project is licensed under the GNU General Public License v3.0. See the [LICENSE](LICENSE) file for details.
