import React from 'react';
import { Page, View, Text } from '@react-pdf/renderer';
import { pdfBaseStyles } from '@/components/pdf/styles';
import { PDF_COLORS, PDF_FONT_SIZES } from '@/components/pdf/tokens';
import { ReportHeader } from '@/components/pdf/ReportHeader';
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
  logoBase64?: string | null;
}

export const HistoricalTableOfContents: React.FC<Props> = ({ config, logoBase64 }) => (
  <Page size="A4" style={pdfBaseStyles.page}>
    <ReportHeader title="Informe Histórico" logoBase64={logoBase64} />
    <ReportFooter />

    <Text style={{ fontSize: 20, fontWeight: 700, color: PDF_COLORS.black, marginBottom: 20, marginTop: 10 }}>
      Contenido del Informe
    </Text>

    {config.modules.map((module, i) => {
      const info = MODULE_INFO[module] ?? { name: module, desc: '' };
      return (
        <View key={module}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6, paddingVertical: 8 }}>
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: PDF_COLORS.red,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
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
          {/* Divider line between items */}
          {i < config.modules.length - 1 && (
            <View style={{ height: 0.5, backgroundColor: PDF_COLORS.borderLight, marginLeft: 32, marginBottom: 2 }} />
          )}
        </View>
      );
    })}

    <View
      style={{
        marginTop: 16,
        padding: 12,
        paddingLeft: 16,
        backgroundColor: PDF_COLORS.backgroundSubtle,
        borderLeftWidth: 3,
        borderLeftColor: PDF_COLORS.red,
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
