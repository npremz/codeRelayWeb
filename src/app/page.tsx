"use client";

import Link from "next/link";
import { AppFrame } from "@/components/app-frame";
import { LiveNotificationBanner } from "@/components/live-notification-banner";
import { Panel } from "@/components/panel";
import { PhaseTimer } from "@/components/phase-timer";
import { RankingTable } from "@/components/ranking-table";
import { buildLiveTeams, getRelayState } from "@/lib/demo-game";
import { useRoundNotifications } from "@/lib/use-round-notifications";
import { useLiveTeams } from "@/lib/use-live-teams";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [now, setNow] = useState(0);
  const { teams: storedTeams, round } = useLiveTeams();

  useEffect(() => {
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const relayState = getRelayState(round, now);
  const notification = useRoundNotifications(relayState);
  const teams = buildLiveTeams(storedTeams, relayState);

  return (
    <AppFrame
      title="Control Room"
      subtitle="Aesthetic direction: industrial broadcast. The app is split into participant, organizer, judge and TV surfaces around a single match timeline."
    >
      <LiveNotificationBanner notification={notification} />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-6">
          <PhaseTimer state={relayState} />
          <div className="grid gap-6 md:grid-cols-2">
            <Panel eyebrow="MVP" title="What Is Already Framed">
              <ul className="space-y-3 text-sm text-fog">
                <li>Participant flow without login, using a public team code and secret edit token.</li>
                <li>Admin monitoring panel with live station roster from the app store.</li>
                <li>Judge cockpit aligned with the official rubric and persistent scoring.</li>
                <li>TV scoreboard consuming the same shared data source as the other screens.</li>
              </ul>
            </Panel>
            <Panel eyebrow="Next Step" title="Backend Hooks">
              <ul className="space-y-3 text-sm text-fog">
                <li>PostgreSQL et Prisma portent maintenant l'etat central du tournoi.</li>
                <li>Les surfaces live recoivent les updates en SSE depuis le backend.</li>
                <li>Les acces staff restent limites a `admin` et `judge`.</li>
                <li>Les timestamps de soumission pilotent le bonus rapidite automatiquement.</li>
              </ul>
            </Panel>
          </div>
        </div>
        <div className="grid gap-6">
          <Panel eyebrow="Data Source" title="Live Store">
            <p className="text-sm text-fog">
              {storedTeams.length === 0
                ? "Aucune equipe enregistree pour l'instant. Le tournoi attend encore ses inscriptions."
                : `${storedTeams.length} equipe(s) enregistree(s) dans le backend du tournoi.`}
            </p>
          </Panel>
          <Panel eyebrow="Quick Access" title="Screens">
            <div className="grid gap-3">
              {[
                { href: "/register", label: "Participant Registration", copy: "Create a team in seconds and keep access through a secret manage link." },
                { href: "/admin", label: "Organizer Board", copy: "Launch the round, watch stations and drive the timeline." },
                { href: "/judge", label: "Judge Cockpit", copy: "Persist scores against correction, edge cases, complexity and readability." },
                { href: "/results", label: "Public Results", copy: "Expose ranking, tie-break tuples and final ordering for teams and audience." },
                { href: "/tv", label: "TV Wall", copy: "Large-screen view for timer, ranking and live activity." }
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4 transition hover:border-signal/50 hover:bg-white/8"
                >
                  <p className="font-display text-3xl uppercase text-sand">{item.label}</p>
                  <p className="mt-2 text-sm text-fog">{item.copy}</p>
                </Link>
              ))}
            </div>
          </Panel>
          <RankingTable teams={teams.slice(0, 4)} compact />
        </div>
      </div>
    </AppFrame>
  );
}
