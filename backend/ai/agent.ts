import { api, APIError } from "encore.dev/api";
import { openAIKey, anthropicKey, geminiKey, perplexityKey } from "./config";

interface AIAgentRequest {
  query: string;
  context?: 'search' | 'navigation' | 'recommendation' | 'accessibility' | 'general';
  userId?: string;
  userPreferences?: {
    aiProvider?: 'openai' | 'anthropic' | 'gemini' | 'perplexity';
    voiceEnabled?: boolean;
    accessibilityNeeds?: string[];
    preferredGenres?: string[];
  };
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
}

interface AIAgentResponse {
  response: string;
  action?: string;
  data?: any;
  suggestions?: string[];
  speechText?: string;
  confidence: number;
  followUpQuestions?: string[];
  predictedNextActions?: Array<{
    action: string;
    description: string;
    confidence: number;
  }>;
}

interface UserAISettings {
  userId: string;
  aiProvider: 'openai' | 'anthropic' | 'gemini' | 'perplexity';
  customApiKey?: string;
  voiceEnabled: boolean;
  proactiveAssistance: boolean;
  accessibilityLevel: 'basic' | 'enhanced' | 'professional';
  personalizedRecommendations: boolean;
}

// Processes user queries and provides intelligent assistance with predictive capabilities.
export const processAIQuery = api<AIAgentRequest, AIAgentResponse>(
  { expose: true, method: "POST", path: "/ai/query" },
  async (req) => {
    const { query, context = 'general', userId, userPreferences, conversationHistory = [] } = req;

    try {
      // Determine AI provider based on user preferences
      const aiProvider = userPreferences?.aiProvider || 'openai';
      
      // Build context for AI
      const systemContext = buildSystemContext(context, userPreferences);
      const conversationContext = buildConversationContext(conversationHistory);
      
      // Process query with selected AI provider
      const aiResponse = await processWithAIProvider(
        aiProvider, 
        query, 
        systemContext, 
        conversationContext,
        userPreferences
      );

      // Analyze intent and predict next actions
      const intent = analyzeUserIntent(query, context);
      const predictedActions = predictNextActions(intent, userPreferences);

      // Generate suggestions based on context
      const suggestions = generateContextualSuggestions(intent, context, userPreferences);

      return {
        response: aiResponse.response,
        action: aiResponse.action,
        data: aiResponse.data,
        suggestions,
        speechText: aiResponse.speechText || aiResponse.response,
        confidence: aiResponse.confidence,
        followUpQuestions: aiResponse.followUpQuestions,
        predictedNextActions: predictedActions
      };

    } catch (error) {
      console.error('AI query processing error:', error);
      
      // Fallback response
      return {
        response: "I'm having trouble processing your request right now. Please try rephrasing your question or check your AI settings.",
        confidence: 0.1,
        suggestions: [
          "Try asking about movie recommendations",
          "Search for accessible content",
          "Ask about navigation help"
        ],
        predictedNextActions: []
      };
    }
  }
);

// Updates user AI settings and preferences.
export const updateAISettings = api<UserAISettings, void>(
  { expose: true, method: "PUT", path: "/ai/settings" },
  async (req) => {
    const { userId, aiProvider, customApiKey, voiceEnabled, proactiveAssistance, accessibilityLevel, personalizedRecommendations } = req;

    // In a real implementation, this would store settings in a database
    // For now, we'll just validate the settings
    
    const validProviders = ['openai', 'anthropic', 'gemini', 'perplexity'];
    if (!validProviders.includes(aiProvider)) {
      throw APIError.invalidArgument("Invalid AI provider");
    }

    const validAccessibilityLevels = ['basic', 'enhanced', 'professional'];
    if (!validAccessibilityLevels.includes(accessibilityLevel)) {
      throw APIError.invalidArgument("Invalid accessibility level");
    }

    // Store settings (mock implementation)
    console.log(`Updated AI settings for user ${userId}:`, {
      aiProvider,
      voiceEnabled,
      proactiveAssistance,
      accessibilityLevel,
      personalizedRecommendations
    });
  }
);

// Provides proactive assistance based on user behavior patterns.
export const getProactiveAssistance = api<{ userId: string; currentContext: string }, AIAgentResponse>(
  { expose: true, method: "GET", path: "/ai/proactive/:userId" },
  async (req) => {
    const { userId, currentContext } = req;

    try {
      // Analyze user behavior and provide proactive suggestions
      const behaviorAnalysis = await analyzeUserBehavior(userId);
      const contextualHelp = generateProactiveHelp(currentContext, behaviorAnalysis);

      return {
        response: contextualHelp.message,
        suggestions: contextualHelp.suggestions,
        confidence: contextualHelp.confidence,
        predictedNextActions: contextualHelp.predictedActions,
        speechText: contextualHelp.speechText
      };

    } catch (error) {
      console.error('Proactive assistance error:', error);
      return {
        response: "I'm here to help when you need assistance.",
        confidence: 0.5,
        suggestions: [],
        predictedNextActions: []
      };
    }
  }
);

async function processWithAIProvider(
  provider: string, 
  query: string, 
  systemContext: string, 
  conversationContext: string,
  userPreferences?: any
): Promise<any> {
  
  const fullPrompt = `${systemContext}\n\nConversation History:\n${conversationContext}\n\nUser Query: ${query}`;

  switch (provider) {
    case 'openai':
      return await processWithOpenAI(fullPrompt, userPreferences);
    case 'anthropic':
      return await processWithAnthropic(fullPrompt, userPreferences);
    case 'gemini':
      return await processWithGemini(fullPrompt, userPreferences);
    case 'perplexity':
      return await processWithPerplexity(fullPrompt, userPreferences);
    default:
      return await processWithOpenAI(fullPrompt, userPreferences);
  }
}

async function processWithOpenAI(prompt: string, userPreferences?: any): Promise<any> {
  // Mock OpenAI response - in a real implementation, this would call the OpenAI API
  const mockResponses = [
    {
      response: "I can help you find accessible movies with audio descriptions and closed captions. What type of content are you interested in?",
      action: "search_assistance",
      confidence: 0.9,
      followUpQuestions: [
        "What genre do you prefer?",
        "Do you need specific accessibility features?",
        "Are you looking for recent releases?"
      ]
    },
    {
      response: "Based on your preferences, I recommend exploring our documentary section. Many documentaries have excellent accessibility features.",
      action: "recommendation",
      data: { category: "documentaries", reason: "accessibility_features" },
      confidence: 0.85,
      followUpQuestions: [
        "Would you like nature documentaries?",
        "Are you interested in historical content?",
        "Do you prefer shorter or longer documentaries?"
      ]
    }
  ];

  return mockResponses[Math.floor(Math.random() * mockResponses.length)];
}

async function processWithAnthropic(prompt: string, userPreferences?: any): Promise<any> {
  // Mock Anthropic response
  return {
    response: "I understand you're looking for accessible content. Let me help you navigate our collection with detailed audio descriptions.",
    action: "navigation_assistance",
    confidence: 0.88,
    followUpQuestions: [
      "Would you like me to read movie descriptions aloud?",
      "Should I focus on content with professional narration?",
      "Do you prefer content with sign language interpretation?"
    ]
  };
}

async function processWithGemini(prompt: string, userPreferences?: any): Promise<any> {
  // Mock Gemini response
  return {
    response: "I can provide comprehensive assistance with finding and enjoying accessible media content. What would you like to explore?",
    action: "general_assistance",
    confidence: 0.87,
    followUpQuestions: [
      "Are you new to accessible media?",
      "Do you have specific accessibility requirements?",
      "Would you like a guided tour of our features?"
    ]
  };
}

async function processWithPerplexity(prompt: string, userPreferences?: any): Promise<any> {
  // Mock Perplexity response
  return {
    response: "I can search for the most current accessible content and provide real-time information about availability and features.",
    action: "search_assistance",
    confidence: 0.92,
    followUpQuestions: [
      "Are you looking for newly released content?",
      "Do you want information about upcoming accessible releases?",
      "Should I check for the latest accessibility feature updates?"
    ]
  };
}

function buildSystemContext(context: string, userPreferences?: any): string {
  const baseContext = `You are an AI assistant for AccessiCinema, a platform dedicated to accessible media content. 
  Your primary goal is to help users find and enjoy movies, documentaries, and other content with comprehensive accessibility features.
  
  Key capabilities:
  - Help users find content with audio descriptions, closed captions, and sign language interpretation
  - Provide detailed content descriptions and narrations
  - Assist with navigation and accessibility features
  - Offer personalized recommendations based on accessibility needs
  - Support voice interactions and screen reader compatibility`;

  const contextSpecific = {
    search: "Focus on helping users search for and discover accessible content. Provide specific recommendations and filtering options.",
    navigation: "Help users navigate the platform efficiently. Provide clear instructions and anticipate their next actions.",
    recommendation: "Provide personalized content recommendations based on accessibility needs and preferences.",
    accessibility: "Focus on accessibility features, settings, and assistance. Provide detailed guidance on using accessibility tools.",
    general: "Provide comprehensive assistance across all platform features with a focus on accessibility."
  };

  let fullContext = `${baseContext}\n\nContext: ${contextSpecific[context as keyof typeof contextSpecific] || contextSpecific.general}`;

  if (userPreferences?.accessibilityNeeds) {
    fullContext += `\n\nUser's accessibility needs: ${userPreferences.accessibilityNeeds.join(', ')}`;
  }

  if (userPreferences?.preferredGenres) {
    fullContext += `\n\nUser's preferred genres: ${userPreferences.preferredGenres.join(', ')}`;
  }

  return fullContext;
}

function buildConversationContext(history: Array<{ role: string; content: string; timestamp: string }>): string {
  if (history.length === 0) return "No previous conversation.";
  
  return history.slice(-5).map(msg => `${msg.role}: ${msg.content}`).join('\n');
}

function analyzeUserIntent(query: string, context: string): string {
  const queryLower = query.toLowerCase();
  
  if (queryLower.includes('search') || queryLower.includes('find') || queryLower.includes('look for')) {
    return 'search';
  }
  if (queryLower.includes('recommend') || queryLower.includes('suggest') || queryLower.includes('what should')) {
    return 'recommendation';
  }
  if (queryLower.includes('help') || queryLower.includes('how to') || queryLower.includes('navigate')) {
    return 'help';
  }
  if (queryLower.includes('accessibility') || queryLower.includes('audio description') || queryLower.includes('captions')) {
    return 'accessibility';
  }
  if (queryLower.includes('play') || queryLower.includes('watch') || queryLower.includes('stream')) {
    return 'playback';
  }
  
  return 'general';
}

function predictNextActions(intent: string, userPreferences?: any): Array<{ action: string; description: string; confidence: number }> {
  const predictions: { [key: string]: Array<{ action: string; description: string; confidence: number }> } = {
    search: [
      { action: "apply_filters", description: "Apply accessibility filters to search results", confidence: 0.8 },
      { action: "view_details", description: "View detailed information about a movie", confidence: 0.7 },
      { action: "play_content", description: "Start watching selected content", confidence: 0.6 }
    ],
    recommendation: [
      { action: "view_recommendations", description: "Browse personalized recommendations", confidence: 0.9 },
      { action: "save_to_favorites", description: "Add recommended content to favorites", confidence: 0.7 },
      { action: "adjust_preferences", description: "Modify recommendation preferences", confidence: 0.5 }
    ],
    help: [
      { action: "access_tutorials", description: "View accessibility tutorials", confidence: 0.8 },
      { action: "adjust_settings", description: "Modify accessibility settings", confidence: 0.7 },
      { action: "contact_support", description: "Get additional help from support", confidence: 0.4 }
    ],
    accessibility: [
      { action: "configure_features", description: "Set up accessibility features", confidence: 0.9 },
      { action: "test_features", description: "Test accessibility settings", confidence: 0.8 },
      { action: "browse_accessible_content", description: "Find content with specific features", confidence: 0.7 }
    ],
    playback: [
      { action: "enable_audio_description", description: "Turn on audio descriptions", confidence: 0.9 },
      { action: "enable_captions", description: "Enable closed captions", confidence: 0.8 },
      { action: "adjust_playback_speed", description: "Modify playback speed for better comprehension", confidence: 0.6 }
    ]
  };

  return predictions[intent] || [
    { action: "explore_content", description: "Browse available content", confidence: 0.6 },
    { action: "get_help", description: "Access help and tutorials", confidence: 0.5 }
  ];
}

function generateContextualSuggestions(intent: string, context: string, userPreferences?: any): string[] {
  const suggestions: { [key: string]: string[] } = {
    search: [
      "Try searching for 'audio description movies'",
      "Filter by accessibility features",
      "Browse by genre with accessibility options",
      "Use voice search for hands-free browsing"
    ],
    recommendation: [
      "Explore documentaries with audio descriptions",
      "Check out highly-rated accessible movies",
      "Discover content in your preferred genres",
      "Find movies with sign language interpretation"
    ],
    help: [
      "Learn about keyboard navigation shortcuts",
      "Set up voice commands for easier control",
      "Configure screen reader compatibility",
      "Adjust text size and contrast settings"
    ],
    accessibility: [
      "Test audio description settings",
      "Configure closed caption preferences",
      "Set up braille display options",
      "Customize voice navigation commands"
    ],
    playback: [
      "Enable audio descriptions before playing",
      "Check caption language options",
      "Adjust volume and audio balance",
      "Use keyboard shortcuts for playback control"
    ]
  };

  return suggestions[intent] || [
    "Ask me about accessible movies",
    "Get help with navigation",
    "Explore accessibility features",
    "Find content recommendations"
  ];
}

async function analyzeUserBehavior(userId: string): Promise<any> {
  // Mock user behavior analysis
  return {
    frequentlyUsedFeatures: ['audio_description', 'voice_navigation'],
    preferredContentTypes: ['documentaries', 'drama'],
    accessibilityNeeds: ['visual_impairment', 'motor_impairment'],
    usagePatterns: {
      mostActiveTime: 'evening',
      averageSessionDuration: 45,
      preferredInteractionMethod: 'voice'
    }
  };
}

function generateProactiveHelp(context: string, behaviorAnalysis: any): any {
  const proactiveHelp: { [key: string]: any } = {
    search: {
      message: "I notice you often search for documentaries with audio descriptions. Would you like me to show you our latest accessible documentary releases?",
      suggestions: [
        "Browse new documentaries with audio descriptions",
        "Set up alerts for new accessible content",
        "Explore documentary categories"
      ],
      confidence: 0.8,
      predictedActions: [
        { action: "browse_documentaries", description: "Browse documentary collection", confidence: 0.9 },
        { action: "set_alerts", description: "Set up content alerts", confidence: 0.7 }
      ],
      speechText: "I can help you find new documentaries with audio descriptions. Would you like to see the latest releases?"
    },
    movie_details: {
      message: "Since you prefer content with audio descriptions, I've verified this movie has professional narration. Would you like me to start the audio description automatically?",
      suggestions: [
        "Enable audio description",
        "Check accessibility features",
        "Read detailed content description"
      ],
      confidence: 0.9,
      predictedActions: [
        { action: "enable_audio_description", description: "Turn on audio descriptions", confidence: 0.95 },
        { action: "start_playback", description: "Begin watching with accessibility features", confidence: 0.8 }
      ],
      speechText: "This movie has professional audio descriptions. Should I enable them for you?"
    }
  };

  return proactiveHelp[context] || {
    message: "I'm here to help you navigate and enjoy accessible content. What would you like to do?",
    suggestions: ["Get content recommendations", "Explore accessibility features", "Search for specific content"],
    confidence: 0.6,
    predictedActions: [],
    speechText: "How can I assist you with finding accessible content today?"
  };
}
