/**
 * ======================================================
 *  Gestion du formulaire de thème
 * ======================================================
 */
import { API_ENDPOINTS } from './config.js';
import { getById, toggleButtons } from './utils.js';
/**
 *
 *  Soumet le formulaire de thème au serveur
 *  @param {HTMLFormElement} form - Formulaire à soumettre
 *  @param {Object} rawThemes - Objet contenant tous les thèmes et leurs éléments
 *  @param {Object} elements - Références vers les éléments DOM utiles (messages, selects, etc.)
 *  @param {Function} [onSuccess] - Callback optionnel appelé après succès
 *  @returns {Promise<void>} - Envoie les données au serveur et met à jour l'UI
 */
export async function submitThemeForm(form, rawThemes, elements, onSuccess) {
  const actionType = form.dataset.actionType || "apply";
  delete form.dataset.actionType;
  const selectedTheme = elements.themeSelect.value;
  const themeData = rawThemes[selectedTheme];
  const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
  const prevBtn = getById('preview-button');
  const start_date = form.querySelector('input[name="start_date"]').value;
  const end_date = form.querySelector('input[name="end_date"]').value;
  toggleButtons([submitBtn, prevBtn], true);
  const formData = new FormData();
  formData.append('plugin_name', 'Celebrations');
  formData.append('class', 'Koha::Plugin::Celebrations');
  formData.append('method', 'apply_theme');
  formData.append('action', actionType);
  formData.append('action', 'apply_theme');
  formData.append('theme', selectedTheme);
  if (themeData && themeData.elements) {
    Object.values(themeData.elements).forEach(element => {
      const input = getById(element.setting);
      if (input) {
        formData.append(
          input.id,
          input.type === 'checkbox' ? (input.checked ? 'on' : 'off') : input.value
        );
      }
      if (element.extra_options) {
        Object.keys(element.extra_options).forEach(optKey => {
          const extraInput = getById(optKey);
          if (extraInput) {
            formData.append(
              extraInput.id,
              extraInput.type === 'checkbox'
                ? (extraInput.checked ? 'on' : 'off')
                : extraInput.value
            );
          }
        });
      }
    });
  }
  formData.append('start_date', start_date || null);
  formData.append('end_date', end_date || null);
  try {
    const response = await fetch(API_ENDPOINTS.applyTheme, {
      method: 'POST',
      body: formData,
      credentials: 'same-origin'
    });
    const data = await response.json();
    const TRANSLATION = window.translation;
    if (data.success) {
      elements.successMessage.textContent = TRANSLATION[data.message];
      elements.successMessage.style.display = "block";
    } else {
      elements.erreurMessage.textContent = TRANSLATION[data.message];
      elements.erreurMessage.style.display = "block";
    }
    const iframe = getById('theme-preview');
    if (iframe) iframe.contentWindow.location.reload(true);
    setTimeout(() => {
      elements.resetMessage.style.display = 'none';
      elements.successMessage.style.display = 'none';
      elements.erreurMessage.style.display = 'none';
      toggleButtons([submitBtn, prevBtn], false);
    }, 5000);
    if (onSuccess && data.success === true) onSuccess();
  } catch (error) {
    console.error("Erreur réseau:", error);
    elements.erreurMessage.textContent = TRANSLATION[data.message];
    elements.erreurMessage.style.display = 'block';
    setTimeout(() => {
      elements.erreurMessage.style.display = 'none';
      toggleButtons([submitBtn, prevBtn], false);
    }, 5000);
  }
}
/**
 *
 *  Réinitialise la configuration du formulaire aux valeurs actuelles
 *  @param {HTMLFormElement} form - Formulaire à réinitialiser
 *  @param {Object} currentSettings - Valeurs actuelles des paramètres du thème
 *  @returns {void} - Met à jour les inputs et déclenche le submit pour appliquer la réinitialisation
 */
export function resetConfiguration(form, currentSettings) {
  if (currentSettings.theme) {
    const themeSelect = getById('theme-select');
    if (themeSelect) themeSelect.value = currentSettings.theme;
  }
  Object.entries(currentSettings).forEach(([key, value]) => {
    const input = $(key);
    if (!input) return;
    if (input.type === 'checkbox') {
      input.checked = value === 'on';
    } else {
      input.value = value;
      const valLabel = getById(`val_${key}`);
      if (valLabel) valLabel.textContent = value;
    }
  });
  form.dataset.actionType = "reset";
  form.dispatchEvent(new Event('submit'));
}
/**
 * ------------------------------------------------------
 *  Met à jour un thème existant dans la BD
 * ------------------------------------------------------
 *  @param {string} themeName - Nom du thème à modifier
 *  @param {Object} rawThemes - Toutes les configs de thèmes
 *  @param {HTMLElement} form - Le formulaire contenant les nouvelles valeurs
 *  @param {Object} elements - Tous les éléments DOM utiles (messages, boutons)
 */
export async function updateTheme(themeName, rawThemes, form, elements) {
  const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
  const resetBtn = form.querySelector('button[type="reset"], input[type="reset"]');
  toggleButtons([submitBtn, resetBtn], true);
  const formData = new FormData();
  formData.append('plugin_name', 'Celebrations');
  formData.append('class', 'Koha::Plugin::Celebrations');
  formData.append('method', 'update_theme');
  formData.append('theme_name', themeName);
  const themeData = rawThemes[themeName];
  if (themeData && themeData.elements) {
    Object.values(themeData.elements).forEach(element => {
      const input = getById(element.setting);
      if (input) {
        formData.append(
          input.id,
          input.type === 'checkbox' ? (input.checked ? 'on' : 'off') : input.value
        );
      }
      if (element.extra_options) {
        Object.keys(element.extra_options).forEach(optKey => {
          const extraInput = getById(optKey);
          if (extraInput) {
            formData.append(
              extraInput.id,
              extraInput.type === 'checkbox'
                ? (extraInput.checked ? 'on' : 'off')
                : extraInput.value
            );
          }
        });
      }
    });
  }
  const start_date = form.querySelector('input[name="start_date"]').value;
  const end_date = form.querySelector('input[name="end_date"]').value;
  if (start_date) formData.append('start_date', start_date);
  if (end_date)   formData.append('end_date', end_date);
  const TRANSLATION = window.translation;
  try {
    const response = await fetch(API_ENDPOINTS.updateTheme, {
      method: 'POST',
      body: formData,
      credentials: 'same-origin'
    });
    const data = await response.json();
    if (data.success) {
      elements.successMessage.textContent = TRANSLATION['theme_updated'];
      elements.successMessage.style.display = "block";
    } else {
      elements.erreurMessage.textContent =  TRANSLATION['update_error'];
      elements.erreurMessage.style.display = "block";
    }
  } catch (error) {
    console.error("Erreur réseau:", error);
    elements.erreurMessage.textContent = TRANSLATION['connexion_error'];
    elements.erreurMessage.style.display = "block";
  } finally {
    setTimeout(() => {
      elements.successMessage.style.display = "none";
      elements.erreurMessage.style.display = "none";
      toggleButtons([submitBtn, resetBtn], false);
    }, 4000);
  }
}