import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { pdfBaseStyles } from './styles';

interface SectionHeaderProps {
  title: string;
}

/**
 * Gray background section title bar (e.g. "1. Datos Generales").
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({ title }) => (
  <View style={pdfBaseStyles.sectionHeader}>
    <Text style={pdfBaseStyles.sectionTitle}>{title}</Text>
  </View>
);
