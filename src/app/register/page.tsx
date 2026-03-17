"use client";

import Link from "next/link";
import { AppFrame } from "@/components/app-frame";
import { Panel } from "@/components/panel";
import { PublicTeam, TeamCreateResponse } from "@/lib/game-types";
import { getStoredTeamAccess, storeTeamAccess } from "@/lib/team-access";
import { FormEvent, useEffect, useMemo, useState } from "react";

export default function RegisterPage() {
  const [teamName, setTeamName] = useState("");
  const [memberNames, setMemberNames] = useState(["", "", ""]);
  const [teams, setTeams] = useState<PublicTeam[]>([]);
  const [myTeamCodes, setMyTeamCodes] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdTeam, setCreatedTeam] = useState<TeamCreateResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/teams", { cache: "no-store" });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { teams: PublicTeam[] };

        if (!cancelled) {
          setTeams(payload.teams.slice().reverse());
          setMyTeamCodes(Object.keys(getStoredTeamAccess()));
        }
      } catch {
        return;
      }
    }

    load();
    const interval = window.setInterval(load, 4000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const canSubmit = useMemo(
    () => teamName.trim().length > 1 && memberNames.every((name) => name.trim().length > 1),
    [memberNames, teamName]
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
        throw new Error(payload.error ?? "Impossible de creer l'equipe.");
      }

      storeTeamAccess(payload.team.teamCode, payload.editToken);
      setCreatedTeam(payload);
      setMyTeamCodes((current) => Array.from(new Set([payload.team.teamCode, ...current])));
      setTeams((current) => [payload.team, ...current]);
      setTeamName("");
      setMemberNames(["", "", ""]);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Impossible de creer l'equipe.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleMemberChange(index: number, value: string) {
    setMemberNames((current) => current.map((name, currentIndex) => (currentIndex === index ? value : name)));
  }

  return (
    <AppFrame
      title="Participant"
      subtitle="This screen is for team check-in. The flow is intentionally simple so a volunteer can register a trio in seconds and freeze the A / B / C order."
    >
      <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <Panel eyebrow="Check-In" title="Create A Team">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-fog">Team Name</span>
              <input
                className="signal-input"
                value={teamName}
                onChange={(event) => setTeamName(event.target.value)}
                placeholder="Ex: Heap Hustlers"
              />
            </label>

            <div className="grid gap-4">
              {memberNames.map((value, index) => (
                <label key={index} className="block">
                  <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-fog">
                    Player {index + 1} · Relay {String.fromCharCode(65 + index)}
                  </span>
                  <input
                    className="signal-input"
                    value={value}
                    onChange={(event) => handleMemberChange(index, event.target.value)}
                    placeholder={index === 0 ? "Lina" : index === 1 ? "Matteo" : "Sarah"}
                  />
                </label>
              ))}
            </div>

            <div className="rounded-[1.5rem] border border-lime/20 bg-lime/10 p-4 text-sm text-lime">
              Sans login: on genere un code equipe public et un token secret d'edition memorise sur cet appareil.
            </div>

            {error && <p className="text-sm text-signal">{error}</p>}

            <button className="signal-button" type="submit" disabled={!canSubmit || submitting}>
              {submitting ? "Creating..." : "Register Team"}
            </button>
          </form>
        </Panel>

        <div className="grid gap-6">
          <Panel eyebrow="My Access" title="Manage Links">
            <div className="grid gap-4">
              {createdTeam && (
                <article className="rounded-[1.6rem] border border-lime/20 bg-lime/10 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-4xl uppercase">{createdTeam.team.name}</h3>
                      <p className="text-xs uppercase tracking-[0.18em] text-fog">
                        Code equipe: {createdTeam.team.teamCode}
                      </p>
                    </div>
                    <Link className="signal-button" href={`/team/${createdTeam.team.teamCode}/manage`}>
                      Manage
                    </Link>
                  </div>
                  <p className="mt-4 text-sm text-lime">
                    Le token secret est stocke sur cet appareil. Le lien de gestion reste accessible ici.
                  </p>
                </article>
              )}

              {myTeamCodes.length === 0 && !createdTeam && (
                <p className="text-sm text-fog">Aucun acces memorise sur cet appareil pour le moment.</p>
              )}

              {teams
                .filter((team) => myTeamCodes.includes(team.teamCode))
                .map((team) => (
                  <article key={team.id} className="rounded-[1.6rem] border border-white/10 bg-white/5 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-4xl uppercase">{team.name}</h3>
                        <p className="text-xs uppercase tracking-[0.18em] text-fog">
                          {team.teamCode} · {team.station}
                        </p>
                      </div>
                      <Link className="ghost-button" href={`/team/${team.teamCode}/manage`}>
                        Open
                      </Link>
                    </div>
                  </article>
                ))}
            </div>
          </Panel>

          <Panel eyebrow="Registered" title="Tournament Queue">
            <div className="grid gap-4">
              {teams.length === 0 && <p className="text-sm text-fog">Aucune equipe enregistree pour le moment.</p>}
              {teams.map((team) => (
                <article key={team.id} className="rounded-[1.6rem] border border-white/10 bg-white/5 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-4xl uppercase">{team.name}</h3>
                      <p className="text-xs uppercase tracking-[0.18em] text-fog">
                        {team.teamCode} · creee le {new Date(team.createdAt).toLocaleString("fr-BE")}
                      </p>
                    </div>
                    <span className="rounded-full border border-signal/30 bg-signal/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-signal">
                      {team.locked ? "Locked" : "Editable"}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {team.members.map((member) => (
                      <div key={member.id} className="rounded-[1.2rem] border border-white/10 bg-black/20 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-fog">Relay {member.relayOrder}</p>
                        <p className="mt-2 text-lg text-sand">{member.name}</p>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </Panel>

          <Panel eyebrow="Rule Snapshot" title="Displayed To Teams">
            <ul className="space-y-3 text-sm text-fog">
              <li>5 min de reflexion collective avant le premier passage clavier.</li>
              <li>Relais de 2 min par joueur selon un ordre fixe A, B, C.</li>
              <li>Aucune communication avec le joueur au clavier pendant son tour.</li>
              <li>Le code equipe est public. Le lien d'edition est secret et propre a l'equipe.</li>
            </ul>
          </Panel>
        </div>
      </div>
    </AppFrame>
  );
}
