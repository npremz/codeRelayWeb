"use client";

import { AppFrame } from "@/components/app-frame";
import { Panel } from "@/components/panel";
import { PublicTeam } from "@/lib/game-types";
import { getStoredToken, storeTeamAccess } from "@/lib/team-access";
import { useLiveTeams } from "@/lib/use-live-teams";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

export default function ManageTeamPage() {
  const params = useParams<{ teamCode: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const teamCode = params.teamCode.toUpperCase();
  const queryToken = searchParams.get("token");

  const { currentRound } = useLiveTeams();

  const [token, setToken] = useState<string | null>(null);
  const [team, setTeam] = useState<PublicTeam | null>(null);
  const [teamName, setTeamName] = useState("");
  const [memberNames, setMemberNames] = useState(["", "", ""]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const nextToken = queryToken ?? getStoredToken(teamCode);

    if (!nextToken) {
      setLoading(false);
      setError("Ce lien d'administration doit être ouvert une première fois avec son token secret.");
      return;
    }

    storeTeamAccess(teamCode, nextToken);
    setToken(nextToken);

    if (queryToken) {
      router.replace(`/team/${teamCode}/manage`);
    }
  }, [queryToken, router, teamCode]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const accessToken = token;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/teams/${teamCode}/manage?token=${encodeURIComponent(accessToken)}`, {
          cache: "no-store"
        });

        const payload = (await response.json()) as { team?: PublicTeam; error?: string };

        if (!response.ok || !payload.team) {
          throw new Error(payload.error ?? "Accès refusé.");
        }

        if (!cancelled) {
          setTeam(payload.team);
          setTeamName(payload.team.name);
          setMemberNames(payload.team.members.map((member) => member.name));
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : "Impossible de charger l'équipe.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [teamCode, token]);

  const canSubmit = useMemo(
    () => teamName.trim().length > 1 && memberNames.length === 3 && memberNames.every((name) => name.trim().length > 1),
    [memberNames, teamName]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || !canSubmit) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/teams/${teamCode}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          token,
          name: teamName,
          members: memberNames
        })
      });

      const payload = (await response.json()) as { team?: PublicTeam; error?: string };

      if (!response.ok || !payload.team) {
        throw new Error(payload.error ?? "Impossible de mettre à jour l'équipe.");
      }

      setTeam(payload.team);
      setMessage("Équipe mise à jour.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Impossible de mettre à jour l'équipe.");
    } finally {
      setSaving(false);
    }
  }

  function handleMemberChange(index: number, value: string) {
    setMemberNames((current) => current.map((entry, currentIndex) => (currentIndex === index ? value : entry)));
  }

  const relayLabels = ["A", "B", "C"];
  const relayColors = [
    { bg: "bg-hot/10", text: "text-hot", border: "border-hot/20" },
    { bg: "bg-cyan/10", text: "text-cyan", border: "border-cyan/20" },
    { bg: "bg-accent/10", text: "text-accent-light", border: "border-accent/20" }
  ];

  return (
    <AppFrame
      title="Gestion équipe"
      subtitle="Modifier la composition de votre équipe"
      currentRound={currentRound}
    >
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        {/* ── Left column: Team info ─────────────────── */}
        <div className="space-y-6">
          <Panel accent="accent" eyebrow="Accès sécurisé" title={team ? `${team.name}` : teamCode}>
            {/* Loading */}
            {loading && (
              <div className="flex items-center gap-3 py-6">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                <p className="text-base text-text-muted">Chargement de l&apos;équipe...</p>
              </div>
            )}

            {/* Error — no team loaded */}
            {!loading && error && !team && (
              <div className="flex items-center gap-3 rounded-xl border border-hot/20 bg-hot/5 px-5 py-4 text-sm text-hot">
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                {error}
              </div>
            )}

            {/* Team details */}
            {!loading && team && (
              <div className="space-y-4">
                {/* Info rows */}
                <div className="rounded-xl border border-border bg-elevated/50 px-5 py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-muted">Code équipe</span>
                    <span className="font-mono text-base font-semibold text-accent-light">{team.teamCode}</span>
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-elevated/50 px-5 py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-muted">Station</span>
                    <span className="text-base text-text">{team.station}</span>
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-elevated/50 px-5 py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-muted">État</span>
                    <span className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                      team.locked
                        ? "border-hot/20 bg-hot/10 text-hot"
                        : "border-success/20 bg-success/10 text-success"
                    }`}>
                      {team.locked ? "Verrouillée" : "Éditable"}
                    </span>
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-elevated/50 px-5 py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-muted">Dernière mise à jour</span>
                    <span className="text-sm text-text">{new Date(team.updatedAt).toLocaleString("fr-BE")}</span>
                  </div>
                </div>

                {/* Current roster */}
                <div className="pt-3">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-faint">Composition actuelle</p>
                  <div className="grid grid-cols-3 gap-3">
                    {team.members.map((member, memberIndex) => (
                      <div key={member.id} className={`rounded-lg border ${relayColors[memberIndex].border} bg-surface px-4 py-3 text-center`}>
                        <p className={`text-xs font-semibold uppercase tracking-wider ${relayColors[memberIndex].text}`}>
                          Relais {member.relayOrder}
                        </p>
                        <p className="mt-1.5 text-sm font-medium text-text truncate">{member.name}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Locked warning */}
                {team.locked && (
                  <div className="rounded-xl border border-warn/20 bg-warn/5 px-5 py-4 text-sm leading-relaxed text-warn">
                    Cette équipe est verrouillée par l&apos;organisateur. Les modifications ne sont plus possibles.
                  </div>
                )}
              </div>
            )}
          </Panel>
        </div>

        {/* ── Right column: Edit form ────────────────── */}
        <div className="space-y-6">
          <Panel accent={team?.locked ? "hot" : "success"} eyebrow="Édition" title="Modifier l'équipe">
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
                  disabled={team?.locked}
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
                      placeholder={`Participant ${index + 1}`}
                      disabled={team?.locked}
                    />
                  </label>
                ))}
              </div>

              {/* Info about relay order */}
              <div className="rounded-xl border border-border bg-elevated/50 px-5 py-4 text-sm leading-relaxed text-text-muted">
                L&apos;ordre des relais (A → B → C) est fixe. Modifiez les noms pour réorganiser les rôles.
              </div>

              {/* Success message */}
              {message && (
                <div className="flex items-center gap-3 rounded-xl border border-success/20 bg-success/5 px-5 py-4 text-sm text-success">
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {message}
                </div>
              )}

              {/* Error message (when team loaded) */}
              {error && !loading && team && (
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
              <button
                className="signal-button w-full relative"
                type="submit"
                disabled={!canSubmit || saving || team?.locked}
              >
                {saving && (
                  <svg className="absolute left-4 h-5 w-5 animate-spin text-white/70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                <span>{saving ? "Enregistrement..." : team?.locked ? "Équipe verrouillée" : "Sauvegarder les modifications"}</span>
              </button>
            </form>
          </Panel>
        </div>
      </div>
    </AppFrame>
  );
}
