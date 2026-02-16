import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from './pdfStyles';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const PDFFooter: React.FC = () => {
  const generatedDate = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es });

  return (
    <View style={styles.footer} fixed>
      <Text>Documento confidencial - Solo para uso interno</Text>
      <Text
        render={({ pageNumber, totalPages }) =>
          `Generado: ${generatedDate}  |  Página ${pageNumber} de ${totalPages}`
        }
      />
    </View>
  );
};
