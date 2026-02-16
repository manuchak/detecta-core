import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { pdfBaseStyles } from '@/components/pdf';
import { PDF_SEVERITY_COLORS, PDF_COLORS } from '@/components/pdf';

interface Props {
  tipo: string;
  severidad: string;
  severidadValue: string;
  cliente: string;
  zona: string;
  tiempoRespuesta: string;
}

export const PDFExecutiveSummary: React.FC<Props> = ({
  tipo, severidad, severidadValue, cliente, zona, tiempoRespuesta,
}) => {
  const sevColor = PDF_SEVERITY_COLORS[severidadValue] || PDF_COLORS.gray;

  const boxes = [
    { label: 'Tipo', value: tipo },
    { label: 'Severidad', value: severidad, color: sevColor },
    { label: 'Cliente', value: cliente },
    { label: 'Zona', value: zona },
    { label: 'T. Respuesta', value: tiempoRespuesta },
  ];

  return (
    <View style={{
      flexDirection: 'row',
      backgroundColor: '#FAFAFA',
      border: '1pt solid #DCDCDC',
      borderRadius: 3,
      padding: 8,
      marginBottom: 14,
    }}>
      {boxes.map((box, i) => (
        <View style={{ flex: 1, alignItems: 'center' }} key={i}>
          <Text style={{ fontSize: 7, color: PDF_COLORS.gray, marginBottom: 4 }}>{box.label}</Text>
          {box.color ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: box.color, marginRight: 4 }} />
              <Text style={{ fontSize: 9, fontWeight: 700 }}>{box.value}</Text>
            </View>
          ) : (
            <Text style={{ fontSize: 9, fontWeight: 700 }}>{box.value}</Text>
          )}
        </View>
      ))}
    </View>
  );
};
