import { updateThemesGrid, refreshThemesGridFromAPI, attachThemeCardEvents } from './themeGrid.js';
import { refreshThemeSelect, showThemeEditor } from './themeOptions.js';
/**
 *
 *  Utilitaires généraux
 *  @param {string} id - Identifiant de l'élément DOM.
 *  @returns {HTMLElement|null} Élément DOM trouvé ou null.
 */
export const getById = id => document.getElementById(id);
/**
 *
 *  Décode les entités HTML
 *  @param {string} html - Chaîne contenant des entités HTML.
 *  @returns {string} - Chaîne décodée.
 */
export function decodeHtml(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}
/**
 *
 *  Parse JSON sécurisé
 *  @param {string} encodedStr - Chaîne JSON encodée.
 *  @param {string} [label="JSON inconnu"] - Nom utilisé pour identifier la source du JSON dans les logs.
 *  @returns {Object} - Objet décodé ou un objet vide en cas d’erreur.
 */
export function safeParseJSON(encodedStr, label = "JSON inconnu") {
  try {
    if (!encodedStr) throw new Error(`${label} vide ou non défini`);
    const decoded = decodeHtml(encodedStr);
    return JSON.parse(decoded);
  } catch (e) {
    console.warn(`Erreur de parsing ${label} :`, e);
    return {};
  }
}
/**
 *
 *  Formate un timestamp en date lisible
 *  @param {number} timestamp - Timestamp en secondes.
 *  @returns {string} - Date formatée (ex: "12 novembre 2025, 08:42").
 */
export function formatDate(timestamp) {
  const date = new Date(timestamp * 1000);
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return date.toLocaleDateString('fr-FR', options);
}
/**
 *
 *  Calcule le pourcentage de progression
 *  @param {number} startDate - Timestamp de début (en secondes).
 *  @param {number} endDate - Timestamp de fin (en secondes).
 *  @returns {number} - Pourcentage d’avancement (0 à 100).
 */
export function calculateProgress(startDate, endDate) {
  const now = Date.now() / 1000;
  const total = endDate - startDate;
  const elapsed = now - startDate;
  if (elapsed < 0) return 0;
  if (elapsed > total) return 100;
  return Math.round((elapsed / total) * 100);
}
/**
 *
 *  Détermine le statut d'un thème
 *  @param {Object} theme - Objet contenant les propriétés d’un thème (start_date, end_date, active, etc.).
 *  @returns {{type: string, label: string}} - Type et libellé du statut.
 */
export function getThemeStatus(theme) {
  const now = Date.now() / 1000;
  if (theme.is_current) {
    return { type: 'current', label: 'En cours' };
  }
  if (!theme.active) {
    return { type: 'expired', label: 'Inactif' };
  }
  if (theme.start_date > now) {
    return { type: 'scheduled', label: 'Programmé' };
  }
  if (theme.end_date < now) {
    return { type: 'expired', label: 'Expiré' };
  }
  return { type: 'active', label: 'Actif' };
}
/**
 *
 *  Affiche une notification temporaire
 *  @param {string} message - Message à afficher.
 *  @param {'info'|'success'|'error'} [type='info'] - Type de notification (impacte la couleur).
 *  @returns {void}
 */
export function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 24px;
    background: ${type === 'success' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'};
    color: white;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    z-index: 10000;
    font-weight: 600;
    animation: slideIn 0.3s ease;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}
/**
 *
 *  Active/désactive les boutons
 *  @param {HTMLButtonElement[]} buttons - Tableau de boutons à modifier.
 *  @param {boolean} disabled - Indique si les boutons doivent être désactivés.
 *  @returns {void}
 */
export function toggleButtons(buttons, disabled) {
  buttons.forEach(btn => {
    if (btn) {
      btn.disabled = disabled;
      btn.style.cursor = disabled ? 'not-allowed' : 'pointer';
    }
  });
}
/**
 *
 * Met à jour la grille des thèmes et rattache les événements associés.
 *
 * @param {Object} state - État global (allThemes, currentSettings, themesConfigStr)
 * @param {Object} elements - Références DOM utilisées pour le rendu (themesGrid, noThemeMessage, etc.)
 * @param {Object} rawThemes - Données brutes de configuration des thèmes
 * @returns {Promise<void>}
 */
export async function renderThemesGrid(state, elements, rawThemes) {
  updateThemesGrid(
    state.allThemes,
    state.currentSettings.theme_name,
    elements.noThemeMessage,
    elements.themesGrid
  );
  attachThemeCardEvents(
    themeName => {
      showThemeEditor(themeName, rawThemes, elements);
    },
    async () => {
      await refreshThemesGridFromAPI(state, elements, rawThemes);
      refreshThemeSelect(state.allThemes, state.themesConfigStr, elements.themeSelect);
    }
  );
}
