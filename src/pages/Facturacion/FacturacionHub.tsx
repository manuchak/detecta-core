import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  FileText, 
  RefreshCw,
  Calendar,
  Receipt,
  Wallet,
  Users,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { FACTURACION_FULL_ACCESS_ROLES } from '@/constants/accessControl';
import { useServiciosFacturacion, useClientesUnicos } from './hooks/useServiciosFacturacion';
import { useFacturacionMetrics, useMetricasPorCliente } from './hooks/useFacturacionMetrics';
import { FacturacionDashboard } from './components/FacturacionDashboard';
import { ServiciosConsulta } from './components/ServiciosConsulta';
import { CuentasPorCobrarTab } from './components/CuentasPorCobrar/CuentasPorCobrarTab';
import { GestionClientesTab } from './components/GestionClientes/GestionClientesTab';
import { FacturasComingSoon } from './components/Facturas/FacturasComingSoon';
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
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Header compacto con filtros inline */}
      <div className="flex items-center justify-between h-14 px-4 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <Receipt className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-base font-semibold leading-tight">Facturación y Cobranza</h1>
            <p className="text-[10px] text-muted-foreground">Gestión financiera y cuentas por cobrar</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Filtros de fecha inline */}
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            <Input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="h-7 w-[120px] text-xs border-0 bg-transparent"
            />
            <span className="text-muted-foreground text-xs">–</span>
            <Input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="h-7 w-[120px] text-xs border-0 bg-transparent"
            />
          </div>
          
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => handleQuickFilter(7)}
            >
              7d
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => handleQuickFilter(30)}
            >
              30d
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleThisMonth}
            >
              <Calendar className="h-3 w-3 mr-1" />
              Mes
            </Button>
          </div>
          
          <Button 
            variant="outline" 
            size="icon" 
            className="h-7 w-7"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Tabs y contenido */}
      <Tabs defaultValue="dashboard" className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 pt-2 shrink-0">
          <TabsList className="h-9">
            <TabsTrigger value="dashboard" className="text-xs h-7 px-3">
              <LayoutDashboard className="h-3.5 w-3.5 mr-1.5" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="servicios" data-value="servicios" className="text-xs h-7 px-3">
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              Servicios
            </TabsTrigger>
            <TabsTrigger value="cxc" className="text-xs h-7 px-3">
              <Wallet className="h-3.5 w-3.5 mr-1.5" />
              Cuentas x Cobrar
            </TabsTrigger>
            <TabsTrigger value="clientes" className="text-xs h-7 px-3">
              <Users className="h-3.5 w-3.5 mr-1.5" />
              Clientes
            </TabsTrigger>
            <TabsTrigger value="facturas" className="text-xs h-7 px-3 gap-1.5">
              <Receipt className="h-3.5 w-3.5" />
              Facturas
              <Badge className="bg-gradient-to-r from-violet-500 to-purple-500 text-white border-0 text-[9px] px-1.5 py-0 h-4">
                <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                Próximo
              </Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="dashboard" className="flex-1 overflow-auto px-4 py-3">
          <FacturacionDashboard 
            metrics={metrics}
            metricasPorCliente={metricasPorCliente}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="servicios" className="flex-1 overflow-auto px-4 py-3">
          <ServiciosConsulta 
            servicios={servicios}
            isLoading={isLoading}
            clientes={clientes}
          />
        </TabsContent>

        <TabsContent value="cxc" className="flex-1 overflow-auto px-4 py-3">
          <CuentasPorCobrarTab />
        </TabsContent>

        <TabsContent value="clientes" className="flex-1 overflow-auto px-4 py-3">
          <GestionClientesTab />
        </TabsContent>

        <TabsContent value="facturas" className="flex-1 overflow-auto px-4 py-3">
          <FacturasComingSoon />
        </TabsContent>
      </Tabs>
    </div>
  );
}
