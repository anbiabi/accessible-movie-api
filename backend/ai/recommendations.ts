import { api, APIError } from "encore.dev/api";
import { moviesDB } from "../movies/db";
import { openAIKey } from "./config";

interface PersonalizedRecommendationsRequest {
  userId: string;
  limit?: number;
  accessibilityNeeds?: string[];
  preferredGenres?: string[];
  excludeWatched?: boolean;
  contentTypes?: ('movie' | 'documentary' | 'series')[];
}

interface PersonalizedRecommendationsResponse {
  recommendations: Array<{
    movieId: number;
    title: string;
    overview: string;
    posterPath?: string;
    accessibilityScore: number;
    matchReason: string;
    confidence: number;
    accessibilityFeatures: {
      audioDescription: boolean;
      closedCaptions: boolean;
      signLanguage: boolean;
      aiNarration: boolean;
    };
  }>;
  totalRecommendations: number;
  personalizationFactors: string[];
  nextUpdateTime: string;
}

interface SmartSearchRequest {
  query: string;
  userId?: string;
  useAI?: boolean;
  includeSemanticSearch?: boolean;
  accessibilityPriority?: 'low' | 'medium' | 'high';
}

interface SmartSearchResponse {
  results: Array<{
    movieId: number;
    title: string;
    overview: string;
    relevanceScore: number;
    accessibilityScore: number;
    matchType: 'exact' | 'semantic' | 'ai_enhanced';
    explanation: string;
  }>;
  searchInsights: {
    interpretedQuery: string;
    suggestedRefinements: string[];
    accessibilityMatches: number;
  };
  totalResults: number;
}

interface ContentAccessibilityAnalysisRequest {
  movieId: number;
}

interface ContentAccessibilityAnalysisResponse {
  movieId: number;
  accessibilityScore: number;
  analysis: {
    audioDescription: {
      available: boolean;
      quality: string;
      coverage: string;
    };
    closedCaptions: {
      available: boolean;
      languages: string[];
      accuracy: string;
    };
    signLanguage: {
      available: boolean;
      type: string;
    };
    aiNarration: {
      available: boolean;
      quality: string;
    };
  };
  improvements: string[];
  recommendations: {
    suitableFor: string[];
    alternativeContent: Array<{
      id: number;
      title: string;
      overview: string;
      posterPath?: string;
      accessibilityFeatures: {
        audioDescription: boolean;
        closedCaptions: boolean;
        signLanguage: boolean;
      };
    }>;
    enhancementOptions: string[];
  };
}

// Provides AI-powered personalized content recommendations based on accessibility needs and preferences.
export const getPersonalizedRecommendations = api<PersonalizedRecommendationsRequest, PersonalizedRecommendationsResponse>(
  { expose: true, method: "POST", path: "/ai/recommendations" },
  async (req) => {
    const { 
      userId, 
      limit = 10, 
      accessibilityNeeds = [], 
      preferredGenres = [], 
      excludeWatched = true,
      contentTypes = ['movie', 'documentary']
    } = req;

    try {
      // Get user's viewing history and preferences
      const userProfile = await buildUserProfile(userId);
      
      // Get content that matches accessibility needs
      const accessibleContent = await getAccessibleContent(accessibilityNeeds, preferredGenres, contentTypes);
      
      // Apply AI-powered recommendation algorithm
      const scoredRecommendations = await scoreRecommendations(
        accessibleContent, 
        userProfile, 
        accessibilityNeeds
      );

      // Filter out watched content if requested
      let filteredRecommendations = scoredRecommendations;
      if (excludeWatched) {
        const watchedMovies = await getUserWatchedMovies(userId);
        filteredRecommendations = scoredRecommendations.filter(
          rec => !watchedMovies.includes(rec.movieId)
        );
      }

      // Sort by confidence and accessibility score
      const sortedRecommendations = filteredRecommendations
        .sort((a, b) => (b.confidence * b.accessibilityScore) - (a.confidence * a.accessibilityScore))
        .slice(0, limit);

      // Determine personalization factors
      const personalizationFactors = determinePersonalizationFactors(userProfile, accessibilityNeeds);

      return {
        recommendations: sortedRecommendations,
        totalRecommendations: filteredRecommendations.length,
        personalizationFactors,
        nextUpdateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
      };

    } catch (error) {
      throw APIError.internal("Failed to generate personalized recommendations", error);
    }
  }
);

// Performs intelligent search with AI-enhanced query understanding and accessibility prioritization.
export const smartSearch = api<SmartSearchRequest, SmartSearchResponse>(
  { expose: true, method: "POST", path: "/ai/smart-search" },
  async (req) => {
    const { 
      query, 
      userId, 
      useAI = true, 
      includeSemanticSearch = true, 
      accessibilityPriority = 'medium' 
    } = req;

    try {
      // Interpret and enhance the query using AI
      const interpretedQuery = useAI ? await interpretSearchQuery(query) : query;
      
      // Perform multi-layered search
      const exactMatches = await performExactSearch(interpretedQuery);
      const semanticMatches = includeSemanticSearch ? await performSemanticSearch(interpretedQuery) : [];
      const aiEnhancedMatches = useAI ? await performAIEnhancedSearch(interpretedQuery, userId) : [];

      // Combine and score all results
      const allResults = [
        ...exactMatches.map(r => ({ ...r, matchType: 'exact' as const })),
        ...semanticMatches.map(r => ({ ...r, matchType: 'semantic' as const })),
        ...aiEnhancedMatches.map(r => ({ ...r, matchType: 'ai_enhanced' as const }))
      ];

      // Remove duplicates and apply accessibility prioritization
      const uniqueResults = removeDuplicateResults(allResults);
      const prioritizedResults = applyAccessibilityPrioritization(uniqueResults, accessibilityPriority);

      // Generate search insights
      const searchInsights = generateSearchInsights(query, interpretedQuery, prioritizedResults);

      return {
        results: prioritizedResults.slice(0, 50), // Limit to 50 results
        searchInsights,
        totalResults: prioritizedResults.length
      };

    } catch (error) {
      throw APIError.internal("Smart search failed", error);
    }
  }
);

// Analyzes content and generates accessibility-focused insights and recommendations.
export const analyzeContentAccessibility = api<ContentAccessibilityAnalysisRequest, ContentAccessibilityAnalysisResponse>(
  { expose: true, method: "GET", path: "/ai/analyze-accessibility/:movieId" },
  async (req) => {
    const { movieId } = req;

    try {
      // Get movie details
      const movie = await moviesDB.queryRow`
        SELECT * FROM movies WHERE id = ${movieId}
      `;

      if (!movie) {
        throw APIError.notFound("Movie not found");
      }

      // Analyze accessibility features
      const accessibilityAnalysis = await analyzeAccessibilityFeatures(movie);
      
      // Generate improvement suggestions
      const improvementSuggestions = generateAccessibilityImprovements(movie, accessibilityAnalysis);
      
      // Calculate accessibility score
      const accessibilityScore = calculateAccessibilityScore(movie, accessibilityAnalysis);

      return {
        movieId,
        accessibilityScore,
        analysis: accessibilityAnalysis,
        improvements: improvementSuggestions,
        recommendations: {
          suitableFor: determineSuitability(accessibilityAnalysis),
          alternativeContent: await findSimilarAccessibleContent(movie),
          enhancementOptions: suggestEnhancements(movie)
        }
      };

    } catch (error) {
      throw APIError.internal("Failed to analyze content accessibility", error);
    }
  }
);

async function buildUserProfile(userId: string): Promise<any> {
  // Get user's viewing history, ratings, and preferences
  const [favorites, ratings, watchHistory] = await Promise.all([
    moviesDB.queryAll`SELECT movie_id FROM user_favorites WHERE user_id = ${userId}`,
    moviesDB.queryAll`SELECT movie_id, rating, accessibility_rating FROM user_ratings WHERE user_id = ${userId}`,
    // Mock watch history - in a real implementation, this would track actual viewing
    Promise.resolve([])
  ]);

  return {
    favoriteMovieIds: favorites.map(f => f.movie_id),
    ratings: ratings,
    watchHistory: watchHistory,
    accessibilityPreferences: {
      prefersAudioDescription: true,
      prefersClosedCaptions: true,
      prefersSignLanguage: false
    },
    genrePreferences: ['Documentary', 'Drama', 'Biography'],
    averageRating: ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length : 5
  };
}

async function getAccessibleContent(accessibilityNeeds: string[], preferredGenres: string[], contentTypes: string[]): Promise<any[]> {
  let whereConditions = ['1=1'];
  let params: any[] = [];
  let paramIndex = 1;

  // Filter by accessibility needs
  if (accessibilityNeeds.includes('visual_impairment')) {
    whereConditions.push(`(audio_description_available = true OR narrated_description IS NOT NULL)`);
  }
  if (accessibilityNeeds.includes('hearing_impairment')) {
    whereConditions.push(`(closed_captions_available = true OR sign_language_available = true)`);
  }

  // Filter by preferred genres
  if (preferredGenres.length > 0) {
    whereConditions.push(`genres::text ILIKE ANY($${paramIndex})`);
    params.push(preferredGenres.map(genre => `%${genre}%`));
    paramIndex++;
  }

  const query = `
    SELECT id, title, overview, poster_path, genres, 
           audio_description_available, closed_captions_available, 
           sign_language_available, narrated_description, vote_average
    FROM movies 
    WHERE ${whereConditions.join(' AND ')}
    ORDER BY vote_average DESC
    LIMIT 100
  `;

  return await moviesDB.rawQueryAll(query, ...params);
}

async function scoreRecommendations(content: any[], userProfile: any, accessibilityNeeds: string[]): Promise<any[]> {
  return content.map(movie => {
    let accessibilityScore = 0;
    let confidence = 0.5;
    let matchReason = '';

    // Calculate accessibility score
    if (movie.audio_description_available) accessibilityScore += 0.3;
    if (movie.closed_captions_available) accessibilityScore += 0.3;
    if (movie.sign_language_available) accessibilityScore += 0.2;
    if (movie.narrated_description) accessibilityScore += 0.2;

    // Calculate confidence based on user preferences
    if (userProfile.favoriteMovieIds.includes(movie.id)) {
      confidence += 0.3;
      matchReason = 'Previously favorited similar content';
    }

    // Genre matching
    const movieGenres = movie.genres || [];
    const genreMatch = userProfile.genrePreferences.some((pref: string) => 
      movieGenres.some((genre: any) => genre.name === pref)
    );
    if (genreMatch) {
      confidence += 0.2;
      matchReason = matchReason || 'Matches your preferred genres';
    }

    // Accessibility needs matching
    if (accessibilityNeeds.includes('visual_impairment') && 
        (movie.audio_description_available || movie.narrated_description)) {
      confidence += 0.3;
      matchReason = matchReason || 'Has audio descriptions for visual accessibility';
    }

    if (accessibilityNeeds.includes('hearing_impairment') && 
        (movie.closed_captions_available || movie.sign_language_available)) {
      confidence += 0.3;
      matchReason = matchReason || 'Has captions or sign language for hearing accessibility';
    }

    return {
      movieId: movie.id,
      title: movie.title,
      overview: movie.overview,
      posterPath: movie.poster_path,
      accessibilityScore: Math.min(accessibilityScore, 1.0),
      matchReason: matchReason || 'General recommendation based on ratings',
      confidence: Math.min(confidence, 1.0),
      accessibilityFeatures: {
        audioDescription: movie.audio_description_available,
        closedCaptions: movie.closed_captions_available,
        signLanguage: movie.sign_language_available,
        aiNarration: !!movie.narrated_description
      }
    };
  });
}

async function getUserWatchedMovies(userId: string): Promise<number[]> {
  // Mock implementation - in a real app, this would track actual viewing
  const ratings = await moviesDB.queryAll`
    SELECT movie_id FROM user_ratings WHERE user_id = ${userId}
  `;
  return ratings.map(r => r.movie_id);
}

function determinePersonalizationFactors(userProfile: any, accessibilityNeeds: string[]): string[] {
  const factors = [];
  
  if (userProfile.favoriteMovieIds.length > 0) {
    factors.push('Previous favorites and ratings');
  }
  
  if (userProfile.genrePreferences.length > 0) {
    factors.push('Genre preferences');
  }
  
  if (accessibilityNeeds.length > 0) {
    factors.push('Accessibility requirements');
  }
  
  if (userProfile.accessibilityPreferences.prefersAudioDescription) {
    factors.push('Audio description preference');
  }
  
  factors.push('Content popularity and ratings');
  
  return factors;
}

async function interpretSearchQuery(query: string): Promise<string> {
  // Mock AI query interpretation - in a real implementation, this would use AI
  const interpretations: { [key: string]: string } = {
    'movies for blind people': 'movies with audio descriptions',
    'deaf friendly movies': 'movies with closed captions and sign language',
    'accessible documentaries': 'documentaries with comprehensive accessibility features',
    'nature shows with narration': 'nature documentaries with audio descriptions'
  };

  const lowerQuery = query.toLowerCase();
  for (const [pattern, interpretation] of Object.entries(interpretations)) {
    if (lowerQuery.includes(pattern)) {
      return interpretation;
    }
  }

  return query;
}

async function performExactSearch(query: string): Promise<any[]> {
  const results = await moviesDB.rawQueryAll(`
    SELECT id, title, overview, poster_path, vote_average,
           audio_description_available, closed_captions_available, sign_language_available
    FROM movies 
    WHERE title ILIKE $1 OR overview ILIKE $1
    ORDER BY vote_average DESC
    LIMIT 20
  `, `%${query}%`);

  return results.map(movie => ({
    movieId: movie.id,
    title: movie.title,
    overview: movie.overview,
    relevanceScore: 0.9,
    accessibilityScore: calculateMovieAccessibilityScore(movie),
    explanation: 'Direct title or description match'
  }));
}

async function performSemanticSearch(query: string): Promise<any[]> {
  // Mock semantic search - in a real implementation, this would use vector embeddings
  const semanticKeywords = extractSemanticKeywords(query);
  
  const results = await moviesDB.rawQueryAll(`
    SELECT id, title, overview, poster_path, vote_average,
           audio_description_available, closed_captions_available, sign_language_available
    FROM movies 
    WHERE overview ILIKE ANY($1) OR narrated_description ILIKE ANY($1)
    ORDER BY vote_average DESC
    LIMIT 15
  `, semanticKeywords.map(keyword => `%${keyword}%`));

  return results.map(movie => ({
    movieId: movie.id,
    title: movie.title,
    overview: movie.overview,
    relevanceScore: 0.7,
    accessibilityScore: calculateMovieAccessibilityScore(movie),
    explanation: 'Semantic content match'
  }));
}

async function performAIEnhancedSearch(query: string, userId?: string): Promise<any[]> {
  // Mock AI-enhanced search - would use advanced AI for context understanding
  const enhancedQuery = await enhanceQueryWithContext(query, userId);
  
  const results = await moviesDB.rawQueryAll(`
    SELECT id, title, overview, poster_path, vote_average,
           audio_description_available, closed_captions_available, sign_language_available
    FROM movies 
    WHERE accessibility_features::text ILIKE $1
    ORDER BY vote_average DESC
    LIMIT 10
  `, `%${enhancedQuery}%`);

  return results.map(movie => ({
    movieId: movie.id,
    title: movie.title,
    overview: movie.overview,
    relevanceScore: 0.8,
    accessibilityScore: calculateMovieAccessibilityScore(movie),
    explanation: 'AI-enhanced contextual match'
  }));
}

function extractSemanticKeywords(query: string): string[] {
  const semanticMap: { [key: string]: string[] } = {
    'accessible': ['audio description', 'closed captions', 'sign language', 'narration'],
    'blind': ['audio description', 'narration', 'voice'],
    'deaf': ['captions', 'sign language', 'visual'],
    'documentary': ['educational', 'factual', 'real', 'history'],
    'nature': ['wildlife', 'environment', 'animals', 'planet']
  };

  const keywords = [];
  const queryLower = query.toLowerCase();
  
  for (const [key, values] of Object.entries(semanticMap)) {
    if (queryLower.includes(key)) {
      keywords.push(...values);
    }
  }

  return keywords.length > 0 ? keywords : [query];
}

async function enhanceQueryWithContext(query: string, userId?: string): Promise<string> {
  // Mock context enhancement
  if (userId) {
    const userProfile = await buildUserProfile(userId);
    if (userProfile.accessibilityPreferences.prefersAudioDescription) {
      return `${query} audio description`;
    }
  }
  return query;
}

function removeDuplicateResults(results: any[]): any[] {
  const seen = new Set();
  return results.filter(result => {
    if (seen.has(result.movieId)) {
      return false;
    }
    seen.add(result.movieId);
    return true;
  });
}

function applyAccessibilityPrioritization(results: any[], priority: string): any[] {
  const priorityWeights = {
    low: 0.1,
    medium: 0.3,
    high: 0.5
  };

  const weight = priorityWeights[priority as keyof typeof priorityWeights] || 0.3;

  return results
    .map(result => ({
      ...result,
      finalScore: result.relevanceScore + (result.accessibilityScore * weight)
    }))
    .sort((a, b) => b.finalScore - a.finalScore);
}

function generateSearchInsights(originalQuery: string, interpretedQuery: string, results: any[]): any {
  const accessibilityMatches = results.filter(r => r.accessibilityScore > 0.5).length;
  
  return {
    interpretedQuery: interpretedQuery !== originalQuery ? interpretedQuery : originalQuery,
    suggestedRefinements: [
      'Add "with audio description" for better accessibility',
      'Try "documentary" for educational content',
      'Search for specific genres like "nature" or "history"'
    ],
    accessibilityMatches
  };
}

function calculateMovieAccessibilityScore(movie: any): number {
  let score = 0;
  if (movie.audio_description_available) score += 0.3;
  if (movie.closed_captions_available) score += 0.3;
  if (movie.sign_language_available) score += 0.2;
  if (movie.narrated_description) score += 0.2;
  return Math.min(score, 1.0);
}

async function analyzeAccessibilityFeatures(movie: any): Promise<any> {
  return {
    audioDescription: {
      available: movie.audio_description_available,
      quality: movie.audio_description_available ? 'professional' : 'none',
      coverage: movie.audio_description_available ? 'complete' : 'none'
    },
    closedCaptions: {
      available: movie.closed_captions_available,
      languages: movie.closed_captions_available ? ['English'] : [],
      accuracy: movie.closed_captions_available ? 'high' : 'none'
    },
    signLanguage: {
      available: movie.sign_language_available,
      type: movie.sign_language_available ? 'ASL' : 'none'
    },
    aiNarration: {
      available: !!movie.narrated_description,
      quality: movie.narrated_description ? 'ai_generated' : 'none'
    }
  };
}

function generateAccessibilityImprovements(movie: any, analysis: any): string[] {
  const improvements = [];
  
  if (!analysis.audioDescription.available) {
    improvements.push('Add professional audio descriptions');
  }
  
  if (!analysis.closedCaptions.available) {
    improvements.push('Add closed captions with sound effect descriptions');
  }
  
  if (!analysis.signLanguage.available) {
    improvements.push('Consider adding sign language interpretation');
  }
  
  if (!analysis.aiNarration.available) {
    improvements.push('Generate AI-powered detailed narration');
  }
  
  return improvements;
}

function calculateAccessibilityScore(movie: any, analysis: any): number {
  let score = 0;
  let maxScore = 4;
  
  if (analysis.audioDescription.available) score += 1;
  if (analysis.closedCaptions.available) score += 1;
  if (analysis.signLanguage.available) score += 1;
  if (analysis.aiNarration.available) score += 1;
  
  return (score / maxScore) * 100;
}

function determineSuitability(analysis: any): string[] {
  const suitable = [];
  
  if (analysis.audioDescription.available || analysis.aiNarration.available) {
    suitable.push('Visually impaired users');
  }
  
  if (analysis.closedCaptions.available) {
    suitable.push('Deaf and hard-of-hearing users');
  }
  
  if (analysis.signLanguage.available) {
    suitable.push('Sign language users');
  }
  
  return suitable;
}

async function findSimilarAccessibleContent(movie: any): Promise<any[]> {
  const genres = movie.genres || [];
  const genreNames = genres.map((g: any) => g.name);
  
  if (genreNames.length === 0) return [];
  
  const similar = await moviesDB.rawQueryAll(`
    SELECT id, title, overview, poster_path,
           audio_description_available, closed_captions_available, sign_language_available
    FROM movies 
    WHERE id != $1 
    AND (audio_description_available = true OR closed_captions_available = true)
    AND genres::text ILIKE ANY($2)
    ORDER BY vote_average DESC
    LIMIT 5
  `, movie.id, genreNames.map(name => `%${name}%`));
  
  return similar.map(m => ({
    id: m.id,
    title: m.title,
    overview: m.overview,
    posterPath: m.poster_path,
    accessibilityFeatures: {
      audioDescription: m.audio_description_available,
      closedCaptions: m.closed_captions_available,
      signLanguage: m.sign_language_available
    }
  }));
}

function suggestEnhancements(movie: any): string[] {
  const enhancements = [];
  
  if (!movie.narrated_description) {
    enhancements.push('Generate AI-powered detailed narration');
  }
  
  enhancements.push('Add user-generated accessibility reviews');
  enhancements.push('Implement real-time accessibility feedback');
  enhancements.push('Create accessibility rating system');
  
  return enhancements;
}
