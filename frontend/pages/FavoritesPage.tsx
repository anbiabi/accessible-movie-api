import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Heart, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MovieCard } from '../components/MovieCard';
import { useAccessibility } from '../contexts/AccessibilityContext';
import backend from '~backend/client';

export function FavoritesPage() {
  const { announceToScreenReader } = useAccessibility();
  const userId = 'demo-user'; // In a real app, this would come from authentication

  const { data: favoritesData, isLoading, error } = useQuery({
    queryKey: ['user-favorites', userId],
    queryFn: () => backend.movies.getFavorites({ userId }),
    onSuccess: (data) => {
      announceToScreenReader(`Loaded ${data.movies.length} favorite movies`);
    },
    onError: () => {
      announceToScreenReader('Failed to load favorite movies');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64" role="status" aria-live="polite">
        <Loader2 className="h-8 w-8 animate-spin mr-2" aria-hidden="true" />
        <span>Loading your favorite movies...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" role="alert">
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
        <AlertDescription>
          Failed to load your favorite movies. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Heart className="h-8 w-8 text-red-500" aria-hidden="true" />
          <h1 className="text-3xl font-bold">Your Favorite Movies</h1>
        </div>
        <p className="text-muted-foreground">
          Your curated collection of accessible movies
        </p>
      </div>

      {/* Favorites Grid */}
      {favoritesData?.movies && favoritesData.movies.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              {favoritesData.movies.length} Favorite{favoritesData.movies.length !== 1 ? 's' : ''}
            </h2>
          </div>

          <div 
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
            role="grid"
            aria-label="Your favorite movies"
          >
            {favoritesData.movies.map((movie) => (
              <div key={movie.id} role="gridcell">
                <MovieCard 
                  movie={movie}
                  showFavoriteButton={false}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
          <h3 className="text-xl font-semibold mb-2">No Favorites Yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Start building your collection of accessible movies by adding favorites as you browse.
          </p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Browse popular movies on the home page</p>
            <p>• Search for movies with accessibility features</p>
            <p>• Click the heart icon to add movies to your favorites</p>
          </div>
        </div>
      )}

      {/* Accessibility Info */}
      {favoritesData?.movies && favoritesData.movies.length > 0 && (
        <div className="bg-muted/50 rounded-lg p-6">
          <h3 className="font-semibold mb-3">Your Accessibility Preferences</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Audio Descriptions:</span>
              <span className="ml-2 text-muted-foreground">
                {favoritesData.movies.filter(m => m.audioDescriptionAvailable).length} of {favoritesData.movies.length} movies
              </span>
            </div>
            <div>
              <span className="font-medium">Closed Captions:</span>
              <span className="ml-2 text-muted-foreground">
                {favoritesData.movies.filter(m => m.closedCaptionsAvailable).length} of {favoritesData.movies.length} movies
              </span>
            </div>
            <div>
              <span className="font-medium">Sign Language:</span>
              <span className="ml-2 text-muted-foreground">
                {favoritesData.movies.filter(m => m.signLanguageAvailable).length} of {favoritesData.movies.length} movies
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
