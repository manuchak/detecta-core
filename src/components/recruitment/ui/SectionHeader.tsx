
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  badge?: string;
  actions?: React.ReactNode;
  breadcrumbs?: string[];
}

export function SectionHeader({
  title,
  description,
  icon: Icon,
  badge,
  actions,
  breadcrumbs
}: SectionHeaderProps) {
  return (
    <div className="space-y-4 pb-6 border-b border-border">
      {breadcrumbs && (
        <nav className="text-sm text-muted-foreground">
          {breadcrumbs.map((crumb, index) => (
            <span key={index}>
              {index > 0 && ' / '}
              <span className={index === breadcrumbs.length - 1 ? 'text-foreground font-medium' : ''}>
                {crumb}
              </span>
            </span>
          ))}
        </nav>
      )}
      
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {Icon && <Icon className="h-6 w-6 text-primary" />}
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {badge && <Badge variant="outline">{badge}</Badge>}
          </div>
          {description && (
            <p className="text-muted-foreground max-w-2xl">{description}</p>
          )}
        </div>
        
        {actions && (
          <div className="flex gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
