import { api, APIError } from "encore.dev/api";
import { moviesDB } from "./db";
import { VidSrcClient } from "./vidsrc";
import { Movie } from "./types";

interface MovieDetailsRequest {
  id: number;
  userId?: string;
}

interface MovieDetailsResponse extends Movie {
  streamingUrl?: string;
  accessibilityReports: {
    id: number;
    reportType: string;
    description: string;
    severity: string;
    status: string;
    createdAt: string;
  }[];
}

// Retrieves detailed movie information with accessibility features and streaming options.
export const details = api<MovieDetailsRequest, MovieDetailsResponse>(
  { expose: true, method: "GET", path: "/movies/:id" },
  async (req) => {
    const movieId = req.id;
    const userId = req.userId;
    
    // Get movie from database
    const dbMovie = await moviesDB.queryRow`
      SELECT * FROM movies WHERE id = ${movieId}
    `;
    
    if (!dbMovie) {
      throw APIError.notFound("Movie not found");
    }
    
    // Get user-specific data if userId provided
    let userRating: number | undefined;
    let userAccessibilityRating: number | undefined;
    let isFavorite = false;
    
    if (userId) {
      const rating = await moviesDB.queryRow`
        SELECT rating, accessibility_rating FROM user_ratings 
        WHERE user_id = ${userId} AND movie_id = ${movieId}
      `;
      
      if (rating) {
        userRating = rating.rating;
        userAccessibilityRating = rating.accessibility_rating;
      }
      
      const favorite = await moviesDB.queryRow`
        SELECT id FROM user_favorites 
        WHERE user_id = ${userId} AND movie_id = ${movieId}
      `;
      
      isFavorite = !!favorite;
    }
    
    // Get accessibility reports
    const reports = await moviesDB.queryAll`
      SELECT id, report_type, description, severity, status, created_at
      FROM accessibility_reports 
      WHERE movie_id = ${movieId}
      ORDER BY created_at DESC
      LIMIT 10
    `;
    
    // Generate streaming URL using vidsrc.domains
    const streamingUrl = dbMovie.vidsrc_id 
      ? `https://vidsrc.domains/embed/movie/${dbMovie.vidsrc_id}`
      : dbMovie.imdb_id 
        ? `https://vidsrc.domains/embed/movie/${dbMovie.imdb_id}`
        : undefined;
    
    const movie: MovieDetailsResponse = {
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
      userRating,
      userAccessibilityRating,
      isFavorite,
      streamingUrl,
      accessibilityReports: reports.map(report => ({
        id: report.id,
        reportType: report.report_type,
        description: report.description,
        severity: report.severity,
        status: report.status,
        createdAt: report.created_at,
      })),
    };
    
    return movie;
  }
);
