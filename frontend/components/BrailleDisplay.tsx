import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Download, Copy } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface BrailleDisplayProps {
  text: string;
  title?: string;
  showControls?: boolean;
}

export function BrailleDisplay({ text, title = "Braille Output", showControls = true }: BrailleDisplayProps) {
  const [brailleText, setBrailleText] = useState<string>('');
  const [brailleEnabled, setBrailleEnabled] = useState(false);
  const [brailleGrade, setBrailleGrade] = useState<'1' | '2'>('1');
  const [cellsPerLine, setCellsPerLine] = useState(40);
  const { toast } = useToast();

  useEffect(() => {
    if (text && brailleEnabled) {
      const converted = convertToBraille(text, brailleGrade);
      setBrailleText(converted);
    } else {
      setBrailleText('');
    }
  }, [text, brailleEnabled, brailleGrade]);

  const convertToBraille = (inputText: string, grade: '1' | '2'): string => {
    // Enhanced braille conversion with Grade 1 and Grade 2 support
    const brailleMap: { [key: string]: string } = {
      // Letters
      'a': '⠁', 'b': '⠃', 'c': '⠉', 'd': '⠙', 'e': '⠑', 'f': '⠋', 'g': '⠛', 'h': '⠓', 'i': '⠊', 'j': '⠚',
      'k': '⠅', 'l': '⠇', 'm': '⠍', 'n': '⠝', 'o': '⠕', 'p': '⠏', 'q': '⠟', 'r': '⠗', 's': '⠎', 't': '⠞',
      'u': '⠥', 'v': '⠧', 'w': '⠺', 'x': '⠭', 'y': '⠽', 'z': '⠵',
      
      // Numbers (with number prefix ⠼)
      '1': '⠼⠁', '2': '⠼⠃', '3': '⠼⠉', '4': '⠼⠙', '5': '⠼⠑',
      '6': '⠼⠋', '7': '⠼⠛', '8': '⠼⠓', '9': '⠼⠊', '0': '⠼⠚',
      
      // Punctuation
      ' ': '⠀', '.': '⠲', ',': '⠂', '!': '⠖', '?': '⠦', ':': '⠒', ';': '⠆',
      '-': '⠤', '(': '⠶', ')': '⠶', '"': '⠦', "'": '⠄', '/': '⠌', '\\': '⠡',
      
      // Common contractions for Grade 2
      ...(grade === '2' && {
        'and': '⠯', 'for': '⠿', 'of': '⠷', 'the': '⠮', 'with': '⠾',
        'you': '⠽', 'as': '⠵', 'but': '⠃', 'can': '⠉', 'do': '⠙',
        'every': '⠑', 'from': '⠋', 'go': '⠛', 'have': '⠓', 'just': '⠚',
        'knowledge': '⠅', 'like': '⠇', 'more': '⠍', 'not': '⠝', 'people': '⠏',
        'quite': '⠟', 'rather': '⠗', 'so': '⠎', 'that': '⠞', 'us': '⠥',
        'very': '⠧', 'will': '⠺', 'it': '⠭', 'were': '⠽', 'his': '⠵'
      })
    };

    let result = '';
    let i = 0;
    
    while (i < inputText.length) {
      const char = inputText[i].toLowerCase();
      
      // Check for contractions in Grade 2
      if (grade === '2') {
        let foundContraction = false;
        
        // Check for multi-character contractions
        for (let len = 10; len >= 2; len--) {
          const substr = inputText.substr(i, len).toLowerCase();
          if (brailleMap[substr]) {
            result += brailleMap[substr];
            i += len;
            foundContraction = true;
            break;
          }
        }
        
        if (foundContraction) continue;
      }
      
      // Single character conversion
      if (brailleMap[char]) {
        result += brailleMap[char];
      } else {
        result += char; // Keep unknown characters as-is
      }
      
      i++;
    }
    
    return formatBrailleLines(result, cellsPerLine);
  };

  const formatBrailleLines = (brailleText: string, cellsPerLine: number): string => {
    const lines = [];
    for (let i = 0; i < brailleText.length; i += cellsPerLine) {
      lines.push(brailleText.substr(i, cellsPerLine));
    }
    return lines.join('\n');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(brailleText);
      toast({
        title: "Copied to clipboard",
        description: "Braille text has been copied to your clipboard.",
      });
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast({
        title: "Copy failed",
        description: "Failed to copy braille text to clipboard.",
        variant: "destructive",
      });
    }
  };

  const downloadBraille = () => {
    const blob = new Blob([brailleText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.toLowerCase().replace(/\s+/g, '_')}_braille.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download started",
      description: "Braille text file download has started.",
    });
  };

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" aria-hidden="true" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showControls && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="braille-enabled" className="text-sm font-medium">
                Enable Braille Output
              </Label>
              <Switch
                id="braille-enabled"
                checked={brailleEnabled}
                onCheckedChange={setBrailleEnabled}
                aria-describedby="braille-enabled-desc"
              />
            </div>
            <p id="braille-enabled-desc" className="text-xs text-muted-foreground">
              Convert text to braille for tactile reading devices
            </p>

            {brailleEnabled && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="braille-grade" className="text-sm font-medium">
                      Braille Grade
                    </Label>
                    <Select value={brailleGrade} onValueChange={(value: '1' | '2') => setBrailleGrade(value)}>
                      <SelectTrigger id="braille-grade">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Grade 1 (Letter by letter)</SelectItem>
                        <SelectItem value="2">Grade 2 (With contractions)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cells-per-line" className="text-sm font-medium">
                      Cells per Line
                    </Label>
                    <Select value={cellsPerLine.toString()} onValueChange={(value) => setCellsPerLine(parseInt(value))}>
                      <SelectTrigger id="cells-per-line">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="20">20 cells</SelectItem>
                        <SelectItem value="32">32 cells</SelectItem>
                        <SelectItem value="40">40 cells</SelectItem>
                        <SelectItem value="80">80 cells</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {brailleEnabled && brailleText && (
          <div className="space-y-3">
            <div className="bg-white border rounded-lg p-4">
              <Label className="text-sm font-medium mb-2 block">Braille Output:</Label>
              <pre 
                className="font-mono text-lg leading-relaxed whitespace-pre-wrap break-all"
                style={{ fontFamily: 'DejaVu Sans Mono, Consolas, monospace' }}
                aria-label="Braille text output"
                role="textbox"
                aria-readonly="true"
              >
                {brailleText}
              </pre>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                aria-label="Copy braille text to clipboard"
              >
                <Copy className="h-4 w-4 mr-2" aria-hidden="true" />
                Copy
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={downloadBraille}
                aria-label="Download braille text as file"
              >
                <Download className="h-4 w-4 mr-2" aria-hidden="true" />
                Download
              </Button>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>Grade 1:</strong> Each letter is represented individually</p>
              <p><strong>Grade 2:</strong> Uses contractions and abbreviations for faster reading</p>
              <p><strong>Cells per line:</strong> Adjust based on your braille display width</p>
            </div>
          </div>
        )}

        {brailleEnabled && !brailleText && text && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Converting text to braille...
            </p>
          </div>
        )}

        {!brailleEnabled && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Enable braille output to convert text for tactile reading devices.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
