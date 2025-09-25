import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, User, Edit, Clock, AlertCircle, ChevronRight } from 'lucide-react';
import type { EditSuggestion } from '@/hooks/useSmartEditSuggestions';
import type { EditMode } from '@/contexts/EditWorkflowContext';

interface SmartEditSuggestionProps {
  suggestion: EditSuggestion;
  onSelect: (mode: EditMode, description: string) => void;
  isHero?: boolean;
}

const iconMap = {
  Shield,
  User,
  Edit,
  AlertCircle
};

const colorStyles = {
  blue: {
    card: 'border-blue-200/50 bg-blue-50/30 hover:bg-blue-50/50',
    button: 'apple-button-primary bg-blue-600 hover:bg-blue-700',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: 'text-blue-600'
  },
  green: {
    card: 'border-green-200/50 bg-green-50/30 hover:bg-green-50/50',
    button: 'apple-button-primary bg-green-600 hover:bg-green-700',
    badge: 'bg-green-100 text-green-700 border-green-200',
    icon: 'text-green-600'
  },
  orange: {
    card: 'border-orange-200/50 bg-orange-50/30 hover:bg-orange-50/50',
    button: 'apple-button-primary bg-orange-600 hover:bg-orange-700',
    badge: 'bg-orange-100 text-orange-700 border-orange-200',
    icon: 'text-orange-600'
  },
  red: {
    card: 'border-red-200/50 bg-red-50/30 hover:bg-red-50/50',
    button: 'apple-button-primary bg-red-600 hover:bg-red-700',
    badge: 'bg-red-100 text-red-700 border-red-200',
    icon: 'text-red-600'
  },
  gray: {
    card: 'border-border/50 bg-secondary/30 hover:bg-secondary/50',
    button: 'apple-button-secondary',
    badge: 'bg-secondary text-secondary-foreground border-border',
    icon: 'text-muted-foreground'
  }
};

export function SmartEditSuggestion({ suggestion, onSelect, isHero = false }: SmartEditSuggestionProps) {
  const IconComponent = iconMap[suggestion.icon as keyof typeof iconMap] || Edit;
  const styles = colorStyles[suggestion.color];

  const handleSelect = () => {
    onSelect(suggestion.mode, suggestion.description);
  };

  if (isHero) {
    return (
      <Card className={`apple-card-hero ${styles.card} border-2 transition-all duration-300 hover:scale-[1.02]`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl bg-white/80 shadow-apple-sm ${styles.icon}`}>
                <IconComponent className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="apple-text-title">{suggestion.title}</h3>
                  <Badge variant="outline" className={`${styles.badge} text-xs font-medium`}>
                    Recomendado
                  </Badge>
                </div>
                <p className="apple-text-body text-foreground/80">
                  {suggestion.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 apple-text-caption">
              <Clock className="h-3 w-3" />
              {suggestion.estimatedTime}
            </div>
          </div>

          {suggestion.consequences && (
            <div className="mb-4 p-3 rounded-lg bg-white/50 border border-white/60">
              <p className="apple-text-caption font-medium mb-2">Consecuencias:</p>
              <ul className="space-y-1">
                {suggestion.consequences.map((consequence, index) => (
                  <li key={index} className="apple-text-caption flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                    {consequence}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button
            onClick={handleSelect}
            className={`${styles.button} w-full font-medium group`}
          >
            {suggestion.title}
            <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`apple-card ${styles.card} transition-all duration-200 hover:scale-[1.01] cursor-pointer`} onClick={handleSelect}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-white/80 ${styles.icon}`}>
              <IconComponent className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-foreground">{suggestion.title}</h4>
              <p className="apple-text-caption mt-0.5">{suggestion.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="apple-text-caption flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {suggestion.estimatedTime}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}