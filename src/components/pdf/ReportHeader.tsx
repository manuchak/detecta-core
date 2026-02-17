import React from 'react';
import { View, Text, Image } from '@react-pdf/renderer';
import { pdfBaseStyles } from './styles';
import { PDF_COLORS } from './tokens';

interface ReportHeaderProps {
  title: string;
  subtitle?: string;
  logoBase64?: string | null;
}

/**
 * Fixed header bar with logo, title, subtitle, and red accent line.
 */
export const ReportHeader: React.FC<ReportHeaderProps> = ({ title, subtitle, logoBase64 }) => (
  <View fixed>
    <View style={pdfBaseStyles.headerBar}>
      {logoBase64 && <Image src={logoBase64} style={pdfBaseStyles.headerLogo} />}
      <Text style={pdfBaseStyles.headerTitle}>{title}</Text>
      {subtitle && <Text style={pdfBaseStyles.headerSubtitle}>{subtitle}</Text>}
    </View>
    {/* Red accent line under the header */}
    <View
      style={{
        position: 'absolute',
        top: 42,
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: PDF_COLORS.red,
      }}
    />
  </View>
);
