import React from 'react';
import { View, Text, Image } from '@react-pdf/renderer';
import { styles } from './pdfStyles';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SignatureData {
  base64?: string;
  email?: string;
  timestamp?: string;
}

interface Props {
  firmaCreacion?: SignatureData;
  firmaCierre?: SignatureData;
}

const SignatureBlock: React.FC<{ title: string; data: SignatureData }> = ({ title, data }) => (
  <View style={styles.signatureBlock} wrap={false}>
    <Text style={styles.signatureTitle}>{title}</Text>
    {data.base64 && <Image src={data.base64} style={styles.signatureImage} />}
    <Text style={styles.signatureMeta}>Firmado por: {data.email || '-'}</Text>
    {data.timestamp && (
      <Text style={styles.signatureMeta}>
        Fecha: {format(new Date(data.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
      </Text>
    )}
  </View>
);

export const PDFSignatures: React.FC<Props> = ({ firmaCreacion, firmaCierre }) => {
  if (!firmaCreacion?.base64 && !firmaCierre?.base64) return null;

  return (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>6. Firmas Digitales</Text>
      </View>
      {firmaCreacion?.base64 && <SignatureBlock title="Firma de Creación" data={firmaCreacion} />}
      {firmaCierre?.base64 && <SignatureBlock title="Firma de Cierre" data={firmaCierre} />}
    </View>
  );
};
