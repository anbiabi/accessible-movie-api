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
  predictedNextActions?: Array<{
    action: string;
    description: string;
    confidence: number;
  }>;
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

// Processes voice commands for hands-free navigation and control with AI-enhanced understanding.
export const processVoiceCommand = api<VoiceCommandRequest, VoiceCommandResponse>(
  { expose: true, method: "POST", path: "/movies/voice/command" },
  async (req) => {
    const { command, context = 'navigation', movieId, userId } = req;
    
    const normalizedCommand = command.toLowerCase().trim();
    
    // Enhanced command processing with AI understanding
    const commandIntent = await analyzeCommandIntent(normalizedCommand, context);
    
    // Parse voice commands based on context and intent
    switch (context) {
      case 'search':
        return await handleSearchCommands(normalizedCommand, commandIntent, userId);
      
      case 'player':
        return await handlePlayerCommands(normalizedCommand, commandIntent, movieId);
      
      case 'details':
        return await handleDetailsCommands(normalizedCommand, commandIntent, movieId);
      
      case 'navigation':
      default:
        return await handleNavigationCommands(normalizedCommand, commandIntent, userId);
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

// Provides proactive voice assistance based on user context and behavior.
export const getProactiveVoiceAssistance = api<{ userId: string; currentPage: string; userBehavior?: any }, VoiceCommandResponse>(
  { expose: true, method: "GET", path: "/movies/voice/proactive/:userId" },
  async (req) => {
    const { userId, currentPage, userBehavior } = req;
    
    try {
      // Analyze current context and provide proactive assistance
      const contextualHelp = await generateProactiveVoiceHelp(currentPage, userId, userBehavior);
      
      return {
        action: 'proactive_assistance',
        response: contextualHelp.message,
        speechText: contextualHelp.speechText,
        navigationInstructions: contextualHelp.instructions,
        predictedNextActions: contextualHelp.predictedActions
      };
      
    } catch (error) {
      console.error('Proactive voice assistance error:', error);
      return {
        action: 'error',
        response: 'Voice assistance is ready when you need it.',
        speechText: 'I\'m here to help. Say "help" to hear available commands.',
        predictedNextActions: []
      };
    }
  }
);

async function analyzeCommandIntent(command: string, context: string): Promise<any> {
  // Enhanced intent analysis with AI-like understanding
  const intents = {
    search: ['find', 'search', 'look for', 'show me', 'get', 'discover'],
    play: ['play', 'start', 'watch', 'begin', 'stream'],
    pause: ['pause', 'stop', 'halt', 'freeze'],
    navigate: ['go to', 'open', 'navigate', 'take me to', 'switch to'],
    help: ['help', 'assist', 'guide', 'what can', 'how do'],
    describe: ['describe', 'tell me about', 'explain', 'what is'],
    filter: ['filter', 'show only', 'with', 'that have'],
    recommend: ['recommend', 'suggest', 'what should', 'find me something']
  };
  
  let detectedIntent = 'unknown';
  let confidence = 0;
  
  for (const [intent, keywords] of Object.entries(intents)) {
    for (const keyword of keywords) {
      if (command.includes(keyword)) {
        detectedIntent = intent;
        confidence = 0.8;
        break;
      }
    }
    if (confidence > 0) break;
  }
  
  // Extract entities (movie titles, genres, accessibility features)
  const entities = extractEntities(command);
  
  return {
    intent: detectedIntent,
    confidence,
    entities,
    originalCommand: command,
    context
  };
}

function extractEntities(command: string): any {
  const entities = {
    accessibilityFeatures: [],
    genres: [],
    movieTitles: [],
    actions: []
  };
  
  // Accessibility features
  if (command.includes('audio description') || command.includes('narration')) {
    entities.accessibilityFeatures.push('audio_description');
  }
  if (command.includes('caption') || command.includes('subtitle')) {
    entities.accessibilityFeatures.push('closed_captions');
  }
  if (command.includes('sign language')) {
    entities.accessibilityFeatures.push('sign_language');
  }
  
  // Genres
  const genres = ['action', 'comedy', 'drama', 'documentary', 'horror', 'romance', 'thriller', 'sci-fi', 'fantasy'];
  for (const genre of genres) {
    if (command.includes(genre)) {
      entities.genres.push(genre);
    }
  }
  
  // Common movie-related actions
  const actions = ['volume', 'speed', 'quality', 'fullscreen', 'settings'];
  for (const action of actions) {
    if (command.includes(action)) {
      entities.actions.push(action);
    }
  }
  
  return entities;
}

async function handleSearchCommands(command: string, intent: any, userId?: string): Promise<VoiceCommandResponse> {
  if (intent.intent === 'search' || intent.intent === 'find') {
    const searchTerm = extractSearchTerm(command);
    
    // Enhanced search with accessibility prioritization
    let searchData: any = { query: searchTerm };
    
    // Apply accessibility filters based on detected entities
    if (intent.entities.accessibilityFeatures.length > 0) {
      searchData.accessibilityFilters = intent.entities.accessibilityFeatures;
    }
    
    if (intent.entities.genres.length > 0) {
      searchData.genre = intent.entities.genres[0];
    }
    
    const predictedActions = [
      { action: 'view_results', description: 'Browse search results', confidence: 0.9 },
      { action: 'refine_search', description: 'Add more filters', confidence: 0.7 },
      { action: 'play_first_result', description: 'Play the top result', confidence: 0.6 }
    ];
    
    return {
      action: 'search',
      response: `Searching for "${searchTerm}" with accessibility features`,
      data: searchData,
      speechText: `Searching for ${searchTerm}. I'll prioritize content with accessibility features for you.`,
      navigationInstructions: [
        'Search results will be announced when ready',
        'Use arrow keys to navigate through results',
        'Press Enter to select a movie',
        'Say "filter by" to add more search criteria'
      ],
      predictedNextActions: predictedActions
    };
  }
  
  if (intent.intent === 'filter') {
    const filter = extractFilter(command);
    const predictedActions = [
      { action: 'apply_filter', description: 'Apply the specified filter', confidence: 0.95 },
      { action: 'view_filtered_results', description: 'Browse filtered results', confidence: 0.8 }
    ];
    
    return {
      action: 'filter',
      response: `Applying filter: ${filter}`,
      data: { filter, accessibilityFocus: true },
      speechText: `Filtering results by ${filter}. I'll show you the most accessible options first.`,
      predictedNextActions: predictedActions
    };
  }
  
  if (intent.intent === 'recommend') {
    const predictedActions = [
      { action: 'get_recommendations', description: 'Get personalized recommendations', confidence: 0.9 },
      { action: 'browse_categories', description: 'Explore content categories', confidence: 0.7 }
    ];
    
    return {
      action: 'recommend',
      response: 'Getting personalized accessible movie recommendations',
      data: { userId, accessibilityFocused: true },
      speechText: 'Let me find some great accessible movies for you based on your preferences.',
      predictedNextActions: predictedActions
    };
  }
  
  return {
    action: 'unknown',
    response: 'I didn\'t understand that search command',
    speechText: 'I didn\'t understand that search command. Try saying "search for" followed by a movie title, or "recommend movies with audio descriptions".',
    predictedNextActions: []
  };
}

async function handlePlayerCommands(command: string, intent: any, movieId?: number): Promise<VoiceCommandResponse> {
  if (!movieId) {
    throw APIError.invalidArgument("Movie ID required for player commands");
  }
  
  const movie = await moviesDB.queryRow`SELECT title FROM movies WHERE id = ${movieId}`;
  const movieTitle = movie?.title || 'this movie';
  
  if (intent.intent === 'play') {
    const predictedActions = [
      { action: 'enable_accessibility', description: 'Enable accessibility features', confidence: 0.9 },
      { action: 'adjust_settings', description: 'Adjust playback settings', confidence: 0.7 },
      { action: 'pause', description: 'Pause playback', confidence: 0.6 }
    ];
    
    return {
      action: 'play',
      response: `Starting ${movieTitle} with accessibility features`,
      speechText: `Starting ${movieTitle}. Audio descriptions and captions are enabled. Use voice commands to control playback.`,
      navigationInstructions: [
        'Say "pause" to pause the movie',
        'Say "volume up" or "volume down" to adjust audio',
        'Say "enable captions" to turn on closed captions',
        'Say "describe scene" for additional narration'
      ],
      predictedNextActions: predictedActions
    };
  }
  
  if (intent.intent === 'pause') {
    const predictedActions = [
      { action: 'resume', description: 'Resume playback', confidence: 0.8 },
      { action: 'stop', description: 'Stop and exit', confidence: 0.6 },
      { action: 'adjust_settings', description: 'Modify settings', confidence: 0.5 }
    ];
    
    return {
      action: 'pause',
      response: `Pausing ${movieTitle}`,
      speechText: `${movieTitle} paused. Say "play" to resume, or "stop" to exit.`,
      predictedNextActions: predictedActions
    };
  }
  
  if (command.includes('volume')) {
    const volumeAction = command.includes('up') ? 'increase' : command.includes('down') ? 'decrease' : 'set';
    const predictedActions = [
      { action: 'continue_watching', description: 'Continue with new volume', confidence: 0.8 },
      { action: 'adjust_more', description: 'Make further adjustments', confidence: 0.6 }
    ];
    
    return {
      action: 'volume',
      response: `Adjusting volume ${volumeAction}`,
      data: { volumeAction },
      speechText: `Volume ${volumeAction}d. Current volume level will be announced.`,
      predictedNextActions: predictedActions
    };
  }
  
  if (command.includes('caption') || command.includes('subtitle')) {
    const enable = command.includes('enable') || command.includes('on') || command.includes('turn on');
    const predictedActions = [
      { action: 'continue_watching', description: 'Continue with captions', confidence: 0.9 },
      { action: 'adjust_caption_settings', description: 'Customize caption appearance', confidence: 0.6 }
    ];
    
    return {
      action: 'captions',
      response: enable ? 'Enabling captions' : 'Disabling captions',
      data: { enable },
      speechText: enable ? 'Closed captions enabled.' : 'Closed captions disabled.',
      predictedNextActions: predictedActions
    };
  }
  
  if (command.includes('describe') || command.includes('narrate')) {
    const predictedActions = [
      { action: 'continue_narration', description: 'Continue with enhanced narration', confidence: 0.8 },
      { action: 'adjust_narration_speed', description: 'Change narration speed', confidence: 0.6 }
    ];
    
    return {
      action: 'describe',
      response: 'Providing additional scene description',
      speechText: 'Activating enhanced scene description. I\'ll provide more detailed narration of visual elements.',
      predictedNextActions: predictedActions
    };
  }
  
  return {
    action: 'unknown',
    response: 'Player command not recognized',
    speechText: 'Player command not recognized. Try "play", "pause", "volume up", "volume down", "enable captions", or "describe scene".',
    predictedNextActions: []
  };
}

async function handleDetailsCommands(command: string, intent: any, movieId?: number): Promise<VoiceCommandResponse> {
  if (!movieId) {
    throw APIError.invalidArgument("Movie ID required for details commands");
  }
  
  const movie = await moviesDB.queryRow`
    SELECT * FROM movies WHERE id = ${movieId}
  `;
  
  if (!movie) {
    throw APIError.notFound("Movie not found");
  }
  
  if (intent.intent === 'describe' || command.includes('tell me about')) {
    const predictedActions = [
      { action: 'play_movie', description: 'Start watching the movie', confidence: 0.8 },
      { action: 'add_to_favorites', description: 'Add to favorites', confidence: 0.6 },
      { action: 'find_similar', description: 'Find similar movies', confidence: 0.7 }
    ];
    
    return {
      action: 'read_description',
      response: 'Reading movie description',
      data: { description: movie.overview },
      speechText: `${movie.title}. ${movie.overview}`,
      predictedNextActions: predictedActions
    };
  }
  
  if (command.includes('accessibility') || command.includes('features')) {
    const features = [];
    if (movie.audio_description_available) features.push('audio description');
    if (movie.closed_captions_available) features.push('closed captions');
    if (movie.sign_language_available) features.push('sign language interpretation');
    if (movie.narrated_description) features.push('detailed AI narration');
    
    const featuresText = features.length > 0 
      ? `This movie has the following accessibility features: ${features.join(', ')}.`
      : 'This movie does not have specific accessibility features listed, but I can generate audio descriptions for you.';
    
    const predictedActions = [
      { action: 'enable_features', description: 'Enable accessibility features', confidence: 0.9 },
      { action: 'play_with_features', description: 'Start watching with features enabled', confidence: 0.8 }
    ];
    
    return {
      action: 'accessibility_features',
      response: 'Listing accessibility features',
      data: { features },
      speechText: featuresText,
      predictedNextActions: predictedActions
    };
  }
  
  if (command.includes('rating') || command.includes('how good')) {
    const predictedActions = [
      { action: 'read_reviews', description: 'Read user reviews', confidence: 0.7 },
      { action: 'play_movie', description: 'Start watching', confidence: 0.8 },
      { action: 'find_similar_rated', description: 'Find similarly rated movies', confidence: 0.6 }
    ];
    
    return {
      action: 'rating',
      response: 'Reading movie rating',
      data: { rating: movie.vote_average },
      speechText: `This movie has a rating of ${movie.vote_average.toFixed(1)} out of 10, based on ${movie.vote_count} votes.`,
      predictedNextActions: predictedActions
    };
  }
  
  if (command.includes('similar') || command.includes('like this')) {
    const predictedActions = [
      { action: 'browse_similar', description: 'Browse similar movies', confidence: 0.9 },
      { action: 'add_to_watchlist', description: 'Add similar movies to watchlist', confidence: 0.7 }
    ];
    
    return {
      action: 'find_similar',
      response: 'Finding similar accessible movies',
      speechText: 'Let me find similar movies with accessibility features for you.',
      predictedNextActions: predictedActions
    };
  }
  
  return {
    action: 'unknown',
    response: 'Details command not recognized',
    speechText: 'Command not recognized. Try "tell me about this movie", "accessibility features", "rating", or "find similar movies".',
    predictedNextActions: []
  };
}

async function handleNavigationCommands(command: string, intent: any, userId?: string): Promise<VoiceCommandResponse> {
  if (command.includes('go home') || command.includes('main page')) {
    const predictedActions = [
      { action: 'browse_popular', description: 'Browse popular accessible movies', confidence: 0.8 },
      { action: 'get_recommendations', description: 'Get personalized recommendations', confidence: 0.7 },
      { action: 'search_content', description: 'Search for specific content', confidence: 0.6 }
    ];
    
    return {
      action: 'navigate_home',
      response: 'Navigating to home page',
      speechText: 'Navigating to home page. Popular accessible movies will be loaded with audio descriptions and captions prioritized.',
      navigationInstructions: [
        'Home page contains popular movies with accessibility features',
        'Use Tab to navigate between movie cards',
        'Press Enter to view movie details',
        'Say "recommend movies" for personalized suggestions'
      ],
      predictedNextActions: predictedActions
    };
  }
  
  if (command.includes('search page') || command.includes('find movies')) {
    const predictedActions = [
      { action: 'start_search', description: 'Begin searching for content', confidence: 0.9 },
      { action: 'use_voice_search', description: 'Use voice search', confidence: 0.8 },
      { action: 'apply_accessibility_filters', description: 'Filter by accessibility features', confidence: 0.7 }
    ];
    
    return {
      action: 'navigate_search',
      response: 'Navigating to search page',
      speechText: 'Navigating to search page. You can search for movies by title, genre, or accessibility features using voice commands.',
      navigationInstructions: [
        'Search input field is focused and ready',
        'Type your search query or use voice commands',
        'Say "filter by audio descriptions" for accessible content',
        'Results will be announced when available'
      ],
      predictedNextActions: predictedActions
    };
  }
  
  if (command.includes('favorites') || command.includes('my movies')) {
    const predictedActions = [
      { action: 'browse_favorites', description: 'Browse favorite movies', confidence: 0.9 },
      { action: 'play_favorite', description: 'Play a favorite movie', confidence: 0.7 },
      { action: 'organize_favorites', description: 'Organize favorites list', confidence: 0.5 }
    ];
    
    return {
      action: 'navigate_favorites',
      response: 'Navigating to favorites',
      speechText: 'Navigating to your favorite movies. Your saved accessible movies will be displayed with their accessibility features highlighted.',
      predictedNextActions: predictedActions
    };
  }
  
  if (command.includes('settings') || command.includes('accessibility options')) {
    const predictedActions = [
      { action: 'adjust_accessibility', description: 'Modify accessibility settings', confidence: 0.9 },
      { action: 'configure_voice', description: 'Set up voice commands', confidence: 0.8 },
      { action: 'test_features', description: 'Test accessibility features', confidence: 0.7 }
    ];
    
    return {
      action: 'navigate_settings',
      response: 'Navigating to accessibility settings',
      speechText: 'Navigating to accessibility settings. You can customize your viewing preferences, voice commands, and accessibility features here.',
      navigationInstructions: [
        'Accessibility settings allow you to customize your experience',
        'Use Tab to navigate between options',
        'Changes are saved automatically',
        'Say "test speech" to verify voice settings'
      ],
      predictedNextActions: predictedActions
    };
  }
  
  if (intent.intent === 'help' || command.includes('what can I say')) {
    const predictedActions = [
      { action: 'try_voice_command', description: 'Try a voice command', confidence: 0.8 },
      { action: 'explore_features', description: 'Explore accessibility features', confidence: 0.7 },
      { action: 'get_tutorial', description: 'Start accessibility tutorial', confidence: 0.6 }
    ];
    
    return {
      action: 'help',
      response: 'Showing voice command help',
      speechText: 'Available voice commands: "search for" followed by a movie title, "go home", "search page", "favorites", "settings", "play", "pause", "volume up", "volume down", "enable captions", "tell me about this movie", "accessibility features", "rating", and "find similar movies". I can also provide personalized recommendations and help you navigate with full accessibility support.',
      navigationInstructions: [
        'Voice commands work throughout the application',
        'Speak clearly and wait for confirmation',
        'Say "help" anytime to hear available commands',
        'I can provide proactive assistance based on your needs'
      ],
      predictedNextActions: predictedActions
    };
  }
  
  return {
    action: 'unknown',
    response: 'Navigation command not recognized',
    speechText: 'Navigation command not recognized. Say "help" to hear available commands, or try "go home", "search page", "favorites", or "settings".',
    predictedNextActions: []
  };
}

async function generateProactiveVoiceHelp(currentPage: string, userId: string, userBehavior?: any): Promise<any> {
  // Enhanced proactive assistance based on AI analysis
  const proactiveHelp: { [key: string]: any } = {
    home: {
      message: "Welcome! I notice you're on the home page. Would you like me to recommend some accessible movies based on your preferences?",
      speechText: "Welcome to AccessiCinema! I can help you find movies with audio descriptions, captions, and other accessibility features. Would you like personalized recommendations?",
      instructions: [
        'Say "recommend movies" for personalized suggestions',
        'Say "search for" followed by a genre or title',
        'Say "show me documentaries" for educational content',
        'Say "help" to hear all available commands'
      ],
      predictedActions: [
        { action: 'get_recommendations', description: 'Get personalized movie recommendations', confidence: 0.8 },
        { action: 'search_content', description: 'Search for specific content', confidence: 0.7 },
        { action: 'browse_categories', description: 'Browse content categories', confidence: 0.6 }
      ]
    },
    search: {
      message: "I can help you search more effectively. Try saying 'find movies with audio descriptions' or 'show me documentaries with captions'.",
      speechText: "I can help you search for accessible content. Try saying 'find movies with audio descriptions' or 'show me documentaries with captions'.",
      instructions: [
        'Use voice search by saying "search for" followed by your query',
        'Add accessibility requirements like "with audio descriptions"',
        'Say "filter by" to narrow down results',
        'I can suggest similar content based on your preferences'
      ],
      predictedActions: [
        { action: 'voice_search', description: 'Use voice search', confidence: 0.9 },
        { action: 'apply_filters', description: 'Apply accessibility filters', confidence: 0.8 },
        { action: 'get_suggestions', description: 'Get search suggestions', confidence: 0.7 }
      ]
    },
    movie_details: {
      message: "I can provide detailed information about this movie's accessibility features. Would you like me to describe them?",
      speechText: "I can tell you about this movie's accessibility features and help you start watching with the right settings. What would you like to know?",
      instructions: [
        'Say "accessibility features" to learn about available options',
        'Say "tell me about this movie" for a detailed description',
        'Say "play movie" to start watching with accessibility features',
        'Say "find similar movies" for recommendations'
      ],
      predictedActions: [
        { action: 'check_accessibility', description: 'Check accessibility features', confidence: 0.9 },
        { action: 'play_with_features', description: 'Start watching with accessibility enabled', confidence: 0.8 },
        { action: 'get_similar', description: 'Find similar accessible content', confidence: 0.7 }
      ]
    },
    favorites: {
      message: "Here are your favorite accessible movies. Would you like me to suggest new content based on what you've saved?",
      speechText: "Here are your favorite accessible movies. I can suggest new content based on your preferences or help you organize your favorites.",
      instructions: [
        'Say "recommend similar movies" for new suggestions',
        'Say "play" followed by a movie title to start watching',
        'Say "organize favorites" to sort your collection',
        'I can help you find new content matching your preferences'
      ],
      predictedActions: [
        { action: 'get_recommendations', description: 'Get recommendations based on favorites', confidence: 0.8 },
        { action: 'play_favorite', description: 'Play a favorite movie', confidence: 0.7 },
        { action: 'organize_collection', description: 'Organize favorite movies', confidence: 0.6 }
      ]
    }
  };

  return proactiveHelp[currentPage] || {
    message: "I'm here to help you navigate and enjoy accessible content. What would you like to do?",
    speechText: "I'm here to help you find and enjoy accessible movies and documentaries. How can I assist you today?",
    instructions: [
      'Say "help" to hear available voice commands',
      'Say "recommend movies" for personalized suggestions',
      'Say "search for" followed by what you\'re looking for',
      'I can provide proactive assistance based on your needs'
    ],
    predictedActions: [
      { action: 'get_help', description: 'Learn about available commands', confidence: 0.7 },
      { action: 'get_recommendations', description: 'Get personalized recommendations', confidence: 0.8 },
      { action: 'start_search', description: 'Begin searching for content', confidence: 0.6 }
    ]
  };
}

function extractSearchTerm(command: string): string {
  const patterns = [
    /search for (.+)/i,
    /find (.+)/i,
    /look for (.+)/i,
    /show me (.+)/i,
    /get (.+)/i,
    /discover (.+)/i
  ];
  
  for (const pattern of patterns) {
    const match = command.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  return command.replace(/search|find|for|look|show|me|get|discover/gi, '').trim();
}

function extractFilter(command: string): string {
  const patterns = [
    /filter by (.+)/i,
    /show only (.+)/i,
    /only (.+)/i,
    /with (.+)/i,
    /that have (.+)/i
  ];
  
  for (const pattern of patterns) {
    const match = command.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  return 'unknown';
}
