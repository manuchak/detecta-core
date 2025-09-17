// @ts-nocheck
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Target, 
  Clock, 
  Users, 
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Star
} from 'lucide-react';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { supabase } from '@/integrations/supabase/client';

interface SourceQuality {
  source: string;
  total_leads: number;
  approved_leads: number;
  approval_rate: number;
  avg_time_to_approval: number;
  active_custodians: number;
  retention_rate: number;
}

interface QualityMetrics {
  overall_approval_rate: number;
  avg_lead_to_custodian_days: number;
  retention_month_3: number;
  quality_score: number;
}

export const QualityMetricsDashboard = () => {
  const { data: qualityData, isLoading } = useAuthenticatedQuery(
    ['quality-metrics'],
    async () => {
      // Get lead data with approval info
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select(`
          id,
          fuente,
          estado,
          created_at
        `);

      if (leadsError) throw leadsError;

      // Get custodian activity data
      const { data: custodianData, error: custodianError } = await supabase
        .from('servicios_custodia')
        .select('id_custodio, fecha_hora_cita, estado')
        .not('id_custodio', 'is', null)
        .gte('fecha_hora_cita', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

      if (custodianError) throw custodianError;

      // Calculate source quality metrics
      const sourceMap = new Map<string, SourceQuality>();
      const approvedLeads = leadsData?.filter(lead => lead.estado === 'aprobado') || [];
      
      leadsData?.forEach(lead => {
        const source = lead.fuente || 'unknown';
        if (!sourceMap.has(source)) {
          sourceMap.set(source, {
            source,
            total_leads: 0,
            approved_leads: 0,
            approval_rate: 0,
            avg_time_to_approval: 0,
            active_custodians: 0,
            retention_rate: 0
          });
        }
        
        const sourceData = sourceMap.get(source)!;
        sourceData.total_leads++;
        
        if (lead.estado === 'aprobado') {
          sourceData.approved_leads++;
          
          // Calculate time to approval (simplified - using created_at)
          if (lead.created_at) {
            const timeToApproval = Math.floor(
              (new Date().getTime() - new Date(lead.created_at).getTime()) 
              / (1000 * 60 * 60 * 24)
            );
            sourceData.avg_time_to_approval = timeToApproval;
          }
        }
      });

      // Calculate approval rates
      sourceMap.forEach((sourceData) => {
        sourceData.approval_rate = sourceData.total_leads > 0 
          ? Math.round((sourceData.approved_leads / sourceData.total_leads) * 100)
          : 0;
      });

      // Calculate custodian retention (simplified - custodians with services in last 30 days)
      const activeCustodians = new Set(
        custodianData?.filter(service => 
          new Date(service.fecha_hora_cita) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        ).map(service => service.id_custodio) || []
      );

      const sources = Array.from(sourceMap.values()).sort((a, b) => b.approval_rate - a.approval_rate);

      // Calculate overall quality metrics
      const totalLeads = leadsData?.length || 0;
      const totalApproved = approvedLeads.length;
      const overallApprovalRate = totalLeads > 0 ? Math.round((totalApproved / totalLeads) * 100) : 0;
      
      // Average time from lead to active custodian (simplified)
      const avgLeadToCustodianDays = 14; // Placeholder - would need more complex calculation
      
      // Retention rate (placeholder - would need historical data)
      const retentionMonth3 = 65;
      
      // Quality score (weighted combination of metrics)
      const qualityScore = Math.round(
        (overallApprovalRate * 0.4) + 
        (Math.min(100, (100 - avgLeadToCustodianDays * 2)) * 0.3) + 
        (retentionMonth3 * 0.3)
      );

      const qualityMetrics: QualityMetrics = {
        overall_approval_rate: overallApprovalRate,
        avg_lead_to_custodian_days: avgLeadToCustodianDays,
        retention_month_3: retentionMonth3,
        quality_score: qualityScore
      };

      return { sources, qualityMetrics, activeCustodians: activeCustodians.size };
    }
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityBadge = (score: number) => {
    if (score >= 80) return { label: 'Excelente', variant: 'default' as const };
    if (score >= 60) return { label: 'Bueno', variant: 'secondary' as const };
    return { label: 'Necesita Mejora', variant: 'destructive' as const };
  };

  const bestSource = qualityData?.sources[0];
  const worstSource = qualityData?.sources[qualityData.sources.length - 1];

  return (
    <div className="space-y-6">
      {/* Quality Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Puntuación de Calidad</span>
            </div>
            <div className="flex items-end gap-2">
              <p className={`text-3xl font-bold ${getQualityColor(qualityData?.qualityMetrics.quality_score || 0)}`}>
                {qualityData?.qualityMetrics.quality_score || 0}
              </p>
              <Badge {...getQualityBadge(qualityData?.qualityMetrics.quality_score || 0)}>
                {getQualityBadge(qualityData?.qualityMetrics.quality_score || 0).label}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Tasa de Aprobación</span>
            </div>
            <p className="text-2xl font-bold">{qualityData?.qualityMetrics.overall_approval_rate || 0}%</p>
            <p className="text-xs text-muted-foreground">General</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Tiempo Promedio</span>
            </div>
            <p className="text-2xl font-bold">{qualityData?.qualityMetrics.avg_lead_to_custodian_days || 0}</p>
            <p className="text-xs text-muted-foreground">días lead → custodio</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Retención 3 Meses</span>
            </div>
            <p className="text-2xl font-bold">{qualityData?.qualityMetrics.retention_month_3 || 0}%</p>
            <p className="text-xs text-muted-foreground">Custodios activos</p>
          </CardContent>
        </Card>
      </div>

      {/* Source Performance Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Calidad por Fuente de Reclutamiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {qualityData?.sources.map((source, index) => (
              <div key={source.source} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium capitalize">{source.source}</h4>
                    {index === 0 && (
                      <Badge variant="secondary" className="text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        Mejor
                      </Badge>
                    )}
                    {index === (qualityData.sources.length - 1) && qualityData.sources.length > 1 && (
                      <Badge variant="outline" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Atención
                      </Badge>
                    )}
                  </div>
                  <Badge variant="secondary">
                    {source.approval_rate}% aprobación
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div className="text-center">
                    <p className="text-lg font-semibold">{source.total_leads}</p>
                    <p className="text-xs text-muted-foreground">Total Leads</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold">{source.approved_leads}</p>
                    <p className="text-xs text-muted-foreground">Aprobados</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold">{source.avg_time_to_approval || 'N/A'}</p>
                    <p className="text-xs text-muted-foreground">Días aprob.</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold">{source.retention_rate}%</p>
                    <p className="text-xs text-muted-foreground">Retención</p>
                  </div>
                </div>
                
                <Progress value={source.approval_rate} max={100} />
              </div>
            ))}
            
            {(!qualityData?.sources || qualityData.sources.length === 0) && (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No hay datos suficientes para mostrar calidad por fuente
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quality Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Best Practices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Mejores Prácticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bestSource && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-1">
                    🏆 Mejor Fuente: {bestSource.source}
                  </h4>
                  <p className="text-sm text-green-700">
                    {bestSource.approval_rate}% de aprobación con {bestSource.total_leads} leads
                  </p>
                </div>
              )}
              
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-1">
                  📊 Performance General
                </h4>
                <p className="text-sm text-blue-700">
                  Puntuación de calidad: {qualityData?.qualityMetrics.quality_score}/100
                </p>
              </div>
              
              <div className="p-3 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-800 mb-1">
                  👥 Custodios Activos
                </h4>
                <p className="text-sm text-purple-700">
                  {qualityData?.activeCustodians} custodios activos en los últimos 30 días
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Areas for Improvement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Áreas de Mejora
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {worstSource && (
                <div className="p-3 bg-amber-50 rounded-lg">
                  <h4 className="font-medium text-amber-800 mb-1">
                    ⚠️ Atención: {worstSource.source}
                  </h4>
                  <p className="text-sm text-amber-700">
                    Solo {worstSource.approval_rate}% de aprobación - revisar estrategia
                  </p>
                </div>
              )}
              
              {(qualityData?.qualityMetrics.avg_lead_to_custodian_days || 0) > 20 && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-1">
                    🐌 Proceso Lento
                  </h4>
                  <p className="text-sm text-red-700">
                    {qualityData?.qualityMetrics.avg_lead_to_custodian_days} días promedio - acelerar proceso
                  </p>
                </div>
              )}
              
              {(qualityData?.qualityMetrics.overall_approval_rate || 0) < 20 && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-1">
                    📉 Baja Conversión
                  </h4>
                  <p className="text-sm text-red-700">
                    {qualityData?.qualityMetrics.overall_approval_rate}% aprobación general - mejorar filtros
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};