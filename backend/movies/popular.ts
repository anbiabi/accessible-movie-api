import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { moviesDB } from "./db";
import { VidSrcClient } from "./vidsrc";
import { Movie } from "./types";

interface PopularMoviesRequest {
  page?: Query<number>;
  limit?: Query<number>;
}

interface PopularMoviesResponse {
  movies: Movie[];
  page: number;
  totalPages: number;
  totalResults: number;
}

// Retrieves popular movies with accessibility features and narrated descriptions.
export const popular = api<PopularMoviesRequest, PopularMoviesResponse>(
  { expose: true, method: "GET", path: "/movies/popular" },
  async (req) => {
    const page = req.page || 1;
    const limit = req.limit || 20;
    
    const vidsrc = new VidSrcClient();
    const vidsrcResponse = await vidsrc.getPopularMovies(page);
    
    const movies: Movie[] = [];
    
    for (const vidsrcMovie of vidsrcResponse.results.slice(0, limit)) {
      // Check if movie exists in our database
      let dbMovie = await moviesDB.queryRow`
        SELECT * FROM movies WHERE vidsrc_id = ${vidsrcMovie.id}
      `;
      
      if (!dbMovie) {
        // Store new movie in database
        const genres = vidsrcMovie.genres ? vidsrcMovie.genres.map((name, index) => ({ id: index + 1, name })) : [];
        
        dbMovie = await moviesDB.queryRow`
          INSERT INTO movies (
            vidsrc_id, title, overview, release_date, 
            poster_path, backdrop_path, vote_average, vote_count, 
            runtime, genres, accessibility_features,
            audio_description_available, closed_captions_available, sign_language_available
          ) VALUES (
            ${vidsrcMovie.id}, ${vidsrcMovie.title}, 
            ${vidsrcMovie.description || null}, ${vidsrcMovie.year ? `${vidsrcMovie.year}-01-01` : null},
            ${vidsrcMovie.poster || null}, ${vidsrcMovie.backdrop || null}, 
            ${vidsrcMovie.rating || 0}, ${100}, -- Default vote count
            ${vidsrcMovie.duration || null}, ${JSON.stringify(genres)}, 
            ${JSON.stringify({})}, FALSE, FALSE, FALSE
          ) RETURNING *
        `;
      }
      
      const movie: Movie = {
        id: dbMovie.id,
        vidsrcId: dbMovie.vidsrc_id,
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
      };
      
      movies.push(movie);
    }
    
    return {
      movies,
      page: vidsrcResponse.page,
      totalPages: vidsrcResponse.totalPages,
      totalResults: vidsrcResponse.total,
    };
  }
);
