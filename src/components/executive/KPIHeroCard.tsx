import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer';
import { X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface KPIHeroCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  className?: string;
  loading?: boolean;
  tooltip?: React.ReactNode;
  onClick?: () => void;
}

export function KPIHeroCard({ 
  title, 
  value, 
  unit = '', 
  trend = 'neutral', 
  trendValue,
  className,
  loading = false,
  tooltip,
  onClick
}: KPIHeroCardProps) {
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (loading) {
    return (
      <div className={cn(
        "bg-card border border-border/50 rounded-xl p-3 md:p-6 hover-lift",
        "shadow-apple hover:shadow-apple-md transition-all duration-200",
        className
      )}>
        <div className="space-y-2 md:space-y-3">
          <div className="h-3 md:h-4 bg-muted animate-pulse rounded w-3/4"></div>
          <div className="h-5 md:h-8 bg-muted animate-pulse rounded w-1/2"></div>
          <div className="h-2.5 md:h-3 bg-muted animate-pulse rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      default: return '→';
    }
  };

  const formatValue = () => {
    if (typeof value === 'number') {
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(2)}M`;
      } else if (value >= 1000) {
        return `${(value / 1000).toFixed(2)}K`;
      }
      return Number(value.toFixed(2)).toLocaleString();
    }
    return value;
  };

  const handleCardClick = () => {
    if (isMobile && onClick) {
      onClick();
    } else if (isMobile && tooltip) {
      setDrawerOpen(true);
    } else {
      onClick?.();
    }
  };

  const handleDrawerOpenChange = (open: boolean) => {
    setDrawerOpen(open);
    if (!open) {
      requestAnimationFrame(() => {
        document.body.style.overflow = '';
        document.body.style.pointerEvents = '';
      });
    }
  };

  const cardContent = (
    <div 
      className={cn(
        "bg-card border border-border/50 rounded-xl p-3 md:p-6 hover-lift",
        "shadow-apple hover:shadow-apple-md transition-all duration-200",
        "group cursor-pointer active:scale-95 transition-transform",
        className
      )}
      onClick={handleCardClick}
    >
      <div className="space-y-1.5 md:space-y-3">
        {/* Title */}
        <p className="text-xs md:text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors leading-tight">
          {title}
        </p>
        
        {/* Value */}
        <div className="flex items-baseline gap-0.5 md:gap-1">
          <span className="text-xl md:text-3xl font-light tracking-tight text-foreground">
            {formatValue()}
          </span>
          {unit && (
            <span className="text-xs md:text-lg font-light text-muted-foreground">
              {unit}
            </span>
          )}
        </div>
        
        {/* Trend */}
        {trendValue !== undefined && (
          <div className={cn("flex items-center gap-1 text-xs", getTrendColor())}>
            <span className="text-[10px] md:text-xs">{getTrendIcon()}</span>
            <span className="font-medium">
              {Math.abs(trendValue)}%
            </span>
            <span className="text-muted-foreground hidden md:inline">vs anterior</span>
          </div>
        )}
      </div>
    </div>
  );

  // Mobile: use Drawer for tooltip content
  if (isMobile) {
    return (
      <>
        {cardContent}
        {tooltip && (
          <Drawer open={drawerOpen} onOpenChange={handleDrawerOpenChange}>
            <DrawerContent className="max-h-[75vh]">
              <DrawerHeader className="flex flex-row items-center justify-between pb-2">
                <DrawerTitle className="text-base font-semibold">{title}</DrawerTitle>
                <DrawerClose className="rounded-full p-1 hover:bg-muted">
                  <X className="h-4 w-4" />
                </DrawerClose>
              </DrawerHeader>
              <div className="px-4 pb-6 overflow-y-auto">
                {tooltip}
              </div>
            </DrawerContent>
          </Drawer>
        )}
      </>
    );
  }

  // Desktop: use Tooltip
  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {cardContent}
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-md">
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return cardContent;
}
