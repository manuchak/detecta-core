import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { pdfBaseStyles } from './styles';
import { PDF_COLORS } from './tokens';

export interface KPIItem {
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
}

interface KPIRowProps {
  items: KPIItem[];
}

/**
 * Horizontal row of KPI cards with optional trend indicator.
 */
export const KPIRow: React.FC<KPIRowProps> = ({ items }) => (
  <View style={pdfBaseStyles.kpiRow}>
    {items.map((kpi, i) => (
      <View key={i} style={pdfBaseStyles.kpiCard}>
        <Text style={pdfBaseStyles.kpiLabel}>{kpi.label}</Text>
        <Text style={pdfBaseStyles.kpiValue}>{kpi.value}</Text>
        {kpi.trend && (
          <Text
            style={[
              pdfBaseStyles.kpiTrend,
              { color: kpi.trendUp ? PDF_COLORS.success : PDF_COLORS.danger },
            ]}
          >
            {kpi.trend}
          </Text>
        )}
      </View>
    ))}
  </View>
);
