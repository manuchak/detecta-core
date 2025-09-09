import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AppShell } from '@/components/layout/AppShell';
import { MinimalCard } from '@/components/recruitment/ui/MinimalCard';
import { MinimalGrid } from '@/components/recruitment/ui/MinimalGrid';
import { 
  Users, 
  Phone, 
  Target, 
  TrendingUp,
  RefreshCw,
  BarChart3,
  Award,
  MessageSquare
} from 'lucide-react';
import { AnalystPerformanceDashboard } from '@/components/recruitment/specialist/AnalystPerformanceDashboard';
import { ContactabilityDashboard } from '@/components/recruitment/specialist/ContactabilityDashboard';
import { LeadsPipelineManager } from '@/components/recruitment/specialist/LeadsPipelineManager';
import { QualityMetricsDashboard } from '@/components/recruitment/specialist/QualityMetricsDashboard';
import { useCallCenterMetrics } from '@/hooks/useCallCenterMetrics';
import { useLeadsStable } from '@/hooks/useLeadsStable';

const RecruitmentStrategy = () => {
  const [activeSection, setActiveSection] = useState('analistas');
  
  console.log('🎯 RecruitmentStrategy - activeSection:', activeSection);
  
  // Hooks especializados para reclutamiento
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];
  
  const { metrics: callCenterMetrics, isLoading: metricsLoading } = useCallCenterMetrics({
    dateFrom: thirtyDaysAgo,
    dateTo: today,
    enabled: true
  });
  
  const { leads, isLoading: leadsLoading } = useLeadsStable();

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
      window.location.reload();
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
        return <AnalystPerformanceDashboard />;

      case 'contactabilidad':
        return <ContactabilityDashboard />;

      case 'pipeline':
        return <LeadsPipelineManager />;

      case 'calidad':
        return <QualityMetricsDashboard />;

      default:
        return <AnalystPerformanceDashboard />;
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
        {renderSectionMetrics()}
        <div className="mt-6">
          {renderContent()}
        </div>
      </div>
    </AppShell>
  );
};

export default RecruitmentStrategy;