import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Users, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  MapPin,
  TrendingUp,
  PlusCircle,
  AlertTriangle,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { usePlaneacionStats, useServicios, useCustodios } from '@/hooks/usePlaneacion';
import { RequestCreationWorkflow } from './RequestCreationWorkflow';

export function OperationalDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('es-ES'));
  const [showCreateWorkflow, setShowCreateWorkflow] = useState(false);
  
  const { data: stats } = usePlaneacionStats();
  const { data: servicios = [] } = useServicios();
  const { data: custodios = [] } = useCustodios();

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('es-ES'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

      {/* Primary Action Hero Section */}
      <div className="apple-section">
        <div className="apple-section-header">
          <h2 className="apple-section-title">Acción Principal</h2>
          <p className="apple-section-description">Crear un nuevo servicio con el flujo completo guiado</p>
        </div>
        <div className="flex justify-center">
          <button 
            onClick={() => setShowCreateWorkflow(true)}
            className="apple-quick-action apple-quick-action-primary w-full max-w-lg"
          >
            <div className="apple-quick-action-icon">
              <PlusCircle className="h-8 w-8" />
            </div>
            <div className="text-left">
              <div className="apple-quick-action-title text-lg">Crear Nuevo Servicio</div>
              <div className="apple-quick-action-subtitle">Flujo completo paso a paso con validación</div>
            </div>
          </button>
        </div>
      </div>

      {/* Critical Alert */}
      {serviciosPendientesHoy.length > 0 && (
        <div className="apple-alert">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="apple-alert-title">
                Atención Inmediata Requerida
              </h3>
              <p className="apple-alert-description">
                {serviciosPendientesHoy.length} servicios requieren asignación para hoy
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
              {serviciosPendientesHoy.length}
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
              {custodiosDisponibles.length}
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
              {serviciosSinCustodio.length}
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
              {serviciosProximosVencer.length}
            </div>
            <div className="apple-metric-label">Por Vencer</div>
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
            {serviciosPendientesHoy.length > 0 ? (
              serviciosPendientesHoy.slice(0, 3).map((servicio) => (
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
                      {!servicio.custodio_asignado && (
                        <Button size="sm" className="apple-button">
                          <Users className="h-4 w-4 mr-1" />
                          Asignar
                        </Button>
                      )}
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
                  No hay servicios pendientes para hoy
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
            {['Norte', 'Sur', 'Centro', 'Oriente'].map((zona) => {
              const custodiosZona = custodiosDisponibles.filter(c => 
                c.zona_base?.toLowerCase().includes(zona.toLowerCase())
              ).length;
              const totalZona = custodios.filter(c => 
                c.zona_base?.toLowerCase().includes(zona.toLowerCase())
              ).length;
              
              return (
                <div key={zona} className="apple-zone-card">
                  <div className="apple-zone-header">
                    <span className="apple-zone-title">{zona}</span>
                    <div className={`w-2 h-2 rounded-full ${
                      custodiosZona > totalZona * 0.7 ? 'bg-green-500' : 
                      custodiosZona > totalZona * 0.3 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                  </div>
                  <div className="apple-zone-percentage">
                    {totalZona > 0 ? Math.round((custodiosZona / totalZona) * 100) : 0}%
                  </div>
                  <div className="apple-zone-availability">
                    {custodiosZona} de {totalZona} disponibles
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Create Service Modal */}
      <Dialog open={showCreateWorkflow} onOpenChange={setShowCreateWorkflow}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Servicio</DialogTitle>
          </DialogHeader>
          <RequestCreationWorkflow />
        </DialogContent>
      </Dialog>
    </div>
  );
}