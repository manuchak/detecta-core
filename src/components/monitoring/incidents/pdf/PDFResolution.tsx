import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { SectionHeader, FieldRow, pdfBaseStyles } from '@/components/pdf';
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
      <SectionHeader title="5. Resolución" />
      {fechaResolucion && (
        <FieldRow
          label="Fecha resolución"
          value={format(new Date(fechaResolucion), 'dd/MM/yyyy HH:mm', { locale: es })}
        />
      )}
      {resolucionNotas && (
        <View>
          <View style={{ paddingHorizontal: 4, marginBottom: 2 }}>
            <Text style={{ fontSize: 9, fontWeight: 600, color: '#646464' }}>Notas:</Text>
          </View>
          <Text style={pdfBaseStyles.paragraph}>{resolucionNotas}</Text>
        </View>
      )}
    </View>
  );
};
