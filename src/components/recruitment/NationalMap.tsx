import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Users, MapPin } from 'lucide-react';
import type { ZonaOperacion, MetricaDemandaZona, AlertaSistema, CandidatoCustodio } from '@/hooks/useNationalRecruitment';
import { sanitize } from '@/utils/sanitize';

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

  const addZoneMarkers = () => {
    if (!map.current) return;

    // Coordenadas corregidas para zonas reales de México
    const zonasCorregidas = {
      'Centro de México': [-99.1332, 19.4326], // Ciudad de México
      'Bajío': [-101.257, 21.019], // León, Guanajuato  
      'Norte': [-100.3161, 25.6866], // Monterrey
      'Occidente': [-103.3496, 20.6597], // Guadalajara
      'Pacífico': [-106.4245, 23.2494], // Mazatlán (corregido)
      'Golfo': [-97.7516, 18.1427], // Veracruz (corregido)
      'Centro-Occidente': [-101.2916, 22.1565], // Aguascalientes
      'Sureste': [-92.9377, 17.9896] // Villahermosa (corregido)
    };

    zonas.forEach(zona => {
      const coordenadas = zonasCorregidas[zona.nombre] || zona.coordenadas_centro;
      
      if (!coordenadas) {
        console.warn(`Sin coordenadas para zona: ${zona.nombre}`);
        return;
      }

      const [lng, lat] = coordenadas;
      console.log(`Ubicando ${zona.nombre} en [${lng}, ${lat}]`);

      const metrica = metricas.find(m => m.zona_id === zona.id);
      const alertasZona = alertas.filter(a => a.zona_id === zona.id);
      
      const scoreUrgencia = metrica?.score_urgencia || 0;
      const deficitCustodios = metrica?.deficit_custodios || 0;
      const custodiosActivos = metrica?.custodios_activos || 0;
      
      // Sistema de colores y texto simplificado
      let color = '#10b981'; // Verde
      let texto = custodiosActivos.toString();
      
      if (scoreUrgencia >= 8 || deficitCustodios > 5 || alertasZona.some(a => a.tipo_alerta === 'critica')) {
        color = '#dc2626'; // Rojo
        texto = deficitCustodios > 0 ? `-${deficitCustodios}` : '!';
      } else if (scoreUrgencia >= 5 || deficitCustodios > 0 || alertasZona.some(a => a.tipo_alerta === 'preventiva')) {
        color = '#f59e0b'; // Amarillo
        texto = deficitCustodios > 0 ? `-${deficitCustodios}` : custodiosActivos.toString();
      }

      // Crear elemento del marcador
      const el = document.createElement('div');
      el.style.cssText = `
        background: ${color};
        width: 50px;
        height: 50px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: white;
        font-size: 16px;
      `;
      el.textContent = texto;

      // Popup informativo
      const zonaNombre = sanitize(zona.nombre);
      const estadosList = zona.estados_incluidos ? zona.estados_incluidos.map(sanitize).join(', ') : '';
      const popupContent = `
        <div style="padding: 12px; max-width: 250px;">
          <h3 style="margin: 0 0 8px 0; color: ${color}; font-weight: bold;">
            ${zonaNombre}
          </h3>
          <p style="margin: 4px 0; font-size: 12px;">
            <strong>Custodios activos:</strong> ${custodiosActivos}
          </p>
          ${deficitCustodios > 0 ? `
            <p style="margin: 4px 0; font-size: 12px; color: #dc2626;">
              <strong>Déficit:</strong> ${deficitCustodios}
            </p>
          ` : ''}
          <p style="margin: 4px 0; font-size: 12px;">
            <strong>Score urgencia:</strong> ${scoreUrgencia}/10
          </p>
          ${zona.estados_incluidos ? `
            <p style="margin: 4px 0; font-size: 12px;">
              <strong>Estados:</strong> ${estadosList}
            </p>
          ` : ''}
        </div>
      `;

      const popup = new mapboxgl.Popup({ 
        offset: 25,
        closeButton: true,
        maxWidth: '280px'
      }).setHTML(popupContent);

      // Crear y agregar marcador
      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'center',
        draggable: false
      })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    console.log(`Total markers agregados: ${markersRef.current.length}`);
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

      const candNombre = sanitize(candidato.nombre);
      const candEstado = sanitize(candidato.estado_proceso || 'Lead');
      const fuente = sanitize(candidato.fuente_reclutamiento || 'N/A');
      const telefono = candidato.telefono ? sanitize(candidato.telefono) : '';
      const popupContent = `
        <div style="padding: 8px; max-width: 250px;">
          <h4 style="margin: 0 0 8px 0; font-weight: bold;">${candNombre}</h4>
          <p style="margin: 2px 0; font-size: 12px;">
            <strong>Estado:</strong> ${candEstado}
          </p>
          <p style="margin: 2px 0; font-size: 12px;">
            <strong>Fuente:</strong> ${fuente}
          </p>
          <p style="margin: 2px 0; font-size: 12px;">
            <strong>Calificación:</strong> ${candidato.calificacion_inicial || 'N/A'}/10
          </p>
          ${candidato.telefono ? `
            <p style="margin: 2px 0; font-size: 12px;">
              <strong>Teléfono:</strong> ${telefono}
            </p>
          ` : ''}
          ${candidato.experiencia_seguridad ? "<p style='margin: 2px 0; font-size: 12px; color: #22c55e;'>✓ Experiencia en seguridad</p>" : ''}
          ${candidato.vehiculo_propio ? "<p style='margin: 2px 0; font-size: 12px; color: #22c55e;'>✓ Vehículo propio</p>" : ''}
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
      zoom: 4.5, // Zoom menor para mostrar México completo
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
      {/* Leyenda ULTRA Simplificada */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 border rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="text-sm font-bold text-slate-800">🎯 ESTADO DE ZONAS:</div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-xs">!</div>
                <span className="text-red-700 font-bold text-sm">CRÍTICO</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-xs">⚠</div>
                <span className="text-amber-700 font-bold text-sm">URGENTE</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-xs">✓</div>
                <span className="text-emerald-700 font-bold text-sm">NORMAL</span>
              </div>
            </div>
          </div>
          
          <div className="text-xs text-slate-600 text-right border-l pl-4 ml-4">
            <div className="font-bold mb-1">📊 NÚMEROS EN MARCADORES:</div>
            <div>• <span className="text-emerald-600 font-semibold">Positivos</span> = Custodios trabajando</div>
            <div>• <span className="text-red-600 font-semibold">Negativos</span> = Custodios faltantes</div>
          </div>
        </div>
      </div>

      {/* Mapa MUCHO más grande */}
      <div className="relative w-full h-[600px] rounded-lg overflow-hidden border">
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