export interface Movie {
  id: number;
  vidsrcId?: string;
  imdbId?: string;
  title: string;
  overview?: string;
  narratedDescription?: string;
  releaseDate?: string;
  posterPath?: string;
  backdropPath?: string;
  voteAverage: number;
  voteCount: number;
  runtime?: number;
  genres: Genre[];
  accessibilityFeatures: AccessibilityFeatures;
  audioDescriptionAvailable: boolean;
  closedCaptionsAvailable: boolean;
  signLanguageAvailable: boolean;
  userRating?: number;
  userAccessibilityRating?: number;
  isFavorite?: boolean;
}

export interface Genre {
  id: number;
  name: string;
}

export interface AccessibilityFeatures {
  audioDescription?: boolean;
  closedCaptions?: boolean;
  signLanguage?: boolean;
  highContrast?: boolean;
  largeText?: boolean;
  keyboardNavigation?: boolean;
  screenReaderOptimized?: boolean;
  brailleSupport?: boolean;
}

export interface UserRating {
  id: number;
  userId: string;
  movieId: number;
  rating: number;
  review?: string;
  accessibilityRating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserFavorite {
  id: number;
  userId: string;
  movieId: number;
  createdAt: string;
}

export interface AccessibilityReport {
  id: number;
  movieId: number;
  userId: string;
  reportType: 'audio_description' | 'captions' | 'navigation' | 'other';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface VidSrcMovie {
  id: string;
  title: string;
  year: number;
  type: 'movie' | 'tv';
  poster?: string;
  backdrop?: string;
  rating?: number;
  description?: string;
  genres?: string[];
  duration?: number;
}

export interface VidSrcResponse {
  results: VidSrcMovie[];
  total: number;
  page: number;
  totalPages: number;
}
