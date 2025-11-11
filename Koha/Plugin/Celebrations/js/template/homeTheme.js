const THEME_EMOJIS = {
    halloween: '🎃',
    noel: '🎄',
    valentin: '💝',
    paque: '🐰',
    default: '🎨'
};
// CONFIG: tailles de base pour chaque device
  const DEVICE_CONFIG = {
    ordi: {
      baseWidth: 1300,
      container: '.monitor-preview',
      screen: '.screenOrdi .content'
    },
    tel: {
      baseWidth: 500,
      container: '.iphone',
      screen: '.iphone .screenMobile'
    },
    tablet: {
      baseWidth: 800,
      container: '.ipad',
      screen: '.ipad .screenMobile'
    }
  };
document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);
  const themeSelect = $('theme-select');
  const form = $('theme-form');
  const successMessage = $('success-message');
  const resetMessage = $('reset-message');
  const erreurMessage = $('erreur-message');
  const previewButton = $('preview-button');
  const themesGrid = $('themes-grid');
  const rawThemes = safeParseJSON(THEMES_CONFIG_STR, "THEMES_CONFIG_STR");
  let currentSettings = safeParseJSON(CURRENT_SETTINGS_STR, "CURRENT_SETTINGS_STR");
  let allThemes = safeParseJSON(ALL_THEMES, "ALL_THEMES");
    console.log(allThemes);
  const sortedThemes = Object.values(allThemes).sort((a, b) => {
    if (a.active && !b.active) return -1;
    if (!a.active && b.active) return 1;
    return b.start_date - a.start_date;
  });
  themesGrid.innerHTML = sortedThemes
    .map(theme => createThemeCard(theme, currentSettings.theme_name))
    .join('');
  attachThemeCardEvents();
/**
 * Rafraîchit la grille des thèmes depuis l'API, met à jour l'état global `allThemes`
 */
async function refreshThemesGridFromAPI() {
    try {
        const response = await fetch(
            '/cgi-bin/koha/plugins/run.pl?class=Koha::Plugin::Celebrations&method=list_themes',
            { method: 'GET', credentials: 'same-origin' }
        );
        const data = await response.json();
        if (data.success) {
            allThemes = {};
            data.themes.forEach(theme => {
                allThemes[theme.name] = { ...theme, theme_name: theme.name };
            });
            currentSettings.theme_name = data.current_theme;
            const updatedSortedThemes = Object.values(allThemes).sort((a, b) => {
                if (a.active && !b.active) return -1;
                if (!a.active && b.active) return 1;
                return b.start_date - a.start_date;
            });
            themesGrid.innerHTML = updatedSortedThemes
              .map(theme => createThemeCard(theme, currentSettings.theme_name))
              .join('');
            attachThemeCardEvents();
            console.log("Liste des thèmes rafraîchie avec succès.");
        } else {
            console.error('Erreur lors du rafraîchissement de la liste des thèmes:', data.error);
        }
    } catch (error) {
        console.error('Erreur de connexion lors du rafraîchissement de la liste:', error);
    }
}
/**
 * Crée une carte d'un thème programmés
 */
function createThemeCard(theme, currentTheme) {
  const status = getThemeStatus(theme);
  const emoji = THEME_EMOJIS[theme.theme_name] || THEME_EMOJIS.default;
  const displayName =  theme.theme_name;
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
            ${
              status.type === 'current'
                ? `<span>Progression</span><span class="progress-percent">${progress}% actif</span>`
                : `<span>Progression</span><span class="progress-percent inactive-text">Thème non actif</span>`
            }
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
 * Formate une date timestamp en format lisible
 */
function formatDate(timestamp) {
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
 * Calcule le pourcentage de progression d'un thème
 */
function calculateProgress(startDate, endDate) {
    const now = Date.now() / 1000;
    const total = endDate - startDate;
    const elapsed = now - startDate;
    if (elapsed < 0) return 0;
    if (elapsed > total) return 100;
    return Math.round((elapsed / total) * 100);
}
/**
 * Calcule le statut d'un thème
 */
function getThemeStatus(theme) {
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
 * Attache les événements aux boutons des cartes
 */
function attachThemeCardEvents() {
    // Boutons de modification
    document.querySelectorAll('.action-btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const themeName = e.currentTarget.dataset.theme;
            editTheme(themeName);
        });
    });
    document.querySelectorAll('.action-btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const themeName = e.currentTarget.dataset.theme;
            deleteTheme(themeName);
        });
    });
}
/**
 * Supprimer un thème
 */
async function deleteTheme(themeName) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le thème "${themeName}" ?\n\nCette action est irréversible.`)) {
        return;
    }
    try {
        const formData = new FormData();
        formData.append('class', 'Koha::Plugin::Celebrations');
        formData.append('method', 'delete_theme');
        formData.append('theme_name', themeName);
        const response = await fetch(
            '/cgi-bin/koha/plugins/run.pl?class=Koha::Plugin::Celebrations&method=delete_theme',
            {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            }
        );
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
                        displayEmptyState(themesGrid);
                    }
                }, 300);
            }
            refreshThemesGridFromAPI();
            showNotification('Thème supprimé avec succès', 'success');
        } else {
            throw new Error(data.error || 'Erreur lors de la suppression');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification(`Erreur: ${error.message}`, 'error');
    }
}
/**
 * Affiche une notification temporaire
 */
function showNotification(message, type = 'info') {
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
   * Décode une chaîne HTML et parse du JSON en toute sécurité.
   * Retourne un objet vide si la donnée est invalide.
   */
  function safeParseJSON(encodedStr, label = "JSON inconnu") {
    try {
      if (!encodedStr) throw new Error(`${label} vide ou non défini`);
      const decoded = decodeHtml(encodedStr);
      return JSON.parse(decoded);
    } catch (e) {
      console.warn(`Erreur de parsing ${label} :`, e);
      return {};
    }
  }
  // --- Soumission du formulaire ---
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const actionType = form.dataset.actionType || "apply";
    delete form.dataset.actionType;
    const selectedTheme = themeSelect.value;
    const themeData = rawThemes[selectedTheme];
    const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
    const resetBtn = form.querySelector('button[type="reset"], input[type="reset"]');
    const start_date = form.querySelector('input[name="start_date"]').value;
    const end_date = form.querySelector('input[name="end_date"]').value;
    const toggleButtons = (disabled) => {
      [submitBtn, resetBtn].forEach(btn => {
        if (btn) {
          btn.disabled = disabled;
          btn.style.cursor = disabled ? 'not-allowed' : 'pointer';
        }
      });
    };
    toggleButtons(true);
    // --- Préparation des données ---
    const formData = new FormData();
    formData.append('plugin_name', 'Celebrations');
    formData.append('class', 'Koha::Plugin::Celebrations');
    formData.append('method', 'apply_theme');
    formData.append('action', actionType);
    formData.append('action', 'apply_theme');
    formData.append('theme', selectedTheme);
    if(themeData && themeData.elements) {
      Object.values(themeData.elements).forEach(element => {
        const input = $(element.setting);
        if (input) {
          formData.append(
            input.id,
            input.type === 'checkbox' ? (input.checked ? 'on' : 'off') : input.value
          );
        }
        if (element.extra_options) {
          Object.keys(element.extra_options).forEach(optKey => {
            const extraInput = $(optKey);
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
    // --- Envoi au serveur ---
try {
  const response = await fetch(
    '/cgi-bin/koha/plugins/run.pl?Koha::Plugin::Celebrations&method=apply_theme',
    { method: 'POST', body: formData, credentials: 'same-origin' }
  );
  const data = await response.json();
  if (data.success) {
    successMessage.textContent = data.message || "Thème appliqué avec succès.";
    successMessage.style.display = "block";
  } else {
    erreurMessage.textContent = data.message || "Une erreur est survenue.";
    erreurMessage.style.display = "block";
  }
  const iframe = document.getElementById('theme-preview');
  if (iframe) iframe.contentWindow.location.reload(true);
  setTimeout(() => {
    resetMessage.style.display = 'none';
    successMessage.style.display = 'none';
    erreurMessage.style.display = 'none';
    toggleButtons(false);
  }, 5000);
  refreshThemesGridFromAPI();
} catch (error) {
  console.error("Erreur réseau:", error);
  erreurMessage.textContent = "Erreur de connexion au serveur.";
  erreurMessage.style.display = 'block';
  setTimeout(() => {
    erreurMessage.style.display = 'none';
    toggleButtons(false);
  }, 5000);
}
  });
  // --- Gestion des affichages de toggles selon le thème ---
  function updateThemeOptions() {
    Object.values(rawThemes).forEach(theme => {
      Object.values(theme.elements || {}).forEach(element => {
        if (element.toggle_id) {
          const el = $(element.toggle_id);
          if (el) el.style.display = 'none';
        }
        if (element.extra_options) {
          const elementKey = Object.keys(theme.elements).find(key => theme.elements[key] === element);
          if (elementKey) {
            const configDivId = `${elementKey}-config`;
            const configDiv = $(configDivId);
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
          const el = $(element.toggle_id);
          if (el) {
            el.style.display = 'flex';
          }
        }
      });
    }
    Object.values(themeData?.elements || {}).forEach(element => {
      const mainToggle = $(element.setting);
      if (mainToggle) mainToggle.dispatchEvent(new Event('change'));
    });
    if (themeData && themeData.elements) {
      Object.entries(themeData.elements).forEach(([elementKey, element]) => {
        if (element.extra_options) {
          const mainToggle = $(element.setting);
          const configDivId = `${elementKey}-config`;
          const configDiv = $(configDivId);
          toggleConfig(mainToggle, configDiv, selectedTheme);
        }
      });
    }
    // Repositionner l'iframe après changement des options
    setTimeout(() => {
      if (window.positionIframeGlobal) {
        window.positionIframeGlobal();
      }
    }, 150);
  }
  // --- Gère l'affichage des sous-options liées à une case à cocher ---
  function toggleConfig(mainToggle, configDiv, themeName) {
    if (!mainToggle || !configDiv) return;
    const updateDisplay = () => {
      const isChecked = mainToggle.type === 'checkbox' ? mainToggle.checked : true;
      configDiv.style.display =
        themeSelect.value === themeName && isChecked ? 'block' : 'none';
      // Repositionner l'iframe après affichage/masquage des options
      setTimeout(() => {
        if (window.positionIframeGlobal) {
          window.positionIframeGlobal();
        }
      }, 100);
    };
    mainToggle.addEventListener('change', updateDisplay);
    updateDisplay();
  }
  // --- Initialisation des écouteurs ---
  themeSelect.addEventListener('change', updateThemeOptions);
  updateThemeOptions();
  ['flocons', 'coeurs', 'spiders'].forEach(type => {
    const input = $(`quantite_${type}`);
    const label = $(`val_quantite_${type}`);
    if (input && label)
      input.addEventListener('input', () => (label.textContent = input.value));
  });
  const resetBtn = $('reset-button');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetConfiguration);
  }
  // --- Réinitialisation de la configuration ---
function resetConfiguration() {
  if (currentSettings.theme) {
    themeSelect.value = currentSettings.theme;
  }
  Object.entries(currentSettings).forEach(([key, value]) => {
    const input = $(key);
    if (!input) return;
    if (input.type === 'checkbox') {
      input.checked = value === 'on';
    } else {
      input.value = value;
      const valLabel = $(`val_${key}`);
      if (valLabel) valLabel.textContent = value;
    }
  });
  updateThemeOptions();
  form.dataset.actionType = "reset";
  form.dispatchEvent(new Event('submit'));
}
async function updatePreview() {
  const iframe = document.getElementById('theme-preview');
  if (!iframe) return;
  const themeSelect = document.getElementById('theme-select');
  const selectedTheme = themeSelect.value;
  const themeData = rawThemes[selectedTheme];
  if (!themeData) return;
  // Attendre que l'iframe ait fini de charger
  await new Promise(resolve => {
    iframe.onload = () => resolve();
    iframe.src = iframe.src; // recharge l'iframe
  });
  // Maintenant on peut manipuler le document de l'iframe
  const doc = iframe.contentDocument || iframe.contentWindow.document;
  if (!doc) return;
  const body = doc.body;
  // Supprime les anciens fichiers de thème
  doc.querySelectorAll('link[data-theme], script[data-theme]').forEach(el => el.remove());
  // Construit les nouveaux fichiers à injecter
  const cssFiles = [];
  const jsFiles = [];
  const baseUrl = "/cgi-bin/koha/plugins/run.pl?class=Koha::Plugin::Celebrations&method=preview_theme_asset";
  Object.values(themeData.elements || {}).forEach(element => {
    const input = document.getElementById(element.setting);
    const isActive = input?.type === 'checkbox' ? input.checked : true;
    if (isActive && element.file) {
      cssFiles.push(`${baseUrl}&type=css&theme=${selectedTheme}&file=${element.file}`);
      jsFiles.push(`${baseUrl}&type=js&theme=${selectedTheme}&file=${element.file}`);
      if (element.extra_options) {
        Object.entries(element.extra_options).forEach(([optKey, optValue]) => {
          const extraInput = document.getElementById(optKey);
          const extraActive = extraInput?.type === 'checkbox' ? extraInput.checked : !!extraInput?.value;
          if (extraActive) {
            if (optValue.css) cssFiles.push(optValue.css);
            if (optValue.js) jsFiles.push(optValue.js);
          }
        });
      }
    }
  });
  console.log('cssFiles', cssFiles);
  // Injecte CSS
  const head = doc.head;
  cssFiles.forEach(href => {
    const link = doc.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.theme = selectedTheme;
    head.appendChild(link);
  });
  // Injecte JS
  const uniqueJsFiles = [...new Set(jsFiles)];
  uniqueJsFiles.forEach(src => {
    const inlineScript = doc.createElement('script');
    inlineScript.type = 'text/javascript';
    inlineScript.dataset.theme = selectedTheme;
    fetch(src)
      .then(res => res.text())
      .then(code => {
        inlineScript.textContent = code;
        body.appendChild(inlineScript);
        if (doc.readyState === 'complete' || doc.readyState === 'interactive') {
          const event = new Event('DOMContentLoaded', { bubbles: true, cancelable: true });
           doc.dispatchEvent(event); }
      })
      .catch(err => console.error('Erreur chargement JS inline:', err));
  });
}
    if (previewButton) {
    previewButton.addEventListener('click', (e) => {
      updatePreview();
    });
  }
});
// --- Décode les entités HTML encodées (TT/Perl) ---
function decodeHtml(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}
// SYSTÈME DE PRÉVISUALISATION
(function initDevicePreviewSwitcher() {
  'use strict';
  let iframe = null;
  let iframeContainer = null;
  let currentDevice = 'ordi';
  let isInitialized = false;
  // Crée un conteneur FIXE pour l'iframe qui ne bouge JAMAIS
  function createFixedIframeContainer() {
    if (iframeContainer) return iframeContainer;
    iframeContainer = document.createElement('div');
    iframeContainer.id = 'iframe-fixed-container';
    iframeContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
      display: none;
    `;
    document.body.appendChild(iframeContainer);
    return iframeContainer;
  }
  // Crée l'iframe UNE SEULE FOIS - elle ne sera JAMAIS rechargée
  function createIframe() {
    if (iframe) return iframe;
    createFixedIframeContainer();
    iframe = document.createElement('iframe');
    iframe.src = '/cgi-bin/koha/plugins/run.pl?class=Koha::Plugin::Celebrations&method=opac_preview';
    iframe.id = 'theme-preview';
    iframe.title = 'Aperçu du thème OPAC';
    iframe.frameBorder = '0';
    iframe.allowFullscreen = true;
    iframe.sandbox = 'allow-same-origin allow-scripts';
    iframe.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: 0;
      transform-origin: top left;
      pointer-events: auto;
    `;
    iframe.addEventListener('load', () => {
      isInitialized = true;
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        if (iframeDoc) {
          const script = iframeDoc.createElement('script');
          script.textContent = `
            document.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
            }, true);
            document.addEventListener('submit', (e) => {
              e.preventDefault();
              e.stopPropagation();
            }, true);
          `;
          iframeDoc.body.appendChild(script);
        }
      } catch (err) {
        console.warn("Impossible d'injecter le script dans l'iframe :", err);
      }
      // Premier positionnement
      positionIframe();
    });
    iframeContainer.appendChild(iframe);
    return iframe;
  }
  // Positionne l'iframe pour qu'elle s'aligne parfaitement avec le device visible
  function positionIframe() {
    if (!iframe || !isInitialized) return;
    const config = DEVICE_CONFIG[currentDevice];
    if (!config) return;
    const screenElement = document.querySelector(config.screen);
    if (!screenElement) return;
    const rect = screenElement.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    // Calculer le scale en fonction de la largeur du conteneur
    const scale = rect.width / config.baseWidth;
    // Positionner l'iframe exactement sur le screen du device
    iframeContainer.style.display = 'block';
    iframe.style.transform = `translate(${rect.left + scrollX}px, ${rect.top + scrollY}px) scale(${scale})`;
    iframe.style.width = `${config.baseWidth}px`;
    iframe.style.height = `${rect.height / scale}px`;
  }
  // Exposer la fonction globalement pour qu'elle soit accessible depuis updateThemeOptions
  window.positionIframeGlobal = positionIframe;
  // Change de device en repositionnant simplement l'iframe (AUCUN rechargement)
  function switchToDevice(deviceKey) {
    if (!DEVICE_CONFIG[deviceKey]) return;
    // Créer l'iframe si première fois
    if (!iframe) {
      createIframe();
    }
    // Masquer tous les devices
    Object.values(DEVICE_CONFIG).forEach(config => {
      const device = document.querySelector(config.container);
      if (device) device.style.display = 'none';
    });
    // Afficher le device sélectionné
    const activeDevice = document.querySelector(DEVICE_CONFIG[deviceKey].container);
    if (activeDevice) {
      activeDevice.style.display = 'block';
    }
    // Mettre à jour le device actuel
    currentDevice = deviceKey;
    // Repositionner l'iframe (animation fluide via CSS transition)
    requestAnimationFrame(() => {
      positionIframe();
    });
  }
  // Attacher les listeners sur les radios
  function initRadioListeners() {
    const radios = document.querySelectorAll('.radio-inputs input[type="radio"]');
    const deviceMap = ['ordi', 'tel', 'tablet'];
    radios.forEach((radio, index) => {
      radio.addEventListener('change', (e) => {
        if (e.target.checked) {
          switchToDevice(deviceMap[index]);
        }
      });
    });
  }
  // Initialisation
  function initialize() {
    // Supprimer toute iframe existante dans le HTML
    const existing = document.getElementById('theme-preview');
    if (existing) existing.remove();
    initRadioListeners();
    // Créer et afficher l'iframe sur ordi
    createIframe();
    switchToDevice('ordi');
    // Repositionner lors du scroll ou resize avec debounce optimisé
    let resizing = false;
    let resizeFrame;
    function updateDuringResize() {
      if (!resizing) return;
      positionIframe();
      requestAnimationFrame(updateDuringResize);
    }
    window.addEventListener('resize', () => {
      if (!resizing) {
        resizing = true;
        requestAnimationFrame(updateDuringResize);
      }
      clearTimeout(resizeFrame);
      resizeFrame = setTimeout(() => {
        resizing = false;
      }, 120); // Stoppe après 120 ms sans mouvement
    });
    // Scroll = repositionnement immédiat
    window.addEventListener('scroll', () => {
      requestAnimationFrame(() => positionIframe());
    });
    // Observer les changements de taille des devices (pour layout dynamique)
    if (window.ResizeObserver) {
      const resizeObserver = new ResizeObserver(() => {
        positionIframe();
      });
      Object.values(DEVICE_CONFIG).forEach(config => {
        const screen = document.querySelector(config.screen);
        if (screen) resizeObserver.observe(screen);
      });
    }
    // CRITIQUE : Observer les changements dans le formulaire (ajout/suppression d'options)
    const pluginCard = document.querySelector('.plugin-card');
    if (pluginCard && window.MutationObserver) {
      const mutationObserver = new MutationObserver(() => {
        // Repositionner immédiatement quand le DOM change
        requestAnimationFrame(() => {
          positionIframe();
        });
      });
      // Observer tous les changements dans le formulaire
      mutationObserver.observe(pluginCard, {
        childList: true,      // Détecte ajout/suppression d'éléments
        subtree: true,        // Observe tous les descendants
        attributes: true,     // Détecte les changements d'attributs (style, class)
        attributeFilter: ['style', 'class'] // Seulement style et class pour performance
      });
    }
    // Observer aussi les changements de thème dans le select
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
      themeSelect.addEventListener('change', () => {
        // Attendre que les options soient affichées/cachées
        setTimeout(() => {
          positionIframe();
        }, 100);
      });
    }
    // Observer tous les toggles/checkboxes qui peuvent changer la hauteur
    const allToggles = document.querySelectorAll('.plugin-card input[type="checkbox"]');
    allToggles.forEach(toggle => {
      toggle.addEventListener('change', () => {
        // Attendre l'animation d'affichage des options
        setTimeout(() => {
          positionIframe();
        }, 100);
      });
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();