import { type ChangeEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Resolves the currently selected game route for the shared game switcher.
 */
function getSelectedGameRoute(pathname: string): string {
  if (pathname === "/games/identifying") {
    return "/games/identifying";
  }

  if (pathname === "/games/adding") {
    return "/games/adding";
  }

  return "/";
}

/**
 * Renders the shared game-selection dropdown used by protected routes.
 */
export function GameRouteSelect({ id = "game-switcher" }: { id?: string }) {
  const location = useLocation();
  const navigate = useNavigate();

  /**
   * Routes the user to the selected game or landing page.
   */
  function handleChange(event: ChangeEvent<HTMLSelectElement>): void {
    navigate(event.target.value);
  }

  return (
    <>
      <label className="sr-only" htmlFor={id}>
        Choose a tile game
      </label>
      <select
        id={id}
        className="select-input compact-select"
        value={getSelectedGameRoute(location.pathname)}
        onChange={handleChange}
        aria-label="Choose a tile game"
      >
        <option value="/">Choose Game</option>
        <option value="/games/adding">2048</option>
        <option value="/games/identifying">Identifying Tiles</option>
      </select>
    </>
  );
}
