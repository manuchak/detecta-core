import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  headerContent?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'compact';
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  subtitle,
  children,
  defaultOpen = false,
  headerContent,
  className,
  variant = 'default'
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggleOpen = () => setIsOpen(!isOpen);

  if (variant === 'compact') {
    return (
      <Card className={cn("border-0 shadow-none", className)}>
        <CardHeader className="px-0 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleOpen}
                className="h-8 w-8 p-0 shrink-0"
              >
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-medium text-foreground truncate">{title}</h3>
                {subtitle && (
                  <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
                )}
              </div>
            </div>
            {headerContent && (
              <div className="shrink-0 ml-3">
                {headerContent}
              </div>
            )}
          </div>
        </CardHeader>
        {isOpen && (
          <CardContent className="px-0 pt-0">
            {children}
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleOpen}
                className="h-8 w-8 p-0"
              >
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
              <div>
                <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                {subtitle && (
                  <p className="text-sm text-muted-foreground">{subtitle}</p>
                )}
              </div>
            </div>
          </div>
          {headerContent && (
            <div className="ml-4">
              {headerContent}
            </div>
          )}
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent>
          {children}
        </CardContent>
      )}
    </Card>
  );
};