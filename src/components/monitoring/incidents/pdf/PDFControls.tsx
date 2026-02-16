import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { SectionHeader, FieldRow } from '@/components/pdf';

interface Props {
  controlesActivos: string[] | null;
  controlEfectivo: boolean;
}

export const PDFControls: React.FC<Props> = ({ controlesActivos, controlEfectivo }) => (
  <View>
    <SectionHeader title="4. Controles y Atribución" />
    <FieldRow
      label="Controles activos"
      value={controlesActivos?.length ? controlesActivos.join(', ') : 'Ninguno registrado'}
    />
    <FieldRow label="Control efectivo" value={controlEfectivo ? 'Sí' : 'No'} />
  </View>
);
