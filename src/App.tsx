
import React, { useEffect, useState } from 'react';
import { Routes, Route, BrowserRouter, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

import Landing from "./pages/Landing/Landing";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import EmailConfirmation from "./pages/Auth/EmailConfirmation";
import Dashboard from "./pages/Dashboard/Dashboard";
import MonitoringPage from "./pages/Monitoring/MonitoringPage";
import SupplyChainMonitoring from "./pages/Monitoring/SupplyChainMonitoring";
import ForensicAuditPage from "./pages/Monitoring/ForensicAuditPage";
import Settings from "./pages/Settings/Settings";
import LeadsList from "./pages/Leads/LeadsList";
import TicketsList from "./pages/Tickets/TicketsList";
import LandingManager from "./pages/Admin/LandingManager";
import AssignRole from "./pages/Admin/AssignRole";
import AssignOwnerRole from "./pages/Admin/AssignOwnerRole";
import InstallerPortal from "./pages/Installers/InstallerPortal";
import NotFound from "./pages/NotFound";
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import { supabase } from './integrations/supabase/client';
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

import LeadApprovals from "./pages/Leads/LeadApprovals";

// Create a QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const { toast } = useToast()

  useEffect(() => {
    // Set loading to true on mount
    setLoading(true);

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
      })
      .catch(error => {
        console.error("Error getting session:", error);
        toast({
          title: "Error",
          description: "Failed to retrieve session.",
          variant: "destructive",
        })
      })
      .finally(() => {
        setLoading(false); // Set loading to false once the session is loaded or an error occurs
      });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  // Conditionally render a loading indicator
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Skeleton className="w-[300px] h-[40px]" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <BrowserRouter>
          <Routes>
            {/* Landing page route */}
            <Route path="/" element={<Landing />} />
            
            {/* Auth routes */}
            <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />
            <Route path="/register" element={<AuthLayout><Register /></AuthLayout>} />
            <Route path="/forgot-password" element={<AuthLayout><ForgotPassword /></AuthLayout>} />
            <Route path="/confirm-email" element={<AuthLayout><EmailConfirmation /></AuthLayout>} />
            
            {/* Dashboard routes */}
            <Route path="/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
            <Route path="/monitoring" element={<DashboardLayout><MonitoringPage /></DashboardLayout>} />
            <Route path="/monitoring/supply-chain" element={<DashboardLayout><SupplyChainMonitoring /></DashboardLayout>} />
            <Route path="/monitoring/forensic-audit" element={<DashboardLayout><ForensicAuditPage /></DashboardLayout>} />
            <Route path="/settings" element={<DashboardLayout><Settings /></DashboardLayout>} />
            <Route path="/leads" element={<DashboardLayout><LeadsList /></DashboardLayout>} />
            <Route path="/leads/approval" element={<DashboardLayout><LeadApprovals /></DashboardLayout>} />
            <Route path="/tickets" element={<DashboardLayout><TicketsList /></DashboardLayout>} />
            <Route path="/admin/landing" element={<DashboardLayout><LandingManager /></DashboardLayout>} />
            <Route path="/admin/assign-role" element={<DashboardLayout><AssignRole /></DashboardLayout>} />
            <Route path="/admin/assign-owner" element={<DashboardLayout><AssignOwnerRole /></DashboardLayout>} />
            <Route path="/installers" element={<DashboardLayout><InstallerPortal /></DashboardLayout>} />
            
            {/* Catch all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
