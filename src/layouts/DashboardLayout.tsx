
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, loading, userRole } = useAuth();

  console.log('DashboardLayout - State:', { user: !!user, loading, userRole });

  // Show loading skeleton while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="space-y-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <Skeleton className="h-8 w-64 mx-auto" />
            <Skeleton className="h-4 w-48 mx-auto mt-2" />
            <p className="text-sm text-gray-500 mt-4">Cargando dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    console.log('DashboardLayout - Redirecting to login: no user');
    return <Navigate to="/auth/login" replace />;
  }

  // Show loading if we have user but no role yet (prevent blank screen)
  if (!userRole || userRole === 'unverified') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-500">Verificando permisos de usuario...</p>
          <p className="text-xs text-gray-400">Usuario: {user.email}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <div className="w-64 bg-white shadow-lg">
        <Sidebar />
      </div>
      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
