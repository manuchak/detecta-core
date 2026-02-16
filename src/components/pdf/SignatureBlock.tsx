import React from 'react';
import { View, Text, Image } from '@react-pdf/renderer';
import { pdfBaseStyles } from './styles';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SignatureBlockProps {
  /** Label above the signature (e.g. "Firma de Creación") */
  title: string;
  /** Signature image as base64 */
  signatureBase64?: string;
  /** Email of the signer */
  email?: string;
  /** ISO timestamp of when it was signed */
  timestamp?: string;
}

/**
 * Digital signature block with image, signer email, and timestamp.
 */
export const SignatureBlock: React.FC<SignatureBlockProps> = ({
  title,
  signatureBase64,
  email,
  timestamp,
}) => (
  <View style={pdfBaseStyles.signatureBlock} wrap={false}>
    <Text style={pdfBaseStyles.signatureTitle}>{title}</Text>
    {signatureBase64 && <Image src={signatureBase64} style={pdfBaseStyles.signatureImage} />}
    <Text style={pdfBaseStyles.signatureMeta}>Firmado por: {email || '-'}</Text>
    {timestamp && (
      <Text style={pdfBaseStyles.signatureMeta}>
        Fecha: {format(new Date(timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
      </Text>
    )}
  </View>
);
