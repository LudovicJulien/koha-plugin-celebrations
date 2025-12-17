# Extension Koha : Celebrations ![Confetti](../Koha/Plugin/Celebrations/images/Confetti.gif)

[![Build Status](https://github.com/inlibro/koha-plugin-celebrations/actions/workflows/generate_kpz.yml/badge.svg)](https://github.com/inlibro/koha-plugin-celebrations/releases/latest)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/inlibro/koha-plugin-celebrations)](https://github.com/inlibro/koha-plugin-celebrations/releases/latest)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![English Documentation](https://img.shields.io/badge/Docs-English-blue?style=flat-square&logo=read-the-docs)](../README.md)


Ajoutez une touche festive à l'OPAC de votre bibliothèque pour chaque occasion spéciale ! Cette extension permet d'appliquer des thèmes saisonniers et des animations pour des célébrations comme Noël, Halloween, la Saint-Valentin et bien d'autres.

Pour une prise en main plus facile et pour comprendre le fonctionnement utilisateur, il est recommandé d'aller jeter un coup d'oeil aux instructions

[![Instructions](https://img.shields.io/badge/Instructions-📖-blue)](https://inlibro.com/extension-koha-celebrations/)

<br><br>

## Fonctionnalités principales

- Thèmes activables par période
- Thème entièrement personnalisable
- Interface d’administration intuitive
- Prévisualisation OPAC intégrée
- Architecture **data-driven** (JSON)
- Support multi-langue
- Compatible OPAC ordinateur et téléphone

<br><br>

## Installation & développement

Cette section explique comment installer l'extension en mode développement afin de pouvoir modifier le code et tester directement sur une instance Koha locale.

si vous n'avez pas de Koha installé localement vous pouvez l'installer facilement avec cette commande :

```bash
git clone --branch main --single-branch --depth 1 https://git.koha-community.org/Koha-community/Koha.git koha
```

si vous voulez en apprendre plus sur koha voici la documentation officielle :

[![Koha Documentation](https://img.shields.io/badge/Koha-Documentation-4a9b32?logo=readthedocs&logoColor=white)](https://koha-community.org/manual/latest/fr/html/index.html)

### Étape

1. **Forker le projet et le télécharger sur votre poste de travail**
2. **Créer un lien symbolique vers Koha**

  Dans votre instance Koha (généralement /var/lib/koha/`<instance>`/plugins), créez un lien symbolique vers le dossier de l'extension :

```bash
ln -s /chemin/vers/koha-plugin-celebrations /var/lib/koha/<instance>/plugins/Koha/Plugin/Celebrations
```

1. **Installer l'extension dans Koha**

Exécuter le script Koha pour télécharger l'extension depuis le répertoire de votre koha :

```bash
./misc/devel/install_plugins.pl
```

1. **Installer les dépendances front-end**

Dans le dossier de l'extension :

```bash
npm install
```

1. **Compiler les fichiers JavaScript de l’interface administrateur**

L'extension utilise un système de bundling automatique : tous les fichiers situés dans
`Koha/Plugin/Celebrations/js/template/` sont fusionnés en un seul fichier JavaScript chargé dans l’interface d’administration.

Pour que vos modifications soient prises en compte :

Développement (avec surveillance automatique) utilisez :

````bash
npm run dev
````
Cette commande surveille en continu le dossier `js/template/` et reconstruit automatiquement le bundle `js/dist/celebrations-bundle.js` à chaque changement.

#### Première installation ou reprise d’une extension clonée

Lorsque vous installez ou clonez l'extension pour la première fois :

Cela crée le fichier celebrations-bundle.js et met à jour le template pour charger ce bundle.

Si vous utilisez une extension en mode développement via lien symbolique (dans `/var/lib/plugins/`), ce bundling doit être fait avant d’ouvrir la page d’administration, sinon aucun script ne sera chargé.


<br><br>

## Architecture (vue d’ensemble)

L'extension repose sur une architecture modulaire, stable et extensible :

- **Backend Perl** : logique métier, API OpenAPI, gestion des assets
- **Frontend JS** : interface admin + prévisualisation OPAC
- **Configuration JSON** : thèmes, options, traductions
---
La documentation détaillée de l’architecture (arborescence, composants, flux) est disponible ici

[![Architecture](https://img.shields.io/badge/Docs-Architecture-important?style=flat-square&logo=mermaid)](architecture.fr.md)


<br><br>

## Contribution & développement

Vous souhaitez :
- ajouter un thème
- modifier/ajouter un effet visuel
- comprendre l’architecture interne
- contribuer au projet

Consultez le guide dédié :

[![Contributing](https://img.shields.io/badge/Contribuer-Guide-green?style=flat-square&logo=github)](contributing.fr.md)

<br><br>

## Déploiement en production

En production :

- l'extension doit être installée sous forme de fichier `.kpz`
- aucun bundling JavaScript n’est nécessaire
- les fichiers `js/dist/` sont déjà inclus
- s'assurer que tous les tests passent

Ne pas utiliser de lien symbolique en production.

<br><br>

## Compatibilité Koha

Cette extension est compatible avec :

- Koha ≥ 24.05
- OPAC classique et responsive
- Navigateurs modernes (Chrome, Firefox, Edge)

Les versions plus anciennes de Koha ne sont pas garanties.

<br><br>

## Limitations connues

- Les effets très lourds peuvent impacter les performances sur mobile
- La prévisualisation iframe peut modifier légèrement le rendu
- il faut **relancer PLACK** pour que les routes OpenAPI ET static fonctionne !

<br><br>

## Licence

Ce projet est sous licence GNU General Public License v3.0. Voir le fichier [LICENSE](LICENSE) for details.