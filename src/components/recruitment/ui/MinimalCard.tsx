import React from 'react';
import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MinimalCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  preview?: {
    label: string;
    value: string | number;
  };
  breakdown?: {
    activos: number;
    inactivos: number;
  };
  variant?: 'default' | 'primary' | 'subtle';
  className?: string;
  loading?: boolean;
}

const variantStyles = {
  default: 'bg-white border-gray-100',
  primary: 'bg-gray-50 border-gray-200', 
  subtle: 'bg-gray-25 border-gray-50'
};

export function MinimalCard({
  title,
  value,
  subtitle,
  preview,
  breakdown,
  variant = 'default',
  className,
  loading = false
}: MinimalCardProps) {
  if (loading) {
    return (
      <Card className={cn(
        'p-8 animate-pulse border border-gray-100',
        className
      )}>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-12 bg-gray-200 rounded w-1/2"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn(
      'p-8 transition-all duration-200 hover:shadow-sm',
      variantStyles[variant],
      className
    )}>
      <div className="space-y-4">
        {/* Title */}
        <h3 className="text-sm font-medium text-gray-600 tracking-wide uppercase">
          {title}
        </h3>
        
        {/* Main Value */}
        <div className="space-y-1">
          <p className="text-4xl font-light text-gray-900 tracking-tight">
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500">
              {subtitle}
            </p>
          )}
        </div>

        {/* Preview for next period */}
        {preview && (
          <div className="pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                {preview.label}
              </span>
              <span className="text-lg font-medium text-gray-600">
                {preview.value}
              </span>
            </div>
          </div>
        )}

        {/* Breakdown of activos/inactivos */}
        {breakdown && (
          <div className="pt-4 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">
                    Activos
                  </span>
                </div>
                <span className="text-lg font-semibold text-blue-800">
                  {breakdown.activos}
                </span>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div className="h-2 w-2 rounded-full bg-red-500"></div>
                  <span className="text-xs font-medium text-red-700 uppercase tracking-wide">
                    Inactivos
                  </span>
                </div>
                <span className="text-lg font-semibold text-red-800">
                  {breakdown.inactivos}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}