import "server-only";

import { LiveTeamsResponse } from "@/lib/game-types";
import { getCurrentRoundSummary, getRoundState, listRounds, listStoredTeams } from "@/lib/team-store";

export async function getLiveSnapshot(): Promise<LiveTeamsResponse> {
  const [teams, round, currentRound, rounds] = await Promise.all([
    listStoredTeams(),
    getRoundState(),
    getCurrentRoundSummary(),
    listRounds()
  ]);

  return {
    teams,
    round,
    currentRound,
    rounds,
    usingDemoData: false
  };
}
