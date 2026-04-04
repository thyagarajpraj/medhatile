export type Movie = {
  _id: string;
  title: string;
  year?: number;
  plot?: string;
  genres?: string[];
};

export type MovieListResponse = {
  movies: Movie[];
  page: number;
  limit: number;
  total: number;
};

export type MoviePayload = {
  title: string;
  year?: number;
  plot?: string;
  genres?: string[];
};

export type MovieUpdatePayload = Partial<MoviePayload>;
