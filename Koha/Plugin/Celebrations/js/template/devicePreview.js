/**
 * ======================================================
 *  Système de prévisualisation multi-device
 * ======================================================
 */
import { DEVICE_CONFIG, API_ENDPOINTS } from './config.js';
/**
 * Variables d'état utilisées pour gérer le cycle de vie et le positionnement de l'iframe de prévisualisation.
 */
let iframe = null;
let iframeContainer = null;
let currentDevice = 'ordi';
let isInitialized = false;
/**
 *
 *  Crée le conteneur fixe pour l'iframe
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
 *  Crée l'iframe de prévisualisation
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
  iframe.addEventListener('load', () => {
    isInitialized = true;
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
    positionIframe();
  });
  iframeContainer.appendChild(iframe);
  return iframe;
}
/**
 *
 *  Positionne l'iframe selon le device actif
 *  @returns {void}
 */
function positionIframe() {
  if (!iframe || !isInitialized) return;
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
 *  Initialise le système de prévisualisation multi-device
 *  @returns {void}
 */
export function initDevicePreviewSwitcher() {
  const existing = document.getElementById('theme-preview');
  if (existing) existing.remove();
  initRadioListeners();
  createIframe();
  switchToDevice('ordi');
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
    const resizeObserver = new ResizeObserver(() => {
      positionIframe();
    });
    Object.values(DEVICE_CONFIG).forEach(config => {
      const screen = document.querySelector(config.screen);
      if (screen) resizeObserver.observe(screen);
    });
  }
  const pluginCard = document.querySelector('.plugin-card');
  if (pluginCard && window.MutationObserver) {
    const mutationObserver = new MutationObserver(() => {
      requestAnimationFrame(() => {
        positionIframe();
      });
    });
    mutationObserver.observe(pluginCard, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
  }
  const themeSelect = document.getElementById('theme-select');
  if (themeSelect) {
    themeSelect.addEventListener('change', () => {
      setTimeout(() => {
        positionIframe();
      }, 100);
    });
  }
  const allToggles = document.querySelectorAll('.plugin-card input[type="checkbox"]');
  allToggles.forEach(toggle => {
    toggle.addEventListener('change', () => {
      setTimeout(() => {
        positionIframe();
      }, 100);
    });
  });
  window.positionIframeGlobal = positionIframe;
}