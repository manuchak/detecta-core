import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { FieldGroup, pdfBaseStyles } from '@/components/pdf';

interface Props {
  fields: [string, string][];
  descripcion: string;
}

export const PDFGeneralData: React.FC<Props> = ({ fields, descripcion }) => (
  <View>
    <FieldGroup title="1. Datos Generales" fields={fields} />
    <View style={{ marginTop: 4, paddingHorizontal: 4 }}>
      <Text style={{ fontSize: 9, fontWeight: 600, color: '#646464', marginBottom: 4 }}>Descripción:</Text>
    </View>
    <Text style={pdfBaseStyles.paragraph}>{descripcion}</Text>
  </View>
);
