import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { pdfBaseStyles } from './styles';
import { PDF_COLORS } from './tokens';

interface StatusBadgeProps {
  label: string;
  color?: string;
  /** Background color (defaults to a light version) */
  bgColor?: string;
}

/**
 * Small inline colored badge for status/severity indicators.
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  color = PDF_COLORS.black,
  bgColor = PDF_COLORS.surface,
}) => (
  <View style={[pdfBaseStyles.badge, { backgroundColor: bgColor }]}>
    <Text style={{ color, fontSize: 7, fontWeight: 600 }}>{label}</Text>
  </View>
);
