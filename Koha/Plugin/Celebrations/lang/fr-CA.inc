[%
  # T: Chaînes de caractères utilisées dans l'interface de configuration du plugin.
  T = {
    #
    # === text générale ===
    #
    extension = "Cette extension a été créée par ",
    lang = "fr",
    site_web1 = "Visitez notre",
    site_web2 = "site web",
    site_web3 = " pour plus d'extensions Koha",
    documentation1 = "Pour les instructions d'installation et d'utilisation, veuillez consulter notre",
    documentation2 = "documentation de L'extension"
    title = "Extension Célébrations",
    description1 = "Cette extension vous permet d’ajouter des thèmes saisonniers à l’OPAC de Koha, comme Noël, Halloween ou la Saint-Valentin.",
    description2 = "Vous pouvez également personnaliser certains effets visuels pour chaque thème actif.",
    select_theme = "Sélectionnez un thème à configurer",
    txtConf = "Configuration du thème : ",
    apply_button = "Sauvegarder",
    reset_button = "Réinitialiser",
    preview_button = "prévisualiser",
    cancel = "anuler",
    apply_success = "✅ Thème appliqué avec succès !",
    reset_success = "Thème restauré avec succès !",
    apply_error = "❌ Une erreur est survenue lors de l’application du thème. :(",
    previs = "Prévisualisation du thème",
    ordi = "Ordinateur",
    tablet = "Tablette",
    tel = "Téléphone",
    #
    # === Thèmes programmées ===
    #
    prog = {
        titre = "Thèmes programmés",
        message1 = "Aucun thème programmé pour le moment.",
        message2 = "Programmez votre premier thème ci-dessous!",
        debut = "Début",
        fin = "Fin",
        prog = "Progression",
        btn1 = "Modifier",
        btn2 = "Spprimer"
    }
    #
    # === Nom des themes disponible ===
    #
    form = {
      theme_label = "Thème :",
      no_theme = "Aucun",
      noel = "Noël",
      halloween = "Halloween",
      "saint-valentin" = "Saint-Valentin",
      paque = "Pâques",
      "feux-artifice" = "Feux d’artifice",
      debut = "Date de début :",
      fin = "Date de fin :"
    },
    #
    # === Grille de thème programmé (envoyé au fichier js) ===
    #
    grille = {
        prog = "Progression",
        actif = "actif",
        nonActif = "Thème non actif",
        modif = "modifier",
        sup = "suppriomer"
        debut = "début",
        fin = "fin",
        delete1 = "Êtes-vous sûr de vouloir supprimer le thème",
        delete2 = "Cette action est irréversible.",
        delNotif1 = "Thème supprimé avec succès",
        delNotif2 = "Erreur lors de la suppression"
    },
    #
    # === configuration du theme noel ===
    #
    noel = {
        couleur_noel = "Activer les couleurs de Noël 🔴 🟢 ⚪",
         footer_noel = "Activer les éléments du pied de page ✨",
        activation_flocons = "Activer l’effet de neige ❄️",
        vitesse_flocons = "Vitesse des flocons :",
        taille_flocons = "Taille des flocons :",
        vent_flocons = "Vent :",
        quantite_flocons = "Quantité :",
        countdown_noel = "compte à rebours 🕛",
    },
    #
    # === configuration du theme saint-valentin ===
    #
    "saint-valentin" = {
        couleur_valentin = "Activer les couleurs de la Saint-Valentin ⚪ 🩷 ⚪",
        activation_coeurs = "Activer l’effet de cœurs ❤️",
        vitesse_coeurs = "Vitesse des cœurs :",
        taille_coeurs = "Taille des cœurs :",
        vent_coeurs = "Vent :",
        quantite_coeurs = "Quantité :",
    },
    #
    # === configuration du theme halloween ===
    #
    halloween = {
        couleur_halloween = "Activer les couleurs d’Halloween 🟠 ⚫",
        footer_halloween = "Activer les éléments du pied de page 🎃",
        activation_spiders = "Activer l’effet d’araignées 🕷️",
        quantite_spiders = "Nombre d’araignées :",
        activation_ghost = "Activer le curseur fantôme 👻 (visible uniquement sur ordinateur)",
    },
    #
    # === configuration du theme paque ===
    #
    paque = {
        couleur_paque = "Activer les couleurs de Pâques 🟡 🟢 🟣",
        footer_paque = "Activer les éléments du pied de page 🧺🥚",
        activation_eggs = "Activer le curseur d’œufs 🥚 (visible uniquement sur ordinateur)",
    },
    #
    # === configuration du theme feux-artifice ===
    #
    "feux-artifice" = {
        couleur_feux = "Activer les couleurs des feux d’artifice 🟣 ⚫ 🟢",
        animation_feux = "Activer l’animation de feux d’artifice 🎆",
    },
    #
    # === configuration des option de vitesse ===
    #
    option_vitesse = [
        { key = "vitesse_lent", label = "Lent" },
        { key = "vitesse_normale", label = "Normal" },
        { key = "vitesse_rapide", label = "Rapide" },
    ],
    #
    # === configuration des option de taille ===
    #
    option_taille = [
         { key = "taille_petit", label = "Petit" },
         { key = "taille_normale", label = "Normal" },
         { key = "taille_grand", label = "Grand" },
    ],
    #
    # === configuration des option de vent ===
    #
    option_vent = [
        { key = "vent_null", label = "Aucun" },
        { key = "vent_normale", label = "Normal" },
        { key = "vent_fort", label = "Fort" },
    ]
  },
  # D: Chaînes de caractères affichées lorsque le plugin est DÉSACTIVÉ.
   D = {
    titre = "Bienvenue dans le plugin Celebration !",
    description1 = "Les fêtes et célébrations sont là pour nous rappeler qu’il faut ",
    description2 = "prendre le temps de sourire",
    description3 = ", partager des moments joyeux et ajouter une touche de couleur à nos journées ✨.",
    description4 = "Mais attends !",
    description5 = "Ce plugin est actuellement",
    description6 = "désactivé.",
    description7 = "Pour accéder à sa configuration et profiter de toutes ses fonctionnalités, retourne sur la page des plugins et",
    description8 = "active Celebration.",
    btn_back = "← Retour à la page des plugins"
  }
%]
