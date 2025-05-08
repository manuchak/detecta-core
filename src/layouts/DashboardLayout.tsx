
import { Navigate, Outlet } from "react-router-dom";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { useState } from "react";
import { Header } from "@/components/dashboard/Header";

interface DashboardLayoutProps {
  isAuthenticated: boolean;
}

export const DashboardLayout = ({ isAuthenticated }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none p-4 md:p-6">
          <div className="mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
