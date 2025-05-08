
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { createContext, useContext, useState } from "react";

// Layouts
import AuthLayout from "./layouts/AuthLayout";
import DashboardLayout from "./layouts/DashboardLayout";

// Auth Pages
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import ForgotPassword from "./pages/Auth/ForgotPassword";

// Dashboard Pages
import Dashboard from "./pages/Dashboard/Dashboard";
import LeadsList from "./pages/Leads/LeadsList";
import InstallerPortal from "./pages/Installers/InstallerPortal";
import TicketsList from "./pages/Tickets/TicketsList";
import NotFound from "./pages/NotFound";

// Create auth context
interface AuthContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

// Auth provider
const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // For now we're using local state, later this will use Supabase
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const login = () => {
    setIsAuthenticated(true);
  };
  
  const logout = () => {
    setIsAuthenticated(false);
  };
  
  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Query client for React Query
const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Redirect root to dashboard or login */}
              <Route path="/" element={<Navigate to="/dashboard" />} />
              
              {/* Auth Routes */}
              <Route element={<AuthLayout isAuthenticated={false} />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
              </Route>
              
              {/* Dashboard Routes */}
              <Route element={<DashboardLayout isAuthenticated={true} />}>
                <Route path="/dashboard" element={<Dashboard />} />
                
                {/* Lead Management */}
                <Route path="/leads" element={<LeadsList />} />
                <Route path="/leads/approval" element={<LeadsList />} />
                <Route path="/leads/new" element={<div>Crear Lead Form</div>} />
                
                {/* Services */}
                <Route path="/services" element={<div>Lista de Servicios</div>} />
                <Route path="/services/performance" element={<div>Rendimiento de Servicios</div>} />
                
                {/* Installations */}
                <Route path="/installations" element={<div>Instalaciones GPS</div>} />
                <Route path="/installations/installers" element={<InstallerPortal />} />
                
                {/* Monitoring */}
                <Route path="/monitoring" element={<div>Monitoreo en vivo</div>} />
                
                {/* Tickets */}
                <Route path="/tickets" element={<TicketsList />} />
                <Route path="/tickets/new" element={<div>Crear Ticket Form</div>} />
                
                {/* Settings */}
                <Route path="/settings" element={<div>Configuración</div>} />
              </Route>
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
