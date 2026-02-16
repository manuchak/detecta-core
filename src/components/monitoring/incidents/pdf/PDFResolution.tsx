import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from './pdfStyles';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  fechaResolucion?: string | null;
  resolucionNotas?: string | null;
}

export const PDFResolution: React.FC<Props> = ({ fechaResolucion, resolucionNotas }) => {
  if (!fechaResolucion && !resolucionNotas) return null;

  return (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>5. Resolución</Text>
      </View>
      {fechaResolucion && (
        <View style={styles.fieldRow}>
          <Text style={styles.label}>Fecha resolución:</Text>
          <Text style={styles.value}>
            {format(new Date(fechaResolucion), 'dd/MM/yyyy HH:mm', { locale: es })}
          </Text>
        </View>
      )}
      {resolucionNotas && (
        <View>
          <View style={[styles.fieldRow, { marginBottom: 0 }]}>
            <Text style={styles.label}>Notas:</Text>
          </View>
          <Text style={styles.paragraph}>{resolucionNotas}</Text>
        </View>
      )}
    </View>
  );
};
