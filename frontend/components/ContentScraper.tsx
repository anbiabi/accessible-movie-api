import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Download, Globe, Zap, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';

interface ScrapingProgress {
  isActive: boolean;
  scrapedCount: number;
  newContentAdded: number;
  contentTypes: {
    movies: number;
    documentaries: number;
    series: number;
  };
  accessibilityFeaturesFound: {
    audioDescription: number;
    closedCaptions: number;
    signLanguage: number;
  };
}

export function ContentScraper() {
  const [contentType, setContentType] = useState<'movie' | 'documentary' | 'series' | 'all'>('all');
  const [maxResults, setMaxResults] = useState(50);
  const [includeAccessibilityFeatures, setIncludeAccessibilityFeatures] = useState(true);
  const [customSources, setCustomSources] = useState('');
  const [isScrapingActive, setIsScrapingActive] = useState(false);
  const [scrapingProgress, setScrapingProgress] = useState<ScrapingProgress>({
    isActive: false,
    scrapedCount: 0,
    newContentAdded: 0,
    contentTypes: { movies: 0, documentaries: 0, series: 0 },
    accessibilityFeaturesFound: { audioDescription: 0, closedCaptions: 0, signLanguage: 0 }
  });
  const { toast } = useToast();

  const handleStartScraping = async () => {
    setIsScrapingActive(true);
    setScrapingProgress(prev => ({ ...prev, isActive: true }));

    try {
      const sources = customSources
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const response = await backend.ai.scrapeAccessibleContent({
        contentType,
        maxResults,
        includeAccessibilityFeatures,
        sources
      });

      setScrapingProgress({
        isActive: false,
        scrapedCount: response.scrapedCount,
        newContentAdded: response.newContentAdded,
        contentTypes: response.contentTypes,
        accessibilityFeaturesFound: response.accessibilityFeaturesFound
      });

      toast({
        title: "Content scraping completed",
        description: `Added ${response.newContentAdded} new accessible content items to the database.`,
      });

    } catch (error) {
      console.error('Content scraping failed:', error);
      toast({
        title: "Scraping failed",
        description: "Failed to scrape content. Please check your settings and try again.",
        variant: "destructive",
      });
    } finally {
      setIsScrapingActive(false);
      setScrapingProgress(prev => ({ ...prev, isActive: false }));
    }
  };

  const handleStopScraping = () => {
    setIsScrapingActive(false);
    setScrapingProgress(prev => ({ ...prev, isActive: false }));
    toast({
      title: "Scraping stopped",
      description: "Content scraping has been stopped.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" aria-hidden="true" />
            AI Content Scraper
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Automatically discover and add accessible media content to the database using AI-powered web scraping.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Scraping Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="content-type">Content Type</Label>
              <Select value={contentType} onValueChange={(value: any) => setContentType(value)}>
                <SelectTrigger id="content-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Content Types</SelectItem>
                  <SelectItem value="movie">Movies Only</SelectItem>
                  <SelectItem value="documentary">Documentaries Only</SelectItem>
                  <SelectItem value="series">Series Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-results">Maximum Results</Label>
              <Input
                id="max-results"
                type="number"
                value={maxResults}
                onChange={(e) => setMaxResults(parseInt(e.target.value) || 50)}
                min={1}
                max={500}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="include-accessibility" className="text-sm font-medium">
              Generate AI Accessibility Features
            </Label>
            <Switch
              id="include-accessibility"
              checked={includeAccessibilityFeatures}
              onCheckedChange={setIncludeAccessibilityFeatures}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-sources">Custom Sources (Optional)</Label>
            <Textarea
              id="custom-sources"
              placeholder="Enter custom URLs or sources, one per line..."
              value={customSources}
              onChange={(e) => setCustomSources(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Add specific websites or sources to scrape. Leave empty to use default sources.
            </p>
          </div>

          {/* Scraping Controls */}
          <div className="flex gap-2">
            {!isScrapingActive ? (
              <Button onClick={handleStartScraping} className="flex items-center gap-2">
                <Zap className="h-4 w-4" aria-hidden="true" />
                Start AI Scraping
              </Button>
            ) : (
              <Button onClick={handleStopScraping} variant="destructive" className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                Stop Scraping
              </Button>
            )}
          </div>

          {/* Scraping Progress */}
          {scrapingProgress.isActive && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span className="font-medium">AI Scraping in Progress...</span>
                </div>
                <Progress value={65} className="mb-3" />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Content Scraped:</span>
                    <span className="ml-2">{scrapingProgress.scrapedCount}</span>
                  </div>
                  <div>
                    <span className="font-medium">New Content Added:</span>
                    <span className="ml-2">{scrapingProgress.newContentAdded}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Scraping Results */}
          {!scrapingProgress.isActive && scrapingProgress.scrapedCount > 0 && (
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-5 w-5" aria-hidden="true" />
                  Scraping Completed
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Content Statistics</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Total Scraped:</span>
                        <Badge variant="outline">{scrapingProgress.scrapedCount}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>New Content Added:</span>
                        <Badge variant="default">{scrapingProgress.newContentAdded}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Movies:</span>
                        <Badge variant="secondary">{scrapingProgress.contentTypes.movies}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Documentaries:</span>
                        <Badge variant="secondary">{scrapingProgress.contentTypes.documentaries}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Series:</span>
                        <Badge variant="secondary">{scrapingProgress.contentTypes.series}</Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Accessibility Features Found</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Audio Descriptions:</span>
                        <Badge className="bg-green-100 text-green-800">
                          {scrapingProgress.accessibilityFeaturesFound.audioDescription}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Closed Captions:</span>
                        <Badge className="bg-blue-100 text-blue-800">
                          {scrapingProgress.accessibilityFeaturesFound.closedCaptions}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Sign Language:</span>
                        <Badge className="bg-purple-100 text-purple-800">
                          {scrapingProgress.accessibilityFeaturesFound.signLanguage}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Scraping Information */}
      <Card>
        <CardHeader>
          <CardTitle>How AI Content Scraping Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Automated Discovery</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Scans multiple content sources and databases</li>
                <li>• Identifies movies, documentaries, and series</li>
                <li>• Extracts metadata and accessibility information</li>
                <li>• Verifies content availability and quality</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">AI Enhancement</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Generates detailed audio descriptions</li>
                <li>• Creates accessibility-focused summaries</li>
                <li>• Analyzes content for accessibility features</li>
                <li>• Categorizes content by accessibility level</li>
              </ul>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Data Sources</h4>
            <p className="text-sm text-muted-foreground mb-2">
              The AI scraper automatically discovers content from various sources:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium">Public Databases</p>
                <p className="text-muted-foreground">Open movie databases and catalogs</p>
              </div>
              <div>
                <p className="font-medium">Accessibility Organizations</p>
                <p className="text-muted-foreground">Content with verified accessibility features</p>
              </div>
              <div>
                <p className="font-medium">Educational Platforms</p>
                <p className="text-muted-foreground">Documentaries and educational content</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
