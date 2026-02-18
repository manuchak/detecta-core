import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RiskScoreCardProps {
  title: string;
  value: number | string;
  maxValue?: number;
  icon: LucideIcon;
  description: string;
  variant: 'success' | 'warning' | 'danger' | 'neutral';
}

const variantStyles = {
  success: 'border-l-green-500',
  warning: 'border-l-yellow-500',
  danger: 'border-l-red-500',
  neutral: 'border-l-muted-foreground/30',
};

const iconVariant = {
  success: 'text-green-600',
  warning: 'text-yellow-600',
  danger: 'text-red-600',
  neutral: 'text-muted-foreground',
};

export function RiskScoreCard({ title, value, maxValue, icon: Icon, description, variant }: RiskScoreCardProps) {
  return (
    <Card className={cn('border-l-4', variantStyles[variant])}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">{title}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-foreground">{value}</span>
              {maxValue && <span className="text-xs text-muted-foreground">/ {maxValue}</span>}
            </div>
            <p className="text-[10px] text-muted-foreground">{description}</p>
          </div>
          <Icon className={cn('h-5 w-5', iconVariant[variant])} />
        </div>
      </CardContent>
    </Card>
  );
}
