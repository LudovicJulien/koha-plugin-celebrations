/**
 * ======================================================
 *  Gestion de la grille des thèmes
 * ======================================================
 */
import { THEME_EMOJIS, API_ENDPOINTS } from './config.js';
import { formatDate, calculateProgress, getThemeStatus, showNotification } from './utils.js';
/**
 *
 * Trie les thèmes par statut et par date de début.
 * @param {Object} themes - Ensemble des thèmes à trier.
 * @returns {Array<Object>} - Liste triée des thèmes.
 */
export function sortThemes(themes) {
  return Object.values(themes).sort((a, b) => {
    if (a.active && !b.active) return -1;
    if (!a.active && b.active) return 1;
    return b.start_date - a.start_date;
  });
}
/**
 *
 * Crée le HTML d'une carte représentant un thème.
 * @param {Object} theme - Données du thème.
 * @param {string} currentTheme - Nom du thème actuellement actif.
 * @returns {string} - Code HTML de la carte du thème.
 */
export function createThemeCard(theme, currentTheme) {
  const status = getThemeStatus(theme);
  const emoji = THEME_EMOJIS[theme.theme_name] || THEME_EMOJIS.default;
  const displayName = theme.theme_name;
  const progress = calculateProgress(theme.start_date, theme.end_date);
  const isCurrent = theme.theme_name === currentTheme;
  return `
  <div class="theme-card-wrapper ${isCurrent ? 'active' : ''}">
    <div class="theme-card">
      <div class="theme-card-top">
        <div class="theme-card-header">
          <div class="theme-icon">${emoji}</div>
          <div class="theme-name">${displayName}</div>
        </div>
      </div>
      <div class="theme-card-body">
        <div class="theme-dates">
          <div class="date-row">
            <span class="labelCard">Début</span>
            <span class="value">${formatDate(theme.start_date)}</span>
          </div>
          <div class="date-row">
            <span class="labelCard">Fin</span>
            <span class="value">${formatDate(theme.end_date)}</span>
          </div>
        </div>
        <div class="theme-progress">
          <div class="progress-label">
            ${status.type === 'current'
              ? `<span>Progression</span><span class="progress-percent">${progress}% actif</span>`
              : `<span>Progression</span><span class="progress-percent inactive-text">Thème non actif</span>`}
          </div>
          <div class="progress-bar" role="progressbar" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100">
            <div class="progress-fill" data-progress="${progress}"
                 style="width: ${status.type === 'current' ? progress : 0}%;
                        opacity: ${status.type === 'current' ? 1 : 0.3};"></div>
          </div>
        </div>
      </div>
      <div class="theme-card-footer">
        <button class="btn-action edit" data-theme="${theme.theme_name}">Modifier</button>
        <button class="btn-action action-btn-delete" data-theme="${theme.theme_name}">Supprimer</button>
      </div>
    </div>
  </div>`;
}
/**
 *
 * Met à jour l'affichage complet de la grille des thèmes.
 * @param {Object} themes - Ensemble des thèmes disponibles.
 * @param {string} currentTheme - Thème actuellement actif.
 * @param {HTMLElement} noThemeMessage - Élément affiché lorsqu’aucun thème n’est disponible.
 * @param {HTMLElement} themesGrid - Conteneur HTML de la grille.
 * @returns {void}
 */
export function updateThemesGrid(themes, currentTheme, noThemeMessage, themesGrid) {
  const sortedThemes = sortThemes(themes);
  if (!sortedThemes || sortedThemes.length === 0) {
    noThemeMessage.style.display = 'block';
    themesGrid.innerHTML = '';
  } else {
    noThemeMessage.style.display = 'none';
    themesGrid.innerHTML = sortedThemes
      .map(theme => createThemeCard(theme, currentTheme))
      .join('');
  }
}
/**
 *
 * Rafraîchit la grille des thèmes depuis l’API.
 * @param {Object} state - État global de l’application (contient les thèmes et le thème courant).
 * @param {Object} elements - Contient les éléments du DOM nécessaires à la mise à jour.
 * @param {HTMLElement} elements.noThemeMessage - Élément de message “aucun thème”.
 * @param {HTMLElement} elements.themesGrid - Conteneur de la grille.
 * @returns {Promise<void>}
 */
export async function refreshThemesGridFromAPI(state, elements) {
  try {
    const response = await fetch(API_ENDPOINTS.listThemes, {
      method: 'GET',
      credentials: 'same-origin'
    });
    const data = await response.json();
    if (data.success) {
      state.allThemes = {};
      data.themes.forEach(theme => {
        state.allThemes[theme.name] = { ...theme, theme_name: theme.name };
      });
      state.currentSettings.theme_name = data.current_theme;
      updateThemesGrid(state.allThemes, state.currentSettings.theme_name, elements.noThemeMessage, elements.themesGrid);
      console.log("Liste des thèmes rafraîchie avec succès.");
    } else {
      console.error('Erreur lors du rafraîchissement:', data.error);
    }
  } catch (error) {
    console.error('Erreur de connexion:', error);
  }
}
/**
 *
 * Supprime un thème à partir de son nom.
 * @param {string} themeName - Nom du thème à supprimer.
 * @param {Function} [onSuccess] - Fonction callback appelée après suppression réussie.
 * @returns {Promise<void>}
 */
export async function deleteTheme(themeName, onSuccess) {
  if (!confirm(`Êtes-vous sûr de vouloir supprimer le thème "${themeName}" ?\n\nCette action est irréversible.`)) {
    return;
  }
  try {
    const formData = new FormData();
    formData.append('class', 'Koha::Plugin::Celebrations');
    formData.append('method', 'delete_theme');
    formData.append('theme_name', themeName);
    const response = await fetch(API_ENDPOINTS.deleteTheme, {
      method: 'POST',
      body: formData,
      credentials: 'same-origin'
    });
    const data = await response.json();
    if (data.success) {
      const card = document.querySelector(`.theme-card[data-theme="${themeName}"]`);
      if (card) {
        card.style.transform = 'scale(0.8)';
        card.style.opacity = '0';
        setTimeout(() => {
          card.remove();
          const remainingCards = document.querySelectorAll('.theme-card');
          if (remainingCards.length === 0) {
            const themesGrid = document.getElementById('themes-grid');
            if (themesGrid) themesGrid.innerHTML = '';
          }
        }, 300);
      }
      showNotification('Thème supprimé avec succès', 'success');
      if (onSuccess) onSuccess();
    } else {
      throw new Error(data.error || 'Erreur lors de la suppression');
    }
  } catch (error) {
    console.error('Erreur:', error);
    showNotification(`Erreur: ${error.message}`, 'error');
  }
}
/**
 *
 * Attache les événements de clic aux boutons des cartes de thème.
 * @param {Function} [onEdit] - Callback appelée lors du clic sur “Modifier”.
 * @param {Function} [onDelete] - Callback appelée lors du clic sur “Supprimer”.
 * @returns {void}
 */
export function attachThemeCardEvents(onEdit, onDelete) {
  document.querySelectorAll('.action-btn-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const themeName = e.currentTarget.dataset.theme;
      if (onEdit) onEdit(themeName);
    });
  });
  document.querySelectorAll('.action-btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const themeName = e.currentTarget.dataset.theme;
      deleteTheme(themeName, onDelete);
    });
  });
}