import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function ColorTokens() {
  return (
    <div className="min-h-screen bg-background p-6 space-y-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-3xl font-light text-foreground">
            Professional Oil Black Design System
          </h1>
          <p className="text-muted-foreground">
            Paleta 60-30-10: Oil Black Base (60%) + Steel Structure (30%) + Strategic Accents (10%)
          </p>
        </div>

        {/* Color Palette Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 60% Oil Black Base */}
          <Card className="space-y-4">
            <CardHeader>
              <CardTitle className="text-lg">60% Oil Black Base</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-background border rounded p-3">
                <div className="text-sm font-mono">background</div>
                <div className="text-xs text-muted-foreground">Oil Black #0A0B0F</div>
              </div>
              <div className="bg-card border rounded p-3">
                <div className="text-sm font-mono">card</div>
                <div className="text-xs text-muted-foreground">Charcoal Surface</div>
              </div>
              <div className="bg-popover border rounded p-3">
                <div className="text-sm font-mono">popover</div>
                <div className="text-xs text-muted-foreground">Elevated Surface</div>
              </div>
            </CardContent>
          </Card>

          {/* 30% Steel Structure */}
          <Card className="space-y-4">
            <CardHeader>
              <CardTitle className="text-lg">30% Steel Structure</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-secondary border rounded p-3">
                <div className="text-sm font-mono text-secondary-foreground">secondary</div>
                <div className="text-xs text-muted-foreground">Steel Blue #334155</div>
              </div>
              <div className="bg-muted border rounded p-3">
                <div className="text-sm font-mono">muted</div>
                <div className="text-xs text-muted-foreground">Warm Gray Surface</div>
              </div>
              <div className="bg-accent border rounded p-3">
                <div className="text-sm font-mono text-accent-foreground">accent</div>
                <div className="text-xs text-muted-foreground">Steel Blue Light</div>
              </div>
            </CardContent>
          </Card>

          {/* 10% Strategic Accents */}
          <Card className="space-y-4">
            <CardHeader>
              <CardTitle className="text-lg">10% Strategic Accents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-primary border rounded p-3">
                <div className="text-sm font-mono text-primary-foreground">primary</div>
                <div className="text-xs text-muted-foreground">Refined Red #DC2626</div>
              </div>
              <div className="bg-mocha border rounded p-3">
                <div className="text-sm font-mono text-mocha-foreground">mocha</div>
                <div className="text-xs text-muted-foreground">Pantone 2025 Mocha</div>
              </div>
              <div className="bg-strategic-orange border rounded p-3">
                <div className="text-sm font-mono text-white">strategic-orange</div>
                <div className="text-xs text-gray-200">Strategic CTA #F97316</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Button Variants */}
        <Card>
          <CardHeader>
            <CardTitle>Professional Button Variants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="default">Default (Strategic)</Button>
              <Button variant="steel">Steel Structure</Button>
              <Button variant="mocha">Mocha Accent</Button>
              <Button variant="strategic-cta">Strategic CTA</Button>
              <Button variant="minimal">Minimal</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="secondary">Secondary</Button>
            </div>
          </CardContent>
        </Card>

        {/* Badge Variants */}
        <Card>
          <CardHeader>
            <CardTitle>Professional Badge System</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">Critical Alert</Badge>
              <Badge variant="steel">Steel Info</Badge>
              <Badge variant="mocha">Mocha Status</Badge>
              <Badge variant="minimal">Minimal Badge</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Typography & Hierarchy */}
        <Card>
          <CardHeader>
            <CardTitle>Typography Hierarchy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <h1 className="text-3xl font-light text-foreground">H1: Light Professional (foreground)</h1>
            <h2 className="text-2xl font-normal text-foreground">H2: Normal Weight (foreground)</h2>
            <h3 className="text-xl font-medium text-foreground">H3: Medium Weight (foreground)</h3>
            <p className="text-base text-foreground">Body text using foreground color for readability</p>
            <p className="text-sm text-muted-foreground">Secondary text using muted-foreground for hierarchy</p>
            <p className="text-xs text-muted-foreground">Small text for metadata and captions</p>
          </CardContent>
        </Card>

        {/* Contrast Validation */}
        <Card>
          <CardHeader>
            <CardTitle>WCAG 2.1 AA Contrast Validation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="bg-background text-foreground p-2 border rounded">
                  ✅ Background + Foreground: High Contrast
                </div>
                <div className="bg-card text-card-foreground p-2 border rounded">
                  ✅ Card + Card Foreground: Professional
                </div>
                <div className="bg-primary text-primary-foreground p-2 rounded">
                  ✅ Primary + Primary Foreground: Strategic
                </div>
              </div>
              <div className="space-y-2">
                <div className="bg-secondary text-secondary-foreground p-2 rounded">
                  ✅ Secondary + Secondary Foreground: Steel
                </div>
                <div className="bg-muted text-muted-foreground p-2 rounded">
                  ✅ Muted + Muted Foreground: Subtle
                </div>
                <div className="bg-mocha text-mocha-foreground p-2 rounded">
                  ✅ Mocha + Mocha Foreground: Warm
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}