import { Panel } from "@/components/panel";
import { formatTieBreakTuple, getStatusLabel } from "@/lib/demo-game";
import { LiveTeam } from "@/lib/game-types";
import { Trophy, Medal } from "lucide-react";

type RankingTableProps = {
  teams: LiveTeam[];
  title?: string;
  eyebrow?: string;
  compact?: boolean;
};

function getRankBadge(rank: number) {
  if (rank === 1) return { bg: "bg-warn/15 text-warn border-warn/25", icon: <Trophy size={16} /> };
  if (rank === 2) return { bg: "bg-text-muted/10 text-text-muted border-text-muted/20", icon: <Medal size={16} /> };
  if (rank === 3) return { bg: "bg-hot/10 text-hot border-hot/20", icon: <Medal size={16} /> };
  return { bg: "bg-elevated text-text-faint border-border", icon: null };
}

function getStatusBadge(status: string) {
  switch (status) {
    case "Inscrite":
      return "bg-text-faint/10 text-text-faint border-text-faint/20";
    case "Prete":
      return "bg-cyan/10 text-cyan border-cyan/20";
    case "En codage":
      return "bg-hot/10 text-hot border-hot/20";
    case "Soumise":
      return "bg-accent/10 text-accent-light border-accent/20";
    case "Corrigee":
      return "bg-success/10 text-success border-success/20";
    default:
      return "bg-elevated text-text-muted border-border";
  }
}

export function RankingTable({
  teams,
  title = "Classement",
  eyebrow = "Leaderboard",
  compact = false
}: RankingTableProps) {
  if (teams.length === 0) {
    return (
      <Panel eyebrow={eyebrow} title={title}>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 text-text-faint/40"><Trophy size={48} strokeWidth={1} /></div>
          <p className="text-base text-text-muted">Aucune équipe classée pour le moment</p>
        </div>
      </Panel>
    );
  }

  return (
    <Panel eyebrow={eyebrow} title={title} noPad>
      <div className="overflow-x-auto overflow-y-hidden rounded-b-2xl">
        <table className="w-full min-w-[320px] border-collapse">
          <thead>
            <tr className="border-b border-border bg-elevated/50">
              <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-text-faint">#</th>
              <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-text-faint">Équipe</th>
              {!compact && (
                <th className="hidden px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-text-faint md:table-cell">Statut</th>
              )}
              {!compact && (
                <th className="hidden px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-text-faint lg:table-cell">Joueur actif</th>
              )}
              <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-text-faint">Total</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => {
              const rankBadge = getRankBadge(team.rank);
              const statusLabel = getStatusLabel(team.status);
              const statusBadge = getStatusBadge(statusLabel);

              return (
                <tr key={team.id} className="border-b border-border/50 transition-colors hover:bg-elevated/30">
                  <td className="px-5 py-4">
                    <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-bold ${rankBadge.bg}`}>
                      {rankBadge.icon || team.rank}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-display text-base font-bold tracking-tight text-text">{team.name}</p>
                    <p className="mt-0.5 text-sm text-text-faint">
                      {team.station} · {team.teamCode ?? "—"}
                    </p>
                    {team.tieBreakNote && (
                      <p className="mt-1 text-xs font-semibold text-accent-light">{team.tieBreakNote}</p>
                    )}
                  </td>
                  {!compact && (
                    <td className="hidden px-5 py-4 md:table-cell">
                      <span className={`inline-flex items-center rounded-lg border px-3 py-1 text-xs font-semibold ${statusBadge}`}>
                        {statusLabel}
                      </span>
                    </td>
                  )}
                  {!compact && (
                    <td className="hidden px-5 py-4 lg:table-cell">
                      {team.activeMember ? (
                        <span className="inline-flex items-center gap-2 text-sm text-hot">
                          <span className="inline-block h-2 w-2 rounded-full bg-hot animate-pulse-glow" />
                          {team.activeMember.name}
                        </span>
                      ) : (
                        <span className="text-sm text-text-faint">
                          {team.submissionOrder ? `Soumise #${team.submissionOrder}` : "—"}
                        </span>
                      )}
                    </td>
                  )}
                  <td className="px-5 py-4 text-right">
                    <span className={`font-display text-2xl font-bold tracking-tight ${
                      team.rank === 1 ? "text-warn" : "text-text"
                    }`}>
                      {team.totalScore}
                    </span>
                    {!compact && (
                      <p className="mt-0.5 text-xs text-text-faint">
                        {formatTieBreakTuple(team)}
                      </p>
                    )}
                    {!compact && team.carryOverScore > 0 && (
                      <p className="mt-0.5 text-xs text-text-faint">
                        {team.carryOverScore} reportés + {team.roundScore} sur cette manche
                      </p>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
