import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SimplifiedTopBar } from '@/components/navigation/SimplifiedTopBar';
import { UnifiedSidebar } from '@/components/navigation/UnifiedSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

interface UnifiedLayoutProps {
  children: React.ReactNode;
  sidebarStats?: {
    criticalAlerts?: number;
    urgentClusters?: number;
    totalDeficit?: number;
    activeCandidates?: number;
  };
}

const UnifiedLayout: React.FC<UnifiedLayoutProps> = ({ 
  children, 
  sidebarStats 
}) => {
  const { user, loading, roleLoading } = useAuth();

  // Show loading skeleton while checking authentication (session only)
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <Skeleton className="h-8 w-64 mx-auto" />
            <Skeleton className="h-4 w-48 mx-auto mt-2" />
            <p className="text-sm text-muted-foreground mt-4">Verificando sesión...</p>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Show role loading banner (non-blocking)
  const roleLoadingBanner = roleLoading && (
    <div className="bg-muted/50 border-b border-border px-4 py-2 text-center">
      <p className="text-xs text-muted-foreground">
        <span className="inline-block animate-pulse mr-2">●</span>
        Verificando permisos...
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <SimplifiedTopBar />
      {roleLoadingBanner}
      
      <SidebarProvider defaultOpen={true}>
        <div className="flex w-full min-h-[calc(100vh-3rem)]">
          <UnifiedSidebar stats={sidebarStats} />
          
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default UnifiedLayout;
