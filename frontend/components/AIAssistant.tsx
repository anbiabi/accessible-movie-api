import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bot, Send, Mic, MicOff, Settings, Lightbulb, MessageSquare } from 'lucide-react';
import { useAccessibility } from '../contexts/AccessibilityContext';
import backend from '~backend/client';

interface AIAssistantProps {
  context?: 'search' | 'navigation' | 'recommendation' | 'accessibility' | 'general';
  movieId?: number;
  onAction?: (action: string, data?: any) => void;
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  action?: string;
  data?: any;
}

interface AISettings {
  aiProvider: 'openai' | 'anthropic' | 'gemini' | 'perplexity';
  customApiKey?: string;
  voiceEnabled: boolean;
  proactiveAssistance: boolean;
  accessibilityLevel: 'basic' | 'enhanced' | 'professional';
  personalizedRecommendations: boolean;
}

export function AIAssistant({ context = 'general', movieId, onAction }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [aiSettings, setAISettings] = useState<AISettings>({
    aiProvider: 'openai',
    voiceEnabled: true,
    proactiveAssistance: true,
    accessibilityLevel: 'enhanced',
    personalizedRecommendations: true
  });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [predictedActions, setPredictedActions] = useState<Array<{ action: string; description: string; confidence: number }>>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { announceToScreenReader, speakText } = useAccessibility();

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';
        
        recognitionRef.current.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setMessage(transcript);
          handleSendMessage(transcript);
        };
        
        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }

    // Load proactive assistance if enabled
    if (aiSettings.proactiveAssistance && isOpen) {
      loadProactiveAssistance();
    }

    // Scroll to bottom when new messages arrive
    scrollToBottom();
  }, [conversation, isOpen, aiSettings.proactiveAssistance]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadProactiveAssistance = async () => {
    try {
      const response = await backend.ai.getProactiveAssistance({
        userId: 'demo-user',
        currentContext: context
      });

      if (response.response && conversation.length === 0) {
        const proactiveMessage: ConversationMessage = {
          role: 'assistant',
          content: response.response,
          timestamp: new Date().toISOString(),
          action: response.action
        };

        setConversation([proactiveMessage]);
        setSuggestions(response.suggestions || []);
        setPredictedActions(response.predictedNextActions || []);

        if (aiSettings.voiceEnabled && response.speechText) {
          speakText(response.speechText);
        }
      }
    } catch (error) {
      console.error('Failed to load proactive assistance:', error);
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || message;
    if (!textToSend.trim()) return;

    const userMessage: ConversationMessage = {
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString()
    };

    setConversation(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      const response = await backend.ai.processAIQuery({
        query: textToSend,
        context,
        userId: 'demo-user',
        userPreferences: {
          aiProvider: aiSettings.aiProvider,
          voiceEnabled: aiSettings.voiceEnabled,
          accessibilityNeeds: ['visual_impairment'], // This would come from user profile
          preferredGenres: ['Documentary', 'Drama'] // This would come from user profile
        },
        conversationHistory: conversation.slice(-5) // Last 5 messages for context
      });

      const assistantMessage: ConversationMessage = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString(),
        action: response.action,
        data: response.data
      };

      setConversation(prev => [...prev, assistantMessage]);
      setSuggestions(response.suggestions || []);
      setPredictedActions(response.predictedNextActions || []);

      // Execute action if provided
      if (response.action && onAction) {
        onAction(response.action, response.data);
      }

      // Speak response if voice is enabled
      if (aiSettings.voiceEnabled && response.speechText) {
        speakText(response.speechText);
      }

      announceToScreenReader(`AI Assistant: ${response.response}`);

    } catch (error) {
      console.error('AI query failed:', error);
      const errorMessage: ConversationMessage = {
        role: 'assistant',
        content: 'I\'m having trouble processing your request right now. Please try again or check your AI settings.',
        timestamp: new Date().toISOString()
      };
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      announceToScreenReader('Voice recognition started. Speak your message.');
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
    handleSendMessage(suggestion);
  };

  const handlePredictedActionClick = (action: { action: string; description: string }) => {
    if (onAction) {
      onAction(action.action);
    }
    announceToScreenReader(`Executing: ${action.description}`);
  };

  const updateAISettings = async (newSettings: Partial<AISettings>) => {
    const updatedSettings = { ...aiSettings, ...newSettings };
    setAISettings(updatedSettings);

    try {
      await backend.ai.updateAISettings({
        userId: 'demo-user',
        ...updatedSettings
      });
      announceToScreenReader('AI settings updated');
    } catch (error) {
      console.error('Failed to update AI settings:', error);
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full shadow-lg"
          aria-label="Open AI Assistant"
        >
          <Bot className="h-6 w-6 mr-2" aria-hidden="true" />
          AI Assistant
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]">
      <Card className="shadow-xl border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" aria-hidden="true" />
              AI Assistant
              <Badge variant="outline" className="text-xs">
                {aiSettings.aiProvider.toUpperCase()}
              </Badge>
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                aria-label="AI settings"
              >
                <Settings className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                aria-label="Close AI Assistant"
              >
                ×
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* AI Settings Panel */}
          {showSettings && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold">AI Settings</h4>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="ai-provider">AI Provider</Label>
                  <Select
                    value={aiSettings.aiProvider}
                    onValueChange={(value: any) => updateAISettings({ aiProvider: value })}
                  >
                    <SelectTrigger id="ai-provider">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI (Free Tier)</SelectItem>
                      <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                      <SelectItem value="gemini">Google Gemini</SelectItem>
                      <SelectItem value="perplexity">Perplexity AI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="accessibility-level">Accessibility Level</Label>
                  <Select
                    value={aiSettings.accessibilityLevel}
                    onValueChange={(value: any) => updateAISettings({ accessibilityLevel: value })}
                  >
                    <SelectTrigger id="accessibility-level">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic (Free)</SelectItem>
                      <SelectItem value="enhanced">Enhanced</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="voice-enabled">Voice Responses</Label>
                  <Switch
                    id="voice-enabled"
                    checked={aiSettings.voiceEnabled}
                    onCheckedChange={(checked) => updateAISettings({ voiceEnabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="proactive-assistance">Proactive Assistance</Label>
                  <Switch
                    id="proactive-assistance"
                    checked={aiSettings.proactiveAssistance}
                    onCheckedChange={(checked) => updateAISettings({ proactiveAssistance: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="personalized-recommendations">Personalized Recommendations</Label>
                  <Switch
                    id="personalized-recommendations"
                    checked={aiSettings.personalizedRecommendations}
                    onCheckedChange={(checked) => updateAISettings({ personalizedRecommendations: checked })}
                  />
                </div>

                {aiSettings.aiProvider !== 'openai' && (
                  <div>
                    <Label htmlFor="custom-api-key">Custom API Key (Optional)</Label>
                    <Input
                      id="custom-api-key"
                      type="password"
                      placeholder="Enter your API key for enhanced features"
                      onChange={(e) => updateAISettings({ customApiKey: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Use your own API key for unlimited access and advanced features
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Conversation */}
          <div className="h-64 overflow-y-auto space-y-3 p-2">
            {conversation.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <span className="text-xs opacity-70">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                    <span className="text-sm">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" aria-hidden="true" />
                <span className="text-sm font-medium">Suggestions:</span>
              </div>
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

          {/* Predicted Actions */}
          {predictedActions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
                <span className="text-sm font-medium">Quick Actions:</span>
              </div>
              <div className="space-y-1">
                {predictedActions.slice(0, 3).map((action, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePredictedActionClick(action)}
                    className="w-full justify-start text-xs"
                  >
                    <span className="flex-1 text-left">{action.description}</span>
                    <Badge variant="secondary" className="text-xs">
                      {Math.round(action.confidence * 100)}%
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask me about accessible movies, navigation help, or anything else..."
              className="flex-1 min-h-[40px] max-h-[100px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              aria-label="Message to AI Assistant"
            />
            <div className="flex flex-col gap-1">
              <Button
                onClick={() => handleSendMessage()}
                disabled={!message.trim() || isLoading}
                size="sm"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
              </Button>
              {recognitionRef.current && (
                <Button
                  onClick={handleVoiceInput}
                  variant={isListening ? "destructive" : "outline"}
                  size="sm"
                  aria-label={isListening ? "Stop voice input" : "Start voice input"}
                >
                  {isListening ? (
                    <MicOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Mic className="h-4 w-4" aria-hidden="true" />
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Context Info */}
          <div className="text-xs text-muted-foreground text-center">
            Context: {context} • {aiSettings.accessibilityLevel} mode
            {aiSettings.voiceEnabled && ' • Voice enabled'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
