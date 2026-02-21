import type { TileState } from "../types/game";

type TileProps = {
  index: number;
  state: TileState;
  disabled: boolean;
  onClick: (index: number) => void;
};

const stateClassMap: Record<TileState, string> = {
  default: "border-slate-300/70 bg-slate-200 hover:bg-slate-300",
  reveal: "border-sky-600 bg-sky-500",
  selected_correct: "border-sky-700 bg-sky-500 ring-2 ring-sky-300",
  answer: "border-violet-500 bg-violet-50 ring-2 ring-violet-300",
  wrong: "border-rose-500 bg-rose-50 ring-2 ring-rose-300",
};

const stateMarkerMap: Partial<Record<TileState, string>> = {
  selected_correct: "OK",
  answer: ".",
  wrong: "X",
};

const markerClassMap: Partial<Record<TileState, string>> = {
  selected_correct: "text-white",
  answer: "text-violet-700",
  wrong: "text-rose-700",
};

export function Tile({ index, state, disabled, onClick }: TileProps) {
  const marker = stateMarkerMap[state];
  const markerClass = markerClassMap[state] ?? "";

  return (
    <button
      type="button"
      className={`relative aspect-square w-full rounded-xl border-2 ${stateClassMap[state]}`}
      disabled={disabled}
      onClick={() => onClick(index)}
      aria-label={`Tile ${index + 1}`}
    >
      {marker ? (
        <span className={`pointer-events-none text-[10px] font-extrabold leading-none tracking-wide ${markerClass}`}>
          {marker}
        </span>
      ) : null}
    </button>
  );
}
