import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet, pdf } from '@react-pdf/renderer';
import {
  ReportHeader,
  ReportFooter,
  SectionHeader,
  KPIRow,
  DataTable,
  InsightBox,
  CoverPage,
  PDFHorizontalBarChart,
  PDF_COLORS,
  PDF_FONT_SIZES,
  PDF_PAGE_CONFIG,
  PDF_SPACING,
  loadImageAsBase64,
} from '@/components/pdf';
import { registerPDFFonts } from '@/components/pdf/fontSetup';
import { pdfBaseStyles } from '@/components/pdf/styles';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ServiceTimeRow } from '@/hooks/useServiceTimesReport';
import type { EventoRuta, TipoEventoRuta } from '@/hooks/useEventosRuta';
import { EVENTO_ICONS } from '@/hooks/useEventosRuta';
import { initializeMapboxToken } from '@/lib/mapbox';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

registerPDFFonts();

/* ─── Constants & Helpers ─── */

const LABEL_MAP: Record<string, string> = {
  inicio_servicio: 'Inicio del servicio',
  fin_servicio: 'Fin del servicio',
  combustible: 'Parada — Combustible',
  baño: 'Parada — Baño',
  descanso: 'Parada — Descanso',
  pernocta: 'Parada — Pernocta',
  checkpoint: 'Checkpoint',
  incidencia: 'Incidencia',
  trafico: 'Parada — Tráfico',
  foto_evidencia: 'Evidencia fotográfica',
  otro: 'Otro evento',
  llegada_destino: 'Llegada a Destino',
  liberacion_custodio: 'Liberación del Custodio',
};

const EVENT_COLOR_MAP: Record<string, string> = {
  inicio_servicio: '#22C55E',
  fin_servicio: '#EF4444',
  combustible: '#F97316',
  baño: '#3B82F6',
  descanso: '#8B5CF6',
  pernocta: '#6366F1',
  checkpoint: '#06B6D4',
  incidencia: '#EF4444',
  trafico: '#EAB308',
  foto_evidencia: '#999999',
  otro: '#999999',
  llegada_destino: '#22C55E',
  liberacion_custodio: '#22C55E',
};

const fmtDur = (sec: number) => {
  if (sec < 60) return `${sec}s`;
  const m = Math.round(sec / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
};

const fmtTs = (iso: string | null) =>
  iso ? format(new Date(iso), 'dd/MM/yyyy HH:mm', { locale: es }) : 'N/A';

const fmtTime = (iso: string) =>
  format(new Date(iso), 'HH:mm:ss', { locale: es });

const fmtDate = (iso: string | null) =>
  iso ? format(new Date(iso), "dd 'de' MMMM yyyy", { locale: es }) : '';

/* ─── Styles ─── */

const s = StyleSheet.create({
  page: {
    ...pdfBaseStyles.page,
  },
  // KPI section
  kpiSection: {
    marginBottom: PDF_SPACING.lg,
  },
  // Map page
  mapContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  mapImage: {
    width: 500,
    height: 360,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: PDF_COLORS.border,
  },
  mapLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
    paddingHorizontal: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 7,
    color: PDF_COLORS.gray,
  },
  // Timeline
  timelineEntry: {
    flexDirection: 'row',
    marginBottom: 8,
    minHeight: 40,
  },
  timelineSidebar: {
    width: 3,
    marginRight: 10,
    borderRadius: 2,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 4,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  timelineTime: {
    fontSize: 9,
    fontWeight: 700,
    color: PDF_COLORS.black,
    marginRight: 8,
  },
  timelineType: {
    fontSize: 8,
    fontWeight: 600,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    color: PDF_COLORS.white,
  },
  timelineDuration: {
    fontSize: 7,
    color: PDF_COLORS.red,
    fontWeight: 600,
    marginLeft: 8,
  },
  timelineDesc: {
    fontSize: 8,
    color: PDF_COLORS.gray,
    lineHeight: 1.4,
    marginBottom: 2,
  },
  timelineLocation: {
    fontSize: 7,
    color: '#6464A0',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  timelineCoords: {
    fontSize: 6,
    color: PDF_COLORS.grayLight,
  },
  photoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  photo: {
    width: 120,
    height: 90,
    borderRadius: 3,
    borderWidth: 0.5,
    borderColor: PDF_COLORS.border,
    objectFit: 'cover',
  },
  // Route info bar
  routeInfoBar: {
    flexDirection: 'row',
    backgroundColor: PDF_COLORS.backgroundSubtle,
    borderRadius: 3,
    padding: 10,
    marginTop: 10,
    gap: 20,
  },
  routeInfoItem: {
    flex: 1,
  },
  routeInfoLabel: {
    fontSize: 7,
    color: PDF_COLORS.gray,
    marginBottom: 2,
  },
  routeInfoValue: {
    fontSize: 9,
    fontWeight: 600,
    color: PDF_COLORS.black,
  },
  // No-map placeholder
  noMapBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PDF_COLORS.backgroundSubtle,
    borderRadius: 4,
    marginTop: 10,
    padding: 40,
  },
  noMapText: {
    fontSize: 10,
    color: PDF_COLORS.grayMuted,
    textAlign: 'center',
  },
});

/* ─── PDF Document ─── */

interface PDFDocProps {
  service: ServiceTimeRow;
  eventos: EventoRuta[];
  logoBase64?: string | null;
  isotipoBase64?: string | null;
  mapBase64?: string | null;
  photoMap: Record<string, string[]>; // eventoId -> base64 urls
}

const ServiceTimeReportDocument: React.FC<PDFDocProps> = ({
  service,
  eventos,
  logoBase64,
  isotipoBase64,
  mapBase64,
  photoMap,
}) => {
  const sorted = [...eventos].sort(
    (a, b) => new Date(a.hora_inicio).getTime() - new Date(b.hora_inicio).getTime()
  );

  // Unique event types present (for map legend)
  const eventTypesPresent = [...new Set(sorted.filter(e => e.lat && e.lng).map(e => e.tipo_evento))];

  // Build insights
  const insights: { text: string; positive: boolean }[] = [];
  if (service.deltaOrigen !== null) {
    if (service.deltaOrigen <= 15) {
      insights.push({ text: `El servicio inició puntualmente (${service.deltaOrigen} min de diferencia con la cita).`, positive: true });
    } else if (service.deltaOrigen > 30) {
      insights.push({ text: `Retraso significativo en origen: ${service.deltaOrigen} min respecto a la cita programada.`, positive: false });
    }
  }
  if (service.deltaDestino !== null && service.deltaDestino > 30) {
    insights.push({ text: `Tiempo de espera en destino: ${service.deltaDestino} min entre llegada y liberación.`, positive: false });
  }
  if (service.deltaTotal !== null && service.deltaTotal <= 30) {
    insights.push({ text: `Servicio completado dentro de los márgenes operativos establecidos.`, positive: true });
  }

  // Stop durations for chart
  const stopData = [
    { label: 'Combustible', value: Math.round(service.combustible / 60), color: EVENT_COLOR_MAP.combustible },
    { label: 'Baño', value: Math.round(service.baño / 60), color: EVENT_COLOR_MAP.baño },
    { label: 'Descanso', value: Math.round(service.descanso / 60), color: EVENT_COLOR_MAP.descanso },
    { label: 'Pernocta', value: Math.round(service.pernocta / 60), color: EVENT_COLOR_MAP.pernocta },
    { label: 'Tráfico', value: Math.round(service.trafico / 60), color: EVENT_COLOR_MAP.trafico },
    { label: 'Incidencia', value: Math.round(service.incidencia / 60), color: EVENT_COLOR_MAP.incidencia },
  ].filter(d => d.value > 0);

  const hasStops = stopData.length > 0;

  return (
    <Document>
      {/* ─── PAGE 1: Cover ─── */}
      <CoverPage
        title="Informe de Servicio"
        subtitle="Reporte de Tiempos y Eventos"
        period={fmtDate(service.citaPlaneacion)}
        logoBase64={logoBase64}
        metadata={[
          ['Folio', service.folio],
          ['Cliente', service.cliente],
          ['Custodio', service.custodio],
          ['Ruta', `${service.origen || 'N/A'}  →  ${service.destino || 'N/A'}`],
          ['Total de Eventos', String(sorted.length)],
        ]}
        branding={['Detecta — Dashboard Ejecutivo', 'Documento Confidencial']}
      />

      {/* ─── PAGE 2: Executive Summary ─── */}
      <Page size="A4" style={s.page} wrap>
        <ReportHeader
          title="Resumen Ejecutivo"
          subtitle={`${service.folio} — ${service.cliente}`}
          logoBase64={isotipoBase64}
        />
        <ReportFooter leftText="Detecta — Informe de Servicio" />

        {/* KPIs */}
        <View style={s.kpiSection}>
          <KPIRow
            items={[
              {
                label: 'Δ Origen',
                value: service.deltaOrigen !== null ? `${service.deltaOrigen} min` : 'N/A',
                accentColor: (service.deltaOrigen ?? 0) > 30 ? PDF_COLORS.danger : PDF_COLORS.success,
              },
              {
                label: 'Δ Destino',
                value: service.deltaDestino !== null ? `${service.deltaDestino} min` : 'N/A',
                accentColor: (service.deltaDestino ?? 0) > 30 ? PDF_COLORS.danger : PDF_COLORS.success,
              },
              {
                label: 'Δ Total',
                value: service.deltaTotal !== null ? `${service.deltaTotal} min` : 'N/A',
                accentColor: (service.deltaTotal ?? 0) > 60 ? PDF_COLORS.danger : PDF_COLORS.success,
              },
              {
                label: 'Eventos Registrados',
                value: String(sorted.length),
                accentColor: PDF_COLORS.info,
              },
            ]}
          />
        </View>

        {/* Service milestones table */}
        <SectionHeader title="Hitos del Servicio" />
        <DataTable
          columns={[
            { header: 'Hito', accessor: 'hito', flex: 2 },
            { header: 'Fecha y Hora', accessor: 'timestamp', flex: 2 },
            { header: 'Δ (min)', accessor: 'delta', flex: 1, align: 'right' },
          ]}
          data={[
            { hito: '📋 Cita (Planeación)', timestamp: fmtTs(service.citaPlaneacion), delta: '—' },
            { hito: '🟢 Inicio Monitoreo', timestamp: fmtTs(service.inicioMonitoreo), delta: service.deltaOrigen !== null ? `${service.deltaOrigen}` : '—' },
            { hito: '🏁 Llegada a Destino', timestamp: fmtTs(service.llegadaDestino), delta: '—' },
            { hito: '✅ Liberación Custodio', timestamp: fmtTs(service.liberacion), delta: service.deltaDestino !== null ? `${service.deltaDestino}` : '—' },
          ]}
          striped
        />

        {/* Stop durations chart */}
        {hasStops && (
          <View style={{ marginTop: 6 }}>
            <PDFHorizontalBarChart
              data={stopData}
              width={510}
              title="Duración de Paradas (minutos)"
              showValues
            />
          </View>
        )}

        {/* Insights */}
        {insights.map((ins, i) => (
          <InsightBox key={i} text={ins.text} positive={ins.positive} />
        ))}
      </Page>

      {/* ─── PAGE 3: Route Map ─── */}
      <Page size="A4" style={s.page}>
        <ReportHeader
          title="Mapa de Ruta"
          subtitle={`${service.origen || ''} → ${service.destino || ''}`}
          logoBase64={isotipoBase64}
        />
        <ReportFooter leftText="Detecta — Informe de Servicio" />

        {mapBase64 ? (
          <>
            <View style={s.mapContainer}>
              <Image src={mapBase64} style={s.mapImage} />
            </View>

            {/* Legend */}
            <View style={s.mapLegend}>
              {eventTypesPresent.map((tipo) => (
                <View key={tipo} style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: EVENT_COLOR_MAP[tipo] || PDF_COLORS.gray }]} />
                  <Text style={s.legendText}>{LABEL_MAP[tipo] || tipo}</Text>
                </View>
              ))}
            </View>

            {/* Route info */}
            <View style={s.routeInfoBar}>
              <View style={s.routeInfoItem}>
                <Text style={s.routeInfoLabel}>Origen</Text>
                <Text style={s.routeInfoValue}>{service.origen || 'N/A'}</Text>
              </View>
              <View style={s.routeInfoItem}>
                <Text style={s.routeInfoLabel}>Destino</Text>
                <Text style={s.routeInfoValue}>{service.destino || 'N/A'}</Text>
              </View>
              <View style={s.routeInfoItem}>
                <Text style={s.routeInfoLabel}>Eventos con Ubicación</Text>
                <Text style={s.routeInfoValue}>{sorted.filter(e => e.lat && e.lng).length} puntos</Text>
              </View>
            </View>
          </>
        ) : (
          <View style={s.noMapBox}>
            <Text style={s.noMapText}>
              Mapa no disponible.{'\n'}
              Los eventos no cuentan con coordenadas GPS suficientes para generar el trazado de ruta.
            </Text>
          </View>
        )}
      </Page>

      {/* ─── PAGES 4+: Event Timeline ─── */}
      <Page size="A4" style={s.page} wrap>
        <ReportHeader
          title="Cronología de Eventos"
          subtitle={`${sorted.length} eventos registrados`}
          logoBase64={isotipoBase64}
        />
        <ReportFooter leftText="Detecta — Informe de Servicio" />

        {sorted.map((evento) => {
          const label = LABEL_MAP[evento.tipo_evento] || evento.tipo_evento;
          const color = EVENT_COLOR_MAP[evento.tipo_evento] || PDF_COLORS.gray;
          const photos = photoMap[evento.id] || [];

          return (
            <View key={evento.id} style={s.timelineEntry} wrap={false}>
              {/* Color sidebar */}
              <View style={[s.timelineSidebar, { backgroundColor: color }]} />

              <View style={s.timelineContent}>
                {/* Header row */}
                <View style={s.timelineHeader}>
                  <Text style={s.timelineTime}>{fmtTime(evento.hora_inicio)}</Text>
                  <Text style={[s.timelineType, { backgroundColor: color }]}>
                    {label}
                  </Text>
                  {evento.duracion_segundos != null && evento.duracion_segundos > 0 && (
                    <Text style={s.timelineDuration}>
                      {fmtDur(evento.duracion_segundos)}
                    </Text>
                  )}
                </View>

                {/* Description */}
                {evento.descripcion && (
                  <Text style={s.timelineDesc}>{evento.descripcion}</Text>
                )}

                {/* Location */}
                {evento.ubicacion_texto && (
                  <Text style={s.timelineLocation}>📍 {evento.ubicacion_texto}</Text>
                )}

                {/* Coordinates */}
                {evento.lat && evento.lng && (
                  <Text style={s.timelineCoords}>
                    {evento.lat.toFixed(6)}, {evento.lng.toFixed(6)}
                  </Text>
                )}

                {/* Photos */}
                {photos.length > 0 && (
                  <View style={s.photoRow}>
                    {photos.map((photoB64, pi) => (
                      <Image key={pi} src={photoB64} style={s.photo} />
                    ))}
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </Page>
    </Document>
  );
};

/* ─── Static Map Generator ─── */

async function generateStaticMapBase64(
  eventos: EventoRuta[],
  token: string
): Promise<string | null> {
  const points = eventos
    .filter((e) => e.lat && e.lng)
    .sort((a, b) => new Date(a.hora_inicio).getTime() - new Date(b.hora_inicio).getTime());

  if (points.length < 2) return null;

  // Build markers
  const markers = points
    .map((p) => {
      // Mapbox static API pin colors (hex without #)
      const color = (EVENT_COLOR_MAP[p.tipo_evento] || '#999999').replace('#', '');
      return `pin-s+${color}(${p.lng!.toFixed(5)},${p.lat!.toFixed(5)})`;
    })
    .join(',');

  // Build path from coordinates
  const pathCoords = points.map((p) => `${p.lng!.toFixed(5)},${p.lat!.toFixed(5)}`).join(';');
  // URL-encode the path with polyline
  const pathStr = `path-4+EB0000-0.6(${encodeURIComponent(pathCoords)})`;

  // Calculate bounding box from coordinates for tight framing
  const lats = points.map((p) => p.lat!);
  const lngs = points.map((p) => p.lng!);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  // Add padding buffer (~2km) to avoid points at edges
  const latBuffer = Math.max((maxLat - minLat) * 0.15, 0.02);
  const lngBuffer = Math.max((maxLng - minLng) * 0.15, 0.02);
  const bbox = `[${(minLng - lngBuffer).toFixed(5)},${(minLat - latBuffer).toFixed(5)},${(maxLng + lngBuffer).toFixed(5)},${(maxLat + latBuffer).toFixed(5)}]`;

  const url = `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/${markers},${pathStr}/${bbox}/1000x720@2x?padding=80&access_token=${token}`;

  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) {
      console.warn('Static map request failed:', res.status);
      return null;
    }
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('Static map generation failed:', err);
    return null;
  }
}

/* ─── PDF Button Component ─── */

interface ButtonProps {
  service: ServiceTimeRow;
  eventos: EventoRuta[];
}

export const ServiceDetailPDFButton: React.FC<ButtonProps> = ({ service, eventos }) => {
  const [generating, setGenerating] = React.useState(false);

  const handleGenerate = async () => {
    if (eventos.length === 0) {
      toast.error('No hay eventos para generar el reporte');
      return;
    }
    setGenerating(true);
    try {
      // Load assets in parallel
      const [logoBase64, isotipoBase64, mapboxToken] = await Promise.all([
        loadImageAsBase64('/detecta-logo-full.png'),
        loadImageAsBase64('/detecta-isotipo.png'),
        initializeMapboxToken(),
      ]);

      // Load event photos in parallel
      const photoMap: Record<string, string[]> = {};
      const photoPromises: Promise<void>[] = [];

      for (const evento of eventos) {
        if (evento.foto_urls && evento.foto_urls.length > 0) {
          photoPromises.push(
            (async () => {
              const loaded: string[] = [];
              for (const url of evento.foto_urls.slice(0, 4)) {
                const b64 = await loadImageAsBase64(url);
                if (b64) loaded.push(b64);
              }
              if (loaded.length > 0) {
                photoMap[evento.id] = loaded;
              }
            })()
          );
        }
      }

      // Generate static map
      let mapBase64: string | null = null;
      if (mapboxToken) {
        const [mapResult] = await Promise.all([
          generateStaticMapBase64(eventos, mapboxToken),
          ...photoPromises,
        ]);
        mapBase64 = mapResult;
      } else {
        await Promise.all(photoPromises);
      }

      const blob = await pdf(
        <ServiceTimeReportDocument
          service={service}
          eventos={eventos}
          logoBase64={logoBase64}
          isotipoBase64={isotipoBase64}
          mapBase64={mapBase64}
          photoMap={photoMap}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `informe-servicio-${service.folio}-${format(new Date(), 'yyyyMMdd-HHmm')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Informe PDF descargado');
    } catch (e: any) {
      console.error('PDF generation error:', e);
      toast.error(`Error al generar PDF: ${e.message}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="outline"
      className="gap-1.5 text-xs"
      onClick={handleGenerate}
      disabled={generating || eventos.length === 0}
    >
      {generating ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <FileDown className="h-3 w-3" />
      )}
      {generating ? 'Generando...' : 'Descargar Informe'}
    </Button>
  );
};
