import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Phone, PhoneCall, CheckCircle, XCircle, Clock, UserX } from 'lucide-react';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { supabase } from '@/integrations/supabase/client';

interface LeadStatusMetrics {
  sin_asignar: number;
  contacto_inicial: number;
  evaluacion: number;
  aprobados: number;
  rechazados: number;
  pendientes: number;
  total_leads: number;
}

const LeadsStatusCard: React.FC = () => {
  const { data: metrics, isLoading, error } = useAuthenticatedQuery(
    ['leads-status-metrics'],
    async (): Promise<LeadStatusMetrics> => {
      // Obtener todos los candidatos
      const { data: candidatos, error: candidatosError } = await supabase
        .from('candidatos_custodios')
        .select('*');

      if (candidatosError) throw candidatosError;

      if (!candidatos) {
        return {
          sin_asignar: 0,
          contacto_inicial: 0,
          evaluacion: 0,
          aprobados: 0,
          rechazados: 0,
          pendientes: 0,
          total_leads: 0
        };
      }

      const metrics: LeadStatusMetrics = {
        sin_asignar: 0,
        contacto_inicial: 0,
        evaluacion: 0,
        aprobados: 0,
        rechazados: 0,
        pendientes: 0,
        total_leads: candidatos.length
      };

      candidatos.forEach(candidato => {
        // Clasificar por estado del proceso
        switch (candidato.estado_proceso) {
          case 'lead':
            metrics.sin_asignar++;
            break;
          case 'contacto_inicial':
            metrics.contacto_inicial++;
            break;
          case 'evaluacion':
            metrics.evaluacion++;
            break;
          case 'aprobado':
            metrics.aprobados++;
            break;
          case 'rechazado':
            metrics.rechazados++;
            break;
          default:
            metrics.pendientes++;
            break;
        }
      });

      return metrics;
    }
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Estado Detallado de Leads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Estado Detallado de Leads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Error al cargar las métricas de leads</p>
        </CardContent>
      </Card>
    );
  }

  const statusItems = [
    {
      label: 'Sin Asignar',
      value: metrics.sin_asignar,
      icon: UserX,
      color: 'bg-orange-100 text-orange-800',
      description: 'Leads nuevos que aún no han sido contactados'
    },
    {
      label: 'Contacto Inicial',
      value: metrics.contacto_inicial,
      icon: Phone,
      color: 'bg-blue-100 text-blue-800',
      description: 'Leads en proceso de primer contacto'
    },
    {
      label: 'En Evaluación',
      value: metrics.evaluacion,
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-800',
      description: 'Leads siendo evaluados para aprobación'
    },
    {
      label: 'Aprobados',
      value: metrics.aprobados,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-800',
      description: 'Leads aprobados para continuar el proceso'
    },
    {
      label: 'Rechazados',
      value: metrics.rechazados,
      icon: XCircle,
      color: 'bg-red-100 text-red-800',
      description: 'Leads que no cumplen con los criterios'
    },
    {
      label: 'Otros Estados',
      value: metrics.pendientes,
      icon: PhoneCall,
      color: 'bg-gray-100 text-gray-800',
      description: 'Leads en otros estados del proceso'
    }
  ];

  // Calcular porcentajes
  const totalActive = metrics.total_leads;
  const conversionRate = totalActive > 0 ? ((metrics.aprobados / totalActive) * 100).toFixed(1) : '0';
  const rejectionRate = totalActive > 0 ? ((metrics.rechazados / totalActive) * 100).toFixed(1) : '0';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Estado Detallado de Leads
        </CardTitle>
        <CardDescription>
          Seguimiento detallado del estado de los {metrics.total_leads} leads en el sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {statusItems.map((item) => {
            const Icon = item.icon;
            const percentage = totalActive > 0 ? ((item.value / totalActive) * 100).toFixed(1) : '0';
            
            return (
              <div
                key={item.label}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background border">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                    <p className="text-xs text-muted-foreground">{percentage}% del total</p>
                  </div>
                </div>
                <Badge className={item.color} variant="secondary">
                  {item.value}
                </Badge>
              </div>
            );
          })}
        </div>

        {/* Resumen rápido */}
        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <h4 className="text-sm font-semibold mb-2">Resumen de Actividad</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-orange-600">{metrics.sin_asignar}</p>
              <p className="text-xs text-muted-foreground">Sin Asignar</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{metrics.contacto_inicial}</p>
              <p className="text-xs text-muted-foreground">En Contacto</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{metrics.aprobados}</p>
              <p className="text-xs text-muted-foreground">Aprobados</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{metrics.rechazados}</p>
              <p className="text-xs text-muted-foreground">Rechazados</p>
            </div>
          </div>
          
          {/* Métricas de conversión */}
          <div className="mt-4 grid grid-cols-2 gap-4 text-center">
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-lg font-semibold text-green-700">{conversionRate}%</p>
              <p className="text-xs text-green-600">Tasa de Aprobación</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <p className="text-lg font-semibold text-red-700">{rejectionRate}%</p>
              <p className="text-xs text-red-600">Tasa de Rechazo</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeadsStatusCard;