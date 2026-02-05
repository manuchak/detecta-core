// @ts-nocheck
import { Navigate, Outlet } from "react-router-dom";
import { useStableAuth } from "@/hooks/useStableAuth";
import { OnboardingGuard } from "@/components/custodian/OnboardingGuard";

const CustodianPortal = () => {
  const { user, userRole, loading } = useStableAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Check if user has custodio role or is admin
  if (!['custodio', 'admin', 'owner'].includes(userRole)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-destructive/10 text-destructive rounded-lg p-4 mb-4">
            <h2 className="text-lg font-semibold mb-2">Acceso Denegado</h2>
            <p className="text-sm">
              No tienes permisos para acceder al portal de custodios. 
              Contacta al administrador si crees que esto es un error.
            </p>
          </div>
          <Navigate to="/" replace />
        </div>
      </div>
    );
  }

  // Wrap with OnboardingGuard to ensure custodian has completed document registration
  // Admin/Owner bypass the guard (they don't need documents)
  if (userRole === 'custodio') {
    return (
      <OnboardingGuard>
        <Outlet />
      </OnboardingGuard>
    );
  }

  return <Outlet />;
};

export default CustodianPortal;