/**
 * ======================================================
 *  Système de prévisualisation multi-device
 * ======================================================
 */
import { DEVICE_CONFIG, API_ENDPOINTS } from './config.js';
import { getById } from './utils.js'
/**
 * Variables d'état utilisées pour gérer le cycle de vie et le positionnement de l'iframe de prévisualisation.
 */
let iframe = null;
let iframeContainer = null;
let currentDevice = 'ordi';
let isInitialized = false;
/**
 *
 *  Crée le conteneur fixe utilisé pour afficher l’iframe de prévisualisation.
 *  @returns {HTMLDivElement} - Conteneur créé ou existant
 */
function createFixedIframeContainer() {
  if (iframeContainer) return iframeContainer;
  iframeContainer = document.createElement('div');
  iframeContainer.id = 'iframe-fixed-container';
  iframeContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 9999;
    display: none;
  `;
  document.body.appendChild(iframeContainer);
  return iframeContainer;
}
/**
 *
 *  Crée l’iframe utilisée pour la prévisualisation du thème.
 *  @returns {HTMLIFrameElement} - Iframe créé ou existant
 */
function createIframe() {
  if (iframe) return iframe;
  createFixedIframeContainer();
  iframe = document.createElement('iframe');
  iframe.src = API_ENDPOINTS.opacPreview;
  iframe.id = 'theme-preview';
  iframe.title = 'Aperçu du thème OPAC';
  iframe.frameBorder = '0';
  iframe.allowFullscreen = true;
  iframe.sandbox = 'allow-same-origin allow-scripts';
  iframe.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: 0;
    transform-origin: top left;
    pointer-events: auto;
  `;
  iframe.addEventListener('load',  async () => {
    await showLoadingOverlay();
    isInitialized = true;
    injectDisableInteractions();
    positionIframe();
    await hideLoadingOverlay();
  });
  iframeContainer.appendChild(iframe);
  return iframe;
}
/**
 *
 * Injecte un script dans l'iframe pour désactiver les interactions (clics, soumissions de formulaire)
 * @returns {void}
 */
function injectDisableInteractions() {
  try {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    if (iframeDoc) {
      const script = iframeDoc.createElement('script');
      script.textContent = `
        document.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
        }, true);
        document.addEventListener('submit', (e) => {
          e.preventDefault();
          e.stopPropagation();
        }, true);
      `;
      iframeDoc.body.appendChild(script);
    }
  } catch (err) {
    console.warn("Impossible d'injecter le script dans l'iframe :", err);
  }
}
/**
 *
 *  Positionne l’iframe de prévisualisation selon le device sélectionné.
 *  @returns {void}
 */
function positionIframe() {
  let overlay = document.getElementById('preview-loading-overlay');
  if (!iframe || !isInitialized || !overlay) return;
  const config = DEVICE_CONFIG[currentDevice];
  if (!config) return;
  const screenElement = document.querySelector(config.screen);
  if (!screenElement) return;
  const rect = screenElement.getBoundingClientRect();
  const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
  const scrollY = window.pageYOffset || document.documentElement.scrollTop;
  const scale = rect.width / config.baseWidth;
  iframeContainer.style.display = 'block';
  iframe.style.transform = `translate(${rect.left + scrollX}px, ${rect.top + scrollY}px) scale(${scale})`;
  iframe.style.width = `${config.baseWidth}px`;
  iframe.style.height = `${rect.height / scale}px`;
  overlay.style.transform = `translate(${rect.left + scrollX}px, ${rect.top + scrollY}px) scale(${scale})`;
  overlay.style.width = `${config.baseWidth}px`;
  overlay.style.height = `${rect.height / scale}px`;
}
/**
 *
 *  Change le device actif pour la prévisualisation
 *  @param {string} deviceKey - Clé du device ('ordi', 'tel', 'tablet')
 *  @returns {void}
 */
function switchToDevice(deviceKey) {
  if (!DEVICE_CONFIG[deviceKey]) return;
  if (!iframe) {
    createIframe();
  }
  Object.values(DEVICE_CONFIG).forEach(config => {
    const device = document.querySelector(config.container);
    if (device) device.style.display = 'none';
  });
  const activeDevice = document.querySelector(DEVICE_CONFIG[deviceKey].container);
  if (activeDevice) {
    activeDevice.style.display = 'block';
  }
  currentDevice = deviceKey;
  requestAnimationFrame(() => {
    positionIframe();
  });
}
/**
 *
 *  Initialise les écouteurs sur les radios pour changer de device
 *  @returns {void}
 */
function initRadioListeners() {
  const radios = document.querySelectorAll('.radio-inputs input[type="radio"]');
  const deviceMap = ['ordi', 'tel', 'tablet'];
  radios.forEach((radio, index) => {
    radio.addEventListener('change', (e) => {
      if (e.target.checked) {
        switchToDevice(deviceMap[index]);
      }
    });
  });
}
/**
 *
 * Met en place les écouteurs d'événements (resize, scroll, MutationObserver)
 * pour repositionner automatiquement l'iframe lorsque le layout de la page change.
 * @returns {void}
 */
function setupAutoReposition() {
  let resizing = false;
  let resizeFrame;
  function updateDuringResize() {
    if (!resizing) return;
    positionIframe();
    requestAnimationFrame(updateDuringResize);
  }
  window.addEventListener('resize', () => {
    if (!resizing) {
      resizing = true;
      requestAnimationFrame(updateDuringResize);
    }
    clearTimeout(resizeFrame);
    resizeFrame = setTimeout(() => {
      resizing = false;
    }, 120);
  });
  window.addEventListener('scroll', () => {
    requestAnimationFrame(() => positionIframe());
  });
  if (window.ResizeObserver) {
    const resizeObserver = new ResizeObserver(() => positionIframe());
    Object.values(DEVICE_CONFIG).forEach(config => {
      const screen = document.querySelector(config.screen);
      if (screen) resizeObserver.observe(screen);
    });
  }
  const pluginCard = document.querySelector('.plugin-card');
  if (pluginCard && window.MutationObserver) {
    const mutationObserver = new MutationObserver(() => {
      requestAnimationFrame(() => positionIframe());
    });
    mutationObserver.observe(pluginCard, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
  }
  const themeSelect = getById('theme-select');
  if (themeSelect) {
    themeSelect.addEventListener('change', () => {
      setTimeout(() => positionIframe(), 100);
    });
  }
  const allToggles = document.querySelectorAll('.plugin-card input[type="checkbox"]');
  allToggles.forEach(toggle => {
    toggle.addEventListener('change', () => {
      setTimeout(() => positionIframe(), 100);
    });
  });
}
/**
 *
 * Collecte les chemins d'accès (URL) des fichiers CSS et JS du thème,
 * ainsi que les options JavaScript du thème, en fonction des sélections de l'utilisateur.
 * @param {Object} themeData - Données de configuration du thème sélectionné.
 * @param {string} selectedTheme - Nom du thème actif.
 * @returns {{cssFiles: Array<string>, jsFiles: Array<string>, jsOptions: Object}} - Les assets et options collectés.
 */
function collectThemeAssets(themeData, selectedTheme) {
  const cssFiles = [];
  const jsFiles = [];
  const jsOptions = {};
  const baseUrl = API_ENDPOINTS.previewAsset;
  Object.entries(themeData.elements || {}).forEach(([elementName, element]) => {
    const input = getById(element.setting);
    const isActive = input?.type === 'checkbox' ? input.checked : true;
    if (!isActive || !element.file) return;
    const type = element.type || "both";
    if (type === "css" || type === "both") {
      cssFiles.push(`${baseUrl}&type=css&theme=${selectedTheme}&file=${element.file}`);
    }
    if (type === "js" || type === "both") {
      jsFiles.push(`${baseUrl}&type=js&theme=${selectedTheme}&file=${element.file}`);
    }
    if (element.extra_options) {
      Object.entries(element.extra_options).forEach(([optKey, optValue]) => {
        if (optValue.type === "ignore") {
           jsOptions[optKey] = window[optKey];
          return;
        }
        const extraInput = getById(optKey);
        const extraActive = extraInput?.type === 'checkbox' ? extraInput.checked : !!extraInput?.value;
        if (extraActive) {
          if (optValue.css) cssFiles.push(optValue.css);
          if (optValue.js) jsFiles.push(optValue.js);
          if (extraInput?.value) {
            jsOptions[optKey] = extraInput.value;
          }
        }
      });
    }
  });
  return { cssFiles, jsFiles, jsOptions };
}
/**
 *
 * Injecte les balises <link> des fichiers CSS dans la section <head> du document de l'iframe.
 * @async
 * @param {HTMLDocument} doc - Document de l'iframe.
 * @param {Array<string>} cssFiles - Liste des URL des fichiers CSS à injecter.
 * @param {string} selectedTheme - Nom du thème utilisé pour le dataset de nettoyage.
 * @returns {Promise<void>}
 */
async function injectCSSFiles(doc, cssFiles, selectedTheme) {
  const head = doc.head;
  cssFiles.forEach(href => {
    const link = doc.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.theme = selectedTheme;
    head.appendChild(link);
  });
}
/**
 *
 * Génère le contenu du script contenant les options JavaScript du thème (window.ThemeOptions).
 * @param {string} selectedTheme - Nom du thème.
 * @param {Object} jsOptions - Options JavaScript à inclure.
 * @returns {string} - Chaîne de caractères représentant le contenu du script.
 */
function generateOptionsScript(selectedTheme, jsOptions) {
  if (Object.keys(jsOptions).length === 0) return '';
  const jsonOpts = JSON.stringify(jsOptions);
  return `window["${selectedTheme}ThemeOptions"] = ${jsonOpts};`;
}
/**
 *
 * Crée et ajoute l'overlay de chargement au document body.
 * @returns {HTMLDivElement} - L'élément overlay créé.
 */
function createLoadingOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'preview-loading-overlay';
  overlay.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: 0;
    transform-origin: top left;
    pointer-events: auto;
    z-index: 9999;
    opacity: 0;
    background-color: #000000;
;
  `;
  const apiNamespace = window.api_namespace || 'default';
  const logo = document.createElement('img');
  logo.src = `/api/v1/contrib/${apiNamespace}/static/images/inLibro_icone.png`;
  logo.alt = 'InLibro Icone';
  logo.style.cssText = `
    width: 120px;
    height: 120px;
    animation: pulse 1.5s ease-in-out infinite;
  `;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.1); opacity: 0.8; }
    }
  `;
  document.head.appendChild(style);
  overlay.appendChild(logo);
  document.body.appendChild(overlay);
  return overlay;
}
/**
 *
 * Affiche l'overlay de chargement sur l'iframe pour masquer le rechargement.
 * @returns {Promise<void>} - Se résout après que l'affichage soit complet.
 */
function showLoadingOverlay() {
  let overlay = document.getElementById('preview-loading-overlay');
  if (!overlay) {
    overlay = createLoadingOverlay();
  }
  overlay.style.display = 'flex';
  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
  });
}
/**
 *
 * Cache l'overlay de chargement après un court délai pour permettre l'affichage des assets.
 * @async
 * @returns {Promise<void>} - Se résout après un délai et masquage.
 */
async function hideLoadingOverlay() {
  const overlay = document.getElementById('preview-loading-overlay');
  if (!overlay) return;
  await new Promise(resolve => setTimeout(resolve, 2500));
  overlay.style.display = 'none';
  overlay.style.pointerEvents = 'none';
}
/**
 *
 * Nettoie l'iframe en supprimant tous les assets (CSS et JS) du thème précédemment injectés.
 * @param {HTMLDocument} doc - Document de l'iframe.
 * @returns {Promise<void>}
 */
function cleanOldAssets(doc) {
  doc.querySelectorAll('link[data-theme], script[data-theme]').forEach(el => el.remove());
}
/**
 *
 * Met à jour la prévisualisation du thème dans l'iframe en rechargant l'OPAC de prévisualisation
 * et en injectant les assets CSS/JS sélectionnés.
 * @async
 * @param {Object} rawThemes - Configuration complète des thèmes disponibles.
 * @param {string} themeName - Nom du thème à prévisualiser.
 * @returns {Promise<void>} - Se résout une fois les assets chargés et l'overlay masqué.
 */
export async function updatePreview(rawThemes, themeName) {
  await showLoadingOverlay();
  const iframe = getById('theme-preview');
  if (!iframe) return;
  const themeData = rawThemes[themeName];
  if (!themeData) {
    await hideLoadingOverlay();
    return;
  }
  await new Promise(resolve => {
    iframe.onload = () => resolve();
    iframe.src = iframe.src;
  });
  const doc = iframe.contentDocument || iframe.contentWindow.document;
  if (!doc) {
    await hideLoadingOverlay();
    return;
  }
  await cleanOldAssets(doc);
  const { cssFiles, jsFiles, jsOptions } = collectThemeAssets(themeData, themeName);
  await injectCSSFiles(doc, cssFiles, themeName);
  await injectJSFilesAsync(doc, jsFiles, themeName, jsOptions);
  await hideLoadingOverlay();
}
/**
 *
 * Injecte de manière asynchrone les scripts JS et les options de thème dans le document de l'iframe.
 * Les scripts sont récupérés via fetch et injectés comme scripts inline pour garantir l'exécution
 * et le respect des dépendances de l'API.
 * @async
 * @param {HTMLDocument} doc - Document de l'iframe.
 * @param {Array<string>} jsFiles - Liste des URL des fichiers JS à injecter.
 * @param {string} selectedTheme - Nom du thème.
 * @param {Object} jsOptions - Options JavaScript à inclure.
 * @returns {Promise<void>} - Se résout une fois tous les scripts chargés et exécutés.
 */
async function injectJSFilesAsync(doc, jsFiles, selectedTheme, jsOptions) {
  const body = doc.body;
  const optionsScript = generateOptionsScript(selectedTheme, jsOptions);
  if (optionsScript) {
    const optScript = doc.createElement('script');
    optScript.type = 'text/javascript';
    optScript.textContent = optionsScript;
    optScript.dataset.theme = selectedTheme;
    body.appendChild(optScript);
  }
  const uniqueJsFiles = [...new Set(jsFiles)];
  const loadPromises = uniqueJsFiles.map(src => {
    return fetch(src)
      .then(res => res.text())
      .then(code => {
        const inlineScript = doc.createElement('script');
        inlineScript.type = 'text/javascript';
        inlineScript.textContent = code;
        inlineScript.dataset.theme = selectedTheme;
        body.appendChild(inlineScript);
        if (doc.readyState === 'complete' || doc.readyState === 'interactive') {
          const event = new Event('DOMContentLoaded', { bubbles: true, cancelable: true });
          doc.dispatchEvent(event);
        }
      })
      .catch(err => console.error('Erreur chargement JS:', err));
  });
  await Promise.all(loadPromises);
}
/**
 *
 *  Initialise le système de prévisualisation multi-device
 *  @returns {void}
 */
export function initDevicePreviewSwitcher() {
  const existing = getById('theme-preview');
  if (existing) existing.remove();
  initRadioListeners();
  createIframe();
  switchToDevice('ordi');
  setupAutoReposition();
  window.positionIframeGlobal = positionIframe;
}