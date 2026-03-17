import "server-only";

import { LiveTeamsResponse } from "@/lib/game-types";
import { getRoundState, listStoredTeams } from "@/lib/team-store";

export async function getLiveSnapshot(): Promise<LiveTeamsResponse> {
  const [teams, round] = await Promise.all([listStoredTeams(), getRoundState()]);

  return {
    teams,
    round,
    usingDemoData: false
  };
}
