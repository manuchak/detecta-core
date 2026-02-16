import React from 'react';
import { Page, View, Text } from '@react-pdf/renderer';
import { pdfBaseStyles } from './styles';
import { PDF_COLORS } from './tokens';
import { registerPDFFonts } from './fontSetup';

registerPDFFonts();

interface CoverPageProps {
  /** Main title (e.g. "Informe Histórico") */
  title: string;
  /** Subtitle line (e.g. "Detallado") */
  subtitle?: string;
  /** Period or date range highlight */
  period?: string;
  /** Metadata rows: [label, value] */
  metadata?: [string, string][];
  /** Bottom branding lines */
  branding?: string[];
}

/**
 * Professional cover page with accent bars, title, and metadata box.
 */
export const CoverPage: React.FC<CoverPageProps> = ({
  title,
  subtitle,
  period,
  metadata = [],
  branding = ['Dashboard Ejecutivo', 'Documento Confidencial'],
}) => (
  <Page size="A4" style={{ fontFamily: 'Inter', position: 'relative' }}>
    {/* Top accent */}
    <View style={pdfBaseStyles.coverAccentTop} />

    {/* Title block */}
    <View style={{ marginTop: 70, paddingHorizontal: 40 }}>
      <Text style={pdfBaseStyles.coverTitle}>{title}</Text>
      {subtitle && <Text style={pdfBaseStyles.coverSubtitle}>{subtitle}</Text>}
      {period && <Text style={pdfBaseStyles.coverPeriod}>{period}</Text>}
    </View>

    {/* Metadata box */}
    {metadata.length > 0 && (
      <View
        style={{
          marginHorizontal: 50,
          marginTop: 40,
          padding: 16,
          borderWidth: 0.5,
          borderColor: PDF_COLORS.border,
          borderRadius: 3,
        }}
      >
        {metadata.map(([label, value], i) => (
          <View key={i} style={{ flexDirection: 'row', marginBottom: i < metadata.length - 1 ? 10 : 0 }}>
            <Text style={[pdfBaseStyles.coverMeta, { width: 140 }]}>{label}</Text>
            <Text style={[pdfBaseStyles.coverMeta, { color: PDF_COLORS.black }]}>{value}</Text>
          </View>
        ))}
      </View>
    )}

    {/* Branding */}
    <View style={{ position: 'absolute', bottom: 40, left: 0, right: 0 }}>
      {branding.map((line, i) => (
        <Text key={i} style={pdfBaseStyles.coverBranding}>{line}</Text>
      ))}
    </View>

    {/* Bottom accent */}
    <View style={pdfBaseStyles.coverAccentBottom} />
  </Page>
);
