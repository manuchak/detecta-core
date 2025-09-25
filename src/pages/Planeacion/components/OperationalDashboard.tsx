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
    <div className="space-y-8">
      {/* Header */}
      <div className="apple-header-section">
        <div>
          <h1 className="apple-text-largetitle">Dashboard</h1>
          <p className="apple-text-body text-secondary">
            Vista general de operaciones diarias
          </p>
        </div>
        <Button variant="ghost" size="sm" className="apple-button-ghost">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Critical Alerts - Only show when needed */}
      {serviciosProximosVencer.length > 0 && (
        <div className="apple-alert-critical">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
            <div className="flex-1">
              <div className="apple-text-headline text-red-900">Atención Requerida</div>
              <div className="apple-text-body text-red-700 mt-1">
                {serviciosProximosVencer.length} servicios necesitan custodio urgentemente
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Metrics */}
      <div className="apple-metrics-grid">
        <div className="apple-metric-card apple-metric-critical">
          <div className="apple-metric-value">{serviciosPendientesHoy.length}</div>
          <div className="apple-metric-label">Pendientes Hoy</div>
        </div>

        <div className="apple-metric-card apple-metric-success">
          <div className="apple-metric-value">{custodiosDisponibles.length}</div>
          <div className="apple-metric-label">Custodios Disponibles</div>
        </div>

        <div className="apple-metric-card apple-metric-warning">
          <div className="apple-metric-value">{serviciosSinCustodio.length}</div>
          <div className="apple-metric-label">Sin Asignar</div>
        </div>

        <div className="apple-metric-card apple-metric-neutral">
          <div className="apple-metric-value">
            {servicios.length > 0 
              ? Math.round((servicios.filter(s => s.custodio_asignado).length / servicios.length) * 100)
              : 0
            }%
          </div>
          <div className="apple-metric-label">Tasa Asignación</div>
        </div>
      </div>

      {/* Priority Actions */}
      <div className="space-y-6">
        <h2 className="apple-text-title">Acciones Prioritarias</h2>
        
        <div className="apple-action-list">
          {serviciosPendientesHoy.slice(0, 5).map(servicio => (
            <div key={servicio.id} className="apple-action-item">
              <div className="flex-1">
                <div className="apple-text-headline">{servicio.folio}</div>
                <div className="apple-text-caption text-secondary">
                  {servicio.hora_ventana_inicio} - {servicio.destino_texto}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="apple-button-ghost-small">
                  <PhoneCall className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="apple-button-ghost-small">
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          
          {serviciosPendientesHoy.length === 0 && (
            <div className="apple-empty-state">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-3" />
              <div className="apple-text-headline text-secondary">Todo al día</div>
              <div className="apple-text-body text-tertiary">No hay servicios pendientes</div>
            </div>
          )}
        </div>
      </div>

      {/* Zone Overview */}
      <div className="space-y-6">
        <h2 className="apple-text-title">Cobertura por Zona</h2>
        
        <div className="apple-zone-grid">
          {['Norte', 'Sur', 'Centro', 'Oriente'].map(zona => {
            const custodiosZona = custodiosDisponibles.filter(c => 
              c.zona_base?.toLowerCase().includes(zona.toLowerCase())
            ).length;
            
            return (
              <div key={zona} className="apple-zone-card">
                <div className="apple-text-headline">{zona}</div>
                <div className="apple-text-body text-secondary">
                  {custodiosZona} disponibles
                </div>
                <div className={`apple-zone-indicator ${custodiosZona > 0 ? 'active' : 'inactive'}`} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}