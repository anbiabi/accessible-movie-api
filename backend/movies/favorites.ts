import { api, APIError } from "encore.dev/api";
import { moviesDB } from "./db";
import { Movie } from "./types";

interface AddFavoriteRequest {
  userId: string;
  movieId: number;
}

interface RemoveFavoriteRequest {
  userId: string;
  movieId: number;
}

interface GetFavoritesRequest {
  userId: string;
}

interface FavoritesResponse {
  movies: Movie[];
}

// Adds a movie to user's favorites list.
export const addFavorite = api<AddFavoriteRequest, void>(
  { expose: true, method: "POST", path: "/movies/favorites" },
  async (req) => {
    const { userId, movieId } = req;
    
    // Check if movie exists
    const movie = await moviesDB.queryRow`
      SELECT id FROM movies WHERE id = ${movieId}
    `;
    
    if (!movie) {
      throw APIError.notFound("Movie not found");
    }
    
    // Add to favorites (ignore if already exists)
    await moviesDB.exec`
      INSERT INTO user_favorites (user_id, movie_id) 
      VALUES (${userId}, ${movieId})
      ON CONFLICT (user_id, movie_id) DO NOTHING
    `;
  }
);

// Removes a movie from user's favorites list.
export const removeFavorite = api<RemoveFavoriteRequest, void>(
  { expose: true, method: "DELETE", path: "/movies/favorites" },
  async (req) => {
    const { userId, movieId } = req;
    
    await moviesDB.exec`
      DELETE FROM user_favorites 
      WHERE user_id = ${userId} AND movie_id = ${movieId}
    `;
  }
);

// Retrieves user's favorite movies with accessibility information.
export const getFavorites = api<GetFavoritesRequest, FavoritesResponse>(
  { expose: true, method: "GET", path: "/movies/favorites/:userId" },
  async (req) => {
    const { userId } = req;
    
    const favorites = await moviesDB.queryAll`
      SELECT m.* FROM movies m
      INNER JOIN user_favorites uf ON m.id = uf.movie_id
      WHERE uf.user_id = ${userId}
      ORDER BY uf.created_at DESC
    `;
    
    const movies: Movie[] = favorites.map(dbMovie => ({
      id: dbMovie.id,
      tmdbId: dbMovie.tmdb_id,
      imdbId: dbMovie.imdb_id,
      title: dbMovie.title,
      overview: dbMovie.overview,
      narratedDescription: dbMovie.narrated_description,
      releaseDate: dbMovie.release_date,
      posterPath: dbMovie.poster_path,
      backdropPath: dbMovie.backdrop_path,
      voteAverage: dbMovie.vote_average,
      voteCount: dbMovie.vote_count,
      runtime: dbMovie.runtime,
      genres: dbMovie.genres || [],
      accessibilityFeatures: dbMovie.accessibility_features || {},
      audioDescriptionAvailable: dbMovie.audio_description_available,
      closedCaptionsAvailable: dbMovie.closed_captions_available,
      signLanguageAvailable: dbMovie.sign_language_available,
      isFavorite: true,
    }));
    
    return { movies };
  }
);
