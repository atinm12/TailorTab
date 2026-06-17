import type { SportsData } from "../../types/widget";

export function SportsWidget({ data }: { data: SportsData }) {
  return (
    <div className="sports-widget">
      {data.mode === "team" && (
        <div className="sports-team-row">
          {data.logo && <img className="sports-logo" src={data.logo} alt="" />}
          <div>
            <p className="sports-team-name">{data.teamName}</p>
            {data.record && <p className="widget-muted">Record: {data.record}</p>}
          </div>
        </div>
      )}
      {data.games.length === 0 ? (
        <p className="widget-muted">
          {data.mode === "team" ? "No upcoming games." : "No games scheduled."}
        </p>
      ) : (
        <ul className="sports-games">
          {data.games.map((game, i) => (
            <li key={`${game.name}-${i}`} className="sports-game">
              <div className="sports-matchup">
                {game.competitors.map((c, j) => (
                  <span key={`${c.name}-${j}`} className={`sports-competitor ${c.winner ? "winner" : ""}`}>
                    {c.logo && <img className="sports-mini-logo" src={c.logo} alt="" />}
                    {c.name}
                    {c.score !== undefined && <strong className="sports-score">{c.score}</strong>}
                    {j < game.competitors.length - 1 && <span className="sports-vs">@</span>}
                  </span>
                ))}
              </div>
              <span className="sports-detail">{game.shortDetail}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
