import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { pdfBaseStyles } from './styles';

interface FieldRowProps {
  label: string;
  value: string;
  /** Custom label width in points (default 110) */
  labelWidth?: number;
}

/**
 * Single label: value row for detail sections.
 */
export const FieldRow: React.FC<FieldRowProps> = ({ label, value, labelWidth }) => (
  <View style={pdfBaseStyles.fieldRow}>
    <Text style={[pdfBaseStyles.fieldLabel, labelWidth ? { width: labelWidth } : {}]}>
      {label}:
    </Text>
    <Text style={pdfBaseStyles.fieldValue}>{value}</Text>
  </View>
);
