"use client";

import { AppFrame } from "@/components/app-frame";
import { Panel } from "@/components/panel";
import { PublicTeam } from "@/lib/game-types";
import { getStoredToken, storeTeamAccess } from "@/lib/team-access";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

export default function ManageTeamPage() {
  const params = useParams<{ teamCode: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const teamCode = params.teamCode.toUpperCase();
  const queryToken = searchParams.get("token");

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
      setError("Ce lien d'administration doit etre ouvert une premiere fois avec son token secret.");
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
          throw new Error(payload.error ?? "Acces refuse.");
        }

        if (!cancelled) {
          setTeam(payload.team);
          setTeamName(payload.team.name);
          setMemberNames(payload.team.members.map((member) => member.name));
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : "Impossible de charger l'equipe.");
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
        throw new Error(payload.error ?? "Impossible de mettre a jour l'equipe.");
      }

      setTeam(payload.team);
      setMessage("Equipe mise a jour.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Impossible de mettre a jour l'equipe.");
    } finally {
      setSaving(false);
    }
  }

  function handleMemberChange(index: number, value: string) {
    setMemberNames((current) => current.map((entry, currentIndex) => (currentIndex === index ? value : entry)));
  }

  return (
    <AppFrame
      title="Manage Team"
      subtitle="Participant access without direct login. The team is editable from a secret token stored on this device after the first secure open."
    >
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Panel eyebrow="Secret Access" title={team ? `${team.name} · ${team.teamCode}` : teamCode}>
          {loading && <p className="text-sm text-fog">Chargement de l'equipe...</p>}
          {!loading && error && <p className="text-sm text-signal">{error}</p>}
          {!loading && team && (
            <div className="space-y-4 text-sm text-fog">
              <p>
                Station: <span className="text-sand">{team.station}</span>
              </p>
              <p>
                Etat: <span className="text-sand">{team.locked ? "Verrouillee" : "Editable"}</span>
              </p>
              <p>
                Derniere mise a jour:{" "}
                <span className="text-sand">{new Date(team.updatedAt).toLocaleString("fr-BE")}</span>
              </p>
            </div>
          )}
        </Panel>

        <Panel eyebrow="Team Setup" title="Edit Roster">
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
                    placeholder={`Participant ${index + 1}`}
                  />
                </label>
              ))}
            </div>

            {message && <p className="text-sm text-lime">{message}</p>}
            {error && !loading && <p className="text-sm text-signal">{error}</p>}

            <button className="signal-button" type="submit" disabled={!canSubmit || saving || team?.locked}>
              {saving ? "Saving..." : "Save Team"}
            </button>
          </form>
        </Panel>
      </div>
    </AppFrame>
  );
}
