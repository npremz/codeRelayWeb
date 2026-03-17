import { formatClock } from "@/lib/demo-game";
import { Panel } from "@/components/panel";
import { RelayState } from "@/lib/game-types";

type PhaseTimerProps = {
  state: RelayState;
};

export function PhaseTimer({ state }: PhaseTimerProps) {
  const progress = Math.min(100, Math.round((state.elapsedMs / state.totalMs) * 100));

  return (
    <Panel eyebrow="Live Round" title={state.phaseLabel}>
      <div className="grid gap-5 md:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="font-display text-[5rem] leading-none text-sand md:text-[7rem]">
            {formatClock(state.remainingMs)}
          </p>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-signal transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-3 text-xs uppercase tracking-[0.24em] text-fog">
            {state.phase === "reflection"
              ? "Preparation libre avant isolement du joueur au clavier"
              : `Tranche ${state.currentSlice + 1} / 12`}
          </p>
        </div>
        <div className="grid gap-3">
          <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-fog">Rappel</p>
            <p className="mt-2 text-sm text-sand">
              {state.phase === "reflection"
                ? "Les 3 membres peuvent encore discuter et preparer le pseudo-code."
                : "Aucune communication avec le joueur au clavier. Rotation fixe A -> B -> C."}
            </p>
          </div>
          <div className="rounded-3xl border border-lime/20 bg-lime/10 p-4 text-lime">
            <p className="text-xs uppercase tracking-[0.24em]">Barème</p>
            <p className="mt-2 text-sm">40 correction, 20 edge cases, 20 complexite, 10 lisibilite, 10 rapidite.</p>
          </div>
        </div>
      </div>
    </Panel>
  );
}
