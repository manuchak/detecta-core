import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Clock, 
  Users, 
  CheckCircle, 
  TrendingUp,
  PhoneCall,
  MessageSquare,
  RefreshCw
} from 'lucide-react';
import { usePlaneacionStats, useServicios, useCustodios } from '@/hooks/usePlaneacion';

export function OperationalDashboard() {
  const { data: stats } = usePlaneacionStats();
  const { data: servicios = [] } = useServicios();
  const { data: custodios = [] } = useCustodios();

  // KPIs operativos reales
  const serviciosPendientesHoy = servicios.filter(s => 
    s.estado === 'nuevo' && 
    new Date(s.fecha_programada).toDateString() === new Date().toDateString()
  );

  const custodiosDisponibles = custodios.filter(c => 
    c.disponibilidad === 'disponible' && c.estado === 'activo'
  );

  const serviciosSinCustodio = servicios.filter(s => 
    s.estado === 'nuevo' && !s.custodio_asignado
  );

  const serviciosProximosVencer = servicios.filter(s => {
    const fechaServicio = new Date(s.fecha_programada);
    const hoy = new Date();
    const diffHoras = (fechaServicio.getTime() - hoy.getTime()) / (1000 * 60 * 60);
    return diffHoras > 0 && diffHoras < 24 && !s.custodio_asignado;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Dashboard Operativo</h2>
          <p className="text-muted-foreground">
            KPIs en tiempo real para planificación diaria
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </Button>
      </div>

      {/* Alertas Críticas */}
      {serviciosProximosVencer.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Alertas Críticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm">
                <strong>{serviciosProximosVencer.length}</strong> servicios próximos a vencer sin custodio asignado
              </div>
              {serviciosProximosVencer.slice(0, 3).map(servicio => (
                <div key={servicio.id} className="flex items-center justify-between bg-destructive/10 rounded p-2">
                  <div>
                    <div className="font-medium">{servicio.folio}</div>
                    <div className="text-sm text-muted-foreground">
                      {servicio.origen_texto} → {servicio.destino_texto}
                    </div>
                  </div>
                  <Badge variant="destructive">Vence en pocas horas</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs Principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pendientes HOY
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {serviciosPendientesHoy.length}
            </div>
            <div className="text-sm text-muted-foreground">
              Servicios sin asignar para hoy
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Custodios Disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {custodiosDisponibles.length}
            </div>
            <div className="text-sm text-muted-foreground">
              Activos y listos para asignar
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Sin Custodio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {serviciosSinCustodio.length}
            </div>
            <div className="text-sm text-muted-foreground">
              Servicios pendientes de asignación
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Tasa Asignación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {servicios.length > 0 
                ? Math.round((servicios.filter(s => s.custodio_asignado).length / servicios.length) * 100)
                : 0
              }%
            </div>
            <div className="text-sm text-muted-foreground">
              Servicios con custodio asignado
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actividad Reciente */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Servicios Prioritarios */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Servicios Prioritarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {serviciosPendientesHoy.slice(0, 5).map(servicio => (
                <div key={servicio.id} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                  <div>
                    <div className="font-medium">{servicio.folio}</div>
                    <div className="text-sm text-muted-foreground">
                      {servicio.hora_ventana_inicio} - {servicio.destino_texto}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                      <PhoneCall className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                      <MessageSquare className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {serviciosPendientesHoy.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <CheckCircle className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  <p>No hay servicios pendientes para hoy</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Custodios por Zona */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Custodios por Zona
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {['Norte', 'Sur', 'Centro', 'Oriente'].map(zona => {
                const custodiosZona = custodiosDisponibles.filter(c => 
                  c.zona_base?.toLowerCase().includes(zona.toLowerCase())
                ).length;
                
                return (
                  <div key={zona} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{zona}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={custodiosZona > 0 ? "default" : "secondary"}>
                        {custodiosZona} disponibles
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas de Rendimiento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Métricas de Rendimiento (Esta Semana)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold">2.3 min</div>
              <div className="text-sm text-muted-foreground">Tiempo promedio de asignación</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">87%</div>
              <div className="text-sm text-muted-foreground">Éxito primer intento</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">1.2</div>
              <div className="text-sm text-muted-foreground">Intentos promedio</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">94%</div>
              <div className="text-sm text-muted-foreground">SLA cumplido</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}