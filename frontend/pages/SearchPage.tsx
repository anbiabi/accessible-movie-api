import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MovieCard } from '../components/MovieCard';
import { AdvancedSearchFilters } from '../components/AdvancedSearchFilters';
import { VoiceNavigation } from '../components/VoiceNavigation';
import { SmartSearch } from '../components/SmartSearch';
import { AIAssistant } from '../components/AIAssistant';
import { useAccessibility } from '../contexts/AccessibilityContext';
import backend from '~backend/client';

interface SearchFilters {
  genre?: string;
  releaseYear?: number;
  minRating?: number;
  maxRating?: number;
  keyword?: string;
  hasAudioDescription?: boolean;
  hasClosedCaptions?: boolean;
  hasSignLanguage?: boolean;
  sortBy?: 'relevance' | 'rating' | 'release_date' | 'title' | 'accessibility_score';
  sortOrder?: 'asc' | 'desc';
}

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchInsights, setSearchInsights] = useState<any>(null);
  const { announceToScreenReader } = useAccessibility();

  const query = searchParams.get('q') || '';

  const { data: basicSearchResults, isLoading, error } = useQuery({
    queryKey: ['search-movies', query, filters],
    queryFn: () => backend.movies.search({ 
      query, 
      page: 1, 
      limit: 20,
      ...filters
    }),
    enabled: !!query && searchResults.length === 0,
    onSuccess: (data) => {
      if (searchResults.length === 0) {
        setSearchResults(data.movies);
        announceToScreenReader(`Found ${data.totalResults} movies for "${query}"`);
      }
    },
    onError: () => {
      announceToScreenReader('Search failed. Please try again.');
    },
  });

  useEffect(() => {
    // Clear results when query changes
    if (query !== searchParams.get('q')) {
      setSearchResults([]);
      setSearchInsights(null);
    }
  }, [searchParams]);

  const handleSmartSearchResults = (results: any[]) => {
    setSearchResults(results);
    if (results.length > 0) {
      announceToScreenReader(`Smart search found ${results.length} results`);
    }
  };

  const handleSearchInsights = (insights: any) => {
    setSearchInsights(insights);
  };

  const handleVoiceCommand = (action: string, data?: any) => {
    switch (action) {
      case 'search':
        if (data?.query) {
          setSearchParams({ q: data.query });
        }
        break;
      case 'filter':
        if (data?.filter) {
          const filterType = data.filter.toLowerCase();
          if (filterType.includes('audio description')) {
            setFilters(prev => ({ ...prev, hasAudioDescription: true }));
          } else if (filterType.includes('captions')) {
            setFilters(prev => ({ ...prev, hasClosedCaptions: true }));
          } else if (filterType.includes('sign language')) {
            setFilters(prev => ({ ...prev, hasSignLanguage: true }));
          }
        }
        break;
    }
  };

  const handleAIAction = (action: string, data?: any) => {
    switch (action) {
      case 'search':
      case 'search_assistance':
        if (data?.query) {
          setSearchParams({ q: data.query });
        }
        break;
      case 'filter':
        if (data?.filter) {
          // Apply AI-suggested filters
          setFilters(prev => ({ ...prev, ...data.filter }));
        }
        break;
      case 'recommend':
        // Navigate to recommendations or apply recommendation filters
        setFilters(prev => ({ ...prev, sortBy: 'accessibility_score', sortOrder: 'desc' }));
        break;
    }
  };

  const clearFilters = () => {
    setFilters({});
    announceToScreenReader('All filters cleared');
  };

  const displayResults = searchResults.length > 0 ? searchResults : (basicSearchResults?.movies || []);
  const totalResults = searchResults.length > 0 ? searchResults.length : (basicSearchResults?.totalResults || 0);

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">AI-Enhanced Search</h1>
        <p className="text-muted-foreground mb-6">
          Find accessible movies and documentaries with intelligent search and voice commands
        </p>
      </div>

      {/* Smart Search */}
      <SmartSearch
        onResults={handleSmartSearchResults}
        onInsights={handleSearchInsights}
        placeholder="Search for accessible movies, documentaries, and more..."
        autoFocus={!query}
      />

      {/* Voice Navigation */}
      <VoiceNavigation 
        context="search" 
        onCommand={handleVoiceCommand}
      />

      {/* Advanced Filters */}
      <AdvancedSearchFilters
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={clearFilters}
        isVisible={showFilters}
        onToggleVisibility={() => setShowFilters(!showFilters)}
      />

      {/* Search Results */}
      {query && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              Search Results for "{query}"
            </h2>
            <div className="text-sm text-muted-foreground">
              <p>{totalResults} results found</p>
              {searchInsights && searchInsights.accessibilityMatches > 0 && (
                <p>{searchInsights.accessibilityMatches} with accessibility features</p>
              )}
              {Object.keys(filters).length > 0 && (
                <p>Filters applied</p>
              )}
            </div>
          </div>

          {isLoading && searchResults.length === 0 && (
            <div className="flex items-center justify-center min-h-64" role="status" aria-live="polite">
              <Loader2 className="h-8 w-8 animate-spin mr-2" aria-hidden="true" />
              <span>Searching accessible movies...</span>
            </div>
          )}

          {error && (
            <Alert variant="destructive" role="alert">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertDescription>
                Search failed. Please check your connection and try again.
              </AlertDescription>
            </Alert>
          )}

          {displayResults.length > 0 && (
            <div 
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
              role="grid"
              aria-label={`Search results for ${query}`}
            >
              {displayResults.map((movie) => (
                <div key={movie.id || movie.movieId} role="gridcell">
                  <MovieCard 
                    movie={movie.id ? movie : { 
                      id: movie.movieId, 
                      title: movie.title,
                      overview: movie.overview,
                      posterPath: movie.posterPath,
                      voteAverage: movie.relevanceScore * 10,
                      voteCount: 100,
                      genres: [],
                      accessibilityFeatures: {},
                      audioDescriptionAvailable: movie.accessibilityScore > 0.3,
                      closedCaptionsAvailable: movie.accessibilityScore > 0.3,
                      signLanguageAvailable: movie.accessibilityScore > 0.5
                    }} 
                    showFavoriteButton={false}
                  />
                </div>
              ))}
            </div>
          )}

          {displayResults.length === 0 && !isLoading && !error && query && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No accessible movies found for "{query}".
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Try adjusting your search terms, using the AI assistant, or clearing filters.
              </p>
              {Object.keys(filters).length > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-primary hover:underline"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Search Tips */}
      {!query && (
        <div className="max-w-2xl mx-auto bg-muted/50 rounded-lg p-6">
          <h3 className="font-semibold mb-3">AI-Enhanced Search Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Smart Search</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Natural language understanding</li>
                <li>• Accessibility-focused results</li>
                <li>• Semantic content matching</li>
                <li>• Voice command support</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">AI Assistant</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Personalized recommendations</li>
                <li>• Proactive search suggestions</li>
                <li>• Context-aware filtering</li>
                <li>• Accessibility guidance</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant for Search Context */}
      <AIAssistant 
        context="search"
        onAction={handleAIAction}
      />
    </div>
  );
}
