"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  boardsAreEqual,
  calculateScore,
  checkGameOver,
  createStartingBoard,
  moveTiles,
  spawnTile,
} from "@medhatile/shared-game";
import { saveScore } from "@medhatile/shared-api";
import type { AuthSession, Board } from "@medhatile/shared-types";
import { Card, GhostButton, Muted, PrimaryButton, StatusBanner } from "@/src/components/ui";

type Direction = "up" | "down" | "left" | "right";
type GameViewState = {
  board: Board;
  score: number;
  gameOver: boolean;
};

type AddingGamePageProps = {
  session: AuthSession;
  onSessionChange: (session: AuthSession) => void;
};

/**
 * Creates the initial 2048-style board state.
 */
function createInitialGameState(): GameViewState {
  const board = createStartingBoard(4);

  return {
    board,
    score: calculateScore(board),
    gameOver: checkGameOver(board),
  };
}

/**
 * Renders the current 2048 board.
 */
function BoardView({ board }: { board: Board }) {
  return (
    <div className="board">
      {board.flat().map((value, index) => (
        <div key={`${index}-${value}`} className="tile" data-value={value}>
          {value || ""}
        </div>
      ))}
    </div>
  );
}

/**
 * Renders the 2048 game page.
 */
export function AddingGamePage({ session, onSessionChange }: AddingGamePageProps) {
  const [game, setGame] = useState<GameViewState>(() => createInitialGameState());
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: async () => saveScore({ score: game.score, level: 1 }),
    onSuccess: (response) => {
      setSaveMessage(response.message);
      onSessionChange({
        ...session,
        user: {
          ...session.user,
          bestScore: response.bestScore,
        },
      });
    },
    onError: () => {
      setSaveMessage("Unable to save your score right now.");
    },
  });

  /**
   * Applies a move to the board when the selected direction changes the grid.
   */
  const applyMove = (direction: Direction) => {
    setSaveMessage(null);

    setGame((current) => {
      if (current.gameOver) {
        return current;
      }

      const movedBoard = moveTiles(current.board, direction);

      if (boardsAreEqual(current.board, movedBoard)) {
        return current;
      }

      const nextBoard = spawnTile(movedBoard);
      return {
        board: nextBoard,
        score: calculateScore(nextBoard),
        gameOver: checkGameOver(nextBoard),
      };
    });
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const directionMap: Partial<Record<string, Direction>> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
      };

      const direction = directionMap[event.key];
      if (direction) {
        event.preventDefault();
        applyMove(direction);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="grid gap-5">
      <Card>
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold tracking-[0.14em] text-brand-500 uppercase">2048</p>
            <h2 className="mt-1 text-xl font-bold text-brand-900">Merge &amp; survive</h2>
            <Muted className="mt-1 text-sm">
              Use arrow keys or the move buttons. Save your score when you&apos;re ready.
            </Muted>
          </div>
          <GhostButton type="button" onClick={() => setGame(createInitialGameState())}>
            Reset board
          </GhostButton>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <BoardView board={game.board} />

          <Card className="bg-slate-50/80">
            <div className="grid gap-2 text-sm">
              <p>
                <span className="font-semibold text-slate-600">Score</span>{" "}
                <span className="text-lg font-extrabold text-brand-900">{game.score}</span>
              </p>
              <p>
                <span className="font-semibold text-slate-600">Best</span>{" "}
                <span className="font-bold text-brand-700">{Math.max(session.user.bestScore, game.score)}</span>
              </p>
              <p>
                <span className="font-semibold text-slate-600">Status</span>{" "}
                <span className={game.gameOver ? "font-bold text-rose-600" : "font-bold text-emerald-600"}>
                  {game.gameOver ? "Game over" : "In progress"}
                </span>
              </p>
            </div>

            {saveMessage ? <StatusBanner className="mt-4 mb-0">{saveMessage}</StatusBanner> : null}

            <div className="moves mt-4">
              <span className="spacer" />
              <GhostButton onClick={() => applyMove("up")} type="button">
                ↑
              </GhostButton>
              <span className="spacer" />
              <GhostButton onClick={() => applyMove("left")} type="button">
                ←
              </GhostButton>
              <GhostButton onClick={() => applyMove("down")} type="button">
                ↓
              </GhostButton>
              <GhostButton onClick={() => applyMove("right")} type="button">
                →
              </GhostButton>
            </div>

            <PrimaryButton className="mt-4 w-full" onClick={() => saveMutation.mutate()} type="button">
              {saveMutation.isPending ? "Saving..." : "Save score"}
            </PrimaryButton>
          </Card>
        </div>
      </Card>
    </div>
  );
}
