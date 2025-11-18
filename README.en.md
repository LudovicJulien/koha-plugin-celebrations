# Koha Plugin: Celebrations

[![Build Status](https://github.com/inlibro/koha-plugin-celebrations/actions/workflows/generate_kpz.yml/badge.svg)](https://github.com/inlibro/koha-plugin-celebrations/releases/latest)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/inlibro/koha-plugin-celebrations)](https://github.com/inlibro/koha-plugin-celebrations/releases/latest)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

Add a festive touch to your library's OPAC for every special occasion! This plugin allows you to apply seasonal themes and animations for celebrations like Christmas, Halloween, Valentine's Day, and many others.

For an easier start, it is recommended to check out the instructions:

[![Instructions](https://img.shields.io/badge/Instructions-📖-blue)](https://inlibro.com/extension-koha-celebrations/)

---

## Main Features

- **Seasonal Theme Selection** <br>
Administrators can choose from several predefined themes (Christmas, Halloween, Valentine's Day, Easter, etc.) via a configuration panel.

- **Catalogue Color Modification** <br>
Each theme applies a unique color palette that modifies the overall appearance of the catalogue, including buttons, backgrounds, text, and other graphic elements.

- **Addition of Modern Visual Elements** <br>
Animations, icons, and seasonal decorations (e.g., snowflakes, pumpkins, hearts) are integrated into the interface to reinforce the theme's atmosphere.

- **Activation/Deactivation of Visual Elements** <br>
Certain visual elements can be activated or deactivated independently, allowing for fine customization based on administrator preferences.

- **Advanced Configuration** <br>
Configuration options allow modification of certain visual element parameters (size, position, animation speed, element quantity, etc.).

## Installation

1.  Go to the project's [Releases page](https://github.com/inlibro/koha-plugin-celebrations/releases/latest).
2.  Download the latest `.kpz` file.
3.  Access your Koha staff interface, then go to `Administration > Manage plugins`.
4.  Click on `Upload a plugin` and select the `.kpz` file you just downloaded.
5.  Once the plugin is installed, make sure to activate it by clicking on `Actions > Enable`.

## Configuration

After installation, click on `Actions > Execute tool`. The configuration page allows you to:

1.  **Select a theme** from the dropdown menu.
2.  **Activate or deactivate** different visual effects (colors, animations, etc.) using the toggles.
3.  **Adjust the parameters** of each effect (speed, quantity, size...) using the sliders and dropdown lists.
4.  **Observe your changes live** in the preview window which simulates the OPAC's appearance by clicking on `Preview`.
5.  **Choose the dates** when this celebration theme will automatically be active on the OPAC.
6.  **Click on `Save`** to save and activate the changes on the public OPAC.

## For Developers

This plugin is designed to be stable, maintainable, and easy to extend.

### Automated Test Suite

To ensure quality and non-regression, the plugin includes a complete test suite. You can run them with the command `npm run test`.

-   `t/01-load.t`: Verifies that the plugin's main module loads correctly.
-   `t/02-critic.t`: Performs static code analysis with `Perl::Critic` to ensure adherence to Perl coding best practices.
-   `t/03-lifecycle.t`: Tests the plugin's life cycle (installation, update, uninstallation).
-   `t/04-translation.t`: Ensures consistency of translation files. It verifies that all keys in `default.inc` are present in other languages, and that all options in `theme-config.json` are properly translatable.
-   `t/05-config.t`: Verifies the structural validity of the theme configuration file (`theme-config.json`) against its JSON schema, and guarantees the physical existence of all CSS and JavaScript files associated with each theme and option defined in this configuration.

---

### Data-Driven Architecture:

To add or modify a theme, it is not necessary to change the Perl code. It only requires:
1.  Adding your `.css` and `.js` files to the `Koha/Plugin/Celebrations/css/` and `js/` folders.
2.  Declaring the new theme, its elements, and its options in the `Koha/Plugin/Celebrations/config/theme-config.json` file.
3.  Adding translations for the new options in the files within the `Koha/Plugin/Celebrations/i18n/` folder. The key must always correspond to the `"setting"` field value in the `theme-config.json` file.

#### 1. Theme Files
In the `Koha/Plugin/Celebrations/` folder, create a subfolder with the **exact name of the theme** (e.g., `halloween`). For each visual or functional element of the theme, you must provide either a **CSS** file (`.css`), a **JavaScript** file (`.js`), or **both**, in the respective `css/<theme-name>/` and `js/<theme-name>/` folders.

#### 2. Configuration in `theme-config.json`
Declare your theme and its elements in the `Koha/Plugin/Celebrations/config/theme-config.json` file, respecting the following structure:
* **Base Structure:** The theme must contain a `font_url` key (optional; leave the value empty if not necessary) and the `elements` hash.
* **Elements:** Each element in `elements` must define:
    * `setting`: The translation and configuration key (must be unique).
    * `file`: The base name of the file without the extension (e.g., if your files are `effect.css` and `effect.js`, `file` must be `effect`).
    * `type`: Indicates the type of files used (`"css"`, `"js"`, or `"both"`).
    * `toggle_id`: The ID of the toggle element (checkbox) in the interface.
* **Extra Options (`extra_options`):** Each element can contain an `extra_options` hash for fine adjustments. These options will be automatically sent to the corresponding JavaScript file (`.js`). The option type must be specified:
    * `"select"`: For dropdown lists (must contain the name of a selection list that must be found in the translation files).
    * `"range"`: For sliders (must contain: `min`, `max`, `default`).
    * `"ignore"`: For options managed without display in the interface, such as the `api_namespace`.

This automatically adds your theme to the selection list (`<select>`) and generates a form group (`form-group`) containing the elements specified in the configuration. When your theme is active during a defined period, the plugin will automatically send the corresponding CSS and JS files to the OPAC based on the options activated by the user.

#### 3. Validation and Tests
To ensure your configuration is valid, you must:
* Consult the **`Koha/Plugin/Celebrations/config/theme-config.schema.json`** file, which is there to help you respect the expected structure and data types.
* **Run the tests** (`npm run test`) and ensure they all pass. The **`t/05-config.t`** test specifically verifies the integrity of your theme configuration.

#### 4. Translation
Don't forget to add the translations for your new theme in the files within the **`Koha/Plugin/Celebrations/i18n/`** folder. In the `T` section, you must:

1.  Create a *hash* (dictionary) with the **exact name of the theme** (e.g., `paque`).
2.  In this *hash*, add a key/value pair for each option that has a `setting` key in `theme-config.json`. Example:
```perl
paque => {
    couleur_paque      => "Activer les couleurs de Pâques 🟡 🟢 🟣",
    footer_paque       => "Activer les éléments du pied de page 🧺🥚",
    activation_eggs    => "Activer le curseur d’œufs 🥚 (visible uniquement sur ordinateur)",
}
```

This approach makes the plugin extremely modular.

## Licence

This project is licensed under the GNU General Public License v3.0. See the [LICENSE](LICENSE) file for details..