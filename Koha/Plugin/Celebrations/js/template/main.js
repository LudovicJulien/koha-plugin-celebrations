/**
 * ======================================================
 *  Script principal du module de gestion des thèmes
 * ======================================================
 */
import { getById, safeParseJSON, renderThemesGrid, disableAllActionButtons, enableAllActionButtons } from './utils.js';
import { refreshThemesGridFromAPI } from './themeGrid.js';
import { submitThemeForm, updateTheme } from './formHandler.js';
import { updateThemeOptions, refreshThemeSelect, exitThemeEditor } from './themeOptions.js';
import { updatePreview, initDevicePreviewSwitcher } from './devicePreview.js';
/**
 *
 * Classe principale pour gérer l'application des thèmes
 */
class ThemeManager {
  constructor() {
    this.elements = this.initializeElements();
    this.state = this.initializeState();
    this.observer = null;
  }
  /**
   *
   * Initialise les références aux éléments DOM
   */
  initializeElements() {
    return {
      themeSelect: getById('theme-select'),
      form: getById('theme-form'),
      successMessage: getById('success-message'),
      resetMessage: getById('reset-message'),
      erreurMessage: getById('erreur-message'),
      previewButton: getById('preview-button'),
      noThemeMessage: getById('no-themes-message'),
      themesGrid: getById('themes-grid'),
      resetBtn: getById('reset-button'),
      updateBtn: getById('update-button'),
      createBtn: getById('create-button'),
      previewBtn: getById('preview-button')
    };
  }
  /**
   *
   * Initialise l'état de l'application
   */
  initializeState() {
    return {
      currentSettings: safeParseJSON(CURRENT_SETTINGS_STR, "CURRENT_SETTINGS_STR"),
      allThemes: safeParseJSON(ALL_THEMES, "ALL_THEMES"),
      rawThemes: safeParseJSON(THEMES_CONFIG_STR, "THEMES_CONFIG_STR"),
    };
  }
  /**
   *
   * Configure le MutationObserver pour surveiller les changements DOM
   */
  setupMutationObserver() {
    this.observer = new MutationObserver(() => {
      disableAllActionButtons();
    });
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  /**
   *
   * Configure l'état initial des boutons
   */
  setupInitialButtonStates() {
    disableAllActionButtons();
    this.elements.createBtn.disabled = true;
    this.elements.previewBtn.disabled = true;
  }
  /**
   *
   * Configure les écouteurs d'événements du formulaire
   */
  setupFormListeners() {
    this.elements.form.addEventListener('submit', async (event) => {
      event.preventDefault();
      await this.handleFormSubmit();
    });
    this.elements.themeSelect.addEventListener('change', () => {
      updateThemeOptions(this.state.rawThemes, this.elements.themeSelect);
    });
  }
  /**
   *
   * Gère la soumission du formulaire
   */
  async handleFormSubmit() {
    await submitThemeForm(
      this.elements.form,
      this.state.rawThemes,
      this.elements,
      async () => {
        await refreshThemesGridFromAPI(this.state, this.elements, this.state.rawThemes);
        refreshThemeSelect(this.state.allThemes, this.state.rawThemes, this.elements.themeSelect);
      }
    );
  }
  /**
   *
   * Configure les sliders de quantité (flocons, coeurs, spiders)
   */
  setupQuantitySliders() {
    ['flocons', 'coeurs', 'spiders'].forEach(type => {
      const input = getById(`quantite_${type}`);
      const label = getById(`val_quantite_${type}`);

      if (input && label) {
        input.addEventListener('input', () => {
          label.textContent = input.value;
        });
      }
    });
  }
  /**
   *
   * Configure le bouton de prévisualisation
   */
  setupPreviewButton() {
    if (!this.elements.previewButton) return;
    this.elements.previewButton.addEventListener('click', () => {
      const themeName = this.getActiveThemeName();
      if (themeName) {
        updatePreview(this.state.rawThemes, themeName);
      }
    });
  }
  /**
   *
   * Configure le bouton de mise à jour
   */
  setupUpdateButton() {
    if (!this.elements.updateBtn) return;
    this.elements.updateBtn.addEventListener('click', async () => {
      await this.handleThemeUpdate();
    });
  }
  /**
   *
   * Gère la mise à jour d'un thème
   */
  async handleThemeUpdate() {
    const buttons = [
      this.elements.updateBtn,
      this.elements.previewBtn,
      getById("cancel-edit-btn"),
      this.elements.resetBtn
    ];
    this.toggleButtons(buttons, true);
    try {
      const themeName = this.getActiveThemeName();
      if (!themeName) return;
      const success = await updateTheme(themeName, this.state.rawThemes, this.elements.form, this.elements);
      if (!success) return;
      await refreshThemesGridFromAPI(this.state, this.elements, this.state.rawThemes);
      refreshThemeSelect(this.state.allThemes, this.state.rawThemes, this.elements.themeSelect);
      exitThemeEditor(this.state.rawThemes, this.elements);
      const activeTheme = this.elements.themeSelect.value;
      updatePreview(this.state.rawThemes, activeTheme);
    } finally {
      this.toggleButtons(buttons, false);
    }
  }
  /**
   *
   * Récupère le nom du thème actuellement actif
   */
  getActiveThemeName() {
    const visibleFormGroup = document.querySelector('.form-group[style*="display: block"]');
    return visibleFormGroup ? visibleFormGroup.id.replace('-options', '') : null;
  }
  /**
   *
   * Active/désactive un ensemble de boutons
   */
  toggleButtons(buttons, disabled) {
    buttons.forEach(btn => {
      if (btn) btn.disabled = disabled;
    });
  }
  /**
   *
   * Configure l'événement de chargement complet de la page
   */
  setupWindowLoadEvent() {
    window.addEventListener('load', () => {
      this.elements.createBtn.disabled = false;
      this.elements.previewBtn.disabled = false;
      enableAllActionButtons();
      if (this.observer) {
        this.observer.disconnect();
      }
    });
  }
  /**
   *
   * Initialise le switcher de prévisualisation des appareils
   */
  setupDevicePreviewSwitcher() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initDevicePreviewSwitcher);
    } else {
      initDevicePreviewSwitcher();
    }
  }
  /**
   *
   * Initialise tous les composants de l'application
   */
  init() {
    this.setupMutationObserver();
    this.setupInitialButtonStates();
    renderThemesGrid(this.state, this.elements);
    this.setupFormListeners();
    this.setupQuantitySliders();
    this.setupPreviewButton();
    this.setupUpdateButton();
    this.setupDevicePreviewSwitcher();
    this.setupWindowLoadEvent();
    updateThemeOptions(this.state.rawThemes, this.elements.themeSelect);
  }
}
/**
 *
 * Point d'entrée de l'application
 */
document.addEventListener('DOMContentLoaded', () => {
  const themeManager = new ThemeManager();
  themeManager.init();
});