[%
  # T: Chaînes de caractères utilisées dans l'interface de configuration du plugin.
  T = {
    #
    # === text générale ===
    #
    extension = "This extension was created by",
    lang = "en",
    site_web1 = "Visit our",
    site_web2 = "Website",
    site_web3 = " for more Koha extensions",
    documentation1 = "For setup and usage instructions, please visit our",
    documentation2 = "plugin documentation",
    title = "Celebrations Plugin",
    titreD = "Welcome to the Celebration plugin!",
    description1 = "This plugin allows you to add seasonal themes to Koha's OPAC, such as Christmas, Halloween, or Valentine's Day.",
    description2 = "You can also customize some visual effects for each active theme.",
    select_theme = "Select a theme to configure",
    txtConf = "Theme Configuration: ",
    apply_button = "save Theme",
    reset_button = "Reset",
    preview_button = "preview",
    cancel = "cancel",
    apply_success = "✅ Theme applied successfully !",
    reset_success = "Theme reset successfully!",
    apply_error = "❌ An error occurred while applying the theme. :(",
    previs = "Theme preview",
    ordi = "Computer",
    tablet = "Tablet",
    tel = "Phone",
    #
    # === Thèmes programmées ===
    #
    prog = {
        titre = "Scheduled Themes",
        message1 = "No theme scheduled for the moment.",
        message2 = "Schedule your first theme below!",
        debut = "Start",
        fin = "End",
        prog = "Progress",
        btn1 = "Edit",
        btn2 = "Delete"
    }
    #
    # === Nom des themes disponible ===
    #
    form = {
      theme_label = "Theme:",
      no_theme = "None",
      noel = "Christmas",
      halloween = "Halloween",
      "saint-valentin" = "Valentine\'s Day",
      paque = "Easter",
      "feux-artifice" = "Fireworks",
      debut = "Start Date:",
      fin = "End Date:"
    },
    #
    # === Grille de thème programmé (envoyé au fichier js) ===
    #
    grille = {
        prog = "Progress",
        actif = "active",
        nonActif = "Inactive Theme",
        modif = "edit",
        sup = "delete",
        debut = "Start :",
        fin = "End :",
        delete1 = "Are you sure you want to delete the theme",
        delete2 = "This action is irreversible.",
        delNotif1 = "Theme successfully deleted",
        delNotif2 = "Error during deletion"
    },
    #
    # === configuration du theme noel ===
    #
    noel = {
        couleur_noel = "Enable Christmas Color 🔴 🟢 ⚪",
        footer_noel = "Enable Footer elements ✨",
        activation_flocons = "Enable snow effect ❄️",
        vitesse_flocons = "Snow speed:",
        taille_flocons = "Flake size:",
        vent_flocons = "Wind:",
        quantite_flocons = "Quantity:",
        countdown_noel = "CountDown 🕛",
    },
    #
    # === configuration du theme saint-valentin ===
    #
    "saint-valentin" = {
        couleur_valentin = "Enable Valentine Color ⚪ 🩷 ⚪",
        activation_coeurs = "Enable heart effect ❤️",
        vitesse_coeurs = "Heart speed:",
        taille_coeurs = "Heart size:",
        vent_coeurs = "Wind:",
        quantite_coeurs = "Quantity:",
    },
    #
    # === configuration du theme halloween ===
    #
    halloween = {
        couleur_halloween = "Enable Halloween Color 🟠 ⚫",
        footer_halloween = "Enable Footer elements 🎃",
        activation_spiders = "Enable spider effect 🕷️",
        quantite_spiders = "Number of spiders:",
        activation_ghost = "Enable ghost cursor 👻 (visible only on desktop)",
    },
    #
    # === configuration du theme paque ===
    #
    paque = {
        couleur_paque = "Enable Easter Color 🟡 🟢 🟣",
        footer_paque = "Enable Footer elements 🧺🥚",
        activation_eggs = "Enable eggs cursor 🥚 (visible only on desktop)",
    },
    #
    # === configuration du theme feux-artifice ===
    #
    "feux-artifice" = {
        couleur_feux = "Enable fire work Color 🟣 ⚫ 🟢",
        animation_feux = "Enable fire work animation 🎆",
    },
    #
    # === configuration des option de vitesse ===
    #
    option_vitesse = [
        { key = "vitesse_lent", label = "Slow" },
        { key = "vitesse_normale", label = "Normal" },
        { key = "vitesse_rapide", label = "Fast" },
    ],
    #
    # === configuration des option de taille ===
    #
    option_taille = [
        { key = "taille_petit", label = "Small" },
        { key = "taille_normale", label = "Normal" },
        { key = "taille_grand", label = "Big" },
    ],
    #
    # === configuration des option de vent ===
    #
    option_vent = [
        { key = "vent_null", label = "None" },
        { key = "vent_normale", label = "Normal" },
        { key = "vent_fort", label = "A lot" },
    ]
  },
   # D: Chaînes de caractères affichées lorsque le plugin est DÉSACTIVÉ.
   D = {
    titre = "Welcome to the Celebration plugin!",
    description1 = "Holidays and celebrations are here to remind us to",
    description2 = "take time to smile",
    description3 = ", share joyful moments, and add a splash of color to our days ✨.",
    description4 = "But wait!",
    description5 = "This plugin is currently",
    description6 = "disabled.",
    description7 = "To access its configuration and enjoy all its features, please return to the plugins page and",
    description8 = "enable Celebration.",
    btn_back = "← Back to plugins page"
  },
  # Backend_messages: Chaîne de caractères retourné par le backend
  B = {
    date_error_required = "Start and end dates are required",
    date_error_invalid = "Invalid date format",
    date_error_order = "The start date must be before the end date",
    theme_updated = "Theme updated successfully",
    theme_applied = "Theme configured successfully",
    theme_deleted = "Theme deleted successfully"
    theme_not_found = "Theme not found",
    theme_conflict = "The selected period conflicts with another theme"
  }
%]

