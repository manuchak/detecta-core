
import React, { useState, useEffect } from 'react';
import { useAuth, useToast } from '@/hooks';
import { Navigate, Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TestimonialsManager } from '@/components/admin/landing/TestimonialsManager';
import { HeroManager } from '@/components/admin/landing/HeroManager';
import { BenefitsManager } from '@/components/admin/landing/BenefitsManager';
import { PricesManager } from '@/components/admin/landing/PricesManager';

const LandingManager = () => {
  // Always call all hooks at the top level
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('testimonios');
  const [hasAccess, setHasAccess] = useState(true); // Default to true to prevent immediate redirect
  const [shouldRedirect, setShouldRedirect] = useState(false);
  
  // Check access permissions in useEffect
  useEffect(() => {
    const checkAccess = () => {
      const hasPermission = !!user && (userRole === 'admin' || userRole === 'owner' || userRole === 'bi' || userRole === 'supply_admin');
      
      setHasAccess(hasPermission);
      
      if (!hasPermission) {
        toast({
          title: "Acceso denegado",
          description: "No tienes permisos para acceder a esta página. Tu rol actual es: " + (userRole || "sin rol"),
          variant: "destructive",
        });
        setShouldRedirect(true);
      }
    };
    
    // Check access when user or userRole changes
    checkAccess();
  }, [user, userRole, toast]);

  // Move redirect logic here to ensure all hooks are always called
  if (shouldRedirect) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Administrador de Landing Page</h1>
        <Link to="/" className="text-sm text-primary hover:underline">
          Ver Landing Page
        </Link>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="testimonios">Testimonios</TabsTrigger>
          <TabsTrigger value="hero">Sección Hero</TabsTrigger>
          <TabsTrigger value="beneficios">Beneficios</TabsTrigger>
          <TabsTrigger value="precios">Precios</TabsTrigger>
        </TabsList>
        
        <TabsContent value="testimonios" className="space-y-6">
          <TestimonialsManager />
        </TabsContent>
        
        <TabsContent value="hero">
          <HeroManager />
        </TabsContent>
        
        <TabsContent value="beneficios">
          <BenefitsManager />
        </TabsContent>
        
        <TabsContent value="precios">
          <PricesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LandingManager;
