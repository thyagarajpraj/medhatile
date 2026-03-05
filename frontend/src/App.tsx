import { useEffect, useState } from "react";
import { GameSection } from "./components/GameSection";
import { MoviesSection } from "./features/movies/components/MoviesSection";

type AppRoute = "/" | "/movies";

function resolveRoute(pathname: string): AppRoute {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  return normalizedPath.startsWith("/movies") ? "/movies" : "/";
}

function App() {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() => resolveRoute(window.location.pathname));

  useEffect(() => {
    const onPopState = () => setCurrentRoute(resolveRoute(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = (to: AppRoute) => {
    if (to === currentRoute) {
      return;
    }

    window.history.pushState({}, "", to);
    setCurrentRoute(to);
  };

  return (
    <main className="min-h-dvh overflow-y-auto bg-[radial-gradient(circle_at_20%_10%,_#eef2ff_0%,_#f8f9fa_55%,_#e2e8f0_100%)] px-3 py-3 sm:px-4 sm:py-4">
      <section className="mx-auto mb-3 flex w-full max-w-6xl items-center justify-between rounded-2xl border border-slate-200/90 bg-white/90 p-2 shadow-sm backdrop-blur-sm sm:p-3">
        <h1 className="px-2 text-sm font-extrabold uppercase tracking-wide text-slate-800 sm:text-base">MedhaTile</h1>
        <div className="flex items-center gap-2">
          <a
            href="/"
            onClick={(event) => {
              event.preventDefault();
              navigate("/");
            }}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              currentRoute === "/"
                ? "bg-slate-900 text-white"
                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            Game
          </a>
          <a
            href="/movies"
            onClick={(event) => {
              event.preventDefault();
              navigate("/movies");
            }}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              currentRoute === "/movies"
                ? "bg-slate-900 text-white"
                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            Movies
          </a>
        </div>
      </section>

      {currentRoute === "/" ? <GameSection /> : <MoviesSection />}
    </main>
  );
}

export default App;
