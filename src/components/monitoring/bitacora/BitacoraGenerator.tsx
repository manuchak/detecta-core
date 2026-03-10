import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet, pdf } from '@react-pdf/renderer';
import { SectionHeader, PDF_COLORS, ReportHeader } from '@/components/pdf';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { type EventoRuta, type TipoEventoRuta, EVENTO_ICONS } from '@/hooks/useEventosRuta';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const s = StyleSheet.create({
  page: { padding: 30, fontSize: 9, fontFamily: 'Helvetica' },
  meta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  metaLabel: { fontSize: 8, color: PDF_COLORS.gray },
  metaValue: { fontSize: 9, fontWeight: 700 },
  entry: { marginBottom: 6, paddingLeft: 4 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  time: { fontSize: 8, fontWeight: 700, marginRight: 8 },
  type: { fontSize: 8, color: PDF_COLORS.gray },
  desc: { fontSize: 8, paddingLeft: 12, lineHeight: 1.4, marginBottom: 1 },
  location: { fontSize: 7, fontStyle: 'italic', color: PDF_COLORS.locationBlue, paddingLeft: 12 },
  duration: { fontSize: 7, color: PDF_COLORS.red, paddingLeft: 12, marginTop: 1 },
  photo: { width: 140, height: 105, marginLeft: 12, marginTop: 3, borderWidth: 1, borderColor: '#ccc', borderRadius: 2 },
  summary: { marginTop: 12, padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4 },
  summaryTitle: { fontSize: 9, fontWeight: 700, marginBottom: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  summaryLabel: { fontSize: 8, color: PDF_COLORS.gray },
  summaryValue: { fontSize: 8, fontWeight: 700 },
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
};

const formatDur = (s: number) => {
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
};

interface BitacoraPDFProps {
  servicioId: string;
  eventos: EventoRuta[];
  servicioLabel?: string;
}

const BitacoraPDF: React.FC<BitacoraPDFProps> = ({ servicioId, eventos, servicioLabel }) => {
  const sorted = [...eventos].sort((a, b) => new Date(a.hora_inicio).getTime() - new Date(b.hora_inicio).getTime());
  const totalParadas = sorted.filter(e => e.duracion_segundos && !['inicio_servicio', 'fin_servicio'].includes(e.tipo_evento)).length;
  const totalTiempoParadas = sorted
    .filter(e => e.duracion_segundos && !['inicio_servicio', 'fin_servicio'].includes(e.tipo_evento))
    .reduce((acc, e) => acc + (e.duracion_segundos || 0), 0);

  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        <ReportHeader title="Bitácora de Ruta" subtitle={servicioLabel || `Servicio: ${servicioId}`} />

        <View style={s.meta}>
          <View>
            <Text style={s.metaLabel}>Fecha</Text>
            <Text style={s.metaValue}>
              {sorted.length > 0 ? format(new Date(sorted[0].hora_inicio), 'dd/MM/yyyy', { locale: es }) : 'N/A'}
            </Text>
          </View>
          <View>
            <Text style={s.metaLabel}>Total eventos</Text>
            <Text style={s.metaValue}>{sorted.length}</Text>
          </View>
          <View>
            <Text style={s.metaLabel}>Paradas</Text>
            <Text style={s.metaValue}>{totalParadas}</Text>
          </View>
          <View>
            <Text style={s.metaLabel}>Tiempo en paradas</Text>
            <Text style={s.metaValue}>{formatDur(totalTiempoParadas)}</Text>
          </View>
        </View>

        <SectionHeader title="Cronología de Eventos" />

        {sorted.map((evento, i) => {
          const label = LABEL_MAP[evento.tipo_evento] || evento.tipo_evento;
          const ts = format(new Date(evento.hora_inicio), 'HH:mm:ss', { locale: es });

          return (
            <View key={evento.id} style={s.entry} wrap={false}>
              <View style={s.row}>
                <View style={[s.dot, { backgroundColor: evento.hora_fin ? '#22c55e' : '#ef4444' }]} />
                <Text style={s.time}>{ts}</Text>
                <Text style={s.type}>[{label}]</Text>
              </View>
              {evento.descripcion && <Text style={s.desc}>{evento.descripcion}</Text>}
              {evento.ubicacion_texto && <Text style={s.location}>📍 {evento.ubicacion_texto}</Text>}
              {evento.lat && evento.lng && !evento.ubicacion_texto && (
                <Text style={s.location}>📍 {evento.lat.toFixed(5)}, {evento.lng.toFixed(5)}</Text>
              )}
              {evento.duracion_segundos != null && (
                <Text style={s.duration}>Duración: {formatDur(evento.duracion_segundos)}</Text>
              )}
            </View>
          );
        })}

        <View style={s.summary}>
          <Text style={s.summaryTitle}>Resumen</Text>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Eventos registrados</Text>
            <Text style={s.summaryValue}>{sorted.length}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Paradas con duración</Text>
            <Text style={s.summaryValue}>{totalParadas}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Tiempo total en paradas</Text>
            <Text style={s.summaryValue}>{formatDur(totalTiempoParadas)}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Puntos GPS registrados</Text>
            <Text style={s.summaryValue}>{sorted.filter(e => e.lat && e.lng).length}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

interface GeneratorButtonProps {
  servicioId: string | null;
  eventos: EventoRuta[];
  servicioLabel?: string;
}

export const BitacoraGeneratorButton: React.FC<GeneratorButtonProps> = ({ servicioId, eventos, servicioLabel }) => {
  const [generating, setGenerating] = React.useState(false);

  const handleGenerate = async () => {
    if (!servicioId || eventos.length === 0) {
      toast.error('No hay eventos para generar la bitácora');
      return;
    }
    setGenerating(true);
    try {
      const blob = await pdf(
        <BitacoraPDF servicioId={servicioId} eventos={eventos} servicioLabel={servicioLabel} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bitacora-${servicioId}-${format(new Date(), 'yyyyMMdd-HHmm')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Bitácora PDF descargada');
    } catch (e: any) {
      toast.error(`Error generando PDF: ${e.message}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleGenerate}
      disabled={generating || !servicioId || eventos.length === 0}
      className="gap-1.5 text-xs"
    >
      {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileDown className="h-3 w-3" />}
      Descargar Bitácora
    </Button>
  );
};
