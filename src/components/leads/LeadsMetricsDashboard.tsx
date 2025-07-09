import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, UserX, Clock, TrendingUp } from "lucide-react";
import { Lead } from "@/hooks/useLeads";
import { useMemo } from "react";

interface LeadsMetricsDashboardProps {
  leads: Lead[];
}

export const LeadsMetricsDashboard = ({ leads }: LeadsMetricsDashboardProps) => {
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
        avgDaysUnassigned: 0,
        assignmentRate: 0
      };
    }

    const total = leads.length;
    const assigned = leads.filter(lead => lead?.asignado_a).length;
    const unassigned = total - assigned;
    const newLeads = leads.filter(lead => lead?.estado === 'nuevo').length;
    const inProcess = leads.filter(lead => lead?.estado === 'en_proceso').length;
    const approved = leads.filter(lead => lead?.estado === 'aprobado').length;
    
    // Calcular días promedio sin asignación con validaciones robustas
    const unassignedLeads = leads.filter(lead => lead && !lead.asignado_a && lead.fecha_creacion);
    
    let avgDaysUnassigned = 0;
    if (unassignedLeads.length > 0) {
      try {
        // Usar fecha fija para evitar re-renders constantes
        const currentTime = new Date().getTime();
        const totalDays = unassignedLeads.reduce((acc, lead) => {
          try {
            const creationDate = new Date(lead.fecha_creacion);
            // Validar que la fecha sea válida
            if (isNaN(creationDate.getTime())) {
              return acc;
            }
            const days = Math.floor((currentTime - creationDate.getTime()) / (1000 * 60 * 60 * 24));
            return acc + Math.max(0, days); // Evitar días negativos
          } catch (error) {
            console.warn('Error calculando días para lead:', lead.id, error);
            return acc;
          }
        }, 0);
        
        avgDaysUnassigned = Math.round(totalDays / unassignedLeads.length);
      } catch (error) {
        console.warn('Error calculando promedio de días sin asignar:', error);
        avgDaysUnassigned = 0;
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
      avgDaysUnassigned,
      assignmentRate
    };
  }, [leads]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Candidatos</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.total}</div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
            <Badge variant="outline" className="text-xs">
              {metrics.newLeads} nuevos
            </Badge>
            <Badge variant="outline" className="text-xs">
              {metrics.inProcess} en proceso
            </Badge>
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
          <div className="text-2xl font-bold text-orange-600">{metrics.avgDaysUnassigned}</div>
          <div className="text-xs text-muted-foreground mt-1">
            días sin asignar
          </div>
        </CardContent>
      </Card>
    </div>
  );
};