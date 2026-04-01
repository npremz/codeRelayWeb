"use client";

import { AppFrame } from "@/components/app-frame";
import { useLocale } from "@/components/locale-provider";
import { Panel } from "@/components/panel";
import { MAX_TEAM_MEMBERS, MIN_TEAM_MEMBERS, PublicTeam, RELAY_SEAT_LABELS } from "@/lib/game-types";
import { formatCopy, getDateTimeLocale } from "@/lib/locale";
import { getStoredToken, storeTeamAccess } from "@/lib/team-access";
import { useLiveTeams } from "@/lib/use-live-teams";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

const DEFAULT_MEMBER_NAMES = ["", "", "", ""];
const RELAY_COLORS = [
  { bg: "bg-hot/10", text: "text-hot", border: "border-hot/20" },
  { bg: "bg-cyan/10", text: "text-cyan", border: "border-cyan/20" },
  { bg: "bg-accent/10", text: "text-accent-light", border: "border-accent/20" },
  { bg: "bg-success/10", text: "text-success", border: "border-success/20" }
];

function getRelayColor(index: number) {
  return RELAY_COLORS[index] ?? RELAY_COLORS[RELAY_COLORS.length - 1];
}

export default function ManageTeamPage() {
  const { locale, messages } = useLocale();
  const params = useParams<{ teamCode: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const teamCode = params.teamCode.toUpperCase();
  const queryToken = searchParams.get("token");

  const { currentRound } = useLiveTeams();

  const [token, setToken] = useState<string | null>(null);
  const [team, setTeam] = useState<PublicTeam | null>(null);
  const [teamName, setTeamName] = useState("");
  const [memberNames, setMemberNames] = useState(DEFAULT_MEMBER_NAMES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const nextToken = queryToken ?? getStoredToken(teamCode);

    if (!nextToken) {
      setLoading(false);
      setError(
        locale === "en"
          ? "This management link must be opened once with its secret token first."
          : "Ce lien d'administration doit être ouvert une première fois avec son token secret."
      );
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
          throw new Error(payload.error ?? (locale === "en" ? "Access denied." : "Accès refusé."));
        }

        if (!cancelled) {
          setTeam(payload.team);
          setTeamName(payload.team.name);
          setMemberNames(payload.team.members.map((member) => member.name));
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : (locale === "en" ? "Unable to load the team." : "Impossible de charger l'équipe."));
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
    () =>
      teamName.trim().length > 1 &&
      memberNames.length >= MIN_TEAM_MEMBERS &&
      memberNames.length <= MAX_TEAM_MEMBERS &&
      memberNames.every((name) => name.trim().length > 1),
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
        throw new Error(payload.error ?? (locale === "en" ? "Unable to update the team." : "Impossible de mettre à jour l'équipe."));
      }

      setTeam(payload.team);
      setMessage(messages.manage.updated);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : (locale === "en" ? "Unable to update the team." : "Impossible de mettre à jour l'équipe."));
    } finally {
      setSaving(false);
    }
  }

  function handleMemberChange(index: number, value: string) {
    setMemberNames((current) => current.map((entry, currentIndex) => (currentIndex === index ? value : entry)));
  }

  function addMember() {
    setMemberNames((current) =>
      current.length < MAX_TEAM_MEMBERS ? [...current, ""] : current
    );
  }

  function removeMember() {
    setMemberNames((current) =>
      current.length > MIN_TEAM_MEMBERS ? current.slice(0, -1) : current
    );
  }

  return (
    <AppFrame
      title={messages.manage.title}
      subtitle={messages.manage.subtitle}
      currentRound={currentRound}
    >
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        {/* ── Left column: Team info ─────────────────── */}
        <div className="space-y-6">
          <Panel accent="accent" eyebrow={messages.manage.secureAccess} title={team ? `${team.name}` : teamCode}>
            {/* Loading */}
            {loading && (
              <div className="flex items-center gap-3 py-6">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                <p className="text-base text-text-muted">{messages.manage.loading}</p>
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
                    <span className="text-sm text-text-muted">{messages.manage.teamCode}</span>
                    <span className="font-mono text-base font-semibold text-accent-light">{team.teamCode}</span>
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-elevated/50 px-5 py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-muted">{messages.manage.station}</span>
                    <span className="text-base text-text">{team.station}</span>
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-elevated/50 px-5 py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-muted">{messages.manage.status}</span>
                    <span className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                      team.locked
                        ? "border-hot/20 bg-hot/10 text-hot"
                        : "border-success/20 bg-success/10 text-success"
                    }`}>
                      {team.locked ? messages.manage.locked : messages.manage.editable}
                    </span>
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-elevated/50 px-5 py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-muted">{messages.manage.lastUpdate}</span>
                    <span className="text-sm text-text">{new Date(team.updatedAt).toLocaleString(getDateTimeLocale(locale))}</span>
                  </div>
                </div>

                {/* Current roster */}
                <div className="pt-3">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-faint">{messages.manage.rosterTitle}</p>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {team.members.map((member, memberIndex) => (
                      <div key={member.id} className={`rounded-lg border ${getRelayColor(memberIndex).border} bg-surface px-4 py-3 text-center`}>
                        <p className={`text-xs font-semibold uppercase tracking-wider ${getRelayColor(memberIndex).text}`}>
                          {formatCopy(messages.manage.relayLabel, { order: member.relayOrder })}
                        </p>
                        <p className="mt-1.5 text-sm font-medium text-text truncate">{member.name}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Locked warning */}
                {team.locked && (
                  <div className="rounded-xl border border-warn/20 bg-warn/5 px-5 py-4 text-sm leading-relaxed text-warn">
                    {messages.manage.lockedWarning}
                  </div>
                )}
              </div>
            )}
          </Panel>
        </div>

        {/* ── Right column: Edit form ────────────────── */}
        <div className="space-y-6">
          <Panel accent={team?.locked ? "hot" : "success"} eyebrow={messages.manage.editEyebrow} title={messages.manage.editTitle}>
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Team name */}
              <label className="block">
                <span className="mb-2.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
                  {messages.manage.teamName}
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
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">{messages.manage.players}</p>
                  <div className="flex gap-2">
                    <button
                      className="ghost-button px-3 py-2 text-xs"
                      onClick={removeMember}
                      disabled={team?.locked || memberNames.length <= MIN_TEAM_MEMBERS}
                      type="button"
                    >
                      {messages.manage.remove}
                    </button>
                    <button
                      className="ghost-button px-3 py-2 text-xs"
                      onClick={addMember}
                      disabled={team?.locked || memberNames.length >= MAX_TEAM_MEMBERS}
                      type="button"
                    >
                      {messages.manage.add}
                    </button>
                  </div>
                </div>
                {memberNames.map((value, index) => (
                  <label key={index} className="flex items-center gap-4">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${getRelayColor(index).bg} ${getRelayColor(index).text}`}>
                      {RELAY_SEAT_LABELS[index] ?? index + 1}
                    </div>
                    <input
                      className="signal-input"
                      value={value}
                      onChange={(event) => handleMemberChange(index, event.target.value)}
                      placeholder={formatCopy(messages.manage.participantPlaceholder, { index: index + 1 })}
                      disabled={team?.locked}
                    />
                  </label>
                ))}
                <p className="text-xs text-text-faint">
                  {formatCopy(messages.manage.membersHint, { min: MIN_TEAM_MEMBERS, max: MAX_TEAM_MEMBERS })}
                </p>
              </div>

              {/* Info about relay order */}
              <div className="rounded-xl border border-border bg-elevated/50 px-5 py-4 text-sm leading-relaxed text-text-muted">
                {messages.manage.relayInfo}
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
                <span>{saving ? messages.manage.saving : team?.locked ? messages.manage.lockedButton : messages.manage.save}</span>
              </button>
            </form>
          </Panel>
        </div>
      </div>
    </AppFrame>
  );
}
