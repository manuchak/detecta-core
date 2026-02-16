import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from './pdfStyles';

interface Props {
  fields: [string, string][];
  descripcion: string;
}

export const PDFGeneralData: React.FC<Props> = ({ fields, descripcion }) => (
  <View>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>1. Datos Generales</Text>
    </View>
    {fields.map(([label, value], i) => (
      <View style={styles.fieldRow} key={i}>
        <Text style={styles.label}>{label}:</Text>
        <Text style={styles.value}>{String(value)}</Text>
      </View>
    ))}
    <View style={[styles.fieldRow, { marginTop: 4 }]}>
      <Text style={styles.label}>Descripción:</Text>
    </View>
    <Text style={styles.paragraph}>{descripcion}</Text>
  </View>
);
