document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);
  const themeSelect = $('theme-select');
  const form = $('theme-form');
  const successMessage = $('success-message');
  const erreurMessage = $('erreur-message');
  // --- Lecture sécurisée du JSON ---
  let rawThemes = {};
  try {
    const decodedJsonStr = decodeHtml(THEMES_CONFIG_STR);
    rawThemes = JSON.parse(decodedJsonStr);
  } catch (e) {
    console.error("THEMES_CONFIG_STR non défini ou JSON invalide :", e);
  }
  // --- Soumission du formulaire ---
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const selectedTheme = themeSelect.value;
    const themeData = rawThemes[selectedTheme];
    if (!themeData || !themeData.elements) {
      console.error(`Données manquantes pour le thème "${selectedTheme}"`);
      return;
    }
    const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.cursor = 'not-allowed';
    }
    const formData = new FormData();
    formData.append('plugin_name', 'Celebrations');
    formData.append('class', 'Koha::Plugin::Celebrations');
    formData.append('method', 'apply_theme');
    formData.append('action', 'apply_theme');
    formData.append('theme', selectedTheme);
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
    // Envoi au serveur
    try {
      const response = await fetch(
        '/cgi-bin/koha/plugins/run.pl?Koha::Plugin::Celebrations&method=apply_theme',
        { method: 'POST', body: formData,  credentials: 'same-origin' }
      );
      const msg = response.ok ? successMessage : erreurMessage;
      msg.style.display = 'block';
      setTimeout(() => {
        msg.style.display = 'none';
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.style.cursor = 'pointer';
        }
      }, 3000);
    } catch (error) {
      console.error(error);
      erreurMessage.style.display = 'block';
      setTimeout(() => {
        erreurMessage.style.display = 'none';
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.style.cursor = 'pointer';
        }
      }, 3000);
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
            // Utiliser la clé de l'élément pour construire l'ID du div conteneur (ex: 'spider-config')
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
            el.style.display = 'block';
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
  }
  // --- Gère l’affichage des sous-options liées à une case à cocher ---
  function toggleConfig(mainToggle, configDiv, themeName) {
    if (!mainToggle || !configDiv) return;
    const updateDisplay = () => {
      const isChecked = mainToggle.type === 'checkbox' ? mainToggle.checked : true;
      configDiv.style.display =
        themeSelect.value === themeName && isChecked ? 'block' : 'none';
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
});
// --- Décode les entités HTML encodées (TT/Perl) ---
function decodeHtml(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}
