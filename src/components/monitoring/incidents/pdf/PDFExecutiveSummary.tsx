import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles, SEV_COLORS } from './pdfStyles';

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
  const sevColor = SEV_COLORS[severidadValue] || '#646464';

  const boxes = [
    { label: 'Tipo', value: tipo },
    { label: 'Severidad', value: severidad, color: sevColor },
    { label: 'Cliente', value: cliente },
    { label: 'Zona', value: zona },
    { label: 'T. Respuesta', value: tiempoRespuesta },
  ];

  return (
    <View style={styles.summaryBox}>
      {boxes.map((box, i) => (
        <View style={styles.summaryCol} key={i}>
          <Text style={styles.summaryLabel}>{box.label}</Text>
          {box.color ? (
            <View style={styles.sevRow}>
              <View style={[styles.sevDot, { backgroundColor: box.color }]} />
              <Text style={styles.summaryValue}>{box.value}</Text>
            </View>
          ) : (
            <Text style={styles.summaryValue}>{box.value}</Text>
          )}
        </View>
      ))}
    </View>
  );
};
