
import { Navigate, Outlet } from "react-router-dom";

interface AuthLayoutProps {
  isAuthenticated: boolean;
}

export const AuthLayout = ({ isAuthenticated }: AuthLayoutProps) => {
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary">Lead Flow Navigator CRM</h1>
          <p className="text-muted-foreground">Manage your leads and services with ease</p>
        </div>
        <div className="bg-card p-6 rounded-lg shadow-sm border">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
