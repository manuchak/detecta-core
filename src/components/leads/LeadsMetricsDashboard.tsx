import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, UserX, Clock, TrendingUp, Database, Phone, PhoneCall, CheckCircle, Target } from "lucide-react";
import { Lead } from "@/types/leadTypes";
import { useMemo } from "react";
import { useCallCenterMetrics } from "@/hooks/useCallCenterMetrics";
import { useLeadsAnalytics } from "@/hooks/useLeadsAnalytics";
import { DailyLeadsChart } from "./DailyLeadsChart";
import { AnalystPerformanceTable } from "./AnalystPerformanceTable";

interface LeadsMetricsDashboardProps {
  leads: Lead[];
  dateFrom?: string;
  dateTo?: string;
}

export const LeadsMetricsDashboard = ({ leads, dateFrom, dateTo }: LeadsMetricsDashboardProps) => {
  // Hook para métricas de call center
  const { metrics: callCenterMetrics, isLoading: callCenterLoading } = useCallCenterMetrics({
    dateFrom,
    dateTo,
    enabled: true
  });

  // Hook para analíticas de leads
  const { 
    dailyData, 
    analystPerformance, 
    loading: analyticsLoading 
  } = useLeadsAnalytics(dateFrom, dateTo);
  
  const metrics = useMemo(() => {
    // Validar que leads sea un array válido
    if (!Array.isArray(leads)) {
      return {
        total: 0,
        assigned: 0,
        unassigned: 0,
        newLeads: 0,
        inProcess: 0,
        approved: 0,
        avgHoursToAssignment: 0,
        assignmentRate: 0
      };
    }

    // Filtrar leads por rango de fechas si se proporcionan
    let filteredLeads = leads;
    if (dateFrom || dateTo) {
      filteredLeads = leads.filter(lead => {
        if (!lead.fecha_creacion) return false;
        
        const leadDate = new Date(lead.fecha_creacion);
        const fromDate = dateFrom ? new Date(dateFrom) : new Date('1900-01-01');
        const toDate = dateTo ? new Date(dateTo) : new Date('2100-12-31');
        
        // Incluir todo el día final
        toDate.setHours(23, 59, 59, 999);
        
        return leadDate >= fromDate && leadDate <= toDate;
      });
    }

    const total = filteredLeads.length;
    const assigned = filteredLeads.filter(lead => lead?.asignado_a).length;
    const unassigned = total - assigned;
    const newLeads = filteredLeads.filter(lead => lead?.estado === 'nuevo').length;
    
    // Estados que se consideran "en proceso" - incluye todos los estados intermedios del proceso custodio
    const inProcessStates = [
      'contactado',
      'en_revision', 
      'psicometricos_pendiente',
      'psicometricos_completado',
      'toxicologicos_pendiente',
      'toxicologicos_completado',
      'instalacion_gps_pendiente',
      'instalacion_gps_completado'
    ];
    
    // Estados que se consideran "aprobados" - estados finales exitosos
    const approvedStates = [
      'aprobado',
      'custodio_activo'
    ];
    
    const inProcess = filteredLeads.filter(lead => 
      lead?.estado && inProcessStates.includes(lead.estado)
    ).length;
    
    const approved = filteredLeads.filter(lead => 
      lead?.estado && approvedStates.includes(lead.estado)
    ).length;
    
    // Calcular tiempo promedio entre creación y asignación en horas
    const assignedLeads = filteredLeads.filter(lead => lead && lead.asignado_a && lead.fecha_creacion);
    
    console.log('📊 Debug - Total leads filtrados:', filteredLeads.length);
    console.log('📊 Debug - Leads asignados (con asignado_a):', filteredLeads.filter(lead => lead?.asignado_a).length);
    console.log('📊 Debug - Estados de leads:', filteredLeads.map(lead => lead.estado));
    console.log('📊 Debug - Leads en proceso:', inProcess);
    console.log('📊 Debug - Leads aprobados:', approved);
    console.log('📊 Debug - Leads con fecha_creacion:', filteredLeads.filter(lead => lead?.fecha_creacion).length);
    console.log('📊 Debug - Leads con fecha_contacto:', filteredLeads.filter(lead => lead?.fecha_contacto).length);
    console.log('📊 Debug - Leads asignados válidos para cálculo:', assignedLeads.length);
    
    let avgHoursToAssignment = 0;
    if (assignedLeads.length > 0) {
      try {
        const totalHours = assignedLeads.reduce((acc, lead) => {
          try {
            const creationDate = new Date(lead.fecha_creacion);
            // Usamos fecha_contacto si existe, sino updated_at como fallback
            const assignmentDate = new Date(lead.fecha_contacto || lead.updated_at);
            
            if (isNaN(creationDate.getTime()) || isNaN(assignmentDate.getTime())) {
              console.log('📊 Debug - Fechas inválidas para lead:', lead.id, {
                fecha_creacion: lead.fecha_creacion,
                fecha_contacto: lead.fecha_contacto,
                updated_at: lead.updated_at
              });
              return acc;
            }
            
            const hours = Math.floor((assignmentDate.getTime() - creationDate.getTime()) / (1000 * 60 * 60));
            console.log('📊 Debug - Lead:', lead.id, 'Horas:', hours);
            return acc + Math.max(0, hours);
          } catch (error) {
            console.warn('Error calculando horas para lead:', lead.id, error);
            return acc;
          }
        }, 0);
        
        avgHoursToAssignment = Math.round(totalHours / assignedLeads.length);
        console.log('📊 Debug - Total horas:', totalHours, 'Promedio:', avgHoursToAssignment);
      } catch (error) {
        console.warn('Error calculando promedio de horas hasta asignación:', error);
        avgHoursToAssignment = 0;
      }
    }

    const assignmentRate = total > 0 ? Math.round((assigned / total) * 100) : 0;

    return {
      total,
      assigned,
      unassigned,
      newLeads,
      inProcess,
      approved,
      avgHoursToAssignment,
      assignmentRate
    };
  }, [leads, dateFrom, dateTo]); // Depende de leads y filtros de fecha

  return (
    <div className="space-y-6 mb-6">
      {/* Primera fila: Métricas de Leads */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Candidatos</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
              <Badge variant="outline" className="text-xs">
                Cargados de BD
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Nuevos:</span>
                <Badge variant="outline" className="text-xs bg-blue-50">
                  {metrics.newLeads}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>En proceso:</span>
                <Badge variant="outline" className="text-xs bg-yellow-50">
                  {metrics.inProcess}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Aprobados:</span>
                <Badge variant="outline" className="text-xs bg-green-50">
                  {metrics.approved}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asignados</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.assigned}</div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>{metrics.assignmentRate}% del total</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sin Asignar</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.unassigned}</div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
              <Clock className="h-3 w-3" />
              <span>Requieren atención</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{metrics.avgHoursToAssignment}</div>
            <div className="text-xs text-muted-foreground mt-1">
              horas hasta asignación
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segunda fila: Métricas de Call Center */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contactabilidad</CardTitle>
            <Phone className={`h-4 w-4 ${callCenterMetrics.contactabilidad >= 25 ? 'text-green-600' : 'text-red-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${callCenterMetrics.contactabilidad >= 25 ? 'text-green-600' : 'text-red-600'}`}>
              {callCenterLoading ? '...' : `${callCenterMetrics.contactabilidad}%`}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              de llamadas efectivas
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Llamadas/Día</CardTitle>
            <PhoneCall className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {callCenterLoading ? '...' : callCenterMetrics.llamadasPromedioDia}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              promedio por día
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contactos Efectivos/Día</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {callCenterLoading ? '...' : callCenterMetrics.contactosEfectivosDia}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              contactos exitosos/día
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agentes Activos</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {callCenterLoading ? '...' : callCenterMetrics.agentesActivos}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              agentes únicos activos
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Únicos Contactados</CardTitle>
            <Target className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {callCenterLoading ? '...' : callCenterMetrics.leadsUnicosContactados}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              leads únicos alcanzados
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tercera fila: Gráficos de analíticas */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <DailyLeadsChart 
          data={dailyData} 
          loading={analyticsLoading} 
        />
        <AnalystPerformanceTable 
          data={analystPerformance} 
          loading={analyticsLoading} 
        />
      </div>
    </div>
  );
};
