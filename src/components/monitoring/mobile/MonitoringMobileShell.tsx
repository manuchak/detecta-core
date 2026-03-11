import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { MobileTabSelector, type MobileTab } from './MobileTabSelector';

interface MonitoringMobileShellProps {
  tabs: MobileTab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  children: React.ReactNode;
}

export const MonitoringMobileShell: React.FC<MonitoringMobileShellProps> = ({
  tabs,
  activeTab,
  onTabChange,
  onRefresh,
  isRefreshing,
  children,
}) => {
  // Zoom reset for mobile — force 1.0
  useEffect(() => {
    const html = document.documentElement;
    const original = html.style.zoom;
    html.style.zoom = '1';
    return () => { html.style.zoom = original; };
  }, []);

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Compact header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1 shrink-0">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">Monitoreo</h1>
        </div>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center justify-center h-9 w-9 rounded-full bg-muted/60 text-muted-foreground touch-manipulation active:scale-95 transition-transform"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tab selector */}
      <div className="shrink-0">
        <MobileTabSelector tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} />
      </div>

      {/* Content area — full remaining height, scrollable per tab */}
      <div className="flex-1 overflow-y-auto px-4 pb-[env(safe-area-inset-bottom,16px)]">
        {children}
      </div>
    </div>
  );
};
