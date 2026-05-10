import React from "react";
import { useGetLeaderboard } from "@workspace/api-client-react";

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useGetLeaderboard();

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8 space-y-2">
        <h2 className="text-3xl font-bold text-white arcade-text-glow uppercase">Hall of Fame</h2>
        <p className="text-muted-foreground text-sm uppercase tracking-widest">Top hackers sorted by fewest attempts</p>
      </div>

      {isLoading ? (
        <div className="text-center flicker uppercase py-12 text-primary">Fetching Data...</div>
      ) : leaderboard && leaderboard.length > 0 ? (
        <div className="arcade-box bg-card p-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-border text-muted-foreground uppercase text-xs">
                <th className="p-4 font-normal">Rank</th>
                <th className="p-4 font-normal">Session ID</th>
                <th className="p-4 font-normal text-right">Tries</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, index) => (
                <tr 
                  key={entry.sessionId} 
                  className={`border-b border-border/30 hover:bg-white/5 transition-colors ${index === 0 ? 'text-primary font-bold arcade-text-glow' : 'text-white'}`}
                >
                  <td className="p-4 text-sm">
                    {index + 1}
                  </td>
                  <td className="p-4 font-mono text-sm opacity-80">
                    {entry.sessionId.slice(0, 8)}...
                  </td>
                  <td className="p-4 text-right text-sm">
                    {entry.guessCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center uppercase text-muted-foreground py-12 arcade-box bg-card">
          No records found.
        </div>
      )}
    </div>
  );
}
