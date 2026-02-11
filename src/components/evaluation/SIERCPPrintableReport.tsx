import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  AlertTriangle, 
  Shield, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  Target,
  FileText,
  User,
  Calendar,
  Lightbulb,
  Eye
} from 'lucide-react';
import type { SIERCPReport } from '@/hooks/useSIERCPReport';
import { SIERCPScoreGauge } from './SIERCPScoreGauge';
import { SIERCPDecisionBadge } from './SIERCPDecisionBadge';
import { SIERCPRadarProfile } from './SIERCPRadarProfile';

interface SIERCPPrintableReportProps {
  report: SIERCPReport;
  candidateName?: string;
}

const getScoreLevel = (score: number) => {
  if (score >= 80) return { label: 'Alto', color: 'text-green-700 bg-green-50' };
  if (score >= 60) return { label: 'Medio', color: 'text-yellow-700 bg-yellow-50' };
  if (score >= 40) return { label: 'Bajo', color: 'text-orange-700 bg-orange-50' };
  return { label: 'Crítico', color: 'text-red-700 bg-red-50' };
};

const moduleShortNames: Record<string, string> = {
  'Integridad Moral': 'Integridad',
  'Indicadores de Psicopatía': 'Psicopatía',
  'Tendencia a la Violencia': 'Violencia',
  'Control de Impulsos': 'Impulsos',
  'Afrontamiento al Estrés': 'Estrés',
  'Escala de Veracidad': 'Veracidad',
  'Entrevista Estructurada': 'Entrevista',
};

export const SIERCPPrintableReport: React.FC<SIERCPPrintableReportProps> = ({ 
  report, 
  candidateName 
}) => {
  const formattedDate = report.metadata?.fecha_generacion 
    ? format(new Date(report.metadata.fecha_generacion), "d 'de' MMMM 'de' yyyy", { locale: es })
    : format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es });

  const radarModules = report.analisis_modulos?.map((m) => ({
    modulo: m.modulo,
    shortName: moduleShortNames[m.modulo] || m.modulo,
    score: m.score,
  })) || [];

  const reportId = `SIERCP-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  // Format date for filename suggestion (used by parent)
  const filenameDate = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="siercp-report bg-white max-w-4xl mx-auto" id="siercp-detailed-report">
      {/* ============================================= */}
      {/* COVER / HERO SECTION (Page 1)                */}
      {/* ============================================= */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8 rounded-t-xl print-section-hero print-avoid-break">
        {/* Header bar */}
        <div className="flex justify-between items-center mb-6 pb-3 border-b border-white/20">
          <div>
            <h1 className="text-xl font-bold tracking-tight">DETECTA</h1>
            <p className="text-xs text-white/60">Sistema de Evaluación de Confiabilidad</p>
          </div>
          <div className="text-right text-xs text-white/60">
            <p>Informe SIERCP</p>
            <p className="font-mono">{reportId}</p>
          </div>
        </div>

        {/* Hero Score - Centered */}
        <div className="flex items-center justify-center gap-10 py-6">
          <div className="bg-white rounded-2xl p-5 shadow-2xl">
            <SIERCPScoreGauge 
              score={report.metadata?.score_global || 0} 
              size="xl" 
            />
          </div>
          
          <div className="text-center">
            <p className="text-xs uppercase tracking-widest text-white/60 mb-1">
              Aptitud para Custodio
            </p>
            <p className="text-3xl font-bold mb-1">
              {report.fit_custodio?.nivel || 'Pendiente'}
            </p>
            <p className="text-sm text-white/70">
              {report.fit_custodio?.porcentaje_confianza || 0}% de confianza
            </p>
          </div>
        </div>

        {/* Candidate Info - Compact Grid */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-white/20 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-white/50" />
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wide">Candidato</p>
              <p className="font-semibold text-sm">{candidateName || report.metadata?.candidato || 'No especificado'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-white/50" />
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wide">Fecha</p>
              <p className="font-semibold text-sm">{formattedDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-white/50" />
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wide">Posición</p>
              <p className="font-semibold text-sm">Custodio de Mercancía</p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================= */}
      {/* MAIN CONTENT                                 */}
      {/* ============================================= */}
      <div className="p-6 space-y-6">
        
        {/* Radar + Executive Summary - Print optimized */}
        <div className="grid grid-cols-5 gap-4 print-avoid-break">
          {/* Radar Chart - Fixed size for print */}
          <div className="col-span-2 border border-gray-200 rounded-xl p-3 bg-gray-50/50 print-avoid-break">
            <h2 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              Perfil Multidimensional
            </h2>
            <div className="flex justify-center">
              <SIERCPRadarProfile modules={radarModules} size="md" forPrint={true} />
            </div>
          </div>
          
          {/* Executive Summary */}
          <div className="col-span-3 border border-gray-200 rounded-xl p-4 bg-white">
            <h2 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Resumen Ejecutivo
            </h2>
            <p className="text-gray-700 leading-relaxed text-sm">
              {report.resumen_ejecutivo}
            </p>
            
            {/* Justification */}
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-xs font-medium text-blue-800 mb-1">Justificación de Aptitud</p>
              <p className="text-sm text-blue-900">
                {report.fit_custodio?.justificacion}
              </p>
            </div>
          </div>
        </div>

        {/* Module Cards Grid - Page 2 */}
        <div className="print-section-analysis print-avoid-break">
          <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-600" />
            Análisis por Módulo
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {report.analisis_modulos?.map((modulo, index) => {
              const level = getScoreLevel(modulo.score);
              return (
                <div 
                  key={index} 
                  className="border border-gray-200 rounded-lg p-3 bg-white print-avoid-break"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-xs font-semibold text-gray-800 leading-tight">
                        {moduleShortNames[modulo.modulo] || modulo.modulo}
                      </h3>
                      <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${level.color}`}>
                        {level.label}
                      </span>
                    </div>
                    <SIERCPScoreGauge score={modulo.score} size="sm" />
                  </div>
                  
                  <div className="space-y-1 text-xs">
                    <div>
                      <p className="text-gray-500 font-medium uppercase tracking-wide text-[10px]">Interpretación</p>
                      <p className="text-gray-700 leading-snug text-[11px]">{modulo.interpretacion}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium uppercase tracking-wide text-[10px]">Implicación</p>
                      <p className="text-gray-700 leading-snug text-[11px]">{modulo.implicacion_custodio}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Risk & Protection Factors */}
        <div className="grid grid-cols-2 gap-6 print-avoid-break">
          {/* Risk Factors */}
          <div className="border-2 border-red-200 rounded-xl p-5 bg-gradient-to-br from-red-50 to-white print-avoid-break">
            <h3 className="font-bold text-red-800 flex items-center gap-2 mb-4 text-base">
              <AlertTriangle className="h-5 w-5" />
              Factores de Riesgo
            </h3>
            <ul className="space-y-3">
              {report.factores_riesgo?.length > 0 ? (
                report.factores_riesgo.map((factor, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm">
                    <XCircle className="h-4 w-4 mt-0.5 text-red-500 flex-shrink-0" />
                    <span className="text-red-900">{factor}</span>
                  </li>
                ))
              ) : (
                <li className="text-sm text-red-600 italic flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  No se identificaron factores de riesgo significativos
                </li>
              )}
            </ul>
          </div>

          {/* Protection Factors */}
          <div className="border-2 border-green-200 rounded-xl p-5 bg-gradient-to-br from-green-50 to-white">
            <h3 className="font-bold text-green-800 flex items-center gap-2 mb-4 text-base">
              <Shield className="h-5 w-5" />
              Factores de Protección
            </h3>
            <ul className="space-y-3">
              {report.factores_proteccion?.length > 0 ? (
                report.factores_proteccion.map((factor, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                    <span className="text-green-900">{factor}</span>
                  </li>
                ))
              ) : (
                <li className="text-sm text-green-600 italic">
                  No se identificaron factores de protección adicionales
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Recommendations */}
        <div className="border border-blue-200 rounded-xl p-5 bg-gradient-to-br from-blue-50/50 to-white print-avoid-break">
          <h3 className="font-bold text-blue-800 flex items-center gap-2 mb-4 text-base">
            <Lightbulb className="h-5 w-5" />
            Recomendaciones
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {report.recomendaciones?.map((rec, index) => (
              <div 
                key={index} 
                className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-100"
              >
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </span>
                <span className="text-sm text-blue-900">{rec}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Follow-up Areas */}
        {report.areas_seguimiento?.length > 0 && (
          <div className="border border-amber-200 rounded-xl p-5 bg-gradient-to-br from-amber-50/50 to-white">
            <h3 className="font-bold text-amber-800 flex items-center gap-2 mb-4 text-base">
              <Target className="h-5 w-5" />
              Áreas de Seguimiento Post-Contratación
            </h3>
            <ul className="grid grid-cols-2 gap-2">
              {report.areas_seguimiento.map((area, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-amber-900 p-2 bg-white rounded-lg border border-amber-100">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0" />
                  <span>{area}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ============================================= */}
        {/* CONCLUSION & DECISION SEAL (Page 3)          */}
        {/* ============================================= */}
        <div className="border-2 border-gray-300 rounded-xl p-5 bg-gradient-to-br from-slate-50 to-white print-section-conclusion print-avoid-break">
          <h3 className="font-bold text-gray-800 mb-3 text-base">Conclusión Profesional</h3>
          <p className="text-gray-700 leading-relaxed mb-4 text-sm">
            {report.conclusion_profesional}
          </p>
          
          {/* Decision Badge Centered */}
          <div className="flex justify-center pt-3 border-t border-gray-200">
            <SIERCPDecisionBadge 
              nivel={report.fit_custodio?.nivel || 'Media'} 
              size="lg" 
            />
          </div>
        </div>

        {/* ============================================= */}
        {/* FOOTER / DISCLAIMER                          */}
        {/* ============================================= */}
        <div className="text-xs text-gray-500 border-t-2 border-gray-200 pt-4 mt-6">
          <p className="font-semibold text-gray-600 mb-1 text-[11px]">AVISO LEGAL</p>
          <p className="leading-relaxed text-[10px]">
            Este informe es generado con asistencia de inteligencia artificial y debe ser interpretado 
            por profesionales calificados en psicología o recursos humanos. Los resultados son orientativos 
            y no sustituyen una evaluación clínica completa. La decisión final de contratación debe 
            considerar múltiples factores adicionales incluyendo entrevistas, verificación de antecedentes 
            y referencias laborales.
          </p>
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 text-[10px]">
            <span>Generado por: {report.metadata?.generado_por || 'SIERCP AI'} v2.0</span>
            <span className="font-semibold">DETECTA © {new Date().getFullYear()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SIERCPPrintableReport;
