import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type FormEvent,
  type UIEvent,
  useCallback,
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  MOVIES_API_BASE_URL,
  createMovieFromApi,
  deleteMovieFromApi,
  fetchMovieByIdFromApi,
  fetchMoviesFromApi,
  updateMovieFromApi,
} from "../services/moviesApi";
import type { Movie, MoviePayload, MovieUpdatePayload } from "../types/movie";

type MovieFormState = {
  title: string;
  year: string;
  plot: string;
  genres: string;
};

const MOVIES_PER_PAGE = 12;
const LIST_VIEWPORT_HEIGHT_PX = 460;
const LIST_ITEM_HEIGHT_PX = 82;
const LIST_OVERSCAN = 4;
const SCROLL_PAGINATION_THRESHOLD_PX = 140;
const SEARCH_DEBOUNCE_MS = 450;

const emptyFormState: MovieFormState = {
  title: "",
  year: "",
  plot: "",
  genres: "",
};

/**
 * Removes duplicate movie entries by Mongo id while preserving the latest item.
 */
function dedupeMoviesById(movies: Movie[]): Movie[] {
  const map = new Map<string, Movie>();
  for (const movie of movies) {
    map.set(movie._id, movie);
  }
  return Array.from(map.values());
}

/**
 * Converts a movie document into the editor form state.
 */
function toFormState(movie: Movie): MovieFormState {
  return {
    title: movie.title ?? "",
    year: movie.year ? String(movie.year) : "",
    plot: movie.plot ?? "",
    genres: Array.isArray(movie.genres) ? movie.genres.join(", ") : "",
  };
}

/**
 * Builds a validated API payload from the movie editor form values.
 */
function buildPayload(form: MovieFormState): MoviePayload {
  const title = form.title.trim();
  if (!title) {
    throw new Error("Title is required");
  }

  const payload: MoviePayload = { title };
  const year = form.year.trim();
  const plot = form.plot.trim();
  const genres = form.genres
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  if (year) {
    const parsedYear = Number(year);
    if (!Number.isInteger(parsedYear) || parsedYear < 1888) {
      throw new Error("Year must be an integer greater than or equal to 1888");
    }
    payload.year = parsedYear;
  }

  if (plot) {
    payload.plot = plot;
  }

  if (genres.length > 0) {
    payload.genres = genres;
  }

  return payload;
}

/**
 * Converts unknown thrown values into a user-facing error message.
 */
function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

/**
 * Renders the development-only movies CRUD screen.
 */
export function MoviesSection() {
  const queryClient = useQueryClient();

  const [listScrollTop, setListScrollTop] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);
  const [formState, setFormState] = useState<MovieFormState>(emptyFormState);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPagingTransition, startPagingTransition] = useTransition();

  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const listContainerRef = useRef<HTMLDivElement | null>(null);

  const searchInputId = useId();
  const titleInputId = useId();
  const yearInputId = useId();
  const genresInputId = useId();
  const plotInputId = useId();

  const deferredSearchInput = useDeferredValue(searchInput);
  const isSearchInputPending = deferredSearchInput !== searchInput;

  const moviesListQuery = useInfiniteQuery({
    queryKey: ["movies", search],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      fetchMoviesFromApi({
        page: pageParam,
        limit: MOVIES_PER_PAGE,
        title: search || undefined,
      }),
    getNextPageParam: (lastPage) => {
      if (lastPage.page * lastPage.limit >= lastPage.total) {
        return undefined;
      }
      return lastPage.page + 1;
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  const selectedMovieQuery = useQuery({
    queryKey: ["movie", selectedMovieId],
    queryFn: () => fetchMovieByIdFromApi(selectedMovieId as string),
    enabled: Boolean(selectedMovieId),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });

  const createMovieMutation = useMutation({
    mutationFn: createMovieFromApi,
  });

  const updateMovieMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: MovieUpdatePayload }) => updateMovieFromApi(id, payload),
  });

  const deleteMovieMutation = useMutation({
    mutationFn: deleteMovieFromApi,
  });

  const moviesPages = moviesListQuery.data?.pages ?? [];
  const movies = useMemo(() => {
    return dedupeMoviesById(moviesPages.flatMap((pagePayload) => pagePayload.movies));
  }, [moviesPages]);
  const loadedMoviesCount = movies.length;

  const lastPage = moviesPages[moviesPages.length - 1];
  const total = lastPage?.total ?? 0;
  const page = lastPage?.page ?? 1;
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / MOVIES_PER_PAGE)), [total]);
  const hasReachedListEnd = movies.length > 0 && !moviesListQuery.hasNextPage;

  const totalListHeight = useMemo(() => movies.length * LIST_ITEM_HEIGHT_PX, [movies.length]);
  const startIndex = useMemo(
    () => Math.max(0, Math.floor(listScrollTop / LIST_ITEM_HEIGHT_PX) - LIST_OVERSCAN),
    [listScrollTop],
  );
  const visibleItemsCount = useMemo(
    () => Math.ceil(LIST_VIEWPORT_HEIGHT_PX / LIST_ITEM_HEIGHT_PX) + LIST_OVERSCAN * 2,
    [],
  );
  const endIndex = useMemo(
    () => Math.min(movies.length, startIndex + visibleItemsCount),
    [movies.length, startIndex, visibleItemsCount],
  );
  const visibleMovies = useMemo(() => movies.slice(startIndex, endIndex), [movies, startIndex, endIndex]);

  const isInitialLoading = moviesListQuery.isPending;
  const isLoadingMore = moviesListQuery.isFetchingNextPage;
  const isRefreshingList = moviesListQuery.isFetching && !moviesListQuery.isFetchingNextPage && movies.length > 0;
  const isBusy = isInitialLoading || isPagingTransition;
  const isSubmitting = createMovieMutation.isPending || updateMovieMutation.isPending || deleteMovieMutation.isPending;

  const queryErrorMessage = useMemo(() => {
    const error = moviesListQuery.error ?? selectedMovieQuery.error;
    if (!error) {
      return null;
    }
    return getErrorMessage(error, "Request failed");
  }, [moviesListQuery.error, selectedMovieQuery.error]);
  const activeErrorMessage = errorMessage ?? queryErrorMessage;

  useEffect(() => {
    const maxScrollTop = Math.max(0, totalListHeight - LIST_VIEWPORT_HEIGHT_PX);
    if (listScrollTop <= maxScrollTop) {
      return;
    }

    setListScrollTop(maxScrollTop);
    listContainerRef.current?.scrollTo({ top: maxScrollTop });
  }, [listScrollTop, totalListHeight]);

  useEffect(() => {
    if (!selectedMovieQuery.data) {
      return;
    }

    setFormState(toFormState(selectedMovieQuery.data));
  }, [selectedMovieQuery.data]);

  /**
   * Applies a title filter and resets list selection state for a new search.
   */
  const applySearch = useCallback(
    (rawQuery: string) => {
      const query = rawQuery.trim();
      if (query === search) {
        return;
      }

      setErrorMessage(null);
      setStatusMessage(null);
      setSelectedMovieId(null);
      setListScrollTop(0);
      listContainerRef.current?.scrollTo({ top: 0 });

      startPagingTransition(() => {
        setSearch(query);
      });
    },
    [search],
  );

  /**
   * Submits the current search input or refreshes the existing search results.
   */
  const handleSearchSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const query = searchInput.trim();
      if (query === search) {
        void moviesListQuery.refetch();
        return;
      }
      applySearch(query);
    },
    [applySearch, moviesListQuery, search, searchInput],
  );

  /**
   * Debounces search input changes before applying a new query.
   */
  useEffect(() => {
    const trimmedSearchInput = searchInput.trim();
    if (trimmedSearchInput === search) {
      return;
    }

    const timerId = window.setTimeout(() => {
      applySearch(trimmedSearchInput);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [applySearch, search, searchInput]);

  /**
   * Fetches the next movies page when pagination can continue.
   */
  const loadNextPage = useCallback(() => {
    if (!moviesListQuery.hasNextPage || moviesListQuery.isFetchingNextPage || isPagingTransition) {
      return;
    }
    void moviesListQuery.fetchNextPage();
  }, [isPagingTransition, moviesListQuery]);

  /**
   * Loads a selected movie into the editor panel.
   */
  const handleSelectMovie = useCallback((movieId: string) => {
    setErrorMessage(null);
    setStatusMessage(null);
    setSelectedMovieId(movieId);
    setFormState(emptyFormState);
  }, []);

  /**
   * Updates a single movie form field.
   */
  const handleFormChange = useCallback((key: keyof MovieFormState, value: string) => {
    setFormState((currentValue) => ({ ...currentValue, [key]: value }));
  }, []);

  /**
   * Tracks list scrolling and preloads the next page near the bottom.
   */
  const handleListScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      const container = event.currentTarget;
      const nextScrollTop = container.scrollTop;
      setListScrollTop(nextScrollTop);

      const isNearBottom =
        nextScrollTop + container.clientHeight >= container.scrollHeight - SCROLL_PAGINATION_THRESHOLD_PX;

      if (isNearBottom) {
        loadNextPage();
      }
    },
    [loadNextPage],
  );

  /**
   * Clears the current movie selection and restores an empty editor form.
   */
  const clearSelection = useCallback(() => {
    setSelectedMovieId(null);
    setFormState(emptyFormState);
    window.requestAnimationFrame(() => {
      titleInputRef.current?.focus();
    });
  }, []);

  /**
   * Creates a new movie using the current editor values.
   */
  const handleCreate = useCallback(async () => {
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const payload = buildPayload(formState);
      const createdMovie = await createMovieMutation.mutateAsync(payload);

      setStatusMessage(`Created movie: ${createdMovie.title}`);
      clearSelection();
      setListScrollTop(0);
      listContainerRef.current?.scrollTo({ top: 0 });

      queryClient.setQueryData(["movie", createdMovie._id], createdMovie);
      await queryClient.invalidateQueries({ queryKey: ["movies"] });
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Failed to create movie"));
    }
  }, [clearSelection, createMovieMutation, formState, queryClient]);

  /**
   * Updates the selected movie with the current editor values.
   */
  const handleUpdate = useCallback(async () => {
    if (!selectedMovieId) {
      setErrorMessage("Select a movie before updating");
      return;
    }

    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const payload = buildPayload(formState);
      const updatedMovie = await updateMovieMutation.mutateAsync({ id: selectedMovieId, payload });

      setStatusMessage(`Updated movie: ${updatedMovie.title}`);
      queryClient.setQueryData(["movie", updatedMovie._id], updatedMovie);
      await queryClient.invalidateQueries({ queryKey: ["movies"] });
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Failed to update movie"));
    }
  }, [formState, queryClient, selectedMovieId, updateMovieMutation]);

  /**
   * Deletes the currently selected movie from the collection.
   */
  const handleDelete = useCallback(async () => {
    if (!selectedMovieId) {
      setErrorMessage("Select a movie before deleting");
      return;
    }

    setErrorMessage(null);
    setStatusMessage(null);

    try {
      await deleteMovieMutation.mutateAsync(selectedMovieId);

      setStatusMessage("Movie deleted");
      clearSelection();
      queryClient.removeQueries({ queryKey: ["movie", selectedMovieId] });
      await queryClient.invalidateQueries({ queryKey: ["movies"] });
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Failed to delete movie"));
    }
  }, [clearSelection, deleteMovieMutation, queryClient, selectedMovieId]);

  return (
    <section className="mx-auto w-full max-w-6xl rounded-3xl border border-slate-200/90 bg-white/95 p-4 shadow-xl sm:p-6">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          {import.meta.env.DEV && (
            <p className="mb-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
              API Base: {MOVIES_API_BASE_URL}
            </p>
          )}
          <form className="mb-3 flex gap-2" onSubmit={handleSearchSubmit}>
            <label htmlFor={searchInputId} className="sr-only">
              Search by movie title
            </label>
            <input
              id={searchInputId}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by movie title"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-500"
            />
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
            >
              Search
            </button>
          </form>

          {isSearchInputPending && (
            <p className="mb-2 text-xs text-slate-500">Updating search input...</p>
          )}

          <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>Movies {search ? `(filtered: ${search})` : ""}</span>
            <span>
              Loaded {loadedMoviesCount} of {total} | Page {page} / {totalPages}
            </span>
          </div>

          <div className="pr-1">
            {movies.length === 0 ? (
              <p className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600">
                {isBusy ? "Loading movies..." : "No more movies."}
              </p>
            ) : (
              <div ref={listContainerRef} onScroll={handleListScroll} className="relative h-[460px] overflow-y-auto">
                <div className="relative" style={{ height: `${totalListHeight}px` }}>
                  {visibleMovies.map((movie, index) => {
                    const actualIndex = startIndex + index;
                    const top = actualIndex * LIST_ITEM_HEIGHT_PX;

                    return (
                      <div
                        key={movie._id}
                        className="absolute left-0 right-0 px-0.5 pb-2"
                        style={{ top: `${top}px`, height: `${LIST_ITEM_HEIGHT_PX}px` }}
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectMovie(movie._id)}
                          className={`h-full w-full rounded-xl border px-3 py-2 text-left transition-colors ${
                            selectedMovieId === movie._id
                              ? "border-slate-900 bg-slate-100"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <p className="text-sm font-semibold text-slate-800">{movie.title || "Untitled movie"}</p>
                          <p className="text-xs text-slate-500">
                            {movie.year ?? "Year unknown"} | {(movie.genres ?? []).slice(0, 3).join(", ") || "No genres"}
                          </p>
                        </button>
                      </div>
                    );
                  })}
                </div>
                {(isRefreshingList || isLoadingMore) && (
                  <div className="pointer-events-none absolute inset-x-2 top-2 rounded-md border border-slate-200 bg-white/95 px-2 py-1 text-xs font-medium text-slate-600 shadow-sm">
                    Refreshing movies...
                  </div>
                )}
              </div>
            )}
          </div>

          {movies.length > 0 && (
            <p className="mt-3 text-xs text-slate-500">
              Scroll down to load more movies automatically.
            </p>
          )}
          {hasReachedListEnd && movies.length > 0 && (
            <p className="mt-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">
              No more movies.
            </p>
          )}
        </article>

        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h2 className="text-base font-semibold text-slate-800">Movie Editor</h2>
          <p className="mt-1 text-xs text-slate-500">
            Create a new movie or select one from the list to update/delete it.
          </p>

          {selectedMovieId && selectedMovieQuery.isFetching && (
            <p className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
              Loading selected movie...
            </p>
          )}

          <div className="mt-3 space-y-3">
            <label className="block" htmlFor={titleInputId}>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Title</span>
              <input
                ref={titleInputRef}
                id={titleInputId}
                value={formState.title}
                onChange={(event) => handleFormChange("title", event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-500"
                placeholder="Movie title"
              />
            </label>

            <label className="block" htmlFor={yearInputId}>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Year</span>
              <input
                id={yearInputId}
                value={formState.year}
                onChange={(event) => handleFormChange("year", event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-500"
                placeholder="e.g. 2001"
              />
            </label>

            <label className="block" htmlFor={genresInputId}>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Genres</span>
              <input
                id={genresInputId}
                value={formState.genres}
                onChange={(event) => handleFormChange("genres", event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-500"
                placeholder="Drama, Comedy"
              />
            </label>

            <label className="block" htmlFor={plotInputId}>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Plot</span>
              <textarea
                id={plotInputId}
                value={formState.plot}
                onChange={(event) => handleFormChange("plot", event.target.value)}
                className="min-h-28 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-500"
                placeholder="Short plot summary"
              />
            </label>
          </div>

          {activeErrorMessage && (
            <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {activeErrorMessage}
            </p>
          )}
          {statusMessage && (
            <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {statusMessage}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                void handleCreate();
              }}
              disabled={isSubmitting}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:opacity-60"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => {
                void handleUpdate();
              }}
              disabled={isSubmitting || !selectedMovieId}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-60"
            >
              Update
            </button>
            <button
              type="button"
              onClick={() => {
                void handleDelete();
              }}
              disabled={isSubmitting || !selectedMovieId}
              className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-60"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={clearSelection}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-60"
            >
              Clear
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}
