import { api, APIError } from "encore.dev/api";
import { moviesDB } from "./db";

interface VoiceCommandRequest {
  command: string;
  context?: 'search' | 'player' | 'navigation' | 'details';
  movieId?: number;
  userId?: string;
}

interface VoiceCommandResponse {
  action: string;
  response: string;
  data?: any;
  speechText: string;
  navigationInstructions?: string[];
}

interface SpeechSettingsRequest {
  userId: string;
  speechRate?: number;
  speechPitch?: number;
  speechVolume?: number;
  preferredVoice?: string;
  enableSpeechNavigation?: boolean;
}

interface SpeechSettingsResponse {
  speechRate: number;
  speechPitch: number;
  speechVolume: number;
  preferredVoice: string;
  enableSpeechNavigation: boolean;
  availableVoices: string[];
}

// Processes voice commands for hands-free navigation and control.
export const processVoiceCommand = api<VoiceCommandRequest, VoiceCommandResponse>(
  { expose: true, method: "POST", path: "/movies/voice/command" },
  async (req) => {
    const { command, context = 'navigation', movieId, userId } = req;
    
    const normalizedCommand = command.toLowerCase().trim();
    
    // Parse voice commands based on context
    switch (context) {
      case 'search':
        return await handleSearchCommands(normalizedCommand);
      
      case 'player':
        return await handlePlayerCommands(normalizedCommand, movieId);
      
      case 'details':
        return await handleDetailsCommands(normalizedCommand, movieId);
      
      case 'navigation':
      default:
        return await handleNavigationCommands(normalizedCommand, userId);
    }
  }
);

// Updates user speech and voice navigation settings.
export const updateSpeechSettings = api<SpeechSettingsRequest, void>(
  { expose: true, method: "PUT", path: "/movies/voice/settings" },
  async (req) => {
    const { userId, speechRate, speechPitch, speechVolume, preferredVoice, enableSpeechNavigation } = req;
    
    // Update or insert user accessibility preferences
    await moviesDB.exec`
      INSERT INTO user_accessibility_preferences (
        user_id, preferred_narration_speed, enable_speech_navigation
      ) VALUES (
        ${userId}, ${speechRate || 1.0}, ${enableSpeechNavigation !== undefined ? enableSpeechNavigation : true}
      )
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        preferred_narration_speed = COALESCE(${speechRate}, user_accessibility_preferences.preferred_narration_speed),
        enable_speech_navigation = COALESCE(${enableSpeechNavigation}, user_accessibility_preferences.enable_speech_navigation),
        updated_at = NOW()
    `;
  }
);

// Retrieves user speech and voice navigation settings.
export const getSpeechSettings = api<{ userId: string }, SpeechSettingsResponse>(
  { expose: true, method: "GET", path: "/movies/voice/settings/:userId" },
  async (req) => {
    const { userId } = req;
    
    const settings = await moviesDB.queryRow`
      SELECT * FROM user_accessibility_preferences WHERE user_id = ${userId}
    `;
    
    return {
      speechRate: settings?.preferred_narration_speed || 1.0,
      speechPitch: 1.0, // Default pitch
      speechVolume: 1.0, // Default volume
      preferredVoice: settings?.preferred_voice_style || 'professional',
      enableSpeechNavigation: settings?.enable_speech_navigation !== false,
      availableVoices: [
        'professional',
        'casual',
        'dramatic',
        'friendly',
        'authoritative'
      ],
    };
  }
);

async function handleSearchCommands(command: string): Promise<VoiceCommandResponse> {
  // Parse search commands
  if (command.includes('search for') || command.includes('find')) {
    const searchTerm = extractSearchTerm(command);
    return {
      action: 'search',
      response: `Searching for "${searchTerm}"`,
      data: { query: searchTerm },
      speechText: `Searching for ${searchTerm}. Please wait while I find accessible movies.`,
      navigationInstructions: [
        'Search results will be announced when ready',
        'Use arrow keys to navigate through results',
        'Press Enter to select a movie'
      ]
    };
  }
  
  if (command.includes('filter by') || command.includes('show only')) {
    const filter = extractFilter(command);
    return {
      action: 'filter',
      response: `Applying filter: ${filter}`,
      data: { filter },
      speechText: `Filtering results by ${filter}. Updated results will be announced.`,
    };
  }
  
  return {
    action: 'unknown',
    response: 'Command not recognized',
    speechText: 'I did not understand that command. Try saying "search for" followed by a movie title, or "filter by" followed by a category.',
  };
}

async function handlePlayerCommands(command: string, movieId?: number): Promise<VoiceCommandResponse> {
  if (!movieId) {
    throw APIError.invalidArgument("Movie ID required for player commands");
  }
  
  if (command.includes('play') || command.includes('start')) {
    return {
      action: 'play',
      response: 'Starting movie playback',
      speechText: 'Starting movie playback. Audio description is enabled. Use voice commands to control playback.',
      navigationInstructions: [
        'Say "pause" to pause the movie',
        'Say "volume up" or "volume down" to adjust audio',
        'Say "enable captions" to turn on closed captions'
      ]
    };
  }
  
  if (command.includes('pause') || command.includes('stop')) {
    return {
      action: 'pause',
      response: 'Pausing movie playback',
      speechText: 'Movie paused. Say "play" to resume, or "stop" to exit.',
    };
  }
  
  if (command.includes('volume')) {
    const volumeAction = command.includes('up') ? 'increase' : command.includes('down') ? 'decrease' : 'set';
    return {
      action: 'volume',
      response: `Adjusting volume ${volumeAction}`,
      data: { volumeAction },
      speechText: `Volume ${volumeAction}d. Current volume level will be announced.`,
    };
  }
  
  if (command.includes('caption') || command.includes('subtitle')) {
    const enable = command.includes('enable') || command.includes('on') || command.includes('turn on');
    return {
      action: 'captions',
      response: enable ? 'Enabling captions' : 'Disabling captions',
      data: { enable },
      speechText: enable ? 'Closed captions enabled.' : 'Closed captions disabled.',
    };
  }
  
  return {
    action: 'unknown',
    response: 'Player command not recognized',
    speechText: 'Player command not recognized. Try "play", "pause", "volume up", "volume down", or "enable captions".',
  };
}

async function handleDetailsCommands(command: string, movieId?: number): Promise<VoiceCommandResponse> {
  if (!movieId) {
    throw APIError.invalidArgument("Movie ID required for details commands");
  }
  
  const movie = await moviesDB.queryRow`
    SELECT * FROM movies WHERE id = ${movieId}
  `;
  
  if (!movie) {
    throw APIError.notFound("Movie not found");
  }
  
  if (command.includes('read description') || command.includes('tell me about')) {
    return {
      action: 'read_description',
      response: 'Reading movie description',
      data: { description: movie.overview },
      speechText: `${movie.title}. ${movie.overview}`,
    };
  }
  
  if (command.includes('accessibility features') || command.includes('what features')) {
    const features = [];
    if (movie.audio_description_available) features.push('audio description');
    if (movie.closed_captions_available) features.push('closed captions');
    if (movie.sign_language_available) features.push('sign language interpretation');
    if (movie.narrated_description) features.push('detailed narration');
    
    const featuresText = features.length > 0 
      ? `This movie has the following accessibility features: ${features.join(', ')}.`
      : 'This movie does not have specific accessibility features listed.';
    
    return {
      action: 'accessibility_features',
      response: 'Listing accessibility features',
      data: { features },
      speechText: featuresText,
    };
  }
  
  if (command.includes('rating') || command.includes('how good')) {
    return {
      action: 'rating',
      response: 'Reading movie rating',
      data: { rating: movie.vote_average },
      speechText: `This movie has a rating of ${movie.vote_average.toFixed(1)} out of 10, based on ${movie.vote_count} votes.`,
    };
  }
  
  return {
    action: 'unknown',
    response: 'Details command not recognized',
    speechText: 'Command not recognized. Try "read description", "accessibility features", or "rating".',
  };
}

async function handleNavigationCommands(command: string, userId?: string): Promise<VoiceCommandResponse> {
  if (command.includes('go home') || command.includes('main page')) {
    return {
      action: 'navigate_home',
      response: 'Navigating to home page',
      speechText: 'Navigating to home page. Popular accessible movies will be loaded.',
      navigationInstructions: [
        'Home page contains popular movies with accessibility features',
        'Use Tab to navigate between movie cards',
        'Press Enter to view movie details'
      ]
    };
  }
  
  if (command.includes('search page') || command.includes('find movies')) {
    return {
      action: 'navigate_search',
      response: 'Navigating to search page',
      speechText: 'Navigating to search page. You can search for movies by title, genre, or accessibility features.',
      navigationInstructions: [
        'Search input field is focused and ready',
        'Type your search query or use voice commands',
        'Results will be announced when available'
      ]
    };
  }
  
  if (command.includes('favorites') || command.includes('my movies')) {
    return {
      action: 'navigate_favorites',
      response: 'Navigating to favorites',
      speechText: 'Navigating to your favorite movies. Your saved accessible movies will be displayed.',
    };
  }
  
  if (command.includes('settings') || command.includes('accessibility options')) {
    return {
      action: 'navigate_settings',
      response: 'Navigating to accessibility settings',
      speechText: 'Navigating to accessibility settings. You can customize your viewing preferences here.',
      navigationInstructions: [
        'Accessibility settings allow you to customize your experience',
        'Use Tab to navigate between options',
        'Changes are saved automatically'
      ]
    };
  }
  
  if (command.includes('help') || command.includes('what can I say')) {
    return {
      action: 'help',
      response: 'Showing voice command help',
      speechText: 'Available voice commands: "search for" followed by a movie title, "go home", "search page", "favorites", "settings", "play", "pause", "volume up", "volume down", "enable captions", "read description", "accessibility features", and "rating".',
      navigationInstructions: [
        'Voice commands work throughout the application',
        'Speak clearly and wait for confirmation',
        'Say "help" anytime to hear available commands'
      ]
    };
  }
  
  return {
    action: 'unknown',
    response: 'Navigation command not recognized',
    speechText: 'Navigation command not recognized. Say "help" to hear available commands.',
  };
}

function extractSearchTerm(command: string): string {
  const patterns = [
    /search for (.+)/i,
    /find (.+)/i,
    /look for (.+)/i,
    /show me (.+)/i
  ];
  
  for (const pattern of patterns) {
    const match = command.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  return command.replace(/search|find|for|look|show|me/gi, '').trim();
}

function extractFilter(command: string): string {
  const patterns = [
    /filter by (.+)/i,
    /show only (.+)/i,
    /only (.+)/i
  ];
  
  for (const pattern of patterns) {
    const match = command.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  return 'unknown';
}
