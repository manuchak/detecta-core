import React from 'react';
import { MainNavigation } from '@/components/layout/MainNavigation';
import { CustomBreadcrumb } from '@/components/ui/custom-breadcrumb';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<any>;
}

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  onRefresh?: () => void;
  loading?: boolean;
  className?: string;
}

export function PageLayout({
  children,
  title,
  description,
  breadcrumbs = [],
  actions,
  onRefresh,
  loading,
  className
}: PageLayoutProps) {
  return (
    <div className={cn("min-h-screen bg-background", className)}>
      <MainNavigation />
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="space-y-2">
            {breadcrumbs.length > 0 && (
              <CustomBreadcrumb items={breadcrumbs} />
            )}
            
            {title && (
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {title}
                </h1>
                {description && (
                  <p className="text-muted-foreground">
                    {description}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={loading}
                className="h-9"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                Actualizar
              </Button>
            )}
            {actions}
          </div>
        </div>

        {/* Page Content */}
        <div className="space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
}