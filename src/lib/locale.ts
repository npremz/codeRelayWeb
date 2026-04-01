export const SUPPORTED_LOCALES = ["fr", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "fr";
export const LOCALE_COOKIE_NAME = "code-relay-locale";
export const LOCALE_STORAGE_KEY = "code-relay-locale";
const LOCALE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export const messages = {
  fr: {
    language: {
      label: "Langue",
      switchLabel: "Changer de langue",
      fr: "FR",
      en: "EN"
    },
    appFrame: {
      menu: "Menu",
      openMenu: "Ouvrir le menu",
      closeMenu: "Fermer le menu"
    },
    nav: {
      home: "Accueil",
      register: "Inscription",
      brief: "Brief",
      results: "Résultats",
      staff: "Staff",
      admin: "Admin",
      judge: "Jury",
      tv: "TV"
    },
    home: {
      title: "Code Relay",
      subtitle: "Tournoi de programmation en relais",
      quickAccess: "Accès rapide",
      screens: {
        register: {
          label: "Inscription",
          description: "Créer une équipe en quelques secondes"
        },
        brief: {
          label: "Brief",
          description: "Consulter l'énoncé public et le fichier attendu"
        },
        results: {
          label: "Résultats",
          description: "Classement public avec tie-break"
        }
      },
      heroSummary: "2 à 4 joueurs · 5 min de réflexion · Relais de 2 min · Silence total au clavier",
      stats: {
        teams: "Équipes",
        players: "Joueurs",
        registration: "Inscrip."
      },
      rulesTitle: "Règles du jeu",
      rules: [
        "5 min de réflexion collective avant le 1er passage",
        "Relais de 2 min par joueur, ordre fixe selon la composition de l'équipe",
        "Aucune communication pendant le tour au clavier",
        "Notes papier autorisées, rien d'autre"
      ],
      scoringTitle: "Barème / 100",
      scoring: {
        correction: "Correction",
        edgeCases: "Edge cases",
        complexity: "Complexité",
        readabilityAndSpeed: "Lisib. + Rapidité"
      }
    },
    register: {
      title: "Inscription",
      subtitle: "Enregistrement des équipes",
      checkIn: "Check-in",
      createTeam: "Créer une équipe",
      teamName: "Nom de l'équipe",
      players: "Joueurs",
      remove: "- Retirer",
      add: "+ Ajouter",
      membersHint: "Entre {min} et {max} joueurs par équipe.",
      registrationOpen: "Inscriptions ouvertes",
      registrationClosed: "Inscriptions fermées",
      noLoginInfo: "Sans login : on génère un code équipe public et un token secret d'édition mémorisé sur cet appareil.",
      submitCreating: "Création...",
      submitCreate: "Inscrire l'équipe",
      submitClosed: "Inscriptions fermées",
      successEyebrow: "Équipe créée",
      codeLabel: "Code",
      manage: "Gérer",
      tokenStored: "Le token secret est stocké sur cet appareil. Le lien de gestion reste accessible ci-dessous.",
      myAccessEyebrow: "Mes accès",
      myAccessTitle: "Liens de gestion",
      noAccess: "Aucun accès mémorisé sur cet appareil pour le moment.",
      open: "Ouvrir",
      tournamentEyebrow: "Tournoi",
      teamsTitle: "Équipes inscrites",
      noTeams: "Aucune équipe enregistrée pour le moment.",
      locked: "Verrouillée",
      editable: "Éditable",
      rulesEyebrow: "Règlement",
      rulesTitle: "Rappel des règles",
      rules: [
        "5 min de réflexion collective avant le premier passage clavier.",
        "Relais de 2 min par joueur selon un ordre fixe A, B, C.",
        "Aucune communication avec le joueur au clavier pendant son tour.",
        "Le code équipe est public. Le lien d'édition est secret et propre à l'équipe."
      ],
      createdAtLabel: "{teamCode} · {date}"
    },
    manage: {
      title: "Gestion équipe",
      subtitle: "Modifier la composition de votre équipe",
      secureAccess: "Accès sécurisé",
      loading: "Chargement de l'équipe...",
      teamCode: "Code équipe",
      station: "Station",
      status: "État",
      locked: "Verrouillée",
      editable: "Éditable",
      lastUpdate: "Dernière mise à jour",
      rosterTitle: "Composition actuelle",
      relayLabel: "Relais {order}",
      lockedWarning: "Cette équipe est verrouillée par l'organisateur. Les modifications ne sont plus possibles.",
      editEyebrow: "Édition",
      editTitle: "Modifier l'équipe",
      teamName: "Nom de l'équipe",
      players: "Joueurs",
      remove: "- Retirer",
      add: "+ Ajouter",
      participantPlaceholder: "Participant {index}",
      membersHint: "Entre {min} et {max} joueurs par équipe.",
      relayInfo: "L'ordre des relais suit la composition actuelle de l'équipe. Modifiez les noms pour réorganiser les rôles.",
      saving: "Enregistrement...",
      lockedButton: "Équipe verrouillée",
      save: "Sauvegarder les modifications",
      updated: "Équipe mise à jour."
    },
    results: {
      title: "Résultats",
      subtitle: "Classement public du tournoi",
      finalTitle: "Classement Final",
      provisionalTitle: "Classement Provisoire",
      finalDescription: "Résultats définitifs sur score cumulé",
      provisionalDescription: "Les scores cumulés peuvent encore évoluer",
      phase: "Phase",
      teams: "Équipes",
      status: "Statut",
      frozen: "Figé",
      live: "Live",
      rankingTitle: "Classement Officiel",
      runningTitle: "Classement en cours",
      tieBreakEyebrow: "Départage",
      tieBreakTitle: "Explication du classement",
      tieBreakDescription: "Le classement est cumulé entre les manches. En cas d'égalité au total, le départage se fait sur la manche courante : correction, edge cases, complexité, puis ordre de soumission.",
      noTieBreak: "Aucun départage actif. Chaque équipe a un total distinct.",
      aheadOf: "devant",
      legendEyebrow: "Légende",
      legendTitle: "Lire le tuple de départage",
      legendTotal: "Le score affiché est le total cumulé sur toutes les manches jouées",
      legendCorrection: "Note de correction sur 40",
      legendEdgeCases: "Note edge cases sur 20",
      legendComplexity: "Note complexité sur 20",
      legendSubmissionOrder: "Ordre de soumission (plus petit = meilleur)"
    },
    brief: {
      title: "Brief",
      subtitle: "Sujet public de la manche courante",
      fullSubject: "Sujet Complet",
      currentSubject: "Sujet en cours",
      pendingSubject: "Sujet en attente",
      statement: "Énoncé",
      missingSummary: "Le résumé du sujet n'est pas encore renseigné.",
      expectedFile: "Fichier attendu",
      expectedFunction: "Fonction attendue",
      expectedOutput: "Sortie attendue",
      inputs: "Entrées",
      receivedParameters: "Paramètres reçus",
      constraints: "Contraintes",
      examples: "Exemples",
      exampleCases: "Cas illustratifs",
      explanation: "Explication",
      noSubject: "Aucun sujet n'est encore publié pour la manche courante.",
      round: "Manche",
      currentRound: "Manche courante",
      phase: "Phase",
      teams: "Équipes",
      registration: "Inscriptions",
      open: "Ouvertes",
      closed: "Fermées",
      signature: "Signature",
      pythonPrototype: "Prototype Python"
    },
    staff: {
      title: "Accès Staff",
      subtitle: "Connexion sécurisée pour organisateurs et jury",
      heading: "Connexion Staff",
      headingDescription: "Entrez votre code d'accès pour continuer",
      adminLabel: "Organisateur",
      adminHint: "Accès au tableau de pilotage complet du tournoi",
      judgeLabel: "Jury",
      judgeHint: "Accès au cockpit de notation des équipes",
      redirect: "Redirection après connexion",
      accessCode: "Code d'accès",
      codePlaceholder: "Entrez le code...",
      signIn: "Se connecter",
      signingIn: "Connexion...",
      signOut: "Déconnexion",
      signedOut: "Session staff fermée.",
      accessLevels: "Niveaux d'accès",
      participantsAccess: "Participants",
      participantsHint: "sans login, code équipe public + token secret",
      adminAccess: "Admin",
      adminAccessHint: "contrôle total du tournoi et des manches",
      judgeAccess: "Jury",
      judgeAccessHint: "notation et cockpit de correction"
    },
    tv: {
      registrationTag: "Inscriptions",
      createTeam: "Créez votre équipe",
      registrationDescription: "Scannez le QR code pour ouvrir le formulaire d'inscription et enregistrer votre équipe avant le début du jeu.",
      prerequisites: "Pré-requis",
      prerequisitesDescription: "Tous les participants créent leur équipe avant toute autre action.",
      directLink: "Lien direct",
      scanToRegister: "Scannez ici pour inscrire votre équipe",
      briefTag: "Brief TV",
      roundBrief: "Brief de la manche",
      timeRemaining: "Temps restant",
      fileName: "Nom du fichier",
      noFile: "Aucun fichier défini",
      fullDetails: "Détails complets",
      scanToOpenBrief: "Scannez pour ouvrir le brief complet.",
      leaderboardTag: "Code Relay · Classement",
      leaderboardTitle: "Classement TV",
      currentLeader: "Leader Actuel",
      totalPoints: "points cumulés",
      carryOver: "{carry} reportés + {round} sur cette manche",
      waiting: "En attente",
      liveLeaderboard: "Classement Live",
      waitingFirstTeam: "En attente de la première équipe",
      teamsCount: "{count} équipes"
    },
    ranking: {
      title: "Classement",
      eyebrow: "Leaderboard",
      empty: "Aucune équipe classée pour le moment",
      team: "Équipe",
      status: "Statut",
      activePlayer: "Joueur actif",
      total: "Total",
      carryOver: "{carry} reportés + {round} sur cette manche",
      submittedOrder: "Soumise #{order}"
    }
  },
  en: {
    language: {
      label: "Language",
      switchLabel: "Change language",
      fr: "FR",
      en: "EN"
    },
    appFrame: {
      menu: "Menu",
      openMenu: "Open menu",
      closeMenu: "Close menu"
    },
    nav: {
      home: "Home",
      register: "Register",
      brief: "Brief",
      results: "Results",
      staff: "Staff",
      admin: "Admin",
      judge: "Judge",
      tv: "TV"
    },
    home: {
      title: "Code Relay",
      subtitle: "Relay programming tournament",
      quickAccess: "Quick access",
      screens: {
        register: {
          label: "Register",
          description: "Create a team in a few seconds"
        },
        brief: {
          label: "Brief",
          description: "Read the public prompt and expected file"
        },
        results: {
          label: "Results",
          description: "Public ranking with tie-break"
        }
      },
      heroSummary: "2 to 4 players · 5 min strategy time · 2 min relay turns · Complete silence at the keyboard",
      stats: {
        teams: "Teams",
        players: "Players",
        registration: "Reg."
      },
      rulesTitle: "Game rules",
      rules: [
        "5 minutes of team discussion before the first keyboard turn",
        "2-minute relay turn per player, with a fixed order based on the team lineup",
        "No communication while the active player is at the keyboard",
        "Paper notes allowed, nothing else"
      ],
      scoringTitle: "Scoring / 100",
      scoring: {
        correction: "Correctness",
        edgeCases: "Edge cases",
        complexity: "Complexity",
        readabilityAndSpeed: "Readability + Speed"
      }
    },
    register: {
      title: "Register",
      subtitle: "Team registration",
      checkIn: "Check-in",
      createTeam: "Create a team",
      teamName: "Team name",
      players: "Players",
      remove: "- Remove",
      add: "+ Add",
      membersHint: "Between {min} and {max} players per team.",
      registrationOpen: "Registration open",
      registrationClosed: "Registration closed",
      noLoginInfo: "No login required: a public team code and a secret edit token are generated and stored on this device.",
      submitCreating: "Creating...",
      submitCreate: "Register team",
      submitClosed: "Registration closed",
      successEyebrow: "Team created",
      codeLabel: "Code",
      manage: "Manage",
      tokenStored: "The secret token is stored on this device. The management link remains available below.",
      myAccessEyebrow: "My access",
      myAccessTitle: "Management links",
      noAccess: "No access is currently stored on this device.",
      open: "Open",
      tournamentEyebrow: "Tournament",
      teamsTitle: "Registered teams",
      noTeams: "No team has been registered yet.",
      locked: "Locked",
      editable: "Editable",
      rulesEyebrow: "Rules",
      rulesTitle: "Rules reminder",
      rules: [
        "5 minutes of team discussion before the first keyboard turn.",
        "2-minute relay turn per player in a fixed A, B, C order.",
        "No communication with the active keyboard player during their turn.",
        "The team code is public. The edit link is secret and specific to the team."
      ],
      createdAtLabel: "{teamCode} · {date}"
    },
    manage: {
      title: "Team management",
      subtitle: "Edit your team lineup",
      secureAccess: "Secure access",
      loading: "Loading team...",
      teamCode: "Team code",
      station: "Station",
      status: "Status",
      locked: "Locked",
      editable: "Editable",
      lastUpdate: "Last update",
      rosterTitle: "Current lineup",
      relayLabel: "Relay {order}",
      lockedWarning: "This team has been locked by the organizer. Changes are no longer allowed.",
      editEyebrow: "Edit",
      editTitle: "Edit team",
      teamName: "Team name",
      players: "Players",
      remove: "- Remove",
      add: "+ Add",
      participantPlaceholder: "Participant {index}",
      membersHint: "Between {min} and {max} players per team.",
      relayInfo: "Relay order follows the current team lineup. Rename players to reorganize roles.",
      saving: "Saving...",
      lockedButton: "Team locked",
      save: "Save changes",
      updated: "Team updated."
    },
    results: {
      title: "Results",
      subtitle: "Public tournament ranking",
      finalTitle: "Final Ranking",
      provisionalTitle: "Live Ranking",
      finalDescription: "Final results based on cumulative score",
      provisionalDescription: "Cumulative scores may still change",
      phase: "Phase",
      teams: "Teams",
      status: "Status",
      frozen: "Frozen",
      live: "Live",
      rankingTitle: "Official Ranking",
      runningTitle: "Current Ranking",
      tieBreakEyebrow: "Tie-break",
      tieBreakTitle: "How the ranking works",
      tieBreakDescription: "The ranking is cumulative across rounds. If teams are tied overall, the current round breaks the tie: correctness, edge cases, complexity, then submission order.",
      noTieBreak: "No active tie-break. Every team has a distinct total score.",
      aheadOf: "ahead of",
      legendEyebrow: "Legend",
      legendTitle: "Reading the tie-break tuple",
      legendTotal: "The displayed score is the cumulative total across all played rounds",
      legendCorrection: "Correctness score out of 40",
      legendEdgeCases: "Edge cases score out of 20",
      legendComplexity: "Complexity score out of 20",
      legendSubmissionOrder: "Submission order (lower is better)"
    },
    brief: {
      title: "Brief",
      subtitle: "Public prompt for the current round",
      fullSubject: "Full Subject",
      currentSubject: "Current subject",
      pendingSubject: "Subject pending",
      statement: "Problem statement",
      missingSummary: "The subject summary has not been filled in yet.",
      expectedFile: "Expected file",
      expectedFunction: "Expected function",
      expectedOutput: "Expected output",
      inputs: "Inputs",
      receivedParameters: "Received parameters",
      constraints: "Constraints",
      examples: "Examples",
      exampleCases: "Illustrative cases",
      explanation: "Explanation",
      noSubject: "No subject has been published for the current round yet.",
      round: "Round",
      currentRound: "Current round",
      phase: "Phase",
      teams: "Teams",
      registration: "Registration",
      open: "Open",
      closed: "Closed",
      signature: "Signature",
      pythonPrototype: "Python prototype"
    },
    staff: {
      title: "Staff Access",
      subtitle: "Secure sign-in for organizers and judges",
      heading: "Staff Sign-in",
      headingDescription: "Enter your access code to continue",
      adminLabel: "Organizer",
      adminHint: "Access to the full tournament control room",
      judgeLabel: "Judge",
      judgeHint: "Access to the team scoring cockpit",
      redirect: "Redirect after sign-in",
      accessCode: "Access code",
      codePlaceholder: "Enter the code...",
      signIn: "Sign in",
      signingIn: "Signing in...",
      signOut: "Sign out",
      signedOut: "Staff session closed.",
      accessLevels: "Access levels",
      participantsAccess: "Participants",
      participantsHint: "no login, public team code + secret token",
      adminAccess: "Admin",
      adminAccessHint: "full tournament and round control",
      judgeAccess: "Judge",
      judgeAccessHint: "scoring and judging cockpit"
    },
    tv: {
      registrationTag: "Registration",
      createTeam: "Create your team",
      registrationDescription: "Scan the QR code to open the registration form and register your team before the game starts.",
      prerequisites: "Requirements",
      prerequisitesDescription: "All participants must create their team before any other action.",
      directLink: "Direct link",
      scanToRegister: "Scan here to register your team",
      briefTag: "Brief TV",
      roundBrief: "Round brief",
      timeRemaining: "Time remaining",
      fileName: "File name",
      noFile: "No file defined",
      fullDetails: "Full details",
      scanToOpenBrief: "Scan to open the full brief.",
      leaderboardTag: "Code Relay · Ranking",
      leaderboardTitle: "TV Ranking",
      currentLeader: "Current leader",
      totalPoints: "cumulative points",
      carryOver: "{carry} carried over + {round} this round",
      waiting: "Waiting",
      liveLeaderboard: "Live ranking",
      waitingFirstTeam: "Waiting for the first team",
      teamsCount: "{count} teams"
    },
    ranking: {
      title: "Ranking",
      eyebrow: "Leaderboard",
      empty: "No team is ranked yet",
      team: "Team",
      status: "Status",
      activePlayer: "Active player",
      total: "Total",
      carryOver: "{carry} carried over + {round} this round",
      submittedOrder: "Submitted #{order}"
    }
  }
} as const;

export type Messages = (typeof messages)[Locale];

export function normalizeLocale(value: string | null | undefined): Locale | null {
  if (!value) {
    return null;
  }

  const normalized = value.toLowerCase().trim();

  if (normalized === "fr" || normalized.startsWith("fr-")) {
    return "fr";
  }

  if (normalized === "en" || normalized.startsWith("en-")) {
    return "en";
  }

  return null;
}

export function getMessages(locale: Locale): Messages {
  return messages[locale];
}

export function getDateTimeLocale(locale: Locale) {
  return locale === "en" ? "en-US" : "fr-BE";
}

export function formatCopy(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_match, key) => String(values[key] ?? ""));
}

export function getStoredLocale(): Locale | null {
  if (typeof window === "undefined") {
    return null;
  }

  return normalizeLocale(window.localStorage.getItem(LOCALE_STORAGE_KEY));
}

export function getBrowserLocale(): Locale | null {
  if (typeof navigator === "undefined") {
    return null;
  }

  for (const value of navigator.languages) {
    const locale = normalizeLocale(value);
    if (locale) {
      return locale;
    }
  }

  return normalizeLocale(navigator.language);
}

export function persistLocale(locale: Locale) {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=${LOCALE_MAX_AGE_SECONDS}; samesite=lax`;
  document.documentElement.lang = locale;
}

export function withLocaleQuery(url: string, locale: Locale) {
  if (locale === DEFAULT_LOCALE) {
    return url;
  }

  try {
    const nextUrl = new URL(url);
    nextUrl.searchParams.set("lang", locale);
    return nextUrl.toString();
  } catch {
    const [base, queryString = ""] = url.split("?");
    const searchParams = new URLSearchParams(queryString);
    searchParams.set("lang", locale);
    const query = searchParams.toString();
    return query ? `${base}?${query}` : base;
  }
}

export function translatePublicErrorMessage(message: string, locale: Locale) {
  if (locale === "fr") {
    return message;
  }

  if (message === "Impossible de creer l'equipe.") {
    return "Unable to create the team.";
  }

  if (message === "Le nom d'equipe doit contenir au moins 2 caracteres.") {
    return "The team name must be at least 2 characters long.";
  }

  const membersMatch = message.match(/^Il faut entre (\d+) et (\d+) membres avec un nom valide\.$/);
  if (membersMatch) {
    return `You need between ${membersMatch[1]} and ${membersMatch[2]} members with valid names.`;
  }

  if (message === "Les inscriptions sont fermees.") {
    return "Registration is closed.";
  }

  if (message === "Impossible de generer un code equipe unique.") {
    return "Unable to generate a unique team code.";
  }

  if (message === "Equipe introuvable.") {
    return "Team not found.";
  }

  if (message === "Token invalide.") {
    return "Invalid token.";
  }

  if (message === "Token manquant.") {
    return "Missing token.";
  }

  if (message === "Acces refuse.") {
    return "Access denied.";
  }

  if (message === "Cette equipe est verrouillee.") {
    return "This team is locked.";
  }

  if (message === "Impossible de modifier l'equipe.") {
    return "Unable to update the team.";
  }

  if (message === "Role invalide.") {
    return "Invalid role.";
  }

  if (message === "Code d'acces invalide.") {
    return "Invalid access code.";
  }

  if (message === "Connexion staff impossible.") {
    return "Unable to sign in to staff.";
  }

  if (message === "Impossible de fermer la session.") {
    return "Unable to close the session.";
  }

  return message;
}
