import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { moviesDB } from "./db";
import { VidSrcClient } from "./vidsrc";
import { Movie } from "./types";

interface SearchMoviesRequest {
  query: Query<string>;
  page?: Query<number>;
  limit?: Query<number>;
  genre?: Query<string>;
  releaseYear?: Query<number>;
  minRating?: Query<number>;
  maxRating?: Query<number>;
  keyword?: Query<string>;
  hasAudioDescription?: Query<boolean>;
  hasClosedCaptions?: Query<boolean>;
  hasSignLanguage?: Query<boolean>;
  sortBy?: Query<'relevance' | 'rating' | 'release_date' | 'title' | 'accessibility_score'>;
  sortOrder?: Query<'asc' | 'desc'>;
}

interface SearchMoviesResponse {
  movies: Movie[];
  page: number;
  totalPages: number;
  totalResults: number;
  searchQuery: string;
  appliedFilters: {
    genre?: string;
    releaseYear?: number;
    minRating?: number;
    maxRating?: number;
    keyword?: string;
    hasAudioDescription?: boolean;
    hasClosedCaptions?: boolean;
    hasSignLanguage?: boolean;
  };
}

// Searches for movies with advanced accessibility-focused filters and narrated descriptions.
export const search = api<SearchMoviesRequest, SearchMoviesResponse>(
  { expose: true, method: "GET", path: "/movies/search" },
  async (req) => {
    const page = req.page || 1;
    const limit = req.limit || 20;
    const searchQuery = req.query || '';
    const sortBy = req.sortBy || 'relevance';
    const sortOrder = req.sortOrder || 'desc';
    
    if (!searchQuery || searchQuery.trim().length === 0) {
      return {
        movies: [],
        page: 1,
        totalPages: 0,
        totalResults: 0,
        searchQuery: searchQuery || "",
        appliedFilters: {},
      };
    }
    
    // Build dynamic query with filters
    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    let paramIndex = 1;
    
    // Text search conditions
    whereConditions.push(`(
      title ILIKE $${paramIndex} 
      OR overview ILIKE $${paramIndex}
      OR narrated_description ILIKE $${paramIndex}
    )`);
    queryParams.push(`%${searchQuery}%`);
    paramIndex++;
    
    // Genre filter
    if (req.genre) {
      whereConditions.push(`genres::text ILIKE $${paramIndex}`);
      queryParams.push(`%${req.genre}%`);
      paramIndex++;
    }
    
    // Release year filter
    if (req.releaseYear) {
      whereConditions.push(`EXTRACT(YEAR FROM release_date) = $${paramIndex}`);
      queryParams.push(req.releaseYear);
      paramIndex++;
    }
    
    // Rating filters
    if (req.minRating !== undefined) {
      whereConditions.push(`vote_average >= $${paramIndex}`);
      queryParams.push(req.minRating);
      paramIndex++;
    }
    
    if (req.maxRating !== undefined) {
      whereConditions.push(`vote_average <= $${paramIndex}`);
      queryParams.push(req.maxRating);
      paramIndex++;
    }
    
    // Keyword filter (searches in overview and narrated description)
    if (req.keyword) {
      whereConditions.push(`(
        overview ILIKE $${paramIndex}
        OR narrated_description ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${req.keyword}%`);
      paramIndex++;
    }
    
    // Accessibility filters
    if (req.hasAudioDescription !== undefined) {
      whereConditions.push(`audio_description_available = $${paramIndex}`);
      queryParams.push(req.hasAudioDescription);
      paramIndex++;
    }
    
    if (req.hasClosedCaptions !== undefined) {
      whereConditions.push(`closed_captions_available = $${paramIndex}`);
      queryParams.push(req.hasClosedCaptions);
      paramIndex++;
    }
    
    if (req.hasSignLanguage !== undefined) {
      whereConditions.push(`sign_language_available = $${paramIndex}`);
      queryParams.push(req.hasSignLanguage);
      paramIndex++;
    }
    
    // Build ORDER BY clause
    let orderByClause = '';
    switch (sortBy) {
      case 'rating':
        orderByClause = `ORDER BY vote_average ${sortOrder.toUpperCase()}`;
        break;
      case 'release_date':
        orderByClause = `ORDER BY release_date ${sortOrder.toUpperCase()}`;
        break;
      case 'title':
        orderByClause = `ORDER BY title ${sortOrder.toUpperCase()}`;
        break;
      case 'accessibility_score':
        orderByClause = `ORDER BY (
          CASE WHEN audio_description_available THEN 1 ELSE 0 END +
          CASE WHEN closed_captions_available THEN 1 ELSE 0 END +
          CASE WHEN sign_language_available THEN 1 ELSE 0 END +
          CASE WHEN narrated_description IS NOT NULL THEN 1 ELSE 0 END
        ) ${sortOrder.toUpperCase()}, vote_average DESC`;
        break;
      default: // relevance
        orderByClause = `ORDER BY 
          CASE 
            WHEN title ILIKE $1 THEN 1
            WHEN title ILIKE $1 THEN 2
            ELSE 3
          END,
          (
            CASE WHEN audio_description_available THEN 1 ELSE 0 END +
            CASE WHEN closed_captions_available THEN 1 ELSE 0 END +
            CASE WHEN sign_language_available THEN 1 ELSE 0 END +
            CASE WHEN narrated_description IS NOT NULL THEN 1 ELSE 0 END
          ) DESC,
          vote_average DESC`;
        break;
    }
    
    // Build complete query
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    const limitClause = `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, (page - 1) * limit);
    
    const query = `
      SELECT * FROM movies 
      ${whereClause}
      ${orderByClause}
      ${limitClause}
    `;
    
    const countQuery = `
      SELECT COUNT(*) as count FROM movies 
      ${whereClause}
    `;
    
    // Execute queries
    const [movies, countResult] = await Promise.all([
      moviesDB.rawQueryAll(query, ...queryParams.slice(0, -2), limit, (page - 1) * limit),
      moviesDB.rawQueryRow(countQuery, ...queryParams.slice(0, -2))
    ]);
    
    // If we have fewer local results than requested, supplement with VidSrc
    const localMovies: Movie[] = movies.map(dbMovie => ({
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
    }));
    
    let finalMovies = localMovies;
    let totalResults = countResult?.count || 0;
    let totalPages = Math.ceil(totalResults / limit);
    
    // If we need more results and no specific filters are applied, search VidSrc
    if (localMovies.length < limit && !req.genre && !req.releaseYear && !req.hasAudioDescription && !req.hasClosedCaptions && !req.hasSignLanguage) {
      try {
        const vidsrc = new VidSrcClient();
        const vidsrcResponse = await vidsrc.searchMovies(searchQuery, page);
        
        for (const vidsrcMovie of vidsrcResponse.results) {
          if (finalMovies.length >= limit) break;
          
          // Skip if we already have this movie
          if (finalMovies.some(m => m.vidsrcId === vidsrcMovie.id)) continue;
          
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
                ${vidsrcMovie.rating || 0}, ${100},
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
          
          finalMovies.push(movie);
        }
        
        // Update totals if we got VidSrc results
        if (vidsrcResponse.total > totalResults) {
          totalResults = vidsrcResponse.total;
          totalPages = vidsrcResponse.totalPages;
        }
      } catch (error) {
        // Continue with local results if VidSrc fails
        console.error('VidSrc search failed:', error);
      }
    }
    
    return {
      movies: finalMovies,
      page,
      totalPages,
      totalResults,
      searchQuery,
      appliedFilters: {
        genre: req.genre,
        releaseYear: req.releaseYear,
        minRating: req.minRating,
        maxRating: req.maxRating,
        keyword: req.keyword,
        hasAudioDescription: req.hasAudioDescription,
        hasClosedCaptions: req.hasClosedCaptions,
        hasSignLanguage: req.hasSignLanguage,
      },
    };
  }
);
