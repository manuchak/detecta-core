
import { Navigate, Outlet } from "react-router-dom";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { useLocation } from "react-router-dom";

export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to auth/login instead of /login to avoid loop
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Check if user's email is confirmed
  if (user && !user.email_confirmed_at) {
    return <Navigate to="/auth/login" replace />;
  }

  // Additional padding for the monitoring page to give more space
  const isMonitoringPage = location.pathname === "/monitoring" || location.pathname === "/supply-chain";

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className={`mx-auto w-full ${isMonitoringPage ? 'px-0' : ''}`}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
