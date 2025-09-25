import { 
  AlertTriangle, 
  Clock, 
  Users, 
  CheckCircle, 
  TrendingUp,
  MessageSquare,
  MapPin,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
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
    <div className="apple-container space-y-8">
      {/* Header */}
      <div className="apple-section-header">
        <div>
          <h1 className="apple-text-largetitle text-foreground">Panel Operacional</h1>
          <p className="apple-text-body text-muted-foreground">
            Resumen de operaciones y acciones prioritarias
          </p>
        </div>
        <div className="text-right">
          <p className="apple-text-caption text-muted-foreground">
            {format(new Date(), "dd/MM HH:mm")}
          </p>
        </div>
      </div>

      {/* Critical Alert */}
      {serviciosPendientesHoy.length > 0 && (
        <div className="apple-card border-l-4 border-l-destructive bg-destructive/5">
          <div className="flex items-start gap-4 p-4">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="apple-text-headline font-semibold text-destructive">
                Atención Inmediata Requerida
              </h3>
              <p className="apple-text-body text-muted-foreground mt-1">
                {serviciosPendientesHoy.length} servicios requieren asignación para hoy
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hero Metrics */}
      <div className="apple-grid-metrics">
        <div className="apple-card-metric">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-lg">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="apple-text-caption text-muted-foreground">Servicios Hoy</p>
              <p className="apple-text-title font-bold text-primary">
                {serviciosPendientesHoy.length}
              </p>
            </div>
          </div>
        </div>

        <div className="apple-card-metric">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-500/10 rounded-lg">
              <Users className="h-5 w-5 text-green-600 dark:text-green-500" />
            </div>
            <div className="flex-1">
              <p className="apple-text-caption text-muted-foreground">Custodios Disponibles</p>
              <p className="apple-text-title font-bold text-green-600 dark:text-green-500">
                {custodiosDisponibles.length}
              </p>
            </div>
          </div>
        </div>

        <div className="apple-card-metric">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-500/10 rounded-lg">
              <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-500" />
            </div>
            <div className="flex-1">
              <p className="apple-text-caption text-muted-foreground">Sin Asignar</p>
              <p className="apple-text-title font-bold text-orange-600 dark:text-orange-500">
                {serviciosSinCustodio.length}
              </p>
            </div>
          </div>
        </div>

        <div className="apple-card-metric">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-500" />
            </div>
            <div className="flex-1">
              <p className="apple-text-caption text-muted-foreground">Por Vencer</p>
              <p className="apple-text-title font-bold text-purple-600 dark:text-purple-500">
                {serviciosProximosVencer.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Priority Actions */}
      <div className="apple-grid-actions">
        <div className="apple-surface-elevated p-6">
          <div className="apple-section-header mb-4">
            <h3 className="apple-text-headline flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Acciones Prioritarias
            </h3>
            <p className="apple-text-body text-muted-foreground">
              Servicios que requieren atención inmediata
            </p>
          </div>
          <div className="apple-list">
            {serviciosPendientesHoy.length > 0 ? (
              serviciosPendientesHoy.slice(0, 3).map((servicio) => (
                <div key={servicio.id} className="apple-list-item">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="apple-text-body font-medium text-foreground truncate">
                        {servicio.folio || 'Sin folio'}
                      </p>
                      <p className="apple-text-caption text-muted-foreground">
                        {servicio.destino_texto || 'Sin destino'} • {servicio.hora_ventana_inicio || 'Sin horario'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {!servicio.custodio_asignado && (
                        <button className="apple-button-primary">
                          <Users className="h-4 w-4 mr-1" />
                          Asignar
                        </button>
                      )}
                      <button className="apple-button-ghost">
                        <MessageSquare className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
                <p className="apple-text-body text-muted-foreground">
                  No hay servicios pendientes para hoy
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="apple-surface-elevated p-6">
          <div className="apple-section-header mb-4">
            <h3 className="apple-text-headline flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Resumen por Zona
            </h3>
            <p className="apple-text-body text-muted-foreground">
              Disponibilidad de custodios por zona
            </p>
          </div>
          <div className="apple-list">
            {['Norte', 'Sur', 'Centro', 'Oriente'].map((zona) => {
              const custodiosZona = custodiosDisponibles.filter(c => 
                c.zona_base?.toLowerCase().includes(zona.toLowerCase())
              ).length;
              const totalZona = custodios.filter(c => 
                c.zona_base?.toLowerCase().includes(zona.toLowerCase())
              ).length;
              
              return (
                <div key={zona} className="apple-list-item">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="apple-text-body font-medium text-foreground">
                        {zona}
                      </p>
                      <p className="apple-text-caption text-muted-foreground">
                        {custodiosZona} de {totalZona} disponibles
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        custodiosZona > totalZona * 0.7 ? 'bg-green-500' : 
                        custodiosZona > totalZona * 0.3 ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <span className="apple-text-caption font-medium text-foreground min-w-[3ch]">
                        {totalZona > 0 ? Math.round((custodiosZona / totalZona) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}