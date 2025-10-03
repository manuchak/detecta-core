import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { GlobalNav } from '@/components/navigation/GlobalNav';
import { ContextualSidebar } from '@/components/navigation/ContextualSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

interface UnifiedLayoutProps {
  children: React.ReactNode;
  activeSection?: string;
  onSectionChange?: (section: string) => void;
  sidebarStats?: {
    criticalAlerts?: number;
    urgentClusters?: number;
    totalDeficit?: number;
    activeCandidates?: number;
  };
}

const UnifiedLayout: React.FC<UnifiedLayoutProps> = ({ 
  children, 
  activeSection = 'dashboard',
  onSectionChange,
  sidebarStats 
}) => {
  const { user, loading, userRole } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (!loading && user) {
      if (userRole !== null) {
        setIsInitializing(false);
      }
    } else if (!loading && !user) {
      setIsInitializing(false);
    }
  }, [loading, user, userRole]);

  // Show loading skeleton while checking authentication
  if (loading || isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <Skeleton className="h-8 w-64 mx-auto" />
            <Skeleton className="h-4 w-48 mx-auto mt-2" />
            <p className="text-sm text-muted-foreground mt-4">Cargando...</p>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // User role verification
  if (!userRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Verificando permisos...</p>
          <p className="text-xs text-muted-foreground">Usuario: {user.email}</p>
        </div>
      </div>
    );
  }

  const handleSectionChange = (section: string) => {
    if (onSectionChange) {
      onSectionChange(section);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <GlobalNav />
      
      <SidebarProvider defaultOpen={true}>
        <div className="flex w-full">
          <ContextualSidebar
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
            stats={sidebarStats}
          />
          
          <div className="flex-1 flex flex-col">
            {/* Sidebar trigger for mobile/collapsed state */}
            <div className="sticky top-14 z-40 flex h-12 items-center border-b border-border bg-background/95 backdrop-blur px-4">
              <SidebarTrigger className="mr-2" />
              <div className="flex-1" />
            </div>
            
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default UnifiedLayout;
