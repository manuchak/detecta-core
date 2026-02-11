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

  // ProtectedRoute already handles unauthenticated users,
  // but keep as safety net for direct access
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // If role doesn't match, redirect silently (no flash of "Acceso Denegado")
  if (!['custodio', 'admin', 'owner'].includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  // Wrap with OnboardingGuard for custodians
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
