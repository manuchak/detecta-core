import React from 'react';
import { View } from '@react-pdf/renderer';
import { SectionHeader, SignatureBlock } from '@/components/pdf';

interface SignatureData {
  base64?: string;
  email?: string;
  timestamp?: string;
}

interface Props {
  firmaCreacion?: SignatureData;
  firmaCierre?: SignatureData;
}

export const PDFSignatures: React.FC<Props> = ({ firmaCreacion, firmaCierre }) => {
  if (!firmaCreacion?.base64 && !firmaCierre?.base64) return null;

  return (
    <View>
      <SectionHeader title="6. Firmas Digitales" />
      {firmaCreacion?.base64 && (
        <SignatureBlock
          title="Firma de Creación"
          signatureBase64={firmaCreacion.base64}
          email={firmaCreacion.email}
          timestamp={firmaCreacion.timestamp}
        />
      )}
      {firmaCierre?.base64 && (
        <SignatureBlock
          title="Firma de Cierre"
          signatureBase64={firmaCierre.base64}
          email={firmaCierre.email}
          timestamp={firmaCierre.timestamp}
        />
      )}
    </View>
  );
};
