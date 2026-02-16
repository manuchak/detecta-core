import React from 'react';
import { Page, View, Text } from '@react-pdf/renderer';
import { pdfBaseStyles } from '@/components/pdf/styles';
import { PDF_COLORS, PDF_FONT_SIZES } from '@/components/pdf/tokens';
import { ReportFooter } from '@/components/pdf/ReportFooter';
import { registerPDFFonts } from '@/components/pdf/fontSetup';
import type { HistoricalReportConfig } from '@/types/reports';

registerPDFFonts();

const MODULE_INFO: Record<string, { name: string; desc: string }> = {
  cpa: { name: 'CPA - Costo por Adquisición', desc: 'Análisis de costos de incorporación' },
  ltv: { name: 'LTV - Lifetime Value', desc: 'Valor de vida del custodio' },
  retention: { name: 'Retención', desc: 'Análisis de permanencia y cohortes' },
  engagement: { name: 'Engagement', desc: 'Frecuencia de actividad' },
  supply_growth: { name: 'Supply Growth', desc: 'Crecimiento de la red' },
  conversion: { name: 'Conversión', desc: 'Eficiencia del funnel' },
  capacity: { name: 'Capacidad Operativa', desc: 'Utilización y disponibilidad' },
  operational: { name: 'Operacional', desc: 'Servicios, GMV y rankings' },
  projections: { name: 'Proyecciones', desc: 'Forecast y precisión' },
  clients: { name: 'Análisis de Clientes', desc: 'Concentración, ranking y riesgos' },
};

interface Props {
  config: HistoricalReportConfig;
}

export const HistoricalTableOfContents: React.FC<Props> = ({ config }) => (
  <Page size="A4" style={pdfBaseStyles.page}>
    <ReportFooter />

    <Text style={{ fontSize: 20, fontWeight: 700, color: PDF_COLORS.black, marginBottom: 20 }}>
      Contenido del Informe
    </Text>

    {config.modules.map((module, i) => {
      const info = MODULE_INFO[module] ?? { name: module, desc: '' };
      return (
        <View key={module} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 }}>
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: PDF_COLORS.red,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 8,
            }}
          >
            <Text style={{ color: PDF_COLORS.white, fontSize: 10, fontWeight: 700 }}>
              {(i + 1).toString()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: 700, color: PDF_COLORS.black }}>{info.name}</Text>
            <Text style={{ fontSize: PDF_FONT_SIZES.sm, color: PDF_COLORS.gray, marginTop: 2 }}>
              {info.desc}
            </Text>
          </View>
        </View>
      );
    })}

    <View
      style={{
        marginTop: 16,
        padding: 12,
        backgroundColor: PDF_COLORS.backgroundSubtle,
        borderWidth: 0.5,
        borderColor: PDF_COLORS.border,
        borderRadius: 2,
      }}
    >
      <Text style={{ fontSize: 9, color: PDF_COLORS.gray }}>
        Este informe contiene métricas calculadas con datos del período seleccionado.
      </Text>
      <Text style={{ fontSize: 9, color: PDF_COLORS.gray, marginTop: 4 }}>
        Los valores presentados son aproximaciones basadas en la información disponible.
      </Text>
    </View>
  </Page>
);
