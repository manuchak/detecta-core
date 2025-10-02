import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AppShell } from '@/components/layout/AppShell';
import { MinimalCard } from '@/components/recruitment/ui/MinimalCard';
import { MinimalGrid } from '@/components/recruitment/ui/MinimalGrid';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Users, 
  Phone, 
  Target, 
  TrendingUp,
  RefreshCw,
  BarChart3,
  Award,
  MessageSquare,
  Calendar
} from 'lucide-react';
import { AnalystPerformanceDashboard } from '@/components/recruitment/specialist/AnalystPerformanceDashboard';
import { ContactabilityDashboard } from '@/components/recruitment/specialist/ContactabilityDashboard';
import { LeadsPipelineManager } from '@/components/recruitment/specialist/LeadsPipelineManager';
import { QualityMetricsDashboard } from '@/components/recruitment/specialist/QualityMetricsDashboard';
import { useCallCenterMetrics } from '@/hooks/useCallCenterMetrics';
import { useLeadsStable } from '@/hooks/useLeadsStable';

type DateFilterMode = '7days' | '30days' | 'custom';

const RecruitmentStrategy = () => {
  const [activeSection, setActiveSection] = useState('analistas');
  const [dateFilterMode, setDateFilterMode] = useState<DateFilterMode>('30days');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  
  console.log('🎯 RecruitmentStrategy - activeSection:', activeSection);
  console.log('🔥 FORCE REFRESH - Component version 2.0');
  
  // Helper function to calculate date range based on mode
  const getDateRangeForMode = (mode: DateFilterMode): { from: string; to: string } => {
    const today = new Date();
    const to = today.toISOString().split('T')[0];
    
    if (mode === '7days') {
      const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      return { from, to };
    } else if (mode === '30days') {
      const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      return { from, to };
    } else {
      // custom mode - use dateRange state
      if (dateRange?.from) {
        const from = dateRange.from.toISOString().split('T')[0];
        const customTo = dateRange.to ? dateRange.to.toISOString().split('T')[0] : from;
        return { from, to: customTo };
      }
      // Fallback to 30 days if custom range not set
      const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      return { from, to };
    }
  };

  const { from: dateFrom, to: dateTo } = getDateRangeForMode(dateFilterMode);
  
  // Hooks especializados para reclutamiento
  const { metrics: callCenterMetrics, isLoading: metricsLoading, refetch: refetchMetrics } = useCallCenterMetrics({
    dateFrom,
    dateTo,
    enabled: true
  });
  
  const { leads, isLoading: leadsLoading, refetch: refetchLeads } = useLeadsStable(dateFrom, dateTo);
  
  const handleDateFilterChange = (mode: DateFilterMode) => {
    setDateFilterMode(mode);
    if (mode !== 'custom') {
      setDateRange(undefined);
    }
  };

  const handleCustomDateChange = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from) {
      setDateFilterMode('custom');
    }
  };

  // Format date range for display
  const getDateRangeDisplay = () => {
    if (dateFilterMode === '7days') return 'Últimos 7 días';
    if (dateFilterMode === '30days') return 'Últimos 30 días';
    if (dateRange?.from) {
      const fromStr = format(dateRange.from, 'dd MMM', { locale: es });
      const toStr = dateRange.to ? format(dateRange.to, 'dd MMM yyyy', { locale: es }) : fromStr;
      return `${fromStr} - ${toStr}`;
    }
    return 'Personalizado';
  };

  // Estados calculados para métricas de reclutamiento
  const loading = metricsLoading || leadsLoading;
  
  // Calcular estadísticas del pipeline
  const pipelineStats = React.useMemo(() => {
    if (!leads.length) return { total: 0, leads: 0, contacted: 0, interview: 0, approved: 0 };
    
    return {
      total: leads.length,
      leads: leads.filter(l => l.estado === 'nuevo').length,
      contacted: leads.filter(l => l.estado === 'contactado').length,
      interview: leads.filter(l => l.estado === 'en_revision').length,
      approved: leads.filter(l => l.estado === 'aprobado').length
    };
  }, [leads]);
  
  // Calcular tasa de conversión general
  const conversionRate = React.useMemo(() => {
    return pipelineStats.total > 0 
      ? Math.round((pipelineStats.approved / pipelineStats.total) * 100)
      : 0;
  }, [pipelineStats]);

  const handleRefreshData = () => {
    try {
      // Refrescar datos específicos de reclutamiento
      refetchMetrics();
      refetchLeads();
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  // Get section metadata for specialized recruitment dashboard
  const getSectionInfo = () => {
    switch (activeSection) {
      case 'analistas':
        return {
          title: 'Performance de Analistas',
          description: 'Dashboard individual de cada analista: leads, conversión, contactabilidad',
          icon: Users,
          breadcrumbs: ['Reclutamiento', 'Analistas']
        };
      case 'contactabilidad':
        return {
          title: 'Contactabilidad y Call Center',
          description: 'Métricas de contacto, mejores horarios y análisis de llamadas',
          icon: Phone,
          breadcrumbs: ['Reclutamiento', 'Contactabilidad']
        };
      case 'pipeline':
        return {
          title: 'Pipeline de Candidatos',
          description: 'Funnel de conversión, seguimiento y gestión de leads',
          icon: Target,
          breadcrumbs: ['Reclutamiento', 'Pipeline']
        };
      case 'calidad':
        return {
          title: 'Análisis de Calidad',
          description: 'Calidad por fuente, tiempo de conversión y retención',
          icon: Award,
          breadcrumbs: ['Reclutamiento', 'Calidad']
        };
      default:
        return {
          title: 'Dashboard de Reclutamiento',
          description: 'Sistema especializado para el equipo de reclutamiento',
          icon: Users,
          breadcrumbs: ['Reclutamiento']
        };
    }
  };

  const sectionInfo = getSectionInfo();

  // Render specialized recruitment metrics for each section
  const renderSectionMetrics = () => {
    if (loading) {
      return (
        <MinimalGrid columns={4}>
          {[1, 2, 3, 4].map(i => (
            <MinimalCard
              key={i}
              title="Cargando"
              value=""
              loading={true}
            />
          ))}
        </MinimalGrid>
      );
    }

    switch (activeSection) {
      case 'analistas':
        return (
          <MinimalGrid columns={4}>
            <MinimalCard
              title="Total Leads"
              value={pipelineStats.total}
              subtitle="Últimos 30 días"
              variant="primary"
            />
            <MinimalCard
              title="Contactabilidad"
              value={`${callCenterMetrics.contactabilidad}%`}
              subtitle={`${callCenterMetrics.contactosEfectivosDia}/día contactos efectivos`}
            />
            <MinimalCard
              title="Tasa Conversión"
              value={`${conversionRate}%`}
              subtitle="Lead → Aprobado"
            />
            <MinimalCard
              title="Agentes Activos"
              value={callCenterMetrics.agentesActivos}
              subtitle="Analistas trabajando"
              variant="subtle"
            />
          </MinimalGrid>
        );
      
      default:
        return (
          <MinimalGrid columns={4}>
            <MinimalCard
              title="Leads Totales"
              value={pipelineStats.total}
              subtitle="En el sistema"
              variant="primary"
            />
            <MinimalCard
              title="Contactabilidad"
              value={`${callCenterMetrics.contactabilidad}%`}
              subtitle="Tasa de contacto"
            />
            <MinimalCard
              title="Conversión"
              value={`${conversionRate}%`}
              subtitle="Lead → Aprobado"
            />
            <MinimalCard
              title="Agentes Activos"
              value={callCenterMetrics.agentesActivos}
              subtitle="Trabajando"
              variant="subtle"
            />
          </MinimalGrid>
        );
    }
  };

  // Render specialized recruitment content based on active section
  const renderContent = () => {
    console.log('🔄 renderContent called with activeSection:', activeSection);
    switch (activeSection) {
      case 'analistas':
        console.log('📊 Rendering AnalystPerformanceDashboard');
        return <AnalystPerformanceDashboard dateFrom={dateFrom} dateTo={dateTo} />;

      case 'contactabilidad':
        return <ContactabilityDashboard dateFrom={dateFrom} dateTo={dateTo} />;

      case 'pipeline':
        return <LeadsPipelineManager dateFrom={dateFrom} dateTo={dateTo} />;

      case 'calidad':
        return <QualityMetricsDashboard dateFrom={dateFrom} dateTo={dateTo} />;

      default:
        return <AnalystPerformanceDashboard dateFrom={dateFrom} dateTo={dateTo} />;
    }
  };

  // Summary stats for navigation
  const summaryStats = [
    {
      label: "Leads Totales",
      value: pipelineStats.total.toString(),
      trend: "+12%"
    },
    {
      label: "Contactabilidad",
      value: `${callCenterMetrics.contactabilidad}%`,
      trend: "+3%"
    },
    {
      label: "Conversión",
      value: `${conversionRate}%`,
      trend: "-2%"
    }
  ];

  const navigationItems = [
    {
      id: 'analistas',
      label: 'Performance Analistas',
      icon: Users,
      description: 'Dashboard individual de analistas'
    },
    {
      id: 'contactabilidad',
      label: 'Contactabilidad',
      icon: Phone,
      description: 'Métricas de call center'
    },
    {
      id: 'pipeline',
      label: 'Pipeline',
      icon: Target,
      description: 'Funnel de candidatos'
    },
    {
      id: 'calidad',
      label: 'Análisis de Calidad',
      icon: Award,
      description: 'Calidad por fuente'
    }
  ];

  return (
    <AppShell
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      sectionInfo={sectionInfo}
      stats={{
        criticalAlerts: 0,
        urgentClusters: 0,
        totalDeficit: pipelineStats.leads,
        activeCandidates: pipelineStats.approved
      }}
      onRefresh={handleRefreshData}
      loading={loading}
    >
      <div className="space-y-6">
        {/* Date Filter Controls */}
        <div className="flex items-center justify-between px-6 pt-6">
          <div className="flex items-center gap-2">
            <Button
              variant={dateFilterMode === '7days' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleDateFilterChange('7days')}
            >
              Últimos 7 días
            </Button>
            <Button
              variant={dateFilterMode === '30days' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleDateFilterChange('30days')}
            >
              Últimos 30 días
            </Button>
            
            {/* Custom Date Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={dateFilterMode === 'custom' ? 'default' : 'outline'}
                  size="sm"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Personalizado
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <DatePickerWithRange
                  date={dateRange}
                  onDateChange={handleCustomDateChange}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Active Date Range Badge */}
          <Badge variant="secondary" className="text-sm">
            📅 {getDateRangeDisplay()}
          </Badge>
        </div>

        <div className="px-6">
          {renderSectionMetrics()}
        </div>
        <div className="px-6">
          {renderContent()}
        </div>
      </div>
    </AppShell>
  );
};

export default RecruitmentStrategy;