import { api, APIError } from "encore.dev/api";
import { moviesDB } from "./db";

interface RateMovieRequest {
  userId: string;
  movieId: number;
  rating: number;
  review?: string;
  accessibilityRating?: number;
}

interface GetRatingsRequest {
  movieId: number;
}

interface RatingsResponse {
  averageRating: number;
  averageAccessibilityRating: number;
  totalRatings: number;
  ratings: {
    id: number;
    userId: string;
    rating: number;
    review?: string;
    accessibilityRating?: number;
    createdAt: string;
  }[];
}

// Submits a user rating and review for a movie with accessibility feedback.
export const rateMovie = api<RateMovieRequest, void>(
  { expose: true, method: "POST", path: "/movies/ratings" },
  async (req) => {
    const { userId, movieId, rating, review, accessibilityRating } = req;
    
    if (rating < 1 || rating > 10) {
      throw APIError.invalidArgument("Rating must be between 1 and 10");
    }
    
    if (accessibilityRating && (accessibilityRating < 1 || accessibilityRating > 5)) {
      throw APIError.invalidArgument("Accessibility rating must be between 1 and 5");
    }
    
    // Check if movie exists
    const movie = await moviesDB.queryRow`
      SELECT id FROM movies WHERE id = ${movieId}
    `;
    
    if (!movie) {
      throw APIError.notFound("Movie not found");
    }
    
    // Insert or update rating
    await moviesDB.exec`
      INSERT INTO user_ratings (user_id, movie_id, rating, review, accessibility_rating) 
      VALUES (${userId}, ${movieId}, ${rating}, ${review || null}, ${accessibilityRating || null})
      ON CONFLICT (user_id, movie_id) 
      DO UPDATE SET 
        rating = EXCLUDED.rating,
        review = EXCLUDED.review,
        accessibility_rating = EXCLUDED.accessibility_rating,
        updated_at = NOW()
    `;
  }
);

// Retrieves all ratings and reviews for a movie including accessibility ratings.
export const getRatings = api<GetRatingsRequest, RatingsResponse>(
  { expose: true, method: "GET", path: "/movies/:movieId/ratings" },
  async (req) => {
    const { movieId } = req;
    
    // Get all ratings for the movie
    const ratings = await moviesDB.queryAll`
      SELECT id, user_id, rating, review, accessibility_rating, created_at
      FROM user_ratings 
      WHERE movie_id = ${movieId}
      ORDER BY created_at DESC
    `;
    
    // Calculate averages
    const totalRatings = ratings.length;
    const averageRating = totalRatings > 0 
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings 
      : 0;
    
    const accessibilityRatings = ratings.filter(r => r.accessibility_rating !== null);
    const averageAccessibilityRating = accessibilityRatings.length > 0
      ? accessibilityRatings.reduce((sum, r) => sum + r.accessibility_rating, 0) / accessibilityRatings.length
      : 0;
    
    return {
      averageRating,
      averageAccessibilityRating,
      totalRatings,
      ratings: ratings.map(rating => ({
        id: rating.id,
        userId: rating.user_id,
        rating: rating.rating,
        review: rating.review,
        accessibilityRating: rating.accessibility_rating,
        createdAt: rating.created_at,
      })),
    };
  }
);
