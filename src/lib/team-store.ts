import "server-only";

import { createHash, randomBytes } from "node:crypto";
import {
  Prisma,
  Round as PrismaRound,
  RoundPhase as PrismaRoundPhase,
  Team as PrismaTeam,
  TeamStatus as PrismaTeamStatus
} from "@prisma/client";
import { canAdminMarkSubmission, canRunAdminRoundAction, defaultRoundState } from "@/lib/demo-game";
import { prisma } from "@/lib/prisma";
import {
  AdminAssignSubjectInput,
  AdminCreateRoundInput,
  AdminResetEventInput,
  AdminRoundAction,
  AdminSelectRoundInput,
  MAX_TEAM_MEMBERS,
  MIN_TEAM_MEMBERS,
  PublicTeam,
  RoundControlState,
  RoundSubject,
  RoundSummary,
  TeamCreateInput,
  TeamCreateResponse,
  TeamScoreInput,
  TeamStatus,
  TeamUpdateInput
} from "@/lib/game-types";
import { getPublicSubjectById } from "@/lib/subject-catalog";

const TEAM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const ROUND_ENTRY_INCLUDE = {
  team: {
    include: {
      members: {
        orderBy: {
          relayOrder: "asc"
        }
      }
    }
  },
  score: true
} satisfies Prisma.RoundEntryInclude;

const ROUND_WITH_COUNT_INCLUDE = {
  _count: {
    select: {
      entries: true
    }
  }
} satisfies Prisma.RoundInclude;

type RoundEntryWithRelations = Prisma.RoundEntryGetPayload<{
  include: typeof ROUND_ENTRY_INCLUDE;
}>;

type RoundWithCount = Prisma.RoundGetPayload<{
  include: typeof ROUND_WITH_COUNT_INCLUDE;
}>;

type StoreClient = Prisma.TransactionClient | typeof prisma;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function generateToken() {
  return randomBytes(24).toString("base64url");
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function generateTeamCode(existingCodes: Set<string>) {
  let code = "";

  do {
    code = Array.from({ length: 5 }, () => {
      const index = Math.floor(Math.random() * TEAM_CODE_ALPHABET.length);
      return TEAM_CODE_ALPHABET[index];
    }).join("");
  } while (existingCodes.has(code));

  return code;
}

function getStationLabel(index: number) {
  return `PC-${String(index + 1).padStart(2, "0")}`;
}

function toDbPhase(phase: RoundControlState["phase"]): PrismaRoundPhase {
  switch (phase) {
    case "draft":
      return PrismaRoundPhase.DRAFT;
    case "reflection":
      return PrismaRoundPhase.REFLECTION;
    case "relay":
      return PrismaRoundPhase.RELAY;
    case "paused":
      return PrismaRoundPhase.PAUSED;
    case "complete":
      return PrismaRoundPhase.COMPLETE;
    default:
      return PrismaRoundPhase.DRAFT;
  }
}

function fromDbPhase(phase: PrismaRoundPhase): RoundControlState["phase"] {
  switch (phase) {
    case PrismaRoundPhase.DRAFT:
      return "draft";
    case PrismaRoundPhase.REFLECTION:
      return "reflection";
    case PrismaRoundPhase.RELAY:
      return "relay";
    case PrismaRoundPhase.PAUSED:
      return "paused";
    case PrismaRoundPhase.COMPLETE:
      return "complete";
    default:
      return "draft";
  }
}

function toDbStatus(status: TeamStatus): PrismaTeamStatus {
  switch (status) {
    case "registered":
      return PrismaTeamStatus.REGISTERED;
    case "ready":
      return PrismaTeamStatus.READY;
    case "coding":
      return PrismaTeamStatus.CODING;
    case "submitted":
      return PrismaTeamStatus.SUBMITTED;
    case "scored":
      return PrismaTeamStatus.SCORED;
    default:
      return PrismaTeamStatus.REGISTERED;
  }
}

function fromDbStatus(status: PrismaTeamStatus): TeamStatus {
  switch (status) {
    case PrismaTeamStatus.REGISTERED:
      return "registered";
    case PrismaTeamStatus.READY:
      return "ready";
    case PrismaTeamStatus.CODING:
      return "coding";
    case PrismaTeamStatus.SUBMITTED:
      return "submitted";
    case PrismaTeamStatus.SCORED:
      return "scored";
    default:
      return "registered";
  }
}

function mapPreviousPhase(phase: PrismaRoundPhase | null): RoundControlState["previousPhase"] {
  if (phase === PrismaRoundPhase.REFLECTION) {
    return "reflection";
  }

  if (phase === PrismaRoundPhase.RELAY) {
    return "relay";
  }

  return null;
}

function normalizeNames(input: TeamCreateInput) {
  const name = input.name.trim();
  const members = input.members.map((member) => member.trim());

  if (name.length < 2) {
    throw new Error("Le nom d'equipe doit contenir au moins 2 caracteres.");
  }

  if (
    members.length < MIN_TEAM_MEMBERS ||
    members.length > MAX_TEAM_MEMBERS ||
    members.some((member) => member.length < 2)
  ) {
    throw new Error(`Il faut entre ${MIN_TEAM_MEMBERS} et ${MAX_TEAM_MEMBERS} membres avec un nom valide.`);
  }

  return { name, members };
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function toRoundState(round: PrismaRound): RoundControlState {
  return {
    registrationOpen: round.registrationOpen,
    phase: fromDbPhase(round.phase),
    previousPhase: mapPreviousPhase(round.previousPhase),
    phaseStartedAt: round.phaseStartedAt?.toISOString() ?? null,
    pausedElapsedMs: round.pausedElapsedMs,
    reflectionMs: round.reflectionMs,
    relaySliceMs: round.relaySliceMs,
    totalRelaySlices: round.totalRelaySlices,
    updatedAt: round.updatedAt.toISOString()
  };
}

function toRoundSubject(round: PrismaRound): RoundSubject | null {
  if (!round.subjectId || !round.subjectTitle || !round.subjectFileName || !round.subjectFunctionName) {
    return null;
  }

  return {
    id: round.subjectId,
    title: round.subjectTitle,
    fileName: round.subjectFileName,
    brief: round.subjectBrief ?? "",
    functionName: round.subjectFunctionName,
    parameters: [],
    constraints: [],
    examples: []
  };
}

function toRoundSummary(round: RoundWithCount): RoundSummary {
  return {
    id: round.id,
    sequence: round.sequence,
    name: round.name,
    isCurrent: round.isCurrent,
    subject: toRoundSubject(round),
    registrationOpen: round.registrationOpen,
    phase: fromDbPhase(round.phase),
    teamCount: round._count.entries,
    createdAt: round.createdAt.toISOString(),
    updatedAt: round.updatedAt.toISOString()
  };
}

function getLatestUpdatedAt(entry: RoundEntryWithRelations) {
  const timestamps = [
    entry.updatedAt.getTime(),
    entry.team.updatedAt.getTime(),
    entry.score?.updatedAt.getTime() ?? 0
  ];

  return new Date(Math.max(...timestamps)).toISOString();
}

function toPublicTeam(entry: RoundEntryWithRelations): PublicTeam {
  return {
    id: entry.team.id,
    teamCode: entry.team.teamCode,
    name: entry.team.name,
    station: entry.station,
    members: entry.team.members.map((member) => ({
      id: member.id,
      name: member.name,
      relayOrder: member.relayOrder
    })),
    status: fromDbStatus(entry.status),
    submittedAt: entry.submittedAt?.toISOString() ?? null,
    score: {
      correction: entry.score?.correction ?? 0,
      edgeCases: entry.score?.edgeCases ?? 0,
      complexity: entry.score?.complexity ?? 0,
      readability: entry.score?.readability ?? 0,
      notes: entry.score?.notes ?? ""
    },
    createdAt: entry.createdAt.toISOString(),
    updatedAt: getLatestUpdatedAt(entry),
    locked: entry.locked
  };
}

async function findCurrentRound(client: StoreClient) {
  return client.round.findFirst({
    where: {
      isCurrent: true
    },
    orderBy: {
      sequence: "asc"
    }
  });
}

async function createInitialRound(client: StoreClient) {
  return client.round.create({
    data: {
      sequence: 1,
      name: "Manche 1",
      isCurrent: true,
      registrationOpen: defaultRoundState.registrationOpen,
      phase: toDbPhase(defaultRoundState.phase),
      previousPhase: null,
      phaseStartedAt: null,
      pausedElapsedMs: null,
      reflectionMs: defaultRoundState.reflectionMs,
      relaySliceMs: defaultRoundState.relaySliceMs,
      totalRelaySlices: defaultRoundState.totalRelaySlices
    }
  });
}

async function ensureCurrentRound(client: StoreClient) {
  const currentRound = await findCurrentRound(client);

  if (currentRound) {
    return currentRound;
  }

  const firstRound = await client.round.findFirst({
    orderBy: {
      sequence: "asc"
    }
  });

  if (firstRound) {
    return client.round.update({
      where: {
        id: firstRound.id
      },
      data: {
        isCurrent: true
      }
    });
  }

  try {
    return await createInitialRound(client);
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }

    const retryRound = await client.round.findFirst({
      orderBy: {
        sequence: "asc"
      }
    });

    if (!retryRound) {
      throw error;
    }

    if (retryRound.isCurrent) {
      return retryRound;
    }

    return client.round.update({
      where: {
        id: retryRound.id
      },
      data: {
        isCurrent: true
      }
    });
  }
}

const RESET_EVENT_CONFIRMATION_TEXT = "RESET";

async function listAllTeamCodes(client: StoreClient) {
  const teams = await client.team.findMany({
    select: {
      teamCode: true
    }
  });

  return new Set(teams.map((team) => team.teamCode));
}

async function findCurrentEntryByTeamCode(client: StoreClient, teamCode: string) {
  const round = await ensureCurrentRound(client);

  return client.roundEntry.findFirst({
    where: {
      roundId: round.id,
      team: {
        teamCode: teamCode.toUpperCase()
      }
    },
    include: ROUND_ENTRY_INCLUDE
  });
}

async function findTeamWithMembersByCode(client: StoreClient, teamCode: string) {
  return client.team.findUnique({
    where: {
      teamCode: teamCode.toUpperCase()
    },
    include: {
      members: {
        orderBy: {
          relayOrder: "asc"
        }
      }
    }
  });
}

async function getNextRoundSequence(client: StoreClient) {
  const latestRound = await client.round.findFirst({
    orderBy: {
      sequence: "desc"
    }
  });

  return (latestRound?.sequence ?? 0) + 1;
}

async function listSourceTeamsForNewRound(
  client: StoreClient,
  sourceRoundId: string,
  teamCodes: string[] | undefined
) {
  const normalizedCodes = teamCodes?.map((teamCode) => teamCode.trim().toUpperCase()).filter(Boolean);

  return client.roundEntry.findMany({
    where: {
      roundId: sourceRoundId,
      ...(normalizedCodes && normalizedCodes.length > 0
        ? {
            team: {
              teamCode: {
                in: normalizedCodes
              }
            }
          }
        : {})
    },
    include: {
      team: true
    },
    orderBy: {
      createdAt: "asc"
    }
  });
}

export async function listRounds(): Promise<RoundSummary[]> {
  await ensureCurrentRound(prisma);

  const rounds = await prisma.round.findMany({
    include: ROUND_WITH_COUNT_INCLUDE,
    orderBy: {
      sequence: "asc"
    }
  });

  return rounds.map(toRoundSummary);
}

export async function getCurrentRoundSummary(): Promise<RoundSummary | null> {
  const currentRound = await ensureCurrentRound(prisma);
  const round = await prisma.round.findUnique({
    where: {
      id: currentRound.id
    },
    include: ROUND_WITH_COUNT_INCLUDE
  });

  return round ? toRoundSummary(round) : null;
}

export async function listStoredTeams(): Promise<PublicTeam[]> {
  const currentRound = await ensureCurrentRound(prisma);
  const entries = await prisma.roundEntry.findMany({
    where: {
      roundId: currentRound.id
    },
    include: ROUND_ENTRY_INCLUDE,
    orderBy: {
      createdAt: "asc"
    }
  });

  return entries.map(toPublicTeam);
}

export async function getRoundState(): Promise<RoundControlState> {
  const round = await ensureCurrentRound(prisma);
  return toRoundState(round);
}

export async function getPublicTeam(teamCode: string): Promise<PublicTeam | null> {
  const entry = await findCurrentEntryByTeamCode(prisma, teamCode);
  return entry ? toPublicTeam(entry) : null;
}

export async function createTeam(input: TeamCreateInput): Promise<TeamCreateResponse> {
  const { name, members } = normalizeNames(input);
  const editToken = generateToken();
  const editTokenHash = hashToken(editToken);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const entry = await prisma.$transaction(async (tx) => {
        const currentRound = await ensureCurrentRound(tx);

        if (!currentRound.registrationOpen) {
          throw new Error("Les inscriptions sont fermees.");
        }

        const [existingCodes, currentEntriesCount] = await Promise.all([
          listAllTeamCodes(tx),
          tx.roundEntry.count({
            where: {
              roundId: currentRound.id
            }
          })
        ]);

        const team = await tx.team.create({
          data: {
            teamCode: generateTeamCode(existingCodes),
            editTokenHash,
            name,
            members: {
              create: members.map((member, index) => ({
                name: member,
                relayOrder: index + 1
              }))
            }
          }
        });

        return tx.roundEntry.create({
          data: {
            roundId: currentRound.id,
            teamId: team.id,
            station: getStationLabel(currentEntriesCount),
            status: PrismaTeamStatus.REGISTERED,
            locked: false,
            score: {
              create: {
                correction: 0,
                edgeCases: 0,
                complexity: 0,
                readability: 0,
                notes: ""
              }
            }
          },
          include: ROUND_ENTRY_INCLUDE
        });
      });

      return {
        team: toPublicTeam(entry),
        editToken,
        managePath: `/team/${entry.team.teamCode}/manage?token=${editToken}`
      };
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("Impossible de generer un code equipe unique.");
}

export async function getManagedTeam(teamCode: string, token: string): Promise<PublicTeam | null> {
  const team = await findTeamWithMembersByCode(prisma, teamCode);

  if (!team || team.editTokenHash !== hashToken(token)) {
    return null;
  }

  const entry = await findCurrentEntryByTeamCode(prisma, teamCode);
  return entry ? toPublicTeam(entry) : null;
}

export async function updateTeamByToken(teamCode: string, input: TeamUpdateInput): Promise<PublicTeam | null> {
  const { name, members } = normalizeNames(input);

  return prisma.$transaction(async (tx) => {
    const team = await findTeamWithMembersByCode(tx, teamCode);

    if (!team || team.editTokenHash !== hashToken(input.token)) {
      return null;
    }

    const currentRound = await ensureCurrentRound(tx);
    const currentEntry = await tx.roundEntry.findUnique({
      where: {
        roundId_teamId: {
          roundId: currentRound.id,
          teamId: team.id
        }
      }
    });

    if (!currentEntry) {
      return null;
    }

    if (currentEntry.locked) {
      throw new Error("Cette equipe est verrouillee.");
    }

    await tx.team.update({
      where: {
        id: team.id
      },
      data: {
        name,
        members: {
          deleteMany: {},
          create: members.map((member, index) => ({
            name: member,
            relayOrder: index + 1
          }))
        }
      }
    });

    const updatedEntry = await tx.roundEntry.findUniqueOrThrow({
      where: {
        roundId_teamId: {
          roundId: currentRound.id,
          teamId: team.id
        }
      },
      include: ROUND_ENTRY_INCLUDE
    });

    return toPublicTeam(updatedEntry);
  });
}

export async function updateTeamScore(teamCode: string, input: TeamScoreInput): Promise<PublicTeam | null> {
  return prisma.$transaction(async (tx) => {
    const entry = await findCurrentEntryByTeamCode(tx, teamCode);

    if (!entry) {
      return null;
    }

    await tx.roundScore.upsert({
      where: {
        roundEntryId: entry.id
      },
      update: {
        correction: clamp(input.correction, 0, 40),
        edgeCases: clamp(input.edgeCases, 0, 20),
        complexity: clamp(input.complexity, 0, 20),
        readability: clamp(input.readability, 0, 10),
        notes: input.notes?.trim() ?? ""
      },
      create: {
        roundEntryId: entry.id,
        correction: clamp(input.correction, 0, 40),
        edgeCases: clamp(input.edgeCases, 0, 20),
        complexity: clamp(input.complexity, 0, 20),
        readability: clamp(input.readability, 0, 10),
        notes: input.notes?.trim() ?? ""
      }
    });

    const updatedEntry = await tx.roundEntry.update({
      where: {
        id: entry.id
      },
      data: {
        status: PrismaTeamStatus.SCORED
      },
      include: ROUND_ENTRY_INCLUDE
    });

    return toPublicTeam(updatedEntry);
  });
}

async function setPendingEntriesLocked(tx: Prisma.TransactionClient, roundId: string, locked: boolean) {
  await tx.roundEntry.updateMany({
    where: {
      roundId,
      status: {
        in: [PrismaTeamStatus.REGISTERED, PrismaTeamStatus.READY, PrismaTeamStatus.CODING]
      }
    },
    data: {
      locked
    }
  });

  if (!locked) {
    await tx.roundEntry.updateMany({
      where: {
        roundId,
        status: PrismaTeamStatus.READY
      },
      data: {
        status: PrismaTeamStatus.REGISTERED
      }
    });
  }
}

function getElapsedForPhase(round: PrismaRound, now: Date) {
  if (!round.phaseStartedAt) {
    return round.pausedElapsedMs ?? 0;
  }

  return Math.max(0, now.getTime() - round.phaseStartedAt.getTime());
}

async function resolveRoundSubjectSnapshot(subjectId: string | null | undefined): Promise<RoundSubject | null> {
  if (!subjectId) {
    return null;
  }

  const subject = await getPublicSubjectById(subjectId);

  if (!subject) {
    throw new Error("Sujet introuvable.");
  }

  return subject;
}

export async function applyAdminRoundAction(action: AdminRoundAction): Promise<RoundControlState> {
  const round = await prisma.$transaction(async (tx) => {
    const currentRound = await ensureCurrentRound(tx);
    const now = new Date();
    const currentRoundState = toRoundState(currentRound);

    if (!canRunAdminRoundAction(currentRoundState, action)) {
      throw new Error("Action admin invalide pour l'etat actuel de la manche.");
    }

    switch (action) {
      case "open_registration":
        await tx.round.update({
          where: {
            id: currentRound.id
          },
          data: {
            registrationOpen: true
          }
        });

        if (currentRound.phase === PrismaRoundPhase.DRAFT || currentRound.phase === PrismaRoundPhase.COMPLETE) {
          await setPendingEntriesLocked(tx, currentRound.id, false);
        }
        break;
      case "close_registration":
        await tx.round.update({
          where: {
            id: currentRound.id
          },
          data: {
            registrationOpen: false
          }
        });
        await setPendingEntriesLocked(tx, currentRound.id, true);
        break;
      case "start_reflection":
        if (!currentRound.subjectId) {
          throw new Error("Aucun sujet n'est assigne a cette manche.");
        }

        await tx.round.update({
          where: {
            id: currentRound.id
          },
          data: {
            registrationOpen: false,
            phase: PrismaRoundPhase.REFLECTION,
            previousPhase: null,
            phaseStartedAt: now,
            pausedElapsedMs: null
          }
        });
        await tx.roundEntry.updateMany({
          where: {
            roundId: currentRound.id,
            status: {
              in: [PrismaTeamStatus.REGISTERED, PrismaTeamStatus.READY, PrismaTeamStatus.CODING]
            }
          },
          data: {
            status: PrismaTeamStatus.READY,
            locked: true,
            submittedAt: null
          }
        });
        break;
      case "start_relay":
        await tx.round.update({
          where: {
            id: currentRound.id
          },
          data: {
            registrationOpen: false,
            phase: PrismaRoundPhase.RELAY,
            previousPhase: null,
            phaseStartedAt: now,
            pausedElapsedMs: null
          }
        });
        await tx.roundEntry.updateMany({
          where: {
            roundId: currentRound.id,
            status: {
              in: [PrismaTeamStatus.REGISTERED, PrismaTeamStatus.READY, PrismaTeamStatus.CODING]
            }
          },
          data: {
            status: PrismaTeamStatus.CODING,
            locked: true
          }
        });
        break;
      case "pause_round":
        if (currentRound.phase === PrismaRoundPhase.REFLECTION || currentRound.phase === PrismaRoundPhase.RELAY) {
          await tx.round.update({
            where: {
              id: currentRound.id
            },
            data: {
              previousPhase: currentRound.phase,
              phase: PrismaRoundPhase.PAUSED,
              pausedElapsedMs: getElapsedForPhase(currentRound, now),
              phaseStartedAt: null
            }
          });
        }
        break;
      case "resume_round":
        if (currentRound.phase === PrismaRoundPhase.PAUSED && currentRound.previousPhase) {
          await tx.round.update({
            where: {
              id: currentRound.id
            },
            data: {
              phase: currentRound.previousPhase,
              phaseStartedAt: new Date(now.getTime() - (currentRound.pausedElapsedMs ?? 0)),
              pausedElapsedMs: null,
              previousPhase: null
            }
          });
        }
        break;
      case "close_round":
        await tx.round.update({
          where: {
            id: currentRound.id
          },
          data: {
            registrationOpen: false,
            phase: PrismaRoundPhase.COMPLETE,
            previousPhase: null,
            phaseStartedAt: null,
            pausedElapsedMs: null
          }
        });
        await setPendingEntriesLocked(tx, currentRound.id, true);
        break;
      default:
        break;
    }

    return tx.round.findUniqueOrThrow({
      where: {
        id: currentRound.id
      }
    });
  });

  return toRoundState(round);
}

export async function markTeamSubmitted(teamCode: string): Promise<PublicTeam | null> {
  return prisma.$transaction(async (tx) => {
    const currentRound = await ensureCurrentRound(tx);

    if (!canAdminMarkSubmission(toRoundState(currentRound))) {
      throw new Error("La soumission ne peut etre marquee que pendant ou apres le relais.");
    }

    const entry = await findCurrentEntryByTeamCode(tx, teamCode);

    if (!entry) {
      return null;
    }

    const updatedEntry = await tx.roundEntry.update({
      where: {
        id: entry.id
      },
      data: {
        submittedAt: entry.submittedAt ?? new Date(),
        locked: true,
        ...(entry.status === PrismaTeamStatus.SCORED ? {} : { status: PrismaTeamStatus.SUBMITTED })
      },
      include: ROUND_ENTRY_INCLUDE
    });

    return toPublicTeam(updatedEntry);
  });
}

export async function createRound(input: AdminCreateRoundInput = {}): Promise<RoundSummary> {
  const subject = await resolveRoundSubjectSnapshot(input.subjectId);
  const round = await prisma.$transaction(async (tx) => {
    const currentRound = await ensureCurrentRound(tx);
    const nextSequence = await getNextRoundSequence(tx);
    const shouldCloneTeams = input.cloneTeams !== false;
    const makeCurrent = input.makeCurrent !== false;

    if (makeCurrent) {
      await tx.round.updateMany({
        data: {
          isCurrent: false
        }
      });
    }

    const nextRound = await tx.round.create({
      data: {
        sequence: nextSequence,
        name: input.name?.trim() || `Manche ${nextSequence}`,
        isCurrent: makeCurrent,
        subjectId: subject?.id ?? null,
        subjectTitle: subject?.title ?? null,
        subjectFileName: subject?.fileName ?? null,
        subjectBrief: subject?.brief ?? null,
        subjectFunctionName: subject?.functionName ?? null,
        registrationOpen: true,
        phase: PrismaRoundPhase.DRAFT,
        previousPhase: null,
        phaseStartedAt: null,
        pausedElapsedMs: null,
        reflectionMs: defaultRoundState.reflectionMs,
        relaySliceMs: defaultRoundState.relaySliceMs,
        totalRelaySlices: defaultRoundState.totalRelaySlices
      }
    });

    if (shouldCloneTeams) {
      const sourceEntries = await listSourceTeamsForNewRound(tx, currentRound.id, input.teamCodes);

      for (const [index, sourceEntry] of sourceEntries.entries()) {
        await tx.roundEntry.create({
          data: {
            roundId: nextRound.id,
            teamId: sourceEntry.teamId,
            station: getStationLabel(index),
            status: PrismaTeamStatus.REGISTERED,
            locked: false,
            submittedAt: null,
            score: {
              create: {
                correction: 0,
                edgeCases: 0,
                complexity: 0,
                readability: 0,
                notes: ""
              }
            }
          }
        });
      }
    }

    return tx.round.findUniqueOrThrow({
      where: {
        id: nextRound.id
      },
      include: ROUND_WITH_COUNT_INCLUDE
    });
  });

  return toRoundSummary(round);
}

export async function assignRoundSubject(input: AdminAssignSubjectInput): Promise<RoundSummary> {
  const subject = await resolveRoundSubjectSnapshot(input.subjectId);

  const round = await prisma.$transaction(async (tx) => {
    const targetRound = input.roundId
      ? await tx.round.findUnique({
          where: {
            id: input.roundId
          }
        })
      : await ensureCurrentRound(tx);

    if (!targetRound) {
      throw new Error("Manche introuvable.");
    }

    if (targetRound.phase !== PrismaRoundPhase.DRAFT) {
      throw new Error("Le sujet ne peut etre modifie que tant que la manche est en preparation.");
    }

    return tx.round.update({
      where: {
        id: targetRound.id
      },
      data: {
        subjectId: subject?.id ?? null,
        subjectTitle: subject?.title ?? null,
        subjectFileName: subject?.fileName ?? null,
        subjectBrief: subject?.brief ?? null,
        subjectFunctionName: subject?.functionName ?? null
      },
      include: ROUND_WITH_COUNT_INCLUDE
    });
  });

  return toRoundSummary(round);
}

export async function setCurrentRound(input: AdminSelectRoundInput): Promise<RoundSummary> {
  const round = await prisma.$transaction(async (tx) => {
    const targetRound = await tx.round.findUnique({
      where: {
        id: input.roundId
      }
    });

    if (!targetRound) {
      throw new Error("Manche introuvable.");
    }

    await tx.round.updateMany({
      data: {
        isCurrent: false
      }
    });

    await tx.round.update({
      where: {
        id: input.roundId
      },
      data: {
        isCurrent: true
      }
    });

    return tx.round.findUniqueOrThrow({
      where: {
        id: input.roundId
      },
      include: ROUND_WITH_COUNT_INCLUDE
    });
  });

  return toRoundSummary(round);
}

export async function resetEventData(input: AdminResetEventInput): Promise<RoundSummary> {
  const confirmationText = input.confirmationText?.trim().toUpperCase();

  if (confirmationText !== RESET_EVENT_CONFIRMATION_TEXT) {
    throw new Error(`Confirmation invalide. Tape ${RESET_EVENT_CONFIRMATION_TEXT} pour continuer.`);
  }

  const round = await prisma.$transaction(async (tx) => {
    await tx.round.deleteMany();
    await tx.team.deleteMany();

    const initialRound = await createInitialRound(tx);

    return tx.round.findUniqueOrThrow({
      where: {
        id: initialRound.id
      },
      include: ROUND_WITH_COUNT_INCLUDE
    });
  });

  return toRoundSummary(round);
}
