import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAccessibility } from '../contexts/AccessibilityContext';
import backend from '~backend/client';

interface VoiceNavigationProps {
  context?: 'search' | 'player' | 'navigation' | 'details';
  movieId?: number;
  onCommand?: (action: string, data?: any) => void;
}

export function VoiceNavigation({ context = 'navigation', movieId, onCommand }: VoiceNavigationProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCommand, setLastCommand] = useState<string>('');
  const [lastResponse, setLastResponse] = useState<string>('');
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [speechSupported, setSpeechSupported] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const { announceToScreenReader } = useAccessibility();

  useEffect(() => {
    // Check for speech recognition support
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setSpeechSupported(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';
        
        recognitionRef.current.onstart = () => {
          setIsListening(true);
          announceToScreenReader('Voice recognition started. Speak your command.');
        };
        
        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
        
        recognitionRef.current.onresult = (event) => {
          const command = event.results[0][0].transcript;
          setLastCommand(command);
          handleVoiceCommand(command);
        };
        
        recognitionRef.current.onerror = (event) => {
          setIsListening(false);
          setIsProcessing(false);
          announceToScreenReader(`Voice recognition error: ${event.error}`);
        };
      }
    }

    // Check for speech synthesis support
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleVoiceCommand = async (command: string) => {
    setIsProcessing(true);
    
    try {
      const response = await backend.movies.processVoiceCommand({
        command,
        context,
        movieId,
        userId: 'demo-user'
      });
      
      setLastResponse(response.response);
      
      // Speak the response
      if (speechEnabled && synthRef.current && response.speechText) {
        const utterance = new SpeechSynthesisUtterance(response.speechText);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        synthRef.current.speak(utterance);
      }
      
      // Announce to screen reader
      announceToScreenReader(response.speechText || response.response);
      
      // Execute the command action
      if (onCommand) {
        onCommand(response.action, response.data);
      }
      
    } catch (error) {
      console.error('Voice command error:', error);
      const errorMessage = 'Sorry, I could not process that command. Please try again.';
      setLastResponse(errorMessage);
      announceToScreenReader(errorMessage);
      
      if (speechEnabled && synthRef.current) {
        const utterance = new SpeechSynthesisUtterance(errorMessage);
        synthRef.current.speak(utterance);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const toggleSpeech = () => {
    setSpeechEnabled(!speechEnabled);
    announceToScreenReader(speechEnabled ? 'Speech output disabled' : 'Speech output enabled');
  };

  if (!speechSupported) {
    return (
      <Card className="border-muted">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            Voice navigation is not supported in this browser. Please use keyboard navigation instead.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Mic className="h-5 w-5" aria-hidden="true" />
          Voice Navigation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Voice Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant={isListening ? "destructive" : "default"}
            size="sm"
            onClick={isListening ? stopListening : startListening}
            disabled={isProcessing}
            aria-label={isListening ? "Stop listening" : "Start voice recognition"}
          >
            {isListening ? (
              <>
                <MicOff className="h-4 w-4 mr-2" aria-hidden="true" />
                Stop
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-2" aria-hidden="true" />
                Listen
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSpeech}
            aria-label={speechEnabled ? "Disable speech output" : "Enable speech output"}
          >
            {speechEnabled ? (
              <>
                <Volume2 className="h-4 w-4 mr-2" aria-hidden="true" />
                Speech On
              </>
            ) : (
              <>
                <VolumeX className="h-4 w-4 mr-2" aria-hidden="true" />
                Speech Off
              </>
            )}
          </Button>
          
          {isProcessing && (
            <Badge variant="secondary">Processing...</Badge>
          )}
          
          {isListening && (
            <Badge variant="default">Listening...</Badge>
          )}
        </div>

        {/* Last Command and Response */}
        {lastCommand && (
          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium">Last Command:</p>
              <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                "{lastCommand}"
              </p>
            </div>
            
            {lastResponse && (
              <div>
                <p className="text-sm font-medium">Response:</p>
                <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                  {lastResponse}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Voice Commands Help */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Available Commands:</p>
          <div className="grid grid-cols-1 gap-1">
            {context === 'search' && (
              <>
                <p>• "Search for [movie title]"</p>
                <p>• "Filter by [genre/year]"</p>
                <p>• "Show only movies with captions"</p>
              </>
            )}
            {context === 'player' && (
              <>
                <p>• "Play" / "Pause" / "Stop"</p>
                <p>• "Volume up" / "Volume down"</p>
                <p>• "Enable captions" / "Disable captions"</p>
              </>
            )}
            {context === 'details' && (
              <>
                <p>• "Read description"</p>
                <p>• "Accessibility features"</p>
                <p>• "Rating"</p>
              </>
            )}
            {context === 'navigation' && (
              <>
                <p>• "Go home" / "Search page"</p>
                <p>• "Favorites" / "Settings"</p>
                <p>• "Help"</p>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
