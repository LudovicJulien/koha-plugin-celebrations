/**
 * ======================================================
 *  Script principal du module de gestion des thèmes
 * ======================================================
 */
import { $, safeParseJSON } from './utils.js';
import { updateThemesGrid, refreshThemesGridFromAPI, attachThemeCardEvents } from './themeGrid.js';
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
    themeSelect: $('theme-select'),
    form: $('theme-form'),
    successMessage: $('success-message'),
    resetMessage: $('reset-message'),
    erreurMessage: $('erreur-message'),
    previewButton: $('preview-button'),
    noThemeMessage: $('no-themes-message'),
    themesGrid: $('themes-grid'),
    resetBtn: $('reset-button')
  };
  const rawThemes = safeParseJSON(THEMES_CONFIG_STR, "THEMES_CONFIG_STR");
  const state = {
    currentSettings: safeParseJSON(CURRENT_SETTINGS_STR, "CURRENT_SETTINGS_STR"),
    allThemes: safeParseJSON(ALL_THEMES, "ALL_THEMES"),
    themesConfigStr: safeParseJSON(THEMES_CONFIG_STR, "THEMES_CONFIG_STR")
  };
  console.log(state.allThemes);
  updateThemesGrid(state.allThemes, state.currentSettings.theme_name, elements.noThemeMessage, elements.themesGrid);
  attachThemeCardEvents(
    themeName => console.log('Edit:', themeName),
    async () => {
        await refreshThemesGridFromAPI(state, elements);
        refreshThemeSelect(state.allThemes, state.themesConfigStr, elements.themeSelect);
    }
  );
  elements.form.addEventListener('submit', async event => {
    event.preventDefault();
    await submitThemeForm(elements.form, rawThemes, elements, async () => {
      await refreshThemesGridFromAPI(state, elements);
      refreshThemeSelect(state.allThemes, state.themesConfigStr, elements.themeSelect);
    });
  });
  elements.themeSelect.addEventListener('change', () => {
    updateThemeOptions(rawThemes, elements.themeSelect);
  });
  updateThemeOptions(rawThemes, elements.themeSelect);
  ['flocons', 'coeurs', 'spiders'].forEach(type => {
    const input = $(`quantite_${type}`);
    const label = $(`val_quantite_${type}`);
    if (input && label)
      input.addEventListener('input', () => (label.textContent = input.value));
  });
  if (elements.resetBtn) {
    elements.resetBtn.addEventListener('click', () => {
      resetConfiguration(elements.form, state.currentSettings);
      updateThemeOptions(rawThemes, elements.themeSelect);
    });
  }
  if (elements.previewButton) {
    elements.previewButton.addEventListener('click', () => {
      updatePreview(rawThemes, elements.themeSelect);
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDevicePreviewSwitcher);
  } else {
    initDevicePreviewSwitcher();
  }
});