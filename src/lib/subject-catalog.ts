import "server-only";

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { RoundSubject } from "@/lib/game-types";

type SubjectFileShape = {
  id?: unknown;
  title?: unknown;
  description?: unknown;
  file_name?: unknown;
  function_name?: unknown;
  difficulty?: unknown;
};

const SUBJECTS_DIR = path.join(process.cwd(), "relay-judge", "subjects");

function parseSubject(data: SubjectFileShape, filePath: string): RoundSubject {
  const id = typeof data.id === "string" ? data.id.trim() : "";
  const title = typeof data.title === "string" ? data.title.trim() : "";
  const brief = typeof data.description === "string" ? data.description.trim() : "";
  const fileName = typeof data.file_name === "string" ? data.file_name.trim() : "";
  const functionName = typeof data.function_name === "string" ? data.function_name.trim() : "";
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
    difficulty
  };
}

export async function listPublicSubjects(): Promise<RoundSubject[]> {
  const entries = await readdir(SUBJECTS_DIR, { withFileTypes: true });
  const subjects = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const subjectPath = path.join(SUBJECTS_DIR, entry.name, "subject.json");
        const raw = await readFile(subjectPath, "utf8");
        return parseSubject(JSON.parse(raw) as SubjectFileShape, subjectPath);
      })
  );

  return subjects.sort((left, right) => left.title.localeCompare(right.title, "fr"));
}

export async function getPublicSubjectById(subjectId: string): Promise<RoundSubject | null> {
  const normalizedId = subjectId.trim();

  if (!normalizedId) {
    return null;
  }

  const subjects = await listPublicSubjects();
  return subjects.find((subject) => subject.id === normalizedId) ?? null;
}
