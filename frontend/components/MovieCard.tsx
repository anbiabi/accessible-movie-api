import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, Volume2, Captions, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useAccessibility } from '../contexts/AccessibilityContext';
import type { Movie } from '~backend/movies/types';

interface MovieCardProps {
  movie: Movie;
  onToggleFavorite?: (movieId: number) => void;
  showFavoriteButton?: boolean;
}

export function MovieCard({ movie, onToggleFavorite, showFavoriteButton = true }: MovieCardProps) {
  const { announceToScreenReader } = useAccessibility();

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(movie.id);
      announceToScreenReader(
        movie.isFavorite 
          ? `Removed ${movie.title} from favorites` 
          : `Added ${movie.title} to favorites`
      );
    }
  };

  const posterUrl = movie.posterPath 
    ? `https://image.tmdb.org/t/p/w500${movie.posterPath}`
    : '/placeholder-movie.jpg';

  const accessibilityFeatures = [];
  if (movie.audioDescriptionAvailable) accessibilityFeatures.push('Audio Description');
  if (movie.closedCaptionsAvailable) accessibilityFeatures.push('Closed Captions');
  if (movie.signLanguageAvailable) accessibilityFeatures.push('Sign Language');

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-200 focus-within:ring-2 focus-within:ring-primary">
      <Link 
        to={`/movie/${movie.id}`}
        className="block focus:outline-none"
        aria-label={`View details for ${movie.title}`}
      >
        <div className="relative overflow-hidden rounded-t-lg">
          <img
            src={posterUrl}
            alt={`Poster for ${movie.title}`}
            className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-200"
            loading="lazy"
          />
          
          {/* Accessibility badges overlay */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {movie.audioDescriptionAvailable && (
              <Badge variant="secondary" className="text-xs" aria-label="Audio description available">
                <Volume2 className="h-3 w-3 mr-1" aria-hidden="true" />
                AD
              </Badge>
            )}
            {movie.closedCaptionsAvailable && (
              <Badge variant="secondary" className="text-xs" aria-label="Closed captions available">
                <Captions className="h-3 w-3 mr-1" aria-hidden="true" />
                CC
              </Badge>
            )}
            {movie.signLanguageAvailable && (
              <Badge variant="secondary" className="text-xs" aria-label="Sign language available">
                <Eye className="h-3 w-3 mr-1" aria-hidden="true" />
                SL
              </Badge>
            )}
          </div>

          {/* Favorite button */}
          {showFavoriteButton && onToggleFavorite && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
              onClick={handleFavoriteClick}
              aria-label={movie.isFavorite ? `Remove ${movie.title} from favorites` : `Add ${movie.title} to favorites`}
            >
              <Heart 
                className={`h-4 w-4 ${movie.isFavorite ? 'fill-red-500 text-red-500' : ''}`} 
                aria-hidden="true"
              />
            </Button>
          )}
        </div>

        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {movie.title}
          </h3>
          
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center" aria-label={`Rating: ${movie.voteAverage.toFixed(1)} out of 10`}>
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" aria-hidden="true" />
              <span className="text-sm font-medium">{movie.voteAverage.toFixed(1)}</span>
            </div>
            {movie.releaseDate && (
              <span className="text-sm text-muted-foreground">
                {new Date(movie.releaseDate).getFullYear()}
              </span>
            )}
          </div>

          {movie.overview && (
            <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
              {movie.overview}
            </p>
          )}

          {movie.narratedDescription && (
            <div className="mb-3">
              <Badge variant="outline" className="text-xs mb-1">
                Narrated Description Available
              </Badge>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {movie.narratedDescription}
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="p-4 pt-0">
          {accessibilityFeatures.length > 0 && (
            <div className="w-full">
              <p className="text-xs text-muted-foreground mb-1">Accessibility Features:</p>
              <div className="flex flex-wrap gap-1">
                {accessibilityFeatures.map((feature) => (
                  <Badge key={feature} variant="outline" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardFooter>
      </Link>
    </Card>
  );
}
