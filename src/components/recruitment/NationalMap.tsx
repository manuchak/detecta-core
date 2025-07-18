import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Users, MapPin } from 'lucide-react';
import type { ZonaOperacion, MetricaDemandaZona, AlertaSistema, CandidatoCustodio } from '@/hooks/useNationalRecruitment';

interface NationalMapProps {
  zonas: ZonaOperacion[];
  metricas: MetricaDemandaZona[];
  alertas: AlertaSistema[];
  candidatos: CandidatoCustodio[];
}

export const NationalMap: React.FC<NationalMapProps> = ({ 
  zonas, 
  metricas, 
  alertas, 
  candidatos 
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Usar el token de Mapbox del componente existente
    mapboxgl.accessToken = 'pk.eyJ1IjoiZGV0ZWN0YXNlYyIsImEiOiJjbTlzdjg3ZmkwNGVoMmpwcGg3MWMwNXlhIn0.zIQ8khHoZsJt8bL4jXf35Q';
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-102.5528, 23.6345], // Centro de México
      zoom: 5,
      projection: 'mercator'
    });

    // Agregar controles de navegación
    map.current.addControl(
      new mapboxgl.NavigationControl(),
      'top-right'
    );

    // Agregar escala
    map.current.addControl(
      new mapboxgl.ScaleControl({
        maxWidth: 100,
        unit: 'metric'
      }),
      'bottom-left'
    );

    // Cuando el mapa esté cargado, agregar marcadores
    map.current.on('load', () => {
      // Agregar marcadores para cada zona
      zonas.forEach(zona => {
        if (!zona.coordenadas_centro || !map.current) return;

        const metrica = metricas.find(m => m.zona_id === zona.id);
        const alertasZona = alertas.filter(a => a.zona_id === zona.id);
        const candidatosZona = candidatos.filter(c => c.zona_preferida_id === zona.id);

        // Determinar color basado en urgencia
        let color = '#22c55e'; // Verde por defecto
        let alertIcon = '';
        
        if (alertasZona.some(a => a.tipo_alerta === 'critica')) {
          color = '#ef4444'; // Rojo para crítico
          alertIcon = '🚨';
        } else if (alertasZona.some(a => a.tipo_alerta === 'preventiva')) {
          color = '#f59e0b'; // Amarillo para preventivo
          alertIcon = '⚠️';
        } else if (alertasZona.some(a => a.tipo_alerta === 'estrategica')) {
          color = '#3b82f6'; // Azul para estratégico
          alertIcon = '📈';
        }

        // Crear popup con información detallada
        const popupContent = `
          <div style="padding: 8px; max-width: 300px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #1f2937;">${alertIcon} ${zona.nombre}</h3>
            <div style="margin-bottom: 8px;">
              <p style="margin: 2px 0; font-size: 12px; color: #6b7280;">
                <strong>Estados:</strong> ${zona.estados_incluidos?.join(', ') || 'N/A'}
              </p>
              <p style="margin: 2px 0; font-size: 12px; color: #6b7280;">
                <strong>Prioridad:</strong> ${zona.prioridad_reclutamiento || 'N/A'}/10
              </p>
            </div>
            ${metrica ? `
              <div style="border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 8px;">
                <p style="margin: 2px 0; font-size: 12px;">
                  👥 <strong>Custodios:</strong> ${metrica.custodios_activos || 0} / ${metrica.custodios_requeridos || 0}
                </p>
                <p style="margin: 2px 0; font-size: 12px;">
                  📊 <strong>Servicios/día:</strong> ${metrica.servicios_promedio_dia || 0}
                </p>
                <p style="margin: 2px 0; font-size: 12px;">
                  🚨 <strong>Score urgencia:</strong> ${metrica.score_urgencia || 0}/10
                </p>
                ${metrica.deficit_custodios && metrica.deficit_custodios > 0 ? `
                  <p style="margin: 2px 0; font-size: 12px; color: #ef4444;">
                    ⚠️ <strong>Déficit:</strong> ${metrica.deficit_custodios} custodios
                  </p>
                ` : ''}
              </div>
            ` : ''}
            ${alertasZona.length > 0 ? `
              <div style="border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 8px;">
                <p style="margin: 2px 0; font-size: 12px; font-weight: bold;">🔔 Alertas activas: ${alertasZona.length}</p>
                ${alertasZona.slice(0, 2).map(a => `
                  <p style="margin: 2px 0; font-size: 11px; color: #6b7280;">• ${a.titulo}</p>
                `).join('')}
              </div>
            ` : ''}
            ${candidatosZona.length > 0 ? `
              <div style="border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 8px;">
                <p style="margin: 2px 0; font-size: 12px;">
                  🎯 <strong>Candidatos en pipeline:</strong> ${candidatosZona.length}
                </p>
              </div>
            ` : ''}
          </div>
        `;

        const popup = new mapboxgl.Popup({ 
          offset: 25,
          closeButton: true,
          closeOnClick: false
        }).setHTML(popupContent);

        // Crear marcador personalizado
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.style.cssText = `
          background-color: ${color};
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: white;
          font-size: 12px;
          transition: transform 0.2s;
        `;
        
        // Agregar texto del número de custodios o déficit
        const custodiosText = String(metrica?.custodios_activos || 0);
        el.textContent = custodiosText;

        // Efecto hover
        el.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.2)';
        });
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'scale(1)';
        });

        new mapboxgl.Marker(el)
          .setLngLat([zona.coordenadas_centro[0], zona.coordenadas_centro[1]])
          .setPopup(popup)
          .addTo(map.current!);
      });

      // Agregar marcadores para candidatos individuales
      candidatos.forEach(candidato => {
        if (!candidato.ubicacion_residencia || !map.current) return;

        const estadoColor = {
          'lead': '#94a3b8',
          'contactado': '#fbbf24',
          'entrevista': '#f59e0b',
          'documentacion': '#3b82f6',
          'capacitacion': '#10b981',
          'activo': '#22c55e'
        }[candidato.estado_proceso || 'lead'] || '#94a3b8';

        const popupContent = `
          <div style="padding: 8px; max-width: 250px;">
            <h4 style="margin: 0 0 8px 0; font-weight: bold;">${candidato.nombre}</h4>
            <p style="margin: 2px 0; font-size: 12px;">
              <strong>Estado:</strong> ${candidato.estado_proceso || 'Lead'}
            </p>
            <p style="margin: 2px 0; font-size: 12px;">
              <strong>Fuente:</strong> ${candidato.fuente_reclutamiento || 'N/A'}
            </p>
            <p style="margin: 2px 0; font-size: 12px;">
              <strong>Calificación:</strong> ${candidato.calificacion_inicial || 'N/A'}/10
            </p>
            ${candidato.telefono ? `
              <p style="margin: 2px 0; font-size: 12px;">
                <strong>Teléfono:</strong> ${candidato.telefono}
              </p>
            ` : ''}
            ${candidato.experiencia_seguridad ? '<p style="margin: 2px 0; font-size: 12px; color: #22c55e;">✓ Experiencia en seguridad</p>' : ''}
            ${candidato.vehiculo_propio ? '<p style="margin: 2px 0; font-size: 12px; color: #22c55e;">✓ Vehículo propio</p>' : ''}
          </div>
        `;

        const popup = new mapboxgl.Popup({ offset: 15 }).setHTML(popupContent);

        // Crear marcador más pequeño para candidatos
        const el = document.createElement('div');
        el.style.cssText = `
          background-color: ${estadoColor};
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 1px 2px rgba(0,0,0,0.3);
          cursor: pointer;
        `;

        new mapboxgl.Marker(el)
          .setLngLat([candidato.ubicacion_residencia[0], candidato.ubicacion_residencia[1]])
          .setPopup(popup)
          .addTo(map.current!);
      });
    });

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [zonas, metricas, alertas, candidatos]);

  return (
    <div className="space-y-4">
      {/* Leyenda */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-destructive border border-white"></div>
          <span>Zonas Críticas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-warning border border-white"></div>
          <span>Zonas Preventivas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-success border border-white"></div>
          <span>Zonas Saludables</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-muted border border-white"></div>
          <span>Candidatos</span>
        </div>
      </div>

      {/* Mapa */}
      <div 
        ref={mapContainer} 
        className="w-full h-[600px] rounded-lg border border-border shadow-sm"
      />
      
      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Zonas Totales</p>
              <p className="text-lg font-semibold">{zonas.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <div>
              <p className="text-sm text-muted-foreground">Con Alertas</p>
              <p className="text-lg font-semibold">
                {alertas.filter((a, i, arr) => arr.findIndex(b => b.zona_id === a.zona_id) === i).length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-success" />
            <div>
              <p className="text-sm text-muted-foreground">Candidatos</p>
              <p className="text-lg font-semibold">{candidatos.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-warning" />
            <div>
              <p className="text-sm text-muted-foreground">Custodios Activos</p>
              <p className="text-lg font-semibold">
                {metricas.reduce((sum, m) => sum + (m.custodios_activos || 0), 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};