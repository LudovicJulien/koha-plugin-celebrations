/**
 * ======================================================
 *  Gestion du formulaire de thème
 * ======================================================
 */
import { API_ENDPOINTS, TRANSLATION_BACKEND } from './config.js';
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
  const elementsPayload = {};
  if (themeData && themeData.elements) {
    Object.values(themeData.elements).forEach(element => {
      const elementPayload = {
        enabled: false,
        options: {}
      };
      const mainInput = getById(element.setting);
      if (mainInput) {
        elementPayload.enabled =
          mainInput.type === 'checkbox'
            ? mainInput.checked
            : Boolean(mainInput.value);
      }
      if (element.extra_options) {
        Object.keys(element.extra_options).forEach(optKey => {
          const extraInput = getById(optKey);
          if (extraInput) {
            elementPayload.options[optKey] =
              extraInput.type === 'checkbox'
                ? extraInput.checked
                : extraInput.value;
          }
        });
      }
      elementsPayload[element.setting] = elementPayload;
    });
  }
  const payload = {
    theme: selectedTheme,
    start_date,
    end_date,
    elements: elementsPayload
  };
  try {
    const response = await fetch(API_ENDPOINTS.themes, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin',
      body: JSON.stringify(payload)
    });
    const json = await response.json();
    const data = json.results?.result;
    if (data.success) {
      elements.successMessage.textContent = TRANSLATION_BACKEND[data.message];
      elements.successMessage.style.display = "block";
    } else {
      elements.erreurMessage.textContent = TRANSLATION_BACKEND[data.message];
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
    if (onSuccess && data.success) onSuccess();
  } catch (error) {
    console.error("Erreur réseau:", error);
    elements.erreurMessage.textContent = 'connexion_error';
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
  const themeData = rawThemes[themeName];
  const start_date = form.querySelector('input[name="start_date"]').value;
  const end_date   = form.querySelector('input[name="end_date"]').value;
  const elementsPayload = {};
  if (themeData?.elements) {
    Object.values(themeData.elements).forEach(element => {
      const mainInput = getById(element.setting);
      elementsPayload[element.setting] = {
        enabled: mainInput?.checked || false,
        options: {}
      };
      if (element.extra_options) {
        Object.keys(element.extra_options).forEach(optKey => {
          const input = getById(optKey);
          if (input) {
            elementsPayload[element.setting].options[optKey] =
              input.type === 'checkbox'
                ? input.checked
                : input.value;
          }
        });
      }
    });
  }
  const payload = {
    start_date,
    end_date,
    elements: elementsPayload
  };
  try {
    const response = await fetch(`${API_ENDPOINTS.themes}/${encodeURIComponent(themeName)}`, {
      method: 'PUT',
      credentials: 'same-origin',
      body: JSON.stringify(payload),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    const json = await response.json();
    const data = json.results?.result;
    if (data?.success) {
      elements.successMessage.textContent = TRANSLATION_BACKEND['theme_updated'];
      elements.successMessage.style.display = "block";
      return true;
    } else {
      elements.erreurMessage.textContent =  TRANSLATION_BACKEND[data.message];
      elements.erreurMessage.style.display = "block";
      return false;
    }
  } catch (error) {
    console.error("Erreur réseau:", error);
    elements.erreurMessage.textContent = TRANSLATION_BACKEND['connexion_error'];
    elements.erreurMessage.style.display = "block";
    return false;
  } finally {
    setTimeout(() => {
      elements.successMessage.style.display = "none";
      elements.erreurMessage.style.display = "none";
      toggleButtons([submitBtn, resetBtn], false);
    }, 4000);
  }
}
