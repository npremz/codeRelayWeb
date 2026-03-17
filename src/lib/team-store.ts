import "server-only";

import { createHash, randomBytes } from "node:crypto";
import {
  Prisma,
  RoundControl,
  RoundPhase as PrismaRoundPhase,
  TeamStatus as PrismaTeamStatus
} from "@prisma/client";
import { defaultRoundState } from "@/lib/demo-game";
import { prisma } from "@/lib/prisma";
import {
  AdminRoundAction,
  PublicTeam,
  RoundControlState,
  TeamCreateInput,
  TeamCreateResponse,
  TeamScoreInput,
  TeamStatus,
  TeamUpdateInput
} from "@/lib/game-types";

const ROUND_CONTROL_ID = "default";
const TEAM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const TEAM_INCLUDE = {
  members: {
    orderBy: {
      relayOrder: "asc"
    }
  },
  score: true
} satisfies Prisma.TeamInclude;

type TeamWithRelations = Prisma.TeamGetPayload<{
  include: typeof TEAM_INCLUDE;
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

function getNextStationLabel(count: number) {
  return `PC-${String(count + 1).padStart(2, "0")}`;
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

function toPublicTeam(team: TeamWithRelations): PublicTeam {
  return {
    id: team.id,
    teamCode: team.teamCode,
    name: team.name,
    station: team.station,
    members: team.members.map((member) => ({
      id: member.id,
      name: member.name,
      relayOrder: member.relayOrder
    })),
    status: fromDbStatus(team.status),
    submittedAt: team.submittedAt?.toISOString() ?? null,
    score: {
      correction: team.score?.correction ?? 0,
      edgeCases: team.score?.edgeCases ?? 0,
      complexity: team.score?.complexity ?? 0,
      readability: team.score?.readability ?? 0,
      notes: team.score?.notes ?? ""
    },
    createdAt: team.createdAt.toISOString(),
    updatedAt: team.updatedAt.toISOString(),
    locked: team.locked
  };
}

function toRoundState(round: RoundControl): RoundControlState {
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

async function ensureRoundControl(client: StoreClient) {
  return client.roundControl.upsert({
    where: {
      id: ROUND_CONTROL_ID
    },
    update: {},
    create: {
      id: ROUND_CONTROL_ID,
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

function normalizeNames(input: TeamCreateInput) {
  const name = input.name.trim();
  const members = input.members.map((member) => member.trim());

  if (name.length < 2) {
    throw new Error("Le nom d'equipe doit contenir au moins 2 caracteres.");
  }

  if (members.length !== 3 || members.some((member) => member.length < 2)) {
    throw new Error("Il faut exactement 3 membres avec un nom valide.");
  }

  return { name, members };
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

async function findTeamByCode(client: StoreClient, teamCode: string) {
  return client.team.findUnique({
    where: {
      teamCode: teamCode.toUpperCase()
    },
    include: TEAM_INCLUDE
  });
}

export async function listStoredTeams(): Promise<PublicTeam[]> {
  await ensureRoundControl(prisma);

  const teams = await prisma.team.findMany({
    orderBy: {
      createdAt: "asc"
    },
    include: TEAM_INCLUDE
  });

  return teams.map(toPublicTeam);
}

export async function getRoundState(): Promise<RoundControlState> {
  const round = await ensureRoundControl(prisma);
  return toRoundState(round);
}

export async function getPublicTeam(teamCode: string): Promise<PublicTeam | null> {
  const team = await findTeamByCode(prisma, teamCode);
  return team ? toPublicTeam(team) : null;
}

export async function createTeam(input: TeamCreateInput): Promise<TeamCreateResponse> {
  const { name, members } = normalizeNames(input);
  const editToken = generateToken();
  const editTokenHash = hashToken(editToken);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const team = await prisma.$transaction(async (tx) => {
        const round = await ensureRoundControl(tx);

        if (!round.registrationOpen) {
          throw new Error("Les inscriptions sont fermees.");
        }

        const [existingCodes, count] = await Promise.all([
          tx.team.findMany({
            select: {
              teamCode: true
            }
          }),
          tx.team.count()
        ]);

        const nextTeam = await tx.team.create({
          data: {
            teamCode: generateTeamCode(new Set(existingCodes.map((team) => team.teamCode))),
            editTokenHash,
            name,
            station: getNextStationLabel(count),
            status: PrismaTeamStatus.REGISTERED,
            locked: false,
            members: {
              create: members.map((member, index) => ({
                name: member,
                relayOrder: index + 1
              }))
            },
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
          include: TEAM_INCLUDE
        });

        return nextTeam;
      });

      return {
        team: toPublicTeam(team),
        editToken,
        managePath: `/team/${team.teamCode}/manage?token=${editToken}`
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
  const team = await findTeamByCode(prisma, teamCode);

  if (!team || team.editTokenHash !== hashToken(token)) {
    return null;
  }

  return toPublicTeam(team);
}

export async function updateTeamByToken(teamCode: string, input: TeamUpdateInput): Promise<PublicTeam | null> {
  const { name, members } = normalizeNames(input);

  return prisma.$transaction(async (tx) => {
    const team = await findTeamByCode(tx, teamCode);

    if (!team || team.editTokenHash !== hashToken(input.token)) {
      return null;
    }

    if (team.locked) {
      throw new Error("Cette equipe est verrouillee.");
    }

    const updated = await tx.team.update({
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
      },
      include: TEAM_INCLUDE
    });

    return toPublicTeam(updated);
  });
}

export async function updateTeamScore(teamCode: string, input: TeamScoreInput): Promise<PublicTeam | null> {
  return prisma.$transaction(async (tx) => {
    const team = await findTeamByCode(tx, teamCode);

    if (!team) {
      return null;
    }

    await tx.score.upsert({
      where: {
        teamId: team.id
      },
      update: {
        correction: clamp(input.correction, 0, 40),
        edgeCases: clamp(input.edgeCases, 0, 20),
        complexity: clamp(input.complexity, 0, 20),
        readability: clamp(input.readability, 0, 10),
        notes: input.notes?.trim() ?? ""
      },
      create: {
        teamId: team.id,
        correction: clamp(input.correction, 0, 40),
        edgeCases: clamp(input.edgeCases, 0, 20),
        complexity: clamp(input.complexity, 0, 20),
        readability: clamp(input.readability, 0, 10),
        notes: input.notes?.trim() ?? ""
      }
    });

    const updated = await tx.team.update({
      where: {
        id: team.id
      },
      data: {
        status: PrismaTeamStatus.SCORED
      },
      include: TEAM_INCLUDE
    });

    return toPublicTeam(updated);
  });
}

async function setPendingTeamsLocked(tx: Prisma.TransactionClient, locked: boolean) {
  await tx.team.updateMany({
    where: {
      status: {
        in: [PrismaTeamStatus.REGISTERED, PrismaTeamStatus.READY, PrismaTeamStatus.CODING]
      }
    },
    data: {
      locked
    }
  });

  if (!locked) {
    await tx.team.updateMany({
      where: {
        status: PrismaTeamStatus.READY
      },
      data: {
        status: PrismaTeamStatus.REGISTERED
      }
    });
  }
}

function getElapsedForPhase(round: RoundControl, now: Date) {
  if (!round.phaseStartedAt) {
    return round.pausedElapsedMs ?? 0;
  }

  return Math.max(0, now.getTime() - round.phaseStartedAt.getTime());
}

export async function applyAdminRoundAction(action: AdminRoundAction): Promise<RoundControlState> {
  const round = await prisma.$transaction(async (tx) => {
    const currentRound = await ensureRoundControl(tx);
    const now = new Date();

    switch (action) {
      case "open_registration":
        await tx.roundControl.update({
          where: {
            id: ROUND_CONTROL_ID
          },
          data: {
            registrationOpen: true
          }
        });

        if (currentRound.phase === PrismaRoundPhase.DRAFT || currentRound.phase === PrismaRoundPhase.COMPLETE) {
          await setPendingTeamsLocked(tx, false);
        }
        break;
      case "close_registration":
        await tx.roundControl.update({
          where: {
            id: ROUND_CONTROL_ID
          },
          data: {
            registrationOpen: false
          }
        });
        await setPendingTeamsLocked(tx, true);
        break;
      case "start_reflection":
        await tx.roundControl.update({
          where: {
            id: ROUND_CONTROL_ID
          },
          data: {
            registrationOpen: false,
            phase: PrismaRoundPhase.REFLECTION,
            previousPhase: null,
            phaseStartedAt: now,
            pausedElapsedMs: null
          }
        });
        await tx.team.updateMany({
          where: {
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
        await tx.roundControl.update({
          where: {
            id: ROUND_CONTROL_ID
          },
          data: {
            registrationOpen: false,
            phase: PrismaRoundPhase.RELAY,
            previousPhase: null,
            phaseStartedAt: now,
            pausedElapsedMs: null
          }
        });
        await tx.team.updateMany({
          where: {
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
          await tx.roundControl.update({
            where: {
              id: ROUND_CONTROL_ID
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
          await tx.roundControl.update({
            where: {
              id: ROUND_CONTROL_ID
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
        await tx.roundControl.update({
          where: {
            id: ROUND_CONTROL_ID
          },
          data: {
            registrationOpen: false,
            phase: PrismaRoundPhase.COMPLETE,
            previousPhase: null,
            phaseStartedAt: null,
            pausedElapsedMs: null
          }
        });
        await setPendingTeamsLocked(tx, true);
        break;
      default:
        break;
    }

    return tx.roundControl.findUniqueOrThrow({
      where: {
        id: ROUND_CONTROL_ID
      }
    });
  });

  return toRoundState(round);
}

export async function markTeamSubmitted(teamCode: string): Promise<PublicTeam | null> {
  return prisma.$transaction(async (tx) => {
    const team = await findTeamByCode(tx, teamCode);

    if (!team) {
      return null;
    }

    const updated = await tx.team.update({
      where: {
        id: team.id
      },
      data: {
        submittedAt: team.submittedAt ?? new Date(),
        locked: true,
        ...(team.status === PrismaTeamStatus.SCORED ? {} : { status: PrismaTeamStatus.SUBMITTED })
      },
      include: TEAM_INCLUDE
    });

    return toPublicTeam(updated);
  });
}
