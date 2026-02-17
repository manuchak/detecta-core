import React from 'react';
import { View, Text, Image } from '@react-pdf/renderer';
import { PDF_COLORS, PDF_PAGE_CONFIG } from './tokens';

interface ReportHeaderProps {
  title: string;
  subtitle?: string;
  logoBase64?: string | null;
}

/**
 * Flow-based fixed header that reserves real space on every page.
 * Height = 42pt bar + 2pt red line + 8pt spacing = 52pt total.
 */
export const ReportHeader: React.FC<ReportHeaderProps> = ({ title, subtitle, logoBase64 }) => (
  <View
    fixed
    style={{
      height: 52,
      marginBottom: 4,
      marginHorizontal: -PDF_PAGE_CONFIG.paddingHorizontal,
      marginTop: -PDF_PAGE_CONFIG.paddingTop,
    }}
  >
    {/* Gray bar */}
    <View
      style={{
        height: PDF_PAGE_CONFIG.headerHeight,
        backgroundColor: PDF_COLORS.surface,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: PDF_PAGE_CONFIG.paddingHorizontal,
      }}
    >
      {logoBase64 && (
        <Image
          src={logoBase64}
          style={{ height: 28, maxWidth: 80, objectFit: 'contain', marginRight: 10 }}
        />
      )}
      <Text style={{ color: PDF_COLORS.black, fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>
        {title}
      </Text>
      {subtitle && (
        <Text style={{ color: PDF_COLORS.gray, fontSize: 8, marginLeft: 'auto' }}>
          {subtitle}
        </Text>
      )}
    </View>
    {/* Red accent line */}
    <View style={{ height: 2, backgroundColor: PDF_COLORS.red }} />
  </View>
);
