import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  LayoutDashboard, 
  RefreshCw,
  Calendar,
  Receipt,
  TrendingUp,
  TrendingDown,
  Settings,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { FACTURACION_FULL_ACCESS_ROLES } from '@/constants/accessControl';
import { useServiciosFacturacion, useClientesUnicos } from './hooks/useServiciosFacturacion';
import { useFacturacionMetrics, useMetricasPorCliente } from './hooks/useFacturacionMetrics';
import { FinanceOverview } from './components/Overview/FinanceOverview';
import { IngresosTab } from './components/IngresosTab';
import { EgresosTab } from './components/EgresosTab';
import { OperacionesTab } from './components/OperacionesTab';
import { ConfigTab } from './components/ConfigTab';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

export default function FacturacionHub() {
  const { userRole } = useAuth();
  const hasFullAccess = FACTURACION_FULL_ACCESS_ROLES.includes(userRole as any);
  
  const [fechaInicio, setFechaInicio] = useState(
    format(subDays(new Date(), 90), 'yyyy-MM-dd')
  );
  const [fechaFin, setFechaFin] = useState(
    format(new Date(), 'yyyy-MM-dd')
  );

  const { data: servicios = [], isLoading, refetch } = useServiciosFacturacion({
    fechaInicio,
    fechaFin,
  });
  
  const { data: clientes = [] } = useClientesUnicos();

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
    <div className="flex flex-col h-[calc(var(--vh-full)-3.5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between h-14 px-4 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <Receipt className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-base font-semibold leading-tight">Finance Command Center</h1>
            <p className="text-[10px] text-muted-foreground">Facturación, CxC, CxP — Tiempo Real</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)}
              className="h-7 w-[120px] text-xs border-0 bg-transparent" />
            <span className="text-muted-foreground text-xs">–</span>
            <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)}
              className="h-7 w-[120px] text-xs border-0 bg-transparent" />
          </div>
          
          <div className="flex gap-1">
            {[7, 30, 90].map(d => (
              <Button key={d} variant="ghost" size="sm" className="h-7 px-2 text-xs"
                onClick={() => handleQuickFilter(d)}>
                {d}d
              </Button>
            ))}
            <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={handleThisMonth}>
              <Calendar className="h-3 w-3 mr-1" />
              Mes
            </Button>
          </div>
          
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* 5 Tabs */}
      <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 pt-2 shrink-0">
          <TabsList className="h-9">
            <TabsTrigger value="overview" className="text-xs h-7 px-3 gap-1.5">
              <LayoutDashboard className="h-3.5 w-3.5" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="ingresos" className="text-xs h-7 px-3 gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              Ingresos
            </TabsTrigger>
            <TabsTrigger value="egresos" className="text-xs h-7 px-3 gap-1.5">
              <TrendingDown className="h-3.5 w-3.5" />
              Egresos
            </TabsTrigger>
            <TabsTrigger value="operaciones" className="text-xs h-7 px-3 gap-1.5">
              <Briefcase className="h-3.5 w-3.5" />
              Operaciones
            </TabsTrigger>
            <TabsTrigger value="config" className="text-xs h-7 px-3 gap-1.5">
              <Settings className="h-3.5 w-3.5" />
              Config
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="flex-1 overflow-auto px-4 py-3">
          <FinanceOverview servicios={servicios} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="ingresos" className="flex-1 overflow-auto px-4 py-3">
          <IngresosTab fechaInicio={fechaInicio} fechaFin={fechaFin} />
        </TabsContent>

        <TabsContent value="egresos" className="flex-1 overflow-auto px-4 py-3">
          <EgresosTab />
        </TabsContent>

        <TabsContent value="operaciones" className="flex-1 overflow-auto px-4 py-3">
          <OperacionesTab servicios={servicios} isLoading={isLoading} clientes={clientes} />
        </TabsContent>

        <TabsContent value="config" className="flex-1 overflow-auto px-4 py-3">
          <ConfigTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
