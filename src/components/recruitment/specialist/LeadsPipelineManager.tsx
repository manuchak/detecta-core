import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Phone, 
  MessageSquare, 
  UserCheck, 
  Clock, 
  AlertTriangle,
  Eye,
  ArrowRight,
  Calendar
} from 'lucide-react';
import { useLeadsStable } from '@/hooks/useLeadsStable';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PipelineStats {
  stage: string;
  label: string;
  count: number;
  percentage: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface LeadActivity {
  lead_id: string;
  lead_name: string;
  stage: string;
  days_in_stage: number;
  last_activity: string;
  assigned_to: string;
  assigned_name: string;
  source: string;
}

export const LeadsPipelineManager = () => {
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const { leads, isLoading: leadsLoading } = useLeadsStable();

  const { data: pipelineData, isLoading } = useAuthenticatedQuery(
    ['leads-pipeline'],
    async () => {
      // Get leads with analyst info
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select(`
          id,
          nombre,
          estado,
          fuente,
          asignado_a,
          fecha_creacion,
          fecha_primer_contacto,
          fecha_ultima_actividad,
          profiles!leads_asignado_a_fkey (
            display_name
          )
        `)
        .order('fecha_creacion', { ascending: false });

      if (leadsError) throw leadsError;

      // Calculate pipeline stats
      const stages = [
        { stage: 'lead', label: 'Nuevos Leads', icon: Users, color: 'bg-blue-500' },
        { stage: 'contactado', label: 'Contactados', icon: Phone, color: 'bg-yellow-500' },
        { stage: 'entrevista', label: 'En Entrevista', icon: MessageSquare, color: 'bg-orange-500' },
        { stage: 'aprobado', label: 'Aprobados', icon: UserCheck, color: 'bg-green-500' }
      ];

      const totalLeads = leadsData?.length || 0;
      const stats: PipelineStats[] = stages.map(stage => {
        const count = leadsData?.filter(lead => lead.estado === stage.stage).length || 0;
        return {
          ...stage,
          count,
          percentage: totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0
        };
      });

      // Calculate lead activities
      const activities: LeadActivity[] = leadsData?.map(lead => {
        const createdDate = new Date(lead.fecha_creacion);
        const now = new Date();
        const daysInStage = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          lead_id: lead.id,
          lead_name: lead.nombre,
          stage: lead.estado,
          days_in_stage: daysInStage,
          last_activity: lead.fecha_ultima_actividad || lead.fecha_creacion,
          assigned_to: lead.asignado_a || '',
          assigned_name: lead.profiles?.display_name || 'Sin asignar',
          source: lead.fuente || 'Directo'
        };
      }) || [];

      return { stats, activities, totalLeads };
    },
    { enabled: !leadsLoading }
  );

  const { data: conversionFunnel } = useAuthenticatedQuery(
    ['conversion-funnel'],
    async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('estado, fuente')
        .not('fuente', 'is', null);

      if (error) throw error;

      const funnelData = data?.reduce((acc, lead) => {
        const source = lead.fuente || 'unknown';
        if (!acc[source]) {
          acc[source] = { total: 0, lead: 0, contactado: 0, entrevista: 0, aprobado: 0 };
        }
        acc[source].total++;
        acc[source][lead.estado as keyof typeof acc[typeof source]]++;
        return acc;
      }, {} as Record<string, Record<string, number>>);

      return Object.entries(funnelData || {}).map(([source, stats]) => ({
        source,
        ...stats,
        conversion_rate: stats.total > 0 ? Math.round((stats.aprobado / stats.total) * 100) : 0
      }));
    }
  );

  if (isLoading || leadsLoading) {
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

  const filteredActivities = selectedStage === 'all' 
    ? pipelineData?.activities || []
    : pipelineData?.activities?.filter(activity => activity.stage === selectedStage) || [];

  const urgentLeads = pipelineData?.activities?.filter(activity => 
    activity.days_in_stage > 3 && activity.stage === 'lead'
  ) || [];

  const staleLeads = pipelineData?.activities?.filter(activity => 
    activity.days_in_stage > 7 && activity.stage === 'contactado'
  ) || [];

  return (
    <div className="space-y-6">
      {/* Pipeline Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {pipelineData?.stats.map((stat) => (
          <Card 
            key={stat.stage} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedStage === stat.stage ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedStage(selectedStage === stat.stage ? 'all' : stat.stage)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${stat.color}`} />
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold">{stat.count}</p>
                  <p className="text-xs text-muted-foreground">{stat.percentage}% del total</p>
                </div>
                <stat.icon className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts Section */}
      {(urgentLeads.length > 0 || staleLeads.length > 0) && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5" />
              Alertas del Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {urgentLeads.length > 0 && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2">
                    🚨 Leads sin contactar ({urgentLeads.length})
                  </h4>
                  <p className="text-sm text-red-700">
                    Hay {urgentLeads.length} leads sin contactar hace más de 3 días
                  </p>
                </div>
              )}
              
              {staleLeads.length > 0 && (
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">
                    ⏰ Leads estancados ({staleLeads.length})
                  </h4>
                  <p className="text-sm text-yellow-700">
                    Hay {staleLeads.length} leads contactados hace más de 7 días sin avance
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="pipeline" className="w-full">
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline Detallado</TabsTrigger>
          <TabsTrigger value="funnel">Funnel de Conversión</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-4">
          {/* Pipeline Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Actividad del Pipeline
                  {selectedStage !== 'all' && (
                    <Badge variant="secondary">
                      {pipelineData?.stats.find(s => s.stage === selectedStage)?.label}
                    </Badge>
                  )}
                </div>
                {selectedStage !== 'all' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedStage('all')}
                  >
                    Ver todos
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredActivities.map((activity) => (
                  <div key={activity.lead_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{activity.lead_name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {activity.stage}
                        </Badge>
                        {activity.days_in_stage > 3 && (
                          <Badge variant="destructive" className="text-xs">
                            {activity.days_in_stage}d
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>📊 {activity.source}</span>
                        <span>👤 {activity.assigned_name}</span>
                        <span>📅 {activity.days_in_stage} días en etapa</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                {filteredActivities.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No hay leads en esta etapa
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funnel" className="space-y-4">
          {/* Conversion Funnel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5" />
                Funnel de Conversión por Fuente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conversionFunnel?.map((funnel) => (
                  <div key={funnel.source} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium capitalize">{funnel.source}</h4>
                      <Badge variant="secondary">
                        {funnel.conversion_rate}% conversión
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="p-2 bg-blue-50 rounded text-blue-800">
                        <p className="text-lg font-bold">{funnel.lead}</p>
                        <p className="text-xs">Leads</p>
                      </div>
                      <div className="p-2 bg-yellow-50 rounded text-yellow-800">
                        <p className="text-lg font-bold">{funnel.contactado}</p>
                        <p className="text-xs">Contactados</p>
                      </div>
                      <div className="p-2 bg-orange-50 rounded text-orange-800">
                        <p className="text-lg font-bold">{funnel.entrevista}</p>
                        <p className="text-xs">Entrevistas</p>
                      </div>
                      <div className="p-2 bg-green-50 rounded text-green-800">
                        <p className="text-lg font-bold">{funnel.aprobado}</p>
                        <p className="text-xs">Aprobados</p>
                      </div>
                    </div>
                    
                    <Progress value={funnel.conversion_rate} max={100} />
                  </div>
                ))}
                
                {(!conversionFunnel || conversionFunnel.length === 0) && (
                  <div className="text-center py-8">
                    <ArrowRight className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No hay datos suficientes para mostrar el funnel de conversión
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};