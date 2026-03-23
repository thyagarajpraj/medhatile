import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { GameSection } from "./GameSection";

/**
 * Waits for the provided duration using real timers.
 */
async function waitForDuration(durationMs: number): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => {
      window.setTimeout(resolve, durationMs);
    });
  });
}

/**
 * Starts a training round and waits for the reveal board to render.
 */
async function startTraining(): Promise<void> {
  render(<GameSection />);
  fireEvent.click(screen.getByRole("button", { name: "Start Training" }));
  await screen.findByRole("button", { name: "Tile 1" });
}

/**
 * Creates a successful fetch response for pattern requests.
 */
function createPatternResponse(pattern: number[]): Response {
  return {
    ok: true,
    json: async () => ({ pattern }),
  } as Response;
}

describe("GameSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    globalThis.fetch = vi.fn();

    window.requestAnimationFrame = ((callback: FrameRequestCallback) =>
      window.setTimeout(() => callback(performance.now()), 0)) as typeof window.requestAnimationFrame;
    window.cancelAnimationFrame = ((handle: number) => {
      window.clearTimeout(handle);
    }) as typeof window.cancelAnimationFrame;
  });

  afterEach(() => {
    cleanup();
  });

  it(
    "blinks revealed tiles for the full 1-second reveal before recall starts",
    async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(createPatternResponse([0, 1, 2]));

    await startTraining();

    expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledWith(expect.stringContaining("gridSize=4&count=3"));
    expect(screen.getByRole("button", { name: "Tile 1" })).toHaveClass("animate-tile-blink");

    await waitForDuration(1000);
    await waitFor(() => expect(screen.getByRole("button", { name: "Tile 1" })).not.toBeDisabled());
    expect(screen.getByText("Tap the same tiles from memory.")).toBeInTheDocument();
    },
    10000,
  );

  it(
    "advances to the next level after all correct selections and preserves prior positions",
    async () => {
    vi.mocked(globalThis.fetch)
      .mockResolvedValueOnce(createPatternResponse([0, 1, 2]))
      .mockResolvedValueOnce(createPatternResponse([5, 6, 7, 8]));

    await startTraining();

    expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledWith(expect.stringContaining("gridSize=4&count=3"));
    await waitForDuration(1100);
    await waitFor(() => expect(screen.getByRole("button", { name: "Tile 1" })).not.toBeDisabled());

    fireEvent.click(screen.getByRole("button", { name: "Tile 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Tile 2" }));
    fireEvent.click(screen.getByRole("button", { name: "Tile 3" }));

    await waitFor(() => expect(screen.getByText("Preparing round...")).toBeInTheDocument());

    await waitFor(
      () => expect(vi.mocked(globalThis.fetch)).toHaveBeenLastCalledWith(expect.stringContaining("gridSize=4&count=4")),
      { timeout: 2000 },
    );
    await waitFor(() => expect(screen.getByText("Blue Tiles: 4")).toBeInTheDocument(), { timeout: 2000 });
    expect(screen.getByText("Level: 2")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Tile 1" })).toHaveClass("animate-tile-blink");
    expect(screen.getByRole("button", { name: "Tile 2" })).toHaveClass("animate-tile-blink");
    expect(screen.getByRole("button", { name: "Tile 3" })).toHaveClass("animate-tile-blink");
    expect(screen.getByRole("button", { name: "Tile 6" })).toHaveClass("animate-tile-blink");

    fireEvent.click(screen.getByRole("button", { name: "Back to Start" }));
    expect(screen.getByRole("button", { name: "Start Training" })).toBeInTheDocument();
    expect(screen.getByText("Best Score: 1")).toBeInTheDocument();
    },
    10000,
  );

  it(
    "blinks answers for 1 second after three mistakes and restarts the same round automatically",
    async () => {
    vi.mocked(globalThis.fetch)
      .mockResolvedValueOnce(createPatternResponse([0, 1, 2]))
      .mockResolvedValueOnce(createPatternResponse([9, 10, 11]));

    await startTraining();

    await waitForDuration(1100);
    await waitFor(() => expect(screen.getByRole("button", { name: "Tile 1" })).not.toBeDisabled());

    fireEvent.click(screen.getByRole("button", { name: "Tile 5" }));
    fireEvent.click(screen.getByRole("button", { name: "Tile 6" }));
    fireEvent.click(screen.getByRole("button", { name: "Tile 7" }));

    await waitFor(() => expect(screen.getByText("[.] Missed Correct")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Tile 1" })).toHaveClass("animate-tile-blink");
    expect(screen.getByRole("button", { name: "Tile 5" })).not.toHaveClass("animate-tile-blink");

    await waitForDuration(1100);
    await waitFor(
      () => expect(vi.mocked(globalThis.fetch)).toHaveBeenLastCalledWith(expect.stringContaining("gridSize=4&count=3")),
      { timeout: 2000 },
    );
    await waitFor(() => expect(screen.getByRole("button", { name: "Tile 1" })).toHaveClass("animate-tile-blink"), {
      timeout: 2000,
    });
  },
    10000,
  );
});
