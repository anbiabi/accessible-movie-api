import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle, Play, Star, Calendar, Clock, Volume2, Captions, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { VoiceNavigation } from '../components/VoiceNavigation';
import { BrailleDisplay } from '../components/BrailleDisplay';
import { useAccessibility } from '../contexts/AccessibilityContext';
import backend from '~backend/client';

export function MovieDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { announceToScreenReader } = useAccessibility();

  const { data: movie, isLoading, error } = useQuery({
    queryKey: ['movie-details', id],
    queryFn: () => backend.movies.details({ id: parseInt(id!), userId: 'demo-user' }),
    enabled: !!id,
    onSuccess: (data) => {
      announceToScreenReader(`Loaded details for ${data.title}`);
    },
    onError: () => {
      announceToScreenReader('Failed to load movie details');
    },
  });

  const { data: streamingData } = useQuery({
    queryKey: ['streaming-url', id],
    queryFn: () => backend.movies.getStreamingUrl({ movieId: parseInt(id!) }),
    enabled: !!id,
  });

  const { data: narrationData } = useQuery({
    queryKey: ['movie-narration', id],
    queryFn: () => backend.movies.generateNarration({ 
      movieId: parseInt(id!),
      includeSceneDescriptions: true,
      includeCharacterDescriptions: true,
      includeActionDescriptions: true,
      voiceStyle: 'professional'
    }),
    enabled: !!id,
  });

  const handleVoiceCommand = (action: string, data?: any) => {
    switch (action) {
      case 'play':
        if (streamingData?.streamingUrl) {
          window.open(streamingData.streamingUrl, '_blank', 'noopener,noreferrer');
        }
        break;
      case 'read_description':
        if (movie?.overview) {
          announceToScreenReader(movie.overview);
        }
        break;
      case 'accessibility_features':
        const features = [];
        if (movie?.audioDescriptionAvailable) features.push('audio description');
        if (movie?.closedCaptionsAvailable) features.push('closed captions');
        if (movie?.signLanguageAvailable) features.push('sign language interpretation');
        const featuresText = features.length > 0 
          ? `This movie has: ${features.join(', ')}`
          : 'No specific accessibility features listed';
        announceToScreenReader(featuresText);
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64" role="status" aria-live="polite">
        <Loader2 className="h-8 w-8 animate-spin mr-2" aria-hidden="true" />
        <span>Loading movie details...</span>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <Alert variant="destructive" role="alert">
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
        <AlertDescription>
          Failed to load movie details. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  const posterUrl = movie.posterPath 
    ? `https://image.tmdb.org/t/p/w500${movie.posterPath}`
    : '/placeholder-movie.jpg';

  const backdropUrl = movie.backdropPath 
    ? `https://image.tmdb.org/t/p/w1280${movie.backdropPath}`
    : null;

  const handleWatchMovie = () => {
    if (streamingData?.streamingUrl) {
      window.open(streamingData.streamingUrl, '_blank', 'noopener,noreferrer');
      announceToScreenReader(`Opening ${movie.title} in new window`);
    }
  };

  // Combine all text for braille display
  const brailleText = [
    `Title: ${movie.title}`,
    movie.overview ? `Overview: ${movie.overview}` : '',
    movie.narratedDescription ? `Narrated Description: ${movie.narratedDescription}` : '',
    narrationData?.narratedDescription ? `AI Narration: ${narrationData.narratedDescription}` : ''
  ].filter(Boolean).join('\n\n');

  return (
    <div className="space-y-8">
      {/* Voice Navigation */}
      <VoiceNavigation 
        context="details" 
        movieId={parseInt(id!)}
        onCommand={handleVoiceCommand}
      />

      {/* Hero Section */}
      <div className="relative">
        {backdropUrl && (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-20 rounded-lg"
            style={{ backgroundImage: `url(${backdropUrl})` }}
            aria-hidden="true"
          />
        )}
        <div className="relative bg-gradient-to-r from-background/90 to-background/70 rounded-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Poster */}
            <div className="md:col-span-1">
              <img
                src={posterUrl}
                alt={`Poster for ${movie.title}`}
                className="w-full max-w-sm mx-auto rounded-lg shadow-lg"
              />
            </div>

            {/* Movie Info */}
            <div className="md:col-span-2 space-y-6">
              <div>
                <h1 className="text-4xl font-bold mb-2">{movie.title}</h1>
                
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  {movie.releaseDate && (
                    <div className="flex items-center gap-1" aria-label={`Release date: ${new Date(movie.releaseDate).getFullYear()}`}>
                      <Calendar className="h-4 w-4" aria-hidden="true" />
                      <span>{new Date(movie.releaseDate).getFullYear()}</span>
                    </div>
                  )}
                  
                  {movie.runtime && (
                    <div className="flex items-center gap-1" aria-label={`Runtime: ${movie.runtime} minutes`}>
                      <Clock className="h-4 w-4" aria-hidden="true" />
                      <span>{movie.runtime} min</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1" aria-label={`Rating: ${movie.voteAverage.toFixed(1)} out of 10`}>
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                    <span className="font-medium">{movie.voteAverage.toFixed(1)}</span>
                    <span className="text-muted-foreground">({movie.voteCount} votes)</span>
                  </div>
                </div>

                {/* Genres */}
                {movie.genres && movie.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {movie.genres.map((genre) => (
                      <Badge key={genre.id} variant="secondary">
                        {genre.name}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Accessibility Features */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {movie.audioDescriptionAvailable && (
                    <Badge variant="outline" className="bg-green-50 border-green-200">
                      <Volume2 className="h-3 w-3 mr-1" aria-hidden="true" />
                      Audio Description
                    </Badge>
                  )}
                  {movie.closedCaptionsAvailable && (
                    <Badge variant="outline" className="bg-blue-50 border-blue-200">
                      <Captions className="h-3 w-3 mr-1" aria-hidden="true" />
                      Closed Captions
                    </Badge>
                  )}
                  {movie.signLanguageAvailable && (
                    <Badge variant="outline" className="bg-purple-50 border-purple-200">
                      <Eye className="h-3 w-3 mr-1" aria-hidden="true" />
                      Sign Language
                    </Badge>
                  )}
                  {narrationData && (
                    <Badge variant="outline" className="bg-orange-50 border-orange-200">
                      AI Narration Available
                    </Badge>
                  )}
                </div>

                {/* Watch Button */}
                {streamingData?.streamingUrl && (
                  <Button 
                    size="lg" 
                    onClick={handleWatchMovie}
                    className="mb-4"
                    aria-label={`Watch ${movie.title} with accessibility features`}
                  >
                    <Play className="h-5 w-5 mr-2" aria-hidden="true" />
                    Watch Movie
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview */}
          {movie.overview && (
            <Card>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{movie.overview}</p>
              </CardContent>
            </Card>
          )}

          {/* Narrated Description */}
          {movie.narratedDescription && (
            <Card>
              <CardHeader>
                <CardTitle>Narrated Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{movie.narratedDescription}</p>
              </CardContent>
            </Card>
          )}

          {/* AI-Generated Narration */}
          {narrationData && (
            <Card>
              <CardHeader>
                <CardTitle>AI-Enhanced Narration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">{narrationData.narratedDescription}</p>
                
                {narrationData.estimatedDuration && (
                  <div className="text-sm text-muted-foreground">
                    <strong>Estimated reading time:</strong> {Math.ceil(narrationData.estimatedDuration / 60)} minutes
                  </div>
                )}

                {narrationData.sceneDescriptions && narrationData.sceneDescriptions.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Scene Descriptions</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {narrationData.sceneDescriptions.map((desc, index) => (
                        <li key={index}>• {desc}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Braille Display */}
          <BrailleDisplay 
            text={brailleText}
            title={`${movie.title} - Braille Text`}
            showControls={true}
          />

          {/* Accessibility Instructions */}
          {streamingData?.instructions && (
            <Card>
              <CardHeader>
                <CardTitle>Accessibility Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Keyboard Navigation</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {streamingData.instructions.keyboardNavigation.map((instruction, index) => (
                      <li key={index}>• {instruction}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Screen Reader Tips</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {streamingData.instructions.screenReaderTips.map((tip, index) => (
                      <li key={index}>• {tip}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Accessibility Controls</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {streamingData.instructions.accessibilityControls.map((control, index) => (
                      <li key={index}>• {control}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Accessibility Features */}
          <Card>
            <CardHeader>
              <CardTitle>Accessibility Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Audio Description</span>
                <Badge variant={movie.audioDescriptionAvailable ? "default" : "secondary"}>
                  {movie.audioDescriptionAvailable ? "Available" : "Not Available"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Closed Captions</span>
                <Badge variant={movie.closedCaptionsAvailable ? "default" : "secondary"}>
                  {movie.closedCaptionsAvailable ? "Available" : "Not Available"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Sign Language</span>
                <Badge variant={movie.signLanguageAvailable ? "default" : "secondary"}>
                  {movie.signLanguageAvailable ? "Available" : "Not Available"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">AI Narration</span>
                <Badge variant={narrationData ? "default" : "secondary"}>
                  {narrationData ? "Available" : "Not Available"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Braille Support</span>
                <Badge variant="default">Available</Badge>
              </div>
            </CardContent>
          </Card>

          {/* User Ratings */}
          {(movie.userRating || movie.userAccessibilityRating) && (
            <Card>
              <CardHeader>
                <CardTitle>Your Ratings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {movie.userRating && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Movie Rating</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                      <span>{movie.userRating}/10</span>
                    </div>
                  </div>
                )}
                {movie.userAccessibilityRating && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Accessibility Rating</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-blue-400 text-blue-400" aria-hidden="true" />
                      <span>{movie.userAccessibilityRating}/5</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
