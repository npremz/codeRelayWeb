"use client";

import Link from "next/link";
import { AppFrame } from "@/components/app-frame";
import { Panel } from "@/components/panel";
import { getStoredTeamAccess, storeTeamAccess } from "@/lib/team-access";
import { TeamCreateResponse } from "@/lib/game-types";
import { useLiveTeams } from "@/lib/use-live-teams";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Key, Users } from "lucide-react";

export default function RegisterPage() {
  const [teamName, setTeamName] = useState("");
  const [memberNames, setMemberNames] = useState(["", "", ""]);
  const [myTeamCodes, setMyTeamCodes] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdTeam, setCreatedTeam] = useState<TeamCreateResponse | null>(null);
  const { teams, round, currentRound, refresh } = useLiveTeams();

  useEffect(() => {
    setMyTeamCodes(Object.keys(getStoredTeamAccess()));
  }, []);

  const canSubmit = useMemo(
    () => round.registrationOpen && teamName.trim().length > 1 && memberNames.every((name) => name.trim().length > 1),
    [memberNames, round.registrationOpen, teamName]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: teamName,
          members: memberNames
        })
      });

      const payload = (await response.json()) as TeamCreateResponse & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Impossible de créer l'équipe.");
      }

      storeTeamAccess(payload.team.teamCode, payload.editToken);
      setCreatedTeam(payload);
      setMyTeamCodes((current) => Array.from(new Set([payload.team.teamCode, ...current])));
      await refresh();
      setTeamName("");
      setMemberNames(["", "", ""]);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Impossible de créer l'équipe.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleMemberChange(index: number, value: string) {
    setMemberNames((current) => current.map((name, currentIndex) => (currentIndex === index ? value : name)));
  }

  const relayLabels = ["A", "B", "C"];
  const placeholders = ["Lina", "Matteo", "Sarah"];
  const relayColors = [
    { bg: "bg-hot/10", text: "text-hot", border: "border-hot/20" },
    { bg: "bg-cyan/10", text: "text-cyan", border: "border-cyan/20" },
    { bg: "bg-accent/10", text: "text-accent-light", border: "border-accent/20" }
  ];
  const myTeams = teams.filter((team) => myTeamCodes.includes(team.teamCode));

  return (
    <AppFrame
      title="Inscription"
      subtitle="Enregistrement des équipes"
      currentRound={currentRound}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        {/* ── Left column: Registration form ──────────────── */}
        <div className="space-y-6">
          <Panel accent="accent" eyebrow="Check-in" title="Créer une équipe">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Team name */}
              <label className="block">
                <span className="mb-2.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Nom de l&apos;équipe
                </span>
                <input
                  className="signal-input"
                  value={teamName}
                  onChange={(event) => setTeamName(event.target.value)}
                  placeholder="Ex: Heap Hustlers"
                />
              </label>

              {/* Player inputs */}
              <div className="space-y-3.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Joueurs</p>
                {memberNames.map((value, index) => (
                  <label key={index} className="flex items-center gap-4">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${relayColors[index].bg} ${relayColors[index].text}`}>
                      {relayLabels[index]}
                    </div>
                    <input
                      className="signal-input"
                      value={value}
                      onChange={(event) => handleMemberChange(index, event.target.value)}
                      placeholder={placeholders[index]}
                    />
                  </label>
                ))}
              </div>

              {/* Registration status indicator */}
              <div className={`flex items-center gap-3 rounded-xl border px-5 py-4 text-sm font-medium ${
                round.registrationOpen
                  ? "border-success/20 bg-success/5 text-success"
                  : "border-hot/20 bg-hot/5 text-hot"
              }`}>
                <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${
                  round.registrationOpen ? "bg-success animate-pulse-glow" : "bg-hot"
                }`} />
                Inscriptions {round.registrationOpen ? "ouvertes" : "fermées"}
              </div>

              {/* Info box */}
              <div className="rounded-xl border border-border bg-elevated/50 px-5 py-4 text-sm leading-relaxed text-text-muted">
                Sans login : on génère un code équipe public et un token secret d&apos;édition mémorisé sur cet appareil.
              </div>

              {/* Error message */}
              {error && (
                <div className="flex items-center gap-3 rounded-xl border border-hot/20 bg-hot/5 px-5 py-4 text-sm text-hot">
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button className="signal-button w-full relative" type="submit" disabled={!canSubmit || submitting}>
                {submitting && (
                  <svg className="absolute left-4 h-5 w-5 animate-spin text-white/70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                <span>{submitting ? "Création..." : round.registrationOpen ? "Inscrire l'équipe" : "Inscriptions fermées"}</span>
              </button>
            </form>
          </Panel>

          {/* ── Success card ──────────────────────────── */}
          {createdTeam && (
            <div className="animate-slide-up rounded-2xl border border-success/25 bg-success/5 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-success">Équipe créée</p>
                  <h3 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-text">{createdTeam.team.name}</h3>
                  <p className="mt-2 text-sm text-text-muted">
                    Code : <span className="font-mono text-base font-semibold text-text">{createdTeam.team.teamCode}</span>
                  </p>
                </div>
                <Link
                  className="signal-button shrink-0"
                  href={`/team/${createdTeam.team.teamCode}/manage`}
                >
                  Gérer
                </Link>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-text-muted">
                Le token secret est stocké sur cet appareil. Le lien de gestion reste accessible ci-dessous.
              </p>
            </div>
          )}

          {/* ── My access links ──────────────────────── */}
          <Panel eyebrow="Mes accès" title="Liens de gestion">
            {myTeams.length === 0 && !createdTeam && (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="mb-3 text-text-faint/40"><Key size={48} strokeWidth={1} /></div>
                <p className="text-sm text-text-muted">Aucun accès mémorisé sur cet appareil pour le moment.</p>
              </div>
            )}
            <div className="space-y-3">
              {myTeams.map((team) => (
                <div key={team.id} className="flex items-center justify-between gap-4 rounded-xl border border-border bg-elevated/50 px-5 py-4">
                  <div className="min-w-0">
                    <p className="font-display text-base font-semibold tracking-tight text-text truncate">{team.name}</p>
                    <p className="mt-0.5 text-sm text-text-faint">
                      {team.teamCode} · {team.station}
                    </p>
                  </div>
                  <Link
                    className="ghost-button shrink-0"
                    href={`/team/${team.teamCode}/manage`}
                  >
                    Ouvrir
                  </Link>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* ── Right column: Registered teams + Rules ──── */}
        <div className="space-y-6">
          <Panel eyebrow="Tournoi" title="Équipes inscrites">
            {teams.length === 0 && (
              <div className="flex flex-col items-center py-10 text-center">
                <div className="mb-3 text-text-faint/40"><Users size={48} strokeWidth={1} /></div>
                <p className="text-base text-text-muted">Aucune équipe enregistrée pour le moment.</p>
              </div>
            )}
            <div className="space-y-4">
              {[...teams].reverse().map((team) => (
                <article key={team.id} className="rounded-xl border border-border bg-elevated/30 p-5 transition-colors hover:border-border-hover">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-display text-lg font-bold tracking-tight text-text truncate">{team.name}</p>
                      <p className="mt-1 text-sm text-text-faint">
                        {team.teamCode} · {new Date(team.createdAt).toLocaleString("fr-BE")}
                      </p>
                    </div>
                    <span className={`shrink-0 inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                      team.locked
                        ? "border-hot/20 bg-hot/10 text-hot"
                        : "border-success/20 bg-success/10 text-success"
                    }`}>
                      {team.locked ? "Verrouillée" : "Éditable"}
                    </span>
                  </div>

                  {/* Relay members grid */}
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {team.members.map((member, memberIndex) => (
                      <div key={member.id} className={`rounded-lg border ${relayColors[memberIndex].border} bg-surface px-4 py-3`}>
                        <p className={`text-xs font-semibold uppercase tracking-wider ${relayColors[memberIndex].text}`}>
                          Relais {member.relayOrder}
                        </p>
                        <p className="mt-1.5 text-sm font-medium text-text truncate">{member.name}</p>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </Panel>

          <Panel accent="success" eyebrow="Règlement" title="Rappel des règles">
            <ul className="space-y-4 text-sm leading-relaxed text-text-muted">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-base text-cyan">→</span>
                <span>5 min de réflexion collective avant le premier passage clavier.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-base text-cyan">→</span>
                <span>Relais de 2 min par joueur selon un ordre fixe A, B, C.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-base text-cyan">→</span>
                <span>Aucune communication avec le joueur au clavier pendant son tour.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-base text-cyan">→</span>
                <span>Le code équipe est public. Le lien d&apos;édition est secret et propre à l&apos;équipe.</span>
              </li>
            </ul>
          </Panel>
        </div>
      </div>
    </AppFrame>
  );
}
