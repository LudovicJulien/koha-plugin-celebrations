/**
 * ======================================================
 *  Gestion de la grille des thèmes
 * ======================================================
 */
import { TRANSLATION_UI, API_ENDPOINTS } from './config.js';
import { formatDate, calculateProgress, getThemeStatus, showNotification, disableAllActionButtons, enableAllActionButtons, renderThemesGrid } from './utils.js';
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
  const displayName = theme.theme_name;
  const status = getThemeStatus(theme);
  const progress = calculateProgress(theme.start_date, theme.end_date);
  const isCurrent = theme.theme_name === currentTheme;
  return `
  <div class="theme-card-wrapper ${isCurrent ? 'active' : ''}">
    <div class="theme-card">
      <div class="theme-card-top">
        <div class="theme-card-header">
          <div class="theme-icon">${TRANSLATION_UI.emoji[displayName] || TRANSLATION_UI.emoji.default}</div>
          <div class="theme-name">${TRANSLATION_UI.form[displayName]}</div>
        </div>
      </div>
      <div class="theme-card-body">
        <div class="theme-dates">
          <div class="date-row">
            <span class="labelCard">${TRANSLATION_UI.prog['debut']}</span>
            <span class="value">${formatDate(theme.start_date)}</span>
          </div>
          <div class="date-row">
            <span class="labelCard">${TRANSLATION_UI.prog['fin']}</span>
            <span class="value">${formatDate(theme.end_date)}</span>
          </div>
        </div>
        <div class="theme-progress">
          <div class="progress-label">
            ${status.type === 'current'
              ? `<span>${TRANSLATION_UI.prog['prog']}</span><span class="progress-percent">${progress}% ${TRANSLATION_UI.grille['actif']}</span>`
              : `<span>${TRANSLATION_UI.prog['prog']}</span><span class="progress-percent inactive-text">${TRANSLATION_UI.grille['nonActif']}</span>`}
          </div>
          <div class="progress-bar" role="progressbar" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100">
            <div class="progress-fill" data-progress="${progress}"
                 style="width: ${status.type === 'current' ? progress : 0}%;
                        opacity: ${status.type === 'current' ? 1 : 0.3};"></div>
          </div>
        </div>
      </div>
      <div class="theme-card-footer">
        <button class="btn-action action-btn-edit" data-theme="${theme.theme_name}">${TRANSLATION_UI.grille['modif']}</button>
        <button class="btn-action action-btn-delete" data-theme="${theme.theme_name}">${TRANSLATION_UI.grille['sup']}</button>
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
 * @async
 * @param {Object} state - État global de l’application.
 * @param {Object} state.allThemes - Dictionnaire des thèmes disponibles.
 * @param {Object} state.currentSettings - Paramètres courants, incluant le thème actif.
 * @param {Object} elements - Ensemble des éléments du DOM nécessaires à la mise à jour.
 * @param {HTMLElement} elements.noThemeMessage - Élément affiché lorsqu’aucun thème n’est disponible.
 * @param {HTMLElement} elements.themesGrid - Conteneur de la grille des thèmes.
 * @param {HTMLElement} [elements.themeSelect] - Menu déroulant des thèmes (optionnel, pour le rafraîchissement du sélecteur).
 * @returns {Promise<void>}
 */
export async function refreshThemesGridFromAPI(state, elements ) {
  try {
    const response = await fetch(API_ENDPOINTS.listThemes, {
      method: 'GET',
      credentials: 'same-origin'
    });
    const data = await response.json();
    if (data.success) {
      state.allThemes = data.themes.map(theme => ({
        ...theme,
        theme_name: theme.name
      }));
      state.currentSettings.theme_name = data.current_theme;
      await renderThemesGrid(state, elements, state.rawThemes);
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
 * @async
 * @param {string} themeName - Nom du thème à supprimer.
 * @param {Function} [onSuccess] - Fonction callback appelée après suppression réussie.
 * @returns {Promise<void>}
 */
export async function deleteTheme(themeName, onSuccess) {
  const confirmed = await showNotification(
    `${TRANSLATION_UI.grille['delete1']} ${TRANSLATION_UI.form[themeName]} ?\n\n${TRANSLATION_UI.grille['delete2']}`,
    'info'
  );
  if (!confirmed) return;
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
        await new Promise(resolve => {
          setTimeout( () => {
            card.remove();
            const remainingCards = document.querySelectorAll('.theme-card');
            if (remainingCards.length === 0) {
              const themesGrid = document.getElementById('themes-grid');
              if (themesGrid) themesGrid.innerHTML = '';
            }
            resolve();
          }, 300);
        });
      }
      if (onSuccess) await onSuccess();
      showNotification(`${TRANSLATION_UI.grille['delNotif1']}`, 'success');
    } else {
      throw new Error(`${TRANSLATION_UI.grille['delNotif2']}`);
    }
  } catch (error) {
    console.error('Erreur:', error);
    showNotification(`${TRANSLATION_UI.grille['delNotif2']}`, 'error');
  }
}
/**
 *
 * Attache les événements de clic aux boutons des cartes de thème.
 * @param {Function} [onEdit] - Callback appelée lors du clic sur “Modifier”.
 * @param {Function} [onDelete] - Callback appelée lors du clic sur “Supprimer”.
 * @returns {void}
 */
let isProcessingThemeAction = false;
export function attachThemeCardEvents(onEdit, onDelete) {
  document.querySelectorAll('.action-btn-edit').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const themeName = e.currentTarget.dataset.theme;
      disableAllActionButtons();
      try {
        if (onEdit) {
          await onEdit(themeName);
        }
      } finally {
        enableAllActionButtons();
      }
    });
  });
  document.querySelectorAll('.action-btn-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
       if (isProcessingThemeAction) return;
        isProcessingThemeAction = true;
      const themeName = e.currentTarget.dataset.theme;
      disableAllActionButtons();
      try {
        if (onDelete) {
          await deleteTheme(themeName, onDelete);
        }
      } finally {
        enableAllActionButtons();
         isProcessingThemeAction = false;
      }
    });
  });
}