import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AccessibilityControls } from '../components/AccessibilityControls';
import { Volume2, Captions, Eye, Keyboard, Monitor, Headphones } from 'lucide-react';

export function AccessibilityPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Accessibility Features</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          AccessiCinema is designed to be fully accessible to users with disabilities. 
          Customize your experience and learn about our comprehensive accessibility features.
        </p>
      </div>

      {/* Accessibility Controls */}
      <AccessibilityControls />

      {/* Feature Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" aria-hidden="true" />
              Audio Descriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Detailed narration of visual elements, actions, and scene changes for visually impaired users.
            </p>
            <div className="space-y-2">
              <Badge variant="outline">Professional Narration</Badge>
              <Badge variant="outline">Scene Descriptions</Badge>
              <Badge variant="outline">Character Actions</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Captions className="h-5 w-5" aria-hidden="true" />
              Closed Captions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Accurate subtitles including sound effects and speaker identification for deaf and hard-of-hearing users.
            </p>
            <div className="space-y-2">
              <Badge variant="outline">Speaker Identification</Badge>
              <Badge variant="outline">Sound Effects</Badge>
              <Badge variant="outline">Music Descriptions</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" aria-hidden="true" />
              Sign Language
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Sign language interpretation available for select movies to support deaf users.
            </p>
            <div className="space-y-2">
              <Badge variant="outline">ASL Interpretation</Badge>
              <Badge variant="outline">Picture-in-Picture</Badge>
              <Badge variant="outline">Adjustable Size</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" aria-hidden="true" />
              Keyboard Navigation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Full keyboard navigation support with visible focus indicators and logical tab order.
            </p>
            <div className="space-y-2">
              <Badge variant="outline">Tab Navigation</Badge>
              <Badge variant="outline">Arrow Key Support</Badge>
              <Badge variant="outline">Escape Key Handling</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" aria-hidden="true" />
              Screen Reader Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Optimized for NVDA, JAWS, and VoiceOver with proper ARIA labels and semantic markup.
            </p>
            <div className="space-y-2">
              <Badge variant="outline">ARIA Labels</Badge>
              <Badge variant="outline">Live Regions</Badge>
              <Badge variant="outline">Semantic HTML</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Headphones className="h-5 w-5" aria-hidden="true" />
              Audio Enhancement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Enhanced audio features including volume normalization and frequency adjustment.
            </p>
            <div className="space-y-2">
              <Badge variant="outline">Volume Control</Badge>
              <Badge variant="outline">Audio Balance</Badge>
              <Badge variant="outline">Speed Adjustment</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* WCAG Compliance */}
      <Card>
        <CardHeader>
          <CardTitle>WCAG 2.1 AA+ Compliance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            AccessiCinema meets and exceeds Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Perceivable</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Alternative text for all images</li>
                <li>• Captions and audio descriptions</li>
                <li>• Sufficient color contrast ratios</li>
                <li>• Resizable text up to 200%</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Operable</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Full keyboard accessibility</li>
                <li>• No seizure-inducing content</li>
                <li>• Sufficient time limits</li>
                <li>• Clear navigation structure</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Understandable</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Clear and simple language</li>
                <li>• Predictable functionality</li>
                <li>• Input assistance and error prevention</li>
                <li>• Consistent navigation patterns</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Robust</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Compatible with assistive technologies</li>
                <li>• Valid and semantic HTML</li>
                <li>• Progressive enhancement</li>
                <li>• Cross-browser compatibility</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact and Feedback */}
      <Card>
        <CardHeader>
          <CardTitle>Accessibility Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            We're committed to continuous improvement of our accessibility features. 
            If you encounter any barriers or have suggestions, please let us know.
          </p>
          <div className="space-y-2 text-sm">
            <p><strong>Email:</strong> accessibility@accessicinema.com</p>
            <p><strong>Phone:</strong> 1-800-ACCESS (1-800-222-3771)</p>
            <p><strong>TTY:</strong> 1-800-855-2880</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
