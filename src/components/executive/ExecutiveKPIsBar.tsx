import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Users, Truck, Shield, UserCheck } from 'lucide-react';
import { useUnifiedMTDMetrics } from '@/hooks/useUnifiedMTDMetrics';

interface KPIData {
  label: string;
  value: string;
  variation: number;
  icon: React.ReactNode;
  showVariation?: boolean;
}

export const ExecutiveKPIsBar = () => {
  const {
    serviciosMTD, serviciosPrevMTD,
    gmvMTD, gmvVariacion,
    aovMTD, aovPrevMTD,
    clientesMTD, clientesPrevMTD,
    custodiosMTD, armadosMTD,
    data, loading
  } = useUnifiedMTDMetrics();

  const calcVar = (curr: number, prev: number) => prev > 0 ? ((curr - prev) / prev) * 100 : 0;

  const formatCurrency = (n: number) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(2)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return `$${n.toFixed(0)}`;
  };

  const formatInteger = (n: number) => {
    return `$${new Intl.NumberFormat('es-MX').format(Math.round(n))}`;
  };

  const custodiosPrev = data ? new Set(data.previousServices.map(s => s.nombre_custodio).filter(Boolean)).size : 0;
  const armadosPrev = data ? new Set(data.previousServices.map(s => s.nombre_armado).filter(Boolean)).size : 0;

  const kpiCards: KPIData[] = [
    { 
      label: 'Servicios', 
      value: serviciosMTD.toString(), 
      variation: calcVar(serviciosMTD, serviciosPrevMTD),
      icon: <Truck className="h-4 w-4" />
    },
    { 
      label: 'GMV MTD', 
      value: formatCurrency(gmvMTD), 
      variation: gmvVariacion,
      icon: <DollarSign className="h-4 w-4" />
    },
    { 
      label: 'AOV', 
      value: formatInteger(aovMTD), 
      variation: calcVar(aovMTD, aovPrevMTD),
      icon: <TrendingUp className="h-4 w-4" />,
      showVariation: false
    },
    { 
      label: 'Clientes', 
      value: clientesMTD.toString(), 
      variation: calcVar(clientesMTD, clientesPrevMTD),
      icon: <Users className="h-4 w-4" />
    },
    { 
      label: 'Custodios', 
      value: custodiosMTD.toString(), 
      variation: calcVar(custodiosMTD, custodiosPrev),
      icon: <UserCheck className="h-4 w-4" />
    },
    { 
      label: 'Armados', 
      value: armadosMTD.toString(), 
      variation: calcVar(armadosMTD, armadosPrev),
      icon: <Shield className="h-4 w-4" />
    },
    { 
      label: 'Clientes Mon.', 
      value: 'N/D', 
      variation: 0,
      icon: <Users className="h-4 w-4" />,
      showVariation: false
    },
    { 
      label: 'Suscr. Mon.', 
      value: 'N/D', 
      variation: 0,
      icon: <Shield className="h-4 w-4" />,
      showVariation: false
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-3 animate-pulse">
            <div className="h-4 bg-muted rounded w-16 mb-2" />
            <div className="h-6 bg-muted rounded w-20" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
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
          {kpi.showVariation !== false && (
            <div className={`flex items-center text-xs ${kpi.variation >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {kpi.variation >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              <span>{kpi.variation >= 0 ? '+' : ''}{kpi.variation.toFixed(1)}% MTD</span>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};
