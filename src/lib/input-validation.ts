import type { NextRequest } from "next/server";
import { z } from "zod";
import { MAX_TEAM_MEMBERS, MIN_TEAM_MEMBERS } from "@/lib/game-types";

const TEAM_CODE_PATTERN = /^[A-Z]{5}$/;
const CUID_PATTERN = /^c[a-z0-9]{24,}$/i;
const SAFE_PATH_PATTERN = /^\/[A-Za-z0-9/_-]*$/;
const SAFE_SUBJECT_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 _-]*$/;
const SAFE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;

function requiredString(message: string, maxLength = 160) {
  return z.string().trim().min(1, message).max(maxLength, message);
}

function optionalTrimmedString(maxLength: number) {
  return z
    .string()
    .trim()
    .max(maxLength)
    .transform((value) => (value.length > 0 ? value : undefined))
    .optional();
}

export const teamCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(TEAM_CODE_PATTERN, "Code equipe invalide.");

export const roundIdSchema = z
  .string()
  .trim()
  .regex(CUID_PATTERN, "Identifiant de manche invalide.");

export const subjectIdSchema = z
  .string()
  .trim()
  .min(1, "Identifiant de sujet invalide.")
  .max(120, "Identifiant de sujet invalide.")
  .regex(SAFE_SUBJECT_ID_PATTERN, "Identifiant de sujet invalide.");

export const tokenSchema = z
  .string()
  .trim()
  .regex(SAFE_TOKEN_PATTERN, "Token invalide.");

export const teamCreateInputSchema = z
  .object({
    name: z.string().trim().min(2, "Nom d'equipe trop court.").max(80, "Nom d'equipe trop long."),
    members: z
      .array(z.string().trim().min(2, "Nom de participant trop court.").max(80, "Nom de participant trop long."))
      .min(MIN_TEAM_MEMBERS, `Il faut au moins ${MIN_TEAM_MEMBERS} participants.`)
      .max(MAX_TEAM_MEMBERS, `Il faut au maximum ${MAX_TEAM_MEMBERS} participants.`)
  })
  .strict();

export const teamUpdateInputSchema = teamCreateInputSchema
  .extend({
    token: tokenSchema
  })
  .strict();

export const teamScoreInputSchema = z
  .object({
    correction: z.number().int().min(0).max(40),
    edgeCases: z.number().int().min(0).max(20),
    complexity: z.number().int().min(0).max(20),
    readability: z.number().int().min(0).max(10),
    notes: z.string().trim().max(4000, "Notes trop longues.").optional()
  })
  .strict();

export const staffSessionInputSchema = z
  .object({
    role: z.enum(["admin", "judge"]),
    code: requiredString("Code d'acces invalide.", 128),
    nextPath: z
      .string()
      .trim()
      .max(200, "nextPath invalide.")
      .regex(SAFE_PATH_PATTERN, "nextPath invalide.")
      .refine((value) => !value.startsWith("//"), "nextPath invalide.")
      .optional()
  })
  .strict();

export const roundActionInputSchema = z
  .object({
    action: z.enum([
      "open_registration",
      "close_registration",
      "start_reflection",
      "start_relay",
      "pause_round",
      "resume_round",
      "close_round",
      "show_brief_tv",
      "show_leaderboard_tv",
      "show_live_tv",
      "show_registration_qr"
    ])
  })
  .strict();

export const createRoundInputSchema = z
  .object({
    name: optionalTrimmedString(80),
    cloneTeams: z.boolean().optional(),
    teamCodes: z.array(teamCodeSchema).max(200, "Trop de codes equipe.").optional(),
    makeCurrent: z.boolean().optional(),
    subjectId: subjectIdSchema.nullable().optional()
  })
  .strict();

export const assignRoundSubjectInputSchema = z
  .object({
    roundId: roundIdSchema.optional(),
    subjectId: subjectIdSchema.nullable().optional()
  })
  .strict();

export const selectRoundInputSchema = z
  .object({
    roundId: roundIdSchema
  })
  .strict();

export const resetEventInputSchema = z
  .object({
    confirmationText: requiredString("Confirmation invalide.", 32)
  })
  .strict();

export const teamLockInputSchema = z
  .object({
    locked: z.boolean()
  })
  .strict();

export const teamSubmissionInputSchema = z
  .object({
    submitted: z.boolean()
  })
  .strict();

function formatZodError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Entree invalide.";
}

export async function parseJsonBody<TSchema extends z.ZodTypeAny>(
  request: Pick<NextRequest, "json">,
  schema: TSchema
): Promise<z.infer<TSchema>> {
  let rawBody: unknown;

  try {
    rawBody = await request.json();
  } catch {
    throw new Error("Corps JSON invalide.");
  }

  const parsed = schema.safeParse(rawBody);

  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  return parsed.data;
}

export function parseValue<TSchema extends z.ZodTypeAny>(value: unknown, schema: TSchema): z.infer<TSchema> {
  const parsed = schema.safeParse(value);

  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }

  return parsed.data;
}
