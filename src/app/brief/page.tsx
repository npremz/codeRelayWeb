import { AppFrame } from "@/components/app-frame";
import { Panel } from "@/components/panel";
import { getRoundActionLabel } from "@/lib/demo-game";
import { getCurrentRoundSummary, getRoundState } from "@/lib/team-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function BriefPage() {
  const [currentRound, round] = await Promise.all([getCurrentRoundSummary(), getRoundState()]);
  const subject = currentRound?.subject ?? null;

  return (
    <AppFrame
      title="Brief"
      subtitle="Sujet public de la manche courante"
      currentRound={currentRound}
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel accent="cyan" eyebrow="Sujet" title={subject ? subject.title : "Sujet en attente"}>
          {subject ? (
            <div className="space-y-5">
              <div className="rounded-xl border border-cyan/20 bg-cyan/5 px-5 py-4">
                <p className="text-xs font-bold uppercase tracking-wider text-cyan">Fichier attendu</p>
                <p className="mt-2 font-display text-3xl font-bold tracking-tight text-text">
                  {subject.fileName}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-elevated/30 px-5 py-4">
                <p className="text-xs font-bold uppercase tracking-wider text-accent-light">Fonction attendue</p>
                <p className="mt-2 text-lg font-semibold text-text">{subject.functionName}</p>
              </div>

              <div className="rounded-xl border border-border bg-surface px-5 py-5">
                <p className="text-xs font-bold uppercase tracking-wider text-text-faint">Énoncé</p>
                <p className="mt-3 text-base leading-7 text-text-muted">
                  {subject.brief || "Le brief textuel n'est pas encore renseigné pour ce sujet."}
                </p>
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

          <Panel accent="warn" eyebrow="Note" title="Contenu public">
            <p className="text-sm leading-6 text-text-muted">
              Cette page expose uniquement le brief public, le nom du fichier à rendre et la signature attendue.
              Les tests de validation et les cas cachés restent côté jury.
            </p>
          </Panel>
        </div>
      </div>
    </AppFrame>
  );
}
