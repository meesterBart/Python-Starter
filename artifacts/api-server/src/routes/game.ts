import { Router, type IRouter } from "express";
import { spawn } from "child_process";
import path from "path";
import {
  SubmitGuessBody,
  SubmitGuessResponse,
  GetGameStateParams,
  GetGameStateResponse,
  GetLeaderboardResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const GAME_PY = path.resolve(process.cwd(), "../../game.py");
const MIN_RANGE = 1;
const MAX_RANGE = 100;
const MAX_GUESSES = 10;

interface Session {
  sessionId: string;
  secret: number;
  status: "active" | "won" | "lost";
  guessCount: number;
  guesses: number[];
  lastHint: string | null;
}

const sessions = new Map<string, Session>();
const leaderboard: Array<{ sessionId: string; guessCount: number; minRange: number; maxRange: number }> = [];

function runPython(args: string[]): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const proc = spawn("python3", [GAME_PY, ...args]);
    let out = "";
    let err = "";
    proc.stdout.on("data", (d: Buffer) => { out += d.toString(); });
    proc.stderr.on("data", (d: Buffer) => { err += d.toString(); });
    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Python exited ${code}: ${err}`));
        return;
      }
      try {
        resolve(JSON.parse(out.trim()));
      } catch {
        reject(new Error(`Invalid JSON from Python: ${out}`));
      }
    });
  });
}

router.post("/game/start", async (req, res): Promise<void> => {
  const result = await runPython(["start", String(MIN_RANGE), String(MAX_RANGE)]);
  const secret = result.secret as number;
  const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const session: Session = {
    sessionId,
    secret,
    status: "active",
    guessCount: 0,
    guesses: [],
    lastHint: null,
  };
  sessions.set(sessionId, session);

  req.log.info({ sessionId }, "Game started");
  res.status(201).json(
    GetGameStateResponse.parse({
      sessionId,
      status: session.status,
      guessCount: session.guessCount,
      maxGuesses: MAX_GUESSES,
      minRange: MIN_RANGE,
      maxRange: MAX_RANGE,
      guesses: session.guesses,
      lastHint: session.lastHint,
    })
  );
});

router.post("/game/guess", async (req, res): Promise<void> => {
  const parsed = SubmitGuessBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { sessionId, guess } = parsed.data;
  const session = sessions.get(sessionId);

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  if (session.status !== "active") {
    res.status(400).json({ error: "Game is already over" });
    return;
  }

  session.guessCount += 1;
  session.guesses.push(guess);

  const result = await runPython([
    "check",
    String(session.secret),
    String(guess),
    String(MAX_GUESSES),
    String(session.guessCount),
  ]);

  const hint = result.hint as string;
  const status = result.status as "active" | "won" | "lost";

  session.status = status;
  session.lastHint = hint;

  if (status === "won") {
    leaderboard.push({
      sessionId,
      guessCount: session.guessCount,
      minRange: MIN_RANGE,
      maxRange: MAX_RANGE,
    });
    leaderboard.sort((a, b) => a.guessCount - b.guessCount);
    if (leaderboard.length > 10) leaderboard.splice(10);
  }

  req.log.info({ sessionId, guess, hint, status }, "Guess submitted");

  res.json(
    SubmitGuessResponse.parse({
      hint,
      status,
      guessCount: session.guessCount,
      maxGuesses: MAX_GUESSES,
      guesses: session.guesses,
      secretNumber: status !== "active" ? session.secret : null,
    })
  );
});

router.get("/game/state/:sessionId", async (req, res): Promise<void> => {
  const params = GetGameStateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const session = sessions.get(params.data.sessionId);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  res.json(
    GetGameStateResponse.parse({
      sessionId: session.sessionId,
      status: session.status,
      guessCount: session.guessCount,
      maxGuesses: MAX_GUESSES,
      minRange: MIN_RANGE,
      maxRange: MAX_RANGE,
      guesses: session.guesses,
      lastHint: session.lastHint,
    })
  );
});

router.get("/game/leaderboard", async (_req, res): Promise<void> => {
  res.json(GetLeaderboardResponse.parse(leaderboard));
});

export default router;
