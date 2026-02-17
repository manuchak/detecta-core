import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { PDF_COLORS, PDF_FONT_SIZES } from './tokens';

interface EmptyDataNoticeProps {
  /** Section name */
  section?: string;
  /** Custom message */
  message?: string;
}

/**
 * Styled empty state for PDF sections when no data is available.
 * Replaces the generic "Sin datos disponibles" with a branded notice.
 */
export const EmptyDataNotice: React.FC<EmptyDataNoticeProps> = ({
  section,
  message,
}) => (
  <View
    style={{
      marginVertical: 12,
      padding: 16,
      paddingLeft: 20,
      backgroundColor: PDF_COLORS.backgroundSubtle,
      borderLeftWidth: 3,
      borderLeftColor: PDF_COLORS.warning,
      borderRadius: 2,
    }}
  >
    <Text style={{ fontSize: PDF_FONT_SIZES.base, fontWeight: 600, color: PDF_COLORS.black, marginBottom: 4 }}>
      {section ? `${section}: ` : ''}Datos no disponibles
    </Text>
    <Text style={{ fontSize: PDF_FONT_SIZES.sm, color: PDF_COLORS.gray, lineHeight: 1.4 }}>
      {message || 'No se encontraron registros para el período seleccionado. Verifique que existan datos en el sistema para este rango de fechas.'}
    </Text>
  </View>
);
