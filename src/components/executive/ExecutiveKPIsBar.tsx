import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Users, Truck, Shield, UserCheck, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { useUnifiedMTDMetrics } from '@/hooks/useUnifiedMTDMetrics';
import { useIsMobile } from '@/hooks/use-mobile';

interface KPIData {
  label: string;
  value: string;
  variation: number;
  icon: React.ReactNode;
  showVariation?: boolean;
  priority: boolean; // top 4 shown on mobile
}

export const ExecutiveKPIsBar = () => {
  const {
    serviciosMTD, serviciosPrevMTD,
    gmvMTD, gmvVariacion,
    aovMTD,
    clientesMTD,
    custodiosMTD,
    armadosInternosMTD,
    serviciosProveedorExternoMTD,
    data, loading
  } = useUnifiedMTDMetrics();

  const isMobile = useIsMobile();
  const [showMore, setShowMore] = useState(false);

  const calcVar = (curr: number, prev: number) => prev > 0 ? ((curr - prev) / prev) * 100 : 0;

  const formatCurrency = (n: number) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(2)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return `$${n.toFixed(0)}`;
  };

  const formatInteger = (n: number) => {
    return `$${new Intl.NumberFormat('es-MX').format(Math.round(n))}`;
  };

  const custodiosPrev = data ? (() => {
    const ids = new Set<string>();
    data.previousServices.forEach(s => {
      if ((s as any).id_custodio) ids.add((s as any).id_custodio);
      else if (s.nombre_custodio) ids.add(s.nombre_custodio.trim().toLowerCase());
    });
    return ids.size;
  })() : 0;

  const aovPrevMTD = data && data.serviciosPrevMTD > 0 ? data.gmvPrevMTD / data.serviciosPrevMTD : 0;
  const clientesPrevMTD = data?.clientesPrevMTD ?? 0;

  const kpiCards: KPIData[] = [
    { label: 'Servicios', value: serviciosMTD.toString(), variation: calcVar(serviciosMTD, serviciosPrevMTD), icon: <Truck className="h-4 w-4" />, priority: true },
    { label: 'GMV MTD', value: formatCurrency(gmvMTD), variation: gmvVariacion, icon: <DollarSign className="h-4 w-4" />, priority: true },
    { label: 'AOV', value: formatInteger(aovMTD), variation: calcVar(aovMTD, aovPrevMTD), icon: <TrendingUp className="h-4 w-4" />, showVariation: false, priority: true },
    { label: 'Clientes', value: clientesMTD.toString(), variation: calcVar(clientesMTD, clientesPrevMTD), icon: <Users className="h-4 w-4" />, priority: true },
    { label: 'Custodios', value: custodiosMTD.toString(), variation: calcVar(custodiosMTD, custodiosPrev), icon: <UserCheck className="h-4 w-4" />, priority: false },
    { label: 'Armados Int.', value: armadosInternosMTD.toString(), variation: 0, icon: <Shield className="h-4 w-4" />, showVariation: false, priority: false },
    { label: 'Svcs. Prov. Ext.', value: serviciosProveedorExternoMTD.toString(), variation: 0, icon: <Building2 className="h-4 w-4" />, showVariation: false, priority: false },
    { label: 'Clientes Mon.', value: 'N/D', variation: 0, icon: <Users className="h-4 w-4" />, showVariation: false, priority: false },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {[...Array(isMobile ? 4 : 6)].map((_, i) => (
          <Card key={i} className="p-3 animate-pulse">
            <div className="h-4 bg-muted rounded w-16 mb-2" />
            <div className="h-6 bg-muted rounded w-20" />
          </Card>
        ))}
      </div>
    );
  }

  const priorityKpis = kpiCards.filter(k => k.priority);
  const secondaryKpis = kpiCards.filter(k => !k.priority);

  const renderKpiCard = (kpi: KPIData, idx: number) => (
    <Card key={idx} className="p-3 md:p-4 bg-card border-border/50">
      <div className="flex items-center justify-between mb-1.5 md:mb-2">
        <span className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wide">
          {kpi.label}
        </span>
        <span className="text-muted-foreground">{kpi.icon}</span>
      </div>
      <div className="text-lg md:text-xl font-semibold text-foreground mb-0.5 md:mb-1">
        {kpi.value}
      </div>
      {kpi.showVariation !== false && (
        <div className={`flex items-center text-[10px] md:text-xs ${kpi.variation >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
          {kpi.variation >= 0 ? (
            <TrendingUp className="h-3 w-3 mr-1" />
          ) : (
            <TrendingDown className="h-3 w-3 mr-1" />
          )}
          <span>{kpi.variation >= 0 ? '+' : ''}{kpi.variation.toFixed(1)}%</span>
        </div>
      )}
    </Card>
  );

  if (isMobile) {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          {priorityKpis.map((kpi, idx) => renderKpiCard(kpi, idx))}
        </div>
        {showMore && (
          <div className="grid grid-cols-2 gap-2">
            {secondaryKpis.map((kpi, idx) => renderKpiCard(kpi, idx + 4))}
          </div>
        )}
        <button
          onClick={() => setShowMore(!showMore)}
          className="w-full flex items-center justify-center gap-1 text-xs text-muted-foreground py-2 min-h-[44px] hover:text-foreground transition-colors"
        >
          {showMore ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {showMore ? 'Ver menos' : `Ver ${secondaryKpis.length} más`}
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
      {kpiCards.map((kpi, idx) => renderKpiCard(kpi, idx))}
    </div>
  );
};
