import { api, APIError } from "encore.dev/api";
import { moviesDB } from "./db";

interface GetStreamingUrlRequest {
  movieId: number;
}

interface StreamingUrlResponse {
  streamingUrl: string;
  embedUrl: string;
  accessibilityFeatures: {
    audioDescriptionAvailable: boolean;
    closedCaptionsAvailable: boolean;
    signLanguageAvailable: boolean;
  };
  instructions: {
    keyboardNavigation: string[];
    screenReaderTips: string[];
    accessibilityControls: string[];
  };
}

// Generates accessible streaming URLs with keyboard navigation and screen reader support.
export const getStreamingUrl = api<GetStreamingUrlRequest, StreamingUrlResponse>(
  { expose: true, method: "GET", path: "/movies/:movieId/stream" },
  async (req) => {
    const { movieId } = req;
    
    // Get movie details
    const movie = await moviesDB.queryRow`
      SELECT * FROM movies WHERE id = ${movieId}
    `;
    
    if (!movie) {
      throw APIError.notFound("Movie not found");
    }
    
    // Generate streaming URL using vidsrc.domains
    let streamingUrl: string;
    let embedUrl: string;
    
    if (movie.vidsrc_id) {
      streamingUrl = `https://vidsrc.domains/embed/movie/${movie.vidsrc_id}`;
      embedUrl = `https://vidsrc.domains/embed/movie/${movie.vidsrc_id}?autoplay=0&controls=1`;
    } else if (movie.imdb_id) {
      streamingUrl = `https://vidsrc.domains/embed/movie/${movie.imdb_id}`;
      embedUrl = `https://vidsrc.domains/embed/movie/${movie.imdb_id}?autoplay=0&controls=1`;
    } else {
      throw APIError.notFound("No streaming source available for this movie");
    }
    
    return {
      streamingUrl,
      embedUrl,
      accessibilityFeatures: {
        audioDescriptionAvailable: movie.audio_description_available,
        closedCaptionsAvailable: movie.closed_captions_available,
        signLanguageAvailable: movie.sign_language_available,
      },
      instructions: {
        keyboardNavigation: [
          "Press Space or Enter to play/pause the video",
          "Use Arrow keys (Left/Right) to seek backward/forward",
          "Use Arrow keys (Up/Down) to adjust volume",
          "Press F to toggle fullscreen mode",
          "Press M to mute/unmute audio",
          "Press C to toggle closed captions",
          "Press Tab to navigate between video controls",
        ],
        screenReaderTips: [
          "Video player controls are labeled for screen readers",
          "Current playback time and duration are announced",
          "Volume level changes are announced",
          "Caption availability is indicated in the controls",
          "Use NVDA or JAWS browse mode to access video information",
        ],
        accessibilityControls: [
          "Closed captions can be enabled in the video settings",
          "Audio description track available if supported",
          "High contrast mode available in browser settings",
          "Video speed can be adjusted for better comprehension",
          "Keyboard shortcuts work when video player has focus",
        ],
      },
    };
  }
);
