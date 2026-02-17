import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { SectionHeader, PDF_COLORS } from '@/components/pdf';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { TIPOS_ENTRADA_CRONOLOGIA } from '@/hooks/useIncidentesOperativos';
import type { EntradaCronologia } from '@/hooks/useIncidentesOperativos';

const s = StyleSheet.create({
  entry: { marginBottom: 8, paddingLeft: 4 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: PDF_COLORS.red, marginRight: 6 },
  ts: { fontSize: 8, fontWeight: 700, color: PDF_COLORS.red, marginRight: 8 },
  type: { fontSize: 8, color: PDF_COLORS.gray },
  desc: { fontSize: 8, color: PDF_COLORS.black, paddingLeft: 13, lineHeight: 1.4, marginBottom: 2 },
  location: { fontSize: 7, fontStyle: 'italic', color: PDF_COLORS.locationBlue, paddingLeft: 13, marginBottom: 2 },
  image: { width: 170, height: 128, marginLeft: 13, marginTop: 4, borderWidth: 1, borderColor: '#C8C8C8', borderRadius: 2 },
  empty: { fontSize: 9, fontStyle: 'italic', color: PDF_COLORS.gray, paddingHorizontal: 4 },
});

interface Props {
  cronologia: EntradaCronologia[];
  imageCache: Map<string, string | null>;
}

export const PDFTimeline: React.FC<Props> = ({ cronologia, imageCache }) => {
  const sorted = [...cronologia].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <View>
      <SectionHeader title="3. Cronología del Evento" />
      <View minPresenceAhead={40}></View>

      {sorted.length === 0 ? (
        <Text style={s.empty}>Sin entradas registradas en la cronología.</Text>
      ) : (
        sorted.map((entry, i) => {
          const tipoLabel = TIPOS_ENTRADA_CRONOLOGIA.find(t => t.value === entry.tipo_entrada)?.label || entry.tipo_entrada;
          const ts = format(new Date(entry.timestamp), 'dd/MM HH:mm', { locale: es });
          const entryAny = entry as any;
          const imgUrl = entryAny.imagen_url;
          const imgData = imgUrl ? imageCache.get(imgUrl) : null;

          return (
            <View key={entry.id || i} style={s.entry} wrap={false}>
              <View style={s.header}>
                <View style={s.dot} />
                <Text style={s.ts}>{ts}</Text>
                <Text style={s.type}>[{tipoLabel}]</Text>
              </View>
              <Text style={s.desc}>{entry.descripcion}</Text>
              {entryAny.ubicacion_texto && (
                <Text style={s.location}>Ubicación: {entryAny.ubicacion_texto}</Text>
              )}
              {!entryAny.ubicacion_texto && entryAny.ubicacion_lat && entryAny.ubicacion_lng && (
                <Text style={s.location}>Coords: {entryAny.ubicacion_lat.toFixed(6)}, {entryAny.ubicacion_lng.toFixed(6)}</Text>
              )}
              {imgData && <Image src={imgData} style={s.image} />}
            </View>
          );
        })
      )}
    </View>
  );
};
