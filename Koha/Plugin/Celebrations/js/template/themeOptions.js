/**
 * =======================================================
 *  Gestion du menu de configuration des options de thème
 * =======================================================
 */
import { getById } from './utils.js';
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
        const el = getById(element.toggle_id);
        if (el) el.style.display = 'none';
      }
      if (element.extra_options) {
        const elementKey = Object.keys(theme.elements).find(key => theme.elements[key] === element);
        if (elementKey) {
          const configDivId = `${elementKey}-config`;
          const configDiv = getById(configDivId);
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
        const el = getById(element.toggle_id);
        if (el) {
          el.style.display = 'flex';
        }
      }
    });
  }
  Object.values(themeData?.elements || {}).forEach(element => {
    const mainToggle = getById(element.setting);
    if (mainToggle) mainToggle.dispatchEvent(new Event('change'));
  });
  if (themeData && themeData.elements) {
    Object.entries(themeData.elements).forEach(([elementKey, element]) => {
      if (element.extra_options) {
        const mainToggle = getById(element.setting);
        const configDivId = `${elementKey}-config`;
        const configDiv = getById(configDivId);
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
  const themeDiv = getById(`${selectedTheme}-options`);
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
/**
 *
 * Mise à jour du sélecteur de thème qui permet d'ajouter de nouveaux thèmes
 * @param {Object} themes - Ensemble complet des thèmes {themeName: themeData}.
 * @param {HTMLSelectElement} themeSelect - Élément <select> à mettre à jour.
 * @param {string} [currentValue] - Valeur à sélectionner après mise à jour (optionnel).
 * @returns {void}
 */
export function refreshThemeSelect(themesConf, allTheme, themeSelect) {
  if (!themeSelect) return;
  themeSelect.innerHTML = '';
  Object.keys(allTheme).forEach(themeKey => {
    if (themesConf[themeKey]) return;
    const option = document.createElement('option');
    option.value = themeKey;
    option.textContent = allTheme[themeKey].theme_name || themeKey;
    themeSelect.appendChild(option);
  });
  themeSelect.dispatchEvent(new Event('change'));
}
/**
 *
 * Passe en mode édition pour le thème sélectionné :
 * @param {string} themeName - Nom du thème à éditer
 * @param {Object} themeData - Données du thème (depuis state.allThemes)
 * @param {Object} rawThemes - Configuration complète (THEMES_CONFIG_STR)
 * @param {Object} elements - Références aux éléments DOM (titre, select, etc.)
 */
export function showThemeEditor(themeName, themeData, rawThemes, elements) {
  const confTitre = document.getElementById('ConfTitre');
  const labelSel = document.getElementById('label-select');
  const form_group = document.getElementById(themeName + '-options');
  const themeSelect = elements.themeSelect;
  confTitre.textContent = `Configuration du thème : ${themeName}`;
  labelSel.style.display = 'none';
  themeSelect.style.display = 'none';
  form_group.style.display = 'block';
  const toggles = form_group.querySelectorAll('.toggle-container');
  toggles.forEach(toggle => {
    toggle.style.display = 'block';
  });
  if (!document.getElementById('cancel-edit-btn')) {
    const cancelBtn = document.createElement('button');
    cancelBtn.id = 'cancel-edit-btn';
    cancelBtn.className = 'modern-button cancel';
    cancelBtn.textContent = 'Annuler';
    cancelBtn.style.marginLeft = '10px';
    const buttonRow = document.querySelector('.buttons-row');
    if (buttonRow) buttonRow.appendChild(cancelBtn);
    cancelBtn.addEventListener('click', () => exitThemeEditor(rawThemes, elements));
  }
  if (elements.previewButton) {
    elements.previewButton.disabled = false;
  }
  if (window.updatePreview) {
    window.updatePreview(rawThemes, themeSelect);
  }
}

/**
 * Revient au mode normal (sélecteur visible, options masquées)
 */
export function exitThemeEditor(rawThemes, elements) {
  const confTitre = document.getElementById('ConfTitre');
  const themeSelect = elements.themeSelect;
  const cancelBtn = document.getElementById('cancel-edit-btn');
  confTitre.textContent = 'Sélectionnez un thème à configurer';
  themeSelect.style.display = 'block';
  updateThemeOptions(rawThemes, themeSelect);
  if (cancelBtn) cancelBtn.remove();
}