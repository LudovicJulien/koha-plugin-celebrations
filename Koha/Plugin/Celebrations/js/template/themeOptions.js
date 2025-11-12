/**
 * ======================================================
 *  Gestion des options de thème
 * ======================================================
 */
import { $ } from './utils.js';
/**
 *
 * Met à jour dynamiquement l'affichage des options du thème sélectionné.
 * @param {Object} rawThemes - Ensemble complet des thèmes et de leurs éléments.
 * @param {HTMLSelectElement} themeSelect - Liste déroulante permettant de sélectionner un thème.
 * @returns {void}
 */
export function updateThemeOptions(rawThemes, themeSelect) {
  Object.values(rawThemes).forEach(theme => {
    Object.values(theme.elements || {}).forEach(element => {
      if (element.toggle_id) {
        const el = $(element.toggle_id);
        if (el) el.style.display = 'none';
      }
      if (element.extra_options) {
        const elementKey = Object.keys(theme.elements).find(key => theme.elements[key] === element);
        if (elementKey) {
          const configDivId = `${elementKey}-config`;
          const configDiv = $(configDivId);
          if (configDiv) configDiv.style.display = 'none';
        }
      }
    });
  });
  const selectedTheme = themeSelect.value;
  const themeData = rawThemes[selectedTheme];
  if (themeData && themeData.elements) {
    Object.entries(themeData.elements).forEach(([name, element]) => {
      if (element.toggle_id) {
        const el = $(element.toggle_id);
        if (el) {
          el.style.display = 'flex';
        }
      }
    });
  }
  Object.values(themeData?.elements || {}).forEach(element => {
    const mainToggle = $(element.setting);
    if (mainToggle) mainToggle.dispatchEvent(new Event('change'));
  });
  if (themeData && themeData.elements) {
    Object.entries(themeData.elements).forEach(([elementKey, element]) => {
      if (element.extra_options) {
        const mainToggle = $(element.setting);
        const configDivId = `${elementKey}-config`;
        const configDiv = $(configDivId);
        toggleConfig(mainToggle, configDiv, selectedTheme, themeSelect);
      }
    });
  }
  setTimeout(() => {
    if (window.positionIframeGlobal) {
      window.positionIframeGlobal();
    }
  }, 150);
  document.querySelectorAll('.form-group').forEach(div => {
    div.style.display = 'none';
  });
  const themeDiv = document.getElementById(`${selectedTheme}-options`);
  if (themeDiv) {
    themeDiv.style.display = 'block';
  }
}
/**
 *
 * Gère l'affichage conditionnel des sous-options liées à un élément de thème.
 * @param {HTMLElement} mainToggle - Élément principal déclenchant l’affichage (checkbox, select, etc.).
 * @param {HTMLElement} configDiv - Conteneur des options supplémentaires à afficher/masquer.
 * @param {string} themeName - Nom du thème concerné.
 * @param {HTMLSelectElement} themeSelect - Sélecteur global des thèmes.
 * @returns {void}
 */
export function toggleConfig(mainToggle, configDiv, themeName, themeSelect) {
  if (!mainToggle || !configDiv) return;
  const updateDisplay = () => {
    const isChecked = mainToggle.type === 'checkbox' ? mainToggle.checked : true;
    configDiv.style.display =
      themeSelect.value === themeName && isChecked ? 'block' : 'none';
    setTimeout(() => {
      if (window.positionIframeGlobal) {
        window.positionIframeGlobal();
      }
    }, 100);
  };
  mainToggle.addEventListener('change', updateDisplay);
  updateDisplay();
}