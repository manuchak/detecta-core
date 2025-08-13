import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TopNavBar } from '@/components/navigation/TopNavBar';
import { ContextualSidebar } from '@/components/navigation/ContextualSidebar';

interface AppShellProps {
  children: React.ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
  sectionInfo: {
    title: string;
    description: string;
    icon: React.ComponentType<any>;
    breadcrumbs: string[];
  };
  stats?: {
    criticalAlerts?: number;
    urgentClusters?: number;
    totalDeficit?: number;
    activeCandidates?: number;
  };
  onRefresh?: () => void;
  onAnalyze?: () => void;
  loading?: boolean;
}

export function AppShell({
  children,
  activeSection,
  onSectionChange,
  sectionInfo,
  stats,
  onRefresh,
  onAnalyze,
  loading
}: AppShellProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <ContextualSidebar
          activeSection={activeSection}
          onSectionChange={onSectionChange}
          stats={stats}
        />
        
        <div className="flex-1 flex flex-col">
          <TopNavBar
            sectionInfo={sectionInfo}
            onRefresh={onRefresh}
            onAnalyze={onAnalyze}
            loading={loading}
            stats={stats}
          />
          
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}