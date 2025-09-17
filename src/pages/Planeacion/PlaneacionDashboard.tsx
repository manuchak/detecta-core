import { useState, Suspense, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Shield, MapPin, TrendingUp, Clock, Smartphone } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Lazy loading de componentes para optimizar carga inicial
import { 
  LazyKPIDashboard,
  LazyServiciosTab,
  LazyMatrizPreciosTab,
  LazyCustodiosTab,
  LazyClientesTab,
  LazyComodatosGPSTab,
  preloadPlaneacionData,
  cleanupPlaneacionCache,
  monitorPlaneacionPerformance
} from '@/utils/performanceOptimizations';

import PlanningHub from './PlanningHub';

export default function PlaneacionDashboard() {
  return <PlanningHub />;
}
  const [activeTab, setActiveTab] = useState('dashboard');
  const queryClient = useQueryClient();

  // Pre-cargar datos críticos y monitorear rendimiento
  useEffect(() => {
    const loadCriticalData = async () => {
      try {
        await preloadPlaneacionData(queryClient);
        
        // Monitor de rendimiento en desarrollo
        if (process.env.NODE_ENV === 'development') {
          const performance = monitorPlaneacionPerformance();
          if (performance) {
            console.log('📊 Performance Dashboard:', performance);
          }
        }
      } catch (error) {
        console.error('Error pre-cargando datos:', error);
      }
    };

    loadCriticalData();

    // Limpieza de cache cada 5 minutos
    const cleanupInterval = setInterval(() => {
      cleanupPlaneacionCache(queryClient);
    }, 5 * 60 * 1000);

    return () => clearInterval(cleanupInterval);
  }, [queryClient]);

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Planeación de Custodias</h1>
        <p className="text-muted-foreground">
          Gestiona clientes, custodios y servicios de seguridad de manera eficiente
        </p>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6 lg:w-[900px]">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="servicios" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Servicios
          </TabsTrigger>
          <TabsTrigger value="precios" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Precios
          </TabsTrigger>
          <TabsTrigger value="custodios" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Custodios
          </TabsTrigger>
          <TabsTrigger value="clientes" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="gps-comodato" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            GPS Comodato
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab - Carga inmediata */}
        <TabsContent value="dashboard" className="space-y-6 mt-6">
          <Suspense fallback={<DashboardSkeleton />}>
            <LazyKPIDashboard />
          </Suspense>
        </TabsContent>

        {/* Servicios Tab - Lazy loading */}
        <TabsContent value="servicios" className="space-y-6 mt-6">
          <Suspense fallback={<TableSkeleton />}>
            <LazyServiciosTab />
          </Suspense>
        </TabsContent>

        {/* Matriz Precios Tab - Lazy loading */}
        <TabsContent value="precios" className="space-y-6 mt-6">
          <Suspense fallback={<TableSkeleton />}>
            <LazyMatrizPreciosTab />
          </Suspense>
        </TabsContent>

        {/* Custodios Tab - Lazy loading */}
        <TabsContent value="custodios" className="space-y-6 mt-6">
          <Suspense fallback={<TableSkeleton />}>
            <LazyCustodiosTab />
          </Suspense>
        </TabsContent>

        {/* Clientes Tab - Lazy loading */}
        <TabsContent value="clientes" className="space-y-6 mt-6">
          <Suspense fallback={<TableSkeleton />}>
            <LazyClientesTab />
          </Suspense>
        </TabsContent>

        {/* GPS Comodato Tab - Lazy loading */}
        <TabsContent value="gps-comodato" className="space-y-6 mt-6">
          <Suspense fallback={<TableSkeleton />}>
            <LazyComodatosGPSTab />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Componentes de skeleton para loading states optimizados
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="p-6 bg-card rounded-lg border space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="p-6 bg-card rounded-lg border space-y-4">
          <Skeleton className="h-6 w-40" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="p-6 bg-card rounded-lg border space-y-4">
          <Skeleton className="h-6 w-40" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex justify-between py-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4 bg-card rounded-lg border">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-12" />
          </div>
        ))}
      </div>
      
      <div className="bg-card rounded-lg border">
        <div className="p-4 border-b">
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="p-4 space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}