import React from 'react';
import { Page, View, Text, Image } from '@react-pdf/renderer';
import { pdfBaseStyles } from './styles';
import { PDF_COLORS } from './tokens';
import { registerPDFFonts } from './fontSetup';

registerPDFFonts();

interface CoverPageProps {
  title: string;
  subtitle?: string;
  period?: string;
  metadata?: [string, string][];
  branding?: string[];
  logoBase64?: string | null;
}

/**
 * Professional cover page with dual accent bars, centered logo, and metadata with red accent bar.
 */
export const CoverPage: React.FC<CoverPageProps> = ({
  title,
  subtitle,
  period,
  metadata = [],
  branding = ['Dashboard Ejecutivo', 'Documento Confidencial'],
  logoBase64,
}) => (
  <Page size="A4" style={{ fontFamily: 'Poppins', position: 'relative' }}>
    {/* Top accent: red + black split */}
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row' }}>
      <View style={{ flex: 3, height: 6, backgroundColor: PDF_COLORS.red }} />
      <View style={{ flex: 1, height: 6, backgroundColor: PDF_COLORS.black }} />
    </View>

    {/* Logo */}
    {logoBase64 && (
      <View style={{ alignItems: 'center', marginTop: 50 }}>
        <Image src={logoBase64} style={{ height: 80, maxWidth: 200, objectFit: 'contain' }} />
      </View>
    )}

    {/* Title block */}
    <View style={{ marginTop: logoBase64 ? 30 : 80, paddingHorizontal: 50 }}>
      <Text style={{ fontSize: 36, fontWeight: 700, color: PDF_COLORS.black, textAlign: 'center' }}>
        {title}
      </Text>
      {subtitle && (
        <Text style={{ fontSize: 24, fontWeight: 600, color: PDF_COLORS.gray, textAlign: 'center', marginTop: 4 }}>
          {subtitle}
        </Text>
      )}

      {/* Decorative line */}
      <View style={{ alignItems: 'center', marginTop: 16 }}>
        <View style={{ width: 60, height: 2, backgroundColor: PDF_COLORS.red }} />
      </View>

      {period && (
        <Text style={{ fontSize: 20, color: PDF_COLORS.red, textAlign: 'center', marginTop: 14, fontWeight: 600 }}>
          {period}
        </Text>
      )}
    </View>

    {/* Metadata box with red accent bar */}
    {metadata.length > 0 && (
      <View
        style={{
          marginHorizontal: 60,
          marginTop: 36,
          padding: 16,
          paddingLeft: 20,
          borderLeftWidth: 3,
          borderLeftColor: PDF_COLORS.red,
          backgroundColor: PDF_COLORS.backgroundSubtle,
          borderRadius: 2,
        }}
      >
        {metadata.map(([label, value], i) => (
          <View key={i} style={{ flexDirection: 'row', marginBottom: i < metadata.length - 1 ? 10 : 0 }}>
            <Text style={{ width: 150, fontSize: 9, fontWeight: 600, color: PDF_COLORS.gray }}>{label}</Text>
            <Text style={{ flex: 1, fontSize: 9, color: PDF_COLORS.black }}>{value}</Text>
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
    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row' }}>
      <View style={{ flex: 1, height: 6, backgroundColor: PDF_COLORS.black }} />
      <View style={{ flex: 3, height: 6, backgroundColor: PDF_COLORS.red }} />
    </View>
  </Page>
);
