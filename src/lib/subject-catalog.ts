import "server-only";

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { RoundSubject, SubjectExample, SubjectParameter, SubjectReturn } from "@/lib/game-types";
import { DEFAULT_LOCALE, Locale } from "@/lib/locale";

type SubjectFileShape = {
  id?: unknown;
  title?: unknown;
  description?: unknown;
  file_name?: unknown;
  function_name?: unknown;
  prototype?: unknown;
  difficulty?: unknown;
  parameters?: unknown;
  returns?: unknown;
  constraints?: unknown;
  examples?: unknown;
};

type SubjectTranslationFileShape = {
  title?: unknown;
  description?: unknown;
  parameters?: unknown;
  returns?: unknown;
  constraints?: unknown;
  examples?: unknown;
};

const SUBJECTS_DIR = path.join(process.cwd(), "relay-judge", "subjects");

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseParameters(raw: unknown, filePath: string): SubjectParameter[] {
  if (raw == null) {
    return [];
  }

  if (!Array.isArray(raw)) {
    throw new Error(`Sujet invalide dans ${filePath}: parameters doit être un tableau.`);
  }

  return raw.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`Sujet invalide dans ${filePath}: parameters[${index}] est invalide.`);
    }

    const name = typeof item.name === "string" ? item.name.trim() : "";
    const type = typeof item.type === "string" ? item.type.trim() : "";
    const description = typeof item.description === "string" ? item.description.trim() : "";

    if (!name || !type || !description) {
      throw new Error(`Sujet invalide dans ${filePath}: parameters[${index}] doit contenir name, type et description.`);
    }

    return { name, type, description };
  });
}

function parseReturns(raw: unknown, filePath: string): SubjectReturn | undefined {
  if (raw == null) {
    return undefined;
  }

  if (!isRecord(raw)) {
    throw new Error(`Sujet invalide dans ${filePath}: returns est invalide.`);
  }

  const type = typeof raw.type === "string" ? raw.type.trim() : "";
  const description = typeof raw.description === "string" ? raw.description.trim() : "";

  if (!type || !description) {
    throw new Error(`Sujet invalide dans ${filePath}: returns doit contenir type et description.`);
  }

  return { type, description };
}

function parseConstraints(raw: unknown, filePath: string): string[] {
  if (raw == null) {
    return [];
  }

  if (!Array.isArray(raw)) {
    throw new Error(`Sujet invalide dans ${filePath}: constraints doit être un tableau.`);
  }

  return raw.map((item, index) => {
    const value = typeof item === "string" ? item.trim() : "";

    if (!value) {
      throw new Error(`Sujet invalide dans ${filePath}: constraints[${index}] est invalide.`);
    }

    return value;
  });
}

function parseExamples(raw: unknown, filePath: string): SubjectExample[] {
  if (raw == null) {
    return [];
  }

  if (!Array.isArray(raw)) {
    throw new Error(`Sujet invalide dans ${filePath}: examples doit être un tableau.`);
  }

  return raw.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`Sujet invalide dans ${filePath}: examples[${index}] est invalide.`);
    }

    const title = typeof item.title === "string" ? item.title.trim() : `Exemple ${index + 1}`;
    const input = isRecord(item.input) ? item.input : null;
    const explanation = typeof item.explanation === "string" ? item.explanation.trim() : undefined;

    if (!input || !("output" in item)) {
      throw new Error(`Sujet invalide dans ${filePath}: examples[${index}] doit contenir input et output.`);
    }

    return {
      title,
      input,
      output: item.output,
      explanation: explanation || undefined
    };
  });
}

function parseSubject(data: SubjectFileShape, filePath: string): RoundSubject {
  const id = typeof data.id === "string" ? data.id.trim() : "";
  const title = typeof data.title === "string" ? data.title.trim() : "";
  const brief = typeof data.description === "string" ? data.description.trim() : "";
  const fileName = typeof data.file_name === "string" ? data.file_name.trim() : "";
  const functionName = typeof data.function_name === "string" ? data.function_name.trim() : "";
  const prototype = typeof data.prototype === "string" ? data.prototype.trim() : "";
  const parameters = parseParameters(data.parameters, filePath);
  const returns = parseReturns(data.returns, filePath);
  const constraints = parseConstraints(data.constraints, filePath);
  const examples = parseExamples(data.examples, filePath);
  const difficulty =
    data.difficulty === "easy" || data.difficulty === "medium" || data.difficulty === "hard"
      ? data.difficulty
      : undefined;

  if (!id || !title || !fileName || !functionName) {
    throw new Error(`Sujet invalide dans ${filePath}.`);
  }

  return {
    id,
    title,
    brief,
    fileName,
    functionName,
    prototype: prototype || undefined,
    difficulty,
    parameters,
    returns,
    constraints,
    examples
  };
}

async function readSubjectTranslation(subjectDirectory: string, locale: Locale) {
  if (locale === DEFAULT_LOCALE) {
    return null;
  }

  const translationPath = path.join(subjectDirectory, `subject.content.${locale}.json`);

  try {
    const raw = await readFile(translationPath, "utf8");
    return JSON.parse(raw) as SubjectTranslationFileShape;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

function applySubjectTranslation(subject: RoundSubject, translation: SubjectTranslationFileShape | null) {
  if (!translation) {
    return subject;
  }

  const translatedParameters = Array.isArray(translation.parameters) ? translation.parameters : [];
  const translatedReturns = isRecord(translation.returns) ? translation.returns : null;
  const translatedConstraints = Array.isArray(translation.constraints) ? translation.constraints : [];
  const translatedExamples = Array.isArray(translation.examples) ? translation.examples : [];

  return {
    ...subject,
    title: typeof translation.title === "string" && translation.title.trim() ? translation.title.trim() : subject.title,
    brief:
      typeof translation.description === "string" && translation.description.trim()
        ? translation.description.trim()
        : subject.brief,
    parameters: subject.parameters.map((parameter, index) => {
      const translatedParameter = translatedParameters.find((entry) =>
        isRecord(entry) && typeof entry.name === "string" && entry.name === parameter.name
      );
      const fallbackParameter = translatedParameters[index];
      const parameterTranslation = isRecord(translatedParameter)
        ? translatedParameter
        : isRecord(fallbackParameter)
          ? fallbackParameter
          : null;

      return {
        ...parameter,
        description:
          parameterTranslation && typeof parameterTranslation.description === "string" && parameterTranslation.description.trim()
            ? parameterTranslation.description.trim()
            : parameter.description
      };
    }),
    returns: subject.returns
      ? {
          ...subject.returns,
          description:
            translatedReturns && typeof translatedReturns.description === "string" && translatedReturns.description.trim()
              ? translatedReturns.description.trim()
              : subject.returns.description
        }
      : subject.returns,
    constraints:
      translatedConstraints.length > 0
        ? subject.constraints.map((constraint, index) =>
            typeof translatedConstraints[index] === "string" && translatedConstraints[index].trim()
              ? translatedConstraints[index].trim()
              : constraint
          )
        : subject.constraints,
    examples: subject.examples.map((example, index) => {
      const exampleTranslation = isRecord(translatedExamples[index]) ? translatedExamples[index] : null;

      return {
        ...example,
        title:
          exampleTranslation && typeof exampleTranslation.title === "string" && exampleTranslation.title.trim()
            ? exampleTranslation.title.trim()
            : example.title,
        explanation:
          exampleTranslation && typeof exampleTranslation.explanation === "string" && exampleTranslation.explanation.trim()
            ? exampleTranslation.explanation.trim()
            : example.explanation
      };
    })
  };
}

export async function listPublicSubjects(locale: Locale = DEFAULT_LOCALE): Promise<RoundSubject[]> {
  const entries = await readdir(SUBJECTS_DIR, { withFileTypes: true });
  const subjects = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const subjectDirectory = path.join(SUBJECTS_DIR, entry.name);
        const subjectPath = path.join(subjectDirectory, "subject.json");
        const raw = await readFile(subjectPath, "utf8");
        const subject = parseSubject(JSON.parse(raw) as SubjectFileShape, subjectPath);
        const translation = await readSubjectTranslation(subjectDirectory, locale);
        return applySubjectTranslation(subject, translation);
      })
  );

  return subjects.sort((left, right) => left.title.localeCompare(right.title, locale));
}

export async function getPublicSubjectById(subjectId: string, locale: Locale = DEFAULT_LOCALE): Promise<RoundSubject | null> {
  const normalizedId = subjectId.trim();

  if (!normalizedId) {
    return null;
  }

  const subjects = await listPublicSubjects(locale);
  return subjects.find((subject) => subject.id === normalizedId) ?? null;
}
