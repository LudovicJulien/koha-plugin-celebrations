# Koha Extension: Celebrations ![Confetti](Koha/Plugin/Celebrations/images/Confetti.gif)

[![Build Status](https://github.com/inlibro/koha-plugin-celebrations/actions/workflows/generate_kpz.yml/badge.svg)](https://github.com/inlibro/koha-plugin-celebrations/releases/latest)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/inlibro/koha-plugin-celebrations)](https://github.com/inlibro/koha-plugin-celebrations/releases/latest)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Documentation Français](https://img.shields.io/badge/Docs-Français-blue?style=flat-square&logo=read-the-docs)](docs/README.fr.md)


Add a festive touch to your library OPAC for every special occasion!
This plugin allows you to apply seasonal themes and animations for celebrations such as Christmas, Halloween, Valentine’s Day, and many more.

For an easier onboarding and to better understand the user experience, it is recommended to take a look at the instructions.

[![Instructions](https://img.shields.io/badge/Instructions-📖-blue)](https://inlibro.com/en/instruction-celebrations/)

<br><br>

## Main features

- Themes activated by date range
- Fully customizable themes
- Intuitive administration interface
- Integrated OPAC preview
- **Data-driven** architecture (JSON)
- Multi-language support
- Compatible with desktop and mobile OPAC

<br><br>


## Installation & Development

This section explains how to install the plugin in development mode in order to modify the code and test it on a local Koha instance.

If you don’t have Koha installed locally, you can easily install it with the following command:

```bash
git clone --branch main --single-branch --depth 1 https://git.koha-community.org/Koha-community/Koha.git koha
````

If you want to learn more about Koha, here is the official documentation:

[![Koha Documentation](https://img.shields.io/badge/Koha-Documentation-4a9b32?logo=readthedocs\&logoColor=white)](https://koha-community.org/manual/latest/en/html/index.html)

### Steps

1. **Fork the project and clone it to your workstation**
2. **Create a symbolic link to Koha**

   In your Koha instance (usually `/var/lib/koha/<instance>/plugins`), create a symbolic link to the plugin directory:

```bash
ln -s /path/to/koha-plugin-celebrations /var/lib/koha/<instance>/plugins/Koha/Plugin/Celebrations
```

3. **Install the plugin in Koha**

Run the Koha script to install plugins from your Koha directory:

```bash
./misc/devel/install_plugins.pl
```

4. **Install front-end dependencies**

Inside the plugin directory:

```bash
npm install
```

5. **Build the admin interface JavaScript files**

The plugin uses an automatic bundling system: all files located in
`Koha/Plugin/Celebrations/js/template/` are merged into a single JavaScript file loaded in the admin interface.

To apply your changes:

Development mode (with file watching):

```bash
npm run dev
```

This command continuously watches the `js/template/` directory and automatically rebuilds `js/dist/celebrations-bundle.js` on each change.

#### First installation or cloning an existing plugin

When installing or cloning the plugin for the first time:

* This generates the `celebrations-bundle.js` file
* It updates the template to load this bundle

If you are using the plugin in development mode via a symbolic link (in `/var/lib/plugins/`), bundling **must be done before opening the admin page**, otherwise no scripts will be loaded.

<br><br>

## Architecture (overview)

The plugin is built on a modular, stable, and extensible architecture:

- **Perl backend**: business logic, OpenAPI, asset management
- **JavaScript frontend**: admin interface + OPAC preview
- **JSON configuration**: themes, options, translations
---
Detailed architecture documentation (structure, components, flows) is available here:

[![Architecture](https://img.shields.io/badge/Docs-Architecture-important?style=flat-square&logo=mermaid)](docs/architecture.md)

<br><br>

## Contribution & development

You want to:

* add a new theme
* modify or create a visual effect
* understand the internal architecture
* contribute to the project

Check out the dedicated guide:

[![Contributing](https://img.shields.io/badge/Contribute-Guide-green?style=flat-square\&logo=github)](docs/contributing.md)

<br><br>

## Production deployment

In production:

* the plugin must be installed as a `.kpz` file
* no JavaScript bundling is required
* the `js/dist/` files are already included
* make sure all tests pass

Do not use symbolic links in production.

<br><br>

## Koha compatibility

This plugin is compatible with:

* Koha ≥ 24.05
* Classic and responsive OPAC
* Modern browsers (Chrome, Firefox, Edge)

Older Koha versions are not guaranteed.

<br><br>

## Known limitations

* Heavy visual effects may impact mobile performance
* The iframe preview may slightly alter rendering
* **PLACK must be restarted** for OpenAPI and static routes to work properly

<br><br>

## License

This project is licensed under the GNU General Public License v3.0.
See the [LICENSE](../LICENSE) file for details.
