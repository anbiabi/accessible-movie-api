import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MovieCard } from '../components/MovieCard';
import { useAccessibility } from '../contexts/AccessibilityContext';
import backend from '~backend/client';

export function HomePage() {
  const { announceToScreenReader } = useAccessibility();

  const { data: moviesData, isLoading, error } = useQuery({
    queryKey: ['popular-movies'],
    queryFn: () => backend.movies.popular({ page: 1, limit: 20 }),
    onSuccess: () => {
      announceToScreenReader('Popular movies loaded');
    },
    onError: () => {
      announceToScreenReader('Failed to load popular movies');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64" role="status" aria-live="polite">
        <Loader2 className="h-8 w-8 animate-spin mr-2" aria-hidden="true" />
        <span>Loading accessible movies...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" role="alert">
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
        <AlertDescription>
          Failed to load movies. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center py-12 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg">
        <h1 className="text-4xl font-bold mb-4">
          Welcome to AccessiCinema
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
          Discover movies with comprehensive accessibility features including audio descriptions, 
          closed captions, and screen reader optimization. Building the world's most inclusive movie database.
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          <div className="flex items-center gap-2 bg-background px-4 py-2 rounded-full">
            <span className="w-3 h-3 bg-green-500 rounded-full" aria-hidden="true"></span>
            <span>WCAG 2.1 AA+ Compliant</span>
          </div>
          <div className="flex items-center gap-2 bg-background px-4 py-2 rounded-full">
            <span className="w-3 h-3 bg-blue-500 rounded-full" aria-hidden="true"></span>
            <span>Screen Reader Optimized</span>
          </div>
          <div className="flex items-center gap-2 bg-background px-4 py-2 rounded-full">
            <span className="w-3 h-3 bg-purple-500 rounded-full" aria-hidden="true"></span>
            <span>Keyboard Navigation</span>
          </div>
        </div>
      </section>

      {/* Popular Movies Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Popular Accessible Movies</h2>
          <p className="text-sm text-muted-foreground">
            {moviesData?.totalResults} movies with accessibility features
          </p>
        </div>

        {moviesData?.movies && moviesData.movies.length > 0 ? (
          <div 
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
            role="grid"
            aria-label="Popular movies with accessibility features"
          >
            {moviesData.movies.map((movie) => (
              <div key={movie.id} role="gridcell">
                <MovieCard 
                  movie={movie} 
                  showFavoriteButton={false}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No movies found. Please try again later.</p>
          </div>
        )}
      </section>

      {/* Accessibility Features Info */}
      <section className="bg-muted/50 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Accessibility Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Audio Descriptions</h3>
            <p className="text-sm text-muted-foreground">
              Detailed narration of visual elements, actions, and scene changes for visually impaired users.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Closed Captions</h3>
            <p className="text-sm text-muted-foreground">
              Accurate subtitles including sound effects and speaker identification for deaf and hard-of-hearing users.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Screen Reader Support</h3>
            <p className="text-sm text-muted-foreground">
              Optimized for NVDA, JAWS, and VoiceOver with proper ARIA labels and semantic markup.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
