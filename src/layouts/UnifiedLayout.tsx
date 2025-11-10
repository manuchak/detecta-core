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
  const { user, loading, userRole } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    console.log('🎨 UnifiedLayout state:', { 
      loading, 
      isInitializing, 
      hasUser: !!user, 
      userRole,
      userEmail: user?.email 
    });

    // Safety timeout - force initialization to complete after 8 seconds
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ UnifiedLayout: Safety timeout reached, forcing initialization complete');
      setIsInitializing(false);
    }, 8000);

    // Complete initialization as soon as AuthContext finishes loading
    if (!loading) {
      console.log('✅ UnifiedLayout: Auth loading complete, ending initialization');
      setIsInitializing(false);
      clearTimeout(timeoutId);
    }

    return () => clearTimeout(timeoutId);
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

  // Only block if userRole is explicitly null (not loaded yet)
  // Allow 'unverified' and other roles to pass through
  if (userRole === null) {
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

  return (
    <div className="min-h-screen bg-background">
      <SimplifiedTopBar />
      
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
