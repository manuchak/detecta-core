import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from './pdfStyles';

interface Props {
  controlesActivos: string[] | null;
  controlEfectivo: boolean;
}

export const PDFControls: React.FC<Props> = ({ controlesActivos, controlEfectivo }) => (
  <View>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>4. Controles y Atribución</Text>
    </View>
    <View style={styles.fieldRow}>
      <Text style={styles.label}>Controles activos:</Text>
      <Text style={styles.value}>
        {controlesActivos?.length ? controlesActivos.join(', ') : 'Ninguno registrado'}
      </Text>
    </View>
    <View style={styles.fieldRow}>
      <Text style={styles.label}>Control efectivo:</Text>
      <Text style={styles.value}>{controlEfectivo ? 'Sí' : 'No'}</Text>
    </View>
  </View>
);
