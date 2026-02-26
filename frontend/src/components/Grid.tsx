import { Tile } from "./Tile";
import type { Phase, TileState } from "../types/game";

type GridProps = {
  gridSize: number;
  pattern: number[];
  userSelections: number[];
  wrongSelections: number[];
  phase: Phase;
  blinkAnswers?: boolean;
  onTileClick: (index: number) => void;
};

/**
 * Renders the memory board and resolves per-tile visual state by game phase.
 */
export function Grid({
  gridSize,
  pattern,
  userSelections,
  wrongSelections,
  phase,
  blinkAnswers = false,
  onTileClick,
}: GridProps) {
  const totalTiles = gridSize * gridSize;
  const patternSet = new Set(pattern);
  const selectionSet = new Set(userSelections);
  const wrongSet = new Set(wrongSelections);
  const boardMaxWidth = gridSize >= 8 ? 300 : gridSize >= 6 ? 360 : 430;
  const gapClass = gridSize >= 8 ? "gap-1" : "gap-1.5";

  /**
   * Maps a tile index to the current UI state for rendering.
   */
  const getState = (index: number): TileState => {
    if (phase === "reveal" && patternSet.has(index)) {
      return "reveal";
    }

    if (wrongSet.has(index)) {
      return "wrong";
    }

    if (selectionSet.has(index) && patternSet.has(index)) {
      return "selected_correct";
    }

    if (phase === "review" && patternSet.has(index)) {
      return "answer";
    }

    return "default";
  };

  return (
    <div className="mx-auto w-full" style={{ maxWidth: `${boardMaxWidth}px` }}>
      <div className={`grid aspect-square w-full ${gapClass}`} style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}>
        {Array.from({ length: totalTiles }).map((_, index) => {
          const tileState = getState(index);
          const shouldBlink = blinkAnswers && (tileState === "answer" || tileState === "selected_correct");

          return (
            <Tile
              key={index}
              index={index}
              state={tileState}
              blink={shouldBlink}
              disabled={phase !== "recall"}
              onClick={onTileClick}
            />
          );
        })}
      </div>
    </div>
  );
}
