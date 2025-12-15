/**
 * ======================================================
 *  Configuration Générale
 * ======================================================
 */
/**
 *
 * Traductions chargées depuis Perl (injectées dans window.translation)
 */
export const TRANSLATION_UI = window.translation?.T || {};
export const TRANSLATION_BACKEND = window.translation?.B || {};
/**
 *
 * Namespace d’API injecté dans le template Koha
 */
const API_NS = window.api_namespace || '';

/**
 *
 * Paramètres de configuration pour l'affichage de l'aperçu du thème sur différents appareils (responsive).
 * Chaque clé définit la largeur de base (baseWidth) et les sélecteurs CSS du conteneur (container) et de l'écran (screen)
 * pour permettre le positionnement et la mise à l'échelle corrects de l'iframe.
 */
export const DEVICE_CONFIG = {
  ordi: {
    baseWidth: 1300,
    container: '.monitor-preview',
    screen: '.screenOrdi .content'
  },
  tel: {
    baseWidth: 500,
    container: '.iphone',
    screen: '.iphone .screenMobile'
  },
  tablet: {
    baseWidth: 800,
    container: '.ipad',
    screen: '.ipad .screenMobile'
  }
};
/**
 *
 * Répertorie tous les chemins d'accès (URLs) pour les appels AJAX (Fetch) vers le plugin Perl
 * via l'interface CGI de Koha.
 */
export const API_ENDPOINTS = {
  themes:       '/api/v1/contrib/Celebrations-api/themes',
  opacPreview:  '/cgi-bin/koha/plugins/run.pl?class=Koha::Plugin::Celebrations&method=opac_preview',
  previewAsset: '/cgi-bin/koha/plugins/run.pl?class=Koha::Plugin::Celebrations&method=preview_theme_asset'
};