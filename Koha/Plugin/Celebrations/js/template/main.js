/**
 * ======================================================
 *  Script principal du module de gestion des thèmes
 * ======================================================
 */
import { getById, safeParseJSON, renderThemesGrid } from './utils.js';
import { refreshThemesGridFromAPI } from './themeGrid.js';
import { submitThemeForm, resetConfiguration } from './formHandler.js';
import { updateThemeOptions, refreshThemeSelect } from './themeOptions.js';
import { updatePreview } from './preview.js';
import { initDevicePreviewSwitcher } from './devicePreview.js';
/**
 *
 *  Initialise le module thème après chargement du DOM
 *
 */
document.addEventListener('DOMContentLoaded', () => {
  const elements = {
    themeSelect: getById('theme-select'),
    form: getById('theme-form'),
    successMessage: getById('success-message'),
    resetMessage: getById('reset-message'),
    erreurMessage: getById('erreur-message'),
    previewButton: getById('preview-button'),
    noThemeMessage: getById('no-themes-message'),
    themesGrid: getById('themes-grid'),
    resetBtn: getById('reset-button')
  };
  const state = {
    currentSettings: safeParseJSON(CURRENT_SETTINGS_STR, "CURRENT_SETTINGS_STR"),
    allThemes: safeParseJSON(ALL_THEMES, "ALL_THEMES"),
    rawThemes: safeParseJSON(THEMES_CONFIG_STR, "THEMES_CONFIG_STR"),
  };
  renderThemesGrid(state, elements);
  elements.form.addEventListener('submit', async event => {
    event.preventDefault();
    await submitThemeForm(elements.form, state.rawThemes, elements, async () => {
      await refreshThemesGridFromAPI(state, elements, state.rawThemes);
      refreshThemeSelect(state.allThemes, state.rawThemes, elements.themeSelect);
    });
  });
  elements.themeSelect.addEventListener('change', () => {
    updateThemeOptions(state.rawThemes, elements.themeSelect);
  });
  updateThemeOptions(state.rawThemes, elements.themeSelect);
  ['flocons', 'coeurs', 'spiders'].forEach(type => {
    const input = getById(`quantite_${type}`);
    const label = getById(`val_quantite_${type}`);
    if (input && label)
      input.addEventListener('input', () => (label.textContent = input.value));
  });
  if (elements.resetBtn) {
    elements.resetBtn.addEventListener('click', () => {
      resetConfiguration(elements.form, state.currentSettings);
      updateThemeOptions(state.rawThemes, elements.themeSelect);
    });
  }
  if (elements.previewButton) {
    elements.previewButton.addEventListener('click', () => {
      updatePreview(state.rawThemes, elements.themeSelect);
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDevicePreviewSwitcher);
  } else {
    initDevicePreviewSwitcher();
  }
});