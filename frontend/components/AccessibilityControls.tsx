import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { useAccessibility } from '../contexts/AccessibilityContext';

export function AccessibilityControls() {
  const { settings, updateSetting, speakText, stopSpeaking } = useAccessibility();

  const testSpeech = () => {
    speakText("This is a test of the speech synthesis feature. You can adjust the rate, pitch, and volume settings below.");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accessibility Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Visual Settings</h3>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="high-contrast" className="text-sm font-medium">
                High Contrast Mode
              </Label>
              <Switch
                id="high-contrast"
                checked={settings.highContrast}
                onCheckedChange={(checked) => updateSetting('highContrast', checked)}
                aria-describedby="high-contrast-desc"
              />
            </div>
            <p id="high-contrast-desc" className="text-xs text-muted-foreground">
              Increases contrast for better visibility (Alt+H)
            </p>

            <div className="flex items-center justify-between">
              <Label htmlFor="large-text" className="text-sm font-medium">
                Large Text
              </Label>
              <Switch
                id="large-text"
                checked={settings.largeText}
                onCheckedChange={(checked) => updateSetting('largeText', checked)}
                aria-describedby="large-text-desc"
              />
            </div>
            <p id="large-text-desc" className="text-xs text-muted-foreground">
              Increases text size throughout the application (Alt+L)
            </p>

            <div className="space-y-2">
              <Label htmlFor="font-size" className="text-sm font-medium">
                Font Size
              </Label>
              <Select
                value={settings.fontSize}
                onValueChange={(value) => updateSetting('fontSize', value)}
              >
                <SelectTrigger id="font-size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                  <SelectItem value="extra-large">Extra Large</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="reduced-motion" className="text-sm font-medium">
                Reduced Motion
              </Label>
              <Switch
                id="reduced-motion"
                checked={settings.reducedMotion}
                onCheckedChange={(checked) => updateSetting('reducedMotion', checked)}
                aria-describedby="reduced-motion-desc"
              />
            </div>
            <p id="reduced-motion-desc" className="text-xs text-muted-foreground">
              Reduces animations and transitions (Alt+R)
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Navigation & Audio</h3>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="screen-reader" className="text-sm font-medium">
                Screen Reader Mode
              </Label>
              <Switch
                id="screen-reader"
                checked={settings.screenReaderMode}
                onCheckedChange={(checked) => updateSetting('screenReaderMode', checked)}
                aria-describedby="screen-reader-desc"
              />
            </div>
            <p id="screen-reader-desc" className="text-xs text-muted-foreground">
              Optimizes interface for screen readers
            </p>

            <div className="flex items-center justify-between">
              <Label htmlFor="keyboard-nav" className="text-sm font-medium">
                Enhanced Keyboard Navigation
              </Label>
              <Switch
                id="keyboard-nav"
                checked={settings.keyboardNavigation}
                onCheckedChange={(checked) => updateSetting('keyboardNavigation', checked)}
                aria-describedby="keyboard-nav-desc"
              />
            </div>
            <p id="keyboard-nav-desc" className="text-xs text-muted-foreground">
              Improves keyboard navigation with visual focus indicators
            </p>

            <div className="flex items-center justify-between">
              <Label htmlFor="voice-navigation" className="text-sm font-medium">
                Voice Navigation
              </Label>
              <Switch
                id="voice-navigation"
                checked={settings.voiceNavigationEnabled}
                onCheckedChange={(checked) => updateSetting('voiceNavigationEnabled', checked)}
                aria-describedby="voice-navigation-desc"
              />
            </div>
            <p id="voice-navigation-desc" className="text-xs text-muted-foreground">
              Enable voice commands and speech output
            </p>

            <div className="flex items-center justify-between">
              <Label htmlFor="braille-enabled" className="text-sm font-medium">
                Braille Support
              </Label>
              <Switch
                id="braille-enabled"
                checked={settings.brailleEnabled}
                onCheckedChange={(checked) => updateSetting('brailleEnabled', checked)}
                aria-describedby="braille-enabled-desc"
              />
            </div>
            <p id="braille-enabled-desc" className="text-xs text-muted-foreground">
              Enable braille text conversion for tactile displays
            </p>

            <div className="flex items-center justify-between">
              <Label htmlFor="audio-descriptions" className="text-sm font-medium">
                Prefer Audio Descriptions
              </Label>
              <Switch
                id="audio-descriptions"
                checked={settings.audioDescriptions}
                onCheckedChange={(checked) => updateSetting('audioDescriptions', checked)}
                aria-describedby="audio-descriptions-desc"
              />
            </div>
            <p id="audio-descriptions-desc" className="text-xs text-muted-foreground">
              Prioritize movies with audio descriptions
            </p>

            <div className="flex items-center justify-between">
              <Label htmlFor="autoplay-disabled" className="text-sm font-medium">
                Disable Autoplay
              </Label>
              <Switch
                id="autoplay-disabled"
                checked={settings.autoplayDisabled}
                onCheckedChange={(checked) => updateSetting('autoplayDisabled', checked)}
                aria-describedby="autoplay-disabled-desc"
              />
            </div>
            <p id="autoplay-disabled-desc" className="text-xs text-muted-foreground">
              Prevents videos from playing automatically
            </p>
          </div>
        </div>

        {/* Speech Settings */}
        {settings.voiceNavigationEnabled && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Speech Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="speech-rate">Speech Rate: {settings.speechRate.toFixed(1)}</Label>
                <Slider
                  id="speech-rate"
                  value={[settings.speechRate]}
                  onValueChange={([value]) => updateSetting('speechRate', value)}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="speech-pitch">Speech Pitch: {settings.speechPitch.toFixed(1)}</Label>
                <Slider
                  id="speech-pitch"
                  value={[settings.speechPitch]}
                  onValueChange={([value]) => updateSetting('speechPitch', value)}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="speech-volume">Speech Volume: {Math.round(settings.speechVolume * 100)}%</Label>
                <Slider
                  id="speech-volume"
                  value={[settings.speechVolume]}
                  onValueChange={([value]) => updateSetting('speechVolume', value)}
                  min={0}
                  max={1}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={testSpeech}>
                Test Speech
              </Button>
              <Button variant="outline" onClick={stopSpeaking}>
                Stop Speech (Alt+S)
              </Button>
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2">Keyboard Shortcuts</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div><kbd className="px-2 py-1 bg-background rounded">Tab</kbd> Navigate forward</div>
            <div><kbd className="px-2 py-1 bg-background rounded">Shift+Tab</kbd> Navigate backward</div>
            <div><kbd className="px-2 py-1 bg-background rounded">Enter</kbd> Activate button/link</div>
            <div><kbd className="px-2 py-1 bg-background rounded">Space</kbd> Toggle checkbox/button</div>
            <div><kbd className="px-2 py-1 bg-background rounded">Esc</kbd> Close modal/menu</div>
            <div><kbd className="px-2 py-1 bg-background rounded">Arrow Keys</kbd> Navigate lists</div>
            <div><kbd className="px-2 py-1 bg-background rounded">Alt+H</kbd> Toggle high contrast</div>
            <div><kbd className="px-2 py-1 bg-background rounded">Alt+L</kbd> Toggle large text</div>
            <div><kbd className="px-2 py-1 bg-background rounded">Alt+R</kbd> Toggle reduced motion</div>
            <div><kbd className="px-2 py-1 bg-background rounded">Alt+S</kbd> Stop speech</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
