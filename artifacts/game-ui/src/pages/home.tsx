import React, { useState, useRef, useEffect } from "react";
import { useStartGame, useSubmitGuess, useGetGameState, getGetGameStateQueryKey, getGetLeaderboardQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Home() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [guessInput, setGuessInput] = useState<string>("");
  const queryClient = useQueryClient();

  const startGameMutation = useStartGame();
  const submitGuessMutation = useSubmitGuess();

  const { data: gameState, isLoading: isGameStateLoading } = useGetGameState(sessionId ?? "", {
    query: {
      enabled: !!sessionId,
      queryKey: getGetGameStateQueryKey(sessionId ?? ""),
    }
  });

  const handleStartGame = () => {
    startGameMutation.mutate(undefined, {
      onSuccess: (data) => {
        setSessionId(data.sessionId);
        setGuessInput("");
      }
    });
  };

  const handleSubmitGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId || !guessInput) return;
    
    const num = parseInt(guessInput, 10);
    if (isNaN(num)) return;

    submitGuessMutation.mutate({ data: { sessionId, guess: num } }, {
      onSuccess: (result) => {
        setGuessInput("");
        // Update game state in cache manually or let it refetch
        queryClient.setQueryData(getGetGameStateQueryKey(sessionId), (old: any) => {
          if (!old) return old;
          return {
            ...old,
            status: result.status,
            guessCount: result.guessCount,
            guesses: result.guesses,
            lastHint: result.hint,
            secretNumber: result.secretNumber,
          };
        });

        if (result.status === "won") {
          queryClient.invalidateQueries({ queryKey: getGetLeaderboardQueryKey() });
        }
      }
    });
  };

  if (!sessionId) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold arcade-text-glow text-white">READY PLAYER ONE</h2>
          <p className="text-muted-foreground text-sm uppercase tracking-widest max-w-sm">
            Guess the secret code between 1 and 100. You have 10 attempts to breach the system.
          </p>
        </div>
        <button 
          onClick={handleStartGame}
          disabled={startGameMutation.isPending}
          className="arcade-button bg-primary text-primary-foreground px-8 py-4 text-xl font-bold"
          data-testid="button-start-game"
        >
          {startGameMutation.isPending ? "INITIALIZING..." : "START NEW GAME"}
        </button>
      </div>
    );
  }

  if (isGameStateLoading) {
    return <div className="flex-1 flex items-center justify-center flicker uppercase">Loading System...</div>;
  }

  if (!gameState) {
    return <div className="flex-1 flex items-center justify-center uppercase text-destructive">System Error</div>;
  }

  const isGameOver = gameState.status === "won" || gameState.status === "lost";
  const { lastHint } = gameState;

  return (
    <div className="flex flex-col flex-1 max-w-md w-full mx-auto animate-in fade-in zoom-in duration-300">
      
      {/* HUD */}
      <div className="flex justify-between items-center bg-card arcade-box p-4 mb-8">
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground uppercase">Target</div>
          <div className="text-sm font-bold text-white">
            {gameState.minRange} - {gameState.maxRange}
          </div>
        </div>
        <div className="text-center space-y-1">
          <div className="text-xs text-muted-foreground uppercase">Status</div>
          <div className={`text-sm font-bold uppercase ${gameState.status === 'active' ? 'text-accent' : gameState.status === 'won' ? 'text-primary' : 'text-destructive'}`}>
            {gameState.status}
          </div>
        </div>
        <div className="space-y-1 text-right">
          <div className="text-xs text-muted-foreground uppercase">Attempts</div>
          <div className="text-sm font-bold text-white">
            {gameState.guessCount} / {gameState.maxGuesses}
          </div>
        </div>
      </div>

      {/* Main Action Area */}
      <div className="flex flex-col items-center justify-center flex-1 space-y-8">
        
        {/* Hint Display */}
        <div className="h-24 flex items-center justify-center w-full">
          {lastHint && (
            <div className={`text-3xl font-bold uppercase tracking-widest text-center animate-in slide-in-from-bottom-4 fade-in duration-300 ${
              lastHint === 'correct' ? 'text-primary arcade-text-glow scale-110 transition-transform' : 
              lastHint === 'lost' ? 'text-destructive arcade-text-glow' : 
              'text-accent'
            }`}>
              {lastHint.replace('_', ' ')}
            </div>
          )}
        </div>

        {/* Input Form */}
        {!isGameOver ? (
          <form onSubmit={handleSubmitGuess} className="w-full space-y-4 flex flex-col items-center">
            <input
              type="number"
              min={gameState.minRange}
              max={gameState.maxRange}
              value={guessInput}
              onChange={(e) => setGuessInput(e.target.value)}
              className="bg-input border-2 border-border text-foreground p-4 text-center text-3xl font-bold w-full max-w-[200px] focus:outline-none focus:border-primary transition-colors arcade-box"
              placeholder="000"
              autoFocus
              data-testid="input-guess"
            />
            <button 
              type="submit" 
              disabled={submitGuessMutation.isPending || !guessInput}
              className="arcade-button bg-secondary text-secondary-foreground px-8 py-3 font-bold w-full max-w-[200px] disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-submit-guess"
            >
              {submitGuessMutation.isPending ? "SUBMITTING..." : "SUBMIT"}
            </button>
          </form>
        ) : (
          <div className="w-full flex flex-col items-center space-y-6 animate-in zoom-in duration-500">
            {gameState.status === "lost" && (
              <div className="text-center space-y-2">
                <div className="text-sm text-muted-foreground uppercase">Secret Code Was</div>
                <div className="text-4xl text-destructive font-bold arcade-text-glow">
                  {(gameState as any).secretNumber || "???"}
                </div>
              </div>
            )}
            {gameState.status === "won" && (
              <div className="text-center space-y-2">
                <div className="text-sm text-muted-foreground uppercase">Hacked In</div>
                <div className="text-4xl text-primary font-bold arcade-text-glow">
                  {gameState.guessCount} TRIES
                </div>
              </div>
            )}
            <button 
              onClick={handleStartGame}
              className="arcade-button bg-primary text-primary-foreground px-8 py-4 font-bold mt-4"
              data-testid="button-play-again"
            >
              PLAY AGAIN
            </button>
          </div>
        )}

      </div>

      {/* History Log */}
      <div className="mt-8 space-y-2">
        <div className="text-xs text-muted-foreground uppercase border-b-2 border-border pb-2 mb-4">Guess Log</div>
        <div className="flex flex-wrap gap-2">
          {gameState.guesses.map((g, i) => (
            <div key={i} className="bg-card border border-border px-3 py-1 text-sm font-bold text-white/80">
              {g}
            </div>
          ))}
          {gameState.guesses.length === 0 && (
            <div className="text-xs text-muted-foreground/50 italic">No entries yet.</div>
          )}
        </div>
      </div>

    </div>
  );
}
