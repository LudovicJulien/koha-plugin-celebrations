/**
 * ======================================================
 *  Gestion de la prévisualisation
 * ======================================================
 */
import { API_ENDPOINTS } from './config.js';
/**
 *
 *  Met à jour la prévisualisation du thème dans l'iframe
 *  @param {Object} rawThemes - Objet contenant tous les thèmes et leurs éléments
 *  @param {HTMLSelectElement} themeSelect - Élément <select> contenant le thème sélectionné
 *  @returns {Promise<void>} - Met à jour l'iframe avec les fichiers CSS et JS du thème
 */
export async function updatePreview(rawThemes, themeSelect) {
  const iframe = document.getElementById('theme-preview');
  if (!iframe) return;
  const selectedTheme = themeSelect.value;
  const themeData = rawThemes[selectedTheme];
  if (!themeData) return;
  await new Promise(resolve => {
    iframe.onload = () => resolve();
    iframe.src = iframe.src;
  });
  const doc = iframe.contentDocument || iframe.contentWindow.document;
  if (!doc) return;
  const body = doc.body;
  doc.querySelectorAll('link[data-theme], script[data-theme]').forEach(el => el.remove());
  const cssFiles = [];
  const jsFiles = [];
  const baseUrl = API_ENDPOINTS.previewAsset;
  Object.values(themeData.elements || {}).forEach(element => {
    const input = document.getElementById(element.setting);
    const isActive = input?.type === 'checkbox' ? input.checked : true;
    if (isActive && element.file) {
      cssFiles.push(`${baseUrl}&type=css&theme=${selectedTheme}&file=${element.file}`);
      jsFiles.push(`${baseUrl}&type=js&theme=${selectedTheme}&file=${element.file}`);
      if (element.extra_options) {
        Object.entries(element.extra_options).forEach(([optKey, optValue]) => {
          const extraInput = document.getElementById(optKey);
          const extraActive = extraInput?.type === 'checkbox' ? extraInput.checked : !!extraInput?.value;
          if (extraActive) {
            if (optValue.css) cssFiles.push(optValue.css);
            if (optValue.js) jsFiles.push(optValue.js);
          }
        });
      }
    }
  });
  console.log('cssFiles', cssFiles);
  const head = doc.head;
  cssFiles.forEach(href => {
    const link = doc.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.theme = selectedTheme;
    head.appendChild(link);
  });
  const uniqueJsFiles = [...new Set(jsFiles)];
  uniqueJsFiles.forEach(src => {
    const inlineScript = doc.createElement('script');
    inlineScript.type = 'text/javascript';
    inlineScript.dataset.theme = selectedTheme;
    fetch(src)
      .then(res => res.text())
      .then(code => {
        inlineScript.textContent = code;
        body.appendChild(inlineScript);
        if (doc.readyState === 'complete' || doc.readyState === 'interactive') {
          const event = new Event('DOMContentLoaded', { bubbles: true, cancelable: true });
          doc.dispatchEvent(event);
        }
      })
      .catch(err => console.error('Erreur chargement JS inline:', err));
  });
}