import { Locale } from "@/lib/locale";
import { MAX_TEAM_MEMBERS, MIN_TEAM_MEMBERS } from "@/lib/game-types";

export type TeamFormErrors = {
  teamName?: string;
  members: Array<string | undefined>;
};

export function getEmptyTeamFormErrors(): TeamFormErrors {
  return {
    teamName: undefined,
    members: []
  };
}

function getTeamNameError(name: string, locale: Locale) {
  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return locale === "en" ? "Enter a team name." : "Renseigne un nom d'equipe.";
  }

  if (trimmed.length < 2) {
    return locale === "en" ? "Team name must contain at least 2 characters." : "Le nom d'equipe doit contenir au moins 2 caracteres.";
  }

  if (trimmed.length > 80) {
    return locale === "en" ? "Team name is too long." : "Le nom d'equipe est trop long.";
  }

  return undefined;
}

function getMemberError(name: string, index: number, locale: Locale) {
  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return locale === "en"
      ? `Enter participant ${index + 1}.`
      : `Renseigne le participant ${index + 1}.`;
  }

  if (trimmed.length < 2) {
    return locale === "en"
      ? `Participant ${index + 1} must contain at least 2 characters.`
      : `Le participant ${index + 1} doit contenir au moins 2 caracteres.`;
  }

  if (trimmed.length > 80) {
    return locale === "en"
      ? `Participant ${index + 1} is too long.`
      : `Le participant ${index + 1} est trop long.`;
  }

  return undefined;
}

export function validateTeamForm(teamName: string, members: string[], locale: Locale): TeamFormErrors {
  const memberErrors = members.map((member, index) => getMemberError(member, index, locale));

  if (members.length < MIN_TEAM_MEMBERS) {
    memberErrors.push(
      locale === "en"
        ? `At least ${MIN_TEAM_MEMBERS} participants are required.`
        : `Il faut au moins ${MIN_TEAM_MEMBERS} participants.`
    );
  }

  if (members.length > MAX_TEAM_MEMBERS) {
    return {
      teamName: getTeamNameError(teamName, locale),
      members: members.map((_, index) =>
        index === members.length - 1
          ? locale === "en"
            ? `No more than ${MAX_TEAM_MEMBERS} participants are allowed.`
            : `Pas plus de ${MAX_TEAM_MEMBERS} participants.`
          : undefined
      )
    };
  }

  return {
    teamName: getTeamNameError(teamName, locale),
    members: memberErrors
  };
}

export function hasTeamFormErrors(errors: TeamFormErrors) {
  return Boolean(errors.teamName) || errors.members.some(Boolean);
}
