import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Filter, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAccessibility } from '../contexts/AccessibilityContext';
import backend from '~backend/client';

interface SmartSearchProps {
  onResults?: (results: any[]) => void;
  onInsights?: (insights: any) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

interface SearchInsights {
  interpretedQuery: string;
  suggestedRefinements: string[];
  accessibilityMatches: number;
}

export function SmartSearch({ onResults, onInsights, placeholder, autoFocus = false }: SmartSearchProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [insights, setInsights] = useState<SearchInsights | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const { announceToScreenReader } = useAccessibility();

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('recent-searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }

    // Generate smart suggestions based on context
    generateSmartSuggestions();
  }, []);

  useEffect(() => {
    // Debounced search suggestions
    const timer = setTimeout(() => {
      if (query.length > 2) {
        generateSearchSuggestions(query);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const generateSmartSuggestions = () => {
    const contextualSuggestions = [
      'movies with audio descriptions',
      'documentaries with closed captions',
      'sign language interpreted films',
      'nature documentaries with narration',
      'accessible comedy movies',
      'drama films with audio descriptions',
      'educational content with captions',
      'biographical documentaries',
      'accessible action movies',
      'family-friendly accessible films'
    ];

    setSuggestions(contextualSuggestions.slice(0, 5));
  };

  const generateSearchSuggestions = async (searchQuery: string) => {
    try {
      // In a real implementation, this would call an AI service for intelligent suggestions
      const aiSuggestions = [
        `${searchQuery} with audio descriptions`,
        `${searchQuery} documentaries`,
        `accessible ${searchQuery}`,
        `${searchQuery} with captions`,
        `${searchQuery} for visually impaired`
      ];

      setSuggestions(aiSuggestions);
    } catch (error) {
      console.error('Failed to generate search suggestions:', error);
    }
  };

  const handleSearch = async (searchQuery?: string) => {
    const queryToSearch = searchQuery || query;
    if (!queryToSearch.trim()) return;

    setIsSearching(true);
    announceToScreenReader(`Searching for ${queryToSearch}`);

    try {
      // Perform AI-enhanced smart search
      const response = await backend.ai.smartSearch({
        query: queryToSearch,
        userId: 'demo-user',
        useAI: true,
        includeSemanticSearch: true,
        accessibilityPriority: 'high'
      });

      // Update insights
      setInsights(response.searchInsights);
      if (onInsights) {
        onInsights(response.searchInsights);
      }

      // Return results
      if (onResults) {
        onResults(response.results);
      }

      // Save to recent searches
      const updatedRecent = [queryToSearch, ...recentSearches.filter(s => s !== queryToSearch)].slice(0, 5);
      setRecentSearches(updatedRecent);
      localStorage.setItem('recent-searches', JSON.stringify(updatedRecent));

      announceToScreenReader(`Found ${response.totalResults} results for ${queryToSearch}`);

    } catch (error) {
      console.error('Smart search failed:', error);
      announceToScreenReader('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  const clearSearch = () => {
    setQuery('');
    setInsights(null);
    setSuggestions([]);
    if (onResults) {
      onResults([]);
    }
    if (onInsights) {
      onInsights(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Search Input */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              type="search"
              placeholder={placeholder || "Search for accessible movies, documentaries, and more..."}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch();
                }
                if (e.key === 'Escape') {
                  clearSearch();
                }
              }}
              className="pl-10 pr-4"
              autoFocus={autoFocus}
              aria-describedby="search-help"
            />
            <div id="search-help" className="sr-only">
              AI-powered search with accessibility prioritization. Press Enter to search, Escape to clear.
            </div>
          </div>
          
          <Button
            onClick={() => handleSearch()}
            disabled={!query.trim() || isSearching}
            aria-label="Search with AI enhancement"
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" aria-hidden="true" />
                Smart Search
              </>
            )}
          </Button>
        </div>

        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-16 top-1/2 transform -translate-y-1/2"
            aria-label="Clear search"
          >
            ×
          </Button>
        )}
      </div>

      {/* Search Insights */}
      {insights && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              AI Search Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.interpretedQuery !== query && (
              <div>
                <p className="text-sm font-medium">Interpreted as:</p>
                <p className="text-sm text-muted-foreground">"{insights.interpretedQuery}"</p>
              </div>
            )}
            
            <div>
              <p className="text-sm font-medium">Accessibility matches: {insights.accessibilityMatches}</p>
            </div>

            {insights.suggestedRefinements.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Suggested refinements:</p>
                <div className="flex flex-wrap gap-2">
                  {insights.suggestedRefinements.map((refinement, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestionClick(refinement)}
                      className="text-xs"
                    >
                      {refinement}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Search Suggestions */}
      {suggestions.length > 0 && !insights && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            {query ? 'AI Suggestions:' : 'Popular Searches:'}
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSuggestionClick(suggestion)}
                className="text-xs"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Recent Searches */}
      {recentSearches.length > 0 && !query && !insights && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Recent Searches:</p>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((search, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="cursor-pointer hover:bg-secondary/80"
                onClick={() => handleSuggestionClick(search)}
              >
                {search}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Search Tips */}
      {!query && !insights && (
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold mb-2">AI-Enhanced Search Tips</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
            <div>
              <p className="font-medium mb-1">Natural Language:</p>
              <ul className="space-y-1">
                <li>• "Find movies for blind people"</li>
                <li>• "Show me documentaries with captions"</li>
                <li>• "Accessible nature films"</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-1">Smart Features:</p>
              <ul className="space-y-1">
                <li>• AI interprets your intent</li>
                <li>• Prioritizes accessible content</li>
                <li>• Suggests related searches</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
