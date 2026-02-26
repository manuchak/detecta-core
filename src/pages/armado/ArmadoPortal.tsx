import { Navigate, Outlet } from "react-router-dom";
import { useStableAuth } from "@/hooks/useStableAuth";

const ArmadoPortal = () => {
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

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (!['armado', 'admin', 'owner'].includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ArmadoPortal;
