import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Users, Truck, Shield, UserCheck } from 'lucide-react';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

interface KPIData {
  label: string;
  value: string;
  variation: number;
  icon: React.ReactNode;
}

export const ExecutiveKPIsBar = () => {
  const { data: kpis, isLoading } = useQuery({
    queryKey: ['executive-kpis-bar'],
    queryFn: async () => {
      const now = new Date();
      const currentStart = startOfMonth(now);
      const currentEnd = endOfMonth(now);
      const prevStart = startOfMonth(subMonths(now, 1));
      const prevEnd = endOfMonth(subMonths(now, 1));

      // Current month services
      const { data: currentServices } = await supabase
        .from('servicios_custodia')
        .select('id, cobro_cliente, custodio_nombre, armado_asignado, nombre_cliente')
        .gte('fecha_servicio', format(currentStart, 'yyyy-MM-dd'))
        .lte('fecha_servicio', format(currentEnd, 'yyyy-MM-dd'))
        .not('estado', 'eq', 'cancelado');

      // Previous month services
      const { data: prevServices } = await supabase
        .from('servicios_custodia')
        .select('id, cobro_cliente, custodio_nombre, armado_asignado, nombre_cliente')
        .gte('fecha_servicio', format(prevStart, 'yyyy-MM-dd'))
        .lte('fecha_servicio', format(prevEnd, 'yyyy-MM-dd'))
        .not('estado', 'eq', 'cancelado');

      const current = currentServices || [];
      const prev = prevServices || [];

      // Calculate metrics
      const serviciosCurrent = current.length;
      const serviciosPrev = prev.length;
      
      const gmvCurrent = current.reduce((sum, s) => sum + parseFloat(String(s.cobro_cliente || 0)), 0);
      const gmvPrev = prev.reduce((sum, s) => sum + parseFloat(String(s.cobro_cliente || 0)), 0);
      
      const aovCurrent = serviciosCurrent > 0 ? gmvCurrent / serviciosCurrent : 0;
      const aovPrev = serviciosPrev > 0 ? gmvPrev / serviciosPrev : 0;
      
      const clientesCurrent = new Set(current.map(s => s.nombre_cliente).filter(Boolean)).size;
      const clientesPrev = new Set(prev.map(s => s.nombre_cliente).filter(Boolean)).size;
      
      const custodiosCurrent = new Set(current.map(s => s.custodio_nombre).filter(Boolean)).size;
      const custodiosPrev = new Set(prev.map(s => s.custodio_nombre).filter(Boolean)).size;
      
      const armadosCurrent = new Set(current.map(s => s.armado_asignado).filter(Boolean)).size;
      const armadosPrev = new Set(prev.map(s => s.armado_asignado).filter(Boolean)).size;

      const calcVar = (curr: number, prev: number) => prev > 0 ? ((curr - prev) / prev) * 100 : 0;

      return {
        servicios: { value: serviciosCurrent, var: calcVar(serviciosCurrent, serviciosPrev) },
        gmv: { value: gmvCurrent, var: calcVar(gmvCurrent, gmvPrev) },
        aov: { value: aovCurrent, var: calcVar(aovCurrent, aovPrev) },
        clientes: { value: clientesCurrent, var: calcVar(clientesCurrent, clientesPrev) },
        custodios: { value: custodiosCurrent, var: calcVar(custodiosCurrent, custodiosPrev) },
        armados: { value: armadosCurrent, var: calcVar(armadosCurrent, armadosPrev) },
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  const formatCurrency = (n: number) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(2)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return `$${n.toFixed(0)}`;
  };

  const kpiCards: KPIData[] = [
    { 
      label: 'Servicios', 
      value: kpis?.servicios.value.toString() || '0', 
      variation: kpis?.servicios.var || 0,
      icon: <Truck className="h-4 w-4" />
    },
    { 
      label: 'GMV MTD', 
      value: formatCurrency(kpis?.gmv.value || 0), 
      variation: kpis?.gmv.var || 0,
      icon: <DollarSign className="h-4 w-4" />
    },
    { 
      label: 'AOV', 
      value: formatCurrency(kpis?.aov.value || 0), 
      variation: kpis?.aov.var || 0,
      icon: <TrendingUp className="h-4 w-4" />
    },
    { 
      label: 'Clientes', 
      value: kpis?.clientes.value.toString() || '0', 
      variation: kpis?.clientes.var || 0,
      icon: <Users className="h-4 w-4" />
    },
    { 
      label: 'Custodios', 
      value: kpis?.custodios.value.toString() || '0', 
      variation: kpis?.custodios.var || 0,
      icon: <UserCheck className="h-4 w-4" />
    },
    { 
      label: 'Armados', 
      value: kpis?.armados.value.toString() || '0', 
      variation: kpis?.armados.var || 0,
      icon: <Shield className="h-4 w-4" />
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-16 mb-2" />
            <div className="h-6 bg-muted rounded w-20" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpiCards.map((kpi, idx) => (
        <Card key={idx} className="p-4 bg-card border-border/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              {kpi.label}
            </span>
            <span className="text-muted-foreground">{kpi.icon}</span>
          </div>
          <div className="text-xl font-semibold text-foreground mb-1">
            {kpi.value}
          </div>
          <div className={`flex items-center text-xs ${kpi.variation >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {kpi.variation >= 0 ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1" />
            )}
            <span>{kpi.variation >= 0 ? '+' : ''}{kpi.variation.toFixed(1)}% MoM</span>
          </div>
        </Card>
      ))}
    </div>
  );
};
