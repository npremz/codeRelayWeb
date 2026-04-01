import { AppFrame } from "@/components/app-frame";
import { Panel } from "@/components/panel";
import { getRoundActionLabel } from "@/lib/demo-game";
import { RoundSubject, SubjectExample, SubjectParameter } from "@/lib/game-types";
import { getMessages } from "@/lib/locale";
import { getRequestLocale } from "@/lib/request-locale";
import { listPublicSubjects } from "@/lib/subject-catalog";
import { getCurrentRoundSummary, getRoundState } from "@/lib/team-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function formatExampleValue(value: unknown) {
  if (typeof value === "string") {
    return JSON.stringify(value);
  }

  if (typeof value === "number" || typeof value === "boolean" || value === null) {
    return String(value);
  }

  return JSON.stringify(value, null, 2);
}

function buildExampleInput(example: SubjectExample, parameters: SubjectParameter[]) {
  const orderedKeys = parameters.map((parameter) => parameter.name);
  const extraKeys = Object.keys(example.input).filter((key) => !orderedKeys.includes(key));
  const keys = [...orderedKeys.filter((key) => key in example.input), ...extraKeys];

  return keys.map((key) => `${key} = ${formatExampleValue(example.input[key])}`).join("\n");
}

function hydrateSubject(subjectFromRound: RoundSubject | null, catalogSubject: RoundSubject | undefined) {
  if (!subjectFromRound) {
    return null;
  }

  return {
    ...subjectFromRound,
    title: catalogSubject?.title ?? subjectFromRound.title,
    brief: catalogSubject?.brief ?? subjectFromRound.brief,
    prototype: subjectFromRound.prototype ?? catalogSubject?.prototype,
    parameters: catalogSubject?.parameters ?? [],
    returns: catalogSubject?.returns,
    constraints: catalogSubject?.constraints ?? [],
    examples: catalogSubject?.examples ?? []
  };
}

export default async function BriefPage() {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  const [currentRound, round, subjects] = await Promise.all([
    getCurrentRoundSummary(),
    getRoundState(),
    listPublicSubjects(locale)
  ]);
  const subjectFromRound = currentRound?.subject ?? null;
  const catalogSubject = subjects.find((item) => item.id === subjectFromRound?.id);
  const subject = hydrateSubject(subjectFromRound, catalogSubject);

  return (
    <AppFrame
      title={messages.brief.title}
      subtitle={messages.brief.subtitle}
      currentRound={currentRound}
    >
      <div className="grid gap-6 overflow-x-hidden xl:grid-cols-[1.35fr_0.65fr]">
        <Panel className="overflow-hidden" accent="cyan" eyebrow={messages.brief.fullSubject} title={subject ? messages.brief.currentSubject : messages.brief.pendingSubject}>
          {subject ? (
            <div className="space-y-6">
              <div className="min-w-0 rounded-2xl border border-cyan/20 bg-cyan/5 px-5 py-5">
                <p className="text-xs font-bold uppercase tracking-wider text-cyan">{messages.brief.statement}</p>
                <p className="break-safe mt-2 font-display text-2xl font-bold tracking-tight leading-tight text-text md:text-3xl">
                  {subject.title}
                </p>
                <p className="mt-4 text-base leading-7 text-text-muted">
                  {subject.brief || messages.brief.missingSummary}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="min-w-0 rounded-xl border border-cyan/20 bg-cyan/5 px-5 py-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-cyan">{messages.brief.expectedFile}</p>
                  <code className="code-break-safe mt-2 block text-sm font-bold tracking-tight leading-tight text-text md:text-base">
                    {subject.fileName}
                  </code>
                </div>

                <div className="min-w-0 rounded-xl border border-border bg-elevated/30 px-5 py-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-accent-light">{messages.brief.expectedFunction}</p>
                  <code className="code-break-safe mt-2 block text-sm font-semibold leading-tight text-text md:text-base">
                    {subject.functionName}
                  </code>
                </div>

                {subject.returns && (
                  <div className="min-w-0 rounded-xl border border-success/20 bg-success/5 px-5 py-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-success">{messages.brief.expectedOutput}</p>
                    <p className="mt-2 text-sm font-bold text-text">{subject.returns.type}</p>
                    <p className="mt-2 text-sm leading-6 text-text-muted">{subject.returns.description}</p>
                  </div>
                )}
              </div>

              {subject.parameters.length > 0 && (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-cyan">{messages.brief.inputs}</p>
                    <h3 className="mt-1 font-display text-xl font-bold tracking-tight text-text">{messages.brief.receivedParameters}</h3>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {subject.parameters.map((parameter) => (
                      <div key={parameter.name} className="min-w-0 rounded-xl border border-border bg-surface px-5 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-text">{parameter.name}</p>
                          <code className="rounded-md border border-border/60 bg-elevated px-2 py-1 text-xs text-accent-light">
                            {parameter.type}
                          </code>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-text-muted">{parameter.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {subject.constraints.length > 0 && (
                <div className="rounded-2xl border border-border bg-surface px-5 py-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-text-faint">{messages.brief.constraints}</p>
                  <ul className="mt-4 space-y-2 text-sm leading-6 text-text-muted">
                    {subject.constraints.map((constraint) => (
                      <li key={constraint} className="break-safe">
                        {constraint}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {subject.examples.length > 0 && (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-cyan">{messages.brief.examples}</p>
                    <h3 className="mt-1 font-display text-xl font-bold tracking-tight text-text">{messages.brief.exampleCases}</h3>
                  </div>
                  <div className="space-y-4">
                    {subject.examples.map((example) => (
                      <div key={example.title} className="rounded-2xl border border-border bg-surface px-5 py-5">
                        <p className="text-sm font-bold uppercase tracking-wider text-accent-light">{example.title}</p>
                        <div className="mt-4 grid gap-4 lg:grid-cols-2">
                          <div className="min-w-0 rounded-xl border border-border/60 bg-elevated/30 px-4 py-4">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-text-faint">Input</p>
                            <pre className="code-break-safe mt-3 m-0 font-inherit text-sm leading-6 text-text">
                              {buildExampleInput(example, subject.parameters)}
                            </pre>
                          </div>
                          <div className="min-w-0 rounded-xl border border-border/60 bg-elevated/30 px-4 py-4">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-text-faint">Output</p>
                            <pre className="code-break-safe mt-3 m-0 font-inherit text-sm leading-6 text-text">
                              {formatExampleValue(example.output)}
                            </pre>
                          </div>
                        </div>
                        {example.explanation && (
                          <div className="mt-4 rounded-xl border border-cyan/20 bg-cyan/5 px-4 py-4">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-cyan">{messages.brief.explanation}</p>
                            <p className="mt-3 text-sm leading-6 text-text-muted">{example.explanation}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-base text-text-muted">
              {messages.brief.noSubject}
            </p>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel eyebrow={messages.brief.round} title={currentRound?.name || messages.brief.currentRound}>
            <div className="space-y-3 text-sm text-text-muted">
              <div className="flex items-center justify-between">
                <span>{messages.brief.phase}</span>
                <span className="font-semibold text-text">{getRoundActionLabel(round.phase, locale)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{messages.brief.teams}</span>
                <span className="font-semibold text-text">{currentRound?.teamCount ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{messages.brief.registration}</span>
                <span className={`font-semibold ${round.registrationOpen ? "text-success" : "text-hot"}`}>
                  {round.registrationOpen ? messages.brief.open : messages.brief.closed}
                </span>
              </div>
            </div>
          </Panel>

          {subject?.prototype && (
            <Panel accent="cyan" eyebrow={messages.brief.signature} title={messages.brief.pythonPrototype}>
              <code className="code-break-safe block text-sm text-text md:text-base">
                {subject.prototype}
              </code>
            </Panel>
          )}
        </div>
      </div>
    </AppFrame>
  );
}
