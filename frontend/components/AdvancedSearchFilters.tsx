import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Filter, X } from 'lucide-react';

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

interface AdvancedSearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onClearFilters: () => void;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

const genres = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
  'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery',
  'Romance', 'Science Fiction', 'TV Movie', 'Thriller', 'War', 'Western'
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => currentYear - i);

export function AdvancedSearchFilters({ 
  filters, 
  onFiltersChange, 
  onClearFilters, 
  isVisible, 
  onToggleVisibility 
}: AdvancedSearchFiltersProps) {
  const updateFilter = (key: keyof SearchFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && value !== false
  );

  return (
    <div className="space-y-4">
      {/* Filter Toggle Button */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onToggleVisibility}
          aria-expanded={isVisible}
          aria-controls="advanced-filters"
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" aria-hidden="true" />
          Advanced Filters
          {hasActiveFilters && (
            <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
              Active
            </span>
          )}
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Clear all filters"
          >
            <X className="h-4 w-4 mr-1" aria-hidden="true" />
            Clear All
          </Button>
        )}
      </div>

      {/* Filters Panel */}
      {isVisible && (
        <Card id="advanced-filters">
          <CardHeader>
            <CardTitle className="text-lg">Search Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Genre */}
              <div className="space-y-2">
                <Label htmlFor="genre-filter">Genre</Label>
                <Select 
                  value={filters.genre || ''} 
                  onValueChange={(value) => updateFilter('genre', value || undefined)}
                >
                  <SelectTrigger id="genre-filter">
                    <SelectValue placeholder="Any genre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any genre</SelectItem>
                    {genres.map((genre) => (
                      <SelectItem key={genre} value={genre}>
                        {genre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Release Year */}
              <div className="space-y-2">
                <Label htmlFor="year-filter">Release Year</Label>
                <Select 
                  value={filters.releaseYear?.toString() || ''} 
                  onValueChange={(value) => updateFilter('releaseYear', value ? parseInt(value) : undefined)}
                >
                  <SelectTrigger id="year-filter">
                    <SelectValue placeholder="Any year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any year</SelectItem>
                    {years.slice(0, 50).map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Keyword */}
              <div className="space-y-2">
                <Label htmlFor="keyword-filter">Keyword</Label>
                <Input
                  id="keyword-filter"
                  type="text"
                  placeholder="e.g., superhero, space"
                  value={filters.keyword || ''}
                  onChange={(e) => updateFilter('keyword', e.target.value || undefined)}
                />
              </div>
            </div>

            {/* Rating Range */}
            <div className="space-y-3">
              <Label>Rating Range</Label>
              <div className="px-3">
                <Slider
                  value={[filters.minRating || 0, filters.maxRating || 10]}
                  onValueChange={([min, max]) => {
                    updateFilter('minRating', min > 0 ? min : undefined);
                    updateFilter('maxRating', max < 10 ? max : undefined);
                  }}
                  max={10}
                  min={0}
                  step={0.1}
                  className="w-full"
                  aria-label="Rating range slider"
                />
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{filters.minRating || 0}</span>
                <span>{filters.maxRating || 10}</span>
              </div>
            </div>

            {/* Accessibility Features */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Accessibility Features</Label>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="audio-description-filter" className="text-sm">
                    Audio Description
                  </Label>
                  <Switch
                    id="audio-description-filter"
                    checked={filters.hasAudioDescription || false}
                    onCheckedChange={(checked) => updateFilter('hasAudioDescription', checked || undefined)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="closed-captions-filter" className="text-sm">
                    Closed Captions
                  </Label>
                  <Switch
                    id="closed-captions-filter"
                    checked={filters.hasClosedCaptions || false}
                    onCheckedChange={(checked) => updateFilter('hasClosedCaptions', checked || undefined)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="sign-language-filter" className="text-sm">
                    Sign Language
                  </Label>
                  <Switch
                    id="sign-language-filter"
                    checked={filters.hasSignLanguage || false}
                    onCheckedChange={(checked) => updateFilter('hasSignLanguage', checked || undefined)}
                  />
                </div>
              </div>
            </div>

            {/* Sorting */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sort-by">Sort By</Label>
                <Select 
                  value={filters.sortBy || 'relevance'} 
                  onValueChange={(value) => updateFilter('sortBy', value as any)}
                >
                  <SelectTrigger id="sort-by">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="release_date">Release Date</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="accessibility_score">Accessibility Score</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sort-order">Sort Order</Label>
                <Select 
                  value={filters.sortOrder || 'desc'} 
                  onValueChange={(value) => updateFilter('sortOrder', value as any)}
                >
                  <SelectTrigger id="sort-order">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Descending</SelectItem>
                    <SelectItem value="asc">Ascending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filter Summary */}
            {hasActiveFilters && (
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Active Filters:</h4>
                <div className="flex flex-wrap gap-2">
                  {filters.genre && (
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded text-sm">
                      Genre: {filters.genre}
                    </span>
                  )}
                  {filters.releaseYear && (
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded text-sm">
                      Year: {filters.releaseYear}
                    </span>
                  )}
                  {filters.keyword && (
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded text-sm">
                      Keyword: {filters.keyword}
                    </span>
                  )}
                  {(filters.minRating || filters.maxRating) && (
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded text-sm">
                      Rating: {filters.minRating || 0} - {filters.maxRating || 10}
                    </span>
                  )}
                  {filters.hasAudioDescription && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                      Audio Description
                    </span>
                  )}
                  {filters.hasClosedCaptions && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                      Closed Captions
                    </span>
                  )}
                  {filters.hasSignLanguage && (
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">
                      Sign Language
                    </span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
