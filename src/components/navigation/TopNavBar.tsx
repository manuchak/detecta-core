import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { 
  RefreshCw, 
  Zap, 
  ChevronRight,
  AlertTriangle,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TopNavBarProps {
  sectionInfo: {
    title: string;
    description: string;
    icon: React.ComponentType<any>;
    breadcrumbs: string[];
  };
  onRefresh?: () => void;
  onAnalyze?: () => void;
  loading?: boolean;
  stats?: {
    criticalAlerts?: number;
    urgentClusters?: number;
    totalDeficit?: number;
    activeCandidates?: number;
  };
}

export function TopNavBar({
  sectionInfo,
  onRefresh,
  onAnalyze,
  loading,
  stats
}: TopNavBarProps) {
  const { icon: Icon } = sectionInfo;

  return (
    <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between h-full px-4">
        {/* Left section: Trigger + Breadcrumbs */}
        <div className="flex items-center gap-4">
          <SidebarTrigger className="h-8 w-8" />
          
          {/* Breadcrumbs */}
          <nav className="flex items-center space-x-2 text-sm">
            {sectionInfo.breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                {index > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                <button 
                  className={cn(
                    "hover:text-foreground transition-colors",
                    index === sectionInfo.breadcrumbs.length - 1 
                      ? "text-foreground font-medium cursor-default" 
                      : "text-muted-foreground hover:underline"
                  )}
                  onClick={() => {
                    if (index === 0) {
                      // Navigate to main dashboard when clicking first breadcrumb
                      window.location.href = '/dashboard';
                    }
                  }}
                  disabled={index === sectionInfo.breadcrumbs.length - 1}
                >
                  {crumb}
                </button>
              </React.Fragment>
            ))}
          </nav>
        </div>

        {/* Center section: Section info */}
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-primary" />
          <div className="text-center">
            <h1 className="text-sm font-semibold text-foreground">{sectionInfo.title}</h1>
            <p className="text-xs text-muted-foreground">{sectionInfo.description}</p>
          </div>
        </div>

        {/* Right section: Quick stats + Actions */}
        <div className="flex items-center gap-3">
          {/* Quick Stats */}
          {stats && (
            <div className="flex items-center gap-2">
              {stats.totalDeficit > 0 && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {stats.totalDeficit} déficit
                </Badge>
              )}
              {stats.criticalAlerts > 0 && (
                <Badge variant="outline" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {stats.criticalAlerts} alertas
                </Badge>
              )}
              {stats.activeCandidates > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  {stats.activeCandidates} activos
                </Badge>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={loading}
                className="h-8"
              >
                <RefreshCw className={cn("h-3 w-3 mr-1", loading && "animate-spin")} />
                Actualizar
              </Button>
            )}
            {onAnalyze && (
              <Button
                variant="default"
                size="sm"
                onClick={onAnalyze}
                className="h-8"
              >
                <Zap className="h-3 w-3 mr-1" />
                Analizar
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}