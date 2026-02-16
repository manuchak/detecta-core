import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { pdfBaseStyles } from './styles';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ReportFooterProps {
  /** Left-side text (e.g. "Documento confidencial") */
  leftText?: string;
}

/**
 * Fixed footer on every page with confidentiality notice + page number.
 */
export const ReportFooter: React.FC<ReportFooterProps> = ({
  leftText = 'Documento confidencial - Solo para uso interno',
}) => {
  const generatedDate = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es });

  return (
    <View style={pdfBaseStyles.footer} fixed>
      <Text>{leftText}</Text>
      <Text
        render={({ pageNumber, totalPages }) =>
          `Generado: ${generatedDate}  |  Página ${pageNumber} de ${totalPages}`
        }
      />
    </View>
  );
};
