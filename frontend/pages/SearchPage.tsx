import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MovieCard } from '../components/MovieCard';
import { AdvancedSearchFilters } from '../components/AdvancedSearchFilters';
import { VoiceNavigation } from '../components/VoiceNavigation';
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
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const { announceToScreenReader } = useAccessibility();

  const query = searchParams.get('q') || '';

  const { data: searchResults, isLoading, error } = useQuery({
    queryKey: ['search-movies', query, filters],
    queryFn: () => backend.movies.search({ 
      query, 
      page: 1, 
      limit: 20,
      ...filters
    }),
    enabled: !!query,
    onSuccess: (data) => {
      announceToScreenReader(`Found ${data.totalResults} movies for "${query}"`);
    },
    onError: () => {
      announceToScreenReader('Search failed. Please try again.');
    },
  });

  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() });
    }
  };

  const handleVoiceCommand = (action: string, data?: any) => {
    switch (action) {
      case 'search':
        if (data?.query) {
          setSearchQuery(data.query);
          setSearchParams({ q: data.query });
        }
        break;
      case 'filter':
        if (data?.filter) {
          // Parse filter command and apply
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

  const clearFilters = () => {
    setFilters({});
    announceToScreenReader('All filters cleared');
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Search Accessible Movies</h1>
        <p className="text-muted-foreground mb-6">
          Find movies with audio descriptions, closed captions, and other accessibility features
        </p>
      </div>

      {/* Voice Navigation */}
      <VoiceNavigation 
        context="search" 
        onCommand={handleVoiceCommand}
      />

      {/* Search Form */}
      <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
        <div className="flex gap-2">
          <label htmlFor="search-input" className="sr-only">
            Search for movies with accessibility features
          </label>
          <Input
            id="search-input"
            type="search"
            placeholder="Search for accessible movies, actors, directors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
            aria-describedby="search-help"
          />
          <Button type="submit" aria-label="Search movies">
            <Search className="h-4 w-4 mr-2" aria-hidden="true" />
            Search
          </Button>
        </div>
        <p id="search-help" className="text-sm text-muted-foreground mt-2 text-center">
          Search includes movie titles, descriptions, and narrated content
        </p>
      </form>

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
            {searchResults && (
              <div className="text-sm text-muted-foreground">
                <p>{searchResults.totalResults} results found</p>
                {Object.keys(searchResults.appliedFilters).length > 0 && (
                  <p>Filters applied</p>
                )}
              </div>
            )}
          </div>

          {isLoading && (
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

          {searchResults && searchResults.movies.length > 0 && (
            <div 
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
              role="grid"
              aria-label={`Search results for ${query}`}
            >
              {searchResults.movies.map((movie) => (
                <div key={movie.id} role="gridcell">
                  <MovieCard 
                    movie={movie} 
                    showFavoriteButton={false}
                  />
                </div>
              ))}
            </div>
          )}

          {searchResults && searchResults.movies.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No accessible movies found for "{query}".
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Try adjusting your search terms or filters.
              </p>
              {Object.keys(filters).length > 0 && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Search Tips */}
      {!query && (
        <div className="max-w-2xl mx-auto bg-muted/50 rounded-lg p-6">
          <h3 className="font-semibold mb-3">Enhanced Search Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Search Options</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Search by movie title, actor, or director</li>
                <li>• Use keywords like "audio description" or "closed captions"</li>
                <li>• Search includes narrated descriptions</li>
                <li>• Voice commands supported</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Filter Options</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Filter by genre and release year</li>
                <li>• Set rating ranges</li>
                <li>• Filter by accessibility features</li>
                <li>• Sort by accessibility score</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
