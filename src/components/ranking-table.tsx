import { Panel } from "@/components/panel";
import { getStatusLabel } from "@/lib/demo-game";
import { LiveTeam } from "@/lib/game-types";

type RankingTableProps = {
  teams: LiveTeam[];
  title?: string;
  eyebrow?: string;
  compact?: boolean;
};

export function RankingTable({
  teams,
  title = "Classement",
  eyebrow = "Leaderboard",
  compact = false
}: RankingTableProps) {
  if (teams.length === 0) {
    return (
      <Panel eyebrow={eyebrow} title={title}>
        <p className="text-sm text-fog">Aucune equipe classee pour le moment.</p>
      </Panel>
    );
  }

  return (
    <Panel eyebrow={eyebrow} title={title}>
      <div className="overflow-hidden rounded-[1.8rem] border border-white/10">
        <table className="w-full border-collapse">
          <thead className="bg-white/5 text-left text-xs uppercase tracking-[0.2em] text-fog">
            <tr>
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">Equipe</th>
              <th className="px-4 py-3">Etat</th>
              <th className="px-4 py-3">Actif</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr key={team.id} className="border-t border-white/10 text-sm text-sand">
                <td className="px-4 py-4 font-display text-3xl">{team.rank}</td>
                <td className="px-4 py-4">
                        <p className="font-semibold uppercase tracking-[0.12em]">{team.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-fog">
                    {team.station} · {team.teamCode ?? "NO-CODE"}
                  </p>
                </td>
                <td className="px-4 py-4 text-fog">{getStatusLabel(team.status)}</td>
                <td className="px-4 py-4">
                  {team.activeMember ? (
                    <span className="rounded-full border border-signal/30 bg-signal/10 px-3 py-1 text-xs uppercase tracking-[0.16em] text-signal">
                      {team.activeMember.name}
                    </span>
                  ) : (
                    <span className="text-fog">{team.submissionOrder ? `Soumise #${team.submissionOrder}` : "Stand-by"}</span>
                  )}
                </td>
                <td className={`px-4 py-4 text-right ${compact ? "font-semibold" : "font-display text-4xl"}`}>
                  {team.totalScore}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
