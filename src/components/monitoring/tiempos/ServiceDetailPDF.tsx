import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet, pdf } from '@react-pdf/renderer';
import { ReportHeader, SectionHeader, PDF_COLORS, PDF_PAGE_CONFIG } from '@/components/pdf';
import { registerPDFFonts } from '@/components/pdf/fontSetup';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ServiceTimeRow } from '@/hooks/useServiceTimesReport';
import type { EventoRuta, TipoEventoRuta } from '@/hooks/useEventosRuta';
import { EVENTO_ICONS } from '@/hooks/useEventosRuta';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

registerPDFFonts();

const s = StyleSheet.create({
  page: { padding: 30, fontSize: 9, fontFamily: 'Helvetica' },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10, gap: 4 },
  metaBox: { width: '32%', padding: 6, backgroundColor: '#f5f5f5', borderRadius: 3 },
  metaLabel: { fontSize: 7, color: PDF_COLORS.gray },
  metaValue: { fontSize: 9, fontWeight: 700 },
  entry: { marginBottom: 5, paddingLeft: 4, borderLeftWidth: 2, borderLeftColor: '#ddd' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 1 },
  time: { fontSize: 8, fontWeight: 700, marginRight: 6 },
  type: { fontSize: 8, color: PDF_COLORS.gray },
  desc: { fontSize: 8, paddingLeft: 0, lineHeight: 1.4 },
  location: { fontSize: 7, fontStyle: 'italic', color: '#6366f1' },
  duration: { fontSize: 7, color: PDF_COLORS.red },
  photo: { width: 130, height: 97, marginTop: 2, borderWidth: 1, borderColor: '#ccc', borderRadius: 2 },
  summaryTable: { marginTop: 8, borderWidth: 1, borderColor: '#ddd', borderRadius: 3 },
  summaryRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 3, paddingHorizontal: 6 },
  summaryRowLast: { flexDirection: 'row', paddingVertical: 3, paddingHorizontal: 6 },
  summaryLabel: { fontSize: 8, color: PDF_COLORS.gray, width: '60%' },
  summaryValue: { fontSize: 8, fontWeight: 700, width: '40%', textAlign: 'right' },
  deltaHighlight: { fontSize: 8, fontWeight: 700, color: PDF_COLORS.red, width: '40%', textAlign: 'right' },
});

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

const fmtDur = (sec: number) => {
  if (sec < 60) return `${sec}s`;
  const m = Math.round(sec / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
};

interface PDFDocProps {
  service: ServiceTimeRow;
  eventos: EventoRuta[];
}

const ServiceTimePDF: React.FC<PDFDocProps> = ({ service, eventos }) => {
  const sorted = [...eventos].sort((a, b) => new Date(a.hora_inicio).getTime() - new Date(b.hora_inicio).getTime());
  const fmtTs = (iso: string | null) => iso ? format(new Date(iso), 'dd/MM/yyyy HH:mm', { locale: es }) : 'N/A';

  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        <ReportHeader
          title="Reporte de Tiempos de Servicio"
          subtitle={`${service.folio} — ${service.cliente}`}
        />

        {/* Service metadata */}
        <View style={s.metaGrid}>
          {[
            { label: 'Folio', value: service.folio },
            { label: 'Cliente', value: service.cliente },
            { label: 'Custodio', value: service.custodio },
            { label: 'Origen', value: service.origen },
            { label: 'Destino', value: service.destino },
            { label: 'Eventos', value: String(sorted.length) },
          ].map((item, i) => (
            <View key={i} style={s.metaBox}>
              <Text style={s.metaLabel}>{item.label}</Text>
              <Text style={s.metaValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Time summary table */}
        <SectionHeader title="Resumen de Tiempos" />
        <View style={s.summaryTable}>
          {[
            { label: 'Cita (planeación)', value: fmtTs(service.citaPlaneacion) },
            { label: 'Inicio (monitoreo)', value: fmtTs(service.inicioMonitoreo) },
            { label: 'Llegada a destino', value: fmtTs(service.llegadaDestino) },
            { label: 'Liberación', value: fmtTs(service.liberacion) },
          ].map((row, i) => (
            <View key={i} style={s.summaryRow}>
              <Text style={s.summaryLabel}>{row.label}</Text>
              <Text style={s.summaryValue}>{row.value}</Text>
            </View>
          ))}
          {[
            { label: 'ΔOrigen (cita → inicio)', value: service.deltaOrigen !== null ? `${service.deltaOrigen} min` : 'N/A', warn: (service.deltaOrigen ?? 0) > 30 },
            { label: 'ΔDestino (llegada → liberación)', value: service.deltaDestino !== null ? `${service.deltaDestino} min` : 'N/A', warn: (service.deltaDestino ?? 0) > 30 },
            { label: 'ΔTotal', value: service.deltaTotal !== null ? `${service.deltaTotal} min` : 'N/A', warn: (service.deltaTotal ?? 0) > 60 },
          ].map((row, i, arr) => (
            <View key={`d-${i}`} style={i === arr.length - 1 ? s.summaryRowLast : s.summaryRow}>
              <Text style={s.summaryLabel}>{row.label}</Text>
              <Text style={row.warn ? s.deltaHighlight : s.summaryValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Event durations */}
        <View style={{ ...s.summaryTable, marginTop: 6 }}>
          {[
            { label: '⛽ Combustible', value: fmtDur(service.combustible) },
            { label: '🚻 Baño', value: fmtDur(service.baño) },
            { label: '☕ Descanso', value: fmtDur(service.descanso) },
            { label: '🛏️ Pernocta', value: fmtDur(service.pernocta) },
            { label: '⚠️ Incidencia', value: fmtDur(service.incidencia) },
          ].map((row, i, arr) => (
            <View key={i} style={i === arr.length - 1 ? s.summaryRowLast : s.summaryRow}>
              <Text style={s.summaryLabel}>{row.label}</Text>
              <Text style={s.summaryValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Chronology */}
        <SectionHeader title="Cronología de Eventos" />
        {sorted.map((evento) => {
          const label = LABEL_MAP[evento.tipo_evento] || evento.tipo_evento;
          const ts = format(new Date(evento.hora_inicio), 'HH:mm:ss', { locale: es });
          return (
            <View key={evento.id} style={s.entry} wrap={false}>
              <View style={s.row}>
                <Text style={s.time}>{ts}</Text>
                <Text style={s.type}>[{label}]</Text>
                {evento.duracion_segundos != null && (
                  <Text style={s.duration}> · {fmtDur(evento.duracion_segundos)}</Text>
                )}
              </View>
              {evento.descripcion && <Text style={s.desc}>{evento.descripcion}</Text>}
              {evento.ubicacion_texto && <Text style={s.location}>📍 {evento.ubicacion_texto}</Text>}
            </View>
          );
        })}
      </Page>
    </Document>
  );
};

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
      const blob = await pdf(
        <ServiceTimePDF service={service} eventos={eventos} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tiempos-${service.folio}-${format(new Date(), 'yyyyMMdd-HHmm')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF descargado');
    } catch (e: any) {
      toast.error(`Error: ${e.message}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={handleGenerate} disabled={generating || eventos.length === 0}>
      {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileDown className="h-3 w-3" />}
      Descargar PDF
    </Button>
  );
};
