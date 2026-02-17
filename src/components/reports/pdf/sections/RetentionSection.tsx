import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { ReportPage } from '@/components/pdf/ReportPage';
import { SectionHeader } from '@/components/pdf/SectionHeader';
import { FieldGroup } from '@/components/pdf/FieldGroup';
import { DataTable } from '@/components/pdf/DataTable';
import { InsightBox } from '@/components/pdf/InsightBox';
import { PDFLineChart } from '@/components/pdf/charts';
import { PDF_COLORS } from '@/components/pdf/tokens';
import { formatNumber, formatPercent } from '../formatUtils';
import type { RetentionReportData } from '@/types/reports';

interface Props { data: RetentionReportData; periodLabel: string; logoBase64?: string | null }

const getCohortColor = (pct: number): string => {
  if (pct >= 80) return PDF_COLORS.success;
  if (pct >= 60) return PDF_COLORS.warning;
  if (pct > 0) return PDF_COLORS.danger;
  return 'transparent';
};

export const RetentionSection: React.FC<Props> = ({ data, periodLabel, logoBase64 }) => {
  const chartLabels = data.monthlyBreakdown.map(m => m.monthName);
  const chartSeries = [{
    name: 'Tasa Retención',
    color: PDF_COLORS.success,
    data: data.monthlyBreakdown.map(m => m.tasaRetencion),
  }];

  const validCohorts = data.cohortAnalysis.filter(c => c.month3 > 0);
  const avgM3 = validCohorts.length > 0 ? validCohorts.reduce((s, c) => s + c.month3, 0) / validCohorts.length : 0;

  return (
    <ReportPage title="Informe Histórico" subtitle={periodLabel} logoBase64={logoBase64}>
      <SectionHeader title="Retención de Custodios" />
      <Text style={{ fontSize: 9, color: PDF_COLORS.gray, marginBottom: 8, paddingHorizontal: 4 }}>{data.formula}</Text>

      <FieldGroup
        title="Resumen Anual"
        fields={[
          ['Retención Promedio', formatPercent(data.yearlyData.retentionPromedio)],
          ['Total Retenidos', formatNumber(data.yearlyData.totalCustodiosRetenidos)],
          ['Tiempo Permanencia', `${data.yearlyData.tiempoPromedioPermanenciaGeneral.toFixed(1)} meses`],
        ]}
      />

      {chartLabels.length > 0 && (
        <View style={{ marginVertical: 8 }}>
          <PDFLineChart labels={chartLabels} series={chartSeries} title="Tasa de Retención Mensual" height={170} />
        </View>
      )}

      <DataTable
        title="Detalle Mensual"
        columns={[
          { header: 'Mes', accessor: 'monthName', flex: 1.5 },
          { header: 'Anterior', accessor: (r) => formatNumber(r.custodiosAnterior), flex: 1, align: 'right' },
          { header: 'Retenidos', accessor: (r) => formatNumber(r.custodiosRetenidos), flex: 1, align: 'right' },
          { header: 'Nuevos', accessor: (r) => formatNumber(r.custodiosNuevos), flex: 1, align: 'right' },
          { header: 'Perdidos', accessor: (r) => formatNumber(r.custodiosPerdidos), flex: 1, align: 'right' },
          { header: 'Tasa', accessor: (r) => formatPercent(r.tasaRetencion), flex: 1, align: 'right' },
        ]}
        data={data.monthlyBreakdown}
      />

      <SectionHeader title="Análisis de Cohortes" />

      <View style={{ flexDirection: 'row', marginBottom: 8, gap: 12, paddingHorizontal: 4 }}>
        {[
          { color: PDF_COLORS.success, label: '≥80% Excelente' },
          { color: PDF_COLORS.warning, label: '60-79% Normal' },
          { color: PDF_COLORS.danger, label: '<60% Atención' },
        ].map((l, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <View style={{ width: 10, height: 6, backgroundColor: l.color, borderRadius: 1 }} />
            <Text style={{ fontSize: 7, color: PDF_COLORS.gray }}>{l.label}</Text>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', backgroundColor: PDF_COLORS.black, paddingVertical: 3, paddingHorizontal: 4, borderTopLeftRadius: 2, borderTopRightRadius: 2 }}>
        {['Cohorte', 'Inicio', 'M+1', 'M+2', 'M+3', 'M+4', 'M+5', 'M+6'].map((h, i) => (
          <Text key={i} style={{ flex: i === 0 ? 1.5 : 1, fontSize: 7, fontWeight: 700, color: PDF_COLORS.white }}>
            {h}
          </Text>
        ))}
      </View>

      {data.cohortAnalysis.map((cohort, ri) => {
        const pcts = [cohort.month1, cohort.month2, cohort.month3, cohort.month4, cohort.month5, cohort.month6];
        return (
          <View key={ri} style={{ flexDirection: 'row', paddingVertical: 2, paddingHorizontal: 4, borderBottomWidth: 0.5, borderBottomColor: PDF_COLORS.borderLight }}>
            <Text style={{ flex: 1.5, fontSize: 7, color: PDF_COLORS.black }}>{cohort.cohortMonth}</Text>
            <Text style={{ flex: 1, fontSize: 7, color: PDF_COLORS.black }}>{formatNumber(cohort.month0)}</Text>
            {pcts.map((pct, ci) => (
              <View key={ci} style={{ flex: 1, backgroundColor: getCohortColor(pct), borderRadius: 1, paddingVertical: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 7, color: pct > 0 ? PDF_COLORS.black : PDF_COLORS.gray }}>
                  {pct > 0 ? formatPercent(pct) : '-'}
                </Text>
              </View>
            ))}
          </View>
        );
      })}

      {avgM3 > 0 && (
        <InsightBox
          text={`Retención promedio al mes 3: ${formatPercent(avgM3)}`}
          positive={avgM3 >= 70}
        />
      )}
    </ReportPage>
  );
};
