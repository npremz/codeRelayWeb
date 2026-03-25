import { AppFrame } from "@/components/app-frame";
import { Panel } from "@/components/panel";
import { getRoundActionLabel } from "@/lib/demo-game";
import { listPublicSubjects } from "@/lib/subject-catalog";
import { getCurrentRoundSummary, getRoundState } from "@/lib/team-store";
import { RoundSubject } from "@/lib/game-types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function buildFullSubjectText(subject: RoundSubject) {
  return [
    `Titre: ${subject.title}`,
    "",
    `Fichier attendu: ${subject.fileName}`,
    `Fonction attendue: ${subject.functionName}`,
    ...(subject.prototype ? [`Prototype: ${subject.prototype}`] : []),
    "",
    subject.brief || "Le brief textuel n'est pas encore renseigné pour ce sujet."
  ].join("\n");
}

export default async function BriefPage() {
  const [currentRound, round, subjects] = await Promise.all([
    getCurrentRoundSummary(),
    getRoundState(),
    listPublicSubjects()
  ]);
  const subjectFromRound = currentRound?.subject ?? null;
  const catalogSubject = subjects.find((item) => item.id === subjectFromRound?.id);
  const subject = subjectFromRound
    ? {
        ...subjectFromRound,
        prototype: subjectFromRound.prototype ?? catalogSubject?.prototype
      }
    : null;

  return (
    <AppFrame
      title="Brief"
      subtitle="Sujet public de la manche courante"
      currentRound={currentRound}
    >
      <div className="grid gap-6 overflow-x-hidden xl:grid-cols-[1.35fr_0.65fr]">
        <Panel className="overflow-hidden" accent="cyan" eyebrow="Sujet Complet" title={subject ? "Sujet en cours" : "Sujet en attente"}>
          {subject ? (
            <div className="space-y-5">
              <div className="min-w-0 rounded-2xl border border-cyan/20 bg-cyan/5 px-5 py-5">
                <p className="text-xs font-bold uppercase tracking-wider text-cyan">Titre</p>
                <p className="mt-2 font-display text-2xl font-bold tracking-tight leading-tight text-text md:text-3xl" style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}>
                  {subject.title}
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="min-w-0 overflow-hidden rounded-xl border border-cyan/20 bg-cyan/5 px-5 py-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-cyan">Fichier attendu</p>
                  <code
                    className="mt-2 block max-w-full whitespace-normal text-sm font-bold tracking-tight leading-tight text-text md:text-base"
                    style={{ wordBreak: "break-all", overflowWrap: "anywhere" }}
                  >
                    {subject.fileName}
                  </code>
                </div>

                <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-elevated/30 px-5 py-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-accent-light">Fonction attendue</p>
                  <code
                    className="mt-2 block max-w-full whitespace-normal text-sm font-semibold leading-tight text-text md:text-base"
                    style={{ wordBreak: "break-all", overflowWrap: "anywhere" }}
                  >
                    {subject.functionName}
                  </code>
                  {subject.prototype && (
                    <div className="mt-3 min-w-0 rounded-lg border border-border/60 bg-surface px-3 py-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-text-faint">Prototype</p>
                      <code
                        className="mt-1 block max-w-full whitespace-normal text-xs text-text md:text-sm"
                        style={{ wordBreak: "break-all", overflowWrap: "anywhere" }}
                      >
                        {subject.prototype}
                      </code>
                    </div>
                  )}
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-border bg-surface px-5 py-5">
                <p className="text-xs font-bold uppercase tracking-wider text-text-faint">Énoncé intégral</p>
                <pre
                  className="mt-4 m-0 whitespace-pre-wrap font-inherit text-base leading-7 text-text-muted"
                  style={{ wordBreak: "break-all", overflowWrap: "anywhere" }}
                >
                  {buildFullSubjectText(subject)}
                </pre>
              </div>
            </div>
          ) : (
            <p className="text-base text-text-muted">
              Aucun sujet n'est encore publié pour la manche courante.
            </p>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel eyebrow="Manche" title={currentRound?.name || "Manche courante"}>
            <div className="space-y-3 text-sm text-text-muted">
              <div className="flex items-center justify-between">
                <span>Phase</span>
                <span className="font-semibold text-text">{getRoundActionLabel(round.phase)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Équipes</span>
                <span className="font-semibold text-text">{currentRound?.teamCount ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Inscriptions</span>
                <span className={`font-semibold ${round.registrationOpen ? "text-success" : "text-hot"}`}>
                  {round.registrationOpen ? "Ouvertes" : "Fermées"}
                </span>
              </div>
            </div>
          </Panel>

          <Panel accent="warn" eyebrow="Diffusion" title="Version Affichée">
            <p className="text-sm leading-6 text-text-muted">
              Cette vue affiche maintenant l'énoncé public complet du sujet en cours, avec le titre, le fichier
              attendu, la fonction à implémenter et tout le texte du brief.
            </p>
          </Panel>

          <Panel accent="warn" eyebrow="Note" title="Contenu public">
            <p className="text-sm leading-6 text-text-muted">
              Les tests de validation détaillés, les cas cachés et la grille d'évaluation restent côté jury.
            </p>
          </Panel>
        </div>
      </div>
    </AppFrame>
  );
}
