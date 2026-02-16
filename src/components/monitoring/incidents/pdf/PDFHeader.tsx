import React from 'react';
import { View, Text, Image } from '@react-pdf/renderer';
import { styles } from './pdfStyles';

interface Props {
  logoBase64: string | null;
  incidentId: string;
}

export const PDFHeader: React.FC<Props> = ({ logoBase64, incidentId }) => (
  <View style={styles.headerBar} fixed>
    {logoBase64 && <Image src={logoBase64} style={styles.headerLogo} />}
    <Text style={styles.headerTitle}>REPORTE DE INCIDENTE OPERATIVO</Text>
    <Text style={styles.headerId}>ID: {incidentId.slice(0, 8)}</Text>
  </View>
);
