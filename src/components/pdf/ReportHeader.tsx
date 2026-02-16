import React from 'react';
import { View, Text, Image } from '@react-pdf/renderer';
import { pdfBaseStyles } from './styles';

interface ReportHeaderProps {
  /** Title displayed in the header bar */
  title: string;
  /** Optional subtitle on the right side (e.g. ID, period) */
  subtitle?: string;
  /** Logo as base64 data URL */
  logoBase64?: string | null;
}

/**
 * Fixed red header bar that appears on every page.
 * Renders logo + title + optional right-aligned subtitle.
 */
export const ReportHeader: React.FC<ReportHeaderProps> = ({ title, subtitle, logoBase64 }) => (
  <View style={pdfBaseStyles.headerBar} fixed>
    {logoBase64 && <Image src={logoBase64} style={pdfBaseStyles.headerLogo} />}
    <Text style={pdfBaseStyles.headerTitle}>{title}</Text>
    {subtitle && <Text style={pdfBaseStyles.headerSubtitle}>{subtitle}</Text>}
  </View>
);
