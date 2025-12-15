import { updateThemesGrid, refreshThemesGridFromAPI, attachThemeCardEvents } from './themeGrid.js';
import { refreshThemeSelect, showThemeEditor } from './themeOptions.js';
import { TRANSLATION_UI } from './config.js';
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
 * Formate un timestamp pour l'affichage lisible aux utilisateurs.
 * @param {number} timestamp - Timestamp en secondes.
 * @param {boolean} [endOfDay=false] - Si vrai, force l'heure à 23:59 pour indiquer la fin de journée.
 * @returns {string} Date formatée (ex: "12 novembre 2025 à 08:42" ou "12 novembre 2025 à 23:59").
 */
export function formatDate(timestamp, endOfDay = false) {
  const date = new Date(timestamp * 1000);
  const day = date.getDate();
  const month = date.toLocaleString('fr-FR', { month: 'long' });
  const year = date.getFullYear();
  const hour = endOfDay ? '23' : String(date.getHours()).padStart(2, '0');
  const minute = endOfDay ? '59' : String(date.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year} à ${hour}:${minute}`;
}
/**
 * Formate un timestamp pour un input HTML de type "date".
 * @param {number} timestamp - Timestamp en secondes.
 * @returns {string} Date au format "YYYY-MM-DD" pour l'input.
 */
function formatDateForInput(timestamp) {
    const date = new Date(timestamp * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 0-based
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
 * Affiche une notification temporaire
 * @param {string} message - Message à afficher.
 * @param {'info'|'success'|'error'} [type='info'] - Type de notification (impacte la couleur et le comportement)
 * @returns {Promise<void>|void} - Pour 'info', renvoie une Promise qui se résout quand l'utilisateur confirme
 */
export function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  let background = '';
  if (type === 'success') {
    background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
  } else if (type === 'error') {
    background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
  } else {
    background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
  }
  notification.style.cssText = `
    position: fixed;
    top: 235px;
    left: 50%;
    transform: translateX(-50%);
    padding: 16px 24px;
    background: ${background};
    color: white;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    z-index: 10000;
    font-weight: 600;
    animation: slideIn 0.3s ease;
    display: flex;
    align-items: center;
    gap: 12px;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  if (type === 'info') {
    return new Promise((resolve) => {
      const btn = document.createElement('button');
      btn.textContent = TRANSLATION_UI['yes'];
      btn.style.cssText = `
        padding: 4px 12px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        background: rgba(255,255,255,0.2);
        color: white;
        font-weight: 600;
      `;
      notification.appendChild(btn);
      btn.addEventListener('click', () => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
          notification.remove();
          resolve(true);
        }, 300);
      });
       const btnCancel = document.createElement('button');
      btnCancel.textContent = TRANSLATION_UI['cancel'];
      btnCancel.style.cssText = `
        padding: 4px 12px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        background: rgba(255, 0, 0, 0.49);
        color: white;
        font-weight: 600;
      `;
      notification.appendChild(btnCancel);
      btnCancel.addEventListener('click', () => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
          notification.remove();
          resolve(false);
        }, 300);
      });
    });
  } else {
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
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
 * @param {Object} state - État global comprenant :
 *   - {Object} allThemes : liste de tous les thèmes disponibles
 *   - {Object} currentSettings : thème actif + options actuelles
 *   - {string} themesConfigStr : configuration brute renvoyée par la BD/API
 *
 * @param {Object} elements - Références DOM nécessaires au rendu :
 *   - {HTMLElement} themesGrid : conteneur principal de la grille
 *   - {HTMLElement} noThemeMessage : message affiché si aucun thème n'existe
 *   - {HTMLSelectElement} themeSelect : dropdown de sélection des thèmes
 * @returns {Promise<void>}
 */
export async function renderThemesGrid(state, elements) {
  updateThemesGrid(
    state.allThemes,
    state.currentSettings.theme_name,
    elements.noThemeMessage,
    elements.themesGrid
  );
  attachThemeCardEvents(
    themeName => {
      state.currentSettings = { theme_name: themeName };
      showThemeEditor(themeName, state, elements);
    },
    async (deletedThemeName) => {
      const currentEditedTheme = state.currentSettings?.theme_name;
      await refreshThemesGridFromAPI(state, elements, state.rawThemes);
      if (currentEditedTheme == deletedThemeName) {
        exitThemeEditor(state.rawThemes, elements);
        refreshThemeSelect(state.allThemes, state.rawThemes, elements.themeSelect);
        state.currentSettings = {};
      }else{
        state.currentSettings = { theme_name: currentEditedTheme };
      }
    }
  );
}
/**
 *
 *  Désactive tous les boutons d'action des cartes de thème
 *  Empêche l'utilisateur de cliquer plusieurs fois pendant une action asynchrone
 *  @returns {void}
 */
export function disableAllActionButtons() {
  document.querySelectorAll('.btn-action').forEach(btn => btn.disabled = true);
}
/**
 *
 *  Réactive tous les boutons d'action des cartes de thème
 *  À utiliser une fois les opérations asynchrones complétées
 *  @returns {void}
 */
export function enableAllActionButtons() {
  document.querySelectorAll('.btn-action').forEach(btn => btn.disabled = false);
}
