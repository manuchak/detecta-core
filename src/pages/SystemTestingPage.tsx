// @ts-nocheck
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SystemTestingPanel from '@/components/testing/SystemTestingPanel';
import PermissionValidator from '@/components/testing/PermissionValidator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { systemMonitoring } from '@/utils/systemMonitoring';
import { useToast } from '@/components/ui/use-toast';

const SystemTestingPage: React.FC = () => {
  const { userRole } = useAuth();
  const { toast } = useToast();

  // Solo permitir acceso a admins
  if (userRole !== 'admin' && userRole !== 'owner') {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Acceso Denegado</CardTitle>
            <CardDescription>
              Esta página solo está disponible para administradores.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const handleDownloadLogs = () => {
    try {
      const logsData = systemMonitoring.exportLogs();
      const blob = new Blob([logsData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `system-logs-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Logs Exportados",
        description: "Los logs del sistema han sido descargados exitosamente."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron exportar los logs.",
        variant: "destructive"
      });
    }
  };

  const handleRefreshMetrics = async () => {
    try {
      await systemMonitoring.updateSystemMetrics();
      toast({
        title: "Métricas Actualizadas",
        description: "Las métricas del sistema han sido actualizadas."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron actualizar las métricas.",
        variant: "destructive"
      });
    }
  };

  const metrics = systemMonitoring.getMetrics();
  const errorSummary = systemMonitoring.getErrorSummary();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sistema de Testing</h1>
          <p className="text-gray-600 mt-1">
            Panel de validación y monitoreo del sistema de autenticación
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefreshMetrics} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button onClick={handleDownloadLogs} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar Logs
          </Button>
        </div>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Errores de Auth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.authErrors}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Permisos Denegados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.permissionDenials}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Fallos RPC</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.rpcFailures}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Roles activos */}
      {metrics.activeRoles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Roles Activos</CardTitle>
            <CardDescription>
              Roles actualmente asignados en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {metrics.activeRoles.map(role => (
                <Badge key={role} variant="outline" className="capitalize">
                  {role}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumen de errores */}
      {errorSummary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumen de Errores</CardTitle>
            <CardDescription>
              Conteo de errores por categoría
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {errorSummary.map(({ category, count }) => (
                <div key={category} className="flex justify-between items-center">
                  <span className="capitalize">{category}</span>
                  <Badge variant="destructive">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs de testing */}
      <Tabs defaultValue="system-tests" className="w-full">
        <TabsList>
          <TabsTrigger value="system-tests">Tests del Sistema</TabsTrigger>
          <TabsTrigger value="permissions">Validador de Permisos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="system-tests" className="space-y-4">
          <SystemTestingPanel isAdminOnly={false} />
        </TabsContent>
        
        <TabsContent value="permissions" className="space-y-4">
          <PermissionValidator />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemTestingPage;