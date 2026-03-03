import React from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import { pdfBaseStyles } from '@/components/pdf/styles';
import { PDF_COLORS, PDF_FONT_SIZES, PDF_SPACING } from '@/components/pdf/tokens';
import { ReportHeader } from '@/components/pdf/ReportHeader';
import { ReportFooter } from '@/components/pdf/ReportFooter';
import { SectionHeader } from '@/components/pdf/SectionHeader';
import { KPIRow, type KPIItem } from '@/components/pdf/KPIRow';
import { DataTable, type DataTableColumn } from '@/components/pdf/DataTable';
import { registerPDFFonts } from '@/components/pdf/fontSetup';
import type { RouteAnalysisData } from '@/hooks/security/useRouteAnalysisData';

registerPDFFonts();

// =============================================================================
// HELPERS
// =============================================================================

function getRiskLabel(drf: number): string {
  if (drf >= 75) return 'CRÍTICO';
  if (drf >= 50) return 'ALTO';
  if (drf >= 25) return 'MEDIO';
  return 'BAJO';
}

function getRiskColor(drf: number): string {
  if (drf >= 75) return PDF_COLORS.danger;
  if (drf >= 50) return PDF_COLORS.orange;
  if (drf >= 25) return PDF_COLORS.warning;
  return PDF_COLORS.success;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return iso; }
}

function getRiskBadgeColor(level: string): string {
  const l = level.toUpperCase();
  if (l === 'CRÍTICO') return PDF_COLORS.danger;
  if (l === 'ALTO') return PDF_COLORS.orange;
  if (l === 'MEDIO') return PDF_COLORS.warning;
  return PDF_COLORS.success;
}

// =============================================================================
// PDF DOCUMENT
// =============================================================================

interface RouteAnalysisReportProps {
  data: RouteAnalysisData;
  agentData?: any | null;
  logoBase64?: string | null;
}

export const RouteAnalysisReport: React.FC<RouteAnalysisReportProps> = ({ data, agentData, logoBase64 }) => {
  const riskColor = getRiskColor(data.corridorDRF);
  const agent = agentData?.agentAnalysis;
  const routeInfo = agentData?.ruta;

  // KPI items
  const kpis: KPIItem[] = [
    { label: 'DRF Corredor', value: `${data.corridorDRF}/100`, accentColor: riskColor },
    { label: 'Nivel de Riesgo', value: agent?.nivelRiesgoGeneral || getRiskLabel(data.corridorDRF), accentColor: agent ? getRiskBadgeColor(agent.nivelRiesgoGeneral) : riskColor },
    { label: 'Servicios', value: String(data.totalServices), accentColor: PDF_COLORS.info },
    { label: 'Incidentes', value: String(data.totalIncidents), accentColor: data.totalIncidents > 0 ? PDF_COLORS.orange : PDF_COLORS.success },
    { label: 'Tasa ×1k', value: String(data.incidentRate), accentColor: data.incidentRate > 20 ? PDF_COLORS.danger : PDF_COLORS.info },
    { label: 'Ctrl Efectivo', value: `${data.controlEffectiveness}%`, accentColor: data.controlEffectiveness >= 80 ? PDF_COLORS.success : PDF_COLORS.orange },
  ];

  // Incident table columns
  const incidentCols: DataTableColumn[] = [
    { header: 'Fecha', accessor: (r: any) => formatDate(r.fecha), width: 65 },
    { header: 'Tipo', accessor: 'tipo', flex: 2 },
    { header: 'Severidad', accessor: 'severidad', width: 50 },
    { header: 'Zona', accessor: 'zona', flex: 2 },
    { header: 'Atr.', accessor: (r: any) => r.atribuible ? 'Sí' : 'No', width: 30 },
    { header: 'Ctrl', accessor: (r: any) => r.controlEfectivo === true ? '✓' : r.controlEfectivo === false ? '✗' : '—', width: 28 },
  ];

  // RRSS table columns
  const rrssCols: DataTableColumn[] = [
    { header: 'Fecha', accessor: (r: any) => formatDate(r.fecha), width: 60 },
    { header: 'Tipo', accessor: 'tipo', flex: 1 },
    { header: 'Municipio', accessor: 'municipio', flex: 1 },
    { header: 'Sev.', accessor: 'severidad', width: 40 },
    { header: 'Resumen', accessor: 'resumen', flex: 3 },
  ];

  // Paradas table columns
  const paradasCols: DataTableColumn[] = [
    { header: 'Punto', accessor: 'nombre', flex: 2 },
    { header: 'Km', accessor: (r: any) => String(r.km), width: 40 },
    { header: 'Nivel', accessor: 'certificacion', width: 55 },
    { header: 'Parada', accessor: 'tiempoParada', width: 50 },
    { header: 'Razón', accessor: 'razon', flex: 3 },
  ];

  // Dead zones table columns
  const deadZoneCols: DataTableColumn[] = [
    { header: 'Zona', accessor: 'nombre', flex: 2 },
    { header: 'Km Inicio', accessor: (r: any) => String(r.kmInicio), width: 50 },
    { header: 'Km Fin', accessor: (r: any) => String(r.kmFin), width: 50 },
    { header: 'Duración', accessor: (r: any) => `${r.duracionMinutos} min`, width: 55 },
    { header: 'Protocolo', accessor: 'protocolo', flex: 3 },
  ];

  return (
    <Document>
      {/* Cover */}
      <Page size="A4" style={[pdfBaseStyles.page, { justifyContent: 'center', alignItems: 'center' }]}>
        <View style={pdfBaseStyles.coverAccentTop} fixed />
        <View style={pdfBaseStyles.coverAccentBottom} fixed />
        <Text style={pdfBaseStyles.coverTitle}>Análisis de Ruta</Text>
        <Text style={[pdfBaseStyles.coverSubtitle, { marginTop: PDF_SPACING.lg }]}>
          {data.origen}
        </Text>
        <Text style={{ fontSize: PDF_FONT_SIZES.xl, color: PDF_COLORS.gray, marginVertical: PDF_SPACING.md }}>→</Text>
        <Text style={pdfBaseStyles.coverSubtitle}>{data.destino}</Text>

        {/* Route info from agent */}
        {routeInfo && (
          <View style={{ marginTop: PDF_SPACING.lg, flexDirection: 'row', gap: 20 }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: PDF_FONT_SIZES.xs, color: PDF_COLORS.gray }}>Distancia</Text>
              <Text style={{ fontSize: PDF_FONT_SIZES.lg, fontWeight: 700 }}>{routeInfo.distanciaKm} km</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: PDF_FONT_SIZES.xs, color: PDF_COLORS.gray }}>ETA</Text>
              <Text style={{ fontSize: PDF_FONT_SIZES.lg, fontWeight: 700 }}>{agent?.etaEstimado || `${routeInfo.duracionHoras}h`}</Text>
            </View>
            {agent?.horaSalidaSugerida && (
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: PDF_FONT_SIZES.xs, color: PDF_COLORS.gray }}>Salida Sugerida</Text>
                <Text style={{ fontSize: PDF_FONT_SIZES.lg, fontWeight: 700 }}>{agent.horaSalidaSugerida}</Text>
              </View>
            )}
          </View>
        )}

        <View style={{
          marginTop: PDF_SPACING.xxl,
          paddingHorizontal: 20,
          paddingVertical: 10,
          borderRadius: 4,
          backgroundColor: agent ? getRiskBadgeColor(agent.nivelRiesgoGeneral) : riskColor,
        }}>
          <Text style={{ color: PDF_COLORS.white, fontSize: PDF_FONT_SIZES.xl, fontWeight: 700, textAlign: 'center' }}>
            DRF: {data.corridorDRF} — {agent?.nivelRiesgoGeneral || getRiskLabel(data.corridorDRF)}
          </Text>
        </View>
        {agent?.requiereEscolta && (
          <View style={{ marginTop: PDF_SPACING.md, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 4, backgroundColor: PDF_COLORS.danger }}>
            <Text style={{ color: PDF_COLORS.white, fontSize: PDF_FONT_SIZES.sm, fontWeight: 700, textAlign: 'center' }}>
              ⚠ SE REQUIERE ESCOLTA
            </Text>
          </View>
        )}
        <Text style={[pdfBaseStyles.coverMeta, { marginTop: PDF_SPACING.xxl }]}>
          Generado: {formatDate(data.generatedAt)}
        </Text>
        <Text style={pdfBaseStyles.coverBranding}>Detecta · Módulo de Seguridad · ISO 28000</Text>
      </Page>

      {/* Page 1: Executive Summary + KPIs */}
      <Page size="A4" style={pdfBaseStyles.page} wrap>
        <ReportHeader title="Análisis de Ruta" subtitle={`${data.origen} → ${data.destino}`} logoBase64={logoBase64} />
        <ReportFooter />

        <SectionHeader title="1. Resumen Ejecutivo" />
        <KPIRow items={kpis} />

        <View style={{ paddingHorizontal: PDF_SPACING.sm, marginBottom: PDF_SPACING.lg }}>
          <Text style={pdfBaseStyles.paragraph}>
            Este informe analiza el corredor {data.origen} → {data.destino} con base en {data.totalServices} servicios
            realizados ({data.servicesPeriod}). Se registraron {data.totalIncidents} incidentes operativos,
            de los cuales {data.criticalIncidents} fueron de severidad alta o crítica.
            La tasa de incidentes es de {data.incidentRate} por cada 1,000 servicios.
          </Text>
          {agent?.justificacionHorario && (
            <Text style={pdfBaseStyles.paragraph}>
              <Text style={{ fontWeight: 700 }}>Hora de salida sugerida: {agent.horaSalidaSugerida}. </Text>
              {agent.justificacionHorario}
            </Text>
          )}
          <Text style={pdfBaseStyles.paragraph}>
            La cobertura de controles activos alcanza el {data.controlCoverage}%, con una efectividad del {data.controlEffectiveness}%.
            El Factor de Riesgo Detecta (DRF) para este corredor es de {data.corridorDRF}/100, clasificado como {agent?.nivelRiesgoGeneral || getRiskLabel(data.corridorDRF)}.
          </Text>
        </View>

        {/* Zone distribution */}
        <SectionHeader title="2. Distribución de Zonas de Riesgo" />
        <View style={{ flexDirection: 'row', gap: PDF_SPACING.md, paddingHorizontal: PDF_SPACING.sm, marginBottom: PDF_SPACING.lg }}>
          {[
            { label: 'Extremo', count: data.zonesExtremo, color: PDF_COLORS.danger },
            { label: 'Alto', count: data.zonesAlto, color: PDF_COLORS.orange },
            { label: 'Medio', count: data.zonesMedio, color: PDF_COLORS.warning },
            { label: 'Bajo', count: data.zonesBajo, color: PDF_COLORS.success },
          ].map(z => (
            <View key={z.label} style={{ flex: 1, borderLeftWidth: 3, borderLeftColor: z.color, padding: PDF_SPACING.sm, backgroundColor: PDF_COLORS.backgroundSubtle, borderRadius: 2 }}>
              <Text style={{ fontSize: PDF_FONT_SIZES.xs, color: PDF_COLORS.gray }}>{z.label}</Text>
              <Text style={{ fontSize: PDF_FONT_SIZES.xl, fontWeight: 700, color: PDF_COLORS.black }}>{z.count}</Text>
            </View>
          ))}
        </View>

        {/* Safe points */}
        <View style={{ flexDirection: 'row', gap: PDF_SPACING.md, paddingHorizontal: PDF_SPACING.sm, marginBottom: PDF_SPACING.lg }}>
          <View style={{ flex: 1, padding: PDF_SPACING.sm, backgroundColor: PDF_COLORS.backgroundSubtle, borderRadius: 2, borderLeftWidth: 3, borderLeftColor: PDF_COLORS.info }}>
            <Text style={{ fontSize: PDF_FONT_SIZES.xs, color: PDF_COLORS.gray }}>Puntos Seguros</Text>
            <Text style={{ fontSize: PDF_FONT_SIZES.xl, fontWeight: 700 }}>{data.safePointsCount}</Text>
          </View>
          <View style={{ flex: 1, padding: PDF_SPACING.sm, backgroundColor: PDF_COLORS.backgroundSubtle, borderRadius: 2, borderLeftWidth: 3, borderLeftColor: PDF_COLORS.success }}>
            <Text style={{ fontSize: PDF_FONT_SIZES.xs, color: PDF_COLORS.gray }}>Verificados</Text>
            <Text style={{ fontSize: PDF_FONT_SIZES.xl, fontWeight: 700 }}>{data.safePointsVerified}</Text>
          </View>
        </View>
      </Page>

      {/* Page 2: AI Agent - Paradas Recomendadas + Zonas sin Señal */}
      {agent && (
        <Page size="A4" style={pdfBaseStyles.page} wrap>
          <ReportHeader title="Análisis de Ruta" subtitle="Inteligencia de Ruta AI" logoBase64={logoBase64} />
          <ReportFooter />

          {agent.paradasRecomendadas?.length > 0 && (
            <>
              <SectionHeader title="3. Paradas Seguras Recomendadas" />
              <DataTable columns={paradasCols} data={agent.paradasRecomendadas} />
            </>
          )}

          {agent.zonasSinSenal?.length > 0 && (
            <>
              <SectionHeader title="4. Zonas sin Cobertura Celular" />
              <DataTable columns={deadZoneCols} data={agent.zonasSinSenal} />
            </>
          )}

          {agent.protocoloNocturno && (
            <>
              <SectionHeader title="5. Protocolo Nocturno" />
              <View style={{ paddingHorizontal: PDF_SPACING.sm, marginBottom: PDF_SPACING.lg, padding: PDF_SPACING.md, backgroundColor: PDF_COLORS.backgroundSubtle, borderRadius: 4, borderLeftWidth: 3, borderLeftColor: PDF_COLORS.warning }}>
                <Text style={[pdfBaseStyles.paragraph, { marginBottom: 0 }]}>{agent.protocoloNocturno}</Text>
              </View>
            </>
          )}
        </Page>
      )}

      {/* Page 3: Incident Table */}
      <Page size="A4" style={pdfBaseStyles.page} wrap>
        <ReportHeader title="Análisis de Ruta" subtitle="Historial de Incidentes" logoBase64={logoBase64} />
        <ReportFooter />

        <SectionHeader title={agent ? '6. Historial de Incidentes Operativos' : '3. Historial de Incidentes Operativos'} />
        <DataTable columns={incidentCols} data={data.recentIncidents} />

        {data.incidentsByType.length > 0 && (
          <>
            <SectionHeader title={agent ? '7. Incidentes por Tipo' : '4. Incidentes por Tipo'} />
            <View style={{ paddingHorizontal: PDF_SPACING.sm, marginBottom: PDF_SPACING.lg }}>
              {data.incidentsByType.slice(0, 8).map(t => (
                <View key={t.tipo} style={{ flexDirection: 'row', marginBottom: 3, alignItems: 'center' }}>
                  <Text style={{ fontSize: PDF_FONT_SIZES.sm, color: PDF_COLORS.black, width: 120 }}>{t.tipo}</Text>
                  <View style={{ flex: 1, height: 6, backgroundColor: PDF_COLORS.border, borderRadius: 3 }}>
                    <View style={{
                      height: 6, borderRadius: 3,
                      backgroundColor: t.count > 3 ? PDF_COLORS.danger : t.count > 1 ? PDF_COLORS.orange : PDF_COLORS.info,
                      width: `${Math.min((t.count / Math.max(...data.incidentsByType.map(x => x.count))) * 100, 100)}%`,
                    }} />
                  </View>
                  <Text style={{ fontSize: PDF_FONT_SIZES.sm, fontWeight: 700, width: 30, textAlign: 'right' }}>{t.count}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </Page>

      {/* Page 4: RRSS Intelligence + Recommendations + Briefing */}
      <Page size="A4" style={pdfBaseStyles.page} wrap>
        <ReportHeader title="Análisis de Ruta" subtitle="Inteligencia y Recomendaciones" logoBase64={logoBase64} />
        <ReportFooter />

        <SectionHeader title={agent ? '8. Inteligencia RRSS (últimos 90 días)' : '5. Inteligencia RRSS (últimos 90 días)'} />
        {data.rrssIncidents.length > 0 ? (
          <DataTable columns={rrssCols} data={data.rrssIncidents} />
        ) : (
          <Text style={[pdfBaseStyles.paragraph, { color: PDF_COLORS.gray }]}>
            No se encontraron incidentes en redes sociales para este corredor en los últimos 90 días.
          </Text>
        )}

        <SectionHeader title={agent ? '9. Recomendaciones ISO 28000' : '6. Recomendaciones ISO 28000'} />
        <View style={{ paddingHorizontal: PDF_SPACING.sm, marginBottom: PDF_SPACING.lg }}>
          {/* Agent recommendations take priority, fallback to basic ones */}
          {(agent?.recomendacionesISO28000 || data.recommendations).map((rec: string, i: number) => (
            <View key={i} style={{ flexDirection: 'row', marginBottom: 6, alignItems: 'flex-start' }}>
              <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: agent ? getRiskBadgeColor(agent.nivelRiesgoGeneral) : riskColor, marginRight: 6, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: PDF_COLORS.white, fontSize: 8, fontWeight: 700 }}>{i + 1}</Text>
              </View>
              <Text style={[pdfBaseStyles.paragraph, { flex: 1, marginBottom: 0 }]}>{rec}</Text>
            </View>
          ))}
        </View>

        {/* Briefing Operativo (AI agent only) */}
        {agent?.briefingOperativo && (
          <>
            <SectionHeader title="10. Briefing Operativo" />
            <View style={{ paddingHorizontal: PDF_SPACING.sm, marginBottom: PDF_SPACING.lg, padding: PDF_SPACING.md, backgroundColor: PDF_COLORS.backgroundSubtle, borderRadius: 4, borderLeftWidth: 4, borderLeftColor: PDF_COLORS.info }}>
              <Text style={[pdfBaseStyles.paragraph, { marginBottom: 0, lineHeight: 1.5 }]}>{agent.briefingOperativo}</Text>
            </View>
          </>
        )}

        {/* Disclaimer */}
        <View style={{ marginTop: 'auto', borderTopWidth: 0.5, borderTopColor: PDF_COLORS.border, paddingTop: PDF_SPACING.md }}>
          <Text style={{ fontSize: PDF_FONT_SIZES.xs, color: PDF_COLORS.grayMuted, lineHeight: 1.4 }}>
            Este informe fue generado automáticamente por el Módulo de Seguridad de Detecta{agent ? ' con análisis asistido por inteligencia artificial' : ''}.
            La información es de carácter confidencial y está sujeta a las políticas de
            seguridad de la información de la organización. Clasificación: USO INTERNO. ISO 28000 · ISO 31000.
          </Text>
        </View>
      </Page>
    </Document>
  );
};
