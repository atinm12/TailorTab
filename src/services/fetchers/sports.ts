import type { EspnEvent, EspnScoreboardResponse, EspnTeamResponse } from "../../types/api";
import type { SportsData, SportsGame, SportsParams } from "../../types/widget";

const BASE = "https://site.api.espn.com/apis/site/v2/sports";

function mapEvent(event: EspnEvent): SportsGame {
  const competition = event.competitions?.[0];
  return {
    name: event.shortName || event.name || "",
    shortDetail:
      competition?.status?.type?.shortDetail || event.status?.type?.shortDetail || "",
    competitors: (competition?.competitors ?? []).map((c) => ({
      name: c.team?.abbreviation || c.team?.displayName || "?",
      score: typeof c.score === "object" ? c.score?.displayValue : c.score,
      logo: c.team?.logo || c.team?.logos?.[0]?.href,
      winner: c.winner,
    })),
  };
}

export async function fetchSports(params: SportsParams, signal?: AbortSignal): Promise<SportsData> {
  const { sport, league, team, mode } = params;

  if (mode === "team" && team) {
    const res = await fetch(`${BASE}/${sport}/${league}/teams/${team}`, { signal });
    if (!res.ok) throw new Error(`Team "${team}" not found (${res.status})`);
    const json = (await res.json()) as EspnTeamResponse;
    if (!json.team) throw new Error("Unexpected ESPN response");
    return {
      kind: "sports",
      mode: "team",
      teamName: json.team.displayName,
      record: json.team.record?.items?.[0]?.summary,
      logo: json.team.logos?.[0]?.href,
      games: (json.team.nextEvent ?? []).slice(0, 3).map(mapEvent),
    };
  }

  const res = await fetch(`${BASE}/${sport}/${league}/scoreboard`, { signal });
  if (!res.ok) throw new Error(`Scoreboard for "${league}" unavailable (${res.status})`);
  const json = (await res.json()) as EspnScoreboardResponse;
  return {
    kind: "sports",
    mode: "scoreboard",
    games: (json.events ?? []).slice(0, 5).map(mapEvent),
  };
}
