import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Phone, CheckCircle, Clock, TrendingUp, Award } from 'lucide-react';
import { useLeadAssignment } from '@/hooks/useLeadAssignment';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { supabase } from '@/integrations/supabase/client';

interface AnalystStats {
  id: string;
  name: string;
  email: string;
  leads_assigned: number;
  leads_contacted: number;
  leads_approved: number;
  total_calls: number;
  successful_calls: number;
  approval_rate: number;
  contactability_rate: number;
  avg_response_time: number;
}

export const AnalystPerformanceDashboard = () => {
  const { analysts, loading: analystsLoading } = useLeadAssignment();
  
  const { data: analystStats, isLoading } = useAuthenticatedQuery(
    ['analyst-performance-simple', JSON.stringify(analysts.map(a => a.id))],
    async () => {
      console.log('🔍 Starting analyst performance query with analysts:', analysts.length);
      
      if (analysts.length === 0) {
        return [];
      }

      const analystIds = analysts.map(a => a.id);
      console.log('🔍 Analyst IDs:', analystIds);

      // Direct query to leads table
      const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .in('asignado_a', analystIds);

      if (error) {
        console.error('❌ Error fetching leads:', error);
        throw error;
      }

      console.log('📊 Found leads:', leads?.length || 0);
      console.log('📊 Leads by analyst:');
      
      // Create stats map
      const statsMap = new Map();
      
      // Initialize all analysts
      analysts.forEach(analyst => {
        const leadsForAnalyst = leads?.filter(lead => lead.asignado_a === analyst.id) || [];
        const approvedLeads = leadsForAnalyst.filter(lead => lead.estado === 'aprobado');
        const contactedLeads = leadsForAnalyst.filter(lead => 
          ['nuevo', 'aprobado', 'rechazado', 'en_proceso', 'contactado'].includes(lead.estado)
        );

        console.log(`📊 ${analyst.display_name}: ${leadsForAnalyst.length} leads, ${approvedLeads.length} approved`);

        statsMap.set(analyst.id, {
          id: analyst.id,
          name: analyst.display_name,
          email: analyst.email,
          leads_assigned: leadsForAnalyst.length,
          leads_contacted: contactedLeads.length,
          leads_approved: approvedLeads.length,
          total_calls: 0,
          successful_calls: 0,
          approval_rate: leadsForAnalyst.length > 0 ? Math.round((approvedLeads.length / leadsForAnalyst.length) * 100) : 0,
          contactability_rate: leadsForAnalyst.length > 0 ? Math.round((contactedLeads.length / leadsForAnalyst.length) * 100) : 0,
          avg_response_time: 0
        });
      });

      const result = Array.from(statsMap.values()).sort((a, b) => b.approval_rate - a.approval_rate);
      console.log('📊 Final result:', result);
      return result;
    }
  );

  if (isLoading || analystsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                  <div className="h-2 bg-muted rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const topPerformer = analystStats?.[0];
  const avgApprovalRate = analystStats?.length 
    ? Math.round(analystStats.reduce((sum, s) => sum + s.approval_rate, 0) / analystStats.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Analistas Activos</span>
            </div>
            <p className="text-2xl font-bold mt-1">{analystStats?.length || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Top Performer</span>
            </div>
            <p className="text-lg font-semibold mt-1">{topPerformer?.name || 'N/A'}</p>
            <p className="text-sm text-muted-foreground">{topPerformer?.approval_rate || 0}% aprobación</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Aprobación Promedio</span>
            </div>
            <p className="text-2xl font-bold mt-1">{avgApprovalRate}%</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Aprobados</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {analystStats?.reduce((sum, s) => sum + s.leads_approved, 0) || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Individual Analyst Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {analystStats?.map((analyst, index) => (
          <Card key={analyst.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{analyst.name}</CardTitle>
                {index === 0 && (
                  <Badge variant="secondary" className="text-xs">
                    <Award className="h-3 w-3 mr-1" />
                    Top
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{analyst.email}</p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Approval Rate */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-muted-foreground">Tasa de Aprobación</span>
                  <span className="text-sm font-medium">{analyst.approval_rate}%</span>
                </div>
                <Progress value={analyst.approval_rate} max={100} />
              </div>
              
              {/* Contactability Rate */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-muted-foreground">Contactabilidad</span>
                  <span className="text-sm font-medium">{analyst.contactability_rate}%</span>
                </div>
                <Progress value={analyst.contactability_rate} max={100} />
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="text-center">
                  <p className="text-lg font-semibold">{analyst.leads_assigned}</p>
                  <p className="text-xs text-muted-foreground">Asignados</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold">{analyst.leads_contacted}</p>
                  <p className="text-xs text-muted-foreground">Contactados</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold">{analyst.leads_approved}</p>
                  <p className="text-xs text-muted-foreground">Aprobados</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold">{analyst.total_calls}</p>
                  <p className="text-xs text-muted-foreground">Llamadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {analystStats?.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay datos de analistas</h3>
            <p className="text-muted-foreground mb-4">
              {analysts.length === 0 
                ? "Cargando analistas disponibles..."
                : "No se encontraron analistas con leads asignados en el período seleccionado."
              }
            </p>
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Nota:</strong> Los registros de llamadas no tienen caller_id asignado. 
                Las métricas de contactabilidad pueden estar limitadas.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};