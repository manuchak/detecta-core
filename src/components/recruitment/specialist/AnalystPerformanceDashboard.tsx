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
  console.log('🚀 AnalystPerformanceDashboard component mounted');
  const { analysts, loading: analystsLoading } = useLeadAssignment();
  console.log('📊 Analysts loaded:', analysts?.length || 0, 'Loading:', analystsLoading);
  
  // Force render with test data if needed
  console.log('🔧 Component is rendering - check navigation!');
  
  const { data: analystStats, isLoading } = useAuthenticatedQuery(
    ['analyst-performance-direct'],
    async () => {
      console.log('🔍 Direct query to leads table with RLS bypass');
      
      // Direct query to leads table - bypass RLS issues
      const { data: leadsData, error } = await supabase
        .from('leads')
        .select(`
          id,
          nombre,
          email,
          telefono,
          fecha_creacion,
          estado,
          asignado_a,
          zona_preferida_id
        `);

      console.log('📊 Direct leads query result:');
      console.log('   - Data count:', leadsData?.length || 0);
      console.log('   - Error:', error);

      if (error) {
        console.error('❌ Error in direct leads query:', error);
        // Return empty array instead of throwing - let component handle gracefully
        return [];
      }

      console.log('📊 Function returned leads:', leadsData?.length || 0);
      
      // Group leads by analyst and calculate stats
      const statsMap = new Map<string, AnalystStats>();
      
      // Process each lead from direct query
      leadsData?.forEach(lead => {
        const analystId = lead.asignado_a;
        if (!analystId) return;
        
        // Get analyst info from analysts array
        const analystInfo = analysts.find(a => a.id === analystId);
        if (!analystInfo) return;
        
        // Initialize analyst stats if not exists
        if (!statsMap.has(analystId)) {
          statsMap.set(analystId, {
            id: analystId,
            name: analystInfo.display_name || 'Unknown',
            email: analystInfo.email || '',
            leads_assigned: 0,
            leads_contacted: 0,
            leads_approved: 0,
            total_calls: 0,
            successful_calls: 0,
            approval_rate: 0,
            contactability_rate: 0,
            avg_response_time: 0
          });
        }
        
        const stats = statsMap.get(analystId)!;
        stats.leads_assigned++;
        
        // Count as contacted if is in processed states
        if (['aprobado', 'rechazado', 'en_proceso', 'contactado'].includes(lead.estado)) {
          stats.leads_contacted++;
        }
        
        // Count approved leads
        if (lead.estado === 'aprobado') {
          stats.leads_approved++;
        }
      });

      // Calculate final rates for each analyst
      statsMap.forEach((stats) => {
        stats.approval_rate = stats.leads_assigned > 0 
          ? Math.round((stats.leads_approved / stats.leads_assigned) * 100) 
          : 0;
        
        stats.contactability_rate = stats.leads_assigned > 0 
          ? Math.round((stats.leads_contacted / stats.leads_assigned) * 100) 
          : 0;
      });

      const result = Array.from(statsMap.values()).sort((a, b) => b.approval_rate - a.approval_rate);
      console.log('📊 Final analyst stats from function:', result);
      
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