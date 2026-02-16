import React from 'react';
import { View, Text, Image } from '@react-pdf/renderer';
import { styles } from './pdfStyles';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { TIPOS_ENTRADA_CRONOLOGIA } from '@/hooks/useIncidentesOperativos';
import type { EntradaCronologia } from '@/hooks/useIncidentesOperativos';

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
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>3. Cronología del Evento</Text>
      </View>

      {sorted.length === 0 ? (
        <Text style={[styles.paragraph, { fontStyle: 'italic', color: '#646464' }]}>
          Sin entradas registradas en la cronología.
        </Text>
      ) : (
        sorted.map((entry, i) => {
          const tipoLabel =
            TIPOS_ENTRADA_CRONOLOGIA.find((t) => t.value === entry.tipo_entrada)?.label ||
            entry.tipo_entrada;
          const ts = format(new Date(entry.timestamp), 'dd/MM HH:mm', { locale: es });
          const entryAny = entry as any;
          const imgUrl = entryAny.imagen_url;
          const imgData = imgUrl ? imageCache.get(imgUrl) : null;

          return (
            <View key={entry.id || i} style={styles.timelineEntry} wrap={false}>
              <View style={styles.timelineHeader}>
                <View style={styles.timelineDot} />
                <Text style={styles.timelineTs}>{ts}</Text>
                <Text style={styles.timelineType}>[{tipoLabel}]</Text>
              </View>

              <Text style={styles.timelineDesc}>{entry.descripcion}</Text>

              {entryAny.ubicacion_texto && (
                <Text style={styles.timelineLocation}>
                  Ubicación: {entryAny.ubicacion_texto}
                </Text>
              )}
              {!entryAny.ubicacion_texto && entryAny.ubicacion_lat && entryAny.ubicacion_lng && (
                <Text style={styles.timelineLocation}>
                  Coords: {entryAny.ubicacion_lat.toFixed(6)}, {entryAny.ubicacion_lng.toFixed(6)}
                </Text>
              )}

              {imgData && (
                <Image src={imgData} style={styles.timelineImage} />
              )}
            </View>
          );
        })
      )}
    </View>
  );
};
