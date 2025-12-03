import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  MapPin,
  TrendingUp,
  AlertTriangle,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useServiciosHoy, useCustodiosDisponibles, useZonasOperativas } from '@/hooks/useServiciosHoy';

interface OperationalDashboardProps {
  showCreateWorkflow: boolean;
  setShowCreateWorkflow: (show: boolean) => void;
}

export function OperationalDashboard({ showCreateWorkflow, setShowCreateWorkflow }: OperationalDashboardProps) {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('es-ES'));
  
  const { data: serviciosHoy = [], isLoading: loadingServicios } = useServiciosHoy();
  const { data: custodiosDisponibles = [], isLoading: loadingCustodios } = useCustodiosDisponibles();
  const { data: zonasOperativas = [], isLoading: loadingZonas } = useZonasOperativas();

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('es-ES'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // KPIs operativos reales desde servicios_planificados
  const serviciosSinCustodio = serviciosHoy.filter(s => 
    !s.custodio_asignado || s.custodio_asignado === ''
  );

  const serviciosProximosVencer = serviciosHoy.filter(s => {
    if (!s.fecha_hora_cita) return false;
    const fechaServicio = new Date(s.fecha_hora_cita);
    const ahora = new Date();
    const diffHoras = (fechaServicio.getTime() - ahora.getTime()) / (1000 * 60 * 60);
    return diffHoras > 0 && diffHoras < 4 && !s.custodio_asignado;
  });

  const isLoading = loadingServicios || loadingCustodios || loadingZonas;

  return (
    <div className="apple-layout">
      {/* Header */}
      <div className="apple-header">
        <div>
          <h1 className="apple-title">Dashboard Operacional</h1>
          <p className="apple-subtitle">
            {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: es })} • {currentTime}
          </p>
        </div>
      </div>

      {/* Critical Alert */}
      {serviciosSinCustodio.length > 0 && (
        <div className="apple-alert">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="apple-alert-title">
                Atención Inmediata Requerida
              </h3>
              <p className="apple-alert-description">
                {serviciosSinCustodio.length} servicios requieren asignación de custodio para hoy
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hero Metrics */}
      <div className="apple-metrics">
        <div className="apple-metric apple-metric-primary">
          <div className="apple-metric-icon">
            <Clock className="h-6 w-6" />
          </div>
          <div className="apple-metric-content">
            <div className="apple-metric-value">
              {isLoading ? '...' : serviciosHoy.length}
            </div>
            <div className="apple-metric-label">Servicios Hoy</div>
          </div>
        </div>

        <div className="apple-metric apple-metric-success">
          <div className="apple-metric-icon">
            <Users className="h-6 w-6" />
          </div>
          <div className="apple-metric-content">
            <div className="apple-metric-value">
              {isLoading ? '...' : custodiosDisponibles.length}
            </div>
            <div className="apple-metric-label">Custodios Disponibles</div>
          </div>
        </div>

        <div className="apple-metric apple-metric-warning">
          <div className="apple-metric-icon">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="apple-metric-content">
            <div className="apple-metric-value">
              {isLoading ? '...' : serviciosSinCustodio.length}
            </div>
            <div className="apple-metric-label">Sin Asignar</div>
          </div>
        </div>

        <div className="apple-metric apple-metric-neutral">
          <div className="apple-metric-icon">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div className="apple-metric-content">
            <div className="apple-metric-value">
              {isLoading ? '...' : serviciosProximosVencer.length}
            </div>
            <div className="apple-metric-label">Por Vencer (4h)</div>
          </div>
        </div>
      </div>

      {/* Priority Actions */}
      <div className="apple-actions">
        <div className="apple-card">
          <div className="apple-section-header">
            <h3 className="apple-section-title flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Acciones Prioritarias
            </h3>
            <p className="apple-section-description">
              Servicios que requieren atención inmediata
            </p>
          </div>
          <div className="apple-list">
            {serviciosSinCustodio.length > 0 ? (
              serviciosSinCustodio.slice(0, 5).map((servicio) => (
                <div key={servicio.id} className="apple-list-item">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="apple-list-title">
                        {servicio.folio || 'Sin folio'}
                      </p>
                      <p className="apple-list-description">
                        {servicio.destino_texto || 'Sin destino'} • {servicio.hora_ventana_inicio || 'Sin horario'}
                      </p>
                    </div>
                    <div className="apple-list-actions">
                      <Button size="sm" className="apple-button">
                        <Users className="h-4 w-4 mr-1" />
                        Asignar
                      </Button>
                      <Button size="sm" variant="ghost">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="apple-empty-state">
                <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {serviciosHoy.length > 0 
                    ? 'Todos los servicios tienen custodio asignado' 
                    : 'No hay servicios programados para hoy'}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="apple-card">
          <div className="apple-section-header">
            <h3 className="apple-section-title flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Resumen por Zona
            </h3>
            <p className="apple-section-description">
              Disponibilidad de custodios por zona
            </p>
          </div>
          <div className="apple-zones">
            {zonasOperativas.length > 0 ? (
              zonasOperativas.slice(0, 4).map((zona) => (
                <div key={zona.zona} className="apple-zone-card">
                  <div className="apple-zone-header">
                    <span className="apple-zone-title">{zona.zona}</span>
                    <div className={`w-2 h-2 rounded-full ${
                      zona.porcentaje > 70 ? 'bg-green-500' : 
                      zona.porcentaje > 30 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                  </div>
                  <div className="apple-zone-percentage">
                    {zona.porcentaje}%
                  </div>
                  <div className="apple-zone-availability">
                    {zona.disponibles} de {zona.total} disponibles
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-4 text-muted-foreground">
                {isLoading ? 'Cargando zonas...' : 'Sin datos de zonas'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
