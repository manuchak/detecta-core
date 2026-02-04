import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  LayoutDashboard, 
  FileText, 
  RefreshCw,
  Calendar,
  Receipt
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { FACTURACION_FULL_ACCESS_ROLES } from '@/constants/accessControl';
import { useServiciosFacturacion, useClientesUnicos } from './hooks/useServiciosFacturacion';
import { useFacturacionMetrics, useMetricasPorCliente } from './hooks/useFacturacionMetrics';
import { FacturacionDashboard } from './components/FacturacionDashboard';
import { ServiciosConsulta } from './components/ServiciosConsulta';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

export default function FacturacionHub() {
  const { userRole } = useAuth();
  const hasFullAccess = FACTURACION_FULL_ACCESS_ROLES.includes(userRole as any);
  
  // Filtro de fechas - por defecto último mes
  const [fechaInicio, setFechaInicio] = useState(
    format(startOfMonth(new Date()), 'yyyy-MM-dd')
  );
  const [fechaFin, setFechaFin] = useState(
    format(endOfMonth(new Date()), 'yyyy-MM-dd')
  );

  const { data: servicios = [], isLoading, refetch } = useServiciosFacturacion({
    fechaInicio,
    fechaFin,
  });
  
  const { data: clientes = [] } = useClientesUnicos();
  const metrics = useFacturacionMetrics(servicios);
  const metricasPorCliente = useMetricasPorCliente(servicios);

  const handleQuickFilter = (days: number) => {
    const end = new Date();
    const start = subDays(end, days);
    setFechaInicio(format(start, 'yyyy-MM-dd'));
    setFechaFin(format(end, 'yyyy-MM-dd'));
  };

  const handleThisMonth = () => {
    const now = new Date();
    setFechaInicio(format(startOfMonth(now), 'yyyy-MM-dd'));
    setFechaFin(format(endOfMonth(now), 'yyyy-MM-dd'));
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="h-6 w-6 text-primary" />
            Facturación y Finanzas
          </h1>
          <p className="text-muted-foreground">
            Consulta de servicios y métricas financieras
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Filtros de fecha */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Fecha Inicio</Label>
              <Input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-[160px]"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fecha Fin</Label>
              <Input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-[160px]"
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleQuickFilter(7)}
              >
                Últimos 7 días
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleQuickFilter(30)}
              >
                Últimos 30 días
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleThisMonth}
              >
                <Calendar className="h-4 w-4 mr-1" />
                Este mes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="servicios" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Servicios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <FacturacionDashboard 
            metrics={metrics}
            metricasPorCliente={metricasPorCliente}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="servicios">
          <ServiciosConsulta 
            servicios={servicios}
            isLoading={isLoading}
            clientes={clientes}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
