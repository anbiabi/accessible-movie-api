import React, { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReaderMode: boolean;
  keyboardNavigation: boolean;
  audioDescriptions: boolean;
  autoplayDisabled: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  voiceNavigationEnabled: boolean;
  brailleEnabled: boolean;
  speechRate: number;
  speechPitch: number;
  speechVolume: number;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: (key: keyof AccessibilitySettings, value: boolean | string | number) => void;
  announceToScreenReader: (message: string) => void;
  speakText: (text: string) => void;
  stopSpeaking: () => void;
}

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  largeText: false,
  reducedMotion: false,
  screenReaderMode: false,
  keyboardNavigation: true,
  audioDescriptions: true,
  autoplayDisabled: true,
  fontSize: 'medium',
  voiceNavigationEnabled: true,
  brailleEnabled: false,
  speechRate: 1.0,
  speechPitch: 1.0,
  speechVolume: 0.8,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    const saved = localStorage.getItem('accessibility-settings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  const updateSetting = (key: keyof AccessibilitySettings, value: boolean | string | number) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      localStorage.setItem('accessibility-settings', JSON.stringify(newSettings));
      return newSettings;
    });
  };

  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window && settings.voiceNavigationEnabled) {
      // Stop any current speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = settings.speechRate;
      utterance.pitch = settings.speechPitch;
      utterance.volume = settings.speechVolume;
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  useEffect(() => {
    // Apply accessibility settings to document
    const root = document.documentElement;
    
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    if (settings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
    
    if (settings.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }
    
    if (settings.screenReaderMode) {
      root.classList.add('screen-reader-mode');
    } else {
      root.classList.remove('screen-reader-mode');
    }
    
    root.setAttribute('data-font-size', settings.fontSize);
    
    // Set CSS custom properties for font size
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
      'extra-large': '20px',
    };
    
    root.style.setProperty('--base-font-size', fontSizeMap[settings.fontSize]);
    
    // Add keyboard navigation enhancements
    if (settings.keyboardNavigation) {
      root.classList.add('enhanced-keyboard-nav');
    } else {
      root.classList.remove('enhanced-keyboard-nav');
    }
    
  }, [settings]);

  // Add global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt + H: Toggle high contrast
      if (event.altKey && event.key === 'h') {
        event.preventDefault();
        updateSetting('highContrast', !settings.highContrast);
        announceToScreenReader(settings.highContrast ? 'High contrast disabled' : 'High contrast enabled');
      }
      
      // Alt + L: Toggle large text
      if (event.altKey && event.key === 'l') {
        event.preventDefault();
        updateSetting('largeText', !settings.largeText);
        announceToScreenReader(settings.largeText ? 'Large text disabled' : 'Large text enabled');
      }
      
      // Alt + R: Toggle reduced motion
      if (event.altKey && event.key === 'r') {
        event.preventDefault();
        updateSetting('reducedMotion', !settings.reducedMotion);
        announceToScreenReader(settings.reducedMotion ? 'Reduced motion disabled' : 'Reduced motion enabled');
      }
      
      // Alt + S: Stop speech
      if (event.altKey && event.key === 's') {
        event.preventDefault();
        stopSpeaking();
        announceToScreenReader('Speech stopped');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [settings]);

  return (
    <AccessibilityContext.Provider value={{ 
      settings, 
      updateSetting, 
      announceToScreenReader, 
      speakText, 
      stopSpeaking 
    }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
