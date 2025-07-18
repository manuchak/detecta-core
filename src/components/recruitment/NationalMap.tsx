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
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // Función para limpiar markers existentes
  const clearMarkers = () => {
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
  };

  // Función para agregar solo las zonas más críticas como polígonos
  const addCriticalZones = () => {
    if (!map.current) return;

    zonas.forEach(zona => {
      if (!zona.coordenadas_centro) return;

      const metrica = metricas.find(m => m.zona_id === zona.id);
      const alertasZona = alertas.filter(a => a.zona_id === zona.id);
      
      const scoreUrgencia = metrica?.score_urgencia || 0;
      const deficitCustodios = metrica?.deficit_custodios || 0;
      
      // Solo mostrar polígonos para zonas críticas y urgentes
      const isCritical = alertasZona.some(a => a.tipo_alerta === 'critica') || scoreUrgencia >= 8 || deficitCustodios > 10;
      const isUrgent = alertasZona.some(a => a.tipo_alerta === 'preventiva') || scoreUrgencia >= 6 || deficitCustodios > 5;
      
      if (isCritical || isUrgent) {
        const color = isCritical ? 'rgba(220, 38, 38, 0.2)' : 'rgba(234, 88, 12, 0.2)';
        const borderColor = isCritical ? '#dc2626' : '#ea580c';

        const circle = {
          type: 'Feature',
          properties: { name: zona.nombre },
          geometry: {
            type: 'Point',
            coordinates: zona.coordenadas_centro
          }
        } as const;

        const layerId = `zone-${zona.id}`;
        
        if (!map.current!.getSource(layerId)) {
          map.current!.addSource(layerId, {
            type: 'geojson',
            data: circle
          });

          // Círculo de fondo para zonas críticas
          map.current!.addLayer({
            id: `${layerId}-fill`,
            type: 'circle',
            source: layerId,
            paint: {
              'circle-radius': {
                stops: [
                  [4, 40],
                  [8, 80],
                  [12, 120]
                ]
              },
              'circle-color': color,
              'circle-stroke-color': borderColor,
              'circle-stroke-width': 3,
              'circle-opacity': 0.7
            }
          });
        }
      }
    });
  };

  // Función para agregar markers de zonas (centros)
  const addZoneMarkers = () => {
    if (!map.current) return;

    zonas.forEach(zona => {
      if (!zona.coordenadas_centro) return;

      const metrica = metricas.find(m => m.zona_id === zona.id);
      const alertasZona = alertas.filter(a => a.zona_id === zona.id);
      const candidatosZona = candidatos.filter(c => c.zona_preferida_id === zona.id);

      // Sistema de colores basado en urgencia real
      let color = '#22c55e'; // Verde - Saludable
      let prioridadTexto = 'Saludable';
      let alertIcon = '✅';
      
      const scoreUrgencia = metrica?.score_urgencia || 0;
      const deficitCustodios = metrica?.deficit_custodios || 0;
      
      if (alertasZona.some(a => a.tipo_alerta === 'critica') || scoreUrgencia >= 8 || deficitCustodios > 10) {
        color = '#dc2626'; // Rojo intenso - CRÍTICO
        prioridadTexto = 'CRÍTICO';
        alertIcon = '🚨';
      } else if (alertasZona.some(a => a.tipo_alerta === 'preventiva') || scoreUrgencia >= 6 || deficitCustodios > 5) {
        color = '#ea580c'; // Naranja - URGENTE
        prioridadTexto = 'URGENTE';
        alertIcon = '⚠️';
      } else if (scoreUrgencia >= 4 || deficitCustodios > 0) {
        color = '#2563eb'; // Azul - ATENCIÓN
        prioridadTexto = 'ATENCIÓN';
        alertIcon = '📋';
      }

      // Crear popup con información clara
      const popupContent = `
        <div style="padding: 12px; max-width: 320px; font-family: system-ui;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
            <span style="font-size: 20px;">${alertIcon}</span>
            <div>
              <h3 style="margin: 0; font-size: 16px; font-weight: bold;">${zona.nombre}</h3>
              <span style="background: ${color}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">
                ${prioridadTexto}
              </span>
            </div>
          </div>
          
          <div style="background: #f8fafc; padding: 8px; border-radius: 6px; margin-bottom: 8px;">
            <p style="margin: 4px 0; font-size: 12px;">
              <strong>📍 Estados:</strong> ${zona.estados_incluidos?.join(', ') || 'N/A'}
            </p>
            <p style="margin: 4px 0; font-size: 12px;">
              <strong>🎯 Prioridad:</strong> ${zona.prioridad_reclutamiento || 'N/A'}/10
            </p>
          </div>

          ${metrica ? `
            <div style="border-top: 1px solid #e2e8f0; padding-top: 8px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
                <div style="text-align: center; background: #f1f5f9; padding: 6px; border-radius: 4px;">
                  <div style="font-weight: bold; color: ${deficitCustodios > 0 ? '#dc2626' : '#059669'};">
                    ${metrica.custodios_activos || 0}/${metrica.custodios_requeridos || 0}
                  </div>
                  <div style="font-size: 10px; color: #64748b;">Custodios</div>
                </div>
                <div style="text-align: center; background: #f1f5f9; padding: 6px; border-radius: 4px;">
                  <div style="font-weight: bold; color: #0f172a;">
                    ${metrica.servicios_promedio_dia || 0}
                  </div>
                  <div style="font-size: 10px; color: #64748b;">Servicios/día</div>
                </div>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 12px;"><strong>Score urgencia:</strong></span>
                <span style="background: ${scoreUrgencia >= 7 ? '#dc2626' : scoreUrgencia >= 5 ? '#ea580c' : '#059669'}; 
                            color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: bold;">
                  ${scoreUrgencia}/10
                </span>
              </div>
              
              ${deficitCustodios > 0 ? `
                <div style="background: #fee2e2; border: 1px solid #fecaca; padding: 6px; border-radius: 4px; margin-top: 8px;">
                  <p style="margin: 0; font-size: 12px; color: #dc2626; font-weight: bold;">
                    ⚠️ DÉFICIT: ${deficitCustodios} custodios faltantes
                  </p>
                </div>
              ` : ''}
            </div>
          ` : ''}

          ${candidatosZona.length > 0 ? `
            <div style="background: #f0f9ff; border-left: 3px solid #0ea5e9; padding: 8px; margin-top: 8px;">
              <p style="margin: 0; font-size: 12px;">
                🎯 <strong>${candidatosZona.length} candidatos</strong> en pipeline
              </p>
            </div>
          ` : ''}

          ${alertasZona.length > 0 ? `
            <div style="border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 8px;">
              <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: bold; color: #dc2626;">
                🔔 ${alertasZona.length} alerta(s) activa(s):
              </p>
              ${alertasZona.slice(0, 3).map(a => `
                <div style="background: #fef2f2; padding: 4px 6px; margin: 2px 0; border-radius: 3px; border-left: 2px solid #ef4444;">
                  <span style="font-size: 11px; font-weight: 500;">${a.titulo}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;

      const popup = new mapboxgl.Popup({ 
        offset: 25,
        closeButton: true,
        closeOnClick: false,
        maxWidth: '350px'
      }).setHTML(popupContent);

      // Marcador más prominente con mejor indicación visual
      const el = document.createElement('div');
      el.className = 'custom-marker zone-marker';
      el.style.cssText = `
        background: linear-gradient(135deg, ${color}, ${color}dd);
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 0 0 2px ${color}44;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: white;
        font-size: 14px;
        position: relative;
      `;
      
      // Mostrar número de custodios activos o déficit
      const displayText = deficitCustodios > 0 ? `-${deficitCustodios}` : String(metrica?.custodios_activos || 0);
      el.textContent = displayText;

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'center',
        draggable: false
      })
        .setLngLat(zona.coordenadas_centro)
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  };

  // Función para agregar markers de candidatos
  const addCandidateMarkers = () => {
    if (!map.current) return;

    candidatos.forEach(candidato => {
      if (!candidato.ubicacion_residencia) return;

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
      el.className = 'custom-marker candidate-marker';
      el.style.cssText = `
        background-color: ${estadoColor};
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 1px 2px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: transform 0.2s ease;
      `;

      // Sin efectos hover que puedan mover los markers

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'center',
        draggable: false
      })
        .setLngLat([candidato.ubicacion_residencia[0], candidato.ubicacion_residencia[1]])
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  };

  // Inicialización del mapa (solo una vez)
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

    // Cleanup
    return () => {
      clearMarkers();
      map.current?.remove();
    };
  }, []); // Solo se ejecuta una vez

  // Efecto separado para actualizar markers cuando cambien los datos
  useEffect(() => {
    if (!map.current) return;

    const updateMarkers = () => {
      clearMarkers();
      addCriticalZones();
      addZoneMarkers();
      addCandidateMarkers();
    };

    // Esperar a que el mapa esté completamente cargado
    if (map.current.isStyleLoaded()) {
      updateMarkers();
    } else {
      map.current.on('styledata', updateMarkers);
    }

    // Cleanup del event listener
    return () => {
      map.current?.off('styledata', updateMarkers);
    };
  }, [zonas, metricas, alertas, candidatos]); // Se ejecuta cuando cambien los datos

  return (
    <div className="space-y-4">
      {/* Leyenda Ultra Simplificada */}
      <div className="flex items-center justify-between bg-gradient-to-r from-slate-50 to-slate-100 border rounded-xl p-4">
        <div className="flex items-center gap-8">
          <div className="text-sm font-semibold text-slate-700">PRIORIDAD DE ATENCIÓN:</div>
          
          {/* Solo mostrar los críticos */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-red-100 border border-red-200 rounded-lg">
              <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">🚨</span>
              </div>
              <div className="text-red-800 font-bold text-sm">CRÍTICO - Actuar YA</div>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 border border-orange-200 rounded-lg">
              <div className="w-5 h-5 rounded-full bg-orange-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">⚠️</span>
              </div>
              <div className="text-orange-800 font-bold text-sm">URGENTE - Esta semana</div>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 border border-blue-200 rounded-lg">
              <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">📋</span>
              </div>
              <div className="text-blue-800 font-medium text-sm">Vigilar</div>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-1 bg-green-100 border border-green-200 rounded-lg">
              <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">✅</span>
              </div>
              <div className="text-green-800 font-medium text-sm">OK</div>
            </div>
          </div>
        </div>
        
        <div className="text-xs text-slate-500 font-medium">
          Números = Custodios activos | Negativos = Déficit
        </div>
      </div>

      {/* Mapa */}
      <div className="relative w-full h-96 rounded-lg overflow-hidden border">
        <div ref={mapContainer} className="absolute inset-0" />
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Zonas Totales</p>
              <p className="text-2xl font-bold">{zonas.length}</p>
            </div>
            <MapPin className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Con Alertas</p>
              <p className="text-2xl font-bold text-destructive">
                {alertas.filter(a => a.estado === 'activa').length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Candidatos</p>
              <p className="text-2xl font-bold text-primary">{candidatos.length}</p>
            </div>
            <Users className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Custodios Activos</p>
              <p className="text-2xl font-bold text-success">
                {metricas.reduce((sum, m) => sum + (m.custodios_activos || 0), 0)}
              </p>
            </div>
            <Users className="h-8 w-8 text-success" />
          </div>
        </Card>
      </div>
    </div>
  );
};